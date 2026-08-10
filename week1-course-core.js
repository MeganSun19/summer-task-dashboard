(function (root) {
  const HEART_WORD_CLOZE = Object.freeze({
    a: "I read __ book.",
    the: "I love __ earth.",
    is: "Where __ water?",
    I: "__ read a book.",
    you: "__ can go.",
    where: "__ is water?",
    what: "__ has these feet?",
    my: "__ pet is a dinosaur.",
    many: "How __ animals?",
    more: "I can see __.",
    first: "__, the frog is an egg.",
    next: "__, it grows legs.",
    then: "__, it can jump.",
    time: "It is __ for school.",
    want: "I __ a new book.",
    need: "I __ an eraser.",
    because: "I need it __ I use it.",
    with: "I am __ my friend.",
    who: "__ can help?",
    when: "__ does school start?",
    why: "__ does it sleep?",
    how: "__ do they move?",
    does: "Why __ it rain?",
    said: "He __, “Try again.”",
    and: "You __ I read.", can: "I __ go.", in: "It is __ the book.",
    has: "The animal __ spots.", like: "I __ this book.", one: "I see __ frog.",
    have: "I __ a book.", it: "__ is here.", to: "I go __ school.",
    there: "The book is __.", at: "I am __ school.", do: "What __ they eat?",
    help: "I can __.", make: "We __ food.", they: "__ can help.",
    not: "I did __ stop.", read: "I __ a book.", go: "We __ to school.",
    see: "I can __ it.", we: "__ can read.", this: "__ is my book.",
    these: "__ are my books.", love: "I __ my family.", me: "Come with __.",
    your: "This is __ book.", two: "I see __ frogs.", three: "I see __ cats.",
    count: "I can __ to ten.", all: "__ the animals can move.", some: "I see __ books.",
    any: "Do you have __ books?", after: "Read __ school.", before: "Wash your hands __ eating.",
    again: "Try __.", now: "Read it __.", up: "Stand __.", down: "Sit __.",
    away: "The bird flew __.", around: "We walk __ the school.", from: "I am __ China.",
    near: "The book is __ me.", far: "The school is __ away.", school: "I go to __.",
    new: "This is my __ book.", ready: "I am __ to read.", get: "I __ my book.",
    come: "Please __ here.", find: "Can you __ it?", give: "Please __ it to me.",
    for: "This book is __ you.", of: "I see a lot __ books.", but: "I can read, __ I need help.",
    so: "It is cold, __ I wear a coat.", he: "__ can read.", she: "__ can read.",
    them: "I can see __.", which: "__ book do you like?", his: "This is __ book.",
    her: "This is __ book.", was: "It __ cold.", were: "They __ at school.",
    are: "They __ ready.", am: "I __ ready.", could: "I __ read it.",
    would: "I __ like a book.", will: "I __ help.", must: "We __ go now.",
    did: "I __ not stop.", had: "I __ a good day.", been: "I have __ there.",
    be: "I want to __ ready.", say: "What did you __?", look: "__ at the book.",
    little: "I see a __ cat.", big: "I see a __ dog."
  });
  const COURSE_MODULES = Object.freeze([
    { id: "soundLab", label: "声音实验室", shortLabel: "拼读" },
    { id: "coreWords", label: "核心高频词", shortLabel: "核心词" },
    { id: "raz", label: "RAZ 故事森林", shortLabel: "RAZ" },
    { id: "extraWords", label: "高频词加餐", shortLabel: "加餐" }
  ]);

  function parseISODate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function courseDayNumber(date, start, totalDays = 7, scheduleDates = null) {
    if (Array.isArray(scheduleDates) && scheduleDates.length) {
      const index = scheduleDates.indexOf(date);
      return index >= 0 ? index + 1 : null;
    }
    if (!start) return 1;
    const offset = Math.round((parseISODate(date) - parseISODate(start)) / 86400000);
    return offset >= 0 && offset < totalDays ? offset + 1 : null;
  }

  function assetId(audio) {
    if (!audio || audio.status !== "verified") return null;
    if (audio.assetId) return audio.assetId;
    if (audio.itemId) return `opw-clip-${String(audio.itemId).replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
    return `opw-l${audio.level}-d${audio.disc}-track${String(audio.track).padStart(2, "0")}`;
  }

  function playbackAudio(audio) {
    if (!audio?.itemId || audio.assetId || !audio.clip) return audio;
    const duration = Math.max(0, Number(audio.clip.endSeconds) - Number(audio.clip.startSeconds));
    return {
      ...audio,
      sourceClip: audio.clip,
      clip: { startSeconds: 0, endSeconds: Number(duration.toFixed(3)) }
    };
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function shuffleWithSeed(values, seedText) {
    const result = [...values];
    let state = 2166136261;
    for (const character of String(seedText)) {
      state ^= character.charCodeAt(0);
      state = Math.imul(state, 16777619) >>> 0;
    }
    for (let index = result.length - 1; index > 0; index -= 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const target = state % (index + 1);
      [result[index], result[target]] = [result[target], result[index]];
    }
    if (result.length > 1 && result.every((item, index) => item === values[index])) {
      result.push(result.shift());
    }
    return result;
  }

  function choiceSet(answer, candidates, size = 4) {
    const pool = unique([answer, ...candidates]);
    const start = Math.max(0, pool.indexOf(answer) - 1);
    const selected = pool.slice(start, start + size);
    for (const item of pool) {
      if (selected.length >= size) break;
      if (!selected.includes(item)) selected.push(item);
    }
    return selected;
  }

  function clozePrompt(day, word) {
    if (HEART_WORD_CLOZE[word]) return HEART_WORD_CLOZE[word];
    const sentence = day?.heartWords?.sentences?.[word];
    if (!sentence) return "遮住英文本，默写刚才学习的高频词。";
    const escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return sentence.replace(new RegExp(`\\b${escaped}\\b`, "i"), "__");
  }

  function buildRounds(day) {
    const phonicsWords = day?.phonics?.words || [];
    const phonicsChoices = phonicsWords.map((entry) => entry.word);
    const rounds = phonicsWords.map((entry) => {
      const audio = playbackAudio(entry.audio) || { status: "unavailable" };
      return {
        kind: "phonics",
        label: "声音实验室",
        word: entry.word,
        mode: entry.audio?.status === "verified" ? "listen" : "read",
        audio,
        assetId: assetId(entry.audio),
        choices: phonicsChoices
      };
    });

    const newHeartWords = unique(day?.heartWords?.newWords || [day?.heartWords?.new]);
    const heartWords = unique([...newHeartWords, ...(day?.heartWords?.review || [])]);
    newHeartWords.forEach((word) => {
      rounds.push({
        kind: "heart",
        label: "心词锻造屋",
        mode: "study",
        word,
        prompt: HEART_WORD_CLOZE[word] || "记住这个核心高频词。"
      });
    });
    heartWords.forEach((word) => rounds.push({
      kind: "heart",
      label: "心词锻造屋",
      mode: "spell",
      word,
      isNew: newHeartWords.includes(word),
      prompt: HEART_WORD_CLOZE[word] || "遮住英文本，默写刚才学习的核心高频词。"
    }));

    const targetWords = day?.raz?.targetWords || [];
    if (targetWords.length) {
      rounds.push({
        kind: "raz",
        label: "RAZ 故事森林",
        mode: "word-bank",
        words: targetWords,
        prompt: "先读一遍目标词，再到书里找它们。"
      });
    }
    (day?.raz?.sentenceFrames || []).forEach((sentence) => rounds.push({
      kind: "raz",
      label: "RAZ 故事森林",
      mode: "speak",
      sentence,
      prompt: "读句型，再换一个词说一句自己的话。"
    }));
    const assignment = day?.raz?.assignment;
    const books = assignment?.mode === "fixed"
      ? unique(assignment.books || [])
      : assignment?.mode === "choose"
        ? unique(assignment.fixedBooks || [])
        : unique(day?.raz?.sourceBooks || [day?.raz?.anchorBook, ...(day?.raz?.supportingBooks || [])]);
    books.forEach((book, index) => {
      rounds.push({
        kind: "raz",
        label: "RAZ 故事森林",
        mode: "book",
        book,
        bookNumber: index + 1,
        bookCount: books.length,
        focus: day.raz.focus,
        prompt: `${day.raz.childTask || day.raz.parentTask || "完成听、指读、找词和口头复述。"}${books.length > 1 ? `（今日第 ${index + 1}/${books.length} 本）` : ""}`
      });
    });
    if (assignment?.mode === "choose") {
      assignment.groups.forEach((group) => {
        for (let slot = 1; slot <= group.count; slot += 1) {
          rounds.push({
            kind: "raz",
            label: "RAZ 故事森林",
            mode: "book-choice",
            group: group.label,
            slot,
            slotCount: group.count,
            choices: unique(group.choices || []),
            rule: assignment.rule,
            prompt: `读完后选择你实际复习的书；${group.label}需完成 ${group.count} 本。`
          });
        }
      });
    }
    const newExtensionWords = unique(day?.heartWords?.extensionWords || []);
    const extensionWords = unique([...newExtensionWords, ...(day?.heartWords?.extensionReview || [])]);
    newExtensionWords.forEach((word) => rounds.push({
      kind: "heart",
      label: "高频词加餐",
      mode: "study",
      word,
      isExtension: true,
      prompt: clozePrompt(day, word)
    }));
    extensionWords.forEach((word) => rounds.push({
      kind: "heart",
      label: "高频词加餐",
      mode: "spell",
      word,
      isNew: newExtensionWords.includes(word),
      isExtension: true,
      prompt: clozePrompt(day, word)
    }));
    return rounds;
  }

  function moduleIdForRound(round) {
    if (round?.kind === "phonics") return "soundLab";
    if (round?.kind === "raz") return "raz";
    if (round?.label === "高频词加餐") return "extraWords";
    return "coreWords";
  }

  function groupRoundsByModule(rounds) {
    return COURSE_MODULES.map((definition) => ({
      ...definition,
      rounds: rounds.filter((round) => moduleIdForRound(round) === definition.id)
    })).filter((module) => module.rounds.length);
  }

  function moduleProgressFromSaved(saved, modules, schemaVersion = 6) {
    const result = Object.fromEntries(modules.map((module) => [module.id, {
      completedRounds: 0,
      completedAt: null
    }]));
    if (!saved) return result;
    if (saved.completedAt) {
      for (const module of modules) {
        result[module.id] = { completedRounds: module.rounds.length, completedAt: saved.completedAt };
      }
      return result;
    }
    if (Number(saved.roundSchemaVersion) >= schemaVersion && saved.moduleProgress) {
      for (const module of modules) {
        const stored = saved.moduleProgress[module.id] || {};
        const completedRounds = Math.min(module.rounds.length, Math.max(0, Number(stored.completedRounds) || 0));
        result[module.id] = {
          completedRounds,
          completedAt: stored.completedAt || (completedRounds >= module.rounds.length ? saved.updatedAt || null : null),
          roundOrderVersion: Number(stored.roundOrderVersion) || 0
        };
      }
      return result;
    }
    let remaining = Math.max(0, Number(saved.completedRounds) || 0);
    for (const module of modules) {
      const completedRounds = Math.min(module.rounds.length, remaining);
      result[module.id] = {
        completedRounds,
        completedAt: completedRounds >= module.rounds.length ? saved.updatedAt || null : null
      };
      remaining -= completedRounds;
    }
    return result;
  }

  function extensionPlanForActivity(heartWords, saved, historyRecords, planVersion = 1) {
    const activated = Number(saved?.extensionPlanVersion || 0) >= planVersion;
    const completedBeforeActivation = Boolean(saved?.completedAt) && !activated;
    if (completedBeforeActivation) {
      return {
        active: false,
        heartWords: { ...heartWords, extensionWords: [], extensionReview: [] }
      };
    }
    const learnedWords = new Set();
    for (const entry of historyRecords || []) {
      if (Number(entry.record?.extensionPlanVersion || 0) < planVersion) continue;
      for (const word of entry.record?.learnedExtensionWords || []) learnedWords.add(word);
    }
    if (activated) {
      for (const word of saved?.learnedExtensionWords || []) learnedWords.add(word);
    }
    return {
      active: true,
      heartWords: {
        ...heartWords,
        extensionWords: unique(heartWords?.extensionWords || []),
        extensionReview: unique(heartWords?.extensionReview || []).filter((word) => learnedWords.has(word))
      }
    };
  }

  function activityId(dayNumber) {
    return dayNumber <= 7 ? `opw-week1-day${dayNumber}` : `opw-english-course-day${dayNumber}`;
  }

  function availabilityLabel(round, hasAsset) {
    if (round?.mode !== "listen") return "拼读";
    return hasAsset ? "可播放" : "需导入";
  }

  function roundSummary(round) {
    if (round.mode === "word-bank") return `目标词 ${round.words.length} 个`;
    if (round.mode === "speak") return round.sentence;
    if (round.mode === "book") return round.book;
    if (round.mode === "book-choice") return round.selectedBook || `${round.group}第 ${round.slot} 本`;
    return round.word || round.label;
  }

  function restoredRoundIndex(saved, roundsLength) {
    if (saved?.completedAt) return roundsLength;
    return Math.min(roundsLength, Math.max(0, Number(saved?.completedRounds) || 0));
  }

  root.OPWWeek1CourseCore = {
    COURSE_MODULES, courseDayNumber, assetId, buildRounds, moduleIdForRound, groupRoundsByModule, shuffleWithSeed,
    moduleProgressFromSaved, extensionPlanForActivity, activityId, availabilityLabel, roundSummary,
    restoredRoundIndex
  };
})(typeof window === "undefined" ? globalThis : window);
