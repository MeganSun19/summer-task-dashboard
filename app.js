const STORAGE_KEY = "summer-task-dashboard-english-v1";
const LEGACY_STORAGE_KEY = "summer-task-dashboard-v1";
const DEVICE_SYNC_RECOVERY_KEY = "summer-task-dashboard-device-sync-recovery-v3";


const profiles = [
  { id: "brother", name: "哥哥", character: "乌龙", avatar: "./乌龙头像.png", color: "#ee7e48", soft: "#fff0e7" },
  { id: "younger", name: "弟弟", character: "哈小浪", avatar: "./哈小浪.png", color: "#4b8fd5", soft: "#e7f2ff" }
];

const plants = [
  { id: "sunflower", icon: "🌻", name: "向日葵", unlockAt: 10, power: "给小队加油" },
  { id: "peashooter", icon: "🌿", name: "豌豆射手", unlockAt: 30, power: "发射豌豆" },
  { id: "wallnut", icon: "🌰", name: "坚果墙", unlockAt: 60, power: "守住花园" },
  { id: "snowpea", icon: "❄️", name: "寒冰射手", unlockAt: 100, power: "冻住僵尸" },
  { id: "cherry", icon: "🍒", name: "樱桃炸弹", unlockAt: 160, power: "清理一大片" },
  { id: "melon", icon: "🍉", name: "西瓜投手", unlockAt: 240, power: "投出大西瓜" }
];
const GARDEN_SQUAD_LIMIT = 5;
const GRAMMAR_LESSON_BONUS_SUN = 5;

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

const moduleRegistry = window.LearningModules;
const planPresetRegistry = window.LearningPlanPresets;
const summerPlanRegistry = window.SummerPlanProgress;
const rewardRegistry = window.RewardProgress;

let state = loadState();
ensureState(state);
let selectedDate = toISODate(new Date());
let activeKid = state.activeKid || "brother";
let editorKid = activeKid;
let currentView = "kid";
let activeParentSection = "today";
let toastTimer;
let editingFamilyTaskScheduleId = null;

const refs = Object.fromEntries([
  "kidSwitcher", "kidView", "parentView", "avatar", "dateLabel", "kidName", "encouragement",
  "progressBar", "progressText", "sunCount", "streakCount", "timeEstimate", "taskList", "finishCard",
  "rewardBalance", "rewardList", "battleStatus", "battleLane", "battleBar", "battleMessage", "jointSkills", "characterInteraction",
  "brotherGardenSlots", "youngerGardenSlots",
  "worldProgressText", "jointDays", "worldMessage", "worldMap", "worldMapLoading", "worldProgressBar", "worldTrail", "nextCountries",
  "datePicker", "familyOverview", "editorKid", "editorTitle", "taskEditor", "mistakeBox", "parentNote",
  "gardenGameEyebrow", "overallKid", "overallTaskEditor", "rangeKid", "rangePreset", "rangeStart", "rangeEnd", "rangePreview", "planPeriodList",
  "courseReleaseStatus", "courseDraftTitle", "courseDraftGoal", "courseEffectiveDate", "courseStageEndDate", "saveCourseDraft", "previewCoursePlan", "coursePlanPreview", "courseReleaseList",
  "familyTaskForm", "familyTaskTitle", "familyTaskKid", "familyTaskDetail", "familyTaskInstruction", "familyTaskRecurrence",
  "familyTaskMinutes", "familyTaskStart", "familyTaskEnd", "familyTaskCustomRow", "familyTaskCustomDates", "familyTaskPreview",
  "publishFamilyTask", "cancelFamilyTaskEdit", "familyTaskScheduleList",
  "toast", "cloudStatus", "cloudSetup", "closeCloudSetup", "cloudSetupMessage", "cloudSetupForms",
  "createFamilyForm", "joinFamilyForm", "familyName", "createFamilyPin", "familyInviteCode", "joinFamilyPin",
  "familyChoice", "familyChoiceList", "cloudConnectedInfo", "connectedInviteCode", "joinedFamilyList",
  "switchFamilyDetails", "switchFamilyForm", "switchFamilyCode", "switchFamilyPin"
].map((id) => [id, document.getElementById(id)]));

document.getElementById("parentEntry").addEventListener("click", () => setView(currentView === "parent" ? "kid" : "parent"));
document.querySelectorAll("[data-nav-target]").forEach((button) => {
  button.addEventListener("click", () => navigateToSection(button.dataset.navTarget));
});
document.querySelectorAll("[data-parent-section]").forEach((button) => {
  button.addEventListener("click", () => setParentSection(button.dataset.parentSection));
});
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
  refs.coursePlanPreview.hidden = true;
  render();
});
document.getElementById("saveParent").addEventListener("click", saveParentEdits);
document.getElementById("resetDay").addEventListener("click", resetCurrentDay);
document.getElementById("saveOverallPlan").addEventListener("click", saveOverallPlan);
document.getElementById("resetOverallPlan").addEventListener("click", resetOverallPlan);
refs.saveCourseDraft.addEventListener("click", saveCourseDraft);
refs.previewCoursePlan.addEventListener("click", previewCoursePlan);
document.getElementById("applyRangePlan").addEventListener("click", applyRangePlan);
refs.familyTaskForm.addEventListener("submit", publishFamilyTask);
refs.cancelFamilyTaskEdit.addEventListener("click", resetFamilyTaskForm);
refs.familyTaskRecurrence.addEventListener("change", renderFamilyTaskPreview);
refs.familyTaskKid.addEventListener("change", renderFamilyTaskPreview);
refs.familyTaskStart.addEventListener("change", renderFamilyTaskPreview);
refs.familyTaskEnd.addEventListener("change", renderFamilyTaskPreview);
refs.familyTaskCustomDates.addEventListener("input", renderFamilyTaskPreview);
refs.rangePreset.addEventListener("change", renderRangePreview);
refs.rangeKid.addEventListener("change", renderRangePreview);
refs.rangeStart.addEventListener("change", renderRangePreview);
refs.rangeEnd.addEventListener("change", renderRangePreview);
refs.cloudStatus.addEventListener("click", () => {
  refs.cloudSetup.hidden = !refs.cloudSetup.hidden;
});
window.addEventListener("grammar-island-reward-earned", handleGrammarIslandReward);
refs.closeCloudSetup.addEventListener("click", () => {
  refs.cloudSetup.hidden = true;
});
refs.createFamilyForm.addEventListener("submit", createCloudFamily);
refs.joinFamilyForm.addEventListener("submit", joinCloudFamily);
refs.switchFamilyForm.addEventListener("submit", switchCloudFamily);
refs.familyChoiceList.addEventListener("click", selectJoinedFamily);

window.LearningActivityProgress = Object.freeze({
  getContext() {
    const date = planDateForView(activeKid, selectedDate);
    const day = getDay(activeKid, date, selectedDate);
    const planDay = day.planDayNumber || summerPlanRegistry.current(state, activeKid, toISODate(new Date())).currentDay;
    return {
      kidId: activeKid,
      kidName: profileById(activeKid).name,
      date,
      planTitle: summerPlanRegistry.TITLE,
      planDay,
      planTotalDays: summerPlanRegistry.TOTAL_DAYS,
      courseStartDate: state.learningActivities?.moduleStarts?.[activeKid]?.englishIsland || null,
      modules: day.tasks.map((item) => ({
        id: item.moduleId || item.id,
        activity: item.activity || moduleRegistry.get(item.moduleId || item.id)?.activity || null,
        startDate: state.learningActivities?.moduleStarts?.[activeKid]?.[item.moduleId || item.id] || null,
        planDay
      }))
    };
  },
  startModule(moduleId) {
    const starts = state.learningActivities.moduleStarts[activeKid];
    if (!starts[moduleId]) {
      starts[moduleId] = planDateForView(activeKid, selectedDate);
      saveState();
    }
    return starts[moduleId];
  },
  startCourse() {
    return this.startModule("englishIsland");
  },
  get(activityId) {
    const date = planDateForView(activeKid, selectedDate);
    return state.learningActivities?.progress?.[activeKid]?.[date]?.[activityId] || null;
  },
  getHistory() {
    return Object.entries(state.learningActivities?.progress?.[activeKid] || {}).flatMap(([date, activities]) => (
      Object.entries(activities || {}).map(([activityId, record]) => ({ date, activityId, record }))
    ));
  },
  save(activityId, record) {
    const date = planDateForView(activeKid, selectedDate);
    const progress = state.learningActivities.progress[activeKid];
    progress[date] ||= {};
    progress[date][activityId] = {
      ...record,
      updatedAt: new Date().toISOString()
    };
    saveState();
  },
  reset(activityId) {
    const date = planDateForView(activeKid, selectedDate);
    const day = state.learningActivities?.progress?.[activeKid]?.[date];
    if (!day?.[activityId]) return;
    delete day[activityId];
    if (!Object.keys(day).length) delete state.learningActivities.progress[activeKid][date];
    saveState();
  }
});
window.GrammarIslandSync = Object.freeze({
  getState() {
    return state.grammarIsland ? structuredClone(state.grammarIsland) : null;
  },
  save(nextGrammarState) {
    const merged = window.TaskStateMigration.mergeGrammarIslandStates(state.grammarIsland, nextGrammarState);
    if (JSON.stringify(merged) === JSON.stringify(state.grammarIsland)) return structuredClone(state.grammarIsland);
    state.grammarIsland = merged;
    saveState();
    return structuredClone(state.grammarIsland);
  }
});
// Compatibility alias for progress already stored by the first English-course UI.
window.EnglishExperimentProgress = window.LearningActivityProgress;

renderKidSwitcher();
renderEditorKidOptions();
refs.rangeStart.value = toISODate(addDays(new Date(), 1));
refs.rangeEnd.value = toISODate(addDays(new Date(), 10));
refs.familyTaskStart.value = toISODate(new Date());
refs.familyTaskEnd.value = toISODate(new Date());
refs.courseEffectiveDate.value = toISODate(addDays(new Date(), 1));
render();
loadWorldMap();
initializeCloud();

function loadState() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    const currentValid = current?.days && current?.startDate;
    const legacyValid = legacy?.days && legacy?.startDate;
    if (currentValid && legacyValid) {
      const merged = window.TaskStateMigration.mergeDeviceProgress(legacy, current);
      merged.legacyStateImported = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return merged;
    }
    if (currentValid) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return current;
    }
    if (legacyValid) {
      legacy.legacyStateImported = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
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
  current.gardenUpdatedAt ||= { brother: null, younger: null };
  current.gardenUpdatedAt.brother ||= null;
  current.gardenUpdatedAt.younger ||= null;
  current.taskSettings ||= { brother: {}, younger: {} };
  current.taskSettings.brother ||= {};
  current.taskSettings.younger ||= {};
  ["brother", "younger"].forEach((kidId) => {
    const settings = current.taskSettings[kidId];
    if (!settings.englishIsland && settings.raz) settings.englishIsland = settings.raz;
    delete settings.raz;
  });
  current.planPeriods ||= [];
  current.taskSchedules ||= [];
  current.coursePlans ||= { schemaVersion: 2, drafts: { brother: null, younger: null }, releases: [] };
  current.coursePlans.schemaVersion = 2;
  current.coursePlans.drafts ||= { brother: null, younger: null };
  current.coursePlans.drafts.brother ??= null;
  current.coursePlans.drafts.younger ??= null;
  current.coursePlans.releases ||= [];
  const dynamicSettingsRepaired = repairDynamicContentSettings(current);
  current.learningActivities ||= current.englishExperiment || { version: 1, progress: { brother: {}, younger: {} } };
  current.learningActivities.progress ||= { brother: {}, younger: {} };
  current.learningActivities.progress.brother ||= {};
  current.learningActivities.progress.younger ||= {};
  current.learningActivities.moduleStarts ||= { brother: {}, younger: {} };
  current.learningActivities.moduleStarts.brother ||= {};
  current.learningActivities.moduleStarts.younger ||= {};
  if (current.learningActivities.courseStarts) {
    ["brother", "younger"].forEach((kidId) => {
      current.learningActivities.moduleStarts[kidId].englishIsland ||= current.learningActivities.courseStarts[kidId] || null;
    });
  }
  // Keep the old property during the compatibility window for synced devices on the previous release.
  current.englishExperiment = current.learningActivities;
  applyAugust2026PlanMigration(current);
  const today = toISODate(new Date());
  summerPlanRegistry.ensure(current, today);
  const progressRecovered = ["brother", "younger"]
    .map((kidId) => summerPlanRegistry.recoverLatestResolvedDay(current, kidId, today))
    .some(Boolean);
  rewardRegistry.ensure(current, plants);
  const repairedGardenKidIds = rewardRegistry.normalizeSquads(current, plants, GARDEN_SQUAD_LIMIT);
  if (repairedGardenKidIds.length) {
    const repairedAt = new Date().toISOString();
    repairedGardenKidIds.forEach((kidId) => { current.gardenUpdatedAt[kidId] = repairedAt; });
  }
  return progressRecovered || dynamicSettingsRepaired || repairedGardenKidIds.length > 0;
}

function repairDynamicContentSettings(current) {
  const version = 1;
  if (Number(current.dynamicContentSettingsVersion || 0) >= version) return false;
  const clean = (settings) => {
    Object.entries(settings || {}).forEach(([moduleId, item]) => {
      if (!moduleRegistry.isDynamicContent(moduleId) || !item) return;
      delete item.title;
      delete item.instruction;
    });
  };
  [current.taskSettings?.brother, current.taskSettings?.younger].forEach(clean);
  (current.coursePlans?.releases || []).forEach((release) => clean(release.settings));
  [current.coursePlans?.drafts?.brother?.settings, current.coursePlans?.drafts?.younger?.settings].forEach(clean);
  current.dynamicContentSettingsVersion = version;
  return true;
}

function applyAugust2026PlanMigration(current) {
  const planVersion = 7;
  if (current.august2026PlanVersion === planVersion) return;
  const today = toISODate(new Date());
  summerPlanRegistry.ensure(current, today);
  current.courseModuleRepairs ||= { mathEnabledReleaseIds: [], mathEnabledLegacyKids: [] };
  current.courseModuleRepairs.mathEnabledReleaseIds ||= [];
  current.courseModuleRepairs.mathEnabledLegacyKids ||= [];
  current.curriculumAnchors ||= {};
  current.curriculumAnchors.poem ||= {};
  ["brother", "younger"].forEach((kidId) => {
    const progress = current.summerPlan.kids[kidId];
    progress.currentDay = summerPlanRegistry.dayFromResolvedHistory(current, kidId, today);
    const currentDay = current.days?.[kidId]?.[progress.currentDate];
    if (currentDay) currentDay.planDayNumber = progress.currentDay;
    current.curriculumAnchors.poem[kidId] = progress.currentDay;

    const activeRelease = window.CourseReleases.activeRelease(current.coursePlans?.releases, kidId, today);
    if (activeRelease?.settings?.math?.enabled === false
      && !current.courseModuleRepairs.mathEnabledReleaseIds.includes(activeRelease.id)) {
      current.courseModuleRepairs.mathEnabledReleaseIds.push(activeRelease.id);
    }
    if (!activeRelease && current.taskSettings?.[kidId]?.math?.enabled === false
      && !current.courseModuleRepairs.mathEnabledLegacyKids.includes(kidId)) {
      current.courseModuleRepairs.mathEnabledLegacyKids.push(kidId);
    }
  });
  current.planPeriods = current.planPeriods.flatMap((period) => {
    if (period.preset !== "hand-recovery" || period.endDate < "2026-08-07") return [period];
    if (period.startDate >= "2026-08-07") return [];
    return [{ ...period, endDate: "2026-08-06" }];
  });
  datesBetween("2026-08-03", "2026-08-31").forEach((date) => {
    ["brother", "younger"].forEach((kidId) => {
      const existing = current.days[kidId]?.[date];
      const planDayIndex = existing?.planDayNumber ? existing.planDayNumber - 1 : null;
      const next = buildDefaultDay(date, kidId, planDayIndex);
      const migrated = preserveDayState(next, existing);
      const previousMath = existing?.tasks?.find((item) => (item.moduleId || item.id) === "math");
      const migratedMath = migrated.tasks.find((item) => (item.moduleId || item.id) === "math");
      const legacyPlaceholder = previousMath?.title === "数学练习"
        && /乘法口诀|混合口诀|本周口诀回顾|口诀薄弱项回顾|轻松口算日/.test(previousMath.detail || "");
      if (existing?.planScope === "day" && previousMath && migratedMath && !legacyPlaceholder) {
        Object.assign(migratedMath, {
          title: previousMath.title,
          detail: previousMath.detail,
          tags: previousMath.tags,
          instruction: previousMath.instruction,
          minutes: previousMath.minutes
        });
      }
      const progress = current.summerPlan.kids[kidId];
      if (date === progress.currentDate) {
        const poem = migrated.tasks.find((item) => (item.moduleId || item.id) === "poem");
        if (poem) {
          poem.done = false;
          poem.excused = false;
          delete poem.completedOn;
          delete poem.excusedOn;
        }
      }
      // 区间计划的旧说明可能与这次安排冲突；只保留家长明确做过的单日备注。
      if (existing?.planScope !== "day") migrated.note = next.note;
      current.days[kidId][date] = migrated;
    });
  });
  current.august2026PlanVersion = planVersion;
}

function saveState() {
  rewardRegistry.ensure(state, plants);
  state.activeKid = activeKid;
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.CloudStore?.scheduleSave(state);
}

async function initializeCloud() {
  updateCloudStatus({ status: "syncing", message: "正在连接云端…" });
  const result = await window.CloudStore.init({
    onRemoteState: applyRemoteState,
    onStatus: updateCloudStatus
  });
  if (result.needsSetup || result.needsFamilyChoice || (result.error && result.error.code !== "CLIENT_NOT_READY")) refs.cloudSetup.hidden = false;
}

function applyRemoteState(remoteState, meta = {}) {
  if (!remoteState?.days || !remoteState?.startDate) return;
  const localStateBeforeRemote = state;
  const recoveryVersion = 3;
  const conflictState = ["conflict", "family-switch"].includes(meta.source) ? meta.localState : null;
  const needsDeviceRecovery = meta.source === "load" && localStorage.getItem(DEVICE_SYNC_RECOVERY_KEY) !== "done";
  const needsCompletionRecovery = meta.source === "load"
    && (needsDeviceRecovery || Number(remoteState.cloudCompletionRecoveryVersion || 0) < recoveryVersion);
  const selectedState = window.TaskStateMigration.mergeRemoteProgress(
    conflictState || localStateBeforeRemote,
    remoteState
  );
  const completionRecovered = JSON.stringify(selectedState.days || {}) !== JSON.stringify(remoteState.days || {})
    || JSON.stringify(selectedState.summerPlan || null) !== JSON.stringify(remoteState.summerPlan || null)
    || JSON.stringify(selectedState.learningActivities || null) !== JSON.stringify(remoteState.learningActivities || null);
  state = window.TaskStateMigration.mergeGardenProgress(localStateBeforeRemote, selectedState);
  const gardenRecovered = JSON.stringify(state.gardens) !== JSON.stringify(selectedState.gardens)
    || JSON.stringify(state.gardenUpdatedAt) !== JSON.stringify(selectedState.gardenUpdatedAt);
  const bonusRewardsRecovered = JSON.stringify(state.rewardProgress?.bonusEvents || {})
    !== JSON.stringify(selectedState.rewardProgress?.bonusEvents || {});
  const grammarIslandRecovered = JSON.stringify(state.grammarIsland || null)
    !== JSON.stringify(selectedState.grammarIsland || null);
  if (needsCompletionRecovery || conflictState || completionRecovered) {
    state.cloudCompletionRecoveryVersion = recoveryVersion;
    state.updatedAt = new Date().toISOString();
  }
  if (gardenRecovered || bonusRewardsRecovered || grammarIslandRecovered) state.updatedAt = new Date().toISOString();
  const progressRecovered = ensureState(state);
  activeKid = state.activeKid || activeKid;
  editorKid = activeKid;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (meta.source === "load") localStorage.setItem(DEVICE_SYNC_RECOVERY_KEY, "done");
  renderEditorKidOptions();
  render();
  if (needsCompletionRecovery || conflictState || completionRecovered || progressRecovered || gardenRecovered || bonusRewardsRecovered || grammarIslandRecovered) window.CloudStore?.scheduleSave(state);
  if (meta.source === "realtime") showToast("已同步另一台设备的更新");
}

function updateCloudStatus(info) {
  const labels = {
    local: "● 本地模式",
    setup: "● 等待启用云端",
    choice: "● 请选择家庭",
    syncing: "● 正在同步",
    synced: "● 云端已同步",
    offline: "● 离线保存",
    conflict: "● 已载入新数据"
  };
  refs.cloudStatus.className = `cloud-status ${info.status}`;
  const shortCode = window.FamilySyncCore.shortInviteCode(info.inviteCode);
  refs.cloudStatus.textContent = `${labels[info.status] || "● 本地模式"}${shortCode ? ` · ${shortCode}` : ""}`;
  refs.cloudStatus.title = info.message || "";
  refs.cloudSetupMessage.textContent = info.message || "第一次使用请创建家庭空间；其他手机用邀请码和家长 PIN 加入。";

  const families = info.families || [];
  const connected = Boolean(info.familyId);
  const needsChoice = !connected && families.length > 1;
  refs.familyChoice.hidden = !needsChoice;
  refs.cloudSetupForms.hidden = connected || needsChoice;
  refs.cloudConnectedInfo.hidden = !connected;
  refs.familyChoiceList.innerHTML = needsChoice ? families.map((family) => `
    <button type="button" data-select-family="${escapeAttr(family.familyId)}">
      <span><strong>${escapeHTML(family.familyName)}</strong><small>${escapeHTML(family.accessRole === "owner" ? "创建者设备" : "已加入设备")}</small></span>
      <b>${escapeHTML(family.inviteCode)}</b>
    </button>`).join("") : "";
  if (connected) {
    refs.connectedInviteCode.textContent = info.inviteCode || "刷新后显示";
    refs.joinedFamilyList.innerHTML = families.length > 1
      ? `<p>此设备共加入过 ${families.length} 个家庭；当前主家庭为 <b>${escapeHTML(info.inviteCode)}</b>。旧家庭不会自动参与同步。</p>`
      : "";
  }
}

async function createCloudFamily(event) {
  event.preventDefault();
  const name = refs.familyName.value.trim();
  const pin = refs.createFamilyPin.value;
  if (!window.confirm("只有家里第一台设备才应创建新家庭。其他手机应加入已有家庭。\n\n确定创建一个全新、彼此独立的家庭空间吗？")) return;
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
  if (!window.confirm(`确认加入家庭 ${code}？\n\n本机学习记录会与该家庭无损合并；所有设备必须显示同一个家庭码。`)) return;
  setCloudFormsDisabled(true);
  try {
    const info = await window.CloudStore.joinFamily(code, pin, state);
    await window.CloudStore.flushSave();
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

async function switchCloudFamily(event) {
  event.preventDefault();
  const code = refs.switchFamilyCode.value.trim().toUpperCase();
  const pin = refs.switchFamilyPin.value;
  const currentCode = window.CloudStore.getInfo().inviteCode;
  if (code === currentCode) {
    refs.cloudSetupMessage.textContent = "这已经是当前家庭，无需切换。";
    return;
  }
  if (!window.confirm(`确认从家庭 ${currentCode || "当前家庭"} 切换到 ${code}？\n\n本机记录会与目标家庭无损合并，旧家庭不会删除，但以后只同步目标家庭。`)) return;
  setCloudFormsDisabled(true);
  try {
    const info = await window.CloudStore.switchFamily(code, pin, state);
    await window.CloudStore.flushSave();
    refs.switchFamilyPin.value = "";
    refs.connectedInviteCode.textContent = info.inviteCode;
    refs.switchFamilyDetails.open = false;
    showToast("家庭已切换，本机与云端学习记录已合并");
  } catch (error) {
    refs.cloudSetupMessage.textContent = window.CloudStore.friendlyError(error, "切换并合并家庭");
  } finally {
    setCloudFormsDisabled(false);
  }
}

async function selectJoinedFamily(event) {
  const button = event.target.closest("[data-select-family]");
  if (!button) return;
  const target = window.CloudStore.getInfo().families.find((family) => family.familyId === button.dataset.selectFamily);
  if (!target || !window.confirm(`选择 ${target.inviteCode} 作为这台设备的主家庭？\n\n本机学习记录会先与该家庭无损合并。`)) return;
  setCloudFormsDisabled(true);
  try {
    await window.CloudStore.selectExistingFamily(target.familyId, state);
    await window.CloudStore.flushSave();
    showToast(`已选择家庭 ${target.inviteCode}`);
  } catch (error) {
    refs.cloudSetupMessage.textContent = window.CloudStore.friendlyError(error, "选择主家庭");
  } finally {
    setCloudFormsDisabled(false);
  }
}

function setCloudFormsDisabled(disabled) {
  refs.cloudSetup.querySelectorAll("input, button[type='submit']").forEach((element) => {
    element.disabled = disabled;
  });
}

function getDay(kidId, date, scheduleDate = date) {
  state.days[kidId] ||= {};
  if (!state.days[kidId][date]) {
    state.days[kidId][date] = buildDefaultDay(date, kidId);
    saveState();
  }
  const currentTasks = state.days[kidId][date].tasks || [];
  const nextTasks = window.FamilyTaskSchedules.reconcileTasks(currentTasks, state.taskSchedules, kidId, scheduleDate);
  if (JSON.stringify(currentTasks) !== JSON.stringify(nextTasks)) {
    state.days[kidId][date].tasks = nextTasks;
    saveState();
  }
  return state.days[kidId][date];
}

function resolveSummerPlan(kidId) {
  const today = toISODate(new Date());
  const progress = summerPlanRegistry.current(state, kidId, today);
  const previousDate = progress.currentDate;
  const result = summerPlanRegistry.advance(state, kidId, today);
  if (result.changed) {
    const existing = state.days[kidId]?.[today];
    const period = state.planPeriods.find((item) => item.startDate <= today && item.endDate >= today && item.kidIds.includes(kidId));
    let generated;
    if (existing?.planScope === "day") generated = structuredClone(existing);
    else if (period?.preset && period.preset !== "overall") {
      generated = buildPresetDay(period.preset, today, kidId, result.progress.currentDay - 1);
      generated.planPeriodId = period.id;
    } else generated = buildDefaultDay(today, kidId, result.progress.currentDay - 1);
    generated.planDayNumber = result.progress.currentDay;
    state.days[kidId][today] = preserveDayState(generated, existing);
    saveState();
  } else {
    let day = getDay(kidId, previousDate, today);
    day = reconcileCurrentCourseDay(kidId, previousDate, today) || day;
    if (!day.planDayNumber) {
      day.planDayNumber = progress.currentDay;
      saveState();
    }
  }
  return result.progress;
}

function planDateForView(kidId, date) {
  const today = toISODate(new Date());
  return date === today ? resolveSummerPlan(kidId).currentDate : date;
}

function buildDefaultDay(date, kidId = editorKid, dayIndexOverride = null, courseDate = date) {
  if (window.LegacyLearningPlan?.applies(date)) {
    return window.LegacyLearningPlan.buildDay({ date, kidId, createTask: task, dayOffset });
  }
  return {
    tasks: applyOverallSettings(kidId, buildRawTasks(date, dayIndexOverride, kidId), courseDate),
    mistakes: "",
    note: "",
    planScope: "overall"
  };
}

function buildRawTasks(date, dayIndexOverride = null, kidId = editorKid) {
  const index = dayIndexOverride == null ? dayOffset(state.startDate, date) : dayIndexOverride;
  const planDay = index + 1;
  const poemAnchor = state.curriculumAnchors?.poem?.[kidId] || 1;
  return moduleRegistry.buildDefaultTasks({
    date,
    kidId,
    dayIndex: index,
    contentDayIndexes: { poem: Math.max(0, planDay - poemAnchor) }
  });
}

function applyOverallSettings(kidId, tasks, date) {
  const course = window.CourseReleases.settingsForDate(state.coursePlans, state.taskSettings, kidId, date);
  const repairedMath = course.release
    ? state.courseModuleRepairs?.mathEnabledReleaseIds?.includes(course.release.id)
    : state.courseModuleRepairs?.mathEnabledLegacyKids?.includes(kidId);
  const settings = repairedMath
    ? { ...course.settings, math: { ...course.settings.math, enabled: true } }
    : course.settings;
  return applyTaskSettings(tasks, settings, course.release);
}

function applyTaskSettings(tasks, settings, release = null) {
  return moduleRegistry.applySettings(tasks, settings, release);
}

function reconcileCurrentCourseDay(kidId, date, courseDate) {
  const existing = state.days[kidId]?.[date];
  if (!existing || existing.planPeriodId) return existing;
  const dayIndex = existing.planDayNumber ? existing.planDayNumber - 1 : null;
  const generated = buildDefaultDay(date, kidId, dayIndex, courseDate);
  if (existing.planDayNumber) generated.planDayNumber = existing.planDayNumber;
  const next = preserveDayState(generated, existing);
  next.tasks = window.FamilyTaskSchedules.reconcileTasks(next.tasks, state.taskSchedules, kidId, courseDate);
  if (JSON.stringify(existing) !== JSON.stringify(next)) {
    state.days[kidId][date] = next;
    saveState();
    return next;
  }
  return existing;
}

function task(id, title, detail, tags, instruction, done = false, minutes = null) {
  return moduleRegistry.createTask({ id, moduleId: id, title, detail, tags, instruction, done, minutes });
}

function render() {
  refs.datePicker.value = selectedDate;
  renderKidSwitcher();
  renderKidView();
  renderFamilyOverview();
  renderOverallEditor();
  renderCourseReleaseList();
  renderFamilyTaskPreview();
  renderFamilyTaskSchedules();
  renderRangePreview();
  renderPlanPeriods();
  renderEditor();
  window.dispatchEvent(new CustomEvent("learning-activity-context-change", {
    detail: window.LearningActivityProgress.getContext()
  }));
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
  refs.rangePreset.innerHTML = [
    ...planPresetRegistry.list().map((preset) => `<option value="${escapeAttr(preset.id)}">${escapeHTML(preset.title)}</option>`),
    '<option value="overall">总体任务 · 恢复普通安排</option>'
  ].join("");
  refs.editorKid.value = editorKid;
  refs.overallKid.value = editorKid;
}

function renderKidView() {
  const profile = profileById(activeKid);
  const today = toISODate(new Date());
  const planDate = planDateForView(activeKid, selectedDate);
  const plan = summerPlanRegistry.current(state, activeKid, today);
  const day = getDay(activeKid, planDate, selectedDate);
  const visibleTasks = summerPlanRegistry.activeTasks(day);
  const done = summerPlanRegistry.resolvedCount(day);
  const total = visibleTasks.length;
  const percent = Math.round((done / total) * 100);
  document.documentElement.style.setProperty("--kid-color", profile.color);
  document.documentElement.style.setProperty("--kid-soft", profile.soft);
  refs.avatar.innerHTML = `<img src="${profile.avatar}" data-kid="${profile.id}" alt="${profile.character}">`;
  refs.kidName.textContent = profile.name;
  const viewingToday = selectedDate === today;
  const carried = viewingToday && planDate < today;
  const carriedCompleted = carried && summerPlanRegistry.isDayResolved(day);
  const finished = plan.currentDay === summerPlanRegistry.TOTAL_DAYS && summerPlanRegistry.isDayResolved(day);
  refs.dateLabel.textContent = viewingToday
    ? `${formatDateLabel(today)} · ${summerPlanRegistry.TITLE}${finished ? "已完成" : `第 ${plan.currentDay}/${summerPlanRegistry.TOTAL_DAYS} 个学习日`}${carriedCompleted ? ` · 已完成 ${formatDateLabel(planDate)} 的顺延内容，明天进入下一学习日` : carried ? ` · 继续 ${formatDateLabel(planDate)} 的内容` : ""}`
    : `${formatDateLabel(planDate)} · 历史记录`;
  refs.progressText.textContent = `${done}/${total}`;
  refs.progressBar.style.width = `${percent}%`;
  refs.sunCount.textContent = availableSun(activeKid);
  refs.rewardBalance.textContent = availableSun(activeKid);
  refs.streakCount.textContent = streakFor(activeKid, today);
  refs.timeEstimate.textContent = `大约 ${visibleTasks.reduce((sum, item) => sum + (item.minutes || moduleRegistry.getPresentation(item.moduleId || item.id).minutes), 0)} 分钟`;
  refs.encouragement.textContent = encouragement(done, total);
  refs.finishCard.hidden = done !== total;
  renderTasks(day);
  renderSharedWorld();
  renderBattle();
  renderRewards();
}

function renderTasks(day) {
  refs.taskList.innerHTML = "";
  summerPlanRegistry.activeTasks(day).forEach((item, index) => {
    const category = moduleRegistry.getPresentation(item.moduleId || item.id);
    const card = document.createElement("article");
    card.className = `task-card ${summerPlanRegistry.isTaskResolved(item) ? "done" : ""}`;
    card.style.setProperty("--task-color", category.color);
    card.style.setProperty("--task-soft", category.soft);
    card.innerHTML = `
      <div class="task-icon">${category.icon}</div>
      <div>
        <span class="task-order">第 ${index + 1} 项 · ${item.minutes || category.minutes} 分钟${item.source === "parent" ? " · 家长临时任务" : ""}</span>
        <h3 class="task-title">${escapeHTML(item.title)}</h3>
        <p class="task-detail">${escapeHTML(item.detail)}</p>
        <p class="how-to"><strong>怎么做：</strong>${escapeHTML(item.instruction || "完成后点右边的按钮。")}</p>
        <div class="word-row">${(item.tags || []).map((tag) => `<span class="word-chip">${escapeHTML(tag)}</span>`).join("")}</div>
      </div>
      <button class="complete-button" type="button" ${item.excused ? "disabled" : ""}>${item.excused ? "历史免除" : item.done ? "✓ 已完成" : `完成 +10☀`}</button>`;
    card.querySelector(".complete-button").addEventListener("click", () => toggleTask(item));
    refs.taskList.appendChild(card);
  });
}

function toggleTask(item) {
  summerPlanRegistry.setTaskDone(item, !item.done, toISODate(new Date()));
  saveState();
  showToast(item.done ? "做得好！获得 10 阳光 ☀" : "已取消完成");
  render();
}

function handleGrammarIslandReward(event) {
  const detail = event.detail || {};
  const kidId = detail.kidId === "younger" ? "younger" : detail.kidId === "brother" ? "brother" : null;
  const lessonId = /^[a-z0-9-]+$/.test(detail.lessonId || "") ? detail.lessonId : null;
  if (!kidId || !lessonId) return;
  const awarded = rewardRegistry.addBonusReward(state, kidId, {
    id: `grammar:${kidId}:${lessonId}`,
    amount: GRAMMAR_LESSON_BONUS_SUN,
    source: "grammar-island",
    earnedAt: detail.earnedAt || new Date().toISOString()
  });
  detail.awarded = awarded;
  detail.amount = GRAMMAR_LESSON_BONUS_SUN;
  if (!awarded) return;
  saveState();
  render();
  if (!detail.silent) showToast(`额外学习奖励：获得 ${GRAMMAR_LESSON_BONUS_SUN} 阳光 ☀`);
}

function renderRewards() {
  const totalSun = earnedSun(activeKid);
  const squad = state.gardens[activeKid];
  refs.rewardList.innerHTML = plants.map((plant) => {
    const unlocked = rewardRegistry.isPlantUnlocked(state, activeKid, plant.id);
    const planted = squad.includes(plant.id);
    const squadFull = squad.length >= GARDEN_SQUAD_LIMIT;
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
  else if (rewardRegistry.isPlantUnlocked(state, activeKid, plantId) && squad.length < GARDEN_SQUAD_LIMIT) squad.push(plantId);
  else return;
  state.gardenUpdatedAt[activeKid] = new Date().toISOString();
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
  const brotherDay = getDay("brother", planDateForView("brother", date), date);
  const youngerDay = getDay("younger", planDateForView("younger", date), date);
  const brotherDone = summerPlanRegistry.resolvedCount(brotherDay);
  const youngerDone = summerPlanRegistry.resolvedCount(youngerDay);
  const brotherTotal = summerPlanRegistry.activeTasks(brotherDay).length;
  const youngerTotal = summerPlanRegistry.activeTasks(youngerDay).length;
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
  const brotherDay = getDay("brother", planDateForView("brother", selectedDate), selectedDate);
  const youngerDay = getDay("younger", planDateForView("younger", selectedDate), selectedDate);
  const brotherDone = summerPlanRegistry.resolvedCount(brotherDay);
  const youngerDone = summerPlanRegistry.resolvedCount(youngerDay);
  const brotherTotal = summerPlanRegistry.activeTasks(brotherDay).length;
  const youngerTotal = summerPlanRegistry.activeTasks(youngerDay).length;
  const brotherComplete = isDayComplete(brotherDay);
  const youngerComplete = isDayComplete(youngerDay);
  const samePlanDay = Boolean(brotherDay.planDayNumber && brotherDay.planDayNumber === youngerDay.planDayNumber);

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

  if (brotherComplete && youngerComplete && (samePlanDay || !brotherDay.planDayNumber || !youngerDay.planDayNumber)) {
    const jointKey = samePlanDay ? `summer:${brotherDay.planDayNumber}` : `legacy:${selectedDate}`;
    const todayIndex = jointDates.indexOf(jointKey);
    const start = todayIndex >= 0 ? todayIndex : Math.max(0, litCount - 1);
    const todayCode = countryCodes[start];
    refs.worldMessage.textContent = `今天双星会合，共同点亮 ${countryName(todayCode)}！`;
  } else if (brotherComplete && youngerComplete) {
    refs.worldMessage.textContent = `哥哥在暑假计划第 ${brotherDay.planDayNumber} 天，弟弟在第 ${youngerDay.planDayNumber} 天；各自完成当前学习日后继续前进。`;
  } else if (brotherComplete) {
    refs.worldMessage.textContent = `哥哥已就位，弟弟再完成 ${youngerTotal - youngerDone} 项就能一起点亮世界。`;
  } else if (youngerComplete) {
    refs.worldMessage.textContent = `弟弟已就位，哥哥再完成 ${brotherTotal - brotherDone} 项就能一起点亮世界。`;
  } else {
    refs.worldMessage.textContent = `哥哥完成 ${brotherDone}/${brotherTotal}，弟弟完成 ${youngerDone}/${youngerTotal}；两人都完成长期课程就点亮 1 个国家。`;
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
  return summerPlanRegistry.completionKeys(state);
}

function isDayComplete(day) {
  return summerPlanRegistry.isDayResolved(day);
}

function renderFamilyOverview() {
  refs.familyOverview.innerHTML = profiles.map((profile) => {
    const date = planDateForView(profile.id, selectedDate);
    const day = getDay(profile.id, date, selectedDate);
    const done = summerPlanRegistry.resolvedCount(day);
    const total = summerPlanRegistry.activeTasks(day).length;
    const percent = total ? Math.round(done / total * 100) : 0;
    const status = done === total ? "今日完成" : done ? `还剩 ${total - done} 项` : "尚未开始";
    return `<article class="overview-card" style="--kid-color:${profile.color};--kid-soft:${profile.soft}">
      <div class="overview-top"><span class="overview-name"><span class="kid-mini"><img src="${profile.avatar}" data-kid="${profile.id}" alt=""></span>${profile.name}</span><span class="overview-status">${status}</span></div>
      <div class="overview-progress"><div style="width:${percent}%"></div></div>
      <div class="overview-meta"><span>${done}/${total} 项</span><span>${earnedSun(profile.id)} 累计阳光</span></div>
    </article>`;
  }).join("");
}

function renderEditor() {
  const profile = profileById(editorKid);
  const date = planDateForView(editorKid, selectedDate);
  const day = getDay(editorKid, date, selectedDate);
  const visibleTasks = summerPlanRegistry.activeTasks(day);
  refs.editorKid.value = editorKid;
  refs.editorTitle.textContent = `${profile.name} · ${formatDateLabel(date)}${date !== selectedDate ? ` · ${summerPlanRegistry.TITLE}顺延内容` : ""}`;
  refs.taskEditor.innerHTML = visibleTasks.map((item, index) => `
    <details class="edit-row">
      <summary>${escapeHTML(item.title)} · ${item.excused ? "已免除" : item.done ? "已完成" : "未完成"}</summary>
      <div class="edit-fields">
        <label class="completion-check"><input type="checkbox" data-field="done" data-index="${index}" ${item.done ? "checked" : ""}><span>这项已完成（可用于登记补做）</span></label>
        ${item.excused ? '<p class="legacy-status-note">历史记录：该任务曾按旧规则免除，现有进度保持不变。</p>' : ""}
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
  const today = toISODate(new Date());
  const activeRelease = window.CourseReleases.activeRelease(state.coursePlans.releases, editorKid, today);
  const activeStage = window.CourseReleases.stageState(state.coursePlans.releases, editorKid, today);
  const latestRelease = state.coursePlans.releases.filter((release) => release.kidId === editorKid).slice().sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate) || right.version - left.version)[0] || null;
  const draft = state.coursePlans.drafts[editorKid];
  const baseRelease = latestRelease || activeRelease;
  const settings = draft?.settings || baseRelease?.settings || state.taskSettings[editorKid] || {};
  refs.overallKid.value = editorKid;
  refs.courseDraftTitle.value = draft?.title || baseRelease?.title || `${profileById(editorKid).name}长期课程`;
  refs.courseDraftGoal.value = draft?.goal || baseRelease?.goal || "";
  refs.courseEffectiveDate.value = draft?.effectiveDate || [today, latestRelease?.effectiveDate || today].sort().at(-1);
  refs.courseStageEndDate.value = draft?.stageEndDate || "";
  const stageEndLabel = activeRelease?.stageEndDate ? ` · 阶段预计至 ${escapeHTML(activeRelease.stageEndDate)}` : "";
  const awaitingLabel = activeStage.status === "awaiting-next-stage" ? " · 阶段目标已到期，当前课程继续沿用，等待下一阶段" : "";
  refs.courseReleaseStatus.innerHTML = activeRelease
    ? `<strong>当前版本 v${activeRelease.version} · ${escapeHTML(activeRelease.title)}</strong><span>${escapeHTML(activeRelease.effectiveDate)} 起生效${stageEndLabel}${awaitingLabel}${latestRelease?.id !== activeRelease.id ? ` · v${latestRelease.version} 将于 ${escapeHTML(latestRelease.effectiveDate)} 生效` : ""}${draft ? " · 有未发布草稿" : ""}</span>`
    : `<strong>当前使用历史总体设置</strong><span>${latestRelease ? `v${latestRelease.version} 将于 ${escapeHTML(latestRelease.effectiveDate)} 生效` : (draft ? "已有未发布草稿" : "首次发布后将开始记录课程版本")}</span>`;
  const editorTasks = courseEditorTasks(editorKid);
  refs.overallTaskEditor.innerHTML = editorTasks.map((item) => {
    const setting = settings[item.id] || {};
    const enabled = setting.enabled !== false;
    const dynamicContent = moduleRegistry.isDynamicContent(item.id);
    return `<div class="overall-task-row ${enabled ? "" : "disabled"}">
      <label class="overall-task-toggle"><input type="checkbox" data-overall-id="${item.id}" data-overall-field="enabled" ${enabled ? "checked" : ""}><span>显示</span></label>
      <input ${dynamicContent ? "readonly" : `data-overall-id="${item.id}" data-overall-field="title"`} aria-label="${escapeAttr(item.title)}的总体名称" value="${escapeAttr(dynamicContent ? item.title : (setting.title || item.title))}" ${dynamicContent ? 'title="按当前学习日自动更新，不能固定修改"' : ""}>
      <input ${dynamicContent ? "readonly" : `data-overall-id="${item.id}" data-overall-field="instruction"`} aria-label="${escapeAttr(item.title)}的总体步骤" value="${escapeAttr(dynamicContent ? item.instruction : (setting.instruction || item.instruction))}" ${dynamicContent ? 'title="按当前学习日自动更新，不能固定修改"' : ""}>
    </div>`;
  }).join("");
  refs.overallTaskEditor.querySelectorAll('[data-overall-field="enabled"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => checkbox.closest(".overall-task-row").classList.toggle("disabled", !checkbox.checked));
  });
}

function courseEditorTasks(kidId) {
  const today = toISODate(new Date());
  const planDay = summerPlanRegistry.current(state, kidId, today).currentDay;
  return buildRawTasks(today, Math.max(0, planDay - 1), kidId);
}

function collectCourseDraft() {
  const draft = {};
  refs.overallTaskEditor.querySelectorAll("[data-overall-id]").forEach((field) => {
    const id = field.dataset.overallId;
    draft[id] ||= {};
    draft[id][field.dataset.overallField] = field.dataset.overallField === "enabled" ? field.checked : field.value.trim();
  });
  if (!Object.values(draft).some((item) => item.enabled)) {
    showToast("总体任务至少保留一项");
    return null;
  }
  const editorTasks = courseEditorTasks(editorKid);
  const defaults = Object.fromEntries(editorTasks.map((item) => [item.id, item]));
  const settings = Object.fromEntries(editorTasks.map(({ id }) => {
    const item = { enabled: draft[id].enabled };
    if (draft[id].title && draft[id].title !== defaults[id].title) item.title = draft[id].title;
    if (draft[id].instruction && draft[id].instruction !== defaults[id].instruction) item.instruction = draft[id].instruction;
    return [id, item];
  }));
  return window.CourseReleases.normalizeDraft({
    id: state.coursePlans.drafts[editorKid]?.id || createRecordId("course-draft"),
    kidId: editorKid,
    title: refs.courseDraftTitle.value,
    goal: refs.courseDraftGoal.value,
    effectiveDate: refs.courseEffectiveDate.value,
    stageEndDate: refs.courseStageEndDate.value,
    settings,
    updatedAt: new Date().toISOString()
  });
}

function saveCourseDraft() {
  const draft = collectCourseDraft();
  if (!draft?.title || !draft.effectiveDate || (draft.stageEndDate && draft.stageEndDate < draft.effectiveDate)) {
    showToast(draft?.stageEndDate && draft.stageEndDate < draft.effectiveDate ? "阶段结束日期不能早于生效日期" : "请填写课程名称和生效日期");
    return;
  }
  state.coursePlans.drafts[editorKid] = draft;
  saveState();
  showToast(`${profileById(editorKid).name}的课程草稿已保存`);
  render();
}

function previewCoursePlan() {
  const draft = collectCourseDraft();
  if (!draft?.title || !draft.effectiveDate || (draft.stageEndDate && draft.stageEndDate < draft.effectiveDate)) {
    showToast(draft?.stageEndDate && draft.stageEndDate < draft.effectiveDate ? "阶段结束日期不能早于生效日期" : "请先填写完整的课程名称和生效日期");
    return;
  }
  const currentPlanDay = summerPlanRegistry.current(state, editorKid, toISODate(new Date())).currentDay;
  const previewTasks = applyTaskSettings(buildRawTasks(draft.effectiveDate, currentPlanDay - 1, editorKid), draft.settings);
  const skipped = Object.entries(state.days[editorKid] || {}).filter(([date, day]) => date >= draft.effectiveDate && day.tasks?.some((item) => item.source !== "parent" && item.done)).length;
  refs.coursePlanPreview.innerHTML = `<div><p class="eyebrow">发布预览</p><h3>${escapeHTML(draft.title)}</h3><span>${escapeHTML(profileById(editorKid).name)} · ${escapeHTML(draft.effectiveDate)} 起${draft.stageEndDate ? ` · 阶段预计至 ${escapeHTML(draft.stageEndDate)}` : ""} · ${previewTasks.length} 个每日模块</span>${draft.goal ? `<p><strong>阶段目标：</strong>${escapeHTML(draft.goal)}</p>` : ""}${draft.stageEndDate ? "<p>阶段结束后若下一版本尚未发布，当前每日课程会继续沿用，不会产生任务空档。</p>" : ""}</div><ol>${previewTasks.map((item) => `<li><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.instruction)}</span></li>`).join("")}</ol>${skipped ? `<p>已有完成记录的 ${skipped} 个日期会保留同名任务的完成状态；当前顺延中的学习日会按生效版本补齐模块。</p>` : ""}`;
  refs.coursePlanPreview.hidden = false;
}

function saveOverallPlan() {
  const draft = collectCourseDraft();
  const today = toISODate(new Date());
  if (!draft?.title || !draft.effectiveDate || (draft.stageEndDate && draft.stageEndDate < draft.effectiveDate)) {
    showToast(draft?.stageEndDate && draft.stageEndDate < draft.effectiveDate ? "阶段结束日期不能早于生效日期" : "请填写课程名称和生效日期");
    return;
  }
  if (draft.effectiveDate < today) {
    showToast("新版本不能从过去日期开始生效");
    return;
  }
  const latestEffectiveDate = state.coursePlans.releases.filter((item) => item.kidId === editorKid).map((item) => item.effectiveDate).sort().at(-1);
  if (latestEffectiveDate && draft.effectiveDate < latestEffectiveDate) {
    showToast(`已有 ${latestEffectiveDate} 生效的较新安排；新版本不能插入它之前`);
    return;
  }
  const now = new Date().toISOString();
  const release = window.CourseReleases.publishDraft(draft, state.coursePlans.releases, {
    id: createRecordId("course-release"), createdAt: now, publishedAt: now
  });
  if (!release) {
    showToast("课程草稿不完整，暂时无法发布");
    return;
  }
  state.coursePlans.releases.push(release);
  state.coursePlans.drafts[editorKid] = null;
  refreshGeneratedFutureDays(editorKid, release.effectiveDate);
  saveState();
  refs.coursePlanPreview.hidden = true;
  showToast(`${profileById(editorKid).name}的课程 v${release.version} 已发布`);
  render();
}

function resetOverallPlan() {
  state.coursePlans.drafts[editorKid] = null;
  refs.coursePlanPreview.hidden = true;
  saveState();
  showToast("已放弃草稿修改");
  render();
}

function renderCourseReleaseList() {
  const releases = state.coursePlans.releases.filter((release) => release.kidId === editorKid).slice().reverse();
  refs.courseReleaseList.innerHTML = releases.length ? releases.map((release) => `<div class="plan-period-item course-release-item"><div><strong>v${release.version} · ${escapeHTML(release.title)}</strong><span>${escapeHTML(release.effectiveDate)} 起生效${release.stageEndDate ? ` · 阶段预计至 ${escapeHTML(release.stageEndDate)}` : ""} · 已发布${release.goal ? ` · 目标：${escapeHTML(release.goal)}` : ""}</span></div><button type="button" data-restore-course-release="${escapeAttr(release.id)}">基于此版本新建草稿</button></div>`).join("") : '<p class="empty-plan-state">尚未发布版本，当前仍使用历史总体设置。</p>';
  refs.courseReleaseList.querySelectorAll("[data-restore-course-release]").forEach((button) => {
    button.addEventListener("click", () => restoreCourseReleaseAsDraft(button.dataset.restoreCourseRelease));
  });
}

function restoreCourseReleaseAsDraft(releaseId) {
  const release = state.coursePlans.releases.find((item) => item.id === releaseId && item.kidId === editorKid);
  if (!release) return;
  const latestEffectiveDate = state.coursePlans.releases.filter((item) => item.kidId === editorKid).map((item) => item.effectiveDate).sort().at(-1);
  const tomorrow = toISODate(addDays(new Date(), 1));
  state.coursePlans.drafts[editorKid] = window.CourseReleases.draftFromRelease(release, {
    id: createRecordId("course-draft"),
    effectiveDate: [tomorrow, latestEffectiveDate || tomorrow].sort().at(-1),
    updatedAt: new Date().toISOString()
  });
  refs.coursePlanPreview.hidden = true;
  saveState();
  showToast(`已基于 v${release.version} 创建草稿；预览后再发布`);
  render();
}

function refreshGeneratedFutureDays(kidId, fromDate = toISODate(new Date())) {
  const today = toISODate(new Date());
  Object.entries(state.days[kidId] || {}).forEach(([date, day]) => {
    if (date < today || date < fromDate || day.planPeriodId || day.planScope === "day" || day.tasks?.some((item) => item.source !== "parent" && item.done)) return;
    state.days[kidId][date] = preserveDayState(buildDefaultDay(date, kidId), day);
  });
}

function familyTaskDraft() {
  const recurrence = refs.familyTaskRecurrence.value;
  const customDates = refs.familyTaskCustomDates.value.split(/[\s,，、;；]+/).map((value) => value.trim()).filter(Boolean);
  return {
    recurrence,
    startDate: refs.familyTaskStart.value,
    endDate: recurrence === "once" ? refs.familyTaskStart.value : refs.familyTaskEnd.value,
    customDates
  };
}

function renderFamilyTaskPreview() {
  if (!refs.familyTaskPreview) return;
  const recurrence = refs.familyTaskRecurrence.value;
  const custom = recurrence === "custom";
  refs.familyTaskCustomRow.hidden = !custom;
  document.querySelector('[data-family-date="start"]').hidden = custom;
  document.querySelector('[data-family-date="end"]').hidden = custom || recurrence === "once";
  const dates = window.FamilyTaskSchedules.expandDates(familyTaskDraft());
  const target = refs.familyTaskKid.value === "both" ? "哥哥和弟弟" : profileById(refs.familyTaskKid.value).name;
  if (!dates.length) {
    refs.familyTaskPreview.textContent = custom ? "请填写至少一个有效日期。" : "请选择正确的执行日期。";
    return;
  }
  const sample = dates.length <= 6 ? dates.map((date) => date.slice(5)).join("、") : `${dates.slice(0, 3).map((date) => date.slice(5)).join("、")}…${dates.at(-1).slice(5)}`;
  refs.familyTaskPreview.textContent = `${target} · 共 ${dates.length} 次：${sample}`;
}

function createRecordId(prefix) {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${suffix}`;
}

function publishFamilyTask(event) {
  event.preventDefault();
  const dates = window.FamilyTaskSchedules.expandDates(familyTaskDraft());
  if (!refs.familyTaskTitle.value.trim() || !refs.familyTaskDetail.value.trim() || !refs.familyTaskInstruction.value.trim()) {
    showToast("请填写任务名称、内容和执行步骤");
    return;
  }
  if (!dates.length) {
    showToast("请先选择有效的执行日期");
    return;
  }
  if (dates.length > 62) {
    showToast("临时任务一次最多安排 62 次");
    return;
  }
  const existing = state.taskSchedules.find((schedule) => schedule.id === editingFamilyTaskScheduleId);
  const now = new Date().toISOString();
  const input = {
    ...familyTaskDraft(),
    id: existing?.id || createRecordId("schedule"),
    taskId: existing?.taskId || createRecordId("task"),
    moduleId: "familyTask",
    title: refs.familyTaskTitle.value,
    detail: refs.familyTaskDetail.value,
    instruction: refs.familyTaskInstruction.value,
    minutes: refs.familyTaskMinutes.value,
    tags: ["家长发布"],
    kidIds: refs.familyTaskKid.value === "both" ? ["brother", "younger"] : [refs.familyTaskKid.value],
    status: "published",
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  const schedule = window.FamilyTaskSchedules.normalizeSchedule(input);
  if (existing) state.taskSchedules[state.taskSchedules.indexOf(existing)] = schedule;
  else state.taskSchedules.push(schedule);
  saveState();
  resetFamilyTaskForm();
  showToast(existing ? "尚未完成的安排已更新" : `临时任务已发布，共 ${dates.length} 次`);
  setParentSection("published");
  render();
}

function editFamilyTaskSchedule(scheduleId) {
  const schedule = state.taskSchedules.find((item) => item.id === scheduleId && item.status === "published");
  if (!schedule) return;
  editingFamilyTaskScheduleId = schedule.id;
  refs.familyTaskTitle.value = schedule.title;
  refs.familyTaskKid.value = schedule.kidIds.length === 2 ? "both" : schedule.kidIds[0];
  refs.familyTaskDetail.value = schedule.detail;
  refs.familyTaskInstruction.value = schedule.instruction;
  refs.familyTaskRecurrence.value = schedule.recurrence;
  refs.familyTaskMinutes.value = schedule.minutes;
  refs.familyTaskStart.value = schedule.startDate;
  refs.familyTaskEnd.value = schedule.endDate;
  refs.familyTaskCustomDates.value = schedule.recurrence === "custom" ? schedule.dates.join(", ") : "";
  refs.publishFamilyTask.textContent = "发布修改";
  refs.cancelFamilyTaskEdit.hidden = false;
  setParentSection("temporary");
  renderFamilyTaskPreview();
  refs.familyTaskTitle.focus();
}

function resetFamilyTaskForm() {
  editingFamilyTaskScheduleId = null;
  refs.familyTaskForm.reset();
  refs.familyTaskRecurrence.value = "once";
  refs.familyTaskMinutes.value = "10";
  refs.familyTaskStart.value = selectedDate;
  refs.familyTaskEnd.value = selectedDate;
  refs.publishFamilyTask.textContent = "发布临时任务";
  refs.cancelFamilyTaskEdit.hidden = true;
  renderFamilyTaskPreview();
}

function cancelFamilyTaskSchedule(scheduleId) {
  const schedule = state.taskSchedules.find((item) => item.id === scheduleId && item.status === "published");
  if (!schedule || !window.confirm("取消这项临时任务？已完成的记录会保留，尚未完成的安排会从孩子端移除。")) return;
  schedule.status = "cancelled";
  schedule.updatedAt = new Date().toISOString();
  if (editingFamilyTaskScheduleId === scheduleId) resetFamilyTaskForm();
  saveState();
  showToast("尚未完成的临时任务已取消");
  render();
}

function renderFamilyTaskSchedules() {
  const schedules = state.taskSchedules.filter((schedule) => schedule.status === "published").slice().reverse();
  if (!schedules.length) {
    refs.familyTaskScheduleList.innerHTML = '<p class="empty-plan-state">目前没有生效中的临时任务。</p>';
    return;
  }
  refs.familyTaskScheduleList.innerHTML = schedules.map((schedule) => {
    const kids = schedule.kidIds.map((kidId) => profileById(kidId).name).join("和");
    const total = schedule.dates.length * schedule.kidIds.length;
    return `<div class="plan-period-item family-task-schedule-item"><div><strong>${escapeHTML(schedule.title)} · ${escapeHTML(kids)}</strong><span>${schedule.dates.length} 个日期 · 共发布 ${total} 条 · ${escapeHTML(displayDateRange(schedule.startDate, schedule.endDate))} · 不影响长期课程进度</span></div><div class="schedule-actions"><button type="button" data-edit-family-task="${escapeAttr(schedule.id)}">编辑</button><button type="button" data-cancel-family-task="${escapeAttr(schedule.id)}">取消</button></div></div>`;
  }).join("");
  refs.familyTaskScheduleList.querySelectorAll("[data-edit-family-task]").forEach((button) => {
    button.addEventListener("click", () => editFamilyTaskSchedule(button.dataset.editFamilyTask));
  });
  refs.familyTaskScheduleList.querySelectorAll("[data-cancel-family-task]").forEach((button) => {
    button.addEventListener("click", () => cancelFamilyTaskSchedule(button.dataset.cancelFamilyTask));
  });
}

function renderRangePreview() {
  if (!refs.rangePreview) return;
  const target = refs.rangeKid.value === "both" ? "哥哥和弟弟" : profileById(refs.rangeKid.value).name;
  const start = refs.rangeStart.value;
  const end = refs.rangeEnd.value;
  const preset = refs.rangePreset.value;
  const registeredPreset = planPresetRegistry.get(preset);
  refs.rangePreview.textContent = registeredPreset
    ? registeredPreset.preview({ target, dateRange: displayDateRange(start, end) })
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
      const next = preset === "overall" ? buildDefaultDay(date, kidId) : buildPresetDay(preset, date, kidId);
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

function buildPresetDay(presetId, date, kidId, dayIndexOverride = null, courseDate = date) {
  const base = applyOverallSettings(kidId, buildRawTasks(date, dayIndexOverride, kidId), courseDate);
  const tasks = planPresetRegistry.apply(presetId, base, { createTask: task, date, kidId });
  return { tasks, mistakes: "", note: "", planScope: "range" };
}

function renderPlanPeriods() {
  if (!state.planPeriods.length) {
    refs.planPeriodList.innerHTML = '<p class="empty-plan-state">目前没有日期区间计划。</p>';
    return;
  }
  refs.planPeriodList.innerHTML = state.planPeriods.slice().reverse().map((period) => {
    const kids = period.kidIds.map((kidId) => profileById(kidId).name).join("和");
    const name = planPresetRegistry.get(period.preset)?.title || "总体任务";
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
  const ignoredLegacyIds = moduleRegistry.list().filter((item) => moduleRegistry.isDynamicContent(item.id)).map((item) => item.id);
  const overrides = existing.taskOverrides || (existing.planScope === "day"
    ? window.TaskOverrides.derive(existing.tasks, next.tasks, { ignoredIds: ignoredLegacyIds })
    : {});
  next.tasks = window.TaskOverrides.apply(next.tasks, overrides);
  if (Object.keys(overrides).length) next.taskOverrides = structuredClone(overrides);
  else delete next.taskOverrides;
  const existingTasks = new Map(existing.tasks.map((item) => [item.id, item]));
  next.tasks.forEach((item) => {
    const previous = existingTasks.get(item.id);
    item.done = Boolean(previous?.done);
    item.excused = Boolean(previous?.excused);
    if (previous?.completedOn) item.completedOn = previous.completedOn;
    if (previous?.excusedOn) item.excusedOn = previous.excusedOn;
    if (previous?.statusUpdatedAt) item.statusUpdatedAt = previous.statusUpdatedAt;
  });
  existing.tasks.filter((item) => item.source === "parent").forEach((item) => {
    if (!next.tasks.some((candidate) => candidate.id === item.id)) next.tasks.push(item);
  });
  return preserveDayNotes(next, existing);
}

function preserveDayNotes(next, existing) {
  next.mistakes = existing?.mistakes || "";
  next.note = existing?.note || next.note || "";
  next.planDayNumber ||= existing?.planDayNumber;
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
  const date = planDateForView(editorKid, selectedDate);
  const day = getDay(editorKid, date, selectedDate);
  const visibleTasks = summerPlanRegistry.activeTasks(day);
  refs.taskEditor.querySelectorAll("[data-field]").forEach((field) => {
    const item = visibleTasks[Number(field.dataset.index)];
    if (!item) return;
    if (field.dataset.field === "done") summerPlanRegistry.setTaskDone(item, field.checked, toISODate(new Date()));
    else item[field.dataset.field] = field.dataset.field === "tags"
        ? field.value.split(",").map((value) => value.trim()).filter(Boolean)
        : field.value.trim();
  });
  day.mistakes = refs.mistakeBox.value.trim();
  day.note = refs.parentNote.value.trim();
  const planDayIndex = day.planDayNumber ? day.planDayNumber - 1 : null;
  const period = day.planPeriodId ? state.planPeriods.find((item) => item.id === day.planPeriodId) : null;
  const baseline = period?.preset && period.preset !== "overall"
    ? buildPresetDay(period.preset, date, editorKid, planDayIndex, selectedDate)
    : buildDefaultDay(date, editorKid, planDayIndex, selectedDate);
  const ignoredLegacyIds = day.planScope === "day" && !day.taskOverrides
    ? moduleRegistry.list().filter((item) => moduleRegistry.isDynamicContent(item.id)).map((item) => item.id)
    : [];
  const overrides = window.TaskOverrides.derive(day.tasks, baseline.tasks, { ignoredIds: ignoredLegacyIds });
  if (Object.keys(overrides).length) day.taskOverrides = overrides;
  else delete day.taskOverrides;
  day.planScope = baseline.planScope;
  if (!period) delete day.planPeriodId;
  saveState();
  showToast("当天计划与补做状态已保存");
  render();
}

function resetCurrentDay() {
  const date = planDateForView(editorKid, selectedDate);
  const planDay = state.days[editorKid][date]?.planDayNumber;
  const generated = buildDefaultDay(date, editorKid, planDay ? planDay - 1 : null, selectedDate);
  if (planDay) generated.planDayNumber = planDay;
  const existing = structuredClone(state.days[editorKid][date] || {});
  delete existing.taskOverrides;
  existing.planScope = generated.planScope;
  delete existing.planPeriodId;
  state.days[editorKid][date] = preserveDayState(generated, existing);
  saveState();
  showToast("已恢复默认任务");
  render();
}

function setView(view) {
  currentView = view;
  refs.kidView.classList.toggle("active", view === "kid");
  refs.parentView.classList.toggle("active", view === "parent");
  refs.kidSwitcher.hidden = view !== "kid";
  document.getElementById("parentEntry").textContent = view === "parent" ? "查看孩子端" : "家长中心";
  if (view === "parent") setActiveNavigation("parent");
  else {
    refs.kidView.dataset.section = "today";
    setActiveNavigation("today");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function setParentSection(section) {
  const allowed = new Set(["course", "temporary", "today", "published"]);
  activeParentSection = allowed.has(section) ? section : "today";
  document.querySelectorAll("[data-parent-section]").forEach((button) => {
    const active = button.dataset.parentSection === activeParentSection;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-parent-pane]").forEach((pane) => {
    pane.hidden = pane.dataset.parentPane !== activeParentSection;
  });
}

function navigateToSection(target) {
  if (target === "parent") {
    setView("parent");
    return;
  }
  const showTarget = () => {
    refs.kidView.dataset.section = target;
    setActiveNavigation(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (currentView !== "kid") {
    setView("kid");
    window.setTimeout(showTarget, 120);
  } else {
    showTarget();
  }
}

function setActiveNavigation(target) {
  document.querySelectorAll("[data-nav-target]").forEach((button) => {
    const active = button.dataset.navTarget === target;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function moveDay(delta) {
  selectedDate = toISODate(addDays(parseISODate(selectedDate), delta));
  render();
}

function earnedSun(kidId) {
  return rewardRegistry.earnedSun(state, kidId);
}

function availableSun(kidId) {
  return earnedSun(kidId);
}

function streakFor(kidId, date) {
  return summerPlanRegistry.streak(state, kidId, date);
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
