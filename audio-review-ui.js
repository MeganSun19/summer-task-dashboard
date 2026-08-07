(function () {
  const requestedWeek = Number(new URLSearchParams(location.search).get("week"));
  const reviewWeek = [2, 3, 4].includes(requestedWeek) ? requestedWeek : 1;
  const isCourseWeekReview = reviewWeek > 1;
  const STORAGE_KEY = isCourseWeekReview
    ? `opw-week${reviewWeek}-listening-review-results-v1`
    : "opw-week1-listening-review-results-v1";
  const QUEUE_URL = isCourseWeekReview
    ? `./tmp/course-audio-review/week-${reviewWeek}/review-queue.json`
    : "./curriculum/opw-week1-review-queue.json";
  let queueSource = QUEUE_URL.split("/").pop();
  let queue = [];
  let visibleItems = [];
  let results = loadResults();
  let currentIndex = 0;
  let currentAudioUrl = "";
  let clipEnd = 0;
  let lastReviewedItemId = "";
  let lastActionMessage = "";

  const refs = Object.fromEntries([
    "audioReviewStatus", "audioReviewPriority", "audioReviewLevel", "audioReviewDisc", "audioReviewState",
    "audioReviewPosition", "audioReviewReason", "audioReviewWord", "audioReviewMeta", "audioReviewPlayer",
    "audioReviewNote", "audioReviewFeedback", "audioReviewPrevious", "audioReviewReplay", "audioReviewNext",
    "audioReviewActions", "exportAudioReviews", "undoAudioReview", "audioReviewQueueInput"
  ].map((id) => [id, document.getElementById(id)]));

  if (!window.OPWAudioReviewCore || Object.values(refs).some((element) => !element)) return;

  [refs.audioReviewPriority, refs.audioReviewLevel, refs.audioReviewDisc, refs.audioReviewState]
    .forEach((element) => element.addEventListener("change", applyFilters));
  refs.audioReviewPrevious.addEventListener("click", () => move(-1));
  refs.audioReviewNext.addEventListener("click", () => move(1));
  refs.audioReviewReplay.addEventListener("click", playCurrentClip);
  refs.audioReviewActions.addEventListener("click", saveReview);
  refs.exportAudioReviews.addEventListener("click", exportResults);
  refs.undoAudioReview.addEventListener("click", undoReview);
  refs.audioReviewPlayer.addEventListener("timeupdate", stopAtClipEnd);
  refs.audioReviewQueueInput.addEventListener("change", importQueueFile);
  window.addEventListener("opw-audio-library-change", renderCurrent);
  window.addEventListener("beforeunload", revokeAudioUrl);

  loadQueue();

  async function loadQueue() {
    setControlsDisabled(true);
    let storedPayload = null;
    if (window.AudioStore) {
      try {
        storedPayload = await window.AudioStore.getReviewQueue();
      } catch (error) {
        console.error("Stored listening review queue failed to load", error);
      }
    }
    try {
      const response = await fetch(QUEUE_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      queue = window.OPWAudioReviewCore.validateQueuePayload(payload);
      if (window.AudioStore) await window.AudioStore.saveReviewQueue(payload);
      applyFilters();
    } catch (error) {
      try {
        queue = window.OPWAudioReviewCore.validateQueuePayload(storedPayload);
        applyFilters();
      } catch {
        showMissingQueue();
      }
      console.warn("Bundled listening review queue unavailable", error);
    }
  }

  async function importQueueFile() {
    const file = refs.audioReviewQueueInput.files[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      queue = window.OPWAudioReviewCore.validateQueuePayload(payload);
      queueSource = file.name;
      if (window.AudioStore) await window.AudioStore.saveReviewQueue(payload);
      refs.audioReviewFeedback.className = "audio-review-feedback saved";
      refs.audioReviewFeedback.textContent = `试听清单已保存到本机：${queue.length} 条。`;
      applyFilters();
    } catch (error) {
      showMissingQueue(`导入失败：${error.message}`);
    } finally {
      refs.audioReviewQueueInput.value = "";
    }
  }

  function showMissingQueue(message = "音频已导入，但首周试听清单尚未导入。请选择 curriculum/opw-week1-review-queue.json。") {
    queue = [];
    visibleItems = [];
    revokeAudioUrl();
    refs.audioReviewStatus.textContent = "缺少试听清单";
    refs.audioReviewPosition.textContent = "—";
    refs.audioReviewReason.textContent = "请先导入试听清单 JSON";
    refs.audioReviewWord.textContent = "—";
    refs.audioReviewMeta.textContent = "清单只保存在本机浏览器，不会上传。";
    refs.audioReviewNote.value = "";
    refs.audioReviewFeedback.className = "audio-review-feedback error";
    refs.audioReviewFeedback.textContent = message;
    setControlsDisabled(true);
  }

  function applyFilters() {
    visibleItems = window.OPWAudioReviewCore.filterItems(queue, {
      priority: refs.audioReviewPriority.value,
      level: refs.audioReviewLevel.value,
      disc: refs.audioReviewDisc.value,
      status: refs.audioReviewState.value
    }, results);
    currentIndex = 0;
    renderCurrent();
  }

  async function renderCurrent() {
    const summary = window.OPWAudioReviewCore.summarize(queue, results);
    refs.audioReviewStatus.textContent = `已审 ${summary.reviewed}/${summary.total} · 正确 ${summary.verified} · 词错 ${summary["word-error"]} · 边界错 ${summary["boundary-error"]} · 跳过 ${summary.skipped}`;
    refs.audioReviewPosition.textContent = visibleItems.length ? `${currentIndex + 1}/${visibleItems.length}` : "0/0";
    const item = visibleItems[currentIndex];
    if (!item) {
      revokeAudioUrl();
      refs.audioReviewReason.textContent = "当前筛选条件下没有待审核片段";
      refs.audioReviewWord.textContent = "—";
      refs.audioReviewMeta.textContent = `剩余 ${summary.pending} 条`;
      refs.audioReviewNote.value = "";
      refs.undoAudioReview.disabled = !lastReviewedItemId;
      refs.audioReviewFeedback.textContent = lastActionMessage || "可以调整优先级、册数、光盘或状态筛选。";
      refs.audioReviewFeedback.className = lastActionMessage ? "audio-review-feedback saved" : "audio-review-feedback";
      updateReviewSelection(null);
      lastActionMessage = "";
      setControlsDisabled(true);
      refs.undoAudioReview.disabled = !lastReviewedItemId;
      return;
    }

    setControlsDisabled(false);
    const existing = results[window.OPWAudioReviewCore.itemId(item)];
    item.activeReviewClip = existing && ["word-error", "boundary-error"].includes(existing.status)
      ? (item.expandedReviewClip || item.reviewClip)
      : item.reviewClip;
    refs.audioReviewReason.textContent = reasonLabel(item);
    refs.audioReviewWord.textContent = item.word;
    refs.audioReviewMeta.textContent = `Level ${item.level} · Disc ${item.disc} · Track ${String(item.track).padStart(2, "0")} · ${item.sectionTitle} · ${item.startSeconds.toFixed(2)}–${item.endSeconds.toFixed(2)} 秒 · 置信度 ${item.confidence.toFixed(3)}`;
    refs.audioReviewNote.value = existing?.note || "";
    refs.undoAudioReview.disabled = !existing && !lastReviewedItemId;
    updateReviewSelection(existing?.status || null);
    refs.audioReviewFeedback.textContent = existing
      ? `本条已记录：${statusLabel(existing.status)}。可点击其他结论修改。`
      : lastActionMessage || "点击重听，确认单词和片段边界，再选择一种结论。";
    refs.audioReviewFeedback.className = existing || lastActionMessage ? "audio-review-feedback saved" : "audio-review-feedback";
    lastActionMessage = "";
    refs.audioReviewPrevious.disabled = currentIndex === 0;
    refs.audioReviewNext.disabled = currentIndex >= visibleItems.length - 1;
    await prepareAudio(item);
  }

  async function prepareAudio(item) {
    revokeAudioUrl();
    if (isCourseWeekReview) {
      const filename = `${item.word}-l${item.level}-d${item.disc}-t${String(item.track).padStart(2, "0")}-w${item.wordIndex}.mp3`;
      currentAudioUrl = `./tmp/course-audio-review/week-${reviewWeek}/clips/${filename}`;
      refs.audioReviewPlayer.src = currentAudioUrl;
      refs.audioReviewReplay.disabled = false;
      clipEnd = Number.POSITIVE_INFINITY;
      return;
    }
    const assetId = `opw-l${item.level}-d${item.disc}-track${String(item.track).padStart(2, "0")}`;
    try {
      currentAudioUrl = await window.AudioStore.createAudioUrl(assetId);
      if (!currentAudioUrl) throw new Error(`缺少 Level ${item.level} Disc ${item.disc} Track ${item.track}`);
      refs.audioReviewPlayer.src = currentAudioUrl;
      refs.audioReviewReplay.disabled = false;
      clipEnd = item.activeReviewClip.endSeconds;
    } catch (error) {
      refs.audioReviewReplay.disabled = true;
      refs.audioReviewFeedback.className = "audio-review-feedback error";
      refs.audioReviewFeedback.textContent = `${error.message}，请先在上方导入对应音频包。`;
    }
  }

  async function playCurrentClip() {
    const item = visibleItems[currentIndex];
    if (!item || !currentAudioUrl) return;
    refs.audioReviewPlayer.currentTime = item.activeReviewClip.startSeconds;
    await refs.audioReviewPlayer.play().catch((error) => {
      refs.audioReviewFeedback.className = "audio-review-feedback error";
      refs.audioReviewFeedback.textContent = `无法播放：${error.message}`;
    });
  }

  function stopAtClipEnd() {
    if (clipEnd && refs.audioReviewPlayer.currentTime >= clipEnd) refs.audioReviewPlayer.pause();
  }

  function saveReview(event) {
    const button = event.target.closest("[data-review-status]");
    const item = visibleItems[currentIndex];
    if (!button || !item) return;
    const record = window.OPWAudioReviewCore.reviewRecord(item, button.dataset.reviewStatus, refs.audioReviewNote.value);
    results[record.itemId] = record;
    lastReviewedItemId = record.itemId;
    lastActionMessage = `上一条已记录：${statusLabel(record.status)}。`;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    if (refs.audioReviewState.value === "pending" || (refs.audioReviewState.value === "issues" && button.dataset.reviewStatus === "verified")) {
      visibleItems.splice(currentIndex, 1);
      if (currentIndex >= visibleItems.length) currentIndex = Math.max(0, visibleItems.length - 1);
    } else if (currentIndex < visibleItems.length - 1) {
      currentIndex += 1;
    }
    renderCurrent();
  }

  function move(offset) {
    currentIndex = Math.max(0, Math.min(visibleItems.length - 1, currentIndex + offset));
    renderCurrent();
  }

  function undoReview() {
    const item = visibleItems[currentIndex];
    const currentId = item ? window.OPWAudioReviewCore.itemId(item) : "";
    const id = results[currentId] ? currentId : lastReviewedItemId;
    if (!results[id]) return;
    delete results[id];
    lastReviewedItemId = "";
    lastActionMessage = "最近一条审核记录已撤销。";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    applyFilters();
  }

  function loadResults() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function exportResults() {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      sourceQueue: queueSource,
      summary: window.OPWAudioReviewCore.summarize(queue, results),
      results: queue
        .map((item) => results[window.OPWAudioReviewCore.itemId(item)])
        .filter(Boolean)
        .sort((left, right) => left.itemId.localeCompare(right.itemId))
    };
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;
    const exportPayload = document.getElementById("audioReviewExportPayload");
    if (exportPayload) exportPayload.textContent = serialized;
    const url = URL.createObjectURL(new Blob([serialized], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `opw-week${reviewWeek}-review-results-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function setControlsDisabled(disabled) {
    refs.audioReviewPrevious.disabled = disabled;
    refs.audioReviewReplay.disabled = disabled;
    refs.audioReviewNext.disabled = disabled;
    refs.audioReviewActions.querySelectorAll("button").forEach((button) => { button.disabled = disabled; });
    if (disabled) refs.undoAudioReview.disabled = true;
  }

  function updateReviewSelection(status) {
    refs.audioReviewActions.querySelectorAll("button").forEach((button) => {
      const selected = button.dataset.reviewStatus === status;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function revokeAudioUrl() {
    refs.audioReviewPlayer.pause();
    refs.audioReviewPlayer.removeAttribute("src");
    if (currentAudioUrl?.startsWith("blob:")) URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = "";
    clipEnd = 0;
  }

  function reasonLabel(item) {
    if (item.curriculumReason === `required-for-week-${reviewWeek}`) {
      return `第 ${reviewWeek} 周 · 第 ${item.courseDays.join("/")} 天 · 课程必需词`;
    }
    if (item.curriculumReason === "required-for-week-1") {
      return `首周第 ${item.courseDays.join("/")} 天 · 课程必需词`;
    }
    return ({
      "core-word-and-low-confidence": "P0 · 核心词且低置信度",
      "core-word": "P1 · 核心拼读词候选",
      "low-confidence": "P2 · 低置信度片段"
    })[item.reason] || item.reason;
  }

  function statusLabel(status) {
    return ({ verified: "正确", "word-error": "单词错误", "boundary-error": "边界错误", skipped: "跳过" })[status] || status;
  }
})();
