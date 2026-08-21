(function () {
  const FAMILY_KEY = "summer-task-dashboard-english-family-v1";
  const LEGACY_FAMILY_KEY = "summer-task-dashboard-family-v1";
  const AUDIO_BUCKET = "family-audio";
  const SAVE_DELAY_MS = 450;
  const CLOUD_INIT_TIMEOUT_MS = 12000;
  let client;
  let familyId = localStorage.getItem(FAMILY_KEY) || localStorage.getItem(LEGACY_FAMILY_KEY);
  let revision = null;
  let inviteCode = "";
  let accessRole = "";
  let availableFamilies = [];
  let saveTimer;
  let pendingState;
  let saving = false;
  let subscribedFamilyId;
  let stateChannel;
  let callbacks = {};
  let audioAssetListPromise;
  let activeSavePromise;

  function emitStatus(status, message) {
    const detail = { status, message, familyId, inviteCode, revision, accessRole, families: availableFamilies };
    callbacks.onStatus?.(detail);
    window.dispatchEvent(new CustomEvent("cloud-store-status", { detail }));
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

    const isWeChat = window.FamilySyncCore?.isWeChatWebView(navigator.userAgent);
    const authOptions = { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false };
    if (isWeChat) {
      // Android WeChat's long-lived WebView can retain an orphaned Web Lock.
      // Supabase auth then waits forever before issuing any network request.
      // WeChat does not share this session with ordinary browser tabs, so a
      // process-local lock is sufficient and avoids the broken navigator lock.
      authOptions.lock = async (_name, _timeout, fn) => fn();
    }
    client = window.supabase.createClient(config.url, config.publishableKey, { auth: authOptions });

    let phase = "读取登录状态";
    try {
      let { data: sessionData, error: sessionError } = await withTimeout(client.auth.getSession(), phase);
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        phase = "匿名登录";
        const result = await withTimeout(client.auth.signInAnonymously(), phase);
        if (result.error) throw result.error;
        sessionData = { session: result.data.session };
      }

      phase = "读取家庭成员关系";
      // Refresh membership metadata on every load. The family id is persisted
      // locally, but the invite code is intentionally kept in memory only.
      // Skipping this call after a refresh left connected devices unable to
      // show the invite code needed by a second device.
      await withTimeout(restoreFamilyMembership(), phase);
      if (!familyId) {
        const needsFamilyChoice = availableFamilies.length > 1;
        emitStatus(needsFamilyChoice ? "choice" : "setup", needsFamilyChoice
          ? "检测到多个家庭空间，请先选择主家庭"
          : "等待创建或加入家庭");
        return { available: true, needsSetup: !needsFamilyChoice, needsFamilyChoice, families: availableFamilies };
      }

      phase = "载入家庭数据";
      await withTimeout(loadRemoteState(), phase);
      subscribeToRemoteState();
      emitStatus("synced", "云端已同步");
      return { available: true, connected: true, familyId, inviteCode, revision };
    } catch (error) {
      console.warn("Supabase initialization failed; using local storage.", error);
      emitStatus("local", friendlyError(error, phase));
      return { available: false, error, phase };
    }
  }

  function withTimeout(promise, phase) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error(`${phase}超时，请关闭微信页面后重新打开`), {
        code: "CLOUD_INIT_TIMEOUT"
      })), CLOUD_INIT_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  async function restoreFamilyMembership() {
    const { data, error } = await client.rpc("get_my_families");
    if (error) throw error;
    const choice = window.FamilySyncCore.chooseActiveFamily(data, familyId);
    availableFamilies = choice.families;
    if (!choice.activeFamily) {
      localStorage.removeItem(FAMILY_KEY);
      familyId = null;
      inviteCode = "";
      revision = null;
      accessRole = "";
      return;
    }
    setFamilyFromMembership(choice.activeFamily);
  }

  async function createFamily(name, pin, initialState) {
    await prepareFamilyChange();
    emitStatus("syncing", "正在创建家庭空间…");
    const { data, error } = await client.rpc("create_family", {
      family_name: name,
      parent_pin: pin,
      initial_state: stateForCloud(initialState)
    });
    if (error) throw error;
    const family = data?.[0];
    if (!family) throw new Error("家庭空间创建失败");
    setFamily(family.family_id, family.invite_code, family.revision, "owner");
    await refreshAvailableFamilies();
    subscribeToRemoteState();
    emitStatus("synced", "本地数据已上传");
    return { familyId, inviteCode, revision };
  }

  async function joinFamily(code, pin, localState) {
    await prepareFamilyChange();
    emitStatus("syncing", "正在加入家庭空间…");
    const { data, error } = await client.rpc("join_family", {
      supplied_invite_code: code,
      parent_pin: pin
    });
    if (error) throw error;
    const family = data?.[0];
    if (!family) throw new Error("没有找到家庭空间");
    setFamily(family.family_id, family.invite_code, family.revision, "device");
    await refreshAvailableFamilies();
    await loadRemoteState(localState ? "family-switch" : "load", localState ? stateForCloud(localState) : null);
    subscribeToRemoteState();
    emitStatus("synced", "已加入并载入家庭数据");
    return { familyId, inviteCode, revision };
  }

  async function switchFamily(code, pin, localState) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    if (normalizedCode && normalizedCode === inviteCode) throw new Error("ALREADY_CURRENT_FAMILY");
    await prepareFamilyChange();
    emitStatus("syncing", "正在切换并合并家庭数据…");
    const { data, error } = await client.rpc("join_family", {
      supplied_invite_code: code,
      parent_pin: pin
    });
    if (error) throw error;
    const family = data?.[0];
    if (!family) throw new Error("没有找到目标家庭空间");
    setFamily(family.family_id, family.invite_code, family.revision, "device");
    await refreshAvailableFamilies();
    await loadRemoteState("family-switch", stateForCloud(localState));
    subscribeToRemoteState();
    emitStatus("syncing", "学习记录已合并，正在保存…");
    return { familyId, inviteCode, revision };
  }

  async function selectExistingFamily(targetFamilyId, localState) {
    const target = availableFamilies.find((family) => family.familyId === targetFamilyId);
    if (!target) throw new Error("FAMILY_MEMBERSHIP_NOT_FOUND");
    if (target.familyId === familyId) return { familyId, inviteCode, revision };
    await prepareFamilyChange();
    emitStatus("syncing", `正在切换到家庭 ${target.inviteCode}…`);
    setFamilyFromMembership(target);
    await loadRemoteState("family-switch", stateForCloud(localState));
    subscribeToRemoteState();
    emitStatus("syncing", "学习记录已合并，正在保存…");
    return { familyId, inviteCode, revision };
  }

  async function refreshAvailableFamilies() {
    const { data, error } = await client.rpc("get_my_families");
    if (error) throw error;
    availableFamilies = window.FamilySyncCore.normalizeFamilies(data);
  }

  async function loadRemoteState(source = "load", localState = null) {
    const { data, error } = await client
      .from("family_states")
      .select("state, revision")
      .eq("family_id", familyId)
      .single();
    if (error) throw error;
    revision = data.revision;
    callbacks.onRemoteState?.(data.state, { revision, source, localState });
    return data.state;
  }

  function scheduleSave(state) {
    if (!client || !familyId) return;
    pendingState = stateForCloud(state);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, SAVE_DELAY_MS);
    emitStatus("syncing", "正在保存…");
  }

  function flushSave() {
    if (saving) return activeSavePromise;
    if (!pendingState || !client || !familyId) return Promise.resolve();
    saving = true;
    const stateToSave = pendingState;
    pendingState = null;
    activeSavePromise = (async () => { try {
      const { data, error } = await client.rpc("save_family_state", {
        target_family_id: familyId,
        next_state: stateToSave,
        expected_revision: revision
      });
      if (error) {
        if (String(error.message).includes("SYNC_CONFLICT")) {
          await loadRemoteState("conflict", stateToSave);
          emitStatus("conflict", "发现其他设备的新数据，已合并后重试");
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
    } })();
    return activeSavePromise;
  }

  async function prepareFamilyChange() {
    clearTimeout(saveTimer);
    if (saving) await activeSavePromise;
    // The caller supplies the current local state for merging into the target.
    // Cancel any old-family debounce so it can never run with the new family id.
    pendingState = null;
  }

  async function listFamilyAudioAssets(force = false) {
    requireFamilyCloud();
    if (force) audioAssetListPromise = null;
    audioAssetListPromise ||= (async () => {
      const { data, error } = await client.storage
        .from(AUDIO_BUCKET)
        .list(`${familyId}/assets`, { limit: 1000, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      return (data || []).filter((item) => item.id && item.name.endsWith(".mp3")).map((item) => ({
        ...item,
        assetId: item.name.slice(0, -4),
        bytes: Number(item.metadata?.size) || 0,
        source: "cloud"
      }));
    })();
    try {
      return await audioAssetListPromise;
    } catch (error) {
      audioAssetListPromise = null;
      throw error;
    }
  }

  async function getFamilyAudioAsset(assetId) {
    validateAudioAssetId(assetId);
    const assets = await listFamilyAudioAssets();
    return assets.find((item) => item.assetId === assetId);
  }

  async function uploadFamilyAudioAsset(asset) {
    requireFamilyCloud();
    validateAudioAssetId(asset?.id);
    if (!(asset.blob instanceof Blob)) throw new Error("本机音频数据不可用");
    const { data, error } = await client.storage
      .from(AUDIO_BUCKET)
      .upload(`${familyId}/assets/${asset.id}.mp3`, asset.blob, {
        cacheControl: "3600",
        contentType: "audio/mpeg",
        upsert: true
      });
    if (error) throw error;
    audioAssetListPromise = null;
    return data;
  }

  async function getFamilyAudioUrl(assetId, expiresIn = 3600) {
    requireFamilyCloud();
    validateAudioAssetId(assetId);
    const { data, error } = await client.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(`${familyId}/assets/${assetId}.mp3`, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }

  function validateAudioAssetId(assetId) {
    if (!/^opw-l[1-3]-d[12]-track\d{2,3}$/.test(String(assetId || ""))) {
      throw new Error("音频资源编号无效");
    }
  }

  function requireFamilyCloud() {
    if (!client || !familyId) throw new Error("请先创建或加入家庭空间");
  }

  function subscribeToRemoteState() {
    if (!client || !familyId || subscribedFamilyId === familyId) return;
    if (stateChannel) client.removeChannel(stateChannel);
    subscribedFamilyId = familyId;
    stateChannel = client
      .channel(`family-state-${familyId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "family_states", filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (!payload.new || payload.new.revision <= (revision || 0)) return;
          revision = payload.new.revision;
          const localState = pendingState;
          pendingState = null;
          callbacks.onRemoteState?.(payload.new.state, {
            revision,
            source: localState ? "conflict" : "realtime",
            localState
          });
          emitStatus("synced", "已收到其他设备的更新");
        }
      )
      .subscribe();
  }

  function setFamily(nextFamilyId, nextInviteCode, nextRevision, nextAccessRole) {
    familyId = nextFamilyId;
    inviteCode = nextInviteCode || inviteCode;
    revision = nextRevision ?? revision;
    accessRole = nextAccessRole || accessRole;
    localStorage.setItem(FAMILY_KEY, familyId);
  }

  function setFamilyFromMembership(family) {
    setFamily(family.familyId, family.inviteCode, family.revision, family.accessRole);
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
    if (message.includes("Bucket not found")) return "请先执行家庭音频存储 SQL 补丁";
    if (message.includes("row-level security") || message.includes("Unauthorized")) return "当前设备没有上传家庭音频的权限";
    if (message.includes("INVALID_INVITE_OR_PIN")) return "邀请码或家长 PIN 不正确";
    if (message.includes("INVALID_PIN")) return "PIN 需要使用 4–8 位数字";
    if (message.includes("ALREADY_CURRENT_FAMILY")) return "这已经是当前家庭，无需切换";
    if (message.includes("FAMILY_MEMBERSHIP_NOT_FOUND")) return "当前设备尚未加入这个家庭，请使用邀请码和 PIN 加入";
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
    switchFamily,
    selectExistingFamily,
    scheduleSave,
    flushSave,
    listFamilyAudioAssets,
    getFamilyAudioAsset,
    uploadFamilyAudioAsset,
    getFamilyAudioUrl,
    friendlyError,
    getInfo: () => ({ familyId, inviteCode, revision, accessRole, families: availableFamilies, connected: Boolean(client && familyId) })
  };
})();
