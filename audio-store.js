(function () {
  const DB_NAME = "twin-star-audio-v1";
  const DB_VERSION = 2;
  const ASSET_STORE = "audioAssets";
  const PACKAGE_STORE = "audioPackages";
  const REVIEW_QUEUE_STORE = "reviewQueues";
  const OPW_REVIEW_QUEUE_ID = "opw-listening-review-priority-v1";
  const TRACK_PATTERN = /^OPW_SB([1-3])_Disc([12])_Track(\d{2,3})\.mp3$/i;
  let databasePromise;
  let staticManifestPromise;

  function loadStaticManifest() {
    if (staticManifestPromise) return staticManifestPromise;
    staticManifestPromise = fetch("./course-audio/manifest.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((manifest) => manifest?.assets || {})
      .catch((error) => {
        console.error("Static course audio manifest failed to load", error);
        return {};
      });
    return staticManifestPromise;
  }

  async function getStaticAsset(assetId) {
    const asset = (await loadStaticManifest())[assetId];
    return asset ? { ...asset, source: "static" } : undefined;
  }

  function openDatabase() {
    if (!window.indexedDB) return Promise.reject(new Error("当前浏览器不支持 IndexedDB"));
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error || new Error("无法打开本地音频库"));
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(ASSET_STORE)) {
          const assets = database.createObjectStore(ASSET_STORE, { keyPath: "id" });
          assets.createIndex("packageId", "packageId", { unique: false });
        }
        if (!database.objectStoreNames.contains(PACKAGE_STORE)) {
          database.createObjectStore(PACKAGE_STORE, { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains(REVIEW_QUEUE_STORE)) {
          database.createObjectStore(REVIEW_QUEUE_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
    });
    return databasePromise;
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("本地音频库操作失败"));
    });
  }

  function transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("本地音频库写入失败"));
      transaction.onabort = () => reject(transaction.error || new Error("本地音频库写入已取消"));
    });
  }

  async function getStorageInfo() {
    let usage = 0;
    let quota = 0;
    let persisted = false;
    try {
      const estimate = await navigator.storage?.estimate?.();
      usage = estimate?.usage || 0;
      quota = estimate?.quota || 0;
      persisted = Boolean(await navigator.storage?.persisted?.());
    } catch {
      // Some browsers expose IndexedDB without the optional StorageManager methods.
    }
    return { usage, quota, available: quota ? Math.max(0, quota - usage) : 0, persisted };
  }

  async function requestPersistence() {
    if (!navigator.storage?.persist) return false;
    try {
      return Boolean(await navigator.storage.persist());
    } catch {
      return false;
    }
  }

  async function preflightArchive(file) {
    if (!file || !/\.zip$/i.test(file.name)) throw new Error("请选择 Oxford 音频 ZIP 文件");
    if (!window.fflate?.unzip) throw new Error("ZIP 解压组件未加载");
    const storage = await getStorageInfo();
    const estimatedNeed = Math.max(file.size * 2.2, 80 * 1024 * 1024);
    if (storage.quota && storage.available < estimatedNeed) {
      const error = new Error(`本机可用网站空间不足，至少还需要 ${formatBytes(estimatedNeed)}`);
      error.code = "INSUFFICIENT_STORAGE";
      throw error;
    }
  }

  async function preflightFiles(files) {
    if (!files?.length) throw new Error("请选择 Oxford Disc 音频文件夹");
    const totalBytes = [...files].reduce((sum, file) => sum + (file.size || 0), 0);
    const storage = await getStorageInfo();
    const estimatedNeed = Math.max(totalBytes * 1.25, 80 * 1024 * 1024);
    if (storage.quota && storage.available < estimatedNeed) {
      const error = new Error(`本机可用网站空间不足，至少还需要 ${formatBytes(estimatedNeed)}`);
      error.code = "INSUFFICIENT_STORAGE";
      throw error;
    }
  }

  async function unzipArchive(file) {
    const input = new Uint8Array(await file.arrayBuffer());
    return new Promise((resolve, reject) => {
      window.fflate.unzip(input, (error, files) => {
        if (error) reject(error);
        else resolve(files);
      });
    });
  }

  function inspectTracks(files) {
    const tracks = [];
    for (const [path, bytes] of Object.entries(files)) {
      const filename = path.split("/").pop();
      const match = filename.match(TRACK_PATTERN);
      if (!match) continue;
      tracks.push({
        level: Number(match[1]),
        disc: Number(match[2]),
        track: Number(match[3]),
        filename,
        byteSize: bytes.byteLength,
        blob: new Blob([bytes], { type: "audio/mpeg" })
      });
    }
    return validateTracks(tracks);
  }

  function inspectFileTracks(files) {
    const tracks = [];
    for (const file of files) {
      const match = file.name.match(TRACK_PATTERN);
      if (!match) continue;
      tracks.push({
        level: Number(match[1]),
        disc: Number(match[2]),
        track: Number(match[3]),
        filename: file.name,
        byteSize: file.size,
        blob: file
      });
    }
    return validateTracks(tracks);
  }

  function validateTracks(tracks) {
    if (!tracks.length) throw new Error("所选内容中没有找到 OPW 音轨");
    const level = tracks[0].level;
    const disc = tracks[0].disc;
    if (tracks.some((item) => item.level !== level || item.disc !== disc)) {
      throw new Error("一个 ZIP 中只能包含同一册、同一张光盘的音轨");
    }
    tracks.sort((a, b) => a.track - b.track);
    const seen = new Set();
    for (const item of tracks) {
      if (seen.has(item.track)) throw new Error(`发现重复音轨 Track ${item.track}`);
      seen.add(item.track);
    }
    if (tracks[0].track !== 1 || tracks.some((item, index) => item.track !== index + 1)) {
      throw new Error("音轨编号不连续，请重新下载完整资源包");
    }
    return { level, disc, tracks };
  }

  async function existingAssetKeys(database, packageId) {
    const transaction = database.transaction(ASSET_STORE, "readonly");
    const index = transaction.objectStore(ASSET_STORE).index("packageId");
    return requestResult(index.getAllKeys(packageId));
  }

  async function importZip(file, onProgress = () => {}) {
    await preflightArchive(file);
    onProgress({ phase: "reading", message: `正在读取 ${file.name}` });
    const files = await unzipArchive(file);
    return importTracks(inspectTracks(files), file.name, onProgress);
  }

  async function importFiles(files, onProgress = () => {}) {
    await preflightFiles(files);
    onProgress({ phase: "reading", message: "正在检查所选 MP3 文件" });
    const inspected = inspectFileTracks(files);
    return importTracks(inspected, `Level ${inspected.level} Disc ${inspected.disc} 文件夹`, onProgress);
  }

  async function importSingleTrack(file, onProgress = () => {}) {
    if (!file) throw new Error("请选择 OPW_SB1_Disc1_Track05.mp3");
    const storage = await getStorageInfo();
    if (storage.quota && storage.available < file.size * 2) {
      const error = new Error("本机网站存储空间不足，请释放空间后重试");
      error.code = "INSUFFICIENT_STORAGE";
      throw error;
    }
    const match = file.name.match(TRACK_PATTERN);
    if (!match || Number(match[1]) !== 1 || Number(match[2]) !== 1 || Number(match[3]) !== 5) {
      throw new Error("请选择 OPW_SB1_Disc1_Track05.mp3");
    }
    const packageId = "opw-l1-d1";
    const database = await openDatabase();
    onProgress({ phase: "writing", message: "正在保存 Track 05" });
    const assetTransaction = database.transaction(ASSET_STORE, "readwrite");
    const assetWritten = transactionComplete(assetTransaction);
    assetTransaction.objectStore(ASSET_STORE).put({
      id: `${packageId}-track05`,
      packageId,
      level: 1,
      disc: 1,
      track: 5,
      filename: file.name,
      bytes: file.size,
      blob: file,
      importedAt: new Date().toISOString()
    });
    await assetWritten;
    const existingPackage = await requestResult(database.transaction(PACKAGE_STORE, "readonly").objectStore(PACKAGE_STORE).get(packageId));
    if (!existingPackage) {
      const packageTransaction = database.transaction(PACKAGE_STORE, "readwrite");
      const packageWritten = transactionComplete(packageTransaction);
      packageTransaction.objectStore(PACKAGE_STORE).put({
        id: packageId,
        course: "Oxford Phonics World",
        level: 1,
        disc: 1,
        trackCount: 1,
        totalBytes: file.size,
        sourceName: "Track 05 快速试用",
        importedAt: new Date().toISOString()
      });
      await packageWritten;
    }
    onProgress({ phase: "complete", message: "Track 05 导入完成" });
    return { packageId, level: 1, disc: 1, trackCount: 1, totalBytes: file.size };
  }

  async function importTracks({ level, disc, tracks }, sourceName, onProgress) {
    const packageId = `opw-l${level}-d${disc}`;
    const totalBytes = tracks.reduce((sum, item) => sum + item.byteSize, 0);
    const database = await openDatabase();
    const oldKeys = await existingAssetKeys(database, packageId);
    if (oldKeys.length) {
      const deleteTransaction = database.transaction(ASSET_STORE, "readwrite");
      const deleted = transactionComplete(deleteTransaction);
      const assets = deleteTransaction.objectStore(ASSET_STORE);
      oldKeys.forEach((key) => assets.delete(key));
      await deleted;
    }
    for (let index = 0; index < tracks.length; index += 1) {
      const item = tracks[index];
      const trackLabel = String(item.track).padStart(2, "0");
      const writeTransaction = database.transaction(ASSET_STORE, "readwrite");
      const written = transactionComplete(writeTransaction);
      writeTransaction.objectStore(ASSET_STORE).put({
        id: `${packageId}-track${trackLabel}`,
        packageId,
        level,
        disc,
        track: item.track,
        filename: item.filename,
        bytes: item.byteSize,
        blob: item.blob,
        importedAt: new Date().toISOString()
      });
      await written;
      onProgress({
        phase: "writing",
        current: index + 1,
        total: tracks.length,
        message: `正在保存 Level ${level} Disc ${disc}：${index + 1}/${tracks.length}`
      });
    }
    const packageTransaction = database.transaction(PACKAGE_STORE, "readwrite");
    const packageWritten = transactionComplete(packageTransaction);
    packageTransaction.objectStore(PACKAGE_STORE).put({
      id: packageId,
      course: "Oxford Phonics World",
      level,
      disc,
      trackCount: tracks.length,
      totalBytes,
      sourceName,
      importedAt: new Date().toISOString()
    });
    await packageWritten;
    onProgress({ phase: "complete", message: `Level ${level} Disc ${disc} 导入完成` });
    return { packageId, level, disc, trackCount: tracks.length, totalBytes };
  }

  async function listPackages() {
    const database = await openDatabase();
    const transaction = database.transaction(PACKAGE_STORE, "readonly");
    const packages = await requestResult(transaction.objectStore(PACKAGE_STORE).getAll());
    return packages.sort((a, b) => a.level - b.level || a.disc - b.disc);
  }

  async function getLocalAsset(assetId) {
    const database = await openDatabase();
    const transaction = database.transaction(ASSET_STORE, "readonly");
    return requestResult(transaction.objectStore(ASSET_STORE).get(assetId));
  }

  async function getAsset(assetId) {
    const staticAsset = await getStaticAsset(assetId);
    if (staticAsset) return staticAsset;
    const localAsset = await getLocalAsset(assetId);
    if (localAsset) return { ...localAsset, source: "local" };
    if (!window.CloudStore?.getInfo().connected) return undefined;
    const cloudAsset = await window.CloudStore.getFamilyAudioAsset(assetId);
    if (!cloudAsset) return undefined;
    const match = assetId.match(/^opw-l([1-3])-d([12])-track(\d{2,3})$/);
    return {
      id: assetId,
      packageId: `opw-l${match[1]}-d${match[2]}`,
      level: Number(match[1]),
      disc: Number(match[2]),
      track: Number(match[3]),
      bytes: cloudAsset.bytes,
      source: "cloud"
    };
  }

  async function createAudioUrl(assetId) {
    const staticAsset = await getStaticAsset(assetId);
    if (staticAsset?.url) return new URL(staticAsset.url, document.baseURI).href;
    const localAsset = await getLocalAsset(assetId);
    if (localAsset?.blob) return URL.createObjectURL(localAsset.blob);
    if (!window.CloudStore?.getInfo().connected) return "";
    return window.CloudStore.getFamilyAudioUrl(assetId);
  }

  async function uploadAllToCloud(onProgress = () => {}) {
    if (!window.CloudStore?.getInfo().connected) throw new Error("请先创建或加入家庭空间");
    if (window.CloudStore.getInfo().accessRole !== "owner") throw new Error("只有创建家庭的 owner 设备可以上传家庭音频");
    const database = await openDatabase();
    const transaction = database.transaction(ASSET_STORE, "readonly");
    const assetIds = await requestResult(transaction.objectStore(ASSET_STORE).getAllKeys());
    if (!assetIds.length) throw new Error("本机还没有可上传的 Oxford 音频");
    const existing = new Set((await window.CloudStore.listFamilyAudioAssets()).map((item) => item.assetId));
    const pendingIds = assetIds.filter((assetId) => !existing.has(assetId));
    for (let index = 0; index < pendingIds.length; index += 1) {
      const assetTransaction = database.transaction(ASSET_STORE, "readonly");
      const asset = await requestResult(assetTransaction.objectStore(ASSET_STORE).get(pendingIds[index]));
      onProgress({ current: index + 1, total: pendingIds.length, asset });
      await window.CloudStore.uploadFamilyAudioAsset(asset);
    }
    const cloudAssets = await window.CloudStore.listFamilyAudioAssets(true);
    return { uploaded: pendingIds.length, skipped: assetIds.length - pendingIds.length, cloudCount: cloudAssets.length };
  }

  async function deletePackage(packageId) {
    const database = await openDatabase();
    const oldKeys = await existingAssetKeys(database, packageId);
    const transaction = database.transaction([ASSET_STORE, PACKAGE_STORE], "readwrite");
    const completed = transactionComplete(transaction);
    const assets = transaction.objectStore(ASSET_STORE);
    oldKeys.forEach((key) => assets.delete(key));
    transaction.objectStore(PACKAGE_STORE).delete(packageId);
    await completed;
  }

  async function saveReviewQueue(payload) {
    const database = await openDatabase();
    const transaction = database.transaction(REVIEW_QUEUE_STORE, "readwrite");
    const completed = transactionComplete(transaction);
    transaction.objectStore(REVIEW_QUEUE_STORE).put({
      id: OPW_REVIEW_QUEUE_ID,
      payload,
      savedAt: new Date().toISOString()
    });
    await completed;
  }

  async function getReviewQueue() {
    const database = await openDatabase();
    const transaction = database.transaction(REVIEW_QUEUE_STORE, "readonly");
    const stored = await requestResult(transaction.objectStore(REVIEW_QUEUE_STORE).get(OPW_REVIEW_QUEUE_ID));
    return stored?.payload || null;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
    return `${(bytes / 1024 / 1024).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} MB`;
  }

  window.AudioStore = {
    importZip,
    importFiles,
    importSingleTrack,
    listPackages,
    getAsset,
    createAudioUrl,
    uploadAllToCloud,
    deletePackage,
    saveReviewQueue,
    getReviewQueue,
    getStorageInfo,
    requestPersistence,
    formatBytes
  };
})();
