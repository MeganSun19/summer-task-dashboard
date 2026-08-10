#!/usr/bin/env python3
"""Generate the long-term course plan catalog from the Excel master workbook."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET
from zipfile import ZipFile

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = PROJECT_ROOT.parent / "outputs" / "course-master-foundation-20260807" / "家庭长期课程总表.xlsx"
DEFAULT_OUTPUT = PROJECT_ROOT / "curriculum" / "course-plan-catalog.json"
DEFAULT_JS_OUTPUT = PROJECT_ROOT / "curriculum" / "course-plan-catalog.js"
DEFAULT_HEART_OUTPUT = PROJECT_ROOT / "curriculum" / "heart-word-plan.json"
MODULE_CATALOG = PROJECT_ROOT / "curriculum" / "learning-module-catalog.json"
NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"rel": "http://schemas.openxmlformats.org/package/2006/relationships"}
OFFICE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
ID_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9-]*$")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class CatalogError(ValueError):
    pass


def fail(message: str) -> None:
    raise CatalogError(f"课程总表无效：{message}")


def column_index(reference: str) -> int:
    letters = "".join(character for character in reference if character.isalpha())
    result = 0
    for character in letters:
        result = result * 26 + ord(character.upper()) - 64
    return result - 1


def shared_strings(archive: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return ["".join(node.text or "" for node in item.findall(".//main:t", NS)) for item in root.findall("main:si", NS)]


def sheet_targets(archive: ZipFile) -> dict[str, str]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    target_by_id = {item.attrib["Id"]: item.attrib["Target"] for item in relationships.findall("rel:Relationship", REL_NS)}
    result = {}
    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        relationship_id = sheet.attrib[f"{{{OFFICE_REL}}}id"]
        target = target_by_id[relationship_id].lstrip("/")
        result[sheet.attrib["name"]] = target if target.startswith("xl/") else f"xl/{target}"
    return result


def read_cell(cell: ET.Element, strings: list[str]) -> Any:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(".//main:t", NS))
    value_node = cell.find("main:v", NS)
    if value_node is None:
        return ""
    raw = value_node.text or ""
    if cell_type == "s":
        return strings[int(raw)]
    if cell_type == "b":
        return raw == "1"
    if cell_type in {"str", "e"}:
        return raw
    try:
        number = float(raw)
        return int(number) if number.is_integer() else number
    except ValueError:
        return raw


def read_sheet(archive: ZipFile, target: str, strings: list[str]) -> list[list[Any]]:
    root = ET.fromstring(archive.read(target))
    rows: list[list[Any]] = []
    for row in root.findall("main:sheetData/main:row", NS):
        values: list[Any] = []
        for cell in row.findall("main:c", NS):
            index = column_index(cell.attrib["r"])
            if len(values) <= index:
                values.extend([""] * (index + 1 - len(values)))
            values[index] = read_cell(cell, strings)
        rows.append(values)
    return rows


def table_records(rows: list[list[Any]], required_headers: list[str], sheet_name: str) -> list[dict[str, Any]]:
    header_index = next((index for index, row in enumerate(rows) if all(header in row for header in required_headers)), None)
    if header_index is None:
        fail(f"工作表“{sheet_name}”缺少表头：{', '.join(required_headers)}")
    headers = [str(value).strip() for value in rows[header_index]]
    records = []
    for row_number, row in enumerate(rows[header_index + 1 :], start=header_index + 2):
        padded = row + [""] * (len(headers) - len(row))
        record = {headers[index]: padded[index] for index in range(len(headers)) if headers[index]}
        if any(str(value).strip() for value in record.values()):
            record["_row"] = row_number
            records.append(record)
    return records


def excel_date(value: Any, path: str) -> str:
    if isinstance(value, (int, float)):
        return (datetime(1899, 12, 30) + timedelta(days=float(value))).strftime("%Y-%m-%d")
    text = str(value or "").strip()
    if not DATE_PATTERN.fullmatch(text):
        fail(f"{path} 必须是 Excel 日期")
    try:
        datetime.strptime(text, "%Y-%m-%d")
    except ValueError:
        fail(f"{path} 不是有效日期：{text}")
    return text


def positive_integer(value: Any, path: str) -> int:
    if isinstance(value, bool):
        fail(f"{path} 必须是正整数")
    try:
        number = int(value)
    except (TypeError, ValueError):
        fail(f"{path} 必须是正整数")
    if number <= 0 or str(value).strip() not in {str(number), f"{number}.0"}:
        fail(f"{path} 必须是正整数")
    return number


def enabled_value(value: Any, path: str) -> bool:
    if value in {True, 1, "1", "是", "yes", "YES", "true", "TRUE"}:
        return True
    if value in {False, 0, "0", "否", "no", "NO", "false", "FALSE"}:
        return False
    fail(f"{path} 必须是“是”或“否”")


def kid_ids(value: Any, path: str) -> list[str]:
    text = str(value or "").strip()
    if text == "both":
        return ["brother", "younger"]
    values = [item.strip() for item in re.split(r"[,，、]", text) if item.strip()]
    if not values or any(item not in {"brother", "younger"} for item in values):
        fail(f"{path} 必须是 brother、younger 或 both")
    return sorted(set(values), key=["brother", "younger"].index)


def normalize_stage(record: dict[str, Any]) -> dict[str, Any]:
    row = record.get("_row", "?")
    stage_id = str(record.get("stageId", record.get("阶段ID", ""))).strip()
    title = str(record.get("title", record.get("课程名称", ""))).strip()
    goal = str(record.get("goal", record.get("阶段目标", ""))).strip()
    mode = str(record.get("scheduleMode", record.get("排期方式", ""))).strip()
    status = str(record.get("status", record.get("状态", ""))).strip()
    if not ID_PATTERN.fullmatch(stage_id):
        fail(f"课程阶段第 {row} 行的阶段ID格式无效：{stage_id}")
    if not title or not goal:
        fail(f"课程阶段第 {row} 行必须填写课程名称和阶段目标")
    if mode not in {"relative", "absolute"}:
        fail(f"课程阶段第 {row} 行的排期方式必须是 relative 或 absolute")
    if status not in {"draft", "ready", "archived"}:
        fail(f"课程阶段第 {row} 行的状态必须是 draft、ready 或 archived")
    start_raw = record.get("start", record.get("开始", ""))
    end_raw = record.get("end", record.get("结束", ""))
    if mode == "relative":
        start = positive_integer(start_raw, f"课程阶段第 {row} 行开始")
        end = positive_integer(end_raw, f"课程阶段第 {row} 行结束")
    else:
        start = excel_date(start_raw, f"课程阶段第 {row} 行开始")
        end = excel_date(end_raw, f"课程阶段第 {row} 行结束")
    if end < start:
        fail(f"课程阶段第 {row} 行的结束不能早于开始")
    return {
        "id": stage_id,
        "title": title,
        "kidIds": kid_ids(record.get("kidIds", record.get("适用孩子", "")), f"课程阶段第 {row} 行适用孩子"),
        "goal": goal,
        "schedule": {"mode": mode, "start": start, "end": end},
        "status": status,
        "modules": [],
    }


def normalize_module(record: dict[str, Any], stage: dict[str, Any], module_definitions: dict[str, dict[str, Any]]) -> dict[str, Any]:
    row = record.get("_row", "?")
    module_id = str(record.get("moduleId", record.get("模块ID", ""))).strip()
    if module_id not in module_definitions:
        fail(f"课程模块第 {row} 行引用了不存在的模块：{module_id}")
    if module_definitions[module_id].get("scheduledOnly"):
        fail(f"课程模块第 {row} 行不能把临时任务模块加入长期课程：{module_id}")
    mode = stage["schedule"]["mode"]
    start_raw = record.get("start", record.get("开始", ""))
    end_raw = record.get("end", record.get("结束", ""))
    if mode == "relative":
        start = positive_integer(start_raw, f"课程模块第 {row} 行开始")
        end = positive_integer(end_raw, f"课程模块第 {row} 行结束")
    else:
        start = excel_date(start_raw, f"课程模块第 {row} 行开始")
        end = excel_date(end_raw, f"课程模块第 {row} 行结束")
    if end < start or start < stage["schedule"]["start"] or end > stage["schedule"]["end"]:
        fail(f"课程模块第 {row} 行的范围必须落在阶段 {stage['id']} 内")
    result: dict[str, Any] = {
        "moduleId": module_id,
        "enabled": enabled_value(record.get("enabled", record.get("启用", "")), f"课程模块第 {row} 行启用"),
        "schedule": {"start": start, "end": end},
    }
    optional_fields = [
        ("title", "名称覆盖"),
        ("instruction", "执行步骤覆盖"),
        ("contentSource", "内容数据源"),
    ]
    for output_key, sheet_key in optional_fields:
        value = str(record.get(output_key, record.get(sheet_key, "")) or "").strip()
        if value:
            result[output_key] = value
    return result


def ranges_overlap(left: dict[str, Any], right: dict[str, Any]) -> bool:
    return left["start"] <= right["end"] and right["start"] <= left["end"]


def build_catalog(stage_records: list[dict[str, Any]], module_records: list[dict[str, Any]], source: dict[str, Any]) -> dict[str, Any]:
    module_catalog = json.loads(MODULE_CATALOG.read_text(encoding="utf-8"))
    module_definitions = {item["id"]: item for item in module_catalog["modules"]}
    stages = [normalize_stage(record) for record in stage_records]
    stage_by_id: dict[str, dict[str, Any]] = {}
    for stage in stages:
        if stage["id"] in stage_by_id:
            fail(f"阶段ID重复：{stage['id']}")
        stage_by_id[stage["id"]] = stage

    for record in module_records:
        row = record.get("_row", "?")
        stage_id = str(record.get("stageId", record.get("阶段ID", ""))).strip()
        if stage_id not in stage_by_id:
            fail(f"课程模块第 {row} 行引用了不存在的阶段：{stage_id}")
        stage_by_id[stage_id]["modules"].append(normalize_module(record, stage_by_id[stage_id], module_definitions))

    for stage in stages:
        if stage["status"] != "archived" and not stage["modules"]:
            fail(f"阶段 {stage['id']} 至少需要一个课程模块")
        stage["modules"].sort(key=lambda item: (item["schedule"]["start"], item["moduleId"]))
        for index, left in enumerate(stage["modules"]):
            for right in stage["modules"][index + 1 :]:
                if left["moduleId"] == right["moduleId"] and ranges_overlap(left["schedule"], right["schedule"]):
                    fail(f"阶段 {stage['id']} 的模块 {left['moduleId']} 存在重叠安排")

    absolute_ready = [stage for stage in stages if stage["status"] == "ready" and stage["schedule"]["mode"] == "absolute"]
    for index, left in enumerate(absolute_ready):
        for right in absolute_ready[index + 1 :]:
            shared_kids = set(left["kidIds"]) & set(right["kidIds"])
            if shared_kids and ranges_overlap(left["schedule"], right["schedule"]):
                fail(f"ready 阶段 {left['id']} 与 {right['id']} 对 {', '.join(sorted(shared_kids))} 存在日期冲突")

    stages.sort(key=lambda stage: (stage["schedule"]["mode"], stage["schedule"]["start"], stage["id"]))
    return {"schemaVersion": 1, "source": source, "stages": stages}


def build_heart_word_plan(records: list[dict[str, Any]], source: dict[str, Any]) -> dict[str, Any]:
    words: list[dict[str, Any]] = []
    seen: set[str] = set()
    for record in records:
        row = record.get("_row", "?")
        sequence = positive_integer(record.get("序号", ""), f"高频词计划第 {row} 行序号")
        word = str(record.get("心词", "")).strip()
        sentence = str(record.get("例句", "")).strip()
        first_day = positive_integer(record.get("首次出现 Day", ""), f"高频词计划第 {row} 行首次出现 Day")
        key = word.lower()
        if not word or not sentence:
            fail(f"高频词计划第 {row} 行必须填写心词和例句")
        if key in seen:
            fail(f"高频词重复：{word}")
        if first_day > 26:
            fail(f"高频词计划第 {row} 行首次出现 Day 不能超过 26")
        seen.add(key)
        words.append({
            "sequence": sequence,
            "word": word,
            "tier": "core" if sequence <= 100 else "extension",
            "firstDay": first_day,
            "sentence": sentence,
        })
    words.sort(key=lambda item: item["sequence"])
    if [item["sequence"] for item in words] != list(range(1, 201)):
        fail("高频词计划必须包含连续的 1–200 序号")
    teaching_days = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24]
    for day in teaching_days:
        daily = [item for item in words if item["firstDay"] == day]
        if len(daily) != 10 or sum(item["tier"] == "core" for item in daily) != 5:
            fail(f"高频词计划 Day {day} 必须包含 5 个基础词和 5 个拓展词")
    if any(item["firstDay"] not in teaching_days for item in words):
        fail("高频词只能安排在 20 个教学日，复习日和展示日不新增")
    return {
        "schemaVersion": 1,
        "source": source,
        "policy": {"teachingDayNewWords": 10, "coreWords": 100, "extensionWords": 100},
        "words": words,
    }


def load_workbook_records(path: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    with ZipFile(path) as archive:
        strings = shared_strings(archive)
        targets = sheet_targets(archive)
        for required in ["课程阶段", "课程模块", "100个心词"]:
            if required not in targets:
                fail(f"缺少工作表“{required}”")
        stages = table_records(read_sheet(archive, targets["课程阶段"], strings), ["阶段ID", "课程名称", "适用孩子", "阶段目标", "排期方式", "开始", "结束", "状态"], "课程阶段")
        modules = table_records(read_sheet(archive, targets["课程模块"], strings), ["阶段ID", "模块ID", "启用", "名称覆盖", "执行步骤覆盖", "内容数据源", "开始", "结束"], "课程模块")
        heart_words = table_records(read_sheet(archive, targets["100个心词"], strings), ["序号", "心词", "首次出现 Day", "例句"], "100个心词")
        return stages, modules, heart_words


def render_json(value: dict[str, Any]) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def render_js(value: dict[str, Any]) -> str:
    body = json.dumps(value, ensure_ascii=False, indent=2).replace("\n", "\n  ")
    return (
        "(function (root) {\n"
        "  // Generated by scripts/generate-course-plan-catalog.py. Do not edit directly.\n"
        f"  root.COURSE_PLAN_CATALOG = Object.freeze({body});\n"
        "})(typeof window === \"undefined\" ? globalThis : window);\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--js-output", type=Path)
    parser.add_argument("--heart-output", type=Path, default=DEFAULT_HEART_OUTPUT)
    parser.add_argument("--model", type=Path, help="Use normalized stage/module records from JSON (tests and diagnostics).")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    try:
        if args.model:
            model = json.loads(args.model.read_text(encoding="utf-8"))
            stage_records, module_records = model.get("stages", []), model.get("modules", [])
            heart_records = None
            source = {"type": "model", "file": args.model.name, "sha256": hashlib.sha256(args.model.read_bytes()).hexdigest()}
        else:
            stage_records, module_records, heart_records = load_workbook_records(args.input)
            source = {
                "type": "xlsx",
                "file": str(Path("..") / args.input.relative_to(PROJECT_ROOT.parent)),
                "sha256": hashlib.sha256(args.input.read_bytes()).hexdigest(),
            }
        catalog = build_catalog(stage_records, module_records, source)
        generated = render_json(catalog)
        js_output = args.js_output or (DEFAULT_JS_OUTPUT if args.output == DEFAULT_OUTPUT and not args.model else None)
        generated_js = render_js(catalog) if js_output else None
        heart_plan = build_heart_word_plan(heart_records, source) if heart_records is not None else None
        generated_heart = render_json(heart_plan) if heart_plan else None
        if args.check:
            stale = not args.output.exists() or args.output.read_text(encoding="utf-8") != generated
            if js_output:
                stale = stale or not js_output.exists() or js_output.read_text(encoding="utf-8") != generated_js
            if generated_heart:
                stale = stale or not args.heart_output.exists() or args.heart_output.read_text(encoding="utf-8") != generated_heart
            if stale:
                print("课程计划或高频词生成结果已过期。请运行：python3 scripts/generate-course-plan-catalog.py", file=sys.stderr)
                return 1
            print(f"OK: 课程总表已校验（{len(stage_records)} 个阶段，{len(module_records)} 条模块安排）")
            return 0
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(generated, encoding="utf-8")
        if js_output:
            js_output.parent.mkdir(parents=True, exist_ok=True)
            js_output.write_text(generated_js, encoding="utf-8")
        if generated_heart:
            args.heart_output.parent.mkdir(parents=True, exist_ok=True)
            args.heart_output.write_text(generated_heart, encoding="utf-8")
        try:
            output_label = args.output.relative_to(PROJECT_ROOT)
        except ValueError:
            output_label = args.output
        print(f"已生成 {output_label}（{len(stage_records)} 个阶段，{len(module_records)} 条模块安排）")
        return 0
    except (CatalogError, KeyError, OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
