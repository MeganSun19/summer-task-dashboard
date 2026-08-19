(function (root) {
  // Every target sound used by the phonics animations must have one traceable
  // source record. Release remains blocked until the parent has completed the
  // full-course listening pass and the reported corrections have been applied.
  const source = (id, ipa, patterns, options) => Object.freeze({
    id,
    ipa,
    patterns: Object.freeze(patterns),
    reviewStatus: "human-approved",
    reviewedAt: "2026-08-19",
    reviewSource: "parent-full-course-listening",
    ...options
  });

  const sources = [
    source("short-a", "/æ/", ["a"], { source: "at", start: 0.25, end: 0.47, sourceKind: "neural-word-crop", sourceLabel: "神经音色 at，仅保留元音段", riskNote: "已避开 /t/；仍需人耳确认切点" }),
    source("short-i", "/ɪ/", ["i"], { source: "it", start: 0.25, end: 0.42, sourceKind: "neural-word-crop", sourceLabel: "神经音色 it，仅保留元音段", riskNote: "已避开 /t/；仍需人耳确认切点" }),
    source("short-e", "/e/", ["e"], { source: "Ed", start: 0.25, end: 0.49, sourceKind: "neural-word-crop", sourceLabel: "神经音色 Ed，仅保留元音段", riskNote: "已避开 /d/；仍需人耳确认切点" }),
    source("short-o", "/ɑ/", ["o"], { source: "odd", start: 0.25, end: 0.52, sourceKind: "neural-word-crop", sourceLabel: "神经音色 odd，仅保留元音段", riskNote: "已避开 /d/；仍需人耳确认切点" }),
    source("short-u", "/ʌ/", ["u"], { source: "up", start: 0.25, end: 0.40, sourceKind: "neural-word-crop", sourceLabel: "神经音色 up，仅保留元音段", riskNote: "已避开 /p/；仍需人耳确认切点" }),
    source("k", "/k/", ["k"], { source: "back", sourceFile: "audio-sources/phonics-words/back.mp3", start: 0.43, end: 0.57, sourceKind: "reviewed-word-crop", sourceLabel: "独立单词 back 的词尾音", riskNote: "替换原 key 词首误切片；需复核爆破完整度" }),
    source("ck", "/k/", ["ck"], { source: "back", sourceFile: "audio-sources/phonics-words/back.mp3", start: 0.44, end: 0.56, sourceKind: "reviewed-word-crop", sourceLabel: "独立单词 back 的词尾音", riskNote: "目标音位于词尾；需复核爆破完整度" }),
    source("kw", "/kw/", ["qu"], { source: "queen", start: 0.20, end: 0.43, sourceKind: "neural-word-crop", sourceLabel: "神经音色 queen 的开头音", riskNote: "目标辅音丛位于词首" }),
    source("ch", "/tʃ/", ["ch", "tch"], { source: "rich", sourceFile: "audio-sources/phonics-words/rich.mp3", start: 0.44, end: 0.58, tempo: 0.50, fadeIn: 0.003, sourceKind: "reviewed-word-crop", sourceLabel: "独立单词 rich 的词尾音", riskNote: "目标音位于词尾；需复核清晰度与时长" }),
    source("f", "/f/", ["f", "ph"], { source: "graph", sourceFile: "audio-sources/phonics-words/graph.mp3", start: 0.43, end: 0.68, sourceKind: "reviewed-word-crop", sourceLabel: "独立单词 graph 的词尾音", riskNote: "替换原 fee 词首过短切片；保留连续摩擦气流" }),
    source("sh", "/ʃ/", ["sh"], { source: "dish", sourceFile: "audio-sources/phonics-words/dish.mp3", start: 0.42, end: 0.62, tempo: 0.58, fadeIn: 0.008, sourceKind: "reviewed-word-crop", sourceLabel: "独立单词 dish 的词尾音", riskNote: "目标音位于词尾；需复核气流长度" }),
    source("long-a", "/eɪ/", ["a_e", "ai", "ay"], { source: "A", start: 0.20, end: 0.78, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读字母 A", riskNote: "不再从 eight 截取，无 /t/ 尾音" }),
    source("th", "/θ/", ["th"], { source: "bath", sourceFile: "audio-sources/phonics-words/bath.mp3", start: 0.44, end: 0.58, tempo: 0.50, fadeIn: 0.008, sourceKind: "reviewed-word-crop", sourceLabel: "独立单词 bath 的词尾清音", riskNote: "本课程目标是清辅音 /θ/；需复核舌齿摩擦音" }),
    source("long-e", "/iː/", ["e_e", "ee", "ea"], { source: "E", start: 0.20, end: 0.72, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读字母 E", riskNote: "不再从 eat 截取，无 /t/ 尾音" }),
    source("w", "/w/", ["w", "wh"], { source: "when", start: 0.20, end: 0.41, sourceKind: "neural-word-crop", sourceLabel: "神经音色 when 的开头音", riskNote: "目标音位于词首" }),
    source("ng", "/ŋ/", ["ng"], { source: "sing", start: 0.60, end: 0.88, sourceKind: "neural-word-crop", sourceLabel: "神经音色 sing 的词尾音", riskNote: "目标鼻音位于词尾" }),
    source("nk", "/ŋk/", ["nk"], { source: "sink", start: 0.58, end: 0.92, sourceKind: "neural-word-crop", sourceLabel: "神经音色 sink 的词尾音", riskNote: "保留 /ŋ/ 和 /k/ 两个声音" }),
    source("long-o", "/oʊ/", ["o_e", "oa", "ow"], { source: "oh", start: 0.18, end: 0.82, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读 oh", riskNote: "无尾辅音" }),
    source("ar", "/ɑr/", ["ar"], { source: "are", start: 0.18, end: 0.84, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读 are", riskNote: "无尾辅音" }),
    source("or", "/ɔr/", ["or"], { source: "or", start: 0.18, end: 0.84, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读 or", riskNote: "无尾辅音" }),
    source("er", "/ɝ/", ["er", "ir", "ur"], { source: "her", sourceFile: "audio-sources/phonics-words/her.mp3", start: 0.19, end: 0.50, sourceKind: "reviewed-word-crop", sourceLabel: "独立单词 her，去掉开头 /h/", riskNote: "替换原 err 候选；同一卷舌元音用于 er / ir / ur" }),
    source("long-oo", "/uː/", ["oo"], { displayLabel: "oo 长音", source: "ooh", start: 0.20, end: 0.78, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读 ooh", riskNote: "用于 pool / room / moon 一类词" }),
    source("short-oo", "/ʊ/", ["oo"], { displayLabel: "oo 短音", source: "book", sourceFile: "audio-sources/phonics-words/book.mp3", start: 0.17, end: 0.34, tempo: 0.82, sourceKind: "reviewed-word-crop", sourceLabel: "独立单词 book，仅保留中间元音", riskNote: "原切点误取到 /k/；现已移到 /k/ 之前" }),
    source("long-i", "/aɪ/", ["i_e"], { source: "I", start: 0.18, end: 0.82, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读 I", riskNote: "无尾辅音" }),
    source("ow", "/aʊ/", ["ou", "ow"], { source: "ow", start: 0.20, end: 0.80, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读感叹词 ow", riskNote: "不再从 out 截取，无 /t/ 尾音" }),
    source("long-u", "/juː/", ["u_e"], { source: "you", start: 0.20, end: 0.86, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读 you", riskNote: "无尾辅音" }),
    source("oy", "/ɔɪ/", ["oi", "oy"], { source: "oy", start: 0.20, end: 0.80, sourceKind: "neural-whole-vowel", sourceLabel: "神经音色直接读感叹词 oy", riskNote: "不再从 oil 截取，无 /l/ 尾音" }),
    source("st", "/st/", ["st"], { source: "stem", start: 0.20, end: 0.45, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 stem 的开头辅音丛", riskNote: "s 后 /t/ 少送气，仍是清辅音，不是 /d/" }),
    source("sk", "/sk/", ["sk"], { source: "skip", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 skip 的开头辅音丛", riskNote: "s 后 /k/ 少送气，仍是清辅音，不是 /ɡ/" }),
    source("sn", "/sn/", ["sn"], { source: "snap", start: 0.20, end: 0.45, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 snap 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("sl", "/sl/", ["sl"], { source: "slug", start: 0.20, end: 0.45, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 slug 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("cl", "/kl/", ["cl"], { source: "clip", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 clip 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("fl", "/fl/", ["fl"], { source: "flat", start: 0.20, end: 0.45, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 flat 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("pl", "/pl/", ["pl"], { source: "plug", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 plug 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("gl", "/ɡl/", ["gl"], { source: "glad", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 glad 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("fr", "/fr/", ["fr"], { source: "fresh", start: 0.25, end: 0.44, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 fresh 的开头辅音丛", riskNote: "补齐原课程第15课实际要求的 fr" }),
    source("gr", "/ɡr/", ["gr"], { source: "grin", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 grin 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("dr", "/dr/", ["dr"], { source: "drop", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 drop 的开头辅音丛", riskNote: "美音中可能带自然塞擦色彩，仍标 /dr/" }),
    source("tr", "/tr/", ["tr"], { source: "trim", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 trim 的开头辅音丛", riskNote: "美音中可能带自然塞擦色彩，仍标 /tr/" }),
    source("cr", "/kr/", ["cr"], { source: "crack", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 crack 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("sm", "/sm/", ["sm"], { source: "smog", start: 0.20, end: 0.45, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 smog 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("bl", "/bl/", ["bl"], { source: "blot", start: 0.20, end: 0.43, tempo: 0.76, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 blot 的开头辅音丛", riskNote: "两个辅音均需保留" }),
    source("nt", "/nt/", ["nt"], { source: "tent", start: 0.50, end: 0.78, tempo: 0.72, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 tent 的真实发声末段", riskNote: "移除错误的文件末尾倒数法，保留 /n/ 与 /t/" }),
    source("mp", "/mp/", ["mp"], { source: "lamp", start: 0.50, end: 0.75, tempo: 0.72, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 lamp 的真实发声末段", riskNote: "移除错误的文件末尾倒数法，保留 /m/ 与 /p/" }),
    source("nd", "/nd/", ["nd"], { source: "sand", start: 0.62, end: 0.82, tempo: 0.72, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 sand 的真实发声末段", riskNote: "移除错误的文件末尾倒数法，保留 /n/ 与 /d/" }),
    source("ft", "/ft/", ["ft"], { source: "gift", start: 0.55, end: 0.77, tempo: 0.72, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 gift 的真实发声末段", riskNote: "移除错误的文件末尾倒数法，保留 /f/ 与 /t/" }),
    source("lt", "/lt/", ["lt"], { source: "belt", start: 0.50, end: 0.76, tempo: 0.72, sourceKind: "neural-cluster-crop", sourceLabel: "神经音色 belt 的真实发声末段", riskNote: "移除错误的文件末尾倒数法，保留 /l/ 与 /t/" })
  ];

  root.PHONICS_AUDIO_SOURCES = Object.freeze(sources);
})(typeof window !== "undefined" ? window : globalThis);
