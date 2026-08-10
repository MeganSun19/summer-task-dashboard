(function () {
  const refs = Object.fromEntries([
    "week1CourseCard", "week1CourseDay", "week1CourseStatus", "week1CourseFocus", "week1CourseNotice", "week1CourseWords",
    "week1CourseStart", "week1CoursePlayer", "week1CourseAudioPlay", "week1CourseProgressBar", "week1CoursePrompt",
    "week1CourseChoices", "week1CourseReadDone", "week1CourseFeedback", "week1CourseLog", "week1CourseActivity"
  ].map((id) => [id, document.getElementById(id)]));

  if (!window.AudioStore || !window.OPWWeek1CourseCore || Object.values(refs).some((element) => !element)) return;

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
  const ROUND_SCHEMA_VERSION = 6;
  const EXTENSION_PLAN_VERSION = 1;
  const HEART_WORD_BANK_PAGE_SIZE = 40;
  refs.week1CoursePlayer.setAttribute("playsinline", "");
  refs.week1CoursePlayer.setAttribute("webkit-playsinline", "");

  refs.week1CourseStart.addEventListener("click", returnToDashboard);
  refs.week1CourseChoices.addEventListener("click", chooseWord);
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
    const nextContextKey = `${context?.kidId || ""}|${context?.date || ""}|${context?.planDay || ""}`;
    if (activeModule && currentContextKey === nextContextKey) return;
    running = false;
    activeModule = null;
    heartWordBankPage = 0;
    currentContextKey = nextContextKey;
    const moduleContext = context?.modules?.find((item) => item.activity?.renderer === "english-course");
    if (!moduleContext) {
      refs.week1CourseCard.hidden = true;
      return;
    }
    dayNumber = Number(moduleContext.planDay) || window.OPWWeek1CourseCore.courseDayNumber(
      context?.date,
      moduleContext.startDate,
      course.days.length
    );
    day = dayNumber ? course.days.find((item) => item.day === dayNumber) : null;
    refs.week1CourseCard.hidden = !day;
    if (!day) return;

    const history = window.LearningActivityProgress?.getHistory?.() || [];
    const stored = window.LearningActivityProgress?.get(window.OPWWeek1CourseCore.activityId(dayNumber));
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

    refs.week1CourseDay.textContent = `${context?.planTitle || "暑假计划"} · 英语岛 · 第 ${day.day}/${course.days.length} 个学习日`;
    refs.week1CourseFocus.textContent = `${day.focus}｜${modules.length} 个模块可以自由选择，首次全部完成后点亮今日英语岛；完成后仍可重复练习。`;
    renderDashboard();
  }

  function buildOverview() {
    const phonics = day.phonics.words.map((entry) => {
      const round = allRounds.find((item) => item.kind === "phonics" && item.word === entry.word);
      const playable = round.mode === "listen" && availableAssetIds.has(round.assetId);
      const label = window.OPWWeek1CourseCore.availabilityLabel(round, playable);
      return playable
        ? `<button class="week1-word-chip audio-word-chip listen" type="button" data-phonics-audio="${escapeAttr(entry.word)}" aria-label="播放 ${escapeAttr(entry.word)} 的发音"><span class="audio-play-icon" aria-hidden="true">▶</span><span>${escapeHTML(entry.word)}</span><small>${label}</small></button>`
        : `<span class="week1-word-chip read"><span>${escapeHTML(entry.word)}</span><small>${label}</small></span>`;
    }).join("");
    const newHeartWords = day.heartWords.newWords || [day.heartWords.new].filter(Boolean);
    const heart = [...newHeartWords, ...day.heartWords.review].filter(Boolean).map((word) => (
      heartWordChip(word, newHeartWords.includes(word) ? "新词·要写" : "复习·要拼")
    )).join("");
    const newExtensionWords = day.heartWords.extensionWords || [];
    const extension = [...newExtensionWords, ...(day.heartWords.extensionReview || [])].filter((word, index, words) => words.indexOf(word) === index).map((word) => (
      heartWordChip(word, newExtensionWords.includes(word) ? "拓展新词·要写" : "拓展复习·要拼")
    )).join("");
    const assignment = day.raz.assignment;
    const books = assignment?.mode === "fixed" ? assignment.books : (assignment?.fixedBooks || []);
    return `<div class="english-module-grid">
      ${moduleCard("soundLab", "Aa", "声音实验室", "听音辨词与自然拼读", phonics)}
      ${moduleCard("coreWords", "词", "核心高频词", "认读、书写与独立拼写", heart)}
      ${moduleCard("raz", "读", "RAZ 故事森林", "目标词、句型与今日书目", `<div class="module-raz-books">${books.map((book, index) => `<span>${index + 1}. ${highlightHeartWords(book)}</span>`).join("")}${assignment?.mode === "choose" ? `<span class="raz-choice-rule">${escapeHTML(assignment.rule)}</span>` : ""}<small>${escapeHTML(day.raz.focus)}</small></div>`)}
      ${extension ? moduleCard("extraWords", "+", "高频词加餐", "拓展高频词与间隔复习", extension) : ""}
      </div>
      <details class="heart-word-bank"><summary>本期高频词总表 · ${course.heartWords?.words?.length || 0} 词</summary><p>${escapeHTML(course.heartWords?.instruction || "")}</p><div data-heart-word-bank-content>${heartWordBankMarkup()}</div></details>`;
  }

  function heartWordBankMarkup() {
    const words = course.heartWords?.words || [];
    const pageCount = Math.max(1, Math.ceil(words.length / HEART_WORD_BANK_PAGE_SIZE));
    heartWordBankPage = Math.min(Math.max(0, heartWordBankPage), pageCount - 1);
    const start = heartWordBankPage * HEART_WORD_BANK_PAGE_SIZE;
    const visibleWords = words.slice(start, start + HEART_WORD_BANK_PAGE_SIZE);
    const chips = visibleWords.map((entry) => (
      heartWordChip(entry.word, `${entry.tier === "extension" ? "拓展" : "基础"} · ${entry.firstDay ? `第${entry.firstDay}天` : "开课前"}`, true)
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
    const stateLabel = complete ? "已完成 · 可再练" : started ? `${progress.completedRounds}/${module.rounds.length}` : "未开始";
    const actionLabel = complete ? "再练一次" : started ? "继续这个模块" : "进入这个模块";
    return `<article class="english-module-card module-${id} ${complete ? "complete" : ""}">
      <header><span class="english-module-icon">${escapeHTML(icon)}</span><div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p></div><span class="english-module-state">${escapeHTML(stateLabel)}</span></header>
      <div class="english-module-content">${content}</div>
      <button class="english-module-action" type="button" data-course-module="${escapeAttr(id)}">${escapeHTML(actionLabel)}</button>
    </article>`;
  }

  function renderDashboard(message = "") {
    refs.week1CoursePlayer.hidden = true;
    refs.week1CourseAudioPlay.hidden = true;
    running = false;
    activeModule = null;
    activeRounds = [];
    refs.week1CourseWords.hidden = false;
    refs.week1CourseWords.innerHTML = buildOverview();
    refs.week1CourseNotice.hidden = false;
    refs.week1CourseActivity.hidden = true;
    refs.week1CourseStart.hidden = true;
    const completedCount = modules.filter((module) => moduleProgress[module.id]?.completedAt).length;
    const complete = completedCount === modules.length;
    refs.week1CourseStatus.textContent = complete ? "✓ 今日已完成" : `${completedCount}/${modules.length} 模块`;
    refs.week1CourseStatus.classList.toggle("ready", complete);
    refs.week1CourseNotice.textContent = message || (complete ? `${modules.length} 个模块首次学习已完成；想巩固哪一项都可以再练。` : "今天先学哪一项都可以，完成后也能随时再练。");
    refs.week1CourseNotice.className = `week1-course-notice${complete ? " good" : ""}`;
  }

  function handleOverviewClick(event) {
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

  async function startCourseModule(moduleId) {
    const selected = modules.find((module) => module.id === moduleId);
    if (!selected) return;
    const context = window.LearningActivityProgress?.getContext();
    const moduleContext = context?.modules?.find((item) => item.activity?.renderer === "english-course");
    if (!moduleContext?.startDate) window.LearningActivityProgress?.startModule(moduleContext?.id || "englishIsland");
    activeModule = selected;
    practiceMode = Boolean(moduleProgress[moduleId]?.completedAt);
    const savedModuleProgress = moduleProgress[moduleId] || { completedRounds: 0, completedAt: null };
    roundIndex = practiceMode ? 0 : savedModuleProgress.completedRounds || 0;
    const legacyPartialOrder = !practiceMode && roundIndex > 0 && !savedModuleProgress.roundOrderVersion;
    const shouldShuffleSoundLab = moduleId === "soundLab" && !legacyPartialOrder;
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
      const completedMessage = practiceMode ? `${activeModule.label}重复练习完成` : `${activeModule.label}首次完成`;
      refs.week1CoursePrompt.textContent = completedMessage;
      refs.week1CourseStart.hidden = false;
      refs.week1CourseStart.textContent = "返回模块选择";
      refs.week1CourseFeedback.textContent = practiceMode ? "这次巩固完成了，不会重复计算今日奖励。" : "这个模块完成了，可以返回选择下一项。";
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
    refs.week1CourseFeedback.textContent = "先完成听、指读和找词，再点你刚刚实际复习的书；同一本不能重复。";
    refs.week1CourseFeedback.className = "week1-course-feedback read";
  }

  function showSpellingRound(round) {
    refs.week1CoursePrompt.innerHTML += `<strong class="week1-cloze">${escapeHTML(round.prompt)}</strong><em>${round.isNew ? "合上英语本，凭记忆输入刚写过的心词。" : "不看词卡，输入空格里缺少的心词。"}</em>`;
    refs.week1CourseChoices.innerHTML = `<form class="week1-spelling-form" data-week1-spelling-form>
      <label for="week1SpellingInput">拼写答案</label>
      <input id="week1SpellingInput" name="spelling" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" aria-label="输入心词拼写">
      <button class="heart-audio-button" type="button" data-heart-audio="${escapeAttr(round.word)}"><span class="audio-play-icon" aria-hidden="true">▶</span>听发音</button>
      <button class="primary-action" type="submit">检查拼写</button>
    </form>`;
    refs.week1CourseFeedback.textContent = round.isNew ? "写过以后再默写，拼对才能继续。" : "这是间隔记忆复习，拼对才能继续。";
    refs.week1CourseFeedback.className = "week1-course-feedback";
    refs.week1CourseChoices.querySelector("input")?.focus();
  }

  function showActionRound(round) {
    actionRoundVisible = true;
    let content = "";
    let button = "我完成了";
    let feedback = round.prompt || "完成后继续。";
    if (round.mode === "read") {
      content = `看词拼读：<strong>${escapeHTML(round.word)}</strong>`;
      button = "我读好了";
    } else if (round.mode === "study") {
      const studySentence = String(round.prompt).replace("__", round.word);
      content = `今天的新心词：<strong><mark class="heart-word-mark">${escapeHTML(round.word)}</mark></strong><button class="heart-audio-button" type="button" data-heart-audio="${escapeAttr(round.word)}"><span class="audio-play-icon" aria-hidden="true">▶</span>播放发音</button><em>请把标出的心词写在英语本上：${highlightHeartWords(studySentence)}</em>`;
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
      button = `第 ${round.bookNumber || 1} 本复习完成`;
    }
    refs.week1CoursePrompt.innerHTML += content;
    refs.week1CourseReadDone.textContent = button;
    refs.week1CourseReadDone.hidden = false;
    refs.week1CourseFeedback.textContent = feedback;
    refs.week1CourseFeedback.className = "week1-course-feedback read";
  }

  function renderChoices(choices) {
    refs.week1CourseChoices.innerHTML = choices.map((word) => (
      `<button class="week1-choice" type="button" data-week1-word="${escapeAttr(word)}">${escapeHTML(word)}</button>`
    )).join("");
  }

  function heartWordEntry(word) {
    return (course?.heartWords?.words || []).find((entry) => entry.word.toLocaleLowerCase("en") === String(word).toLocaleLowerCase("en"));
  }

  function heartWordChip(word, label, marked = false) {
    const content = marked ? `<mark>${escapeHTML(word)}</mark>` : escapeHTML(word);
    const playable = Boolean(heartWordEntry(word)?.audio?.assetId);
    if (!playable) return `<span class="week1-word-chip heart${marked ? " all-heart-word" : ""}">${content}<small>${escapeHTML(label)}</small></span>`;
    return `<button class="week1-word-chip audio-word-chip heart${marked ? " all-heart-word" : ""}" type="button" data-heart-audio="${escapeAttr(word)}" aria-label="播放 ${escapeAttr(word)} 的发音"><span class="audio-play-icon" aria-hidden="true">▶</span><span>${content}</span><small>${escapeHTML(label)}</small></button>`;
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
    if (!running || round?.mode !== "listen" || !round.assetId) return;
    playAudioAsset(round.assetId, round.audio?.clip, "本题");
  }

  function playAudioAsset(assetId, clip, label) {
    const player = refs.week1CoursePlayer;
    const audioUrl = staticCourseAudioUrl(assetId);
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
        saveProgress();
      }
      input.value = "";
      input.focus();
      refs.week1CourseFeedback.textContent = "还没有记牢。打开英语本看一眼，遮住答案后再输入；拼对才能继续。";
      refs.week1CourseFeedback.className = "week1-course-feedback try";
      return;
    }
    refs.week1CourseFeedback.textContent = "拼写正确！";
    refs.week1CourseFeedback.className = "week1-course-feedback good";
    advanceRound();
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
    const complete = modules.every((module) => moduleProgress[module.id]?.completedAt);
    if (complete && !overallCompletedAt) overallCompletedAt = new Date().toISOString();
    const progress = {
      completedRounds: modules.reduce((sum, module) => sum + (moduleProgress[module.id]?.completedRounds || 0), 0),
      moduleProgress,
      wrongAttempts,
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
