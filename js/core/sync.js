/**
 * ouMusic Cloud Sync Engine (100% Client-Side Serverless GitHub Database)
 * Supports Personal Access Token login, automatic private repo creation (oumusic-sync),
 * account-data.json smart-merge sync, and cross-device QR code transfer.
 * Strictly zero emojis.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY_TOKEN = 'oumusic_gh_token';
  const STORAGE_KEY_USER = 'oumusic_gh_user';
  const STORAGE_KEY_LAST_SYNC = 'oumusic_gh_last_sync';
  const STORAGE_KEY_SHA = 'oumusic_gh_sha';

  const REPO_NAME = 'oumusic-sync';
  const DATA_FILE_PATH = 'account-data.json';
  const DEBOUNCE_DELAY_MS = 6500; // 6.5s debounce (between 5 and 8 seconds)

  let syncDebounceTimer = null;
  let isSyncInProgress = false;
  let hasPendingSync = false;

  // UTF-8 safe base64 encoding and decoding
  function utf8ToBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  }

  function base64ToUtf8(str) {
    const cleanStr = (str || '').replace(/\s+/g, '');
    return decodeURIComponent(atob(cleanStr).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  const OUMusicCloudSync = {
    getToken() {
      try {
        return (localStorage.getItem(STORAGE_KEY_TOKEN) || '').trim();
      } catch (e) {
        return '';
      }
    },

    setToken(token) {
      try {
        if (token) {
          localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
        } else {
          localStorage.removeItem(STORAGE_KEY_TOKEN);
        }
      } catch (e) {}
    },

    getUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_USER);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    setUser(userObj) {
      try {
        if (userObj) {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
        } else {
          localStorage.removeItem(STORAGE_KEY_USER);
        }
      } catch (e) {}
    },

    getLastSyncTime() {
      try {
        return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || null;
      } catch (e) {
        return null;
      }
    },

    setLastSyncTime(isoStr) {
      try {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, isoStr || new Date().toISOString());
      } catch (e) {}
    },

    getFileSha() {
      try {
        return localStorage.getItem(STORAGE_KEY_SHA) || '';
      } catch (e) {
        return '';
      }
    },

    setFileSha(sha) {
      try {
        if (sha) {
          localStorage.setItem(STORAGE_KEY_SHA, sha);
        } else {
          localStorage.removeItem(STORAGE_KEY_SHA);
        }
      } catch (e) {}
    },

    isLoggedIn() {
      return Boolean(this.getToken() && this.getUser());
    },

    /**
     * Authenticates with GitHub PAT, creates oumusic-sync if absent,
     * smart-merges cloud account-data.json with local data, and starts live sync.
     */
    async loginWithToken(rawToken) {
      const token = (rawToken || '').trim();
      if (!token) {
        throw new Error('Токен не может быть пустым');
      }

      // 1. Fetch user profile
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          throw new Error('Неверный или отозванный токен GitHub. Проверьте правильность ключа.');
        } else if (userRes.status === 403) {
          throw new Error('Доступ ограничен GitHub API (превышен лимит запросов или нет прав repo).');
        } else {
          throw new Error(`Ошибка проверки токена (${userRes.status}).`);
        }
      }

      const userData = await userRes.json();
      const userObj = {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url || ''
      };

      this.setToken(token);
      this.setUser(userObj);

      // 2. Ensure private repository oumusic-sync exists
      await this.ensureRepository(token, userObj.login);

      // 3. Load, smart-merge and push cloud data
      await this.initialSync(token, userObj.login);

      // 4. Update UI
      this.updateUI();

      return userObj;
    },

    /**
     * Ensures private repository exists, auto-creating it if not found.
     */
    async ensureRepository(token, ownerLogin) {
      const repoUrl = `https://api.github.com/repos/${ownerLogin}/${REPO_NAME}`;
      const checkRes = await fetch(repoUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (checkRes.ok) {
        return true;
      }

      if (checkRes.status === 404) {
        // Create private repo with auto_init (README)
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: REPO_NAME,
            description: 'ouMusic cloud backup database',
            private: true,
            auto_init: true
          })
        });

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          throw new Error(`Не удалось создать приватный репозиторий: ${errData.message || createRes.statusText}`);
        }

        // Wait 1.5 seconds for GitHub to finish repo initialization
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return true;
      }

      throw new Error(`Ошибка проверки репозитория oumusic-sync (${checkRes.status}).`);
    },

    /**
     * Initial pull, smart merge with existing local data, and initial commit.
     */
    async initialSync(token, ownerLogin) {
      const fileUrl = `https://api.github.com/repos/${ownerLogin}/${REPO_NAME}/contents/${DATA_FILE_PATH}`;
      const getRes = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const localData = await this.collectLocalData();

      if (getRes.status === 404) {
        // First ever cloud sync: push current local data to GitHub
        const b64 = utf8ToBase64(JSON.stringify(localData, null, 2));
        const putRes = await fetch(fileUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Initial ouMusic cloud database',
            content: b64
          })
        });

        if (putRes.ok) {
          const putData = await putRes.json();
          if (putData.content && putData.content.sha) {
            this.setFileSha(putData.content.sha);
          }
          this.setLastSyncTime(new Date().toISOString());
        }
        return;
      }

      if (getRes.ok) {
        const fileData = await getRes.json();
        const currentSha = fileData.sha || '';
        this.setFileSha(currentSha);

        try {
          const remoteJsonStr = base64ToUtf8(fileData.content || '');
          const remoteData = JSON.parse(remoteJsonStr);

          // Smart merge local and remote data
          const mergedData = await this.smartMerge(localData, remoteData);

          // Save merged data locally
          await this.applyDataLocally(mergedData);

          // Push merged data back to GitHub
          const b64 = utf8ToBase64(JSON.stringify(mergedData, null, 2));
          const putRes = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Smart merge ouMusic cloud database [skip ci]',
              content: b64,
              sha: currentSha
            })
          });

          if (putRes.ok) {
            const putData = await putRes.json();
            if (putData.content && putData.content.sha) {
              this.setFileSha(putData.content.sha);
            }
          }
          this.setLastSyncTime(new Date().toISOString());
        } catch (err) {
          console.error('[CloudSync] Error parsing or merging remote data:', err);
        }
      }
    },

    /**
     * Collects all user data from IndexedDB & LocalStorage.
     */
    async collectLocalData() {
      let likes = [];
      let playlists = [];
      let history = [];
      let blacklist = [];

      try {
        if (typeof window.getAllLikes === 'function') {
          likes = await window.getAllLikes();
        }
      } catch (e) {}

      try {
        if (typeof window.getAllPlaylistsAsync === 'function') {
          playlists = await window.getAllPlaylistsAsync();
        } else if (typeof window.getAllPlaylists === 'function') {
          playlists = await window.getAllPlaylists();
        }
      } catch (e) {}

      try {
        if (typeof window.getHistory === 'function') {
          history = await window.getHistory(300);
        }
      } catch (e) {}

      try {
        if (typeof window.getBlacklist === 'function') {
          blacklist = await window.getBlacklist();
        }
      } catch (e) {}

      // Settings & Preferences
      const settings = {
        theme: localStorage.getItem('oumusic_theme') || 'dark',
        amoled: localStorage.getItem('oumusic_amoled') || 'false',
        liquidGlass: localStorage.getItem('oumusic_liquid_glass') || 'true',
        userName: localStorage.getItem('oumusic_user_name') || '',
        userAvatar: localStorage.getItem('oumusic_user_avatar') || '',
        boundArtist: localStorage.getItem('oumusic_bound_artist') || '',
        eqBassGain: localStorage.getItem('ou_eq_bass') || '0',
        eqMidGain: localStorage.getItem('ou_eq_mid') || '0',
        eqTrebleGain: localStorage.getItem('ou_eq_treble') || '0',
        eqPreset: localStorage.getItem('ou_eq_preset') || 'flat'
      };

      return {
        app: 'ouMusic',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        likes: likes || [],
        playlists: playlists || [],
        history: history || [],
        blacklist: blacklist || [],
        settings: settings
      };
    },

    /**
     * Smart merge algorithm:
     * - Playlists: union by ID, taking newer updatedAt for conflicts
     * - Likes: union of track IDs (no likes lost)
     * - History: union by (trackId + playedAt), sorted descending, trimmed to 500
     * - Blacklist: union of disliked track IDs
     * - Settings: merged preference map
     */
    async smartMerge(local, remote) {
      if (!remote || typeof remote !== 'object') return local;

      // 1. Playlists merge
      const plMap = new Map();
      const localPls = Array.isArray(local.playlists) ? local.playlists : [];
      const remotePls = Array.isArray(remote.playlists) ? remote.playlists : [];

      localPls.forEach((pl) => {
        if (pl && pl.id) plMap.set(pl.id, pl);
      });

      remotePls.forEach((rPl) => {
        if (!rPl || !rPl.id) return;
        if (!plMap.has(rPl.id)) {
          plMap.set(rPl.id, rPl);
        } else {
          const lPl = plMap.get(rPl.id);
          const lTime = new Date(lPl.updatedAt || lPl.createdAt || 0).getTime();
          const rTime = new Date(rPl.updatedAt || rPl.createdAt || 0).getTime();
          // Keep newer playlist version, or merge trackIds
          if (rTime > lTime) {
            plMap.set(rPl.id, rPl);
          } else {
            // Combine trackIds so no tracks disappear
            const combinedTracks = Array.from(new Set([...(lPl.trackIds || []), ...(rPl.trackIds || [])]));
            lPl.trackIds = combinedTracks;
            plMap.set(rPl.id, lPl);
          }
        }
      });

      // 2. Likes merge
      const likesMap = new Map();
      const localLikes = Array.isArray(local.likes) ? local.likes : [];
      const remoteLikes = Array.isArray(remote.likes) ? remote.likes : [];

      localLikes.forEach((l) => {
        const id = typeof l === 'string' ? l : l.id;
        if (id) likesMap.set(id, l);
      });

      remoteLikes.forEach((r) => {
        const id = typeof r === 'string' ? r : r.id;
        if (id && !likesMap.has(id)) {
          likesMap.set(id, r);
        }
      });

      // 3. History merge
      const histMap = new Map();
      const localHist = Array.isArray(local.history) ? local.history : [];
      const remoteHist = Array.isArray(remote.history) ? remote.history : [];

      [...localHist, ...remoteHist].forEach((h) => {
        if (h && h.trackId && h.playedAt) {
          const key = `${h.trackId}_${h.playedAt}`;
          histMap.set(key, h);
        }
      });

      const mergedHist = Array.from(histMap.values())
        .sort((a, b) => new Date(b.playedAt || 0) - new Date(a.playedAt || 0))
        .slice(0, 500);

      // 4. Blacklist merge
      const localBl = Array.isArray(local.blacklist) ? local.blacklist : [];
      const remoteBl = Array.isArray(remote.blacklist) ? remote.blacklist : [];
      const mergedBl = Array.from(new Set([...localBl, ...remoteBl]));

      // 5. Settings merge
      const mergedSettings = Object.assign({}, remote.settings || {}, local.settings || {});

      return {
        app: 'ouMusic',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        likes: Array.from(likesMap.values()),
        playlists: Array.from(plMap.values()),
        history: mergedHist,
        blacklist: mergedBl,
        settings: mergedSettings
      };
    },

    /**
     * Applies merged dataset into local IndexedDB and LocalStorage.
     */
    async applyDataLocally(data) {
      if (!data) return;

      // 1. Playlists
      if (Array.isArray(data.playlists) && typeof window.getStore === 'function') {
        try {
          const plStore = window.getStore('playlists', 'readwrite');
          if (plStore) {
            for (const pl of data.playlists) {
              if (pl && pl.id) plStore.put(pl);
            }
          }
        } catch (e) {}
      }

      // 2. Likes
      if (Array.isArray(data.likes) && typeof window.getStore === 'function') {
        try {
          const likesStore = window.getStore('likes', 'readwrite');
          if (likesStore) {
            for (const l of data.likes) {
              if (typeof l === 'string') {
                likesStore.put({ id: l, likedAt: new Date().toISOString() });
              } else if (l && l.id) {
                likesStore.put(l);
              }
            }
          }
        } catch (e) {}
      }

      // 3. Blacklist
      if (Array.isArray(data.blacklist) && typeof window.saveSetting === 'function') {
        try {
          await window.saveSetting('blacklist_track_ids', data.blacklist);
        } catch (e) {}
      }

      // 4. Settings
      if (data.settings && typeof data.settings === 'object') {
        const s = data.settings;
        if (s.theme && !localStorage.getItem('oumusic_theme')) {
          localStorage.setItem('oumusic_theme', s.theme);
          document.documentElement.setAttribute('data-theme', s.theme);
        }
        if (s.amoled && !localStorage.getItem('oumusic_amoled')) {
          localStorage.setItem('oumusic_amoled', s.amoled);
          document.documentElement.setAttribute('data-amoled', s.amoled);
        }
        if (s.userName && !localStorage.getItem('oumusic_user_name')) {
          localStorage.setItem('oumusic_user_name', s.userName);
          const nameEl = document.getElementById('profile-name-display');
          if (nameEl) nameEl.textContent = s.userName;
        }
      }

      // Trigger UI updates in main app if available
      try {
        if (typeof window.renderAllPlaylists === 'function') window.renderAllPlaylists();
        if (typeof window.renderLibraryLikes === 'function') window.renderLibraryLikes();
        if (typeof window.updateProfileStats === 'function') window.updateProfileStats();
      } catch (e) {}
    },

    /**
     * Debounced background cloud sync trigger (5-8 seconds debounce).
     * Called whenever a playlist, like, setting, or blacklist item is altered.
     */
    scheduleSync() {
      if (!this.isLoggedIn()) return;

      if (syncDebounceTimer) {
        clearTimeout(syncDebounceTimer);
        syncDebounceTimer = null;
      }

      this.setStatusText('Изменения сохранены локально (ожидание отправки...)');

      syncDebounceTimer = setTimeout(() => {
        syncDebounceTimer = null;
        this.performSync(false);
      }, DEBOUNCE_DELAY_MS);
    },

    /**
     * Performs direct synchronization with GitHub repository.
     */
    async performSync(isManual = false) {
      if (!this.isLoggedIn()) return;
      if (isSyncInProgress) {
        hasPendingSync = true;
        return;
      }

      isSyncInProgress = true;
      this.setStatusText('Синхронизация с GitHub...');

      const token = this.getToken();
      const user = this.getUser();

      try {
        const fileUrl = `https://api.github.com/repos/${user.login}/${REPO_NAME}/contents/${DATA_FILE_PATH}`;

        // 1. Fetch remote content info to avoid SHA conflicts
        const checkRes = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        let currentSha = this.getFileSha();
        let remoteData = null;

        if (checkRes.ok) {
          const fileInfo = await checkRes.json();
          currentSha = fileInfo.sha || currentSha;
          try {
            const raw = base64ToUtf8(fileInfo.content || '');
            remoteData = JSON.parse(raw);
          } catch (e) {}
        }

        // 2. Collect local data
        const localData = await this.collectLocalData();

        // 3. Smart merge with remote if remote had changes
        const finalData = remoteData ? await this.smartMerge(localData, remoteData) : localData;
        if (remoteData) {
          await this.applyDataLocally(finalData);
        }

        // 4. Push updated data
        const b64 = utf8ToBase64(JSON.stringify(finalData, null, 2));
        const bodyPayload = {
          message: 'Update ouMusic cloud database [skip ci]',
          content: b64
        };
        if (currentSha) {
          bodyPayload.sha = currentSha;
        }

        const putRes = await fetch(fileUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyPayload)
        });

        if (!putRes.ok) {
          const errBody = await putRes.json().catch(() => ({}));
          throw new Error(errBody.message || `HTTP ${putRes.status}`);
        }

        const putData = await putRes.json();
        if (putData.content && putData.content.sha) {
          this.setFileSha(putData.content.sha);
        }

        const nowIso = new Date().toISOString();
        this.setLastSyncTime(nowIso);

        this.setStatusText(`Синхронизировано: ${this.formatTimeAgo(nowIso)}`);

        if (isManual && typeof window.showToast === 'function') {
          window.showToast('Облачная синхронизация завершена успешно');
        }
      } catch (err) {
        console.error('[CloudSync] Sync failed:', err);
        this.setStatusText('Ошибка синхронизации (повтор при подключении)');
        if (isManual && typeof window.showToast === 'function') {
          window.showToast('Ошибка синхронизации: ' + err.message);
        }
      } finally {
        isSyncInProgress = false;
        if (hasPendingSync) {
          hasPendingSync = false;
          this.scheduleSync();
        }
      }
    },

    /**
     * Log out from GitHub cloud account.
     */
    logout() {
      this.setToken('');
      this.setUser(null);
      this.setFileSha('');
      this.setLastSyncTime('');
      this.updateUI();

      if (typeof window.showToast === 'function') {
        window.showToast('Вы вышли из аккаунта GitHub');
      }
    },

    /**
     * Formats ISO timestamp to human friendly Russian string.
     */
    formatTimeAgo(isoStr) {
      if (!isoStr) return 'никогда';
      try {
        const d = new Date(isoStr);
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 45) return 'только что';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин. назад`;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return 'недавно';
      }
    },

    setStatusText(text) {
      const els = document.querySelectorAll('.gh-sync-status-text, #gh-sync-time');
      els.forEach((el) => {
        el.textContent = text;
      });
      const badges = document.querySelectorAll('#gh-sync-badge-status');
      badges.forEach((b) => {
        if (this.isLoggedIn()) {
          b.textContent = 'Подключено';
          b.style.background = 'rgba(168, 85, 247, 0.2)';
          b.style.color = 'var(--md-sys-color-primary)';
        } else {
          b.textContent = 'Не подключено';
          b.style.background = 'rgba(255, 255, 255, 0.08)';
          b.style.color = 'var(--md-sys-color-outline)';
        }
      });
    },

    /**
     * Synchronizes UI components in Settings and Profile.
     */
    updateUI() {
      const loggedIn = this.isLoggedIn();
      const user = this.getUser();

      // Guest / User view toggles
      document.querySelectorAll('.gh-auth-guest-view').forEach((el) => {
        el.style.display = loggedIn ? 'none' : 'flex';
      });
      document.querySelectorAll('.gh-auth-user-view').forEach((el) => {
        el.style.display = loggedIn ? 'flex' : 'none';
      });

      if (loggedIn && user) {
        document.querySelectorAll('.gh-user-avatar-img').forEach((img) => {
          if (user.avatar_url) img.src = user.avatar_url;
        });
        document.querySelectorAll('.gh-user-login-text').forEach((txt) => {
          txt.textContent = `@${user.login}`;
        });
        const lastSync = this.getLastSyncTime();
        this.setStatusText(`Синхронизировано: ${this.formatTimeAgo(lastSync)}`);
      } else {
        this.setStatusText('Не подключено');
      }
    },

    /**
     * Renders pixel-crisp QR code on HTML Canvas.
     */
    renderQRCode(canvas, text) {
      if (!canvas || typeof window.qrcode !== 'function') return false;

      try {
        const qr = window.qrcode(0, 'M');
        qr.addData(text);
        qr.make();

        const count = qr.getModuleCount();
        const size = Math.min(280, canvas.parentElement ? canvas.parentElement.clientWidth - 32 : 280) || 260;
        const cellSize = Math.floor(size / count);
        const actualSize = cellSize * count;
        const margin = Math.floor((size - actualSize) / 2);

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#000000';
        for (let row = 0; row < count; row++) {
          for (let col = 0; col < count; col++) {
            if (qr.isDark(row, col)) {
              ctx.fillRect(margin + col * cellSize, margin + row * cellSize, cellSize, cellSize);
            }
          }
        }
        return true;
      } catch (err) {
        console.error('[CloudSync] Failed to render QR code:', err);
        return false;
      }
    },

    /**
     * Decodes QR code from Canvas image data using BarcodeDetector or fallback jsQR.
     */
    async decodeCanvas(canvas) {
      if (!canvas) return null;

      // 1. Try native hardware-accelerated BarcodeDetector
      if (typeof window.BarcodeDetector !== 'undefined') {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(canvas);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            return barcodes[0].rawValue.trim();
          }
        } catch (e) {}
      }

      // 2. Pure JS fallback: jsQR
      if (typeof window.jsQR === 'function') {
        try {
          const ctx = canvas.getContext('2d');
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const res = window.jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'dontInvert'
          });
          if (res && res.data) {
            return res.data.trim();
          }
        } catch (e) {}
      }

      return null;
    },

    /**
     * Parses token from QR payload.
     * Supports raw ghp_ token or JSON { app: 'ouMusic', token: '...' }.
     */
    parseTokenFromQR(raw) {
      if (!raw) return null;
      const str = String(raw).trim();
      if (str.startsWith('ghp_') || str.startsWith('github_pat_')) {
        return str;
      }
      try {
        const obj = JSON.parse(str);
        if (obj && obj.token) {
          return String(obj.token).trim();
        }
      } catch (e) {}
      return null;
    }
  };

  // Auto-sync when returning online
  window.addEventListener('online', () => {
    if (OUMusicCloudSync.isLoggedIn()) {
      OUMusicCloudSync.scheduleSync();
    }
  });

  window.OUMusicCloudSync = OUMusicCloudSync;
})(window);
