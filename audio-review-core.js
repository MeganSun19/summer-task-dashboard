(function (root) {
  function itemId(item) {
    const base = `l${item.level}-d${item.disc}-t${item.track}-w${item.wordIndex}`;
    return item.reviewRevision ? `${base}-r${item.reviewRevision}` : base;
  }

  function filterItems(items, filters, results) {
    return items.filter((item) => (
      (filters.priority === "all" || item.priority === Number(filters.priority)) &&
      (filters.level === "all" || item.level === Number(filters.level)) &&
      (filters.disc === "all" || item.disc === Number(filters.disc)) &&
      (filters.status !== "pending" || !results[itemId(item)]) &&
      (filters.status !== "issues" || ["word-error", "boundary-error"].includes(results[itemId(item)]?.status)) &&
      (filters.status !== "reviewed" || Boolean(results[itemId(item)]))
    ));
  }

  function summarize(items, results) {
    const reviewed = items.filter((item) => Boolean(results[itemId(item)])).length;
    const counts = { verified: 0, "word-error": 0, "boundary-error": 0, skipped: 0 };
    for (const item of items) {
      const result = results[itemId(item)];
      if (!result) continue;
      if (Object.hasOwn(counts, result.status)) counts[result.status] += 1;
    }
    return { total: items.length, reviewed, pending: items.length - reviewed, ...counts };
  }

  function reviewRecord(item, status, note, reviewedAt = new Date().toISOString()) {
    return {
      itemId: itemId(item),
      status,
      note: String(note || "").trim(),
      reviewedAt,
      source: {
        level: item.level,
        disc: item.disc,
        track: item.track,
        wordIndex: item.wordIndex,
        word: item.word,
        startSeconds: item.startSeconds,
        endSeconds: item.endSeconds,
        reviewClip: item.activeReviewClip || item.reviewClip || null
      }
    };
  }

  function validateQueuePayload(payload) {
    if (!payload || !Array.isArray(payload.items)) {
      throw new Error("所选文件不是有效的 Oxford 试听清单");
    }
    if (payload.items.length === 0 && payload.summary?.total !== 0) {
      throw new Error("所选文件不是有效的 Oxford 试听清单");
    }
    const invalid = payload.items.some((item) => (
      !Number.isInteger(item.level) ||
      !Number.isInteger(item.disc) ||
      !Number.isInteger(item.track) ||
      !Number.isInteger(item.wordIndex) ||
      !item.reviewClip ||
      !Number.isFinite(item.reviewClip.startSeconds) ||
      !Number.isFinite(item.reviewClip.endSeconds)
    ));
    if (invalid) throw new Error("试听清单包含无效的音轨或片段坐标");
    return payload.items;
  }

  root.OPWAudioReviewCore = { itemId, filterItems, summarize, reviewRecord, validateQueuePayload };
})(typeof window === "undefined" ? globalThis : window);
