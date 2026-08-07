import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(projectDir, "..", "outputs");
const localWordRoot = path.join(projectDir, "audio-sources", "phonics-words");
const outputDir = path.join(projectDir, "course-audio");
const course = JSON.parse(await readFile(path.join(projectDir, "curriculum", "english-course.json"), "utf8"));
const assets = new Map();

JSON.stringify(course, (key, value) => {
  if (key !== "audio" || value?.status !== "verified") return value;
  if (value.assetId) {
    assets.set(value.assetId, {
      id: value.assetId,
      kind: "phonics-word",
      sourceType: value.sourceType,
      filename: value.sourceFile,
      source: path.join(localWordRoot, value.sourceFile)
    });
    return value;
  }
  const track = String(value.track).padStart(2, "0");
  const id = `opw-l${value.level}-d${value.disc}-track${track}`;
  const filename = `OPW_SB${value.level}_Disc${value.disc}_Track${track}.mp3`;
  assets.set(id, {
    id,
    kind: "oxford-track",
    level: value.level,
    disc: value.disc,
    track: value.track,
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
  await copyFile(asset.source, destination);
  asset.bytes = info.size;
  asset.url = `./course-audio/${asset.id}.mp3`;
  delete asset.source;
  totalBytes += info.size;
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
