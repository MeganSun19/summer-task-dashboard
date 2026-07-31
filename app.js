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

const defaultRewards = [
  { id: "story", icon: "📖", name: "选择今晚的故事", cost: 30 },
  { id: "cartoon", icon: "📺", name: "动画时间 20 分钟", cost: 60 },
  { id: "family-game", icon: "🎲", name: "选择一次家庭游戏", cost: 100 },
  { id: "surprise", icon: "🎁", name: "兑换一个小惊喜", cost: 150 }
];

const categories = {
  raz: { icon: "Aa", color: "#4f83d1", soft: "#eaf2ff", minutes: 30 },
  writing: { icon: "字", color: "#48a978", soft: "#e6f6ec", minutes: 15 },
  poem: { icon: "诗", color: "#b98222", soft: "#fff2c7", minutes: 10 },
  math: { icon: "×", color: "#df746e", soft: "#ffedeb", minutes: 15 },
  reading: { icon: "读", color: "#7e69c8", soft: "#f0edff", minutes: 20 },
  listening: { icon: "▶", color: "#2e9a9a", soft: "#e3f7f6", minutes: 15 }
};

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
  "rewardBalance", "rewardList", "kidRedemptions", "datePicker", "familyOverview", "editorKid", "editorTitle",
  "taskEditor", "mistakeBox", "parentNote", "redemptionQueue", "rewardAdminList", "rewardForm", "rewardName",
  "rewardCost", "toast", "cloudStatus", "cloudSetup", "closeCloudSetup", "cloudSetupMessage", "cloudSetupForms",
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
  renderEditor();
});
document.getElementById("saveParent").addEventListener("click", saveParentEdits);
document.getElementById("resetDay").addEventListener("click", resetCurrentDay);
refs.rewardForm.addEventListener("submit", addReward);
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
render();
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
  current.rewards ||= structuredClone(defaultRewards);
  current.redemptions ||= [];
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
    state.days[kidId][date] = buildDefaultDay(date);
    saveState();
  }
  return state.days[kidId][date];
}

function buildDefaultDay(date) {
  const index = dayOffset(state.startDate, date);
  const cycle = modulo(index, 28);
  const weekCycle = modulo(index, 7);
  const raz = razPlan[cycle];
  return {
    tasks: [
      task("raz", "英语 RAZ", raz.books, raz.words, `先听一遍音频；自己指读；找出目标词；最后说一句。${raz.note}`, false),
      task("writing", "写字练习", writingTasks[weekCycle], ["坐姿", "笔顺", "整洁"], "摆好坐姿；慢慢写；写完圈出最满意的 3 个字。"),
      task("poem", "古诗背诵", poems[cycle], ["读顺", "理解", "背诵"], "先读 3 遍；遮住一句试着背；卡住就看一眼再来。"),
      task("math", "数学练习", mathTasks[modulo(index, mathTasks.length)], ["口答", "订正"], "先独立完成；把不会的题圈起来；最后只检查圈出的题。"),
      task("reading", "课外阅读", readingTasks[weekCycle], ["安静读", "说一句"], "定时安静阅读；结束后说一个人物或一件发生的事。"),
      task("listening", "英语听力", weekCycle === 6 ? "自选 Big Muzzy 或英文西游记一集" : "Big Muzzy / 英文西游记 15 分钟", ["只听", "不考试"], "选一段播放；专心听完；告诉家人你听到了谁。")
    ],
    mistakes: "",
    note: ""
  };
}

function task(id, title, detail, tags, instruction, done = false) {
  return { id, title, detail, tags, instruction, done };
}

function render() {
  refs.datePicker.value = selectedDate;
  renderKidSwitcher();
  renderKidView();
  renderFamilyOverview();
  renderEditor();
  renderRewardAdmin();
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
  refs.editorKid.innerHTML = profiles.map((profile) => `<option value="${profile.id}">${profile.name}</option>`).join("");
  refs.editorKid.value = editorKid;
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
  const balance = availableSun(activeKid);
  refs.rewardList.innerHTML = state.rewards.map((reward) => {
    const enough = balance >= reward.cost;
    return `<article class="reward-card">
      <div class="reward-icon">${escapeHTML(reward.icon || "🎁")}</div>
      <h3>${escapeHTML(reward.name)}</h3>
      <span class="reward-cost">${reward.cost} ☀</span>
      <button class="reward-button" type="button" data-reward="${escapeAttr(reward.id)}" ${enough ? "" : "disabled"}>
        ${enough ? "申请兑换" : `还差 ${reward.cost - balance}`}
      </button>
    </article>`;
  }).join("");
  refs.rewardList.querySelectorAll("[data-reward]").forEach((button) => {
    button.addEventListener("click", () => requestReward(button.dataset.reward));
  });
  const recent = state.redemptions.filter((item) => item.kidId === activeKid).slice(-3).reverse();
  refs.kidRedemptions.innerHTML = recent.map((item) => `
    <div class="redemption-note"><span>${escapeHTML(item.rewardName)} · ${item.cost} ☀</span><strong>${redemptionStatus(item.status)}</strong></div>
  `).join("");
}

function requestReward(rewardId) {
  const reward = state.rewards.find((item) => item.id === rewardId);
  if (!reward || availableSun(activeKid) < reward.cost) return;
  state.redemptions.push({
    id: `redeem-${Date.now()}`,
    kidId: activeKid,
    rewardId: reward.id,
    rewardName: reward.name,
    cost: reward.cost,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  saveState();
  showToast("兑换申请已交给家长，阳光暂时保留");
  render();
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
      <div class="overview-meta"><span>${done}/${day.tasks.length} 项</span><span>${availableSun(profile.id)} 可用阳光</span></div>
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

function saveParentEdits() {
  const day = getDay(editorKid, selectedDate);
  refs.taskEditor.querySelectorAll("[data-field]").forEach((field) => {
    const item = day.tasks[Number(field.dataset.index)];
    if (!item) return;
    item[field.dataset.field] = field.dataset.field === "tags"
      ? field.value.split(",").map((value) => value.trim()).filter(Boolean)
      : field.value.trim();
  });
  day.mistakes = refs.mistakeBox.value.trim();
  day.note = refs.parentNote.value.trim();
  saveState();
  showToast("当天计划已保存");
  render();
}

function resetCurrentDay() {
  state.days[editorKid][selectedDate] = buildDefaultDay(selectedDate);
  saveState();
  showToast("已恢复默认任务");
  render();
}

function renderRewardAdmin() {
  const pending = state.redemptions.filter((item) => item.status === "pending").slice().reverse();
  refs.redemptionQueue.innerHTML = pending.length ? pending.map((item) => {
    const profile = profileById(item.kidId);
    return `<div class="queue-item">
      <div><strong>${profile.name}申请：${escapeHTML(item.rewardName)}</strong><small>${item.cost} 阳光 · ${formatTime(item.createdAt)}</small></div>
      <div class="queue-actions">
        <button class="approve-action" type="button" data-redemption="${item.id}" data-action="approved">同意</button>
        <button class="reject-action" type="button" data-redemption="${item.id}" data-action="rejected">退回</button>
      </div>
    </div>`;
  }).join("") : `<div class="queue-empty">目前没有待处理申请</div>`;
  refs.redemptionQueue.querySelectorAll("[data-redemption]").forEach((button) => {
    button.addEventListener("click", () => resolveRedemption(button.dataset.redemption, button.dataset.action));
  });
  refs.rewardAdminList.innerHTML = state.rewards.map((reward) => `
    <div class="admin-reward"><strong>${escapeHTML(reward.icon || "🎁")} ${escapeHTML(reward.name)}</strong><span>${reward.cost} 阳光</span></div>
  `).join("");
}

function addReward(event) {
  event.preventDefault();
  const name = refs.rewardName.value.trim();
  const cost = Number(refs.rewardCost.value);
  if (!name || !Number.isFinite(cost) || cost < 10) return;
  state.rewards.push({ id: `reward-${Date.now()}`, icon: "🎁", name, cost: Math.round(cost / 10) * 10 });
  refs.rewardForm.reset();
  saveState();
  showToast("新奖励已添加");
  render();
}

function resolveRedemption(id, status) {
  const redemption = state.redemptions.find((item) => item.id === id);
  if (!redemption || redemption.status !== "pending") return;
  redemption.status = status;
  redemption.resolvedAt = new Date().toISOString();
  saveState();
  showToast(status === "approved" ? "已同意兑换" : "已退回，阳光已经返还");
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

function spentSun(kidId) {
  return state.redemptions
    .filter((item) => item.kidId === kidId && item.status !== "rejected")
    .reduce((sum, item) => sum + item.cost, 0);
}

function availableSun(kidId) {
  return Math.max(0, earnedSun(kidId) - spentSun(kidId));
}

function redemptionStatus(status) {
  return { pending: "等待家长确认", approved: "兑换成功", rejected: "已退回阳光" }[status] || status;
}

function formatTime(value) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
