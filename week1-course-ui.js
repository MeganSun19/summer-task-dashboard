(function () {
  const refs = Object.fromEntries([
    "week1CourseCard", "week1CourseDay", "week1CourseStatus", "week1CourseFocus", "week1CourseWords",
    "week1CourseStart", "week1CoursePlayer", "week1CourseProgressBar", "week1CoursePrompt",
    "week1CourseChoices", "week1CourseReadDone", "week1CourseFeedback", "week1CourseLog"
  ].map((id) => [id, document.getElementById(id)]));

  if (!window.AudioStore || !window.OPWWeek1CourseCore || Object.values(refs).some((element) => !element)) return;

  let course = null;
  let day = null;
  let dayNumber = null;
  let rounds = [];
  let availableAssetIds = new Set();
  let roundIndex = 0;
  let wrongAttempts = 0;
  let currentAudioUrl = "";
  let clipStart = 0;
  let clipEnd = 0;
  let running = false;
  let actionRoundVisible = false;
  let chosenBooks = {};
  const ROUND_SCHEMA_VERSION = 5;

  refs.week1CourseStart.addEventListener("click", startOrRestart);
  refs.week1CourseChoices.addEventListener("click", chooseWord);
  refs.week1CourseChoices.addEventListener("submit", checkSpelling);
  refs.week1CourseReadDone.addEventListener("click", completeNonChoiceRound);
  refs.week1CoursePlayer.addEventListener("timeupdate", stopAtClipEnd);
  window.addEventListener("learning-activity-context-change", renderForContext);
  window.addEventListener("opw-audio-library-change", renderForContext);
  window.addEventListener("beforeunload", revokeAudio);

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

  async function renderForContext() {
    if (!course) return;
    revokeAudio();
    running = false;
    const context = window.LearningActivityProgress?.getContext();
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

    rounds = window.OPWWeek1CourseCore.buildRounds(day);
    if (!rounds.length) {
      refs.week1CourseStart.disabled = true;
      refs.week1CourseStatus.textContent = "课程数据错误";
      refs.week1CoursePrompt.textContent = "今天的课程没有生成，请刷新页面";
      refs.week1CourseFeedback.textContent = "课程轮次为 0，已停止保存完成状态。";
      refs.week1CourseFeedback.className = "week1-course-feedback try";
      return;
    }
    refs.week1CourseStart.disabled = false;
    availableAssetIds = new Set((await Promise.all(rounds.map(async (round) => (
      round.assetId && await window.AudioStore.getAsset(round.assetId) ? round.assetId : null
    )))).filter(Boolean));
    const stored = window.LearningActivityProgress?.get(window.OPWWeek1CourseCore.activityId(dayNumber));
    const saved = stored?.roundSchemaVersion === ROUND_SCHEMA_VERSION ? stored : null;
    chosenBooks = saved?.chosenBooks && typeof saved.chosenBooks === "object" ? { ...saved.chosenBooks } : {};
    rounds.forEach((round, index) => {
      if (round.mode === "book-choice" && chosenBooks[index]) round.selectedBook = chosenBooks[index];
    });
    roundIndex = Math.min(rounds.length, Math.max(0, Number(saved?.completedRounds) || 0));
    wrongAttempts = Math.max(0, Number(saved?.wrongAttempts) || 0);
    const completed = roundIndex >= rounds.length && Boolean(saved?.completedAt);

    refs.week1CourseDay.textContent = `${context?.planTitle || "暑假计划"} · 英语岛 · 第 ${day.day}/${course.days.length} 个学习日`;
    const counts = rounds.reduce((result, round) => ({ ...result, [round.kind]: (result[round.kind] || 0) + 1 }), {});
    refs.week1CourseFocus.textContent = `${day.focus}｜今日 ${rounds.length} 轮：拼读 ${counts.phonics || 0} · 心词 ${counts.heart || 0} · RAZ ${counts.raz || 0}｜课程音频已准备`;
    refs.week1CourseWords.innerHTML = buildOverview();
    refs.week1CourseLog.innerHTML = rounds.slice(0, roundIndex).map((round, index) => (
      `<span>${index + 1}. ${escapeHTML(window.OPWWeek1CourseCore.roundSummary(round))}</span>`
    )).join("");
    refs.week1CourseFeedback.textContent = completed
      ? `${context?.kidName || "孩子"}已完成今天的完整英语岛练习`
      : roundIndex ? `已保存 ${roundIndex}/${rounds.length}` : `今天共 ${rounds.length} 轮；核心高频词需要写进英语本并独立拼写。`;
    refs.week1CourseFeedback.className = completed ? "week1-course-feedback good" : "week1-course-feedback";
    refs.week1CourseStatus.textContent = completed ? "✓ 今日已完成" : `${roundIndex}/${rounds.length}`;
    refs.week1CourseStatus.classList.toggle("ready", completed);
    refs.week1CourseStart.textContent = completed ? "重新练习" : roundIndex ? `继续练习 ${roundIndex}/${rounds.length}` : "开始今天的英语岛";
    renderRound(false);
  }

  function buildOverview() {
    const phonics = day.phonics.words.map((entry) => {
      const round = rounds.find((item) => item.kind === "phonics" && item.word === entry.word);
      const playable = round.mode === "listen" && availableAssetIds.has(round.assetId);
      const label = window.OPWWeek1CourseCore.availabilityLabel(round, playable);
      return `<span class="week1-word-chip ${playable ? "listen" : "read"}">${escapeHTML(entry.word)}<small>${label}</small></span>`;
    }).join("");
    const newHeartWords = day.heartWords.newWords || [day.heartWords.new].filter(Boolean);
    const heart = [...newHeartWords, ...day.heartWords.review].filter(Boolean).map((word) => (
      `<span class="week1-word-chip heart">${escapeHTML(word)}<small>${newHeartWords.includes(word) ? "新词·要写" : "复习·要拼"}</small></span>`
    )).join("");
    const assignment = day.raz.assignment;
    const books = assignment?.mode === "fixed" ? assignment.books : (assignment?.fixedBooks || []);
    const heartWordBank = (course.heartWords?.words || []).map((entry) => (
      `<span class="week1-word-chip heart all-heart-word"><mark>${escapeHTML(entry.word)}</mark><small>${entry.firstDay ? `第${entry.firstDay}天` : "开课前"}</small></span>`
    )).join("");
    return `
      <div class="week1-overview-group"><b>声音实验室</b><div>${phonics}</div></div>
      <div class="week1-overview-group"><b>核心高频词锻造屋</b><div>${heart}</div></div>
      <div class="week1-overview-group raz"><b>今日 RAZ 书目</b><div>${books.map((book, index) => `<span>${index + 1}. ${highlightHeartWords(book)}</span>`).join("")}${assignment?.mode === "choose" ? `<span class="raz-choice-rule">按 Excel 规则选择：${escapeHTML(assignment.rule)}</span>` : ""}<small>${escapeHTML(day.raz.focus)} · 每本分别完成听、指读、找词</small></div></div>
      <details class="heart-word-bank"><summary>本期核心高频词总表 · ${course.heartWords?.words?.length || 0} 词</summary><p>${escapeHTML(course.heartWords?.instruction || "")}</p><div>${heartWordBank}</div></details>`;
  }

  async function startOrRestart() {
    if (!rounds.length) return;
    const context = window.LearningActivityProgress?.getContext();
    const moduleContext = context?.modules?.find((item) => item.activity?.renderer === "english-course");
    if (!moduleContext?.startDate) window.LearningActivityProgress?.startModule(moduleContext?.id || "englishIsland");
    if (roundIndex >= rounds.length) {
      window.LearningActivityProgress?.reset(window.OPWWeek1CourseCore.activityId(dayNumber));
      roundIndex = 0;
      wrongAttempts = 0;
      chosenBooks = {};
      refs.week1CourseLog.innerHTML = "";
    }
    running = true;
    refs.week1CourseFeedback.textContent = "";
    await renderRound(true);
  }

  async function renderRound(autoplay = running) {
    revokeAudio();
    if (!rounds.length) return;
    const complete = roundIndex >= rounds.length;
    refs.week1CourseProgressBar.style.width = `${rounds.length ? roundIndex / rounds.length * 100 : 0}%`;
    refs.week1CourseChoices.innerHTML = "";
    refs.week1CourseReadDone.hidden = true;
    actionRoundVisible = false;
    refs.week1CoursePlayer.hidden = true;
    refs.week1CourseStart.hidden = running && !complete;
    refs.week1CourseStatus.textContent = `${roundIndex}/${rounds.length}`;
    refs.week1CourseStatus.classList.remove("ready");

    if (complete) {
      running = false;
      refs.week1CoursePrompt.textContent = `完成 ${rounds.length}/${rounds.length}`;
      refs.week1CourseStatus.textContent = "✓ 今日已完成";
      refs.week1CourseStatus.classList.add("ready");
      refs.week1CourseStart.hidden = false;
      refs.week1CourseStart.textContent = "重新练习";
      refs.week1CourseFeedback.textContent = "全部完成！拼读、心词和故事阅读都练到了。";
      refs.week1CourseFeedback.className = "week1-course-feedback good";
      saveProgress(true);
      return;
    }

    const round = rounds[roundIndex];
    refs.week1CoursePrompt.innerHTML = `<span class="week1-stage">${escapeHTML(round.label)}</span><span>第 ${roundIndex + 1}/${rounds.length}</span>`;
    if (!running) return;

    if (round.mode === "listen") return showListenRound(round, autoplay);
    if (round.mode === "spell") return showSpellingRound(round);
    if (round.mode === "choice") return showChoiceRound(round);
    if (round.mode === "book-choice") return showBookChoiceRound(round);
    showActionRound(round);
  }

  async function showListenRound(round, autoplay) {
    currentAudioUrl = await window.AudioStore.createAudioUrl(round.assetId);
    if (!currentAudioUrl) {
      showActionRound({ ...round, mode: "read" });
      refs.week1CourseFeedback.textContent = "这台设备还没有对应音频，先看词拼读。";
      return;
    }
    clipStart = round.audio.clip.startSeconds;
    clipEnd = round.audio.clip.endSeconds;
    const seekToClipStart = () => {
      refs.week1CoursePlayer.currentTime = clipStart;
    };
    refs.week1CoursePlayer.addEventListener("loadedmetadata", seekToClipStart, { once: true });
    refs.week1CoursePlayer.src = currentAudioUrl;
    refs.week1CoursePlayer.hidden = false;
    refs.week1CoursePlayer.load();
    renderChoices(round.choices);
    refs.week1CourseFeedback.textContent = "听一听，选出你听到的词。";
    refs.week1CourseFeedback.className = "week1-course-feedback";
    if (autoplay) {
      const started = await refs.week1CoursePlayer.play().then(() => true).catch(() => false);
      if (started && refs.week1CoursePlayer.currentTime < clipStart) refs.week1CoursePlayer.currentTime = clipStart;
    }
  }

  function showChoiceRound(round) {
    refs.week1CoursePrompt.innerHTML += `<strong class="week1-cloze">${escapeHTML(round.prompt)}</strong>`;
    renderChoices(round.choices);
    refs.week1CourseFeedback.textContent = "选一个词，把句子补完整。";
    refs.week1CourseFeedback.className = "week1-course-feedback";
  }

  function showBookChoiceRound(round) {
    const alreadyChosen = new Set(Object.values(chosenBooks));
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
      content = `今天的新心词：<strong><mark class="heart-word-mark">${escapeHTML(round.word)}</mark></strong><em>请把标出的心词写在英语本上：${highlightHeartWords(studySentence)}</em>`;
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

  function chooseWord(event) {
    const bookButton = event.target.closest("[data-week1-book]");
    if (bookButton && running) {
      const round = rounds[roundIndex];
      if (round?.mode !== "book-choice" || !round.choices.includes(bookButton.dataset.week1Book)) return;
      if (Object.values(chosenBooks).includes(bookButton.dataset.week1Book)) {
        refs.week1CourseFeedback.textContent = "这本已经选过了，请按 Excel 规则换一本。";
        refs.week1CourseFeedback.className = "week1-course-feedback try";
        return;
      }
      chosenBooks[roundIndex] = bookButton.dataset.week1Book;
      round.selectedBook = bookButton.dataset.week1Book;
      advanceRound();
      return;
    }
    const button = event.target.closest("[data-week1-word]");
    if (!button || !running) return;
    const round = rounds[roundIndex];
    const answer = round.mode === "choice" ? round.answer : round.word;
    if (button.dataset.week1Word !== answer) {
      wrongAttempts += 1;
      saveProgress(false);
      refs.week1CourseFeedback.textContent = round.mode === "choice"
        ? "放回句子里读一读，再试一次。"
        : "再听一次，注意中间的短元音。";
      refs.week1CourseFeedback.className = "week1-course-feedback try";
      if (round.mode === "listen" && currentAudioUrl) {
        refs.week1CoursePlayer.currentTime = clipStart;
        refs.week1CoursePlayer.play().catch(() => {});
      }
      return;
    }
    advanceRound();
  }

  function checkSpelling(event) {
    const form = event.target.closest("[data-week1-spelling-form]");
    if (!form || !running) return;
    event.preventDefault();
    const round = rounds[roundIndex];
    if (round?.mode !== "spell") return;
    const input = form.querySelector("input");
    const answer = input.value.trim().toLocaleLowerCase("en");
    if (answer !== round.word.toLocaleLowerCase("en")) {
      wrongAttempts += 1;
      saveProgress(false);
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
    const round = rounds[roundIndex];
    refs.week1CourseLog.insertAdjacentHTML("beforeend", `<span>${roundIndex + 1}. ${escapeHTML(window.OPWWeek1CourseCore.roundSummary(round))}</span>`);
    roundIndex += 1;
    saveProgress(roundIndex >= rounds.length);
    renderRound(true);
  }

  function saveProgress(complete) {
    window.LearningActivityProgress?.save(window.OPWWeek1CourseCore.activityId(dayNumber), {
      completedRounds: roundIndex,
      wrongAttempts,
      chosenBooks,
      roundSchemaVersion: ROUND_SCHEMA_VERSION,
      completedAt: complete ? new Date().toISOString() : null
    });
  }

  function stopAtClipEnd() {
    if (clipEnd && refs.week1CoursePlayer.currentTime >= clipEnd) refs.week1CoursePlayer.pause();
  }

  function revokeAudio() {
    refs.week1CoursePlayer.pause();
    refs.week1CoursePlayer.removeAttribute("src");
    if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = "";
    clipStart = 0;
    clipEnd = 0;
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
