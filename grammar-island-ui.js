(function () {
  const core = window.GrammarIslandCore;
  const course = window.GRAMMAR_ISLAND_COURSE;
  const refs = Object.fromEntries([
    "grammarIslandCard", "grammarIslandStatus", "grammarIslandNotice", "grammarIslandProgressText", "grammarIslandProgressBar",
    "grammarIslandDashboard", "grammarIslandLesson", "grammarIslandLive", "grammarIslandParentSchedule"
  ].map((id) => [id, document.getElementById(id)]));

  if (!core || !course || Object.values(refs).some((element) => !element)) return;

  let state = mergeGrammarStates(window.GrammarIslandSync?.getState?.(), core.load(window.localStorage));
  let kidId = "brother";
  let kidName = "哥哥";
  let parentScheduleKid = "brother";
  let parentScheduleDraft = null;
  let activeLesson = null;
  let stage = "dashboard";
  let oralIndex = 0;
  let oralRevealed = false;
  let oralRetrying = false;
  let oralRetryCounts = [];
  let oralRatings = [];
  let activeOralPrompts = [];
  let practiceSerial = 0;
  let checkIndex = 0;
  let answers = [];
  let checkResolved = [];
  let checkSelections = [];
  let wrongAttempts = [];
  let checkFeedback = null;
  let latestResult = null;
  let latestRewardEarned = false;
  let latestRewardAmount = 0;
  let scheduleMessage = "";
  let grammarSpeechAudio = null;

  refs.grammarIslandDashboard.addEventListener("click", handleDashboardClick);
  refs.grammarIslandLesson.addEventListener("click", handleLessonClick);
  refs.grammarIslandParentSchedule.addEventListener("change", handleParentScheduleChange);
  refs.grammarIslandParentSchedule.addEventListener("submit", handleScheduleSubmit);
  refs.grammarIslandParentSchedule.addEventListener("click", handleParentRecordsClick);
  window.addEventListener("learning-activity-context-change", renderForContext);
  state = persistGrammarState(state);
  renderForContext();
  backfillCompletedLessonRewards();
  const localPreviewLessonId = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    ? new URLSearchParams(window.location.search).get("grammar-preview")
    : null;
  if (localPreviewLessonId && course.lessons.some((lesson) => lesson.id === localPreviewLessonId)) startLesson(localPreviewLessonId);

  function renderForContext() {
    const context = window.LearningActivityProgress?.getContext?.();
    const nextKidId = context?.kidId || "brother";
    if (nextKidId === kidId && activeLesson) return;
    if (nextKidId !== kidId) {
      activeLesson = null;
      stage = "dashboard";
      stopEnglishAudio();
      scheduleMessage = "";
      window.speechSynthesis?.cancel();
    }
    kidId = nextKidId;
    kidName = context?.kidName || (kidId === "younger" ? "弟弟" : "哥哥");
    state = mergeGrammarStates(window.GrammarIslandSync?.getState?.(), core.load(window.localStorage));
    render();
  }

  function mergeGrammarStates(left, right) {
    const merged = window.TaskStateMigration?.mergeGrammarIslandStates?.(left, right) || right || left || core.emptyState();
    return core.normalizeState(merged);
  }

  function persistGrammarState(nextState) {
    const localState = core.save(window.localStorage, nextState);
    const syncedState = window.GrammarIslandSync?.save?.(localState);
    return core.normalizeState(syncedState || localState);
  }

  function backfillCompletedLessonRewards() {
    ["brother", "younger"].forEach((rewardKidId) => {
      const records = state.kids[rewardKidId].lessons;
      course.lessons.forEach((lesson) => {
        const record = records[lesson.id];
        if (!record?.completedAt) return;
        const detail = {
          kidId: rewardKidId,
          lessonId: lesson.id,
          earnedAt: record.completedAt,
          awarded: false,
          amount: 0,
          silent: true
        };
        window.dispatchEvent(new CustomEvent("grammar-island-reward-earned", { detail }));
      });
    });
  }

  function render() {
    renderHeader();
    renderParentSchedule();
    if (!activeLesson || stage === "dashboard") renderDashboard();
    else renderLesson();
  }

  function renderHeader() {
    const summary = core.summary(state, kidId, course.lessons);
    const schedule = core.scheduleFor(state, kidId, activeCourseDate());
    refs.grammarIslandStatus.textContent = `${summary.completed}/${summary.total} 课`;
    refs.grammarIslandProgressText.textContent = `${summary.completed}/${summary.total} 课`;
    refs.grammarIslandProgressBar.style.width = `${summary.percent}%`;
    refs.grammarIslandNotice.textContent = "";
  }

  function renderDashboard() {
    refs.grammarIslandDashboard.hidden = false;
    refs.grammarIslandLesson.hidden = true;
    const records = state.kids[kidId].lessons;
    const nextLesson = course.lessons.find((lesson) => !records[lesson.id]?.completedAt) || null;
    const today = activeCourseDate();
    const schedule = core.scheduleFor(state, kidId, today);
    const scheduledToday = core.isScheduledDate(today, schedule);
    const completedLessonToday = course.lessons.find((lesson) => records[lesson.id]?.latestSessionDate === today) || null;
    const context = window.LearningActivityProgress?.getContext?.();
    const previewPaperTask = window.LocalPlanPreview
      ? context?.modules?.find((item) => item.id === "grammarPaper")?.task
      : null;
    const paperTask = previewPaperTask || window.GrammarPaperPracticeSync?.getTask?.(kidId, today) || null;
    const nextDate = core.nextScheduledDate(today, schedule, false);
    const todayCard = completedLessonToday
      ? completedTodayCard(completedLessonToday, nextLesson, nextDate)
      : scheduledToday && nextLesson
        ? dueLessonCard(nextLesson)
        : paperTask
          ? paperTaskCard(paperTask)
          : nextLesson == null
            ? courseCompleteCard()
            : waitingCard(nextLesson, nextDate);
    refs.grammarIslandDashboard.innerHTML = `
      ${todayCard}
      ${completedLessonsPanel(records)}
    `;
  }

  function activeCourseDate() {
    return window.LocalPlanPreview?.date || core.localISODate();
  }

  function dueLessonCard(lesson) {
    return `<section class="grammar-today-card due">
      <span class="grammar-today-badge">今天学这个</span>
      <h3>${escapeHTML(lesson.title)}</h3>
      <p>${escapeHTML(lesson.focus)}</p>
      <button class="grammar-primary" type="button" data-grammar-lesson="${escapeAttr(lesson.id)}">开始</button>
    </section>`;
  }

  function waitingCard(lesson, nextDate) {
    return `<section class="grammar-today-card waiting">
      <span class="grammar-today-badge">今天不排语法</span>
      <h3>今天没有新的语法课</h3>
      <p>可以从下面挑一课再练习。</p>
    </section>`;
  }

  function paperTaskCard(task) {
    if (task.done) {
      return `<section class="grammar-today-card complete paper">
        <span class="grammar-today-badge">✓ 今天练习卷已完成</span>
        <h3>${escapeHTML(task.title)}</h3>
        <p>3 页已经完成啦！</p>
      </section>`;
    }
    return `<section class="grammar-today-card due paper">
      <span class="grammar-today-badge">今天做练习卷</span>
      <h3>${escapeHTML(task.title)}</h3>
      <p>${escapeHTML(task.detail)}</p>
      <p>做完后回到今日任务，点击“完成 +10☀”。</p>
    </section>`;
  }

  function completedTodayCard(completedLesson, nextLesson, nextDate) {
    return `<section class="grammar-today-card complete">
      <span class="grammar-today-badge">✓ 今天已经完成</span>
      <h3>今天的语法完成啦！</h3>
      <button class="grammar-primary" type="button" data-grammar-lesson="${escapeAttr(completedLesson.id)}">再练一次</button>
    </section>`;
  }

  function courseCompleteCard() {
    return `<section class="grammar-today-card complete">
      <span class="grammar-today-badge">✓ 基础阶段完成</span>
      <h3>9 课已经全部完成</h3>
      <p>真棒，所有课程都学完了！</p>
    </section>`;
  }

  function completedLessonsPanel(records) {
    const completed = course.lessons.filter((lesson) => records[lesson.id]?.completedAt);
    if (!completed.length) return "";
    return `<details class="grammar-completed-lessons">
      <summary>再练学过的课程</summary>
      <div>${completed.map((lesson) => {
        return `<button type="button" data-grammar-lesson="${escapeAttr(lesson.id)}"><span><strong>${escapeHTML(lesson.title)}</strong></span><b>重练</b></button>`;
      }).join("")}</div>
    </details>`;
  }

  function renderParentSchedule() {
    const today = core.localISODate();
    const schedule = core.scheduleFor(state, parentScheduleKid, today);
    const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const paperSchedule = window.GrammarPaperPracticeSync?.getSchedule?.(parentScheduleKid);
    const parentKidName = parentScheduleKid === "younger" ? "弟弟" : "哥哥";
    const summary = core.summary(state, parentScheduleKid, course.lessons);
    const scheduleDraft = parentScheduleDraft?.kidId === parentScheduleKid ? parentScheduleDraft : null;
    const formStartDate = scheduleDraft?.startDate || schedule.startDate;
    const formWeekdays = scheduleDraft?.weekdays || schedule.weekdays;
    refs.grammarIslandParentSchedule.innerHTML = `<div class="grammar-parent-schedule-card">
      <div class="grammar-parent-schedule-heading">
        <div><strong>${escapeHTML(parentKidName)} · 已完成 ${summary.completed}/${summary.total} 课</strong><span>当前每周 ${schedule.weekdays.length} 天：${schedule.weekdays.map((day) => weekdayLabels[day]).join("、")}</span></div>
        <select aria-label="语法排课适用孩子"><option value="brother" ${parentScheduleKid === "brother" ? "selected" : ""}>哥哥</option><option value="younger" ${parentScheduleKid === "younger" ? "selected" : ""}>弟弟</option></select>
      </div>
      <form class="grammar-schedule-form">
        <p>为${escapeHTML(parentKidName)}自由选择每周学习日（至少 1 天）。保存后，孩子端只在选中的排课日显示当前课次。</p>
        <label>开始日期<input name="grammar-start-date" type="date" required value="${escapeAttr(formStartDate)}"></label>
        <fieldset><legend>每周学习日 · 可自由多选</legend><div class="grammar-weekday-options">
          ${weekdayLabels.map((label, day) => `<label><input type="checkbox" name="grammar-weekday" value="${day}" ${formWeekdays.includes(day) ? "checked" : ""}>${label}</label>`).join("")}
        </div></fieldset>
        ${scheduleMessage ? `<p class="grammar-schedule-message">${escapeHTML(scheduleMessage)}</p>` : ""}
        <button class="grammar-primary" type="submit">保存语法小岛排课</button>
      </form>
      ${paperSchedule ? `<div class="grammar-paper-schedule-summary"><strong>蓝书纸面巩固</strong><span>${escapeHTML(paperSchedule.startDate)} 起，每周 ${paperSchedule.weekdays.map((day) => weekdayLabels[day]).join("、")}；自动对应最近学完且尚未完成纸面的语法课，每次 3 页、完成 +10 阳光。</span></div>` : ""}
      <section class="grammar-parent-records" aria-label="两个孩子的语法学习记录">
        <div class="grammar-parent-records-heading"><div><strong>语法学习记录 · 两个孩子</strong><span>记录始终同时显示；排课下拉框只控制上面的排课表。</span></div></div>
        <div class="grammar-parent-kid-records">${["brother", "younger"].map(parentRecordBlock).join("")}</div>
      </section>
    </div>`;
  }

  function startLesson(lessonId) {
    stopEnglishAudio();
    activeLesson = course.lessons.find((lesson) => lesson.id === lessonId);
    if (!activeLesson) return;
    stage = "explain";
    oralIndex = 0;
    oralRevealed = false;
    oralRetrying = false;
    oralRetryCounts = [];
    oralRatings = [];
    activeOralPrompts = shuffleWithSeed(activeLesson.oralPrompts, `${kidId}|${activeLesson.id}|${++practiceSerial}`);
    checkIndex = 0;
    answers = [];
    checkResolved = [];
    checkSelections = [];
    wrongAttempts = [];
    checkFeedback = null;
    latestResult = null;
    latestRewardEarned = false;
    latestRewardAmount = 0;
    render();
    refs.grammarIslandCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderLesson() {
    refs.grammarIslandDashboard.hidden = true;
    refs.grammarIslandLesson.hidden = false;
    refs.grammarIslandLesson.innerHTML = `<div class="grammar-lesson-shell">
      <div class="grammar-lesson-toolbar">
        <button class="grammar-back" type="button" data-grammar-action="dashboard">← 返回语法小岛</button>
        <span class="grammar-step-label">${escapeHTML(activeLesson.title)}</span>
      </div>
      ${stageTrack()}
      ${stage === "explain" ? explainStage() : stage === "oral" ? oralStage() : stage === "check" ? checkStage() : resultStage()}
    </div>`;
    if (stage === "explain") setupMicroLesson();
  }

  function stageTrack() {
    const index = stage === "explain" ? 1 : stage === "oral" ? 2 : 3;
    return `<div class="grammar-step-track" aria-label="讲解、口头操练、检测">
      <span class="${index >= 1 ? "active" : ""}"></span><span class="${index >= 2 ? "active" : ""}"></span><span class="${index >= 3 ? "active" : ""}"></span>
    </div>`;
  }

  function explainStage() {
    return `<section class="grammar-stage">
      <span class="grammar-stage-tag">第 1 步 · 讲解</span>
      <h3>${escapeHTML(activeLesson.title)}</h3>
      <p class="grammar-stage-lead">${escapeHTML(activeLesson.focus)}</p>
      ${activeLesson.microLesson ? microLessonHTML(activeLesson.microLesson) : explanationListHTML(activeLesson.explanation)}
      ${extraExamplesHTML(activeLesson.microLesson?.extraExamples)}
      ${activeLesson.microLesson ? `<details class="grammar-text-backup"><summary>想再看一遍文字规则</summary>${explanationListHTML(activeLesson.explanation)}</details>` : ""}
      ${vocabularySupportHTML(activeLesson.vocabularySupport, "新词 · 点一下可以听")}
      <button class="grammar-primary" type="button" data-grammar-action="start-oral">我看懂了，开始开口练习</button>
    </section>`;
  }

  function explanationListHTML(items) {
    return `<ul class="grammar-explain-list">${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
  }

  function extraExamplesHTML(examples) {
    if (!examples?.length) return "";
    return `<details class="grammar-extra-examples">
      <summary>还不懂？再看几个例子</summary>
      <div>${examples.map((example) => `<article>
        <b>${escapeHTML(example.icon)}</b>
        <span><strong>${escapeHTML(example.title)}</strong>${example.steps.map((step) => `<small>${escapeHTML(step)}</small>`).join("")}<em>${escapeHTML(example.answer)}</em></span>
      </article>`).join("")}</div>
    </details>`;
  }

  function microLessonHTML(microLesson) {
    return `<div class="grammar-micro-lesson" data-grammar-micro-lesson>
      <div class="grammar-micro-heading">
        <div><span>🎞️ 有声小动画</span><strong>${escapeHTML(microLesson.title)}</strong></div>
        <b>${escapeHTML(microLesson.durationLabel)}</b>
      </div>
      <div class="grammar-micro-screen" data-grammar-micro-screen aria-live="polite">
        ${microSceneHTML(microLesson.scenes[0])}
      </div>
      <audio data-grammar-micro-audio preload="metadata" src="${escapeAttr(microLesson.audio)}"></audio>
      <div class="grammar-micro-progress" aria-hidden="true"><span data-grammar-micro-progress></span></div>
      <div class="grammar-micro-controls">
        <button type="button" data-grammar-micro-action="toggle">▶ 开始讲解</button>
        <span data-grammar-micro-time>0:00 / ${formatMicroTime(microLesson.durationSeconds)}</span>
      </div>
      <div class="grammar-micro-scenes" aria-label="讲解分段">
        ${microLesson.scenes.map((scene, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-grammar-micro-scene="${index}" aria-label="跳到第 ${index + 1} 段"><span></span><small>${escapeHTML(scene.eyebrow)}</small></button>`).join("")}
      </div>
    </div>`;
  }

  function microSceneHTML(scene) {
    if (scene.kind === "cards") {
      return `<div class="grammar-micro-scene cards">
        <span class="grammar-micro-eyebrow">${escapeHTML(scene.eyebrow)}</span>
        <div class="grammar-concept-cards count-${Math.min(scene.cards.length, 3)}">${scene.cards.map(([icon, label, example, note]) => `<div>
          <b>${escapeHTML(icon)}</b>
          <strong>${escapeHTML(label)}</strong>
          <span>${escapeHTML(example)}</span>
          ${note ? `<small>${escapeHTML(note)}</small>` : ""}
        </div>`).join("")}</div>
        <p>${escapeHTML(scene.caption)}</p>
      </div>`;
    }
    if (scene.kind === "quantity") {
      return `<div class="grammar-micro-scene quantity">
        <span class="grammar-micro-eyebrow">${escapeHTML(scene.eyebrow)}</span>
        <div class="grammar-quantity-compare">
          <div><b>${escapeHTML(scene.singular.icon)}</b><strong>${escapeHTML(scene.singular.text)}</strong></div>
          <span>→</span>
          <div><b>${escapeHTML(scene.plural.icons)}</b><strong>${highlightSuffix(scene.plural.text, "s")}</strong></div>
        </div>
        <p>${escapeHTML(scene.caption)}</p>
      </div>`;
    }
    if (scene.kind === "suffix") {
      return `<div class="grammar-micro-scene suffix">
        <span class="grammar-micro-eyebrow">${escapeHTML(scene.eyebrow)}</span>
        ${scene.endings ? `<div class="grammar-ending-chips">${scene.endings.map((ending) => `<b>${escapeHTML(ending)}</b>`).join("")}</div>` : ""}
        <div class="grammar-word-transformations">${scene.examples.map(([from, to, icon]) => `<div><span>${escapeHTML(icon)}</span><strong>${escapeHTML(from)}</strong><i>→</i><strong>${highlightChangedEnding(from, to)}</strong></div>`).join("")}</div>
        <p>${escapeHTML(scene.caption)}</p>
      </div>`;
    }
    if (scene.kind === "y-rule") {
      return `<div class="grammar-micro-scene y-rule">
        <span class="grammar-micro-eyebrow">${escapeHTML(scene.eyebrow)}</span>
        <div class="grammar-y-comparison">
          ${microWordChangeHTML(scene.change, "换掉 y")}
          ${microWordChangeHTML(scene.contrast, "保留 y")}
        </div>
        <p>${escapeHTML(scene.caption)}</p>
      </div>`;
    }
    return `<div class="grammar-micro-scene recap">
      <span class="grammar-micro-eyebrow">${escapeHTML(scene.eyebrow)}</span>
      <div class="grammar-recap-grid">${scene.examples.map(([text, icons]) => `<div><b>${escapeHTML(icons)}</b><strong>${highlightPluralEnding(text)}</strong></div>`).join("")}</div>
      <p>${escapeHTML(scene.caption)}</p>
    </div>`;
  }

  function microWordChangeHTML([from, to, icon], label) {
    return `<div><small>${escapeHTML(label)}</small><b>${escapeHTML(icon)}</b><span><strong>${escapeHTML(from)}</strong><i>→</i><strong>${highlightChangedEnding(from, to)}</strong></span></div>`;
  }

  function highlightChangedEnding(from, to) {
    let prefixLength = 0;
    while (prefixLength < from.length && prefixLength < to.length && from[prefixLength] === to[prefixLength]) prefixLength += 1;
    return `${escapeHTML(to.slice(0, prefixLength))}<em>${escapeHTML(to.slice(prefixLength))}</em>`;
  }

  function highlightSuffix(text, suffix) {
    const escaped = escapeHTML(text);
    return escaped.endsWith(suffix) ? `${escaped.slice(0, -suffix.length)}<em>${escapeHTML(suffix)}</em>` : escaped;
  }

  function highlightPluralEnding(text) {
    const word = String(text).split(" ").at(-1);
    const suffix = word.endsWith("ies") ? "ies" : word.endsWith("es") ? "es" : "s";
    return highlightSuffix(text, suffix);
  }

  function setupMicroLesson() {
    const container = refs.grammarIslandLesson.querySelector("[data-grammar-micro-lesson]");
    const audio = container?.querySelector("[data-grammar-micro-audio]");
    if (!container || !audio || !activeLesson?.microLesson) return;
    const refresh = () => updateMicroLesson(container, audio);
    ["loadedmetadata", "timeupdate", "play", "pause", "ended"].forEach((eventName) => audio.addEventListener(eventName, refresh));
    audio.addEventListener("error", () => {
      container.classList.add("audio-error");
      const button = container.querySelector('[data-grammar-micro-action="toggle"]');
      if (button) button.textContent = "旁白暂时无法播放，请看文字规则";
    });
    refresh();
  }

  function updateMicroLesson(container, audio) {
    const microLesson = activeLesson.microLesson;
    const duration = Number.isFinite(audio.duration) ? audio.duration : Number(microLesson.durationSeconds || 85);
    const currentTime = Math.min(Number(audio.currentTime || 0), duration);
    const sceneIndex = microLesson.scenes.reduce((result, scene, index) => currentTime >= scene.at ? index : result, 0);
    const previousSceneIndex = Number(container.dataset.activeScene || -1);
    if (sceneIndex !== previousSceneIndex) {
      container.dataset.activeScene = String(sceneIndex);
      container.querySelector("[data-grammar-micro-screen]").innerHTML = microSceneHTML(microLesson.scenes[sceneIndex]);
      container.querySelectorAll("[data-grammar-micro-scene]").forEach((button, index) => button.classList.toggle("active", index === sceneIndex));
    }
    const progress = container.querySelector("[data-grammar-micro-progress]");
    if (progress) progress.style.width = `${duration ? (currentTime / duration) * 100 : 0}%`;
    const time = container.querySelector("[data-grammar-micro-time]");
    if (time) time.textContent = `${formatMicroTime(currentTime)} / ${formatMicroTime(duration)}`;
    const toggle = container.querySelector('[data-grammar-micro-action="toggle"]');
    if (toggle && !container.classList.contains("audio-error")) {
      toggle.textContent = audio.ended ? "↻ 再听一遍" : !audio.paused ? "❚❚ 暂停" : currentTime < 0.25 ? "▶ 开始讲解" : "▶ 继续讲解";
    }
  }

  function formatMicroTime(seconds) {
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
  }

  function oralStage() {
    const prompt = activeOralPrompts[oralIndex];
    return `<section class="grammar-stage">
      <span class="grammar-stage-tag">第 2 步 · 口头操练 ${oralIndex + 1}/${activeOralPrompts.length}</span>
      <h3>先自己说，再听示范</h3>
      <div class="grammar-oral-cue">${escapeHTML(prompt.cue)}</div>
      ${vocabularySupportHTML(vocabularyForText(activeLesson, `${prompt.cue} ${prompt.answer}`), "不认识？点一下听")}
      ${oralRevealed ? `
        <div class="grammar-model-answer"><span>示范句</span><strong>${escapeHTML(prompt.answer)}</strong></div>
        <button class="grammar-primary" type="button" data-grammar-action="listen-again">▶ 再听一次示范</button>
        <p class="grammar-speak-hint">对照后选一个最真实的结果</p>
        <div class="grammar-oral-actions">
          <button class="grammar-self-rate good" type="button" data-oral-rating="can">${oralRetrying ? "这次会了" : "我会自己说"}</button>
          <button class="grammar-self-rate" type="button" data-oral-rating="again">${oralRetrying ? "继续再练" : "还要再练一次"}</button>
        </div>` : `
        ${oralRetrying ? `<div class="grammar-retry-scaffold"><strong>重练提示</strong><span>${escapeHTML(prompt.scaffold || "看关键词，把整句话重新说一遍。")}</span></div>` : ""}
        <p class="grammar-speak-hint">${oralRetrying ? "不要照读答案，根据提示重新完整说一遍" : "现在请大声说，不需要按住麦克风"}</p>
        <button class="grammar-primary" type="button" data-grammar-action="reveal-model">${oralRetrying ? "我重新说好了，听示范" : "我说好了，听示范"}</button>`}
    </section>`;
  }

  function checkStage() {
    const check = activeLesson.checks[checkIndex];
    const selected = checkSelections[checkIndex];
    const resolved = Boolean(checkResolved[checkIndex]);
    return `<section class="grammar-stage">
      <span class="grammar-stage-tag">第 3 步 · 小检测 ${checkIndex + 1}/${activeLesson.checks.length}</span>
      <h3>选出最合适的答案</h3>
      <div class="grammar-check-prompt">${escapeHTML(check.prompt)}</div>
      ${vocabularySupportHTML(vocabularyForText(activeLesson, `${check.prompt} ${check.choices.join(" ")}`), "不认识？点一下听")}
      <div class="grammar-choice-grid">${check.choices.map((choice) => {
        const selectedClass = selected === choice ? (resolved ? "correct" : "wrong") : "";
        return `<button class="grammar-choice ${selectedClass}" type="button" data-grammar-choice="${escapeAttr(choice)}" ${resolved ? "disabled" : ""}>${escapeHTML(choice)}</button>`;
      }).join("")}</div>
      ${checkFeedback ? `<p class="grammar-check-feedback ${checkFeedback.type}">${escapeHTML(checkFeedback.text)}</p>` : ""}
      <button class="grammar-primary" type="button" data-grammar-action="next-check" ${resolved ? "" : "disabled"}>${resolved
        ? (checkIndex === activeLesson.checks.length - 1 ? "完成检测" : "答对了，进入下一题")
        : (checkIndex === activeLesson.checks.length - 1 ? "答对后完成检测" : "答对后进入下一题")}</button>
    </section>`;
  }

  function resultStage() {
    const recommendation = core.recommendation(latestResult.percent);
    const canSay = oralRatings.filter((rating) => rating === "can").length;
    const afterRetry = oralRatings.filter((rating) => rating === "after-retry").length;
    return `<section class="grammar-stage grammar-result ${escapeAttr(recommendation.level)}">
      <span class="grammar-stage-tag">本课完成</span>
      <h3>${escapeHTML(activeLesson.title)}</h3>
      <div class="grammar-score-ring">${latestResult.percent}%</div>
      <p>答对 ${latestResult.correct}/${latestResult.total} 题 · 会说 ${canSay + afterRetry} 句</p>
      <p class="grammar-reward-result ${latestRewardEarned ? "earned" : "claimed"}">${latestRewardEarned ? `☀ +${latestRewardAmount} 阳光` : "这次也练完啦！"}</p>
      <p class="grammar-recommendation">${escapeHTML(recommendation.text)}</p>
      <div class="grammar-result-actions">
        <button class="grammar-back" type="button" data-grammar-action="retry">再练本课</button>
        <button class="grammar-primary" type="button" data-grammar-action="dashboard">回到语法小岛</button>
      </div>
    </section>`;
  }

  function handleDashboardClick(event) {
    const button = event.target.closest("[data-grammar-lesson]");
    if (button) startLesson(button.dataset.grammarLesson);
  }

  function handleScheduleSubmit(event) {
    if (!event.target.matches(".grammar-schedule-form")) return;
    event.preventDefault();
    const form = new FormData(event.target);
    const weekdays = form.getAll("grammar-weekday").map(Number);
    if (!weekdays.length) {
      scheduleMessage = "请至少选择一个学习日。";
      renderParentSchedule();
      return;
    }
    state = core.setSchedule(state, parentScheduleKid, {
      startDate: form.get("grammar-start-date"),
      weekdays
    }, core.localISODate());
    state = persistGrammarState(state);
    parentScheduleDraft = null;
    scheduleMessage = "排课已保存。";
    render();
  }

  function handleParentScheduleChange(event) {
    if (event.target.matches('select[aria-label="语法排课适用孩子"]')) {
      parentScheduleKid = event.target.value === "younger" ? "younger" : "brother";
      parentScheduleDraft = null;
      scheduleMessage = "";
      renderParentSchedule();
      return;
    }
    const form = event.target.closest(".grammar-schedule-form");
    if (!form) return;
    const values = new FormData(form);
    parentScheduleDraft = {
      kidId: parentScheduleKid,
      startDate: values.get("grammar-start-date"),
      weekdays: values.getAll("grammar-weekday").map(Number)
    };
    scheduleMessage = "排课尚未保存；云端刷新不会覆盖当前选择。";
  }

  function handleParentRecordsClick(event) {
    const lessonButton = event.target.closest("[data-grammar-reset-lesson]");
    const lessonId = lessonButton?.dataset.grammarResetLesson;
    const recordKidId = lessonButton?.dataset.grammarResetKid === "younger" ? "younger" : "brother";
    const resetAllKid = event.target.closest("[data-grammar-reset-all]")?.dataset.grammarResetAll;
    if (lessonId) {
      const recordKidName = recordKidId === "younger" ? "弟弟" : "哥哥";
      const lesson = course.lessons.find((item) => item.id === lessonId);
      if (!lesson || !window.confirm(`确定重置${recordKidName}的“${lesson.title}”学习记录吗？排课和暑假计划不会改变。`)) return;
      state = persistGrammarState(core.resetLessonProgress(state, recordKidId, lessonId));
      scheduleMessage = `已重置${recordKidName}的“${lesson.title}”记录；排课和暑假计划未改变。`;
      render();
      return;
    }
    if (resetAllKid) {
      const resetKidId = resetAllKid === "younger" ? "younger" : "brother";
      const resetKidName = resetKidId === "younger" ? "弟弟" : "哥哥";
      if (!window.confirm(`确定重置${resetKidName}的全部语法学习记录吗？排课和暑假计划不会改变。`)) return;
      state = persistGrammarState(core.resetKidProgress(state, resetKidId));
      scheduleMessage = `已重置${resetKidName}的全部语法记录；排课和暑假计划未改变。`;
      render();
    }
  }

  function parentRecordBlock(recordKidId) {
    const recordKidName = recordKidId === "younger" ? "弟弟" : "哥哥";
    const lessonRecords = state.kids[recordKidId].lessons;
    const completedLessons = course.lessons.filter((lesson) => lessonRecords[lesson.id]?.completedAt);
    return `<section class="grammar-parent-kid-record" aria-label="${escapeAttr(recordKidName)}语法记录">
      <div class="grammar-parent-kid-record-heading"><div><strong>${escapeHTML(recordKidName)}</strong><span>已完成 ${completedLessons.length}/${course.lessons.length} 课</span></div>${completedLessons.length ? `<button type="button" class="grammar-reset-all" data-grammar-reset-all="${escapeAttr(recordKidId)}">重置全部</button>` : ""}</div>
      ${completedLessons.length ? `<div class="grammar-parent-record-list">${completedLessons.map((lesson) => {
        const record = lessonRecords[lesson.id];
        const attemptCount = Number(record.attemptCount || record.attempts?.length || 1);
        return `<article><div><strong>${escapeHTML(lesson.title)}</strong><span>最佳首次正确率 ${Number(record.bestPercent || 0)}% · 已练 ${attemptCount} 次</span><small>最近练习：${escapeHTML(formatRecordDate(record.latestAt))}</small></div><button type="button" data-grammar-reset-kid="${escapeAttr(recordKidId)}" data-grammar-reset-lesson="${escapeAttr(lesson.id)}">重置本课</button></article>`;
      }).join("")}</div>` : `<p class="grammar-record-empty">还没有完成记录。</p>`}
    </section>`;
  }

  function handleLessonClick(event) {
    const action = event.target.closest("[data-grammar-action]")?.dataset.grammarAction;
    const microAction = event.target.closest("[data-grammar-micro-action]")?.dataset.grammarMicroAction;
    const microScene = event.target.closest("[data-grammar-micro-scene]")?.dataset.grammarMicroScene;
    const rating = event.target.closest("[data-oral-rating]")?.dataset.oralRating;
    const choice = event.target.closest("[data-grammar-choice]")?.dataset.grammarChoice;
    const vocabularyButton = event.target.closest("[data-grammar-vocab]");
    const vocabularyWord = vocabularyButton?.dataset.grammarVocab;
    const microAudio = refs.grammarIslandLesson.querySelector("[data-grammar-micro-audio]");
    if (microAction === "toggle" && microAudio) {
      stopEnglishAudio();
      if (microAudio.ended) microAudio.currentTime = 0;
      if (microAudio.paused) microAudio.play().catch(() => {
        refs.grammarIslandLive.textContent = "旁白没有成功播放，请再点一次播放，或展开文字规则。";
      });
      else microAudio.pause();
      return;
    }
    if (microScene != null && microAudio && activeLesson?.microLesson) {
      stopEnglishAudio();
      const scene = activeLesson.microLesson.scenes[Number(microScene)];
      if (scene) {
        microAudio.currentTime = scene.at;
        microAudio.play().catch(() => {});
      }
      return;
    }
    if (vocabularyWord) {
      microAudio?.pause();
      speakEnglish(vocabularyWord, vocabularyButton.dataset.grammarAudio);
      return;
    }
    if (choice != null && stage === "check") {
      const check = activeLesson.checks[checkIndex];
      if (checkResolved[checkIndex]) return;
      if (answers[checkIndex] == null) answers[checkIndex] = choice;
      checkSelections[checkIndex] = choice;
      if (choice === check.answer) {
        checkResolved[checkIndex] = true;
        checkFeedback = {
          type: "good",
          text: wrongAttempts[checkIndex] ? "这次找对了！记住刚才的判断方法。" : "答对了！可以进入下一题。"
        };
      } else {
        wrongAttempts[checkIndex] = Number(wrongAttempts[checkIndex] || 0) + 1;
        checkFeedback = { type: "try", text: wrongHint(activeLesson.id) };
      }
      renderLesson();
      return;
    }
    if (rating && stage === "oral") {
      stopEnglishAudio();
      if (rating === "again") {
        oralRetryCounts[oralIndex] = Number(oralRetryCounts[oralIndex] || 0) + 1;
        oralRetrying = true;
        oralRevealed = false;
      } else {
        oralRatings.push(oralRetryCounts[oralIndex] ? "after-retry" : "can");
        oralIndex += 1;
        oralRevealed = false;
        oralRetrying = false;
        if (oralIndex >= activeOralPrompts.length) stage = "check";
      }
      renderLesson();
      return;
    }
    if (action === "dashboard") {
      microAudio?.pause();
      activeLesson = null;
      stage = "dashboard";
      stopEnglishAudio();
      window.speechSynthesis?.cancel();
      render();
    } else if (action === "start-oral") {
      microAudio?.pause();
      stopEnglishAudio();
      stage = "oral";
      renderLesson();
    } else if (action === "reveal-model") {
      oralRevealed = true;
      renderLesson();
      speakEnglish(activeOralPrompts[oralIndex].answer, activeOralPrompts[oralIndex].audio);
    } else if (action === "listen-again") {
      speakEnglish(activeOralPrompts[oralIndex].answer, activeOralPrompts[oralIndex].audio);
    } else if (action === "next-check") {
      if (!checkResolved[checkIndex]) return;
      if (checkIndex < activeLesson.checks.length - 1) {
        checkIndex += 1;
        checkFeedback = null;
        renderLesson();
      } else {
        const completed = core.completeLesson(state, kidId, activeLesson, oralRatings, answers, new Date(), core.localISODate());
        state = persistGrammarState(completed.state);
        latestResult = completed.result;
        latestRewardEarned = false;
        latestRewardAmount = 0;
        if (completed.firstCompletion) {
          const rewardDetail = { kidId, lessonId: activeLesson.id, earnedAt: latestResult.completedAt, awarded: false, amount: 0 };
          window.dispatchEvent(new CustomEvent("grammar-island-reward-earned", { detail: rewardDetail }));
          latestRewardEarned = rewardDetail.awarded === true;
          latestRewardAmount = Number(rewardDetail.amount || 0);
        }
        stage = "result";
        refs.grammarIslandLive.textContent = `本课完成，检测得分 ${latestResult.percent}%`;
        render();
      }
    } else if (action === "retry") {
      startLesson(activeLesson.id);
    }
  }

  function speakEnglish(text, audioUrl) {
    stopEnglishAudio();
    window.speechSynthesis?.cancel();
    if (audioUrl && typeof Audio !== "undefined") {
      const audio = new Audio(audioUrl);
      grammarSpeechAudio = audio;
      audio.preload = "auto";
      audio.addEventListener("ended", () => {
        if (grammarSpeechAudio === audio) grammarSpeechAudio = null;
      }, { once: true });
      audio.play().catch(() => {
        if (grammarSpeechAudio !== audio) return;
        grammarSpeechAudio = null;
        speakEnglishWithBrowser(text);
      });
      return;
    }
    speakEnglishWithBrowser(text);
  }

  function stopEnglishAudio() {
    if (!grammarSpeechAudio) return;
    grammarSpeechAudio.pause();
    grammarSpeechAudio.currentTime = 0;
    grammarSpeechAudio = null;
  }

  function speakEnglishWithBrowser(text) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      refs.grammarIslandLive.textContent = "当前浏览器暂不支持示范语音，请家长读出屏幕上的示范句。";
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.78;
    const voice = window.speechSynthesis.getVoices().find((item) => /^en[-_]/i.test(item.lang));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function wrongHint(lessonId) {
    const hints = {
      "w1-a-an": "还不对。把后面的单词大声读出来，听它开头的第一个音。",
      "w1-plurals": "还不对。先看前面的数量，再检查名词应该用什么词尾。",
      "w2-pronouns": "还不对。先判断说的是男孩、女孩、物品，还是多个对象。",
      "w2-possessives": "还不对。先找清楚这个东西属于谁，再选择对应的词。",
      "w3-be": "还不对。先圈出主语，再想它和 am、is、are 中的哪一个配对。",
      "w3-demonstratives": "还不对。先判断远近，再判断是一个还是多个。",
      "w4-have-has": "还不对。先看主语；he、she、it 通常和 has 配对。",
      "w4-prepositions": "还不对。想象物品是在里面、上面，还是下面。",
      "w5-checkpoint": "还不对。把完整句子读一遍，再根据主语、数量或位置重新判断。"
    };
    return hints[lessonId] || "还不对。先把完整句子读一遍，再试一次。";
  }

  function formatShortDate(value) {
    if (!value) return "待安排";
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return `${month}月${day}日 周${["日", "一", "二", "三", "四", "五", "六"][date.getDay()]}`;
  }

  function formatRecordDate(value) {
    if (!value) return "暂无时间";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "暂无时间";
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function shuffleWithSeed(values, seedText) {
    const result = [...values];
    let stateValue = 2166136261;
    for (const character of String(seedText)) {
      stateValue ^= character.charCodeAt(0);
      stateValue = Math.imul(stateValue, 16777619) >>> 0;
    }
    for (let index = result.length - 1; index > 0; index -= 1) {
      stateValue = (Math.imul(stateValue, 1664525) + 1013904223) >>> 0;
      const target = stateValue % (index + 1);
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function vocabularyForText(lesson, text) {
    const normalized = ` ${String(text).toLowerCase().replace(/[^a-z]+/g, " ")} `;
    return (lesson.vocabularySupport || []).filter((entry) => (
      normalized.includes(` ${entry.word.toLowerCase().replace(/[^a-z]+/g, " ").trim()} `)
    ));
  }

  function vocabularySupportHTML(items, label) {
    if (!items?.length) return "";
    return `<div class="grammar-vocab-support"><strong>${escapeHTML(label)}</strong><div>${items.map((entry) => `<button type="button" data-grammar-vocab="${escapeAttr(entry.word)}" data-grammar-audio="${escapeAttr(entry.audio || "")}"><span>▶ ${escapeHTML(entry.word)}</span><small>${escapeHTML(entry.zh)}</small></button>`).join("")}</div></div>`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  }

  function escapeAttr(value) {
    return escapeHTML(value).replace(/'/g, "&#39;");
  }
})();
