(function () {
  const FAMILY_KEY = "summer-task-dashboard-family-v1";
  const SAVE_DELAY_MS = 450;
  let client;
  let familyId = localStorage.getItem(FAMILY_KEY);
  let revision = null;
  let inviteCode = "";
  let saveTimer;
  let pendingState;
  let saving = false;
  let subscribedFamilyId;
  let callbacks = {};

  function emitStatus(status, message) {
    callbacks.onStatus?.({ status, message, familyId, inviteCode, revision });
  }

  async function init(nextCallbacks = {}) {
    callbacks = nextCallbacks;
    const config = window.SUPABASE_CONFIG;
    if (!config?.url || !config?.publishableKey || !window.supabase?.createClient) {
      const error = Object.assign(new Error("Supabase 客户端或公开配置未加载"), {
        code: "CLIENT_NOT_READY"
      });
      emitStatus("local", friendlyError(error, "加载云端组件"));
      return { available: false, error, phase: "加载云端组件" };
    }

    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });

    let phase = "读取登录状态";
    try {
      let { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        phase = "匿名登录";
        const result = await client.auth.signInAnonymously();
        if (result.error) throw result.error;
        sessionData = { session: result.data.session };
      }

      phase = "读取家庭成员关系";
      if (!familyId) await restoreFamilyMembership();
      if (!familyId) {
        emitStatus("setup", "等待创建或加入家庭");
        return { available: true, needsSetup: true };
      }

      phase = "载入家庭数据";
      await loadRemoteState();
      subscribeToRemoteState();
      emitStatus("synced", "云端已同步");
      return { available: true, connected: true, familyId, inviteCode, revision };
    } catch (error) {
      console.warn("Supabase initialization failed; using local storage.", error);
      emitStatus("local", friendlyError(error, phase));
      return { available: false, error, phase };
    }
  }

  async function restoreFamilyMembership() {
    const { data, error } = await client.rpc("get_my_families");
    if (error) throw error;
    const family = data?.[0];
    if (!family) return;
    setFamily(family.family_id, family.invite_code, family.revision);
  }

  async function createFamily(name, pin, initialState) {
    emitStatus("syncing", "正在创建家庭空间…");
    const { data, error } = await client.rpc("create_family", {
      family_name: name,
      parent_pin: pin,
      initial_state: stateForCloud(initialState)
    });
    if (error) throw error;
    const family = data?.[0];
    if (!family) throw new Error("家庭空间创建失败");
    setFamily(family.family_id, family.invite_code, family.revision);
    subscribeToRemoteState();
    emitStatus("synced", "本地数据已上传");
    return { familyId, inviteCode, revision };
  }

  async function joinFamily(code, pin) {
    emitStatus("syncing", "正在加入家庭空间…");
    const { data, error } = await client.rpc("join_family", {
      supplied_invite_code: code,
      parent_pin: pin
    });
    if (error) throw error;
    const family = data?.[0];
    if (!family) throw new Error("没有找到家庭空间");
    setFamily(family.family_id, family.invite_code, family.revision);
    await loadRemoteState();
    subscribeToRemoteState();
    emitStatus("synced", "已加入并载入家庭数据");
    return { familyId, inviteCode, revision };
  }

  async function loadRemoteState() {
    const { data, error } = await client
      .from("family_states")
      .select("state, revision")
      .eq("family_id", familyId)
      .single();
    if (error) throw error;
    revision = data.revision;
    callbacks.onRemoteState?.(data.state, { revision, source: "load" });
    return data.state;
  }

  function scheduleSave(state) {
    if (!client || !familyId) return;
    pendingState = stateForCloud(state);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, SAVE_DELAY_MS);
    emitStatus("syncing", "正在保存…");
  }

  async function flushSave() {
    if (saving || !pendingState || !client || !familyId) return;
    saving = true;
    const stateToSave = pendingState;
    pendingState = null;
    try {
      const { data, error } = await client.rpc("save_family_state", {
        target_family_id: familyId,
        next_state: stateToSave,
        expected_revision: revision
      });
      if (error) {
        if (String(error.message).includes("SYNC_CONFLICT")) {
          await loadRemoteState();
          emitStatus("conflict", "发现其他设备的新数据，已重新载入");
          return;
        }
        throw error;
      }
      revision = data?.[0]?.revision ?? revision;
      emitStatus("synced", "已保存到云端");
    } catch (error) {
      console.warn("Cloud save failed; local copy remains available.", error);
      pendingState = stateToSave;
      emitStatus("offline", "云端暂不可用，数据已保存在本机");
    } finally {
      saving = false;
      if (pendingState) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flushSave, SAVE_DELAY_MS);
      }
    }
  }

  function subscribeToRemoteState() {
    if (!client || !familyId || subscribedFamilyId === familyId) return;
    subscribedFamilyId = familyId;
    client
      .channel(`family-state-${familyId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "family_states", filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (!payload.new || payload.new.revision <= (revision || 0)) return;
          revision = payload.new.revision;
          pendingState = null;
          callbacks.onRemoteState?.(payload.new.state, { revision, source: "realtime" });
          emitStatus("synced", "已收到其他设备的更新");
        }
      )
      .subscribe();
  }

  function setFamily(nextFamilyId, nextInviteCode, nextRevision) {
    familyId = nextFamilyId;
    inviteCode = nextInviteCode || inviteCode;
    revision = nextRevision ?? revision;
    localStorage.setItem(FAMILY_KEY, familyId);
  }

  function stateForCloud(state) {
    const nextState = structuredClone(state);
    delete nextState.activeKid;
    return nextState;
  }

  function friendlyError(error, phase = "云端操作") {
    const message = String(error?.message || error || "");
    if (message.includes("Anonymous sign-ins are disabled")) return "请先启用 Supabase 匿名登录";
    if (message.includes("Could not find the function") || message.includes("schema cache")) return "请先执行 Supabase 初始化 SQL";
    if (message.includes("INVALID_INVITE_OR_PIN")) return "邀请码或家长 PIN 不正确";
    if (message.includes("INVALID_PIN")) return "PIN 需要使用 4–8 位数字";
    return diagnosticError(error, phase);
  }

  function diagnosticError(error, phase) {
    const code = cleanDiagnosticPart(error?.code || error?.name || "UNKNOWN", 48);
    const status = Number.isFinite(Number(error?.status)) ? ` / HTTP ${Number(error.status)}` : "";
    const message = cleanDiagnosticPart(error?.message || error || "未知错误", 180);
    return `${phase}失败 [${code}${status}]：${message}。当前数据仍保存在本机。`;
  }

  function cleanDiagnosticPart(value, maxLength) {
    return String(value)
      .replace(/https?:\/\/\S+/gi, "[URL]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  window.CloudStore = {
    init,
    createFamily,
    joinFamily,
    scheduleSave,
    flushSave,
    friendlyError,
    getInfo: () => ({ familyId, inviteCode, revision, connected: Boolean(client && familyId) })
  };
})();
