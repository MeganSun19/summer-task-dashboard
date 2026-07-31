const STORAGE_KEY = "summer-task-dashboard-v1";

const razPlan = [
  {
    books: "RAZ: B-51 I Read a Book; B-53 You and I; B-98 This Turtle",
    words: ["I", "you", "and", "a", "book", "read", "this", "see"],
    note: "句型：I read a book. / You and I see..."
  },
  {
    books: "RAZ: B-50 Go Animals Go; B-81 You Can Go; B-19 Animals Can Move",
    words: ["can", "go", "move", "animals", "fast", "slow", "up", "down"],
    note: "配动作读：go, move, up, down。"
  },
  {
    books: "RAZ: B-11 Where Is Water?; B-84 Where?; C-41 Get In",
    words: ["where", "is", "water", "in", "here", "there", "get", "it"],
    note: "句型：Where is...? / It is in..."
  },
  {
    books: "RAZ: B-15 What Has These Feet?; B-16 What Has These Stripes?; B-17 What Has These Spots?",
    words: ["what", "has", "these", "feet", "stripes", "spots", "animal"],
    note: "找 these 和 has，不讲复杂语法。"
  },
  {
    books: "RAZ: B-6 My Pet Dinosaur; B-12 I Love the Earth; B-56 I Love Art Class",
    words: ["my", "pet", "love", "like", "the", "earth", "class"],
    note: "读后说 2 句自己喜欢的东西。"
  },
  {
    books: "RAZ: 任选本周最喜欢的4本 + B-38 We Pack a Picnic",
    words: ["I", "you", "can", "go", "where", "is", "what", "has", "my", "love"],
    note: "只复习错词，不新增。"
  },
  {
    books: "RAZ: 听 B 级音频或孩子自选2本",
    words: [],
    note: "轻松输入日。"
  },
  {
    books: "RAZ: B-28 Ten; C-12 We Count; D-31 Less than; D-32 Greater than",
    words: ["one", "two", "three", "many", "more", "less", "greater", "than"],
    note: "用积木或水果做 more / less。"
  },
  {
    books: "RAZ: C-9 What Animals Eat; D-5 Where Animals Live; E-4 Places Plants and Animals Live",
    words: ["animals", "eat", "live", "place", "food", "water", "where", "what"],
    note: "做 eat / live 两栏。"
  },
  {
    books: "RAZ: C-6 How Frogs Grow; D-1 Grow, Vegetables, Grow!; D-9 Where Plants Grow",
    words: ["grow", "plant", "frog", "vegetable", "first", "next", "then"],
    note: "用 first / next / then 复述。"
  },
  {
    books: "RAZ: C-14 Snow Falls; D-10 Fog; D-11 Clouds; E-11 The Four Seasons",
    words: ["snow", "falls", "fog", "clouds", "season", "weather", "cold", "warm"],
    note: "看窗外天气说 The weather is..."
  },
  {
    books: "RAZ: B-80 Near and Far Away; C-33 Going Away; D-37 Getting Around the City; D-88 How We Get to School",
    words: ["near", "far", "away", "around", "to", "from", "school", "city"],
    note: "用家里物品练 near / far。"
  },
  {
    books: "RAZ: 任选数量、动物、天气主题各1本",
    words: ["many", "more", "less", "where", "what", "eat", "live", "grow", "then"],
    note: "周回收，只测认读。"
  },
  {
    books: "RAZ: 听 C/D 级动物或天气主题音频",
    words: [],
    note: "只说一句 I heard..."
  },
  {
    books: "RAZ: B-73 It Is School Time; C-46 Busy At School; D-41 My New School; E-43 Getting Ready for School",
    words: ["school", "time", "ready", "new", "class", "teacher", "busy"],
    note: "绑定真实上学流程。"
  },
  {
    books: "RAZ: C-52 What I Want; D-54 I Need An Eraser; F-72 Needs and Wants",
    words: ["want", "need", "have", "has", "eraser", "thing", "because"],
    note: "句型：I need... because..."
  },
  {
    books: "RAZ: D-35 A Day for Dad; E-31 Nothing for Father's Day; E-71 A Week With Grandpa; F-12 Best of Friends",
    words: ["dad", "father", "grandpa", "friend", "family", "day", "week"],
    note: "说一个家庭成员或朋友。"
  },
  {
    books: "RAZ: B-75 I Am a Community Worker; D-69 Community Helpers; D-71 Workers; F-62 Community Workers",
    words: ["worker", "community", "help", "people", "job", "work", "can"],
    note: "反复找 people / help / work。"
  },
  {
    books: "RAZ: B-40 We Make Cookies; C-27 Yummy, Yummy; E-27 Let's Make Lemonade; E-61 Making Pizza",
    words: ["make", "made", "food", "yummy", "cookie", "pizza", "lemonade"],
    note: "配合真实或假装做食物。"
  },
  {
    books: "RAZ: 学校、need/want、worker、food主题各选1本",
    words: ["school", "time", "need", "want", "because", "friend", "people", "work", "make"],
    note: "重点回收 because / people / friend。"
  },
  {
    books: "RAZ: 听 D/E 级故事类音频",
    words: [],
    note: "听力保温，不做纸笔。"
  },
  {
    books: "RAZ: C-91 Who, Who, Who?; D-27 Who Runs Faster?; D-30 Why Does an Octopus Need Eight Arms?; F-10 Who Needs Rain?",
    words: ["who", "what", "where", "when", "why", "how", "does", "do", "they"],
    note: "家长只问，孩子答关键词即可。"
  },
  {
    books: "RAZ: C-88 There Is a Mouse in the House; D-66 I Did Not Give Up!; E-72 Try, try again; F-86 Stop It, Zots!",
    words: ["there", "is", "did", "not", "give", "again", "stop", "it", "said"],
    note: "短句卡：There is... / I did not..."
  },
  {
    books: "RAZ: D-87 Silent e; F-27 Princess Prefix; F-77 Sir Suffix",
    words: ["silent", "e", "prefix", "suffix", "make", "name", "same", "hope"],
    note: "自然拼读当记词工具。"
  },
  {
    books: "RAZ: F-1 The Food Chain; F-14 Hibernation; F-18 A Look at Fossils",
    words: ["food", "chain", "look", "at", "fossil", "winter", "sleep", "animal"],
    note: "用图复述，不要求整段英文。"
  },
  {
    books: "RAZ: F-74 The Three Little Pigs; F-75 The Giant Turnip; F-76 The Tortoise and the Hare",
    words: ["little", "three", "big", "help", "pull", "fast", "slow", "hare"],
    note: "选一本做复述，其他只读。"
  },
  {
    books: "RAZ: 从4周中每周选2本，共8本",
    words: ["错词盒", "核心高频词"],
    note: "按秒认、犹豫、不会分词。"
  },
  {
    books: "RAZ: 孩子自选3本读给家长听",
    words: [],
    note: "轻松展示日。"
  }
];

const poems = [
  "《咏柳》熟读",
  "《咏柳》背诵",
  "《春晓》熟读",
  "《春晓》背诵",
  "《静夜思》熟读",
  "《静夜思》背诵",
  "古诗回顾",
  "《登鹳雀楼》熟读",
  "《登鹳雀楼》背诵",
  "《悯农》熟读",
  "《悯农》背诵",
  "《江雪》熟读",
  "《江雪》背诵",
  "古诗回顾",
  "《赋得古原草送别》前四句",
  "《赋得古原草送别》背诵",
  "《寻隐者不遇》熟读",
  "《寻隐者不遇》背诵",
  "《小池》熟读",
  "《小池》背诵",
  "古诗回顾",
  "《山行》熟读",
  "《山行》背诵",
  "《望庐山瀑布》熟读",
  "《望庐山瀑布》背诵",
  "自选一首复习",
  "抽背三首",
  "轻松展示"
];

const writingTasks = [
  "写字练习 1 页，注意坐姿和笔顺",
  "写字练习 1 页，圈出最满意的 3 个字",
  "写字练习 1 页，重写 3 个不稳的字",
  "写字练习 1 页，保持字距",
  "写字练习 1 页，慢一点写",
  "写字练习半页 + 订正",
  "写字休整或补漏"
];

const mathTasks = [
  "2、3 的乘法口诀，顺背 + 抽问",
  "4 的乘法口诀，顺背 + 打乱问",
  "5 的乘法口诀，口答 20 题",
  "2-5 混合口诀，计时 3 分钟",
  "6 的乘法口诀，顺背 + 抽问",
  "7 的乘法口诀，顺背 + 抽问",
  "本周口诀回顾",
  "8 的乘法口诀，顺背 + 抽问",
  "9 的乘法口诀，顺背 + 抽问",
  "6-9 混合口诀，口答 30 题",
  "2-9 混合口诀，错题记录",
  "乘法口诀应用题 5 题",
  "口诀薄弱项回顾",
  "轻松口算日"
];

const readingTasks = [
  "中文阅读 20 分钟，说一句内容",
  "中文阅读 20 分钟，说一个人物",
  "中文阅读 20 分钟，说一个喜欢的情节",
  "中文阅读 20 分钟，画一个关键词",
  "中文阅读 25 分钟",
  "亲子共读 15 分钟",
  "自由阅读"
];

const profiles = [
  { id: "brother", name: "哥哥", character: "乌龙", avatar: "./乌龙头像.png", color: "#ee7e48", soft: "#fff0e7" },
  { id: "younger", name: "弟弟", character: "哈小浪", avatar: "./哈小浪.png", color: "#4b8fd5", soft: "#e7f2ff" }
];

const plants = [
  { id: "sunflower", icon: "🌻", name: "向日葵", unlockAt: 10, power: "给小队加油" },
  { id: "peashooter", icon: "🫛", name: "豌豆射手", unlockAt: 30, power: "发射豌豆" },
  { id: "wallnut", icon: "🌰", name: "坚果墙", unlockAt: 60, power: "守住花园" },
  { id: "snowpea", icon: "❄️", name: "寒冰射手", unlockAt: 100, power: "冻住僵尸" },
  { id: "cherry", icon: "🍒", name: "樱桃炸弹", unlockAt: 160, power: "清理一大片" },
  { id: "melon", icon: "🍉", name: "西瓜投手", unlockAt: 240, power: "投出大西瓜" }
];

const countryCodes = (`CN MN KP KR JP RU KZ KG TJ UZ TM AF PK IN NP BT BD LK MV MM LA VN KH TH MY SG ID BN PH TL IR IQ TR GE AM AZ SY LB IL PS JO SA YE OM AE QA BH KW UA BY MD RO BG GR MK RS BA ME AL HR SI HU SK PL LT LV EE FI SE NO DK DE CZ AT IT CH LI FR BE NL LU GB IE ES PT AD MC SM VA IS MT CY EG LY TN DZ MA MR ML NE TD SD SS ER DJ ET SO KE UG RW BI TZ CD CG GA GQ CM NG BJ TG GH BF CI LR SL GN GW GM SN CV CF AO ZM MW MZ ZW BW NA ZA LS SZ MG KM MU SC ST PG AU NZ FJ SB VU WS TO TV KI NR PW FM MH CA US MX GT BZ SV HN NI CR PA CO VE GY SR BR EC PE BO PY CL AR UY CU JM HT DO BS KN AG DM LC VC BB GD TT`).split(" ");

const COUNTRIES_PER_JOINT_DAY = 1;
const WORLD_MAP_URL = "./world-map.svg?v=20260731-2";
const regionNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["zh-CN"], { type: "region" }) : null;
const jointSkills = [
  { at: 3, icon: "✨", name: "双星鼓舞" },
  { at: 6, icon: "🌿", name: "藤蔓联结" },
  { at: 9, icon: "⚡", name: "双星连击" },
  { at: 12, icon: "🛡️", name: "守护结界" }
];

const categories = {
  raz: { icon: "Aa", color: "#4f83d1", soft: "#eaf2ff", minutes: 30 },
  writing: { icon: "字", color: "#48a978", soft: "#e6f6ec", minutes: 15 },
  poem: { icon: "诗", color: "#b98222", soft: "#fff2c7", minutes: 10 },
  math: { icon: "×", color: "#df746e", soft: "#ffedeb", minutes: 15 },
  reading: { icon: "读", color: "#7e69c8", soft: "#f0edff", minutes: 20 },
  listening: { icon: "▶", color: "#2e9a9a", soft: "#e3f7f6", minutes: 15 },
  retelling: { icon: "说", color: "#48a978", soft: "#e6f6ec", minutes: 15 },
  speaking: { icon: "Talk", color: "#df746e", soft: "#ffedeb", minutes: 15 }
};

const defaultTaskIds = ["raz", "writing", "poem", "math", "reading", "listening"];

let state = loadState();
ensureState(state);
let selectedDate = toISODate(new Date());
let activeKid = state.activeKid || "brother";
let editorKid = activeKid;
let currentView = "kid";
let toastTimer;

const refs = Object.fromEntries([
  "kidSwitcher", "kidView", "parentView", "avatar", "dateLabel", "kidName", "encouragement",
  "progressBar", "progressText", "sunCount", "streakCount", "timeEstimate", "taskList", "finishCard",
  "rewardBalance", "rewardList", "battleStatus", "battleLane", "battleBar", "battleMessage", "jointSkills", "characterInteraction",
  "brotherGardenSlots", "youngerGardenSlots",
  "worldProgressText", "jointDays", "worldMessage", "worldMap", "worldMapLoading", "worldProgressBar", "worldTrail", "nextCountries",
  "datePicker", "familyOverview", "editorKid", "editorTitle", "taskEditor", "mistakeBox", "parentNote",
  "gardenGameEyebrow", "overallKid", "overallTaskEditor", "rangeKid", "rangePreset", "rangeStart", "rangeEnd", "rangePreview", "planPeriodList",
  "toast", "cloudStatus", "cloudSetup", "closeCloudSetup", "cloudSetupMessage", "cloudSetupForms",
  "createFamilyForm", "joinFamilyForm", "familyName", "createFamilyPin", "familyInviteCode", "joinFamilyPin",
  "cloudConnectedInfo", "connectedInviteCode"
].map((id) => [id, document.getElementById(id)]));

document.getElementById("parentEntry").addEventListener("click", () => setView("parent"));
document.getElementById("homeButton").addEventListener("click", () => {
  selectedDate = toISODate(new Date());
  setView("kid");
});
document.getElementById("prevDay").addEventListener("click", () => moveDay(-1));
document.getElementById("nextDay").addEventListener("click", () => moveDay(1));
refs.datePicker.addEventListener("change", (event) => {
  selectedDate = event.target.value || selectedDate;
  render();
});
refs.editorKid.addEventListener("change", (event) => {
  editorKid = event.target.value;
  render();
});
refs.overallKid.addEventListener("change", (event) => {
  editorKid = event.target.value;
  render();
});
document.getElementById("saveParent").addEventListener("click", saveParentEdits);
document.getElementById("resetDay").addEventListener("click", resetCurrentDay);
document.getElementById("saveOverallPlan").addEventListener("click", saveOverallPlan);
document.getElementById("resetOverallPlan").addEventListener("click", resetOverallPlan);
document.getElementById("applyRangePlan").addEventListener("click", applyRangePlan);
refs.rangePreset.addEventListener("change", renderRangePreview);
refs.rangeKid.addEventListener("change", renderRangePreview);
refs.rangeStart.addEventListener("change", renderRangePreview);
refs.rangeEnd.addEventListener("change", renderRangePreview);
refs.cloudStatus.addEventListener("click", () => {
  refs.cloudSetup.hidden = !refs.cloudSetup.hidden;
});
refs.closeCloudSetup.addEventListener("click", () => {
  refs.cloudSetup.hidden = true;
});
refs.createFamilyForm.addEventListener("submit", createCloudFamily);
refs.joinFamilyForm.addEventListener("submit", joinCloudFamily);

renderKidSwitcher();
renderEditorKidOptions();
refs.rangeStart.value = toISODate(addDays(new Date(), 1));
refs.rangeEnd.value = toISODate(addDays(new Date(), 10));
render();
loadWorldMap();
initializeCloud();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.days && saved?.startDate) return saved;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { version: 1, days: { brother: {}, younger: {} }, startDate: toISODate(new Date()), activeKid: "brother" };
}

function ensureState(current) {
  current.days ||= { brother: {}, younger: {} };
  current.days.brother ||= {};
  current.days.younger ||= {};
  current.gardens ||= { brother: [], younger: [] };
  current.gardens.brother ||= [];
  current.gardens.younger ||= [];
  current.taskSettings ||= { brother: {}, younger: {} };
  current.taskSettings.brother ||= {};
  current.taskSettings.younger ||= {};
  current.planPeriods ||= [];
}

function saveState() {
  state.activeKid = activeKid;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.CloudStore?.scheduleSave(state);
}

async function initializeCloud() {
  updateCloudStatus({ status: "syncing", message: "正在连接云端…" });
  const result = await window.CloudStore.init({
    onRemoteState: applyRemoteState,
    onStatus: updateCloudStatus
  });
  if (result.needsSetup || result.error) refs.cloudSetup.hidden = false;
}

function applyRemoteState(remoteState, meta = {}) {
  if (!remoteState?.days || !remoteState?.startDate) return;
  state = remoteState;
  ensureState(state);
  activeKid = state.activeKid || activeKid;
  editorKid = activeKid;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderEditorKidOptions();
  render();
  if (meta.source === "realtime") showToast("已同步另一台设备的更新");
}

function updateCloudStatus(info) {
  const labels = {
    local: "● 本地模式",
    setup: "● 等待启用云端",
    syncing: "● 正在同步",
    synced: "● 云端已同步",
    offline: "● 离线保存",
    conflict: "● 已载入新数据"
  };
  refs.cloudStatus.className = `cloud-status ${info.status}`;
  refs.cloudStatus.textContent = labels[info.status] || "● 本地模式";
  refs.cloudStatus.title = info.message || "";
  refs.cloudSetupMessage.textContent = info.message || "第一次使用请创建家庭空间；其他手机用邀请码和家长 PIN 加入。";

  const connected = Boolean(info.familyId);
  refs.cloudSetupForms.hidden = connected;
  refs.cloudConnectedInfo.hidden = !connected;
  if (connected) refs.connectedInviteCode.textContent = info.inviteCode || "刷新后显示";
}

async function createCloudFamily(event) {
  event.preventDefault();
  const name = refs.familyName.value.trim();
  const pin = refs.createFamilyPin.value;
  setCloudFormsDisabled(true);
  try {
    const info = await window.CloudStore.createFamily(name, pin, state);
    refs.createFamilyPin.value = "";
    refs.connectedInviteCode.textContent = info.inviteCode;
    refs.cloudSetupForms.hidden = true;
    refs.cloudConnectedInfo.hidden = false;
    showToast("家庭空间已创建，本地数据已上传");
  } catch (error) {
    refs.cloudSetupMessage.textContent = window.CloudStore.friendlyError(error);
  } finally {
    setCloudFormsDisabled(false);
  }
}

async function joinCloudFamily(event) {
  event.preventDefault();
  const code = refs.familyInviteCode.value.trim().toUpperCase();
  const pin = refs.joinFamilyPin.value;
  setCloudFormsDisabled(true);
  try {
    const info = await window.CloudStore.joinFamily(code, pin);
    refs.joinFamilyPin.value = "";
    refs.connectedInviteCode.textContent = info.inviteCode;
    refs.cloudSetupForms.hidden = true;
    refs.cloudConnectedInfo.hidden = false;
    showToast("已加入家庭空间");
  } catch (error) {
    refs.cloudSetupMessage.textContent = window.CloudStore.friendlyError(error);
  } finally {
    setCloudFormsDisabled(false);
  }
}

function setCloudFormsDisabled(disabled) {
  refs.cloudSetup.querySelectorAll("input, button[type='submit']").forEach((element) => {
    element.disabled = disabled;
  });
}

function getDay(kidId, date) {
  state.days[kidId] ||= {};
  if (!state.days[kidId][date]) {
    state.days[kidId][date] = buildDefaultDay(date, kidId);
    saveState();
  }
  return state.days[kidId][date];
}

function buildDefaultDay(date, kidId = editorKid) {
  return {
    tasks: applyOverallSettings(kidId, buildRawTasks(date)),
    mistakes: "",
    note: "",
    planScope: "overall"
  };
}

function buildRawTasks(date) {
  const index = dayOffset(state.startDate, date);
  const cycle = modulo(index, 28);
  const weekCycle = modulo(index, 7);
  const raz = razPlan[cycle];
  return [
      task("raz", "英语 RAZ", raz.books, raz.words, `先听一遍音频；自己指读；找出目标词；最后说一句。${raz.note}`, false),
      task("writing", "写字练习", writingTasks[weekCycle], ["坐姿", "笔顺", "整洁"], "摆好坐姿；慢慢写；写完圈出最满意的 3 个字。"),
      task("poem", "古诗背诵", poems[cycle], ["读顺", "理解", "背诵"], "先读 3 遍；遮住一句试着背；卡住就看一眼再来。"),
      task("math", "数学练习", mathTasks[modulo(index, mathTasks.length)], ["口答", "订正"], "先独立完成；把不会的题圈起来；最后只检查圈出的题。"),
      task("reading", "课外阅读", readingTasks[weekCycle], ["安静读", "说一句"], "定时安静阅读；结束后说一个人物或一件发生的事。"),
      task("listening", "英语听力", weekCycle === 6 ? "自选 Big Muzzy 或英文西游记一集" : "Big Muzzy / 英文西游记 15 分钟", ["只听", "不考试"], "选一段播放；专心听完；告诉家人你听到了谁。")
    ];
}

function applyOverallSettings(kidId, tasks) {
  const settings = state.taskSettings?.[kidId] || {};
  return tasks
    .filter((item) => settings[item.id]?.enabled !== false)
    .map((item) => ({
      ...item,
      title: settings[item.id]?.title || item.title,
      instruction: settings[item.id]?.instruction || item.instruction
    }));
}

function task(id, title, detail, tags, instruction, done = false) {
  return { id, title, detail, tags, instruction, done };
}

function render() {
  refs.datePicker.value = selectedDate;
  renderKidSwitcher();
  renderKidView();
  renderFamilyOverview();
  renderOverallEditor();
  renderRangePreview();
  renderPlanPeriods();
  renderEditor();
}

function renderKidSwitcher() {
  refs.kidSwitcher.innerHTML = profiles.map((profile) => `
    <button class="kid-tab ${profile.id === activeKid ? "active" : ""}" type="button" data-kid="${profile.id}"
      style="--kid-color:${profile.color};--kid-soft:${profile.soft}">
      <span class="kid-mini"><img src="${profile.avatar}" data-kid="${profile.id}" alt=""></span><span>${profile.name}的任务</span>
    </button>`).join("");
  refs.kidSwitcher.querySelectorAll("[data-kid]").forEach((button) => {
    button.addEventListener("click", () => {
      activeKid = button.dataset.kid;
      editorKid = activeKid;
      refs.editorKid.value = editorKid;
      saveState();
      render();
    });
  });
}

function renderEditorKidOptions() {
  const options = profiles.map((profile) => `<option value="${profile.id}">${profile.name}</option>`).join("");
  refs.editorKid.innerHTML = options;
  refs.overallKid.innerHTML = options;
  refs.editorKid.value = editorKid;
  refs.overallKid.value = editorKid;
}

function renderKidView() {
  const profile = profileById(activeKid);
  const day = getDay(activeKid, selectedDate);
  const done = day.tasks.filter((item) => item.done).length;
  const total = day.tasks.length;
  const percent = Math.round((done / total) * 100);
  document.documentElement.style.setProperty("--kid-color", profile.color);
  document.documentElement.style.setProperty("--kid-soft", profile.soft);
  refs.avatar.innerHTML = `<img src="${profile.avatar}" data-kid="${profile.id}" alt="${profile.character}">`;
  refs.kidName.textContent = profile.name;
  refs.dateLabel.textContent = formatDateLabel(selectedDate);
  refs.progressText.textContent = `${done}/${total}`;
  refs.progressBar.style.width = `${percent}%`;
  refs.sunCount.textContent = availableSun(activeKid);
  refs.rewardBalance.textContent = availableSun(activeKid);
  refs.streakCount.textContent = streakFor(activeKid, selectedDate);
  refs.timeEstimate.textContent = `大约 ${day.tasks.reduce((sum, item) => sum + (categories[item.id]?.minutes || 10), 0)} 分钟`;
  refs.encouragement.textContent = encouragement(done, total);
  refs.finishCard.hidden = done !== total;
  renderTasks(day);
  renderSharedWorld();
  renderBattle();
  renderRewards();
}

function renderTasks(day) {
  refs.taskList.innerHTML = "";
  day.tasks.forEach((item, index) => {
    const category = categories[item.id] || categories.reading;
    const card = document.createElement("article");
    card.className = `task-card ${item.done ? "done" : ""}`;
    card.style.setProperty("--task-color", category.color);
    card.style.setProperty("--task-soft", category.soft);
    card.innerHTML = `
      <div class="task-icon">${category.icon}</div>
      <div>
        <span class="task-order">第 ${index + 1} 项 · ${category.minutes} 分钟</span>
        <h3 class="task-title">${escapeHTML(item.title)}</h3>
        <p class="task-detail">${escapeHTML(item.detail)}</p>
        <p class="how-to"><strong>怎么做：</strong>${escapeHTML(item.instruction || "完成后点右边的按钮。")}</p>
        <div class="word-row">${(item.tags || []).map((tag) => `<span class="word-chip">${escapeHTML(tag)}</span>`).join("")}</div>
      </div>
      <button class="complete-button" type="button">${item.done ? "✓ 已完成" : `完成 +10☀`}</button>`;
    card.querySelector(".complete-button").addEventListener("click", () => toggleTask(item));
    refs.taskList.appendChild(card);
  });
}

function toggleTask(item) {
  item.done = !item.done;
  saveState();
  showToast(item.done ? "做得好！获得 10 阳光 ☀" : "已取消完成");
  render();
}

function renderRewards() {
  const totalSun = earnedSun(activeKid);
  const squad = state.gardens[activeKid];
  refs.rewardList.innerHTML = plants.map((plant) => {
    const unlocked = totalSun >= plant.unlockAt;
    const planted = squad.includes(plant.id);
    const squadFull = squad.length >= 5;
    return `<article class="reward-card">
      <div class="reward-icon">${plant.icon}</div>
      <h3>${escapeHTML(plant.name)}</h3>
      <p class="plant-power">${escapeHTML(plant.power)}</p>
      <span class="reward-cost">${unlocked ? "✓ 已永久解锁" : `${plant.unlockAt} ☀ 解锁`}</span>
      <button class="reward-button" type="button" data-plant="${plant.id}" ${(!unlocked || (squadFull && !planted)) ? "disabled" : ""}>
        ${planted ? "已出战 · 点击收回" : unlocked ? (squadFull ? "小队已满" : "加入小队") : `还差 ${plant.unlockAt - totalSun} ☀`}
      </button>
    </article>`;
  }).join("");
  refs.rewardList.querySelectorAll("[data-plant]").forEach((button) => {
    button.addEventListener("click", () => togglePlant(button.dataset.plant));
  });
}

function togglePlant(plantId) {
  const plant = plants.find((item) => item.id === plantId);
  const squad = state.gardens[activeKid];
  const index = squad.indexOf(plantId);
  if (!plant) return;
  if (index >= 0) squad.splice(index, 1);
  else if (earnedSun(activeKid) >= plant.unlockAt && squad.length < 5) squad.push(plantId);
  else return;
  saveState();
  showToast(index >= 0 ? `${plant.name}回到植物商店啦` : `${plant.name}加入小队，阳光没有减少`);
  render();
}

function renderBattle() {
  const battle = sharedBattleProgress(selectedDate);
  const { brotherDone, youngerDone, brotherTotal, youngerTotal, done, total } = battle;
  const percent = total ? Math.round(done / total * 100) : 0;
  const skillSteps = jointSkills.map((skill, index) => ({ ...skill, at: Math.max(1, Math.round(total * (index + 1) / jointSkills.length)) }));
  const brotherSquad = resolvedSquad("brother");
  const youngerSquad = resolvedSquad("younger");
  renderGardenSquad("brother", refs.brotherGardenSlots, brotherSquad);
  renderGardenSquad("younger", refs.youngerGardenSlots, youngerSquad);
  refs.battleBar.style.width = `${percent}%`;
  refs.gardenGameEyebrow.textContent = `兄弟合力，共守 ${total} 波`;
  refs.battleStatus.textContent = done === total ? "联合守卫成功！" : `${done}/${total} 波`;
  refs.battleStatus.classList.toggle("won", done === total);
  const peas = Array.from({ length: Math.min(done, total) }, () => "<span class=\"pea\">●</span>").join("");
  const zombieLeft = Math.min(84, 30 + percent * 0.54);
  refs.battleLane.innerHTML = `
    <div class="battle-team battle-team-brother"><b>哥哥 ${brotherDone}/${brotherTotal}</b><div class="battle-plants" aria-label="哥哥出战植物">${battleDefenders(brotherSquad).map(plantIcon).join("")}</div></div>
    <div class="battle-team battle-team-younger"><b>弟弟 ${youngerDone}/${youngerTotal}</b><div class="battle-plants" aria-label="弟弟出战植物">${battleDefenders(youngerSquad).map(plantIcon).join("")}</div></div>
    <div class="pea-stream">${peas}</div>
    ${done === total ? `<div class="zombie defeated" style="left:${zombieLeft}%">💥</div>` : `<div class="zombie" style="left:${zombieLeft}%">🧟</div>`}
    <div class="garden-gate">🏡</div>`;
  refs.jointSkills.innerHTML = skillSteps.map((skill) => {
    const unlocked = done >= skill.at;
    return `<div class="joint-skill ${unlocked ? "unlocked" : ""}"><span>${skill.icon}</span><strong>${escapeHTML(skill.name)}</strong><small>${unlocked ? "已触发" : `${skill.at} 波触发`}</small></div>`;
  }).join("");
  refs.characterInteraction.innerHTML = characterInteraction(battle, skillSteps);
  refs.battleMessage.textContent = done === total
    ? `${total} 项共同进度全部完成，两支小队一起守住花园！`
    : done === 0
      ? "哥哥和弟弟完成的每一项都会汇入同一条防线。"
      : `两人已经合力击退 ${done} 波，再完成 ${total - done} 项就能守住花园。`;
}

function sharedBattleProgress(date) {
  const brotherDay = getDay("brother", date);
  const youngerDay = getDay("younger", date);
  const brotherDone = brotherDay.tasks.filter((item) => item.done).length;
  const youngerDone = youngerDay.tasks.filter((item) => item.done).length;
  const brotherTotal = brotherDay.tasks.length;
  const youngerTotal = youngerDay.tasks.length;
  return { brotherDone, youngerDone, brotherTotal, youngerTotal, done: brotherDone + youngerDone, total: brotherTotal + youngerTotal };
}

function resolvedSquad(kidId) {
  return state.gardens[kidId].map((id) => plants.find((plant) => plant.id === id)).filter(Boolean);
}

function battleDefenders(squad) {
  return squad.length ? squad : [{ icon: "🌱", name: "小幼苗" }];
}

function plantIcon(plant) {
  return `<span title="${escapeAttr(plant.name)}">${plant.icon}</span>`;
}

function renderGardenSquad(kidId, container, squad) {
  const editable = kidId === activeKid;
  container.closest(".team-garden").classList.toggle("active", editable);
  container.innerHTML = [0, 1, 2, 3, 4].map((index) => {
    const plant = squad[index];
    if (!plant) return `<div class="garden-slot"><span>＋</span><small>空位</small></div>`;
    return editable
      ? `<button class="garden-slot filled" type="button" data-planted="${plant.id}" title="点击收回${escapeAttr(plant.name)}"><span>${plant.icon}</span><small>${escapeHTML(plant.name)}</small></button>`
      : `<div class="garden-slot filled" title="${escapeAttr(plant.name)}"><span>${plant.icon}</span><small>${escapeHTML(plant.name)}</small></div>`;
  }).join("");
  container.querySelectorAll("[data-planted]").forEach((button) => {
    button.addEventListener("click", () => togglePlant(button.dataset.planted));
  });
}

function characterInteraction({ brotherDone, youngerDone, brotherTotal, youngerTotal, done, total }, skillSteps) {
  if (done === total) return `<span>🐱 乌龙：守住啦！</span><b>🙌</b><span>🐶 哈小浪：我们的合力最厉害！</span>`;
  if (done === 0) return `<span>🐱 乌龙：我守左边！</span><b>🤝</b><span>🐶 哈小浪：我守右边！</span>`;
  if (brotherDone === brotherTotal && youngerDone < youngerTotal) return `<span>🐱 乌龙：我的小队来支援你！</span><b>💫</b><span>🐶 哈小浪：收到，一起守到最后！</span>`;
  if (youngerDone === youngerTotal && brotherDone < brotherTotal) return `<span>🐶 哈小浪：我的小队来支援你！</span><b>💫</b><span>🐱 乌龙：收到，一起守到最后！</span>`;
  const nextSkill = skillSteps.find((skill) => done < skill.at) || skillSteps[skillSteps.length - 1];
  return `<span>🐱 乌龙：豌豆准备！</span><b>⚔️</b><span>🐶 哈小浪：再 ${Math.max(0, nextSkill.at - done)} 项触发${escapeHTML(nextSkill.name)}！</span>`;
}

function renderSharedWorld() {
  const jointDates = jointCompletionDates();
  const litCount = Math.min(countryCodes.length, jointDates.length * COUNTRIES_PER_JOINT_DAY);
  const percent = Math.round(litCount / countryCodes.length * 100);
  const brotherDay = getDay("brother", selectedDate);
  const youngerDay = getDay("younger", selectedDate);
  const brotherDone = brotherDay.tasks.filter((item) => item.done).length;
  const youngerDone = youngerDay.tasks.filter((item) => item.done).length;
  const brotherComplete = isDayComplete(brotherDay);
  const youngerComplete = isDayComplete(youngerDay);

  refs.jointDays.textContent = jointDates.length;
  refs.worldProgressText.textContent = `${litCount}/${countryCodes.length} 个国家`;
  refs.worldProgressBar.style.width = `${percent}%`;
  decorateWorldMap(litCount);
  renderWorldTrail(litCount);

  if (litCount === countryCodes.length) {
    refs.worldMessage.textContent = "整个世界都被双星点亮啦！";
    refs.nextCountries.innerHTML = `<strong>🌍 世界点亮完成</strong><span>每一个共同完成日都算数。</span>`;
    return;
  }

  if (brotherComplete && youngerComplete) {
    const todayIndex = jointDates.indexOf(selectedDate);
    const start = todayIndex >= 0 ? todayIndex : Math.max(0, litCount - 1);
    const todayCode = countryCodes[start];
    refs.worldMessage.textContent = `今天双星会合，共同点亮 ${countryName(todayCode)}！`;
  } else if (brotherComplete) {
    refs.worldMessage.textContent = `哥哥已就位，弟弟再完成 ${youngerDay.tasks.length - youngerDone} 项就能一起点亮世界。`;
  } else if (youngerComplete) {
    refs.worldMessage.textContent = `弟弟已就位，哥哥再完成 ${brotherDay.tasks.length - brotherDone} 项就能一起点亮世界。`;
  } else {
    refs.worldMessage.textContent = `哥哥完成 ${brotherDone}/${brotherDay.tasks.length}，弟弟完成 ${youngerDone}/${youngerDay.tasks.length}；两人都完成就点亮 1 个国家。`;
  }

  const upcomingCode = countryCodes[litCount];
  refs.nextCountries.innerHTML = upcomingCode
    ? `<strong>下一站</strong><span>${countryFlag(upcomingCode)} ${escapeHTML(countryName(upcomingCode))}</span><small>还剩 ${countryCodes.length - litCount} 个国家</small>`
    : "";
}

async function loadWorldMap() {
  try {
    const response = await fetch(WORLD_MAP_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.text();
    const svg = new DOMParser().parseFromString(source, "image/svg+xml").documentElement;
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("viewBox", "0 0 2754 1398");
    svg.setAttribute("aria-hidden", "true");
    refs.worldMap.replaceChildren(document.importNode(svg, true));
    decorateWorldMap(Math.min(countryCodes.length, jointCompletionDates().length));
  } catch (error) {
    console.warn("World map failed to load.", error);
    renderWorldMapFallback();
  }
}

function renderWorldMapFallback() {
  const image = document.createElement("img");
  const note = document.createElement("span");
  image.className = "world-map-fallback";
  image.alt = "世界地图（兼容模式）";
  note.className = "world-map-compat-note";
  note.textContent = "正在用兼容模式展开地图…";
  image.addEventListener("load", () => {
    note.textContent = "兼容模式 · 点亮进度以上方数字和足迹为准";
  }, { once: true });
  image.addEventListener("error", () => {
    note.textContent = "地图图片加载失败，请检查当前网络后重试";
  }, { once: true });
  image.src = WORLD_MAP_URL;
  refs.worldMap.replaceChildren(image, note);
}

function decorateWorldMap(litCount) {
  const svg = refs.worldMap.querySelector("svg");
  if (!svg) return;
  svg.querySelectorAll(".world-lit, .world-recent, .world-current").forEach((element) => element.classList.remove("world-lit", "world-recent", "world-current"));
  countryCodes.slice(0, litCount).forEach((code, index) => {
    svg.querySelectorAll(`.landxx.${code.toLowerCase()}`).forEach((element) => {
      element.classList.add("world-lit");
      if (index >= litCount - 5) element.classList.add("world-recent");
      if (index === litCount - 1) element.classList.add("world-current");
    });
  });
}

function renderWorldTrail(litCount) {
  if (litCount === 0) {
    refs.worldTrail.innerHTML = `<strong>扩张起点</strong><span class="next">${countryFlag("CN")} 中国</span>`;
    return;
  }
  const start = Math.max(0, litCount - 4);
  const trail = countryCodes.slice(start, Math.min(countryCodes.length, litCount + 1));
  refs.worldTrail.innerHTML = `<strong>最近足迹</strong>${trail.map((code, index) => {
    const isNext = start + index === litCount;
    return `${index ? "<i>→</i>" : ""}<span class="${isNext ? "next" : "done"}">${countryFlag(code)} ${escapeHTML(countryName(code))}</span>`;
  }).join("")}`;
}

function countryName(code) {
  return regionNames?.of(code) || code;
}

function countryFlag(code) {
  return String.fromCodePoint(...code.split("").map((character) => 127397 + character.charCodeAt(0)));
}

function jointCompletionDates() {
  return Object.keys(state.days.brother || {})
    .filter((date) => isDayComplete(state.days.brother[date]) && isDayComplete(state.days.younger?.[date]))
    .sort();
}

function isDayComplete(day) {
  return Boolean(day?.tasks?.length && day.tasks.every((item) => item.done));
}

function renderFamilyOverview() {
  refs.familyOverview.innerHTML = profiles.map((profile) => {
    const day = getDay(profile.id, selectedDate);
    const done = day.tasks.filter((item) => item.done).length;
    const percent = Math.round(done / day.tasks.length * 100);
    const status = done === day.tasks.length ? "今日完成" : done ? `还剩 ${day.tasks.length - done} 项` : "尚未开始";
    return `<article class="overview-card" style="--kid-color:${profile.color};--kid-soft:${profile.soft}">
      <div class="overview-top"><span class="overview-name"><span class="kid-mini"><img src="${profile.avatar}" data-kid="${profile.id}" alt=""></span>${profile.name}</span><span class="overview-status">${status}</span></div>
      <div class="overview-progress"><div style="width:${percent}%"></div></div>
      <div class="overview-meta"><span>${done}/${day.tasks.length} 项</span><span>${earnedSun(profile.id)} 累计阳光</span></div>
    </article>`;
  }).join("");
}

function renderEditor() {
  const profile = profileById(editorKid);
  const day = getDay(editorKid, selectedDate);
  refs.editorKid.value = editorKid;
  refs.editorTitle.textContent = `${profile.name} · ${formatDateLabel(selectedDate)}`;
  refs.taskEditor.innerHTML = day.tasks.map((item, index) => `
    <details class="edit-row">
      <summary>${escapeHTML(item.title)} · ${item.done ? "已完成" : "未完成"}</summary>
      <div class="edit-fields">
        <label class="completion-check"><input type="checkbox" data-field="done" data-index="${index}" ${item.done ? "checked" : ""}><span>这项已完成（可用于登记补做）</span></label>
        <div class="edit-grid">
          <label>任务名称<input data-field="title" data-index="${index}" value="${escapeAttr(item.title)}"></label>
          <label>关键词<input data-field="tags" data-index="${index}" value="${escapeAttr((item.tags || []).join(", "))}"></label>
        </div>
        <label>今天做什么<textarea data-field="detail" data-index="${index}" rows="3">${escapeHTML(item.detail)}</textarea></label>
        <label>孩子看到的步骤<textarea data-field="instruction" data-index="${index}" rows="3">${escapeHTML(item.instruction || "")}</textarea></label>
      </div>
    </details>`).join("");
  refs.mistakeBox.value = day.mistakes || "";
  refs.parentNote.value = day.note || "";
}

function renderOverallEditor() {
  const settings = state.taskSettings[editorKid] || {};
  refs.overallKid.value = editorKid;
  refs.overallTaskEditor.innerHTML = buildRawTasks(selectedDate).map((item) => {
    const setting = settings[item.id] || {};
    const enabled = setting.enabled !== false;
    return `<div class="overall-task-row ${enabled ? "" : "disabled"}">
      <label class="overall-task-toggle"><input type="checkbox" data-overall-id="${item.id}" data-overall-field="enabled" ${enabled ? "checked" : ""}><span>显示</span></label>
      <input data-overall-id="${item.id}" data-overall-field="title" aria-label="${escapeAttr(item.title)}的总体名称" value="${escapeAttr(setting.title || item.title)}">
      <input data-overall-id="${item.id}" data-overall-field="instruction" aria-label="${escapeAttr(item.title)}的总体步骤" value="${escapeAttr(setting.instruction || item.instruction)}">
    </div>`;
  }).join("");
  refs.overallTaskEditor.querySelectorAll('[data-overall-field="enabled"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => checkbox.closest(".overall-task-row").classList.toggle("disabled", !checkbox.checked));
  });
}

function saveOverallPlan() {
  const draft = {};
  refs.overallTaskEditor.querySelectorAll("[data-overall-id]").forEach((field) => {
    const id = field.dataset.overallId;
    draft[id] ||= {};
    draft[id][field.dataset.overallField] = field.dataset.overallField === "enabled" ? field.checked : field.value.trim();
  });
  if (!Object.values(draft).some((item) => item.enabled)) {
    showToast("总体任务至少保留一项");
    return;
  }
  const defaults = Object.fromEntries(buildRawTasks(selectedDate).map((item) => [item.id, item]));
  const next = Object.fromEntries(defaultTaskIds.map((id) => {
    const item = { enabled: draft[id].enabled };
    if (draft[id].title && draft[id].title !== defaults[id].title) item.title = draft[id].title;
    if (draft[id].instruction && draft[id].instruction !== defaults[id].instruction) item.instruction = draft[id].instruction;
    return [id, item];
  }));
  state.taskSettings[editorKid] = next;
  refreshGeneratedFutureDays(editorKid);
  saveState();
  showToast(`${profileById(editorKid).name}的总体任务已保存`);
  render();
}

function resetOverallPlan() {
  if (!window.confirm(`恢复${profileById(editorKid).name}的原始总体任务？日期区间和已完成记录不会被删除。`)) return;
  state.taskSettings[editorKid] = {};
  refreshGeneratedFutureDays(editorKid);
  saveState();
  showToast("已恢复原始总体任务");
  render();
}

function refreshGeneratedFutureDays(kidId) {
  const today = toISODate(new Date());
  Object.entries(state.days[kidId] || {}).forEach(([date, day]) => {
    if (date < today || day.planPeriodId || day.planScope === "day" || day.tasks.some((item) => item.done)) return;
    state.days[kidId][date] = preserveDayNotes(buildDefaultDay(date, kidId), day);
  });
}

function renderRangePreview() {
  if (!refs.rangePreview) return;
  const target = refs.rangeKid.value === "both" ? "哥哥和弟弟" : profileById(refs.rangeKid.value).name;
  const start = refs.rangeStart.value;
  const end = refs.rangeEnd.value;
  const preset = refs.rangePreset.value;
  refs.rangePreview.textContent = preset === "hand-recovery"
    ? `${target}：${displayDateRange(start, end)}使用手部休养计划；写字和书面数学将替换为中文口述与英语口语。`
    : `${target}：${displayDateRange(start, end)}按当前总体任务重新生成。`;
}

function applyRangePlan() {
  const start = refs.rangeStart.value;
  const end = refs.rangeEnd.value;
  const dates = datesBetween(start, end);
  if (!dates.length) {
    showToast("请选择正确的开始和结束日期");
    return;
  }
  if (dates.length > 62) {
    showToast("一次最多安排 62 天");
    return;
  }
  const kidIds = refs.rangeKid.value === "both" ? ["brother", "younger"] : [refs.rangeKid.value];
  const hasCompleted = kidIds.some((kidId) => dates.some((date) => state.days[kidId]?.[date]?.tasks?.some((item) => item.done)));
  if (hasCompleted && !window.confirm("所选日期已有完成记录。继续会保留同名任务的完成状态，但被替换的任务需要重新确认，是否继续？")) return;

  const preset = refs.rangePreset.value;
  const periodId = `period-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  kidIds.forEach((kidId) => {
    dates.forEach((date) => {
      const existing = state.days[kidId]?.[date];
      const next = preset === "hand-recovery" ? buildHandRecoveryDay(date, kidId) : buildDefaultDay(date, kidId);
      next.planScope = "range";
      next.planPeriodId = periodId;
      state.days[kidId][date] = preserveDayState(next, existing);
    });
  });
  state.planPeriods.push({ id: periodId, kidIds, startDate: start, endDate: end, preset });
  saveState();
  showToast(`已安排 ${dates.length} 天，两个手机会自动同步`);
  render();
}

function buildHandRecoveryDay(date, kidId) {
  const base = buildRawTasks(date).map((item) => {
    const setting = state.taskSettings[kidId]?.[item.id] || {};
    return { ...item, title: setting.title || item.title, instruction: setting.instruction || item.instruction };
  });
  const tasks = base.map((item) => {
    if (item.id === "writing") return task("retelling", "中文朗读与复述", "朗读一段喜欢的故事，再口头讲出发生了什么", ["朗读", "复述", "不动笔"], "舒服地坐好；朗读 10–15 分钟；最后用自己的话讲一遍，不需要写字。");
    if (item.id === "math") return task("speaking", "英语口语练习", "复述今天的 RAZ，或用目标句型说 3 句话", ["开口说", "RAZ", "不动笔"], "先跟读今天的句子；再合上书说一遍；最后任选 3 个词造句。");
    return item;
  });
  return { tasks, mistakes: "", note: "", planScope: "range" };
}

function renderPlanPeriods() {
  refs.planPeriodList.innerHTML = state.planPeriods.slice().reverse().map((period) => {
    const kids = period.kidIds.map((kidId) => profileById(kidId).name).join("和");
    const name = period.preset === "hand-recovery" ? "手部休养" : "总体任务";
    return `<div class="plan-period-item"><div><strong>${escapeHTML(name)} · ${escapeHTML(kids)}</strong><span>${escapeHTML(displayDateRange(period.startDate, period.endDate))}</span></div><button type="button" data-remove-period="${escapeAttr(period.id)}">取消安排</button></div>`;
  }).join("");
  refs.planPeriodList.querySelectorAll("[data-remove-period]").forEach((button) => {
    button.addEventListener("click", () => removePlanPeriod(button.dataset.removePeriod));
  });
}

function removePlanPeriod(periodId) {
  const period = state.planPeriods.find((item) => item.id === periodId);
  if (!period || !window.confirm("取消这段安排并恢复总体任务？已经完成的同名任务会继续保留。")) return;
  datesBetween(period.startDate, period.endDate).forEach((date) => {
    period.kidIds.forEach((kidId) => {
      const existing = state.days[kidId]?.[date];
      if (existing?.planPeriodId !== periodId) return;
      state.days[kidId][date] = preserveDayState(buildDefaultDay(date, kidId), existing);
    });
  });
  state.planPeriods = state.planPeriods.filter((item) => item.id !== periodId);
  saveState();
  showToast("日期区间已恢复总体任务");
  render();
}

function preserveDayState(next, existing) {
  if (!existing) return next;
  const completedIds = new Set(existing.tasks.filter((item) => item.done).map((item) => item.id));
  next.tasks.forEach((item) => { item.done = completedIds.has(item.id); });
  return preserveDayNotes(next, existing);
}

function preserveDayNotes(next, existing) {
  next.mistakes = existing?.mistakes || "";
  next.note = existing?.note || next.note || "";
  return next;
}

function datesBetween(start, end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || "") || !/^\d{4}-\d{2}-\d{2}$/.test(end || "") || start > end) return [];
  const dates = [];
  let cursor = parseISODate(start);
  const finish = parseISODate(end);
  while (cursor <= finish && dates.length <= 62) {
    dates.push(toISODate(cursor));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function displayDateRange(start, end) {
  if (!start || !end) return "请选择日期";
  return `${start.slice(5).replace("-", "月")}日–${end.slice(5).replace("-", "月")}日`;
}

function saveParentEdits() {
  const day = getDay(editorKid, selectedDate);
  refs.taskEditor.querySelectorAll("[data-field]").forEach((field) => {
    const item = day.tasks[Number(field.dataset.index)];
    if (!item) return;
    item[field.dataset.field] = field.dataset.field === "done"
      ? field.checked
      : field.dataset.field === "tags"
        ? field.value.split(",").map((value) => value.trim()).filter(Boolean)
        : field.value.trim();
  });
  day.mistakes = refs.mistakeBox.value.trim();
  day.note = refs.parentNote.value.trim();
  day.planScope = "day";
  delete day.planPeriodId;
  saveState();
  showToast("当天计划与补做状态已保存");
  render();
}

function resetCurrentDay() {
  state.days[editorKid][selectedDate] = buildDefaultDay(selectedDate, editorKid);
  saveState();
  showToast("已恢复默认任务");
  render();
}

function setView(view) {
  currentView = view;
  refs.kidView.classList.toggle("active", view === "kid");
  refs.parentView.classList.toggle("active", view === "parent");
  refs.kidSwitcher.hidden = view !== "kid";
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function moveDay(delta) {
  selectedDate = toISODate(addDays(parseISODate(selectedDate), delta));
  render();
}

function earnedSun(kidId) {
  return Object.values(state.days[kidId] || {}).reduce((sum, day) => sum + day.tasks.filter((item) => item.done).length * 10, 0);
}

function availableSun(kidId) {
  return earnedSun(kidId);
}

function streakFor(kidId, date) {
  let cursor = parseISODate(date);
  let streak = 0;
  for (let index = 0; index < 365; index += 1) {
    const day = state.days[kidId]?.[toISODate(cursor)];
    if (!day || !day.tasks.length || !day.tasks.every((item) => item.done)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function encouragement(done, total) {
  if (done === total) return "全部完成啦，学习岛今天元气满满！";
  if (done === 0) return "从第一项开始，不会的先圈起来，最后再求助。";
  if (done >= total - 1) return "只差最后一点，坚持完成就能点亮花园。";
  return `已经完成 ${done} 项，照着卡片上的步骤继续吧。`;
}

function profileById(id) {
  return profiles.find((profile) => profile.id === id) || profiles[0];
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function showToast(message) {
  clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.add("show");
  toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 1800);
}

function toISODate(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dayOffset(startISO, targetISO) {
  const start = parseISODate(startISO);
  const target = parseISODate(targetISO);
  return Math.round((target - start) / 86400000);
}

function formatDateLabel(value) {
  const date = parseISODate(value);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value).replaceAll("\n", " ");
}
