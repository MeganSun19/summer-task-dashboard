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
    return `opw-l${audio.level}-d${audio.disc}-track${String(audio.track).padStart(2, "0")}`;
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
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

  function buildRounds(day) {
    const phonicsWords = day?.phonics?.words || [];
    const phonicsChoices = phonicsWords.map((entry) => entry.word);
    const rounds = phonicsWords.map((entry) => ({
      kind: "phonics",
      label: "声音实验室",
      word: entry.word,
      mode: entry.audio?.status === "verified" ? "listen" : "read",
      audio: entry.audio || { status: "unavailable" },
      assetId: assetId(entry.audio),
      choices: phonicsChoices
    }));

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
    return rounds;
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

  root.OPWWeek1CourseCore = {
    courseDayNumber, assetId, buildRounds, activityId, availabilityLabel, roundSummary
  };
})(typeof window === "undefined" ? globalThis : window);
