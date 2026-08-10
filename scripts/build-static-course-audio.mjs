import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(projectDir, "..", "outputs");
const localWordRoot = path.join(projectDir, "audio-sources", "phonics-words");
const localHeartWordRoot = path.join(projectDir, "audio-sources", "heart-words");
const outputDir = path.join(projectDir, "course-audio");
const course = JSON.parse(await readFile(path.join(projectDir, "curriculum", "english-course.json"), "utf8"));
const assets = new Map();

JSON.stringify(course, (key, value) => {
  if (key !== "audio" || value?.status !== "verified") return value;
  if (value.assetId) {
    const kind = value.kind === "heart-word" ? "heart-word" : "phonics-word";
    assets.set(value.assetId, {
      id: value.assetId,
      kind,
      sourceType: value.sourceType,
      filename: value.sourceFile,
      source: path.join(kind === "heart-word" ? localHeartWordRoot : localWordRoot, value.sourceFile)
    });
    return value;
  }
  const track = String(value.track).padStart(2, "0");
  const id = value.itemId
    ? `opw-clip-${String(value.itemId).replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`
    : `opw-l${value.level}-d${value.disc}-track${track}`;
  const filename = `OPW_SB${value.level}_Disc${value.disc}_Track${track}.mp3`;
  assets.set(id, {
    id,
    kind: value.itemId ? "oxford-clip" : "oxford-track",
    level: value.level,
    disc: value.disc,
    track: value.track,
    itemId: value.itemId,
    clip: value.clip,
    filename,
    source: path.join(sourceRoot, `oxford-phonics-world-level${value.level}-disc${value.disc}`, filename)
  });
  return value;
});

if (!assets.size) throw new Error("课程中没有已审核的音频引用，停止生成静态音频包");

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

let totalBytes = 0;
for (const asset of [...assets.values()].sort((a, b) => a.id.localeCompare(b.id))) {
  const destination = path.join(outputDir, `${asset.id}.mp3`);
  const info = await stat(asset.source).catch(() => null);
  if (!info?.isFile() || info.size === 0) throw new Error(`缺少课程音频源文件：${asset.source}`);
  if (asset.kind === "oxford-clip") {
    const start = Number(asset.clip?.startSeconds);
    const end = Number(asset.clip?.endSeconds);
    const duration = end - start;
    if (!Number.isFinite(start) || !Number.isFinite(duration) || start < 0 || duration <= 0) {
      throw new Error(`Oxford 片段时间无效：${asset.id}`);
    }
    await execFileAsync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", asset.source,
      "-ss", String(start), "-t", String(duration),
      "-vn", "-codec:a", "libmp3lame", "-q:a", "3",
      destination
    ]);
  } else {
    await copyFile(asset.source, destination);
  }
  const outputInfo = await stat(destination);
  asset.bytes = outputInfo.size;
  asset.url = `./course-audio/${asset.id}.mp3`;
  delete asset.source;
  delete asset.clip;
  totalBytes += outputInfo.size;
}

const manifest = {
  schemaVersion: 2,
  generatedFrom: "curriculum/english-course.json",
  assetCount: assets.size,
  totalBytes,
  assets: Object.fromEntries([...assets].map(([id, asset]) => [id, asset]))
};
await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`静态课程音频已生成：${assets.size} 条，${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
