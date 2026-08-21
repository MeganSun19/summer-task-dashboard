(function (root) {
  function normalizeFamilies(rows = []) {
    const byId = new Map();
    rows.forEach((row) => {
      const familyId = String(row?.family_id || row?.familyId || "").trim();
      if (!familyId) return;
      byId.set(familyId, {
        familyId,
        familyName: String(row.family_name || row.familyName || "家庭空间").trim() || "家庭空间",
        inviteCode: String(row.invite_code || row.inviteCode || "").trim().toUpperCase(),
        accessRole: String(row.access_role || row.accessRole || "device"),
        revision: Number(row.revision) || 1
      });
    });
    return [...byId.values()];
  }

  function chooseActiveFamily(rows, preferredFamilyId) {
    const families = normalizeFamilies(rows);
    const preferred = families.find((family) => family.familyId === preferredFamilyId);
    if (preferred) return { activeFamily: preferred, families, needsChoice: false };
    if (families.length === 1) return { activeFamily: families[0], families, needsChoice: false };
    return { activeFamily: null, families, needsChoice: families.length > 1 };
  }

  function shortInviteCode(inviteCode) {
    const code = String(inviteCode || "").trim().toUpperCase();
    return code ? code.slice(-4) : "";
  }

  function hasMeaningfulProgress(state) {
    return ["brother", "younger"].some((kidId) => {
      if (Number(state?.summerPlan?.kids?.[kidId]?.currentDay) > 1) return true;
      const hasResolvedTask = Object.values(state?.days?.[kidId] || {}).some((day) => (
        (day?.tasks || []).some((task) => task?.done || task?.excused)
      ));
      if (hasResolvedTask) return true;
      return Object.values(state?.learningActivities?.progress?.[kidId] || {}).some((activities) => (
        activities && Object.keys(activities).length > 0
      ));
    });
  }

  function isWeChatWebView(userAgent = "") {
    return /MicroMessenger/i.test(String(userAgent));
  }

  root.FamilySyncCore = Object.freeze({
    normalizeFamilies,
    chooseActiveFamily,
    shortInviteCode,
    hasMeaningfulProgress,
    isWeChatWebView
  });
})(typeof window === "undefined" ? globalThis : window);
