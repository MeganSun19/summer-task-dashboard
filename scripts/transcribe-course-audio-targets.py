import argparse
import json
import re
from pathlib import Path

import mlx_whisper


PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = PROJECT_ROOT.parent
COURSE_PATH = PROJECT_ROOT / "curriculum" / "english-course.json"
CATALOG_PATH = PROJECT_ROOT / "curriculum" / "opw-full-audio-catalog.json"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Retranscribe only course-relevant Oxford Phonics World tracks."
    )
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--level", type=int, required=True)
    parser.add_argument("--sections", required=True, help="Comma-separated catalog section ids")
    parser.add_argument("--target-words", help="Optional comma-separated override for the course week words")
    parser.add_argument("--model", default="mlx-community/whisper-small.en-mlx")
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


def normalize_word(value):
    return re.sub(r"[^a-z]", "", str(value or "").lower())


def load_json(path):
    return json.loads(path.read_text())


def target_words(course, week):
    words = []
    for day in course["days"]:
        if day["week"] != week:
            continue
        for entry in day.get("phonics", {}).get("words", []):
            word = normalize_word(entry.get("word"))
            if word and word not in words:
                words.append(word)
    return words


def selected_tracks(catalog, level_number, section_ids):
    level = next(item for item in catalog["levels"] if item["level"] == level_number)
    if "all" in section_ids:
        section_ids = {item["id"] for item in level["sections"]}
    return [
        track for track in level["tracks"]
        if track.get("sectionId") in section_ids
    ]


def transcribe(track, level, model, prompt):
    audio_path = (
        WORKSPACE_ROOT
        / "outputs"
        / f"oxford-phonics-world-level{level}-disc{track['disc']}"
        / track["sourceFile"]
    )
    if not audio_path.exists():
        raise FileNotFoundError(audio_path)
    result = mlx_whisper.transcribe(
        str(audio_path),
        path_or_hf_repo=model,
        word_timestamps=True,
        verbose=False,
        language="en",
        condition_on_previous_text=False,
        initial_prompt=prompt,
    )
    words = []
    for segment in result.get("segments", []):
        for item in segment.get("words", []):
            word = str(item.get("word", "")).strip()
            if not normalize_word(word):
                continue
            words.append({
                "word": word,
                "normalizedWord": normalize_word(word),
                "startSeconds": round(float(item["start"]), 3),
                "endSeconds": round(float(item["end"]), 3),
                "confidence": round(float(item.get("probability", 0)), 4),
            })
    return {
        "level": level,
        "disc": track["disc"],
        "track": track["track"],
        "sourceFile": track["sourceFile"],
        "sectionId": track.get("sectionId"),
        "transcript": result.get("text", "").strip(),
        "wordSegments": words,
    }


def save(path, args, sections, words, entries):
    payload = {
        "schemaVersion": 1,
        "engine": "mlx-whisper",
        "model": args.model,
        "language": "en",
        "week": args.week,
        "level": args.level,
        "sections": sorted(sections),
        "targetWords": words,
        "policy": (
            "Course-targeted retranscription only. Vocabulary prompt assists spelling; "
            "all extracted clips still require listening review."
        ),
        "tracks": [entries[key] for key in sorted(entries)],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def main():
    args = parse_args()
    if args.week < 1 or args.week > 4:
        raise SystemExit(f"Invalid week: {args.week}")
    output = args.output or (
        PROJECT_ROOT / "tmp" / "course-audio-transcripts"
        / f"week-{args.week}-l{args.level}.json"
    )
    sections = {item.strip() for item in args.sections.split(",") if item.strip()}
    course = load_json(COURSE_PATH)
    catalog = load_json(CATALOG_PATH)
    words = (
        [normalize_word(item) for item in args.target_words.split(",") if normalize_word(item)]
        if args.target_words
        else target_words(course, args.week)
    )
    tracks = selected_tracks(catalog, args.level, sections)
    if not tracks:
        raise SystemExit("No tracks matched the requested level and sections")

    entries = {}
    if output.exists():
        existing = load_json(output)
        if existing.get("model") == args.model:
            entries = {
                (item["level"], item["disc"], item["track"]): item
                for item in existing.get("tracks", [])
            }
    pending = [
        track for track in tracks
        if (args.level, track["disc"], track["track"]) not in entries
    ]
    prompt = "Oxford Phonics World vocabulary: " + ", ".join(words) + "."
    print(f"Selected {len(tracks)} tracks; {len(pending)} pending; {len(words)} target words")
    for index, track in enumerate(pending, 1):
        key = (args.level, track["disc"], track["track"])
        entries[key] = transcribe(track, args.level, args.model, prompt)
        save(output, args, sections, words, entries)
        print(
            f"[{index}/{len(pending)}] L{args.level} D{track['disc']} "
            f"T{track['track']:02d}: {len(entries[key]['wordSegments'])} words",
            flush=True,
        )
    save(output, args, sections, words, entries)
    print(f"Wrote {output}: {len(entries)} tracks")


if __name__ == "__main__":
    main()
