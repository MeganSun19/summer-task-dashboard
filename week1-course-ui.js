(function () {
  const phonicsLessonContent = window.PHONICS_LESSON_CONTENT;
  const phonicsAudioSources = window.PHONICS_AUDIO_SOURCES;
  const wordMeanings = window.ENGLISH_WORD_MEANINGS;
  const refs = Object.fromEntries([
    "week1CourseCard", "week1CourseDay", "week1CourseStatus", "week1CourseFocus", "week1CourseNotice", "week1CourseWords",
    "week1CourseStart", "week1CoursePlayer", "week1CourseAudioPlay", "week1CourseProgressBar", "week1CoursePrompt",
    "week1CourseChoices", "week1CourseReadDone", "week1CourseFeedback", "week1CourseLog", "week1CourseActivity"
  ].map((id) => [id, document.getElementById(id)]));

  if (!window.AudioStore || !window.OPWWeek1CourseCore || !Array.isArray(phonicsLessonContent) || !Array.isArray(phonicsAudioSources) || !wordMeanings || Object.values(refs).some((element) => !element)) return;

  let course = null;
  let day = null;
  let dayNumber = null;
  let allRounds = [];
  let modules = [];
  let activeModule = null;
  let activeRounds = [];
  let moduleProgress = {};
  let availableAssetIds = new Set();
  let roundIndex = 0;
  let wrongAttempts = 0;
  let reviewMistakes = new Set();
  let running = false;
  let practiceMode = false;
  let actionRoundVisible = false;
  let chosenBooks = {};
  let activeChosenBooks = {};
  let overallCompletedAt = null;
  let learnedExtensionWords = [];
  let extensionPlanActive = false;
  let currentContextKey = "";
  let practiceShuffleSerial = 0;
  let activeChoiceSeed = "";
  let heartWordBankPage = 0;
  let phonicsLessonButton = null;
  let phonicsLessonStage = null;
  let phonicsLessonSegmentIndex = null;
  let completedPhonicsDays = [];
  let phonicsAuditMode = false;
  let phonicsPreviewMode = false;
  const ROUND_SCHEMA_VERSION = 6;
  const EXTENSION_PLAN_VERSION = 1;
  const HEART_WORD_BANK_PAGE_SIZE = 40;
  refs.week1CoursePlayer.setAttribute("playsinline", "");
  refs.week1CoursePlayer.setAttribute("webkit-playsinline", "");
  refs.week1CoursePlayer.addEventListener("ended", handleCoursePlayerEnded);
  refs.week1CoursePlayer.addEventListener("timeupdate", syncPhonicsLessonAnimation);
  refs.week1CoursePlayer.addEventListener("loadedmetadata", syncPhonicsLessonAnimation);

  refs.week1CourseStart.addEventListener("click", returnToDashboard);
  refs.week1CourseChoices.addEventListener("click", chooseWord);
  refs.week1CourseChoices.addEventListener("click", handleCourseLessonClick);
  refs.week1CourseChoices.addEventListener("click", showSpellingAnswer);
  refs.week1CourseChoices.addEventListener("submit", checkSpelling);
  refs.week1CourseWords.addEventListener("click", handleOverviewClick);
  refs.week1CoursePrompt.addEventListener("click", playHeartWord);
  refs.week1CourseChoices.addEventListener("click", playHeartWord);
  refs.week1CourseReadDone.addEventListener("click", completeNonChoiceRound);
  refs.week1CourseAudioPlay.addEventListener("click", playCurrentRoundAudio);
  window.addEventListener("learning-activity-context-change", renderForContext);
  window.addEventListener("opw-audio-library-change", renderForContext);

  loadCourse();

  async function loadCourse() {
    try {
      const response = await fetch("./curriculum/english-course.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      course = await response.json();
      if (!Array.isArray(course?.days) || !course.days.length) throw new Error("课程天数为空");
      await renderForContext();
    } catch (error) {
      refs.week1CourseCard.hidden = false;
      refs.week1CourseStatus.textContent = "课程加载失败";
      refs.week1CourseStart.disabled = true;
      refs.week1CourseFeedback.textContent = `请刷新页面重试：${error.message}`;
      refs.week1CourseFeedback.className = "week1-course-feedback try";
    }
  }

  function renderForContext() {
    if (!course) return;
    const context = window.LearningActivityProgress?.getContext();
    const isLocalPreviewHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const previewParams = new URLSearchParams(window.location.search);
    const previewDay = isLocalPreviewHost ? Number(previewParams.get("phonics-preview")) : 0;
    const planPreviewDay = isLocalPreviewHost ? Number(window.LocalPlanPreview?.planDay) : 0;
    phonicsAuditMode = isLocalPreviewHost && previewParams.get("phonics-audit") === "1";
    const validPreviewDay = previewDay >= 1 && previewDay <= course.days.length
      ? previewDay
      : planPreviewDay >= 1 && planPreviewDay <= course.days.length
        ? planPreviewDay
        : phonicsAuditMode ? 1 : 0;
    phonicsPreviewMode = Boolean(validPreviewDay);
    document.body.classList.toggle("phonics-preview-mode", Boolean(previewDay || phonicsAuditMode));
    const nextContextKey = `${context?.kidId || ""}|${context?.date || ""}|${context?.planDay || ""}|preview:${validPreviewDay}|audit:${phonicsAuditMode}`;
    const audioPlaying = !refs.week1CoursePlayer.paused && !refs.week1CoursePlayer.ended;
    if (currentContextKey === nextContextKey && (activeModule || phonicsLessonButton || audioPlaying)) return;
    stopCourseAudio();
    running = false;
    activeModule = null;
    heartWordBankPage = 0;
    currentContextKey = nextContextKey;
    const moduleContext = context?.modules?.find((item) => item.activity?.renderer === "english-course");
    if (!moduleContext && !validPreviewDay) {
      refs.week1CourseCard.hidden = true;
      return;
    }
    dayNumber = validPreviewDay || Number(moduleContext?.planDay) || window.OPWWeek1CourseCore.courseDayNumber(
      context?.date,
      moduleContext?.startDate,
      course.days.length
    );
    day = dayNumber ? course.days.find((item) => item.day === dayNumber) : null;
    refs.week1CourseCard.hidden = !day;
    if (!day) return;

    const history = phonicsPreviewMode ? [] : window.LearningActivityProgress?.getHistory?.() || [];
    completedPhonicsDays = planPreviewDay
      ? course.days.filter((lessonDay) => lessonDay.day < dayNumber)
      : completedCourseDays(history, dayNumber);
    const stored = phonicsPreviewMode
      ? null
      : window.LearningActivityProgress?.get(window.OPWWeek1CourseCore.activityId(dayNumber));
    const extensionPlan = window.OPWWeek1CourseCore.extensionPlanForActivity(
      day.heartWords,
      stored,
      history,
      EXTENSION_PLAN_VERSION
    );
    extensionPlanActive = extensionPlan.active;
    day = {
      ...day,
      heartWords: extensionPlan.heartWords
    };
    day = prepareStageReviewDay(day);
    allRounds = window.OPWWeek1CourseCore.buildRounds(day);
    modules = window.OPWWeek1CourseCore.groupRoundsByModule(allRounds);
    if (!allRounds.length || !modules.length) {
      refs.week1CourseStart.disabled = true;
      refs.week1CourseStatus.textContent = "课程数据错误";
      refs.week1CoursePrompt.textContent = "今天的课程没有生成，请刷新页面";
      refs.week1CourseFeedback.textContent = "课程轮次为 0，已停止保存完成状态。";
      refs.week1CourseFeedback.className = "week1-course-feedback try";
      return;
    }
    refs.week1CourseStart.disabled = false;
    availableAssetIds = new Set(allRounds.map((round) => round.assetId).filter(Boolean));
    moduleProgress = window.OPWWeek1CourseCore.moduleProgressFromSaved(stored, modules, ROUND_SCHEMA_VERSION);
    chosenBooks = migrateChosenBooks(stored);
    overallCompletedAt = stored?.completedAt || null;
    learnedExtensionWords = Number(stored?.extensionPlanVersion || 0) >= EXTENSION_PLAN_VERSION
      ? [...new Set(stored?.learnedExtensionWords || [])]
      : [];
    wrongAttempts = Math.max(0, Number(stored?.wrongAttempts) || 0);
    reviewMistakes = new Set(Array.isArray(stored?.reviewMistakes) ? stored.reviewMistakes : []);

    refs.week1CourseDay.textContent = `英语岛 · 第 ${day.day} 天`;
    refs.week1CourseFocus.textContent = childFriendlyFocus(day.focus);
    renderDashboard();
    if (phonicsAuditMode) renderPhonicsAudit();
  }

  function renderPhonicsAudit() {
    const statusLabel = (status) => status === "human-approved" ? "已人工确认" : "待逐音试听";
    const sourceCards = phonicsAudioSources.map((source) => `<article class="phonics-audit-source ${source.reviewStatus === "human-approved" ? "approved" : "pending"}" data-phonics-source-id="${escapeAttr(source.id)}">
      <header><strong>${escapeHTML(source.displayLabel || source.patterns.join(" / "))}</strong><span>${escapeHTML(source.ipa)}</span><em>${escapeHTML(statusLabel(source.reviewStatus))}</em></header>
      <button type="button" data-phonics-audit-audio="${escapeAttr(`phonics-media/phonemes/${source.id}.mp3?v=20260819-phonics-audit-2`)}" data-phonics-default-label="▶ 单独听音" data-phonics-pause-label="❚❚ 暂停" data-phonics-continue-label="▶ 继续">▶ 单独听音</button>
      <p>${escapeHTML(source.sourceLabel)}</p>
      <small>${escapeHTML(source.riskNote)}</small>
    </article>`).join("");
    const lessonCards = course.days.map((lessonDay) => {
      const lesson = phonicsLessonContent.find((entry) => entry.day === lessonDay.day);
      const marks = lesson?.animationScenes?.map((scene) => scene.mark).join(" · ") || "";
      return `<details class="phonics-audit-lesson"><summary>第 ${lessonDay.day} 课 <span>${escapeHTML(marks)}</span></summary>${phonicsLessonMarkup(lessonDay, true)}</details>`;
    }).join("");
    refs.week1CourseDay.textContent = "自然拼读 · 全量验音";
    refs.week1CourseStatus.textContent = `${phonicsAudioSources.length} 个音 · 26 课`;
    refs.week1CourseFocus.textContent = "家长本地审核页（不会出现在孩子页面）";
    refs.week1CourseNotice.hidden = false;
    refs.week1CourseNotice.textContent = "先逐音检查，再展开任意一课检查声音、文字与单词是否同步。未全部确认前，发布脚本会自动停止。";
    refs.week1CourseWords.hidden = false;
    refs.week1CourseWords.innerHTML = `<section class="phonics-audit-panel"><h3>全部目标音</h3><div class="phonics-audit-grid">${sourceCards}</div><h3>全部 26 课动画</h3><div class="phonics-audit-lessons">${lessonCards}</div></section>`;
  }

  function prepareStageReviewDay(baseDay) {
    const review = baseDay?.stageReview;
    if (!review) return baseDay;
    const quizWords = (review.phonicsQuiz || []).map((item) => {
      const sourceDay = course.days.find((entry) => entry.day === item.sourceDay);
      const sourceWord = sourceDay?.phonics?.words?.find((entry) => entry.word === item.word);
      return sourceWord ? { ...sourceWord, reviewMode: item.mode, sourceDay: item.sourceDay } : null;
    }).filter(Boolean);
    return {
      ...baseDay,
      focus: "前 11 天阶段复习：先听讲解，再完成拼读和高频词测验",
      phonics: { ...baseDay.phonics, words: quizWords },
      heartWords: {
        ...baseDay.heartWords,
        new: null,
        newWords: [],
        review: [...(review.coreWords || [])],
        extensionWords: [],
        extensionReview: [...(review.extensionWords || [])]
      },
      raz: review.skipRaz ? {
        ...baseDay.raz,
        targetWords: [],
        sentenceFrames: [],
        sourceBooks: [],
        supportingBooks: [],
        assignment: null
      } : baseDay.raz
    };
  }

  function buildOverview() {
    const stageReview = Boolean(day.stageReview);
    const heartReviewWords = new Set([
      ...(day.heartWords.review || []),
      ...(day.heartWords.extensionReview || [])
    ]);
    const heartReviewMistakes = [...reviewMistakes].filter((word) => heartReviewWords.has(word));
    const phonics = stageReview ? `<p class="stage-review-summary">20 道题 · 听音选词和直接拼写</p>` : day.phonics.words.map((entry) => {
      const round = allRounds.find((item) => item.kind === "phonics" && item.word === entry.word);
      const playable = round.mode === "listen" && availableAssetIds.has(round.assetId);
      return playable
        ? `<button class="week1-word-chip audio-word-chip listen" type="button" data-phonics-audio="${escapeAttr(entry.word)}" aria-label="播放 ${escapeAttr(entry.word)} 的发音"><span class="audio-play-icon" aria-hidden="true">▶</span>${wordWithMeaning(entry.word)}</button>`
        : `<span class="week1-word-chip read">${wordWithMeaning(entry.word)}</span>`;
    }).join("");
    const newHeartWords = day.heartWords.newWords || [day.heartWords.new].filter(Boolean);
    const heart = stageReview ? `<p class="stage-review-summary">30 个词 · 不看答案独立拼写</p>` : [...newHeartWords, ...day.heartWords.review].filter(Boolean).map((word) => (
      heartWordChip(word)
    )).join("");
    const newExtensionWords = day.heartWords.extensionWords || [];
    const extension = stageReview ? "" : [...newExtensionWords, ...(day.heartWords.extensionReview || [])].filter((word, index, words) => words.indexOf(word) === index).map((word) => (
      heartWordChip(word)
    )).join("");
    const assignment = day.raz.assignment;
    const books = assignment?.mode === "fixed" ? assignment.books : (assignment?.fixedBooks || []);
    const phonicsTeacher = stageReview ? "" : phonicsLessonMarkup(day);
    const heartReviewResult = stageReview && heartReviewMistakes.length
      ? `<p class="stage-review-result">高频词需要再练：${heartReviewMistakes.map((word) => escapeHTML(word)).join(" · ")}</p>`
      : "";
    return `<div class="english-module-grid">
      ${stageReview ? moduleCard("reviewLessons", "▶", "回看 11 课", "完整听完以前的讲解", `<p class="stage-review-summary">约 9 分钟 · 自动记录已听课程</p>`) : ""}
      ${moduleCard("soundLab", "Aa", stageReview ? "自然拼读测验" : "声音实验室", stageReview ? "听音选词，再直接拼写" : "先看动画，再拼单词", `${phonicsTeacher}${phonics}${phonicsHistoryMarkup()}`)}
      ${moduleCard("coreWords", "词", stageReview ? "高频词阶段测验" : "核心高频词", stageReview ? "30 个熟词，看看记得多牢" : "读一读，写一写", `${heart}${heartReviewResult}`)}
      ${moduleCard("raz", "读", "RAZ 故事森林", "读今天的书", `<div class="module-raz-books">${books.map((book, index) => `<span>${index + 1}. ${highlightHeartWords(book)}</span>`).join("")}${assignment?.mode === "choose" ? `<span class="raz-choice-rule">${escapeHTML(assignment.rule)}</span>` : ""}<small>${escapeHTML(day.raz.focus)}</small></div>`)}
      ${extension ? moduleCard("extraWords", "+", "高频词加餐", "再学几个词", extension) : ""}
      </div>`;
  }

  function phonicsLessonMarkup(lessonDay, historical = false) {
    const lessonExamples = phonicsLessonContent.find((entry) => entry.day === lessonDay.day);
    const mainWords = lessonExamples?.mainExamples || [];
    const extraWords = lessonExamples?.extensionExamples || [];
    const [mainFocus = "今天的声音", extensionFocus = "再认一个常见组合"] = String(lessonDay.focus || "").split("｜常见规律拓展：");
    const [mainTitle, mainTip = "先分音，再把声音连起来"] = mainFocus.split("：");
    const sceneWords = (words) => words.map((word) => `<span><b>${escapeHTML(word)}</b><small>${escapeHTML(wordMeaning(word))}</small></span>`).join("");
    const label = historical ? `第 ${lessonDay.day} 天声音动画` : "今天的自然拼读动画";
    const customScenes = lessonExamples?.animationScenes || [];
    const scenesMarkup = customScenes.length ? customScenes.map((scene, index) => `<div class="phonics-mini-scene ${index === 0 ? "active" : ""}" data-phonics-scene="${index}">
          <span class="phonics-scene-kicker">${escapeHTML(scene.kicker)}</span>
          <strong class="phonics-sound-mark">${escapeHTML(scene.mark)}</strong>
          <span class="phonics-pronunciation">发音 ${escapeHTML(scene.pronunciation)}</span>
          <p>${escapeHTML(scene.title)}</p>
          <div class="phonics-scene-words">${sceneWords(scene.words)}</div>
          <small>${escapeHTML(scene.tip)}</small>
        </div>`).join("") : `<div class="phonics-mini-scene active" data-phonics-scene="0">
          <span class="phonics-scene-kicker">先看声音</span>
          <strong class="phonics-sound-mark">${escapeHTML(phonicsSoundMark(lessonDay.phonics.pattern, mainTitle))}</strong>
          <p>${escapeHTML(mainTitle)}</p><small>${escapeHTML(mainTip)}</small>
        </div>
        <div class="phonics-mini-scene" data-phonics-scene="1">
          <span class="phonics-scene-kicker">一起拼一拼</span>
          <div class="phonics-scene-words">${sceneWords(mainWords)}</div>
          <small>从左到右，声音不断开</small>
        </div>
        <div class="phonics-mini-scene" data-phonics-scene="2">
          <span class="phonics-scene-kicker">再发现一个规律</span>
          <p>${escapeHTML(extensionFocus)}</p>
          <div class="phonics-scene-words extra">${sceneWords(extraWords)}</div>
        </div>`;
    const sceneStarts = lessonExamples?.sceneStarts?.join(",") || "";
    const sceneCount = customScenes.length || 3;
    const sceneButtons = customScenes.map((scene, index) => {
      const label = `▶ ${scene.mark}`;
      return `<button type="button" class="${index === 0 ? "active" : ""}" data-phonics-scene-play="${index}" data-phonics-scene-audio="${escapeAttr(phonicsSceneAudioUrl(lessonDay.day, index))}" data-phonics-default-label="${escapeAttr(label)}" data-phonics-pause-label="${escapeAttr(`❚❚ ${scene.mark}`)}" data-phonics-continue-label="${escapeAttr(`▶ 继续 ${scene.mark}`)}">${escapeHTML(label)}</button>`;
    }).join("");
    return `<section class="phonics-mini-lesson" data-phonics-lesson-stage="${lessonDay.day}" data-phonics-scene-starts="${escapeAttr(sceneStarts)}" aria-label="${escapeAttr(label)}">
      <div class="phonics-mini-screen">
        ${scenesMarkup}
      </div>
      <div class="phonics-mini-progress" aria-hidden="true"><div data-phonics-animation-progress></div></div>
      <div class="phonics-mini-controls">
        <button class="phonics-lesson-audio" type="button" data-phonics-lesson-audio="${escapeAttr(phonicsLessonAudioUrl(lessonDay.day))}" data-phonics-lesson-day="${lessonDay.day}" data-phonics-default-label="▶ 播放全部" data-phonics-pause-label="❚❚ 暂停全部" data-phonics-continue-label="▶ 继续全部">▶ 播放全部</button>
      </div>
      <div class="phonics-scene-controls" aria-label="选择要重听的声音">${sceneButtons || Array.from({ length: sceneCount }, (_, index) => `<button type="button" data-phonics-scene-play="${index}">▶ 第 ${index + 1} 段</button>`).join("")}</div>
    </section>`;
  }

  function phonicsHistoryMarkup() {
    if (!completedPhonicsDays.length) return "";
    const buttons = completedPhonicsDays.map((lessonDay) => (
      `<button type="button" data-phonics-history-day="${lessonDay.day}"><b>第 ${lessonDay.day} 天</b><span>${escapeHTML(phonicsSoundMark(lessonDay.phonics.pattern, lessonDay.focus))}</span></button>`
    )).join("");
    return `<details class="phonics-history">
      <summary>已学自然拼读 · ${completedPhonicsDays.length} 课 <span>展开重听</span></summary>
      <div class="phonics-history-days">${buttons}</div>
      <div class="phonics-history-preview" data-phonics-history-preview></div>
    </details>`;
  }

  function completedCourseDays(history, currentDayNumber) {
    const completedIds = new Set((history || []).filter(({ record }) => (
      record?.completedAt || record?.moduleProgress?.soundLab?.completedAt
    )).map(({ activityId }) => activityId));
    return course.days.filter((lessonDay) => (
      lessonDay.day < currentDayNumber && completedIds.has(window.OPWWeek1CourseCore.activityId(lessonDay.day))
    ));
  }

  function heartWordBankMarkup() {
    const words = course.heartWords?.words || [];
    const pageCount = Math.max(1, Math.ceil(words.length / HEART_WORD_BANK_PAGE_SIZE));
    heartWordBankPage = Math.min(Math.max(0, heartWordBankPage), pageCount - 1);
    const start = heartWordBankPage * HEART_WORD_BANK_PAGE_SIZE;
    const visibleWords = words.slice(start, start + HEART_WORD_BANK_PAGE_SIZE);
    const chips = visibleWords.map((entry) => (
      heartWordChip(entry.word, true)
    )).join("");
    return `<div class="heart-word-bank-chips">${chips}</div>
      <nav class="heart-word-bank-pages" aria-label="高频词总表分页">
        <button type="button" data-heart-word-page="-1" ${heartWordBankPage === 0 ? "disabled" : ""}>上一页</button>
        <span>第 ${start + 1}–${Math.min(start + HEART_WORD_BANK_PAGE_SIZE, words.length)} 词 · ${heartWordBankPage + 1}/${pageCount} 页</span>
        <button type="button" data-heart-word-page="1" ${heartWordBankPage >= pageCount - 1 ? "disabled" : ""}>下一页</button>
      </nav>`;
  }

  function moduleCard(id, icon, title, description, content) {
    const module = modules.find((item) => item.id === id);
    if (!module) return "";
    const progress = moduleProgress[id] || { completedRounds: 0, completedAt: null };
    const complete = Boolean(progress.completedAt);
    const started = progress.completedRounds > 0;
    const stateLabel = complete ? "✓ 完成" : started ? `${progress.completedRounds}/${module.rounds.length}` : "";
    const actionLabel = complete ? "再练一次" : started ? "继续" : "开始";
    return `<article class="english-module-card module-${id} ${complete ? "complete" : ""}">
      <header><span class="english-module-icon">${escapeHTML(icon)}</span><div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p></div>${stateLabel ? `<span class="english-module-state">${escapeHTML(stateLabel)}</span>` : ""}</header>
      <div class="english-module-content">${content}</div>
      <button class="english-module-action" type="button" data-course-module="${escapeAttr(id)}">${escapeHTML(actionLabel)}</button>
    </article>`;
  }

  function renderDashboard(message = "") {
    stopCourseAudio();
    refs.week1CoursePlayer.hidden = true;
    refs.week1CourseAudioPlay.hidden = true;
    running = false;
    activeModule = null;
    activeRounds = [];
    refs.week1CourseFocus.textContent = childFriendlyFocus(day.focus);
    refs.week1CourseWords.hidden = false;
    refs.week1CourseWords.innerHTML = buildOverview();
    refs.week1CourseNotice.hidden = false;
    refs.week1CourseActivity.hidden = true;
    refs.week1CourseStart.hidden = true;
    const completedCount = modules.filter((module) => moduleProgress[module.id]?.completedAt).length;
    const complete = completedCount === modules.length;
    refs.week1CourseStatus.textContent = complete ? "✓ 今日完成" : `完成 ${completedCount}/${modules.length}`;
    refs.week1CourseStatus.classList.toggle("ready", complete);
    refs.week1CourseNotice.textContent = message || (complete ? "今天都完成啦！想练哪一项都可以再来一次。" : "选一项开始吧！");
    refs.week1CourseNotice.className = `week1-course-notice${complete ? " good" : ""}`;
  }

  function handleOverviewClick(event) {
    const auditAudioButton = event.target.closest("[data-phonics-audit-audio]");
    if (auditAudioButton) return playPhonicsAuditAudio(auditAudioButton);
    const historyButton = event.target.closest("[data-phonics-history-day]");
    if (historyButton) return showHistoricalPhonicsLesson(Number(historyButton.dataset.phonicsHistoryDay), historyButton);
    const lessonAudioButton = event.target.closest("[data-phonics-lesson-audio]");
    if (lessonAudioButton) return playPhonicsLesson(lessonAudioButton);
    const lessonSceneButton = event.target.closest("[data-phonics-scene-play]");
    if (lessonSceneButton) return playPhonicsScene(lessonSceneButton);
    const pageButton = event.target.closest("[data-heart-word-page]");
    if (pageButton) {
      heartWordBankPage += Number(pageButton.dataset.heartWordPage) || 0;
      const container = refs.week1CourseWords.querySelector("[data-heart-word-bank-content]");
      if (container) container.innerHTML = heartWordBankMarkup();
      return;
    }
    const moduleButton = event.target.closest("[data-course-module]");
    if (moduleButton) return startCourseModule(moduleButton.dataset.courseModule);
    if (event.target.closest("[data-phonics-audio]")) return playPhonicsWord(event);
    return playHeartWord(event);
  }

  function handleCourseLessonClick(event) {
    const lessonAudioButton = event.target.closest("[data-phonics-lesson-audio]");
    if (lessonAudioButton) return playPhonicsLesson(lessonAudioButton);
    const lessonSceneButton = event.target.closest("[data-phonics-scene-play]");
    if (lessonSceneButton) return playPhonicsScene(lessonSceneButton);
  }

  function playPhonicsAuditAudio(button) {
    const player = refs.week1CoursePlayer;
    const audioUrl = new URL(button.dataset.phonicsAuditAudio, document.baseURI).href;
    if (phonicsLessonButton === button && player.src === audioUrl) {
      if (!player.paused) {
        player.pause();
        button.textContent = button.dataset.phonicsContinueLabel || "▶ 继续";
        return;
      }
      if (!player.ended && player.currentTime > 0) {
        button.textContent = button.dataset.phonicsPauseLabel || "❚❚ 暂停";
        player.play().catch(resetPhonicsLessonButton);
        return;
      }
    }
    stopCourseAudio();
    phonicsLessonButton = button;
    phonicsLessonStage = null;
    phonicsLessonSegmentIndex = null;
    button.textContent = button.dataset.phonicsPauseLabel || "❚❚ 暂停";
    player.src = audioUrl;
    player.currentTime = 0;
    player.play().catch(() => {
      resetPhonicsLessonButton();
      refs.week1CourseNotice.textContent = "这个音没有播放，请再点一次。";
    });
  }

  function playPhonicsLesson(button) {
    const player = refs.week1CoursePlayer;
    const audioUrl = new URL(button.dataset.phonicsLessonAudio, document.baseURI).href;
    if (phonicsLessonButton === button && player.src === audioUrl) {
      if (!player.paused) {
        player.pause();
        button.textContent = button.dataset.phonicsContinueLabel || "▶ 继续全部";
        return;
      }
      if (!player.ended && player.currentTime > 0) {
        button.textContent = button.dataset.phonicsPauseLabel || "❚❚ 暂停全部";
        player.play().catch(() => {
          button.textContent = button.dataset.phonicsContinueLabel || "▶ 继续全部";
          refs.week1CourseNotice.textContent = "讲解没有继续播放，请再点一次。";
        });
        return;
      }
    }
    stopCourseAudio();
    phonicsLessonButton = button;
    phonicsLessonStage = button.closest("[data-phonics-lesson-stage]");
    phonicsLessonSegmentIndex = null;
    button.textContent = button.dataset.phonicsPauseLabel || "❚❚ 暂停全部";
    player.src = audioUrl;
    player.currentTime = 0;
    player.play().catch(() => {
      resetPhonicsLessonButton();
      refs.week1CourseNotice.textContent = "讲解没有播放，请再点一次。";
      refs.week1CourseNotice.className = "week1-course-notice";
    });
  }

  function playPhonicsScene(button) {
    const stage = button.closest("[data-phonics-lesson-stage]");
    if (!stage || !button.dataset.phonicsSceneAudio) return;
    const player = refs.week1CoursePlayer;
    const audioUrl = new URL(button.dataset.phonicsSceneAudio, document.baseURI).href;
    const sceneIndex = Number(button.dataset.phonicsScenePlay);
    if (phonicsLessonButton === button && player.src === audioUrl) {
      if (!player.paused) {
        player.pause();
        button.textContent = button.dataset.phonicsContinueLabel || `▶ 继续第 ${sceneIndex + 1} 段`;
        return;
      }
      if (!player.ended && player.currentTime > 0) {
        button.textContent = button.dataset.phonicsPauseLabel || `❚❚ 第 ${sceneIndex + 1} 段`;
        player.play().catch(() => {
          button.textContent = button.dataset.phonicsContinueLabel || `▶ 继续第 ${sceneIndex + 1} 段`;
        });
        return;
      }
    }
    stopCourseAudio();
    phonicsLessonButton = button;
    phonicsLessonStage = stage;
    phonicsLessonSegmentIndex = sceneIndex;
    button.textContent = button.dataset.phonicsPauseLabel || `❚❚ 第 ${sceneIndex + 1} 段`;
    setPhonicsLessonScene(stage, sceneIndex);
    player.src = audioUrl;
    player.currentTime = 0;
    player.play().catch(() => {
      resetPhonicsLessonButton();
      refs.week1CourseNotice.textContent = "这一段没有播放，请再点一次。";
    });
  }

  function resetPhonicsLessonButton() {
    if (phonicsLessonButton) phonicsLessonButton.textContent = phonicsLessonButton.dataset.phonicsDefaultLabel || "▶ 播放全部";
    phonicsLessonButton = null;
    phonicsLessonStage = null;
    phonicsLessonSegmentIndex = null;
  }

  function handleCoursePlayerEnded() {
    const completedWatch = running
      && activeRounds[roundIndex]?.mode === "watch"
      && Boolean(phonicsLessonButton?.dataset.phonicsLessonAudio)
      && phonicsLessonSegmentIndex === null;
    resetPhonicsLessonButton();
    if (completedWatch) advanceRound();
  }

  function setPhonicsLessonScene(stage, sceneIndex) {
    stage.querySelectorAll("[data-phonics-scene]").forEach((scene, index) => scene.classList.toggle("active", index === sceneIndex));
    stage.querySelectorAll("[data-phonics-scene-play]").forEach((control, index) => control.classList.toggle("active", index === sceneIndex));
  }

  function syncPhonicsLessonAnimation() {
    if (!phonicsLessonStage || !phonicsLessonButton) return;
    const player = refs.week1CoursePlayer;
    const duration = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : 21;
    const ratio = Math.min(1, Math.max(0, player.currentTime / duration));
    const customSceneStarts = String(phonicsLessonStage.dataset.phonicsSceneStarts || "").split(",").filter(Boolean).map(Number).filter(Number.isFinite);
    const sceneIndex = phonicsLessonSegmentIndex !== null ? phonicsLessonSegmentIndex : customSceneStarts.length
      ? customSceneStarts.reduce((activeIndex, start, index) => player.currentTime >= start ? index : activeIndex, 0)
      : ratio < .31 ? 0 : ratio < .7 ? 1 : 2;
    setPhonicsLessonScene(phonicsLessonStage, sceneIndex);
    const progress = phonicsLessonStage.querySelector("[data-phonics-animation-progress]");
    if (progress) progress.style.width = `${ratio * 100}%`;
  }

  function showHistoricalPhonicsLesson(historyDayNumber, button) {
    const lessonDay = course.days.find((item) => item.day === historyDayNumber);
    const preview = refs.week1CourseWords.querySelector("[data-phonics-history-preview]");
    if (!lessonDay || !preview) return;
    stopCourseAudio();
    refs.week1CourseWords.querySelectorAll("[data-phonics-history-day]").forEach((item) => item.classList.toggle("active", item === button));
    preview.innerHTML = phonicsLessonMarkup(lessonDay, true);
    preview.querySelector("[data-phonics-lesson-audio]")?.focus();
  }

  function stopCourseAudio() {
    const player = refs.week1CoursePlayer;
    if (!player.paused) player.pause();
    resetPhonicsLessonButton();
  }

  async function startCourseModule(moduleId) {
    const selected = modules.find((module) => module.id === moduleId);
    if (!selected) return;
    stopCourseAudio();
    activeModule = selected;
    refs.week1CourseFocus.textContent = activeModuleFocus(moduleId);
    const context = window.LearningActivityProgress?.getContext();
    const moduleContext = context?.modules?.find((item) => item.activity?.renderer === "english-course");
    if (!phonicsPreviewMode && !moduleContext?.startDate) window.LearningActivityProgress?.startModule(moduleContext?.id || "englishIsland");
    practiceMode = Boolean(moduleProgress[moduleId]?.completedAt);
    const savedModuleProgress = moduleProgress[moduleId] || { completedRounds: 0, completedAt: null };
    roundIndex = practiceMode ? 0 : savedModuleProgress.completedRounds || 0;
    const legacyPartialOrder = !practiceMode && roundIndex > 0 && !savedModuleProgress.roundOrderVersion;
    const shouldShuffleSoundLab = (moduleId === "soundLab" || (day.stageReview && moduleId === "coreWords")) && !legacyPartialOrder;
    activeChoiceSeed = practiceMode
      ? `${context?.kidId}|${dayNumber}|${moduleId}|practice-${Date.now()}-${++practiceShuffleSerial}`
      : `${context?.kidId}|${dayNumber}|${moduleId}|first-v1`;
    activeRounds = shouldShuffleSoundLab
      ? window.OPWWeek1CourseCore.shuffleWithSeed(selected.rounds, `${activeChoiceSeed}|rounds`)
      : [...selected.rounds];
    if (shouldShuffleSoundLab && !practiceMode && !savedModuleProgress.roundOrderVersion) {
      moduleProgress[moduleId] = { ...savedModuleProgress, roundOrderVersion: 1 };
    }
    activeChosenBooks = practiceMode ? {} : { ...chosenBooks };
    activeRounds.forEach((round, index) => {
      if (round.mode === "book-choice") delete round.selectedBook;
      if (round.mode === "book-choice" && activeChosenBooks[moduleRoundKey(moduleId, index)]) {
        round.selectedBook = activeChosenBooks[moduleRoundKey(moduleId, index)];
      }
    });
    running = true;
    refs.week1CourseWords.hidden = true;
    refs.week1CourseNotice.hidden = true;
    refs.week1CourseActivity.hidden = false;
    refs.week1CourseStart.hidden = false;
    refs.week1CourseStart.textContent = "返回模块选择";
    refs.week1CourseLog.innerHTML = activeRounds.slice(0, roundIndex).map((round, index) => (
      `<span>${index + 1}. ${escapeHTML(window.OPWWeek1CourseCore.roundSummary(round))}</span>`
    )).join("");
    refs.week1CourseFeedback.textContent = "";
    renderRound();
  }

  function returnToDashboard() {
    renderDashboard();
  }

  function renderRound() {
    if (!activeModule || !activeRounds.length) return;
    const complete = roundIndex >= activeRounds.length;
    refs.week1CourseProgressBar.style.width = `${activeRounds.length ? roundIndex / activeRounds.length * 100 : 0}%`;
    refs.week1CourseChoices.innerHTML = "";
    refs.week1CourseReadDone.hidden = true;
    actionRoundVisible = false;
    refs.week1CoursePlayer.hidden = true;
    refs.week1CourseAudioPlay.hidden = true;
    refs.week1CourseStart.hidden = false;
    refs.week1CourseStatus.textContent = `${activeModule.shortLabel} ${roundIndex}/${activeRounds.length}`;
    refs.week1CourseStatus.classList.remove("ready");

    if (complete) {
      running = false;
      const completedMessage = `${activeModule.label}完成啦！`;
      refs.week1CoursePrompt.textContent = completedMessage;
      refs.week1CourseStart.hidden = false;
      refs.week1CourseStart.textContent = "返回模块选择";
      const testedWords = activeRounds.map((round) => round.word).filter(Boolean);
      const mistakeCount = new Set(testedWords.filter((word) => reviewMistakes.has(word))).size;
      refs.week1CourseFeedback.textContent = day.stageReview && testedWords.length
        ? activeModule.id === "soundLab"
          ? `首次答对 ${testedWords.length - mistakeCount}/${testedWords.length}；这里练的是听音和拼读，不需要背这些单词。`
          : `首次答对 ${testedWords.length - mistakeCount}/${testedWords.length}；没记牢的词已经放到“高频词需要再练”。`
        : "做得好，回去选下一项吧。";
      refs.week1CourseFeedback.className = "week1-course-feedback good";
      if (!practiceMode) {
        moduleProgress[activeModule.id] = {
          completedRounds: activeRounds.length,
          completedAt: moduleProgress[activeModule.id]?.completedAt || new Date().toISOString(),
          roundOrderVersion: moduleProgress[activeModule.id]?.roundOrderVersion || 0
        };
        if (activeModule.id === "extraWords") {
          learnedExtensionWords = [...new Set([
            ...learnedExtensionWords,
            ...(day.heartWords?.extensionWords || [])
          ])];
        }
        saveProgress();
      }
      return;
    }

    const round = activeRounds[roundIndex];
    refs.week1CoursePrompt.innerHTML = `<span class="week1-stage">${escapeHTML(activeModule.label)}${practiceMode ? " · 再练" : ""}</span><span>第 ${roundIndex + 1}/${activeRounds.length}</span>`;
    if (!running) return;

    if (round.mode === "watch") return showWatchRound(round);
    if (round.mode === "listen") return showListenRound(round);
    if (round.mode === "spell") return showSpellingRound(round);
    if (round.mode === "choice") return showChoiceRound(round);
    if (round.mode === "book-choice") return showBookChoiceRound(round);
    showActionRound(round);
  }

  function showListenRound(round) {
    refs.week1CourseAudioPlay.hidden = false;
    refs.week1CourseAudioPlay.textContent = "▶ 播放本题音频";
    renderChoices(window.OPWWeek1CourseCore.shuffleWithSeed(round.choices, `${activeChoiceSeed}|${round.word}|choices`));
    refs.week1CourseFeedback.textContent = "先点播放听一遍，再选出你听到的词。";
    refs.week1CourseFeedback.className = "week1-course-feedback";
  }

  function showWatchRound(round) {
    const lessonDay = course.days.find((entry) => entry.day === round.lessonDay);
    if (!lessonDay) return;
    refs.week1CoursePrompt.innerHTML += `<strong class="week1-action-title">第 ${round.lessonDay} 天讲解</strong>`;
    refs.week1CourseChoices.innerHTML = phonicsLessonMarkup(lessonDay, true);
    refs.week1CourseFeedback.textContent = "完整播放结束后，才会进入下一课；没听清的声音可以分段重听。";
    refs.week1CourseFeedback.className = "week1-course-feedback read";
  }

  function showChoiceRound(round) {
    refs.week1CoursePrompt.innerHTML += `<strong class="week1-cloze">${escapeHTML(round.prompt)}</strong>`;
    renderChoices(round.choices);
    refs.week1CourseFeedback.textContent = "选一个词，把句子补完整。";
    refs.week1CourseFeedback.className = "week1-course-feedback";
  }

  function showBookChoiceRound(round) {
    const alreadyChosen = new Set(Object.values(activeChosenBooks));
    const choices = round.choices.filter((book) => !alreadyChosen.has(book) || round.selectedBook === book);
    refs.week1CoursePrompt.innerHTML += `<strong class="week1-action-title">${escapeHTML(round.group)} · 第 ${round.slot}/${round.slotCount} 本</strong><em>${escapeHTML(round.rule)}</em>`;
    refs.week1CourseChoices.innerHTML = choices.map((book) => (
      `<button class="week1-choice week1-book-choice" type="button" data-week1-book="${escapeAttr(book)}">${highlightHeartWords(book)}</button>`
    )).join("");
    refs.week1CourseFeedback.textContent = "先完成听、指读和找词，再选择你刚刚读完的书；同一本不能重复。";
    refs.week1CourseFeedback.className = "week1-course-feedback read";
  }

  function showSpellingRound(round) {
    const phonicsSpelling = round.kind === "phonics";
    if (phonicsSpelling) {
      refs.week1CourseAudioPlay.hidden = false;
      refs.week1CourseAudioPlay.textContent = "▶ 播放本题音频";
    }
    refs.week1CoursePrompt.innerHTML += `<strong class="week1-cloze">${escapeHTML(round.prompt || (phonicsSpelling ? "听音后，拼写完整单词。" : "遮住答案，写出这个高频词。"))}</strong><span class="week1-target-meaning ${day.stageReview ? "stage-review-meaning" : ""}">中文提示：${escapeHTML(wordMeaning(round.word))}</span><em>${phonicsSpelling ? "只听发音，不看单词。" : round.isNew ? "合上英语本，凭记忆输入刚写过的心词。" : "不看词卡，输入空格里缺少的高频词。"}</em>`;
    refs.week1CourseChoices.innerHTML = `<form class="week1-spelling-form" data-week1-spelling-form>
      <label for="week1SpellingInput">拼写答案</label>
      <input id="week1SpellingInput" name="spelling" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" aria-label="输入心词拼写">
      ${phonicsSpelling ? "" : `<button class="heart-audio-button" type="button" data-heart-audio="${escapeAttr(round.word)}"><span class="audio-play-icon" aria-hidden="true">▶</span>听发音</button>`}
      ${day.stageReview ? `<button class="spelling-answer-button" type="button" data-show-spelling-answer>实在想不起来，看看答案</button>` : ""}
      <button class="primary-action" type="submit">检查拼写</button>
    </form>`;
    refs.week1CourseFeedback.textContent = round.isNew ? "写过以后再默写，拼对才能继续。" : "想一想怎么拼，拼对就能继续。";
    refs.week1CourseFeedback.className = "week1-course-feedback";
    refs.week1CourseChoices.querySelector("input")?.focus();
  }

  function showActionRound(round) {
    actionRoundVisible = true;
    let content = "";
    let button = "我完成了";
    let feedback = round.prompt || "完成后继续。";
    if (round.mode === "read") {
      content = `看词拼读：<strong>${escapeHTML(round.word)}</strong><span class="week1-target-meaning">${escapeHTML(wordMeaning(round.word))}</span>`;
      button = "我读好了";
    } else if (round.mode === "study") {
      const studySentence = String(round.prompt).replace("__", round.word);
      content = `今天的新心词：<strong><mark class="heart-word-mark">${escapeHTML(round.word)}</mark></strong><span class="week1-target-meaning">${escapeHTML(wordMeaning(round.word))}</span><button class="heart-audio-button" type="button" data-heart-audio="${escapeAttr(round.word)}"><span class="audio-play-icon" aria-hidden="true">▶</span>播放发音</button><em>请把标出的心词写在英语本上：${highlightHeartWords(studySentence)}</em>`;
      button = "已读 3 遍并写 3 遍";
      feedback = "先大声读三遍，再在英语本上认真写三遍；下一轮会合上答案默写。";
    } else if (round.mode === "word-bank") {
      content = `<strong class="week1-action-title">目标词（心词已标黄）</strong><div class="week1-target-bank">${round.words.map((word) => `<span>${highlightHeartWords(word)}</span>`).join("")}</div>`;
      button = "目标词读好了";
    } else if (round.mode === "speak") {
      content = `句型挑战：<strong class="week1-sentence">${highlightHeartWords(round.sentence)}</strong>`;
      button = "我说了一句新句子";
    } else if (round.mode === "book") {
      content = `<strong class="week1-book-title">${highlightHeartWords(round.book)}</strong><em>阅读重点：${escapeHTML(round.focus)}${round.bookCount > 1 ? ` · 今日第 ${round.bookNumber}/${round.bookCount} 本` : ""}</em>`;
      button = `第 ${round.bookNumber || 1} 本读完了`;
    }
    refs.week1CoursePrompt.innerHTML += content;
    refs.week1CourseReadDone.textContent = button;
    refs.week1CourseReadDone.hidden = false;
    refs.week1CourseFeedback.textContent = feedback;
    refs.week1CourseFeedback.className = "week1-course-feedback read";
  }

  function renderChoices(choices) {
    refs.week1CourseChoices.innerHTML = choices.map((word) => (
      `<button class="week1-choice" type="button" data-week1-word="${escapeAttr(word)}"><b>${escapeHTML(word)}</b><small>${escapeHTML(wordMeaning(word))}</small></button>`
    )).join("");
  }

  function heartWordEntry(word) {
    return (course?.heartWords?.words || []).find((entry) => entry.word.toLocaleLowerCase("en") === String(word).toLocaleLowerCase("en"));
  }

  function heartWordChip(word, marked = false) {
    const content = marked ? `<mark>${escapeHTML(word)}</mark>` : escapeHTML(word);
    const copy = `<span class="week1-chip-copy"><b>${content}</b><small>${escapeHTML(wordMeaning(word))}</small></span>`;
    const playable = Boolean(heartWordEntry(word)?.audio?.assetId);
    if (!playable) return `<span class="week1-word-chip heart${marked ? " all-heart-word" : ""}">${copy}</span>`;
    return `<button class="week1-word-chip audio-word-chip heart${marked ? " all-heart-word" : ""}" type="button" data-heart-audio="${escapeAttr(word)}" aria-label="播放 ${escapeAttr(word)} 的发音"><span class="audio-play-icon" aria-hidden="true">▶</span>${copy}</button>`;
  }

  async function playPhonicsWord(event) {
    const button = event.target.closest("[data-phonics-audio]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const round = allRounds.find((item) => item.kind === "phonics" && item.word === button.dataset.phonicsAudio);
    if (!round?.assetId || !availableAssetIds.has(round.assetId)) return;
    await playAudioAsset(round.assetId, round.audio?.clip, round.word);
  }

  async function playHeartWord(event) {
    const button = event.target.closest("[data-heart-audio]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const entry = heartWordEntry(button.dataset.heartAudio);
    const assetId = entry?.audio?.assetId;
    if (!assetId) return;
    await playAudioAsset(assetId, entry.audio.clip, entry.word);
  }

  function playCurrentRoundAudio() {
    const round = activeRounds[roundIndex];
    const playableRound = round?.mode === "listen" || (round?.mode === "spell" && round?.kind === "phonics");
    if (!running || !playableRound || !round.assetId) return;
    playAudioAsset(round.assetId, round.audio?.clip, "本题");
  }

  function playAudioAsset(assetId, clip, label) {
    const player = refs.week1CoursePlayer;
    const audioUrl = staticCourseAudioUrl(assetId);
    resetPhonicsLessonButton();
    if (!player.paused) player.pause();
    if (player.src !== audioUrl) player.src = audioUrl;
    else if (player.ended || player.currentTime > 0) player.currentTime = 0;
    return player.play().then(() => {
      refs.week1CourseFeedback.textContent = `正在播放 ${label} 的发音。`;
      refs.week1CourseFeedback.className = "week1-course-feedback read";
    }).catch(() => {
      refs.week1CourseFeedback.textContent = `${label} 没有播放，请再点一次播放按钮。`;
      refs.week1CourseFeedback.className = "week1-course-feedback try";
    });
  }

  function chooseWord(event) {
    const bookButton = event.target.closest("[data-week1-book]");
    if (bookButton && running) {
      const round = activeRounds[roundIndex];
      if (round?.mode !== "book-choice" || !round.choices.includes(bookButton.dataset.week1Book)) return;
      if (Object.values(activeChosenBooks).includes(bookButton.dataset.week1Book)) {
        refs.week1CourseFeedback.textContent = "这本已经选过了，请按 Excel 规则换一本。";
        refs.week1CourseFeedback.className = "week1-course-feedback try";
        return;
      }
      activeChosenBooks[moduleRoundKey(activeModule.id, roundIndex)] = bookButton.dataset.week1Book;
      round.selectedBook = bookButton.dataset.week1Book;
      advanceRound();
      return;
    }
    const button = event.target.closest("[data-week1-word]");
    if (!button || !running) return;
    const round = activeRounds[roundIndex];
    const answer = round.mode === "choice" ? round.answer : round.word;
    if (button.dataset.week1Word !== answer) {
      if (!practiceMode) {
        wrongAttempts += 1;
        recordReviewMistake(round);
        saveProgress();
      }
      refs.week1CourseFeedback.textContent = round.mode === "choice"
        ? "放回句子里读一读，再试一次。"
        : "再点播放听一次，注意中间的短元音。";
      refs.week1CourseFeedback.className = "week1-course-feedback try";
      if (round.mode === "listen") refs.week1CourseAudioPlay.textContent = "▶ 再听一次";
      return;
    }
    advanceRound();
  }

  function checkSpelling(event) {
    const form = event.target.closest("[data-week1-spelling-form]");
    if (!form || !running) return;
    event.preventDefault();
    const round = activeRounds[roundIndex];
    if (round?.mode !== "spell") return;
    const input = form.querySelector("input");
    const answer = input.value.trim().toLocaleLowerCase("en");
    if (answer !== round.word.toLocaleLowerCase("en")) {
      if (!practiceMode) {
        wrongAttempts += 1;
        recordReviewMistake(round);
        saveProgress();
      }
      input.value = "";
      input.focus();
      refs.week1CourseFeedback.textContent = round.kind === "phonics"
        ? "再听一遍，把听到的声音从左到右写出来；拼对才能继续。"
        : "还没有记牢。看一眼答案，再遮住重新输入；拼对才能继续。";
      refs.week1CourseFeedback.className = "week1-course-feedback try";
      return;
    }
    refs.week1CourseFeedback.textContent = "拼写正确！";
    refs.week1CourseFeedback.className = "week1-course-feedback good";
    advanceRound();
  }

  function recordReviewMistake(round) {
    if (day.stageReview && round?.word) reviewMistakes.add(round.word);
  }

  function showSpellingAnswer(event) {
    const button = event.target.closest("[data-show-spelling-answer]");
    if (!button || !running || button.dataset.revealed === "1") return;
    const round = activeRounds[roundIndex];
    if (round?.mode !== "spell") return;
    button.dataset.revealed = "1";
    button.textContent = `答案：${round.word}`;
    button.classList.add("revealed");
    if (!practiceMode) {
      wrongAttempts += 1;
      recordReviewMistake(round);
      saveProgress();
    }
    refs.week1CourseFeedback.textContent = "看清以后再遮住答案，把单词输入一遍就能继续。";
    refs.week1CourseFeedback.className = "week1-course-feedback try";
    refs.week1CourseChoices.querySelector("input")?.focus();
  }

  function completeNonChoiceRound() {
    if (!running || !actionRoundVisible) return;
    advanceRound();
  }

  function advanceRound() {
    const round = activeRounds[roundIndex];
    refs.week1CourseLog.insertAdjacentHTML("beforeend", `<span>${roundIndex + 1}. ${escapeHTML(window.OPWWeek1CourseCore.roundSummary(round))}</span>`);
    roundIndex += 1;
    if (!practiceMode) {
      moduleProgress[activeModule.id] = {
        completedRounds: roundIndex,
        completedAt: moduleProgress[activeModule.id]?.completedAt || null,
        roundOrderVersion: moduleProgress[activeModule.id]?.roundOrderVersion || 0
      };
      if (activeModule.id === "raz") chosenBooks = { ...activeChosenBooks };
      if (roundIndex < activeRounds.length) saveProgress();
    }
    renderRound();
  }

  function saveProgress() {
    if (phonicsPreviewMode) return;
    const complete = modules.every((module) => moduleProgress[module.id]?.completedAt);
    if (complete && !overallCompletedAt) overallCompletedAt = new Date().toISOString();
    const progress = {
      completedRounds: modules.reduce((sum, module) => sum + (moduleProgress[module.id]?.completedRounds || 0), 0),
      moduleProgress,
      wrongAttempts,
      reviewMistakes: [...reviewMistakes],
      chosenBooks,
      learnedExtensionWords,
      roundSchemaVersion: ROUND_SCHEMA_VERSION,
      completedAt: complete ? overallCompletedAt : null
    };
    if (extensionPlanActive) progress.extensionPlanVersion = EXTENSION_PLAN_VERSION;
    window.LearningActivityProgress?.save(window.OPWWeek1CourseCore.activityId(dayNumber), progress);
  }

  function moduleRoundKey(moduleId, index) {
    return `${moduleId}:${index}`;
  }

  function migrateChosenBooks(saved) {
    const stored = saved?.chosenBooks && typeof saved.chosenBooks === "object" ? saved.chosenBooks : {};
    if (Number(saved?.roundSchemaVersion) >= ROUND_SCHEMA_VERSION) return { ...stored };
    const migrated = {};
    const moduleIndexes = {};
    allRounds.forEach((round, globalIndex) => {
      const moduleId = window.OPWWeek1CourseCore.moduleIdForRound(round);
      const localIndex = moduleIndexes[moduleId] || 0;
      if (round.mode === "book-choice" && stored[globalIndex]) {
        migrated[moduleRoundKey(moduleId, localIndex)] = stored[globalIndex];
      }
      moduleIndexes[moduleId] = localIndex + 1;
    });
    return migrated;
  }

  function staticCourseAudioUrl(assetId) {
    return new URL(`./course-audio/${encodeURIComponent(assetId)}.mp3`, document.baseURI).href;
  }

  function phonicsLessonAudioUrl(number) {
    return `./phonics-media/day-${String(number).padStart(2, "0")}-lesson.mp3?v=20260819-phonics-audit-2`;
  }

  function phonicsSceneAudioUrl(number, index) {
    return `./phonics-media/scenes/day-${String(number).padStart(2, "0")}-scene-${String(index + 1).padStart(2, "0")}.mp3?v=20260819-phonics-audit-2`;
  }

  function phonicsSoundMark(pattern, fallback) {
    const marks = {
      "short-a": "a", "short-a-at-ap": "a", "short-i": "i", "short-e": "e", "short-o": "o", "short-u": "u",
      "digraph-sh": "sh", "digraph-ch": "ch", "digraph-th": "th", "digraph-wh": "wh", "final-ng-nk": "ng · nk",
      "digraph-review": "sh · ch · th · ng", "initial-s-blends": "s + 辅音", "initial-l-blends": "辅音 + l",
      "initial-r-blends": "辅音 + r", "final-blends": "词尾双辅音", "blend-word-review": "CCVC · CVCC",
      "blend-review": "辅音丛", "blend-mixed-review": "顺滑拼读", "silent-e-a": "a_e", "silent-e-i": "i_e",
      "silent-e-o": "o_e", "silent-e-u-e": "u_e · e_e", "silent-e-contrast": "短元音 ↔ e",
      "four-week-review": "找熟悉的声音", "course-showcase": "我会拼读"
    };
    return marks[pattern] || String(fallback || "今天的声音").split(/[：｜]/)[0];
  }

  function childFriendlyFocus(value) {
    return String(value || "").replace("｜常见规律拓展：", "；再学：");
  }

  function activeModuleFocus(moduleId) {
    if (moduleId === "reviewLessons") return "把前 11 天讲解完整听一遍，没听清的声音可以单独重播";
    if (moduleId === "soundLab") return childFriendlyFocus(day.focus);
    if (moduleId === "coreWords") return day.stageReview ? "高频词阶段测验：不看答案，听音或看句子后拼写" : "核心高频词：先懂意思，再读、写和默写";
    if (moduleId === "extraWords") return "高频词加餐：先懂意思，再把单词放进句子里";
    if (moduleId === "raz") return `RAZ 故事森林：${day.raz.focus}`;
    return "完成今天的英语练习";
  }

  function wordMeaning(word) {
    return wordMeanings[String(word || "").toLocaleLowerCase("en")] || "";
  }

  function wordWithMeaning(word) {
    return `<span class="week1-chip-copy"><b>${escapeHTML(word)}</b><small>${escapeHTML(wordMeaning(word))}</small></span>`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[character]));
  }

  function highlightHeartWords(value) {
    const heartWords = new Set((course?.heartWords?.words || []).map((entry) => entry.word.toLocaleLowerCase("en")));
    return String(value).split(/([A-Za-z]+(?:['’][A-Za-z]+)?)/g).map((part) => {
      const safe = escapeHTML(part);
      return heartWords.has(part.toLocaleLowerCase("en")) ? `<mark class="heart-word-mark">${safe}</mark>` : safe;
    }).join("");
  }

  function formatCourseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "今天";
    const [, month, date] = value.split("-").map(Number);
    return `${month} 月 ${date} 日`;
  }

  function escapeAttr(value) {
    return escapeHTML(value).replaceAll("\n", " ");
  }
})();
