import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
await import(join(projectRoot, "curriculum", "phonics-audio-sources.js"));
await import(join(projectRoot, "curriculum", "phonics-lesson-content.js"));

const sources = globalThis.PHONICS_AUDIO_SOURCES || [];
const lessons = globalThis.PHONICS_LESSON_CONTENT || [];
const byId = new Map(sources.map((source) => [source.id, source]));
const referenced = new Set(lessons.flatMap((lesson) => lesson.animationScenes || []).flatMap((scene) => (
  scene.soundModels || []
)).map((sound) => String(sound.asset || "").split("/").pop().replace(/\.mp3$/, "")));

if (sources.length !== 47) throw new Error(`音源清单应为 47 项，实际 ${sources.length} 项`);
if (byId.size !== sources.length) throw new Error("音源清单存在重复 id");
for (const id of referenced) {
  if (!byId.has(id)) throw new Error(`课程引用了未登记音源：${id}`);
}
for (const source of sources) {
  const audioPath = join(projectRoot, "phonics-media", "phonemes", `${source.id}.mp3`);
  if (!existsSync(audioPath) || statSync(audioPath).size < 500) throw new Error(`音源文件缺失或无效：${source.id}`);
  if (!source.sourceLabel || !source.riskNote || !source.ipa) throw new Error(`音源溯源字段不完整：${source.id}`);
}

const pending = sources.filter((source) => source.reviewStatus !== "human-approved");
if (process.argv.includes("--release") && pending.length) {
  throw new Error(`发布已停止：${pending.length} 个自然拼读目标音尚未完成人耳审核（${pending.map((item) => item.id).join(", ")}）`);
}
console.log(`自然拼读音源清单通过：${sources.length} 项，课程引用 ${referenced.size} 项，待人耳审核 ${pending.length} 项`);
