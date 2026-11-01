/**
 * ouMusic - Complete Standalone Client Engine & Application
 * Zero external dependencies (except JSZip). Runs seamlessly on file://, http:// and https://.
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. DICTIONARY & I18N
     ========================================================================== */
  const DICTIONARY = {
    ru: {
      nav_home: 'Главная',
      nav_wave: 'Моя Волна',
      nav_library: 'Библиотека',
      nav_studio: 'Моя Студия',
      nav_profile: 'Мой профиль',
      nav_settings: 'Настройки',
      search_placeholder: 'Поиск треков, артистов...',
      wave_title: 'Моя Волна',
      wave_subtitle: 'Бесконечный поток под ваше настроение',
      wave_mood_label: 'Настроение и занятие:',
      mood_all: 'Все',
      mood_work: 'Для работы',
      mood_rest: 'Отдых',
      mood_sleep: 'Засыпаю',
      mood_workout: 'Тренировка',
      mood_road: 'В дорогу',
      mood_energy: 'Бодрость',
      mood_melancholy: 'Меланхолия',
      wave_character_label: 'Характер:',
      char_any: 'Любой',
      char_familiar: 'Знакомое',
      char_unfamiliar: 'Незнакомое',
      char_forgotten: 'Забытое',
      char_popular: 'Популярное',
      wave_genre_label: 'Фильтр по жанру:',
      wave_sphere_subtitle: 'Музыкальная сфера адаптируется под ритм музыки',
      feed_title: 'Лента треков',
      manual_tracks_title: 'Добавлено вручную',
      manual_tracks_subtitle: 'Треки, загруженные вами локально. Хранятся вечно в IndexedDB и доступны 100% оффлайн.',
      btn_upload_oump3: 'Загрузить свой .oump3',
      tab_playlists: 'Плейлисты',
      tab_likes: 'Понравившиеся',
      tab_downloads: 'Скачанные',
      btn_create_playlist: 'Создать плейлист',
      btn_import_oulist: 'Импорт .oulist',
      btn_tunemymusic: 'TuneMyMusic',
      stat_month: 'За этот месяц',
      stat_total: 'За всё время',
      btn_year_recap: 'Ваши итоги года',
      achievements_title: 'Достижения',
      backup_title: 'Резервная копия',
      btn_export_backup: 'Экспорт профиля (JSON)',
      btn_import_backup: 'Импорт профиля',
      history_title: 'История прослушиваний',
      settings_appearance: 'Внешний вид',
      settings_audio: 'Аудиодвижок M-Core'
    }
  };

  function t(key, params = {}) {
    let text = DICTIONARY.ru[key] || key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
  }

  /* ==========================================================================
     2. EXTENDED GENRES LIST
     ========================================================================== */
  const EXTENDED_GENRES = [
    'Pop', 'Indie Pop', 'Hyperpop', 'Synthpop', 'K-Pop', 'J-Pop', 'Eurodance',
    'Rock', 'Alternative Rock', 'Post-Punk', 'Punk Rock', 'Indie Rock', 'Garage Rock', 'Grunge', 'Shoegaze',
    'Metal', 'Heavy Metal', 'Nu-Metal', 'Metalcore', 'Deathcore', 'Black Metal', 'Symphonic Metal',
    'Hip-Hop', 'Trap', 'Drill', 'Boom Bap', 'Old School Rap', 'Cloud Rap', 'Emo Rap', 'Jazz Rap', 'Memphis Rap',
    'R&B', 'Contemporary R&B', 'Soul', 'Neo-Soul', 'Funk', 'Disco',
    'Electronic', 'House', 'Deep House', 'Tech House', 'Progressive House', 'Bass House',
    'Techno', 'Hard Techno', 'Acid Techno', 'Trance', 'Psytrance', 'Dubstep',
    'Drum & Bass', 'Liquid DnB', 'Neurofunk', 'Jungle', 'Breakbeat', 'UK Garage',
    'Hardstyle', 'Hardcore', 'Phonk', 'Drift Phonk', 'Wave Phonk', 'Chill Phonk',
    'Synthwave', 'Retrowave', 'Darksynth', 'Cyberpunk', 'Vaporwave', 'Witch House',
    'Lo-Fi', 'Chillhop', 'Ambient', 'Dark Ambient', 'Downtempo', 'IDM',
    'Classical', 'Neoclassical', 'Soundtrack', 'Instrumental', 'Jazz', 'Blues',
    'Folk', 'Country', 'Reggae', 'Dancehall', 'Latin', 'Reggaeton', 'Acoustic'
  ];

  /* ==========================================================================
     3. INDEXEDDB STORAGE & PERSISTENCE
     ========================================================================== */
  const DB_NAME = 'oumusic_db';
  const DB_VERSION = 1;
  let dbInstance = null;

  async function initStorage() {
    if (navigator.storage && navigator.storage.persist) {
      try {
        await navigator.storage.persist();
      } catch (e) {}
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('tracks_metadata')) db.createObjectStore('tracks_metadata', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('offline_tracks')) db.createObjectStore('offline_tracks', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('likes')) db.createObjectStore('likes', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('history')) {
            const hist = db.createObjectStore('history', { keyPath: 'histId', autoIncrement: true });
            hist.createIndex('playedAt', 'playedAt', { unique: false });
          }
          if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
          if (!db.objectStoreNames.contains('recap_snapshots')) db.createObjectStore('recap_snapshots', { keyPath: 'year' });
        };
        request.onsuccess = (event) => {
          dbInstance = event.target.result;
          resolve(dbInstance);
        };
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  function getStore(storeName, mode = 'readonly') {
    if (!dbInstance) return null;
    try {
      const tx = dbInstance.transaction(storeName, mode);
      return tx.objectStore(storeName);
    } catch (e) {
      return null;
    }
  }

  async function saveTrackMetadata(track) {
    return new Promise((resolve) => {
      const store = getStore('tracks_metadata', 'readwrite');
      if (!store) return resolve(false);
      const req = store.put(track);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  async function getAllTracksMetadata() {
    return new Promise((resolve) => {
      const store = getStore('tracks_metadata', 'readonly');
      if (!store) return resolve([]);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async function saveOfflineTrack(id, audioBlob, coverBlob = null, lrcText = '') {
    return new Promise((resolve) => {
      const store = getStore('offline_tracks', 'readwrite');
      if (!store) return resolve(false);
      const req = store.put({
        id,
        audioBlob,
        coverBlob,
        lrcText: lrcText || '',
        lyricsText: lrcText || '',
        cachedAt: new Date().toISOString()
      });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  /* Full Track Deletion Engine */
  async function deleteTrack(id) {
    if (!id) return;
    try {
      // 1. Delete from tracks_metadata
      const metaStore = getStore('tracks_metadata', 'readwrite');
      if (metaStore) metaStore.delete(id);

      // 2. Delete from offline_tracks
      const offStore = getStore('offline_tracks', 'readwrite');
      if (offStore) offStore.delete(id);

      // 3. Delete from likes
      const likesStore = getStore('likes', 'readwrite');
      if (likesStore) likesStore.delete(id);

      // 4. Remove from playlists
      const plStore = getStore('playlists', 'readwrite');
      if (plStore) {
        const allPl = await getAllPlaylists();
        allPl.forEach((pl) => {
          if (Array.isArray(pl.trackIds) && pl.trackIds.includes(id)) {
            pl.trackIds = pl.trackIds.filter((tId) => tId !== id);
            plStore.put(pl);
          }
        });
      }

      // 5. Instantly remove matching DOM rows from the page
      document.querySelectorAll(`.track-row[data-track-id="${id}"]`).forEach((el) => el.remove());

      // 6. Update in-memory lists
      catalogTracks = catalogTracks.filter((t) => t.id !== id);
      playbackQueue = playbackQueue.filter((t) => t.id !== id);

      // 7. If currently playing this track, advance or stop
      if (currentTrack && currentTrack.id === id) {
        if (playbackQueue.length > 0) {
          queueIndex = Math.min(queueIndex, playbackQueue.length - 1);
          playTrack(playbackQueue[queueIndex]);
        } else {
          engine.softPause();
          const mini = document.getElementById('mini-player');
          if (mini) mini.style.display = 'none';
          currentTrack = null;
        }
      }

      // 8. Refresh UI views
      renderCatalogFeed(catalogTracks);
      await renderManualTracksFeed();
      renderPlaylistsGrid();
      if (window.renderLibraryTabs) window.renderLibraryTabs();

      alert('Трек успешно удален из приложения!');
    } catch (e) {
      console.error('Failed to delete track:', e);
      alert('Ошибка при удалении трека: ' + e.message);
    }
  }
  window.deleteTrack = deleteTrack;

  async function getOfflineTrack(id) {
    return new Promise((resolve) => {
      const store = getStore('offline_tracks', 'readonly');
      if (!store) return resolve(null);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async function isLiked(id) {
    return new Promise((resolve) => {
      const store = getStore('likes', 'readonly');
      if (!store) return resolve(false);
      const req = store.get(id);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  }

  async function toggleLike(id) {
    const cur = await isLiked(id);
    return new Promise((resolve) => {
      const store = getStore('likes', 'readwrite');
      if (!store) return resolve(!cur);
      const req = cur ? store.delete(id) : store.put({ id, likedAt: new Date().toISOString() });
      req.onsuccess = () => resolve(!cur);
      req.onerror = () => resolve(!cur);
    });
  }

  async function getAllLikes() {
    return new Promise((resolve) => {
      const store = getStore('likes', 'readonly');
      if (!store) return resolve([]);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async function getSetting(key, defVal = null) {
    return new Promise((resolve) => {
      const store = getStore('settings', 'readonly');
      if (!store) {
        try {
          const v = localStorage.getItem(`ou_${key}`);
          return resolve(v !== null ? JSON.parse(v) : defVal);
        } catch (e) {
          return resolve(defVal);
        }
      }
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.val : defVal);
      req.onerror = () => resolve(defVal);
    });
  }

  async function saveSetting(key, val) {
    try {
      localStorage.setItem(`ou_${key}`, JSON.stringify(val));
    } catch (e) {}
    return new Promise((resolve) => {
      const store = getStore('settings', 'readwrite');
      if (!store) return resolve(true);
      const req = store.put({ key, val });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  async function getBlacklist() {
    return (await getSetting('blacklist_track_ids', [])) || [];
  }

  async function isDisliked(id) {
    const list = await getBlacklist();
    return list.includes(id);
  }

  async function toggleDislike(id) {
    const list = await getBlacklist();
    const idx = list.indexOf(id);
    if (idx >= 0) {
      list.splice(idx, 1);
      await saveSetting('blacklist_track_ids', list);
      return false;
    } else {
      list.push(id);
      await saveSetting('blacklist_track_ids', list);
      return true;
    }
  }

  async function addHistory(trackId, durationPlayed = 0) {
    return new Promise((resolve) => {
      const store = getStore('history', 'readwrite');
      if (!store) return resolve(false);
      const req = store.add({
        trackId,
        durationPlayed: Math.round(durationPlayed),
        playedAt: new Date().toISOString()
      });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  async function getHistory(limit = 100) {
    return new Promise((resolve) => {
      const store = getStore('history', 'readonly');
      if (!store) return resolve([]);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        records.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
        resolve(records.slice(0, limit));
      };
      req.onerror = () => resolve([]);
    });
  }

  async function getStats() {
    const history = await getHistory(5000);
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    let monthSeconds = 0;
    let allSeconds = 0;
    history.forEach((h) => {
      const d = new Date(h.playedAt);
      const dur = h.durationPlayed || 0;
      allSeconds += dur;
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        monthSeconds += dur;
      }
    });

    return {
      monthHours: (monthSeconds / 3600).toFixed(1),
      allTimeHours: (allSeconds / 3600).toFixed(1)
    };
  }

  /* ==========================================================================
     4. M-CORE AUDIO ENGINE
     ========================================================================== */
  class MCoreEngine {
    constructor() {
      this.audioCtx = null;
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preservesPitch = false;
      this.audioElement.mozPreservesPitch = false;
      this.audioElement.webkitPreservesPitch = false;

      this.activePlaybackRate = 1.0;
      this.activeReverbPercent = 0;
      this.active8DPercent = 0;
      this.isLosslessMode = false;

      this.sourceNode = null;
      this.vocalRemoverActive = false;
      this.vocalDryGain = null;
      this.vocalWetGain = null;
      this.eqFilters = [];
      this.reverbNode = null;
      this.reverbDryGain = null;
      this.reverbWetGain = null;
      this.pannerNode = null;
      this.pannerLFOId = null;
      this.compressorNode = null;
      this.normalizerGainNode = null;
      this.normalizerLevel = 85;
      this.softGainNode = null;
      this.masterGainNode = null;
      this.analyserNode = null;

      this.currentTrack = null;
      this.isPlaying = false;
      this.sleepTimerId = null;
      this.sleepTimerEndTrack = false;

      this.onTrackEnd = null;
      this.onTimeUpdate = null;
      this.onPlayStateChange = null;

      this.initListeners();
    }

    ensureContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioCtx();
        this.buildGraph();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    buildGraph() {
      const ctx = this.audioCtx;
      this.sourceNode = ctx.createMediaElementSource(this.audioElement);

      // Professional Vocal Cancellation Matrix (L - R for stereo instruments + Lowpass bass)
      this.vocalDryGain = ctx.createGain();
      this.vocalWetGain = ctx.createGain();
      this.vocalDryGain.gain.value = 1.0;
      this.vocalWetGain.gain.value = 0.0;

      const splitter = ctx.createChannelSplitter(2);
      this.sourceNode.connect(splitter);

      // Precise Center Vocal Cancellation Matrix with Dynamic Makeup Gain & Bass/Air Preservation
      // Difference matrix: L - R cancels centered mono lead vocals, retaining full stereo spread
      const gainL_to_L = ctx.createGain(); gainL_to_L.gain.value = 1.15;
      const gainR_to_L = ctx.createGain(); gainR_to_L.gain.value = -1.15; // -R
      const gainR_to_R = ctx.createGain(); gainR_to_R.gain.value = 1.15;
      const gainL_to_R = ctx.createGain(); gainL_to_R.gain.value = -1.15; // -L

      splitter.connect(gainL_to_L, 0);
      splitter.connect(gainR_to_L, 1);
      splitter.connect(gainR_to_R, 1);
      splitter.connect(gainL_to_R, 0);

      // Low-pass filter to retain punchy kick drum & bass
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 160;
      const bassGain = ctx.createGain();
      bassGain.gain.value = 0.72;

      // High-shelf filter to retain crisp cymbals & acoustic air
      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'highpass';
      airFilter.frequency.value = 8800;
      const airGain = ctx.createGain();
      airGain.gain.value = 0.24;

      this.vocalBassFilter = bassFilter;
      this.vocalBassGain = bassGain;
      this.vocalAirFilter = airFilter;
      this.vocalAirGain = airGain;
      this.vocalCenterGainL = gainR_to_L;
      this.vocalCenterGainR = gainL_to_R;

      this.sourceNode.connect(bassFilter);
      bassFilter.connect(bassGain);

      this.sourceNode.connect(airFilter);
      airFilter.connect(airGain);

      const merger = ctx.createChannelMerger(2);
      // Left channel out: 1.15*(L - R) + Bass + Air
      gainL_to_L.connect(merger, 0, 0);
      gainR_to_L.connect(merger, 0, 0);
      bassGain.connect(merger, 0, 0);
      airGain.connect(merger, 0, 0);

      // Right channel out: 1.15*(R - L) + Bass + Air
      gainR_to_R.connect(merger, 0, 1);
      gainL_to_R.connect(merger, 0, 1);
      bassGain.connect(merger, 0, 1);
      airGain.connect(merger, 0, 1);

      // Vocal notch filter to eliminate remaining vocal formant resonance
      const vocalNotch = ctx.createBiquadFilter();
      vocalNotch.type = 'notch';
      vocalNotch.frequency.value = 1600;
      vocalNotch.Q.value = 1.4;
      this.vocalNotchFilter = vocalNotch;

      // Makeup amplifier so volume never drops when turning on Minusovka
      const makeupGain = ctx.createGain();
      makeupGain.gain.value = 1.28;
      this.vocalMakeupGain = makeupGain;

      merger.connect(vocalNotch);
      vocalNotch.connect(makeupGain);
      makeupGain.connect(this.vocalWetGain);
      this.sourceNode.connect(this.vocalDryGain);

      const postVocal = ctx.createGain();
      this.vocalDryGain.connect(postVocal);
      this.vocalWetGain.connect(postVocal);

      // 5-band EQ
      const freqs = [60, 230, 910, 3600, 14000];
      const types = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];
      this.eqFilters = freqs.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = types[i];
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      let lastNode = postVocal;
      this.eqFilters.forEach((f) => {
        lastNode.connect(f);
        lastNode = f;
      });

      // Reverb Convolver
      this.reverbNode = ctx.createConvolver();
      this.reverbNode.buffer = this.makeImpulse(2.0, 2.0);
      this.reverbDryGain = ctx.createGain();
      this.reverbWetGain = ctx.createGain();
      this.reverbDryGain.gain.value = 1.0;
      this.reverbWetGain.gain.value = 0.0;

      lastNode.connect(this.reverbDryGain);
      lastNode.connect(this.reverbNode);
      this.reverbNode.connect(this.reverbWetGain);

      const postReverb = ctx.createGain();
      this.reverbDryGain.connect(postReverb);
      this.reverbWetGain.connect(postReverb);

      // 8D Spatial Audio: Panner + Head-Shadow Lowpass Filter for authentic 360 binaural rotation
      this.spatialFilter = ctx.createBiquadFilter();
      this.spatialFilter.type = 'lowpass';
      this.spatialFilter.frequency.value = 20000;
      this.spatialFilter.Q.value = 0.7;

      if (ctx.createStereoPanner) {
        this.pannerNode = ctx.createStereoPanner();
        postReverb.connect(this.pannerNode);
        this.pannerNode.connect(this.spatialFilter);
      } else {
        this.pannerNode = null;
        postReverb.connect(this.spatialFilter);
      }

      // Loudness Normalizer (DynamicsCompressor + Target Loudness Gain)
      this.compressorNode = ctx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -24;
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 12;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      this.normalizerGainNode = ctx.createGain();
      this.normalizerGainNode.gain.setValueAtTime(0.85, ctx.currentTime);

      this.spatialFilter.connect(this.compressorNode);
      this.compressorNode.connect(this.normalizerGainNode);

      // Soft Play / Pause Gain
      this.softGainNode = ctx.createGain();
      this.softGainNode.gain.setValueAtTime(1.0, ctx.currentTime);
      this.normalizerGainNode.connect(this.softGainNode);

      // Master Gain & Analyser
      this.masterGainNode = ctx.createGain();
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 256;

      this.softGainNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.analyserNode);
      this.analyserNode.connect(ctx.destination);
    }

    makeImpulse(duration, decay) {
      const ctx = this.audioCtx;
      const length = ctx.sampleRate * duration;
      const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const factor = Math.pow((length - i) / length, decay);
        left[i] = (Math.random() * 2 - 1) * factor;
        right[i] = (Math.random() * 2 - 1) * factor;
      }
      return impulse;
    }

    initListeners() {
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.onTimeUpdate) {
          this.onTimeUpdate(this.audioElement.currentTime, this.audioElement.duration || 0);
        }
      });
      this.audioElement.addEventListener('ended', () => {
        if (this.sleepTimerEndTrack) {
          this.sleepTimerEndTrack = false;
          this.softPause();
          return;
        }
        if (this.onTrackEnd) this.onTrackEnd();
      });
      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
        this.applyActiveFX();
        if (this.onPlayStateChange) this.onPlayStateChange(true);
      });
      this.audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
        if (this.onPlayStateChange) this.onPlayStateChange(false);
      });
    }

    async loadTrack(track, audioSource, autoPlay = true) {
      this.ensureContext();
      this.currentTrack = track;

      let src = '';
      if (typeof audioSource === 'string') {
        src = audioSource;
      } else if (audioSource instanceof Blob) {
        src = URL.createObjectURL(audioSource);
      }

      this.audioElement.src = src;
      this.audioElement.load();
      this.applyActiveFX();

      if (autoPlay) {
        await this.softPlay();
      }
    }

    async softPlay() {
      this.ensureContext();
      try {
        if (this.softGainNode && this.audioCtx) {
          const ctx = this.audioCtx;
          this.softGainNode.gain.cancelScheduledValues(ctx.currentTime);
          this.softGainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
          await this.audioElement.play();
          this.softGainNode.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.3);
        } else {
          await this.audioElement.play();
        }
        this.isPlaying = true;
      } catch (e) {
        console.warn('[Engine] Play failed or needs gesture:', e);
      }
    }

    async softPause() {
      if (this.softGainNode && this.audioCtx) {
        const ctx = this.audioCtx;
        this.softGainNode.gain.cancelScheduledValues(ctx.currentTime);
        this.softGainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        setTimeout(() => {
          this.audioElement.pause();
          this.isPlaying = false;
        }, 300);
      } else {
        this.audioElement.pause();
        this.isPlaying = false;
      }
    }

    togglePlay() {
      if (this.audioElement.paused) {
        this.softPlay();
      } else {
        this.softPause();
      }
    }

    seek(sec) {
      if (this.audioElement.duration) {
        this.audioElement.currentTime = Math.max(0, Math.min(sec, this.audioElement.duration));
      }
    }

    handleBackButton(onPrev) {
      if (this.audioElement.currentTime > 10) {
        this.seek(0);
      } else if (typeof onPrev === 'function') {
        onPrev();
      }
    }

    setPlaybackRate(val) {
      this.activePlaybackRate = Math.max(0.7, Math.min(val, 1.35));
      if (this.audioElement) {
        this.audioElement.playbackRate = this.activePlaybackRate;
        this.audioElement.defaultPlaybackRate = this.activePlaybackRate;
        this.audioElement.preservesPitch = false;
        this.audioElement.mozPreservesPitch = false;
        this.audioElement.webkitPreservesPitch = false;
      }
    }

    setReverb(percent) {
      this.activeReverbPercent = Math.max(0, Math.min(100, percent));
      if (!this.reverbWetGain || !this.reverbDryGain || !this.audioCtx) return;
      const amt = this.activeReverbPercent / 100;
      const t = this.audioCtx.currentTime;
      this.reverbWetGain.gain.setValueAtTime(amt * 0.8, t);
      this.reverbDryGain.gain.setValueAtTime(1.0 - amt * 0.3, t);
    }

    set8DAudio(percent) {
      this.active8DPercent = Math.max(0, Math.min(100, percent));
      if (this.pannerLFOId) {
        clearInterval(this.pannerLFOId);
        this.pannerLFOId = null;
      }
      if (this.active8DPercent <= 0) {
        if (this.pannerNode && this.pannerNode.pan && this.audioCtx) {
          this.pannerNode.pan.setValueAtTime(0, this.audioCtx.currentTime);
        }
        if (this.spatialFilter && this.audioCtx) {
          this.spatialFilter.frequency.setValueAtTime(20000, this.audioCtx.currentTime);
        }
        return;
      }
      let angle = 0;
      const amt = Math.min(1.0, Math.max(0.1, this.active8DPercent / 100));
      // True 360-degree binaural spatial orbit: Left/Right panning + Pinna Head-shadow modulation
      this.pannerLFOId = setInterval(() => {
        if (!this.isPlaying || !this.audioCtx) return;
        angle += 0.07; // Circular rotation speed
        const panX = Math.sin(angle) * amt; // -1 to +1
        const depthY = Math.cos(angle);     // +1 front, -1 back

        const t = this.audioCtx.currentTime;
        if (this.pannerNode && this.pannerNode.pan) {
          this.pannerNode.pan.setTargetAtTime(panX, t, 0.04);
        }

        // When sound orbits behind listener (depthY < 0), sweep lowpass filter down towards 3500Hz
        if (this.spatialFilter) {
          const targetFreq = depthY >= 0 ? 20000 : 20000 - (Math.abs(depthY) * 16500 * amt);
          this.spatialFilter.frequency.setTargetAtTime(targetFreq, t, 0.06);
        }
      }, 40);
    }

    applyActiveFX() {
      if (this.audioElement) {
        this.audioElement.playbackRate = this.activePlaybackRate;
        this.audioElement.defaultPlaybackRate = this.activePlaybackRate;
        this.audioElement.preservesPitch = false;
        this.audioElement.mozPreservesPitch = false;
        this.audioElement.webkitPreservesPitch = false;
      }
      if (this.activeReverbPercent > 0) {
        this.setReverb(this.activeReverbPercent);
      }
      if (this.active8DPercent > 0) {
        this.set8DAudio(this.active8DPercent);
      }
      if (this.isLosslessMode) {
        this.setLosslessMode(true);
      }
    }

    setLosslessMode(active) {
      this.isLosslessMode = !!active;
      if (!this.audioCtx) return;
      if (this.isLosslessMode) {
        // Studio Hi-Fi Harman/Hi-Res mastering enhancement:
        // 60Hz +2.0dB (deep clean sub-bass), 230Hz -0.5dB (clarity), 910Hz +0.5dB (vocal clarity), 3.6kHz +2.0dB (crisp transients), 14kHz +2.5dB (sparkle)
        const losslessGains = [2.0, -0.5, 0.5, 2.0, 2.5];
        losslessGains.forEach((g, i) => this.setEQBand(i, g));
        if (this.compressorNode) {
          const t = this.audioCtx.currentTime;
          this.compressorNode.threshold.setValueAtTime(-14, t);
          this.compressorNode.knee.setValueAtTime(24, t);
          this.compressorNode.ratio.setValueAtTime(1.8, t);
          this.compressorNode.attack.setValueAtTime(0.003, t);
          this.compressorNode.release.setValueAtTime(0.25, t);
        }
      } else {
        const savedPreset = (typeof localStorage !== 'undefined') ? (localStorage.getItem('oumusic_eq_preset') || 'flat') : 'flat';
        this.applyEQPreset(savedPreset);
      }
    }

    resetFX() {
      this.activePlaybackRate = 1.0;
      this.activeReverbPercent = 0;
      this.active8DPercent = 0;
      this.setPlaybackRate(1.0);
      this.setReverb(0);
      this.set8DAudio(0);
    }

    setVocalRemover(active, configOrMode) {
      this.vocalRemoverActive = !!active;
      if (!this.vocalDryGain || !this.vocalWetGain || !this.audioCtx) return;
      const ctx = this.audioCtx;
      const t = ctx.currentTime;
      this.vocalDryGain.gain.cancelScheduledValues(t);
      this.vocalWetGain.gain.cancelScheduledValues(t);

      let cfg = {
        bassFreq: 160,
        bassGain: 0.72,
        airFreq: 8800,
        airGain: 0.24,
        depth: 100,
        notchFreq: 1600,
        notchQ: 1.4,
        makeupGain: 1.28
      };

      if (configOrMode && typeof configOrMode === 'object') {
        if (configOrMode.bassFreq !== undefined) cfg.bassFreq = Number(configOrMode.bassFreq);
        if (configOrMode.airFreq !== undefined) cfg.airFreq = Number(configOrMode.airFreq);
        if (configOrMode.depth !== undefined) cfg.depth = Number(configOrMode.depth);
        if (configOrMode.notchFreq !== undefined) cfg.notchFreq = Number(configOrMode.notchFreq);
        if (configOrMode.notchQ !== undefined) cfg.notchQ = Number(configOrMode.notchQ);
        if (configOrMode.makeupGain !== undefined) cfg.makeupGain = Number(configOrMode.makeupGain);
      } else if (typeof configOrMode === 'string') {
        if (configOrMode === 'aggressive') {
          cfg = { bassFreq: 115, bassGain: 0.5, airFreq: 10500, airGain: 0.12, depth: 100, notchFreq: 1800, notchQ: 1.8, makeupGain: 1.4 };
        } else if (configOrMode === 'soft') {
          cfg = { bassFreq: 220, bassGain: 0.9, airFreq: 7500, airGain: 0.45, depth: 75, notchFreq: 1400, notchQ: 1.0, makeupGain: 1.15 };
        }
      }

      if (this.vocalBassFilter) this.vocalBassFilter.frequency.setValueAtTime(cfg.bassFreq, t);
      if (this.vocalBassGain) this.vocalBassGain.gain.setValueAtTime(cfg.bassGain, t);
      if (this.vocalAirFilter) this.vocalAirFilter.frequency.setValueAtTime(cfg.airFreq, t);
      if (this.vocalAirGain) this.vocalAirGain.gain.setValueAtTime(cfg.airGain, t);
      if (this.vocalMakeupGain) this.vocalMakeupGain.gain.setValueAtTime(cfg.makeupGain, t);
      if (this.vocalNotchFilter) {
        this.vocalNotchFilter.frequency.setValueAtTime(cfg.notchFreq, t);
        this.vocalNotchFilter.Q.setValueAtTime(cfg.notchQ, t);
      }
      if (this.vocalCenterGainL && this.vocalCenterGainR) {
        const depthVal = cfg.depth / 100;
        this.vocalCenterGainL.gain.setValueAtTime(-1.15 * depthVal, t);
        this.vocalCenterGainR.gain.setValueAtTime(-1.15 * depthVal, t);
      }

      if (active) {
        this.vocalDryGain.gain.setTargetAtTime(0.0, t, 0.04);
        this.vocalWetGain.gain.setTargetAtTime(1.0, t, 0.04);
      } else {
        this.vocalDryGain.gain.setTargetAtTime(1.0, t, 0.04);
        this.vocalWetGain.gain.setTargetAtTime(0.0, t, 0.04);
      }
    }

    setNormalizer(active, levelPercent = 85) {
      if (!this.compressorNode || !this.normalizerGainNode || !this.audioCtx) return;
      if (!active) {
        this.compressorNode.threshold.setValueAtTime(0, this.audioCtx.currentTime);
        this.normalizerGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      } else {
        const pct = Math.max(30, Math.min(100, Number(levelPercent) || 85));
        this.normalizerLevel = pct;
        // Target threshold: -36 dB (quiet) to -12 dB (loud)
        const targetThreshold = -36 + (pct - 30) * (24 / 70);
        // Makeup gain: 0.35 to 1.05 linear
        const targetGain = 0.35 + (pct - 30) * (0.7 / 70);
        this.compressorNode.threshold.setValueAtTime(targetThreshold, this.audioCtx.currentTime);
        this.normalizerGainNode.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
      }
    }

    setEQBand(bandIdx, gain) {
      if (this.eqFilters[bandIdx]) {
        try {
          if (this.audioCtx) {
            this.eqFilters[bandIdx].gain.setValueAtTime(gain, this.audioCtx.currentTime);
          }
          this.eqFilters[bandIdx].gain.value = gain;
        } catch (e) {}
      }
    }

    applyEQPreset(preset) {
      const map = {
        flat: [0, 0, 0, 0, 0],
        bass: [6, 4, 1, 0, -1],
        vocal: [-2, 1, 4, 3, 1],
        rock: [4, 2, -1, 3, 5],
        electronic: [5, 3, 0, 2, 4]
      };
      const g = map[preset] || map.flat;
      g.forEach((val, i) => this.setEQBand(i, val));
      return g;
    }
  }

  const engine = new MCoreEngine();

  /* ==========================================================================
     5. OUMP3 CONTAINER (Fast Binary Header + Full Packager)
     ========================================================================== */
  function parseOump3HeaderFast(arrayBuffer) {
    try {
      const uint8 = new Uint8Array(arrayBuffer);
      const textChunk = new TextDecoder('utf-8', { fatal: false }).decode(uint8);
      const startIdx = textChunk.indexOf('{"title"');
      if (startIdx === -1) return null;

      let depth = 0;
      let endIdx = -1;
      for (let i = startIdx; i < textChunk.length; i++) {
        if (textChunk[i] === '{') depth++;
        else if (textChunk[i] === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
      if (endIdx === -1) return null;
      return JSON.parse(textChunk.slice(startIdx, endIdx));
    } catch (e) {
      return null;
    }
  }

  async function unpackOump3Full(arrayBufferOrBlob) {
    if (typeof window.JSZip === 'undefined') throw new Error('JSZip не загружен');
    const zip = await window.JSZip.loadAsync(arrayBufferOrBlob);

    let meta = {};
    const hFile = zip.file('header.json') || zip.file('meta.json');
    if (hFile) meta = JSON.parse(await hFile.async('text'));

    let audioBlob = null;
    const aFile = zip.file('audio.mp3') || zip.file('audio.wav') || zip.file(/audio\.(mp3|wav|ogg)$/i)[0];
    if (aFile) {
      const type = aFile.name.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
      audioBlob = new Blob([await aFile.async('blob')], { type });
    }

    let coverBlob = null;
    const cFile = zip.file('cover.jpg') || zip.file('cover.png') || zip.file(/cover\.(jpg|png|webp)$/i)[0];
    if (cFile) {
      const type = cFile.name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      coverBlob = new Blob([await cFile.async('blob')], { type });
    }

    let lyricsText = '';
    const lFile = zip.file('lyrics.lrc');
    if (lFile) lyricsText = await lFile.async('text');

    return { meta, audioBlob, coverBlob, lyricsText };
  }

    async function buildOump3Container(params) {
    if (typeof window.JSZip === 'undefined') throw new Error('JSZip не подключен');
    const zip = new window.JSZip();

    const title = params.title || 'Безымянный трек';
    const artist = params.artist || 'Неизвестный исполнитель';
    const genres = Array.isArray(params.genres) ? params.genres : (params.genres ? [params.genres] : []);
    const duration = params.duration || 0;
    const lyricsText = params.lyricsText || '';
    const audioBlob = params.audioBlob;
    const coverBlob = params.coverBlob || null;
    const thumbBase64 = params.thumbBase64 || null;

    const meta = {
      title: title.trim(),
      artist: artist.trim(),
      genres: genres,
      duration: Math.round(duration),
      version: '2.0',
      hasLyrics: !!lyricsText || !!params.hasLyrics,
      isExplicit: !!(params.isExplicit || params.explicit),
      hasInstrumental: !!params.hasInstrumental,
      instrumentalConfig: params.instrumentalConfig || null,
      thumbBase64
    };

    // header.json STORE uncompressed
    zip.file('header.json', JSON.stringify(meta, null, 2), { compression: 'STORE', date: new Date() });

    if (audioBlob) {
      const name = audioBlob.type.includes('wav') ? 'audio.wav' : 'audio.mp3';
      zip.file(name, audioBlob, { binary: true, date: new Date() });
    }
    if (coverBlob) {
      const name = coverBlob.type.includes('png') ? 'cover.png' : 'cover.jpg';
      zip.file(name, coverBlob, { binary: true, date: new Date() });
    }
    if (lyricsText) {
      zip.file('lyrics.lrc', lyricsText.trim(), { compression: 'STORE', date: new Date() });
    }

    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  }

  /* Universal App URL Resolver for GitHub Pages, Subfolders and file:// */
  function resolveAppUrl(relPath) {
    const cleanRel = relPath.replace(/^\.?\//, '');
    if (window.location.protocol === 'file:') {
      return './' + cleanRel;
    }
    let basePath = window.location.pathname;
    if (basePath.endsWith('.html')) {
      basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
    } else if (!basePath.endsWith('/')) {
      basePath = basePath + '/';
    }
    return basePath + cleanRel;
  }
  window.resolveAppUrl = resolveAppUrl;

  /* ==========================================================================
     6. ARTISTS & VERIFICATION
     ========================================================================== */
  const verifiedArtists = new Map();
  verifiedArtists.set('oulan1', { avatar: 'assets/oumusic.png', banner: 'assets/oumusic.png', verified: true });
  verifiedArtists.set('m-core', { avatar: 'assets/oumusic.png', banner: 'assets/oumusic.png', verified: true });

  async function loadArtistsVerification() {
    try {
      const res = await fetch(resolveAppUrl('artists.txt'), { cache: 'no-cache' });
      if (res.ok) {
        const text = await res.text();
        text.split('\n').forEach((line) => {
          const l = line.trim();
          if (!l || l.startsWith('#')) return;
          const [name, av, ban, ver, wins] = l.split(' - ').map((s) => s.trim());
          if (name) {
            verifiedArtists.set(name.toLowerCase(), {
              avatar: av || 'assets/oumusic.png',
              banner: ban || 'assets/oumusic.png',
              verified: ver === '1',
              monthlyWins: parseInt(wins, 10) || 0
            });
          }
        });
      }
    } catch (e) {
      // Ignored for local file:// protocol
    }
  }

  function isArtistVerified(name) {
    if (!name) return false;
    const a = verifiedArtists.get(name.trim().toLowerCase());
    return a ? a.verified : false;
  }

  /* ==========================================================================
     7. APP STATE & PLAYLIST QUEUE
     ========================================================================== */
  let currentTrack = null;
  let playbackQueue = [];
  let queueIndex = 0;
  let catalogTracks = [];

  /* ==========================================================================
     8. INITIALIZATION & DOM BINDINGS
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('[ouMusic] Initializing standalone client...');

  // Global Click Delegator for Artist Links & Profile Navigation Everywhere
  document.addEventListener('click', (e) => {
    // 1. Artist link clicked anywhere (track rows, player, etc.)
    const artistLink = e.target.closest('a[href^="#artist="], #fs-artist');
    if (artistLink) {
      e.preventDefault();
      e.stopPropagation();
      let name = '';
      if (artistLink.id === 'fs-artist') {
        name = currentTrack?.artist || artistLink.textContent || '';
      } else {
        const href = artistLink.getAttribute('href') || '';
        name = decodeURIComponent(href.slice(8));
      }
      if (name) {
        document.getElementById('fullscreen-player')?.classList.remove('active');
        document.getElementById('lyrics-overlay')?.classList.remove('active');
        renderArtistScreen(name);
        navigateTo('artist');
      }
      return;
    }

    // 2. Profile buttons clicked anywhere (top app bar, fullscreen player utils, etc.)
    const profileBtn = e.target.closest('#top-profile-btn, #fs-profile-btn');
    if (profileBtn) {
      e.preventDefault();
      document.getElementById('fullscreen-player')?.classList.remove('active');
      document.getElementById('lyrics-overlay')?.classList.remove('active');
      navigateTo('profile');
      return;
    }
  });


    await initStorage();
    await loadArtistsVerification();

    // 1. Navigation setup
    initNavigation();
    initSettingsUI();
    initPlayerUI();
    initWaveUI();
    initStudioUI();
    initLyricsUI();
    initProfileUI();
    initAdditionalUI();

    // 2. Load catalog & manual tracks
    await loadInitialTracks();

    // 3. Process URL Hash routing
    handleHash();
    window.addEventListener('hashchange', handleHash);

    applyTranslations();
    console.log('[ouMusic] Client engine ready!');
  });

  /* Semicircular Convex Arc Navigation (Infinite Protruding Left-to-Right Wheel) */
  function initArcNavigation() {
    const container = document.getElementById('arc-wheel-container');
    const sidebar = document.getElementById('arc-sidebar');
    const toggleBtn = document.getElementById('arc-toggle-btn');
    const screensContainer = document.getElementById('screens-container');
    if (!container || !sidebar) return;

    const ARC_NAV_ITEMS = [
      { id: 'home', label: 'Главная', icon: 'icon-home' },
      { id: 'library', label: 'Библиотека', icon: 'icon-library' },
      { id: 'studio', label: 'Студия', icon: 'icon-studio' },
      { id: 'profile', label: 'Профиль', icon: 'icon-user' },
      { id: 'settings', label: 'Настройки', icon: 'icon-settings' }
    ];

    const N = ARC_NAV_ITEMS.length;
    let activeIndex = 0;

    // Render navigation buttons
    container.innerHTML = '';
    const itemElements = ARC_NAV_ITEMS.map((item, idx) => {
      const btn = document.createElement('button');
      btn.className = 'arc-nav-item';
      btn.setAttribute('data-nav', item.id);
      btn.setAttribute('title', item.label);
      const savedAv = (typeof localStorage !== 'undefined') ? (localStorage.getItem('oumusic_user_avatar') || 'assets/oumusic.png') : 'assets/oumusic.png';
      if (item.id === 'profile') {
        btn.innerHTML = `
          <div class="item-icon-box" style="overflow: hidden; padding: 1px;">
            <img class="arc-profile-avatar-img" src="${savedAv}" alt="Профиль" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;">
          </div>
          <span class="item-label">${item.label}</span>
        `;
      } else {
        btn.innerHTML = `
          <div class="item-icon-box">
            <svg class="svg-icon" style="width: 20px; height: 20px; fill: currentColor;"><use href="#${item.icon}"></use></svg>
          </div>
          <span class="item-label">${item.label}</span>
        `;
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        rotateToIndex(idx);
        navigateTo(item.id);
      });

      container.appendChild(btn);
      return btn;
    });

    // Toggle Collapse / Expand
    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = sidebar.classList.toggle('collapsed');
      screensContainer?.classList.toggle('arc-collapsed', isCollapsed);
    });

    // Mouse wheel scrolling over sidebar rotates the wheel infinitely
    let wheelCooldown = false;
    sidebar.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (wheelCooldown) return;
      wheelCooldown = true;
      setTimeout(() => { wheelCooldown = false; }, 160);

      if (e.deltaY > 0) {
        const nextIdx = (activeIndex + 1) % N;
        rotateToIndex(nextIdx);
        navigateTo(ARC_NAV_ITEMS[nextIdx].id);
      } else if (e.deltaY < 0) {
        const prevIdx = (activeIndex - 1 + N) % N;
        rotateToIndex(prevIdx);
        navigateTo(ARC_NAV_ITEMS[prevIdx].id);
      }
    }, { passive: false });

    // Mathematical convex arc layout calculation (bulging left-to-right)
    function updateArcLayout() {
      const Y0 = 250; // Vertical center of 500px dome
      const deltaTheta = 0.46; // radians between adjacent items (~26.4 deg)

      itemElements.forEach((el, idx) => {
        // Shortest distance on modular circular loop: -2, -1, 0, 1, 2
        let diff = ((idx - activeIndex) % N + N) % N;
        if (diff > N / 2) diff -= N;

        const angle = diff * deltaTheta;
        const y = Y0 + 140 * Math.sin(angle);
        const x = 45 - 32 * (1 - Math.cos(angle));

        const isActive = diff === 0;
        const isVisible = Math.abs(diff) <= 2;

        el.classList.toggle('active', isActive);

        if (!isVisible) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y - 22)}px) scale(0.6)`;
        } else {
          const scale = isActive ? 1.08 : (Math.abs(diff) === 1 ? 0.92 : 0.82);
          const opacity = isActive ? 1 : (Math.abs(diff) === 1 ? 0.85 : 0.55);
          el.style.opacity = `${opacity}`;
          el.style.pointerEvents = 'auto';
          el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y - 22)}px) scale(${scale})`;
        }
      });
    }

    function rotateToIndex(targetIdx) {
      if (targetIdx < 0 || targetIdx >= N) return;
      activeIndex = targetIdx;
      updateArcLayout();
    }

    // Expose sync helper so any navigation source updates the wheel
    window.syncArcNav = function(screenId) {
      const idx = ARC_NAV_ITEMS.findIndex((it) => it.id === screenId);
      if (idx !== -1) {
        rotateToIndex(idx);
      }
    };

    updateArcLayout();
  }

  /* Navigation & Tabs */
  function initNavigation() {
    initArcNavigation();

    document.querySelectorAll('[data-nav]').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const screenId = tab.getAttribute('data-nav');
        if (screenId) navigateTo(screenId);
      });
    });

    const logoBtn = document.getElementById('brand-logo-btn');
    if (logoBtn) logoBtn.addEventListener('click', () => navigateTo('home'));

    const topStudioBtn = document.getElementById('top-studio-btn');
    if (topStudioBtn) topStudioBtn.addEventListener('click', () => navigateTo('studio'));

    const topSettingsBtn = document.getElementById('top-settings-btn');
    if (topSettingsBtn) topSettingsBtn.addEventListener('click', () => navigateTo('settings'));

    const backBtn = document.getElementById('top-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => window.history.back());

    // Library sub-tabs
    document.querySelectorAll('#library-tabs .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#library-tabs .chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const tabKey = chip.getAttribute('data-tab');

        const p = document.getElementById('lib-tab-playlists');
        const l = document.getElementById('lib-tab-likes');
        const d = document.getElementById('lib-tab-downloads');
        if (p) p.style.display = tabKey === 'playlists' ? 'block' : 'none';
        if (l) l.style.display = tabKey === 'likes' ? 'block' : 'none';
        if (d) d.style.display = tabKey === 'downloads' ? 'block' : 'none';

        if (tabKey === 'likes') renderLikesTab();
        if (tabKey === 'downloads') renderDownloadsTab();
      });
    });

    // Global search input with dynamic caret accent glow
    const searchInput = document.getElementById('global-search-input');
    const caretGlow = document.getElementById('search-caret-glow');
    let typingTimer = null;

    function updateCaretGlow() {
      if (!searchInput || !caretGlow) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const cs = window.getComputedStyle(searchInput);
      ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
      const caretPos = searchInput.selectionStart || 0;
      const textUpToCaret = searchInput.value.substring(0, caretPos);
      const measured = ctx.measureText(textUpToCaret).width;
      // Position glow right behind caret
      caretGlow.style.transform = `translate(${measured}px, -50%)`;
      caretGlow.classList.add('typing');
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        caretGlow.classList.remove('typing');
      }, 750);
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        updateCaretGlow();
        const query = searchInput.value.toLowerCase().trim();
        filterTracksFeed(query);
      });
      searchInput.addEventListener('keydown', (e) => {
        updateCaretGlow();
        if (e.key === 'Escape') {
          searchInput.value = '';
          filterTracksFeed('');
          searchInput.blur();
          caretGlow?.classList.remove('typing');
        }
      });
      searchInput.addEventListener('keyup', updateCaretGlow);
      searchInput.addEventListener('click', updateCaretGlow);
      searchInput.addEventListener('blur', () => {
        caretGlow?.classList.remove('typing');
      });
    }
  }

  function navigateTo(screenId, pushHash = true) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.querySelectorAll('[data-nav]').forEach((t) => {
      t.classList.toggle('active', t.getAttribute('data-nav') === screenId);
    });

    const target = document.getElementById(`screen-${screenId}`);
    if (target) target.classList.add('active');

    const backBtn = document.getElementById('top-back-btn');
    if (backBtn) backBtn.style.display = (screenId === 'artist') ? 'inline-flex' : 'none';

    if (window.syncArcNav) {
      window.syncArcNav(screenId);
    }

    if (pushHash && !window.location.hash.includes('=')) {
      window.location.hash = screenId;
    }
  }
  window.navigateTo = navigateTo;

  function handleHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    if (hash.startsWith('track=')) {
      const id = decodeURIComponent(hash.slice(6));
      const found = catalogTracks.find((t) => t.id === id || t.filename === id);
      if (found) playTrack(found);
    } else if (hash.startsWith('artist=')) {
      const name = decodeURIComponent(hash.slice(7));
      renderArtistScreen(name);
      navigateTo('artist', false);
    } else if (['home', 'library', 'studio', 'profile', 'settings'].includes(hash)) {
      navigateTo(hash, false);
    }
  }

  /* Catalog & Feeds */
  async function loadInitialTracks() {
    let tracks = [];
    try {
      let res = null;
    try {
      res = await fetch(resolveAppUrl(`tracks/catalog.json?_v=${Date.now()}`), { cache: 'no-store' });
    } catch (e) {}
    if (!res || !res.ok) {
      try { res = await fetch(`./tracks/catalog.json?_v=${Date.now()}`, { cache: 'no-store' }); } catch(e) {}
    }
      if (res.ok) tracks = await res.json();
    } catch (e) {
      // Local file:// protocol fallback
    }

    if ((!tracks || tracks.length === 0) && window.__TRACKS_CATALOG__ && Array.isArray(window.__TRACKS_CATALOG__)) {
      tracks = window.__TRACKS_CATALOG__;
    }

    const localSaved = await getAllTracksMetadata();
    const map = new Map();
    tracks.forEach((t) => map.set(t.id, t));
    localSaved.forEach((m) => map.set(m.id, m));

    catalogTracks = Array.from(map.values());
    renderCatalogFeed(catalogTracks);
    renderManualTracksFeed();
  }

  function renderCatalogFeed(tracks) {
    const list = document.getElementById('home-tracks-list');
    if (!list) return;

    list.innerHTML = '';
    if (tracks.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: var(--md-sys-color-outline);">
          <svg class="svg-icon" style="width: 48px; height: 48px; margin-bottom: 8px;"><use href="#icon-music"></use></svg>
          <div>В каталоге пока нет треков</div>
          <div style="font-size: 0.8rem; margin-top: 4px;">Загрузите .oump3 трек с устройства ниже или создайте свой в Моей Студии!</div>
        </div>
      `;
      return;
    }

    tracks.forEach((t) => {
      const row = createTrackRow(t, () => {
        playbackQueue = tracks;
        queueIndex = tracks.indexOf(t);
        playTrack(t);
      });
      list.appendChild(row);
    });
  }

  async function renderManualTracksFeed() {
    const list = document.getElementById('home-manual-tracks-list');
    if (!list) return;

    const all = await getAllTracksMetadata();
    const manual = all.filter((t) => t.isLocal);

    list.innerHTML = '';
    if (manual.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--md-sys-color-outline); font-size: 0.85rem;">
          Нет добавленных локальных треков. Нажмите "Загрузить свой .oump3" выше!
        </div>
      `;
      return;
    }

    manual.forEach((t) => {
      const row = createTrackRow(t, () => {
        playbackQueue = manual;
        queueIndex = manual.indexOf(t);
        playTrack(t);
      });

      // Quick Delete Button for Local Track
      const actions = row.querySelector('.track-actions');
      if (actions) {
        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn manual-delete-btn';
        delBtn.setAttribute('title', 'Удалить локальный трек');
        delBtn.innerHTML = '<svg class="svg-icon" style="width: 18px; height: 18px; color: var(--md-sys-color-error);"><use href="#icon-trash"></use></svg>';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const confirmDialog = document.getElementById('delete-track-confirm-dialog');
          const content = document.getElementById('delete-track-dialog-content');
          if (content) content.textContent = `Вы уверены, что хотите удалить трек "${t.artist} — ${t.title}" из локального хранилища?`;
          confirmDialog?.classList.add('active');

          const execBtn = document.getElementById('execute-delete-track-btn');
          const cancelBtn = document.getElementById('cancel-delete-track-btn');
          const onCancel = () => {
            confirmDialog?.classList.remove('active');
            cleanup();
          };
          const onConfirm = async () => {
            confirmDialog?.classList.remove('active');
            cleanup();
            await deleteTrack(t.id);
          };
          function cleanup() {
            execBtn?.removeEventListener('click', onConfirm);
            cancelBtn?.removeEventListener('click', onCancel);
          }
          cancelBtn?.addEventListener('click', onCancel);
          execBtn?.addEventListener('click', onConfirm);
        });
        actions.prepend(delBtn);
      }

      list.appendChild(row);
    });
  }

  function createTrackRow(track, onClick) {
    const row = document.createElement('div');
    const isNow = (currentTrack && currentTrack.id === track.id);
    row.className = `track-row ${isNow ? 'now-playing' : ''}`;
    row.setAttribute('data-track-id', track.id);

    const isVer = isArtistVerified(track.artist);
    const artists = (track.artist || 'Неизвестный исполнитель').split(',').map((a) => a.trim());
    const artistsHtml = artists
      .map((a) => `<a href="#artist=${encodeURIComponent(a)}" onclick="event.stopPropagation();">${a}</a>`)
      .join(', ');

    row.innerHTML = `
      <div class="track-cover-wrap">
        <img class="track-cover-img" src="${track.thumbBase64 || 'assets/oumusic.png'}" alt="">
      </div>
      <div class="track-info">
        <div class="track-title" style="display: flex; align-items: center; gap: 4px;">
          <span>${track.title || 'Безымянный трек'}</span>
          ${(track.isExplicit || track.explicit) ? '<span class="badge-explicit" title="Ненормативная лексика">E</span>' : ''}
          ${isVer ? '<span class="badge-verified" title="Верифицирован"><svg class="svg-icon"><use href="#icon-verified"></use></svg></span>' : ''}
          ${track.isLocal ? '<span class="badge-downloaded" title="Локальный трек"><svg class="svg-icon"><use href="#icon-check-circle"></use></svg></span>' : ''}
        </div>
        <div class="track-artist">${artistsHtml}</div>
      </div>
      <div class="track-actions">
        <button class="icon-btn track-options-trigger" title="Опции" onclick="event.stopPropagation();">
          <svg class="svg-icon"><use href="#icon-more-vert"></use></svg>
        </button>
      </div>
    `;

    row.addEventListener('click', onClick);

    row.querySelector('.track-options-trigger')?.addEventListener('click', () => {
      openTrackOptionsSheet(track);
    });

    return row;
  }

  function filterTracksFeed(query) {
    const list = document.getElementById('home-tracks-list');
    const waveSection = document.getElementById('wave-home-section');
    if (!list) return;

    if (!query) {
      if (waveSection) waveSection.style.display = '';
      renderCatalogFeed(catalogTracks);
      return;
    }

    // Hide Моя Волна when searching so search results take full prominence
    if (waveSection) waveSection.style.display = 'none';

    // If searching while on another tab, navigate to Home screen
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id !== 'screen-home' && window.navigateTo) {
      window.navigateTo('home', false);
    }

    const filtered = catalogTracks.filter((t) => {
      const titleMatch = (t.title || '').toLowerCase().includes(query);
      const artistMatch = (t.artist || '').toLowerCase().includes(query);
      const genreMatch = Array.isArray(t.genres) && t.genres.some((g) => g.toLowerCase().includes(query));
      return titleMatch || artistMatch || genreMatch;
    });

    if (filtered.length === 0) {
      const escaped = query.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      list.innerHTML = `
        <div class="search-empty-state">
          <div class="search-empty-icon">
            <svg class="svg-icon"><use href="#icon-search"></use></svg>
          </div>
          <div class="search-empty-title">Ничего не найдено</div>
          <div class="search-empty-subtitle">По запросу «${escaped}» подходящих треков или артистов не найдено. Попробуйте изменить формулировку.</div>
          <button class="btn btn-tonal" id="clear-search-btn">
            <svg class="svg-icon" style="width: 16px; height: 16px;"><use href="#icon-close"></use></svg>
            <span>Очистить поиск</span>
          </button>
        </div>
      `;
      document.getElementById('clear-search-btn')?.addEventListener('click', () => {
        const s = document.getElementById('global-search-input');
        if (s) {
          s.value = '';
          s.focus();
        }
        if (waveSection) waveSection.style.display = '';
        renderCatalogFeed(catalogTracks);
      });
      return;
    }

    renderCatalogFeed(filtered);
  }

  /* Playback & Track Loader */
    /* Color Extraction for Adaptive Accent */
  async function extractCoverDominantColor(imgSrc) {
    return new Promise((resolve) => {
      if (!imgSrc) return resolve('#8B5CF6');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const cvs = document.createElement('canvas');
          const ctx = cvs.getContext('2d');
          cvs.width = 48;
          cvs.height = 48;
          ctx.drawImage(img, 0, 0, 48, 48);
          const data = ctx.getImageData(0, 0, 48, 48).data;

          let bestColor = null;
          let maxScore = -1;

          for (let i = 0; i < data.length; i += 16) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;
            const lum = (max + min) / 510;

            if (lum < 0.18 || lum > 0.85 || sat < 0.28) continue;
            const score = sat * 1.6 + (1 - Math.abs(lum - 0.5));
            if (score > maxScore) {
              maxScore = score;
              bestColor = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
            }
          }
          resolve(bestColor || '#8B5CF6');
        } catch (e) {
          resolve('#8B5CF6');
        }
      };
      img.onerror = () => resolve('#8B5CF6');
      img.src = imgSrc;
    });
  }

  /* Web MediaSession API for Native Lockscreen, Dynamic Island & Mobile Drawer */
  function updateMediaSession(track) {
    if (!('mediaSession' in navigator) || !track) return;
    try {
      const coverUrl = track.coverUrl || track.thumbBase64 || 'assets/oumusic.png';
      const absCover = new URL(coverUrl, window.location.href).href;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'ouMusic Track',
        artist: track.artist || 'ouMusic Artist',
        album: 'ouMusic',
        artwork: [
          { src: absCover, sizes: '96x96', type: 'image/png' },
          { src: absCover, sizes: '128x128', type: 'image/png' },
          { src: absCover, sizes: '192x192', type: 'image/png' },
          { src: absCover, sizes: '256x256', type: 'image/png' },
          { src: absCover, sizes: '384x384', type: 'image/png' },
          { src: absCover, sizes: '512x512', type: 'image/png' }
        ]
      });

      const handlers = [
        ['play', () => engine.softPlay()],
        ['pause', () => engine.softPause()],
        ['previoustrack', () => (window.playPrevTrack ? window.playPrevTrack() : null)],
        ['nexttrack', () => (window.playNextTrack ? window.playNextTrack() : null)],
        ['seekto', (details) => {
          if (details && details.seekTime !== undefined && details.seekTime !== null) {
            engine.seek(details.seekTime);
          }
        }],
        ['seekbackward', (details) => {
          const skip = (details && details.seekOffset) || 10;
          engine.seek(Math.max(0, engine.audioElement.currentTime - skip));
        }],
        ['seekforward', (details) => {
          const skip = (details && details.seekOffset) || 10;
          engine.seek(Math.min(engine.audioElement.duration || 0, engine.audioElement.currentTime + skip));
        }]
      ];

      handlers.forEach(([action, handler]) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (e) {}
      });
    } catch (e) {
      console.warn('[MediaSession] Error:', e);
    }
  }

  function updateMediaSessionPlaybackState(isPlaying) {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (e) {}
    }
  }

  async function playTrack(track, autoPlay = true) {
    if (!track) return;
    currentTrack = track;

    // Check offline store first
    const offlineRecord = await getOfflineTrack(track.id);
    let audioSrc = null;

    if (offlineRecord && offlineRecord.audioBlob) {
      audioSrc = offlineRecord.audioBlob;
      if (offlineRecord.coverBlob) {
        track.coverUrl = URL.createObjectURL(offlineRecord.coverBlob);
      }
    } else if (!track.isLocal && track.filename) {
      try {
        const encName = encodeURIComponent(track.filename);
        const candidates = [
          resolveAppUrl(`tracks/${encName}`),
          `./tracks/${encName}`,
          `tracks/${encName}`,
          `./tracks/${track.filename}`,
          `tracks/${track.filename}`,
          `/ouMusic/tracks/${encName}`,
          `/tracks/${encName}`,
          `https://raw.githubusercontent.com/oulan1/ouMusic/main/tracks/${encName}`
        ];
        let res = null;
        for (const url of candidates) {
          try {
            const r = await fetch(url);
            if (r && r.ok) { res = r; break; }
          } catch (e) {}
        }
        if (res && res.ok) {
          const buf = await res.arrayBuffer();
          try {
            const unpacked = await unpackOump3Full(buf);
            if (unpacked && unpacked.audioBlob) {
              audioSrc = unpacked.audioBlob;
              if (unpacked.coverBlob) track.coverUrl = URL.createObjectURL(unpacked.coverBlob);
              if (unpacked.lyricsText) track.lyricsText = unpacked.lyricsText;
              if (unpacked.meta) {
                if (unpacked.meta.hasInstrumental !== undefined) track.hasInstrumental = unpacked.meta.hasInstrumental;
                if (unpacked.meta.instrumentalConfig) track.instrumentalConfig = unpacked.meta.instrumentalConfig;
                if (unpacked.meta.isExplicit !== undefined) track.isExplicit = unpacked.meta.isExplicit;
              }
            }
          } catch (err) {
            console.error('[ouMusic] Error unpacking .oump3 container:', err);
          }
        }
      } catch (e) {
        console.error('[ouMusic] Track loading error:', e);
      }
    }

    if (!audioSrc) {
      if (window.location.protocol === 'file:') {
        showToast('Для воспроизведения из tracks запустите start_server.bat или используйте "Загрузить свой .oump3"', 4500);
      } else {
        alert(`Трек "${track.title}" недоступен для воспроизведения (файл не найден).`);
      }
      return;
    }

    updatePlayerMeta(track);
    updateMediaSession(track);
    document.querySelectorAll('.track-row').forEach((r) => {
      r.classList.toggle('now-playing', r.getAttribute('data-track-id') === track.id);
    });
    const lyricsToLoad = track.lyricsText || track.lrcText || (offlineRecord && (offlineRecord.lyricsText || offlineRecord.lrcText)) || '';
    loadLyrics(lyricsToLoad, track);

    // Adaptive accent color update
    if (localStorage.getItem('oumusic_accent_adaptive') === 'true' && window.applyAccentColor) {
      extractCoverDominantColor(track.coverUrl || track.thumbBase64).then((dom) => {
        window.applyAccentColor(dom, true);
      });
    }

    await engine.loadTrack(track, audioSrc, autoPlay);
    await addHistory(track.id, track.duration || 180);
    await updateProfileStats();
  }

  function updatePlayerMeta(track) {
    const mini = document.getElementById('mini-player');
    if (mini) mini.style.display = 'flex';

    document.querySelectorAll('#mini-title, #fs-title').forEach((el) => {
      el.textContent = track.title || 'Трек';
    });
    document.querySelectorAll('#mini-artist, #fs-artist').forEach((el) => {
      el.textContent = track.artist || 'Артист';
    });
    document.querySelectorAll('#mini-cover-img, #fs-cover-img, #lyrics-cover-img').forEach((img) => {
      img.src = track.coverUrl || track.thumbBase64 || 'assets/oumusic.png';
    });
    const lyrTitle = document.getElementById('lyrics-track-title');
    const lyrArtist = document.getElementById('lyrics-track-artist');
    if (lyrTitle) lyrTitle.textContent = track.title || 'Трек';
    if (lyrArtist) lyrArtist.textContent = track.artist || 'Артист';

    const waveTitle = document.getElementById('wave-track-title') || document.getElementById('wave-np-title');
    const waveArtist = document.getElementById('wave-track-artist') || document.getElementById('wave-np-artist');
    if (waveTitle) waveTitle.textContent = track.title || 'Трек';
    if (waveArtist) waveArtist.textContent = track.artist || 'Артист';

    // Explicit badges
    const isExp = !!(track.isExplicit || track.explicit);
    const miniExp = document.getElementById('mini-explicit-badge');
    const fsExp = document.getElementById('fs-explicit-badge');
    const lyrExp = document.getElementById('lyrics-explicit-badge');
    if (miniExp) miniExp.style.display = isExp ? 'inline-flex' : 'none';
    if (fsExp) fsExp.style.display = isExp ? 'inline-flex' : 'none';
    if (lyrExp) lyrExp.style.display = isExp ? 'inline-flex' : 'none';

    // Hide share on local tracks
    const fsShare = document.getElementById('fs-share-track-btn');
    if (fsShare) fsShare.style.display = track.isLocal ? 'none' : 'flex';

    updateLikeDislikeState(track.id);

    // If karaoke overlay is currently active, seamlessly reload lyrics and ambient tint
    if (document.getElementById('lyrics-overlay')?.classList.contains('active')) {
      window.updateKaraokeTrackUI?.(track);
    }
  }

  async function updateLikeDislikeState(trackId) {
    const liked = await isLiked(trackId);
    const disliked = await isDisliked(trackId);

    const miniLike = document.getElementById('mini-like-btn');
    const fsLike = document.getElementById('fs-like-btn');
    const fsDislike = document.getElementById('fs-dislike-btn');

    const likeIcon = liked ? '#icon-heart-filled' : '#icon-heart';
    [miniLike, fsLike].forEach((b) => {
      if (b) {
        b.style.color = liked ? '#EC4899' : 'inherit';
        b.querySelector('use')?.setAttribute('href', likeIcon);
      }
    });

    if (fsDislike) fsDislike.style.color = disliked ? '#EF4444' : 'inherit';
  }

  /* Player UI & Controls */
  function initPlayerUI() {
    const mini = document.getElementById('mini-player');
    const fs = document.getElementById('fullscreen-player');
    const closeFs = document.getElementById('close-fullscreen-player-btn');

    if (mini && fs) {
      mini.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        fs.classList.add('active');
      });
    }

    if (closeFs && fs) {
      closeFs.addEventListener('click', () => fs.classList.remove('active'));
    }

    // Play / Pause
    const toggleHandler = () => engine.togglePlay();
    document.getElementById('mini-play-btn')?.addEventListener('click', toggleHandler);
    document.getElementById('fs-play-btn')?.addEventListener('click', toggleHandler);

    engine.onPlayStateChange = (playing) => {
      const icon = playing ? '#icon-pause' : '#icon-play';
      document.querySelectorAll('#mini-play-btn use, #fs-play-btn use, #wave-play-toggle-btn use, #hero-start-wave-btn use').forEach((u) => {
        u.setAttribute('href', icon);
      });
      updateMediaSessionPlaybackState(playing);
    };

    // Repeat modes: 'none' | 'all' | 'one'
    let repeatMode = 'none';
    let isShuffle = false;

    const repeatBtn = document.getElementById('fs-repeat-btn');
    repeatBtn?.addEventListener('click', () => {
      if (repeatMode === 'none') {
        repeatMode = 'all';
        repeatBtn.className = 'icon-btn active-all';
        repeatBtn.setAttribute('title', 'Повтор: весь плейлист');
      } else if (repeatMode === 'all') {
        repeatMode = 'one';
        repeatBtn.className = 'icon-btn active-one';
        repeatBtn.setAttribute('title', 'Повтор: один трек');
      } else {
        repeatMode = 'none';
        repeatBtn.className = 'icon-btn';
        repeatBtn.setAttribute('title', 'Повтор выключен');
      }
    });

    const shuffleBtn = document.getElementById('fs-shuffle-btn');
    shuffleBtn?.addEventListener('click', () => {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle('active', isShuffle);
      shuffleBtn.setAttribute('title', isShuffle ? 'Перемешивание включено' : 'Перемешать');
    });

    // Next track with repeat and shuffle support
    const nextHandler = () => {
      if (playbackQueue.length === 0) return;

      if (repeatMode === 'one') {
        engine.seek(0);
        engine.softPlay();
        return;
      }

      if (isShuffle && playbackQueue.length > 1) {
        let rand = queueIndex;
        while (rand === queueIndex) {
          rand = Math.floor(Math.random() * playbackQueue.length);
        }
        queueIndex = rand;
      } else {
        if (repeatMode === 'none' && queueIndex >= playbackQueue.length - 1) {
          engine.softPause();
          return;
        }
        queueIndex = (queueIndex + 1) % playbackQueue.length;
      }

      playTrack(playbackQueue[queueIndex]);
    };

    window.playNextTrack = nextHandler;
    document.getElementById('mini-next-btn')?.addEventListener('click', nextHandler);
    document.getElementById('fs-next-btn')?.addEventListener('click', nextHandler);
    engine.onTrackEnd = nextHandler;

    // Prev track (10 sec logic)
    const prevHandler = () => {
      engine.handleBackButton(() => {
        if (playbackQueue.length === 0) return;
        queueIndex = (queueIndex - 1 + playbackQueue.length) % playbackQueue.length;
        playTrack(playbackQueue[queueIndex]);
      });
    };
    window.playPrevTrack = prevHandler;
    document.getElementById('fs-prev-btn')?.addEventListener('click', prevHandler);

    // Scrubber
    const scrubber = document.getElementById('fs-scrubber');
    const curTimeEl = document.getElementById('fs-time-current');
    const durTimeEl = document.getElementById('fs-time-duration');
    const miniProgress = document.getElementById('mini-progress-bar');

    engine.onTimeUpdate = (cur, dur) => {
      if (dur > 0) {
        const pct = (cur / dur) * 100;
        if (scrubber && !scrubber.matches(':active')) {
          scrubber.value = pct;
          scrubber.style.setProperty('--range-progress', `${pct}%`);
        }
        if (miniProgress) miniProgress.style.width = `${pct}%`;
        if (curTimeEl) curTimeEl.textContent = formatSec(cur);
        if (durTimeEl) durTimeEl.textContent = formatSec(dur);

        if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
          try {
            navigator.mediaSession.setPositionState({
              duration: dur,
              playbackRate: engine.audioElement.playbackRate || 1.0,
              position: Math.min(cur, dur)
            });
          } catch (e) {}
        }
      }
    };

    if (scrubber) {
      scrubber.addEventListener('input', () => {
        scrubber.style.setProperty('--range-progress', `${scrubber.value}%`);
        if (engine.audioElement.duration) {
          const t = (scrubber.value / 100) * engine.audioElement.duration;
          if (curTimeEl) curTimeEl.textContent = formatSec(t);
        }
      });
      scrubber.addEventListener('change', () => {
        scrubber.style.setProperty('--range-progress', `${scrubber.value}%`);
        if (engine.audioElement.duration) {
          engine.seek((scrubber.value / 100) * engine.audioElement.duration);
        }
      });
    }

    // Likes
    const likeToggleHandler = async () => {
      if (!currentTrack) return;
      await toggleLike(currentTrack.id);
      updateLikeDislikeState(currentTrack.id);
    };
    document.getElementById('mini-like-btn')?.addEventListener('click', likeToggleHandler);
    document.getElementById('fs-like-btn')?.addEventListener('click', likeToggleHandler);

    // Dislike: removes track from queue & advances gracefully without restarting
    document.getElementById('fs-dislike-btn')?.addEventListener('click', async () => {
      if (!currentTrack) return;
      const dislikedId = currentTrack.id;
      await toggleDislike(dislikedId);
      updateLikeDislikeState(dislikedId);

      playbackQueue = playbackQueue.filter((t) => t.id !== dislikedId);
      if (playbackQueue.length > 0) {
        queueIndex = queueIndex % playbackQueue.length;
        playTrack(playbackQueue[queueIndex]);
      } else {
        engine.softPause();
        alert('Трек скрыт и удален из очереди.');
      }
    });

    initTrackOptionsSheet();
    initCircularSpectrum();

    // Fullscreen Cover Lightbox Modal (Accessible across player, mini-player, and karaoke)
    function openCoverLightbox(src) {
      const modal = document.getElementById('cover-lightbox-modal');
      const img = document.getElementById('cover-lightbox-img');
      if (!modal) return;
      const finalSrc = src || (currentTrack && (currentTrack.coverUrl || currentTrack.thumbBase64)) || document.getElementById('fs-cover-img')?.getAttribute('src') || document.getElementById('mini-cover-img')?.getAttribute('src') || 'assets/oumusic.png';
      if (img) img.src = finalSrc;
      modal.classList.add('active');
    }
    window.openCoverLightbox = openCoverLightbox;

    const coverSelectors = '#player-cover-clickable, .player-cover-box, #fs-cover-img, .lyrics-cover-card, #lyrics-cover-img, .mini-cover, #mini-cover-img';
    document.querySelectorAll(coverSelectors).forEach((el) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.lyrics-cover-btn')) return;
        e.stopPropagation();
        openCoverLightbox();
      });
    });

    const lightboxModal = document.getElementById('cover-lightbox-modal');
    const lightboxClose = document.getElementById('cover-lightbox-close-btn');
    lightboxClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      lightboxModal?.classList.remove('active');
    });
    lightboxModal?.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.closest('#cover-lightbox-close-btn') || !e.target.closest('.cover-lightbox-content')) {
        lightboxModal?.classList.remove('active');
      }
    });
  }

  /* High-precision LRC Parser & Formatter with Milliseconds [00:00.00] */
  function parseLRC(lrcText) {
    if (!lrcText || typeof lrcText !== 'string') return [];

    const lines = lrcText.split('\n');
    const result = [];
    // Matches [mm:ss.xx] or [mm:ss.xxx] or [mm:ss:xx] or [mm:ss]
    const timeRegex = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

    lines.forEach((line) => {
      const text = line.replace(timeRegex, '').trim();
      // Ignore LRC header tags [ar:Artist], [ti:Title], [length:03:45], etc.
      if (/^\[(ti|ar|al|au|by|offset|length|re|ve):/i.test(line.trim())) return;

      let hasMatch = false;
      timeRegex.lastIndex = 0;
      let match;
      while ((match = timeRegex.exec(line)) !== null) {
        hasMatch = true;
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        let ms = 0;
        if (match[3]) {
          const rawMs = match[3];
          if (rawMs.length === 1) ms = parseInt(rawMs, 10) * 100;
          else if (rawMs.length === 2) ms = parseInt(rawMs, 10) * 10;
          else ms = parseInt(rawMs.slice(0, 3), 10);
        }
        const totalSec = min * 60 + sec + ms / 1000;
        result.push({ time: totalSec, text: text || '♪' });
      }

      if (!hasMatch && text) {
        result.push({ time: null, text });
      }
    });

    const timed = result.filter((r) => r.time !== null).sort((a, b) => a.time - b.time);
    const untimed = result.filter((r) => r.time === null);
    return timed.length > 0 ? timed.concat(untimed) : result;
  }
  window.parseLRC = parseLRC;

  function formatLrcTime(sec) {
    if (sec === null || sec === undefined || isNaN(sec)) return '--:--.--';
    if (sec < 0) sec = 0;
    const totalHundredths = Math.round(sec * 100);
    const m = Math.floor(totalHundredths / 6000);
    const s = Math.floor((totalHundredths % 6000) / 100);
    const ms = totalHundredths % 100;
    const mm = m < 10 ? '0' + m : m;
    const ss = s < 10 ? '0' + s : s;
    const xx = ms < 10 ? '0' + ms : ms;
    return `${mm}:${ss}.${xx}`;
  }
  window.formatLrcTime = formatLrcTime;

  function formatSec(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  /* 3-Dots Options & FX Bottom Sheet */
  let selectedSheetTrack = null;

  function initTrackOptionsSheet() {
    const backdrop = document.getElementById('track-options-backdrop');
    const sheet = document.getElementById('track-options-sheet');
    const closeBtn = document.getElementById('close-track-options-btn');
    const moreBtn = document.getElementById('fs-more-options-btn');

    if (moreBtn) moreBtn.addEventListener('click', () => openTrackOptionsSheet(currentTrack));

    const closeSheet = () => {
      backdrop?.classList.remove('active');
      sheet?.classList.remove('active');
    };
    closeBtn?.addEventListener('click', closeSheet);
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSheet();
    });

    // Track Actions Wiring
    document.getElementById('sheet-act-like')?.addEventListener('click', async () => {
      if (!selectedSheetTrack) return;
      await toggleLike(selectedSheetTrack.id);
      await updateLikeDislikeState(selectedSheetTrack.id);
      closeSheet();
    });

    document.getElementById('sheet-act-play-next')?.addEventListener('click', () => {
      if (!selectedSheetTrack) return;
      const idx = queueIndex + 1;
      playbackQueue.splice(idx, 0, selectedSheetTrack);
      closeSheet();
      alert(`Трек "${selectedSheetTrack.title}" будет воспроизведен следующим!`);
    });

    document.getElementById('sheet-act-add-queue')?.addEventListener('click', () => {
      if (!selectedSheetTrack) return;
      playbackQueue.push(selectedSheetTrack);
      closeSheet();
      alert(`Трек "${selectedSheetTrack.title}" добавлен в конец очереди!`);
    });

    document.getElementById('sheet-act-add-playlist')?.addEventListener('click', async () => {
      if (!selectedSheetTrack) return;
      const plName = prompt('Введите имя плейлиста для добавления:');
      if (plName && plName.trim()) {
        const store = getStore('playlists', 'readwrite');
        if (store) {
          const pl = { id: 'pl_' + Date.now(), name: plName.trim(), trackIds: [selectedSheetTrack.id] };
          store.put(pl);
          renderPlaylistsGrid();
          alert(`Трек добавлен в плейлист "${plName.trim()}"!`);
        }
      }
      closeSheet();
    });

    document.getElementById('sheet-act-download')?.addEventListener('click', async () => {
      if (!selectedSheetTrack) return;
      closeSheet();
      alert(`Трек "${selectedSheetTrack.title}" сохранен в локальный оффлайн-кэш!`);
    });

    document.getElementById('sheet-act-share')?.addEventListener('click', async () => {
      if (!selectedSheetTrack) return;
      const text = `${selectedSheetTrack.artist} — ${selectedSheetTrack.title} на ouMusic`;
      if (navigator.share) {
        try { await navigator.share({ title: 'ouMusic', text, url: window.location.href }); } catch (e) {}
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert('Информация о треке скопирована в буфер обмена!');
      }
      closeSheet();
    });

    document.getElementById('sheet-act-dislike')?.addEventListener('click', async () => {
      if (!selectedSheetTrack) return;
      await toggleDislike(selectedSheetTrack.id);
      if (currentTrack && currentTrack.id === selectedSheetTrack.id) {
        playNextTrack();
      }
      closeSheet();
      alert(`Трек "${selectedSheetTrack.title}" скрыт и не будет предлагаться.`);
    });

    // Delete Track from Bottom Sheet
    document.getElementById('sheet-act-delete-track')?.addEventListener('click', () => {
      if (!selectedSheetTrack) return;
      const t = selectedSheetTrack;
      closeSheet();

      const confirmDialog = document.getElementById('delete-track-confirm-dialog');
      const content = document.getElementById('delete-track-dialog-content');
      if (content) content.textContent = `Вы действительно хотите удалить трек "${t.artist} — ${t.title}" из приложения?`;
      confirmDialog?.classList.add('active');

      const execBtn = document.getElementById('execute-delete-track-btn');
      const cancelBtn = document.getElementById('cancel-delete-track-btn');
      const onCancel = () => {
        confirmDialog?.classList.remove('active');
        cleanup();
      };
      const onConfirm = async () => {
        confirmDialog?.classList.remove('active');
        cleanup();
        await deleteTrack(t.id);
      };
      function cleanup() {
        execBtn?.removeEventListener('click', onConfirm);
        cancelBtn?.removeEventListener('click', onCancel);
      }
      cancelBtn?.addEventListener('click', onCancel);
      execBtn?.addEventListener('click', onConfirm);
    });

    // FX Sliders
    const speedSlider = document.getElementById('fx-speed-slider');
    const speedLabel = document.getElementById('fx-speed-val');
    if (speedSlider) {
      speedSlider.addEventListener('input', () => {
        let val = parseFloat(speedSlider.value);
        if (Math.abs(val - 1.0) < 0.03) val = 1.0;
        engine.setPlaybackRate(val);
        if (speedLabel) speedLabel.textContent = `${val.toFixed(2)}x`;
      });
    }

    const revSlider = document.getElementById('fx-reverb-slider');
    const revLabel = document.getElementById('fx-reverb-val');
    if (revSlider) {
      revSlider.addEventListener('input', () => {
        const val = parseInt(revSlider.value, 10);
        engine.setReverb(val);
        if (revLabel) revLabel.textContent = `${val}%`;
      });
    }

    const spatSlider = document.getElementById('fx-spatial-slider');
    const spatLabel = document.getElementById('fx-spatial-val');
    if (spatSlider) {
      spatSlider.addEventListener('input', () => {
        const val = parseInt(spatSlider.value, 10);
        engine.set8DAudio(val);
        if (spatLabel) spatLabel.textContent = `${val}%`;
      });
    }

    document.getElementById('fx-reset-all-btn')?.addEventListener('click', () => {
      engine.resetFX();
      if (speedSlider) speedSlider.value = '1.00';
      if (speedLabel) speedLabel.textContent = '1.00x';
      if (revSlider) revSlider.value = '0';
      if (revLabel) revLabel.textContent = '0%';
      if (spatSlider) spatSlider.value = '0';
      if (spatLabel) spatLabel.textContent = '0%';
    });
  }

  function openTrackOptionsSheet(track) {
    if (!track) return;
    selectedSheetTrack = track;
    const backdrop = document.getElementById('track-options-backdrop');
    const sheet = document.getElementById('track-options-sheet');
    const title = document.getElementById('sheet-track-title');
    if (title) title.textContent = `${track.artist} — ${track.title}`;

    // Hide share button for local tracks
    const shareBtn = document.getElementById('sheet-act-share');
    if (shareBtn) shareBtn.style.display = track.isLocal ? 'none' : 'flex';

    backdrop?.classList.add('active');
    sheet?.classList.add('active');
  }

  /* Modern Calm Audio-Reactive Waves around Album Cover (No Clipping, Soft Gentle Flow) */
  function initCircularSpectrum() {
    const canvas = document.getElementById('cover-spectrum-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fsPlayer = document.getElementById('fullscreen-player');

    let smoothVol = 0;
    let smoothBass = 0;
    let waveTime = 0;
    let cachedFreqData = null;

    // Cache accent color RGB outside 60fps render loop
    let targetR = 139, targetG = 92, targetB = 246;
    function syncSpectrumColors() {
      try {
        const rootStyle = getComputedStyle(document.documentElement);
        const accentProp = (rootStyle.getPropertyValue('--md-sys-color-primary') || '#8B5CF6').trim();
        if (accentProp.startsWith('#')) {
          let h = accentProp.replace('#', '');
          if (h.length === 3) h = h.split('').map((c) => c + c).join('');
          targetR = parseInt(h.substring(0, 2), 16) || targetR;
          targetG = parseInt(h.substring(2, 4), 16) || targetG;
          targetB = parseInt(h.substring(4, 6), 16) || targetB;
        } else if (accentProp.startsWith('rgb')) {
          const m = accentProp.match(/\d+/g);
          if (m && m.length >= 3) {
            targetR = parseInt(m[0], 10);
            targetG = parseInt(m[1], 10);
            targetB = parseInt(m[2], 10);
          }
        }
      } catch (e) {}
    }
    syncSpectrumColors();
    window.syncSpectrumColors = syncSpectrumColors;

    function render() {
      requestAnimationFrame(render);

      // Only draw when fullscreen player is active to save mobile CPU/GPU
      if (!fsPlayer || !fsPlayer.classList.contains('active')) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      // Proportional cover radius in 580x580 canvas (cover box occupies ~100/140 = 414px, radius = 207)
      const coverRadius = Math.round(canvas.width / 2.8); // ~207px

      let curVol = 0;
      let curBass = 0;

      if (engine.analyserNode && engine.isPlaying) {
        if (!cachedFreqData || cachedFreqData.length !== engine.analyserNode.frequencyBinCount) {
          cachedFreqData = new Uint8Array(engine.analyserNode.frequencyBinCount);
        }
        engine.analyserNode.getByteFrequencyData(cachedFreqData);

        let bassSum = 0;
        for (let i = 1; i < 8; i++) bassSum += cachedFreqData[i];
        curBass = bassSum / 7 / 255;

        let totalSum = 0;
        for (let i = 0; i < 40; i++) totalSum += cachedFreqData[i];
        curVol = totalSum / 40 / 255;
      }

      // Calm easing
      smoothVol += (curVol - smoothVol) * 0.08;
      smoothBass += (curBass - smoothBass) * 0.12;
      waveTime += 0.02;

      const intensity = Math.min(1.0, Math.max(0, smoothVol * 1.8));
      const r = Math.round(255 + (targetR - 255) * intensity);
      const g = Math.round(255 + (targetG - 255) * intensity);
      const b = Math.round(255 + (targetB - 255) * intensity);

      ctx.save();

      // 1. Soft Breathing Bloom right at the outer edge
      const bloomRadius = coverRadius + 14 + smoothBass * 28;
      const grad = ctx.createRadialGradient(cx, cy, coverRadius * 0.9, cx, cy, bloomRadius);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.14 + smoothVol * 0.25})`);
      grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${0.05 + smoothVol * 0.12})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, bloomRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Calm Concentric Undulating Fluid Waves framing the cover
      const rings = 3;
      for (let k = 0; k < rings; k++) {
        const ringBase = coverRadius + 8 + k * 18 + smoothBass * (10 + k * 8);
        const ringAlpha = (0.35 + intensity * 0.45) * (1 - k * 0.25);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0.06, ringAlpha)})`;
        ctx.lineWidth = 1.8 - k * 0.3;
        ctx.beginPath();

        const points = 80;
        const step = (Math.PI * 2) / points;

        for (let p = 0; p <= points; p++) {
          const theta = p * step;
          const wave = Math.sin(theta * 3 + waveTime * 0.8 + k) * (2.5 + smoothBass * 5) +
                       Math.cos(theta * 6 - waveTime * 0.5) * (1.5 + smoothVol * 3);
          const rad = ringBase + wave;
          const x = cx + Math.cos(theta) * rad;
          const y = cy + Math.sin(theta) * rad;

          if (p === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore();
    }
    render();
  }

  /* Wave Screen & Sphere Animation (Authentic Captivating Моя Волна on Home) */
  function initWaveUI() {
    const canvas = document.getElementById('wave-sphere-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let angle = 0;
      let animFrameId = null;

      function renderWave() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        let bassEnergy = 0;
        let midEnergy = 0;
        if (engine.analyserNode && engine.isPlaying) {
          const freqData = new Uint8Array(engine.analyserNode.frequencyBinCount);
          engine.analyserNode.getByteFrequencyData(freqData);

          let bassSum = 0;
          for (let i = 0; i < 14; i++) bassSum += freqData[i];
          bassEnergy = bassSum / 14 / 255;

          let midSum = 0;
          for (let i = 14; i < 50; i++) midSum += freqData[i];
          midEnergy = midSum / 36 / 255;
        }

        // Smooth continuous organic rotation and idle breathing
        angle += 0.018 + bassEnergy * 0.045;
        const idlePulse = Math.sin(angle * 1.5) * 3.5;
        // Calibrated base radius for 540x540 canvas with generous safety margin
        const baseRadius = 78 + idlePulse + bassEnergy * 32;

        // Dynamic primary accent color from CSS variables
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-primary').trim() || '#8B5CF6';

        // 1. Radiant Glowing Radial Backdrop Aura
        const aura = ctx.createRadialGradient(cx, cy, baseRadius * 0.25, cx, cy, baseRadius * 1.55);
        aura.addColorStop(0, primaryColor);
        aura.addColorStop(0.42, 'rgba(236, 72, 153, 0.45)'); // neon magenta
        aura.addColorStop(0.78, 'rgba(59, 130, 246, 0.2)'); // electric blue
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * 1.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Inner Concentric Shimmer Ring
        ctx.save();
        ctx.beginPath();
        const innerPoints = 48;
        const innerBase = baseRadius * 0.72;
        for (let i = 0; i <= innerPoints; i++) {
          const theta = (i / innerPoints) * Math.PI * 2;
          const distInner = Math.sin(theta * 4 - angle * 1.4) * (3 + midEnergy * 8);
          const rInner = innerBase + distInner;
          const ix = cx + Math.cos(theta) * rInner;
          const iy = cy + Math.sin(theta) * rInner;
          if (i === 0) ctx.moveTo(ix, iy);
          else ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();

        // 3. Calm Concentric Multi-Harmonic Liquid Fluid Waves (matching cover visualizer aesthetic)
        const rings = 4;
        for (let k = 0; k < rings; k++) {
          const ringBase = baseRadius * 0.72 + k * 16 + bassEnergy * (12 + k * 8);
          const ringAlpha = (0.32 + bassEnergy * 0.45) * (1 - k * 0.22);
          ctx.save();
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.08, ringAlpha)})`;
          ctx.lineWidth = 2.2 - k * 0.35;
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 12 + k * 4;
          ctx.beginPath();

          const points = 90;
          const step = (Math.PI * 2) / points;
          for (let p = 0; p <= points; p++) {
            const theta = p * step;
            const wave = Math.sin(theta * 4 + angle * 1.1 + k) * (3.5 + bassEnergy * 9) +
                         Math.cos(theta * 7 - angle * 0.7) * (2.0 + midEnergy * 6);
            const rad = ringBase + wave;
            const x = cx + Math.cos(theta) * rad;
            const y = cy + Math.sin(theta) * rad;

            if (p === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }

        animFrameId = requestAnimationFrame(renderWave);
      }

      if (animFrameId) cancelAnimationFrame(animFrameId);
      renderWave();
    }

    // Populate Genre Dropdown in Wave Hero Card
    const genreSelect = document.getElementById('wave-select-genre');
    if (genreSelect) {
      genreSelect.innerHTML = '<option value="all">Все жанры</option>';
      EXTENDED_GENRES.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.toLowerCase();
        opt.textContent = g;
        genreSelect.appendChild(opt);
      });
    }

    const moodSelect = document.getElementById('wave-select-mood');
    const charSelect = document.getElementById('wave-select-char');
    const startBtn = document.getElementById('hero-start-wave-btn');
    const skipBtn = document.getElementById('wave-skip-btn');
    const dislikeBtn = document.getElementById('wave-dislike-btn');

    // Filter catalog tracks based on Wave dropdown selections
    function getFilteredWaveTracks() {
      const selGenre = genreSelect ? genreSelect.value.toLowerCase() : 'all';
      const selMood = moodSelect ? moodSelect.value : 'all';
      const selChar = charSelect ? charSelect.value : 'any';

      let pool = [...catalogTracks];

      // Filter by genre
      if (selGenre && selGenre !== 'all') {
        const matching = pool.filter((t) => {
          return Array.isArray(t.genres) && t.genres.some((g) => g.toLowerCase().includes(selGenre));
        });
        if (matching.length > 0) pool = matching;
      }

      // Filter by character
      if (selChar === 'familiar') {
        pool.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      } else if (selChar === 'popular') {
        pool.sort((a, b) => ((b.likesCount || 0) - (a.likesCount || 0)));
      } else {
        pool.sort(() => Math.random() - 0.5);
      }

      return pool;
    }

    function updateWaveCardInfo(track) {
      const titleEl = document.getElementById('wave-track-title') || document.getElementById('wave-np-title');
      const artistEl = document.getElementById('wave-track-artist') || document.getElementById('wave-np-artist');
      if (track) {
        if (titleEl) titleEl.textContent = track.title || 'Безымянный трек';
        if (artistEl) artistEl.textContent = track.artist || 'Неизвестный исполнитель';
      } else {
        if (titleEl) titleEl.textContent = 'Не играет';
        if (artistEl) artistEl.textContent = 'Выберите параметры и нажмите Старт';
      }
    }
    window.updateWaveCardInfo = updateWaveCardInfo;

    // Start / Pause Wave
    startBtn?.addEventListener('click', () => {
      if (engine.isPlaying && currentTrack) {
        engine.togglePlay();
        return;
      }
      const stream = getFilteredWaveTracks();
      if (stream.length > 0) {
        playbackQueue = stream;
        queueIndex = 0;
        playTrack(stream[0]);
        updateWaveCardInfo(stream[0]);
      }
    });

    // Skip to next recommendation
    skipBtn?.addEventListener('click', () => {
      const stream = getFilteredWaveTracks();
      if (stream.length > 0) {
        const next = stream[Math.floor(Math.random() * stream.length)];
        playTrack(next);
        updateWaveCardInfo(next);
      }
    });

    // Dislike current track
    dislikeBtn?.addEventListener('click', () => {
      if (currentTrack) {
        addToBlacklist(currentTrack.id, currentTrack.title);
        skipBtn?.click();
      }
    });

    // React immediately to any dropdown change
    [moodSelect, charSelect, genreSelect].forEach((sel) => {
      sel?.addEventListener('change', () => {
        const stream = getFilteredWaveTracks();
        if (stream.length > 0 && engine.isPlaying) {
          playbackQueue = stream;
          queueIndex = 0;
          playTrack(stream[0]);
          updateWaveCardInfo(stream[0]);
        }
      });
    });

    // Hook play state to update hero button icon
    const origStateChange = engine.onPlayStateChange;
    engine.onPlayStateChange = (playing) => {
      if (origStateChange) origStateChange(playing);
      const icon = startBtn?.querySelector('use');
      if (icon) {
        icon.setAttribute('href', playing ? '#icon-pause' : '#icon-play');
      }
      if (currentTrack) updateWaveCardInfo(currentTrack);
    };
  }

  /* My Studio: Waveform Trimmer & Lyrics Constructor */
    /* ==========================================================================
     STUDIO 4-STEP WIZARD & M-CORE DSP EQUALIZER ENGINE
     Step 1: Metadata (Cover, Title, Artist, Explicit, Genres)
     Step 2: Audio (Upload, Visual Waveform Trimming, Fragment Confirmation)
     Step 3: Lyrics (LRC paste, Clipboard, 60fps Live Tap Syncer)
     Step 4: Instrumental (100% Guaranteed Preview, M-Core DSP Tuner, .oump3 Build)
     ========================================================================== */
  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  window.formatTime = formatTime;

  function initStudioUI() {
    let studioAudioBuf = null;       // Full decoded AudioBuffer
    let activeStudioBuffer = null;   // Active AudioBuffer (sliced fragment or full)
    let originalBlob = null;         // Original uploaded audio file Blob
    let trimmedBlob = null;          // Confirmed audio Blob (WAV slice or original)
    let thumbBase64 = null;          // 160x160 JPEG thumbnail
    let lyricsLines = [];            // Parsed lyrics lines with { time, text }
    let curLineIdx = 0;              // Current line index for tap syncer
    let isFragmentConfirmed = false;
    let trimStartTime = 0;
    let trimEndTime = 0;
    let currentStudioStep = 1;
    const studioAudio = new Audio(); // HTMLAudioElement for step 3 text playback

    // ----------------------------------------------------
    // WIZARD STEP NAVIGATION (4 STEPS)
    // ----------------------------------------------------
    function goToStudioStep(step) {
      currentStudioStep = step;
      for (let i = 1; i <= 4; i++) {
        const tab = document.getElementById(`studio-tab-${i}`);
        const container = document.getElementById(`studio-step-${i}-container`);
        if (tab) {
          tab.classList.toggle('active', i === step);
          if (i < step) tab.classList.add('completed');
          else if (i > step) tab.classList.remove('completed');
        }
        if (container) {
          container.style.display = i === step ? 'block' : 'none';
        }
      }

      if (step === 4) {
        updateStep4AudioStatus();
      } else if (isTesting) {
        stopStudioPreview();
      }

      document.getElementById('screen-studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.goToStudioStep = goToStudioStep;
    window.setStudioAudioBuffer = function(buf, blob) {
      studioAudioBuf = buf;
      activeStudioBuffer = buf;
      originalBlob = blob || new Blob(['audio'], { type: 'audio/wav' });
      trimmedBlob = originalBlob;
      isFragmentConfirmed = true;
      updateStep4AudioStatus();
    };

    for (let i = 1; i <= 4; i++) {
      document.getElementById(`studio-tab-${i}`)?.addEventListener('click', () => goToStudioStep(i));
    }

    // Step 1 -> Step 2 Navigation
    document.getElementById('studio-to-step-2-btn')?.addEventListener('click', () => {
      const title = document.getElementById('studio-title-input')?.value.trim();
      const artist = document.getElementById('studio-artist-input')?.value.trim();
      if (!title || !artist) {
        showToast('Пожалуйста, укажите название трека и артиста на Шаге 1');
        return;
      }
      goToStudioStep(2);
    });

    // Step 2 Navigation
    document.getElementById('studio-back-to-step-1-btn')?.addEventListener('click', () => goToStudioStep(1));
    document.getElementById('studio-to-step-3-btn')?.addEventListener('click', () => {
      if (!studioAudioBuf && !originalBlob) {
        showToast('Пожалуйста, выберите аудиофайл на Шаге 2');
        return;
      }
      goToStudioStep(3);
    });

    // Step 3 Navigation
    document.getElementById('studio-back-to-step-2-btn')?.addEventListener('click', () => goToStudioStep(2));
    document.getElementById('studio-to-step-4-btn')?.addEventListener('click', () => goToStudioStep(4));

    // Step 4 Navigation
    document.getElementById('studio-back-to-step-3-btn')?.addEventListener('click', () => goToStudioStep(3));

    // ----------------------------------------------------
    // STEP 1: METADATA & GENRES & COVER
    // ----------------------------------------------------
    const genreBox = document.getElementById('studio-genres-chips');
    if (genreBox && typeof EXTENDED_GENRES !== 'undefined') {
      genreBox.innerHTML = '';
      EXTENDED_GENRES.forEach((g) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = g;
        b.addEventListener('click', () => b.classList.toggle('active'));
        genreBox.appendChild(b);
      });
    }

    const coverDrop = document.getElementById('studio-cover-dropzone');
    const coverFile = document.getElementById('studio-cover-file');
    const coverImg = document.getElementById('studio-cover-preview');
    const coverPlc = document.getElementById('studio-cover-placeholder');

    coverDrop?.addEventListener('click', () => coverFile?.click());
    coverFile?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const f = e.target.files[0];
        const r = new FileReader();
        r.onload = (ev) => {
          if (coverImg) {
            coverImg.src = ev.target.result;
            coverImg.style.display = 'block';
          }
          if (coverPlc) coverPlc.style.display = 'none';

          const img = new Image();
          img.onload = () => {
            const c = document.createElement('canvas');
            c.width = 160;
            c.height = 160;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, 160, 160);
            thumbBase64 = c.toDataURL('image/jpeg', 0.85);
          };
          img.src = ev.target.result;
        };
        r.readAsDataURL(f);
      }
    });

    // Artist suggestions
    const artInp = document.getElementById('studio-artist-input');
    const artSugg = document.getElementById('studio-artist-suggestions');
    artInp?.addEventListener('input', () => {
      const q = artInp.value.toLowerCase().trim();
      if (!q || !window.uniqueArtists || window.uniqueArtists.length === 0) {
        if (artSugg) artSugg.style.display = 'none';
        return;
      }
      const matches = window.uniqueArtists.filter(a => a.toLowerCase().includes(q)).slice(0, 5);
      if (matches.length === 0) {
        if (artSugg) artSugg.style.display = 'none';
        return;
      }
      if (artSugg) {
        artSugg.innerHTML = matches.map(m => `<div class="artist-sugg-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.85rem;">${m}</div>`).join('');
        artSugg.style.display = 'block';
        artSugg.querySelectorAll('.artist-sugg-item').forEach(el => {
          el.addEventListener('click', () => {
            artInp.value = el.textContent;
            artSugg.style.display = 'none';
          });
        });
      }
    });

    // ----------------------------------------------------
    // STEP 2: AUDIO UPLOAD, DECODING & WAVEFORM TRIMMER
    // ----------------------------------------------------
    const chooseAudBtn = document.getElementById('studio-choose-audio-btn');
    const audFileInput = document.getElementById('studio-audio-file');
    const audStatus = document.getElementById('studio-audio-status');
    const waveBox = document.getElementById('studio-waveform-box');
    const waveCanvas = document.getElementById('studio-waveform-canvas');
    const waveContainer = document.getElementById('waveform-container');
    const trimHighlight = document.getElementById('trim-highlight');
    const startHandle = document.getElementById('trim-handle-start');
    const endHandle = document.getElementById('trim-handle-end');
    const trimStartLbl = document.getElementById('trim-start-label');
    const trimEndLbl = document.getElementById('trim-end-label');
    const trimDurLbl = document.getElementById('trim-duration-label');
    const playTrimBtn = document.getElementById('studio-play-trim-btn');

    chooseAudBtn?.addEventListener('click', () => audFileInput?.click());

    audFileInput?.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        originalBlob = file;
        if (audStatus) {
          audStatus.textContent = 'Декодирование...';
          audStatus.style.background = '#F59E0B';
        }

        try {
          await engine.ensureContext();
          const ctx = engine.audioCtx;
          if (ctx.state === 'suspended') await ctx.resume();

          const arrayBuf = await file.arrayBuffer();
          studioAudioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
          activeStudioBuffer = studioAudioBuf;
          trimmedBlob = originalBlob;

          if (audStatus) {
            audStatus.textContent = `Готово (${formatTime(studioAudioBuf.duration)})`;
            audStatus.style.background = '#10B981';
          }
          if (waveBox) waveBox.style.display = 'block';

          trimStartTime = 0;
          trimEndTime = studioAudioBuf.duration;
          drawWaveform(studioAudioBuf);
          updateTrimLabels();
          updateStep4AudioStatus();
          showToast('Аудиофайл успешно загружен!');
        } catch (err) {
          console.error('Audio decode error:', err);
          if (audStatus) {
            audStatus.textContent = 'Ошибка файла';
            audStatus.style.background = '#EF4444';
          }
          alert('Ошибка при чтении аудио: ' + err.message);
        }
      }
    });

    function sliceAudioBuffer(ctx, buffer, startSec, endSec) {
      const sampleRate = buffer.sampleRate;
      const startSample = Math.max(0, Math.floor(startSec * sampleRate));
      const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
      const frameCount = Math.max(1, endSample - startSample);
      const newBuf = ctx.createBuffer(buffer.numberOfChannels, frameCount, sampleRate);
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const fromData = buffer.getChannelData(ch);
        const toData = newBuf.getChannelData(ch);
        toData.set(fromData.subarray(startSample, endSample));
      }
      return newBuf;
    }

    function audioBufferToWav(buffer) {
      const sampleRate = buffer.sampleRate;
      const numChannels = buffer.numberOfChannels;
      const length = buffer.length;

      const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
      const view = new DataView(wavBuffer);

      function writeStr(offset, str) {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      }

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + length * numChannels * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, length * numChannels * 2, true);

      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i] || 0));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      return new Blob([wavBuffer], { type: 'audio/wav' });
    }

    function drawWaveform(buffer) {
      if (!waveCanvas || !buffer) return;
      const c = waveCanvas;
      const ctx = c.getContext('2d');
      c.width = waveContainer ? waveContainer.clientWidth || 700 : 700;
      c.height = 100;
      ctx.clearRect(0, 0, c.width, c.height);

      const data = buffer.getChannelData(0);
      const step = Math.ceil(data.length / c.width);
      const amp = c.height / 2;

      ctx.fillStyle = '#8B5CF6';
      for (let i = 0; i < c.width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
          const datum = data[i * step + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(2, (max - min) * amp));
      }
    }

    function updateTrimLabels() {
      if (!studioAudioBuf) return;
      const dur = studioAudioBuf.duration || 1;
      const startPct = Math.max(0, Math.min(100, (trimStartTime / dur) * 100));
      const endPct = Math.max(0, Math.min(100, (trimEndTime / dur) * 100));

      if (startHandle) startHandle.style.left = startPct + '%';
      if (endHandle) endHandle.style.left = endPct + '%';
      if (trimHighlight) {
        trimHighlight.style.left = startPct + '%';
        trimHighlight.style.width = Math.max(0, endPct - startPct) + '%';
      }

      if (trimStartLbl) trimStartLbl.textContent = formatLrcTime(trimStartTime);
      if (trimEndLbl) trimEndLbl.textContent = formatLrcTime(trimEndTime);
      if (trimDurLbl) trimDurLbl.textContent = `${Math.max(0, trimEndTime - trimStartTime).toFixed(1)} сек`;
    }

    // Trimming Drag Interaction
    let activeDrag = null;
    startHandle?.addEventListener('pointerdown', (e) => { activeDrag = 'start'; e.preventDefault(); });
    endHandle?.addEventListener('pointerdown', (e) => { activeDrag = 'end'; e.preventDefault(); });
    window.addEventListener('pointerup', () => { activeDrag = null; });

    waveContainer?.addEventListener('pointermove', (e) => {
      if (!activeDrag || !studioAudioBuf) return;
      const rect = waveContainer.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const dur = studioAudioBuf.duration;
      const targetSec = pct * dur;

      if (activeDrag === 'start') {
        trimStartTime = Math.max(0, Math.min(targetSec, trimEndTime - 0.5));
      } else if (activeDrag === 'end') {
        trimEndTime = Math.min(dur, Math.max(targetSec, trimStartTime + 0.5));
      }
      updateTrimLabels();
    });

    // Waveform Click & Seek
    waveContainer?.addEventListener('click', (e) => {
      if (e.target === startHandle || e.target === endHandle || !studioAudioBuf) return;
      const rect = waveContainer.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetSec = pct * studioAudioBuf.duration;

      const distToStart = Math.abs(targetSec - trimStartTime);
      const distToEnd = Math.abs(targetSec - trimEndTime);
      if (distToStart < distToEnd) {
        trimStartTime = Math.max(0, Math.min(targetSec, trimEndTime - 0.5));
      } else {
        trimEndTime = Math.min(studioAudioBuf.duration, Math.max(targetSec, trimStartTime + 0.5));
      }
      updateTrimLabels();
    });

    // Trimmer Preview Player
    let isPreviewingTrim = false;
    let previewSourceNode = null;

    function stopTrimPreview() {
      if (previewSourceNode) {
        try { previewSourceNode.stop(); } catch (e) {}
        previewSourceNode = null;
      }
      isPreviewingTrim = false;
      if (playTrimBtn) playTrimBtn.innerHTML = '<svg class="svg-icon" style="width: 16px; height: 16px;"><use href="#icon-play"></use></svg><span>Прослушать фрагмент</span>';
    }

    playTrimBtn?.addEventListener('click', () => {
      if (!studioAudioBuf) return;
      if (isPreviewingTrim) {
        stopTrimPreview();
        return;
      }
      const ctx = engine.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      previewSourceNode = ctx.createBufferSource();
      previewSourceNode.buffer = studioAudioBuf;
      previewSourceNode.connect(ctx.destination);

      const dur = trimEndTime > trimStartTime ? (trimEndTime - trimStartTime) : studioAudioBuf.duration;
      previewSourceNode.start(0, trimStartTime, dur);
      isPreviewingTrim = true;
      if (playTrimBtn) playTrimBtn.innerHTML = '<svg class="svg-icon" style="width: 16px; height: 16px;"><use href="#icon-pause"></use></svg><span>Остановить фрагмент</span>';

      previewSourceNode.onended = () => {
        stopTrimPreview();
      };
    });

    // Confirm Fragment & Move to Step 3
    document.getElementById('studio-confirm-trim-btn')?.addEventListener('click', () => {
      stopTrimPreview();
      isFragmentConfirmed = true;
      const ctx = engine.audioCtx;
      if (studioAudioBuf && trimEndTime > trimStartTime && (trimEndTime - trimStartTime) < studioAudioBuf.duration - 0.5) {
        activeStudioBuffer = sliceAudioBuffer(ctx, studioAudioBuf, trimStartTime, trimEndTime);
        trimmedBlob = audioBufferToWav(activeStudioBuffer);
        showToast(`Фрагмент ${(trimEndTime - trimStartTime).toFixed(1)} сек подтвержден!`);
      } else {
        activeStudioBuffer = studioAudioBuf;
        trimmedBlob = originalBlob;
        showToast('Используется весь трек');
      }
      studioAudio.src = URL.createObjectURL(trimmedBlob);
      studioAudio.load();
      updateStep4AudioStatus();
      goToStudioStep(3);
    });

    // Keep Entire Track & Move to Step 3
    document.getElementById('studio-keep-original-btn')?.addEventListener('click', () => {
      stopTrimPreview();
      isFragmentConfirmed = true;
      activeStudioBuffer = studioAudioBuf;
      trimmedBlob = originalBlob;
      studioAudio.src = URL.createObjectURL(trimmedBlob);
      studioAudio.load();
      updateStep4AudioStatus();
      showToast('Выбран весь трек целиком');
      goToStudioStep(3);
    });

    // ----------------------------------------------------
    // STEP 3: LYRICS & LIVE TAP SYNCER
    // ----------------------------------------------------
    function renderLyricsRows() {
      const container = document.getElementById('studio-lyrics-lines-list');
      if (!container) return;
      container.innerHTML = '';
      lyricsLines.forEach((line, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 8px; align-items: center; padding: 6px 10px; border-radius: 8px; background: rgba(255,255,255,0.04);';
        if (idx === curLineIdx) row.style.border = '1px solid var(--md-sys-color-primary)';

        const timeSpan = document.createElement('span');
        timeSpan.style.cssText = 'font-family: monospace; font-size: 0.8rem; color: var(--md-sys-color-primary); font-weight: 700; min-width: 75px;';
        timeSpan.textContent = line.time !== null ? `[${formatLrcTime(line.time)}]` : '[--:--.--]';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = line.text;
        textInput.style.cssText = 'flex: 1; background: transparent; border: none; color: #FFF; outline: none; font-size: 0.9rem;';
        textInput.addEventListener('input', () => { line.text = textInput.value; });

        const setTimeBtn = document.createElement('button');
        setTimeBtn.type = 'button';
        setTimeBtn.className = 'icon-btn';
        setTimeBtn.title = 'Установить текущее время';
        setTimeBtn.innerHTML = '<svg class="svg-icon" style="width: 14px; height: 14px;"><use href="#icon-clock"></use></svg>';
        setTimeBtn.addEventListener('click', () => {
          line.time = studioAudio.currentTime;
          renderLyricsRows();
        });

        row.appendChild(timeSpan);
        row.appendChild(textInput);
        row.appendChild(setTimeBtn);
        container.appendChild(row);
      });
    }

    document.getElementById('studio-apply-pasted-lyrics-btn')?.addEventListener('click', () => {
      const raw = document.getElementById('studio-paste-lyrics-textarea')?.value || '';
      if (!raw.trim()) {
        showToast('Пожалуйста, введите текст песни');
        return;
      }
      lyricsLines = parseLRC(raw);
      curLineIdx = 0;
      renderLyricsRows();
      showToast(`Текст разбит на ${lyricsLines.length} строк`);
    });

    document.getElementById('studio-paste-lrc-clipboard-btn')?.addEventListener('click', async () => {
      let text = '';
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          text = await navigator.clipboard.readText();
        }
      } catch (err) {
        console.warn('Clipboard read error:', err);
      }
      if (!text) {
        text = document.getElementById('studio-paste-lyrics-textarea')?.value || '';
      }
      if (!text.trim()) {
        alert('Буфер обмена пуст. Пожалуйста, скопируйте текст с таймингами формата [00:00.00] или вставьте его в поле.');
        return;
      }
      const ta = document.getElementById('studio-paste-lyrics-textarea');
      if (ta) ta.value = text;
      lyricsLines = parseLRC(text);
      curLineIdx = 0;
      renderLyricsRows();
      showToast(`Успешно загружен LRC (${lyricsLines.length} строк) с миллисекундами!`);
    });

    // Syncer Play/Pause
    const syncerPlayBtn = document.getElementById('studio-play-syncer-btn');
    const syncerPlayLbl = document.getElementById('studio-syncer-play-label');
    syncerPlayBtn?.addEventListener('click', () => {
      if (studioAudio.paused) {
        studioAudio.play();
        if (syncerPlayLbl) syncerPlayLbl.textContent = 'Пауза';
      } else {
        studioAudio.pause();
        if (syncerPlayLbl) syncerPlayLbl.textContent = 'Воспроизвести для разметки';
      }
    });

    studioAudio.onended = () => {
      if (syncerPlayLbl) syncerPlayLbl.textContent = 'Воспроизвести для разметки';
    };

    // Live Tap Syncer
    const tapAction = () => {
      if (curLineIdx >= lyricsLines.length) return;
      lyricsLines[curLineIdx].time = studioAudio.currentTime;
      curLineIdx++;
      renderLyricsRows();
    };
    document.getElementById('studio-tap-record-btn')?.addEventListener('click', tapAction);

    window.addEventListener('keydown', (e) => {
      if (currentStudioStep === 3 && e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        tapAction();
      }
    });

    // ----------------------------------------------------
    // STEP 4: M-CORE DSP EQUALIZER & 100% RELIABLE PREVIEW
    // ----------------------------------------------------
    const instToggle = document.getElementById('studio-instrumental-toggle');
    const instControls = document.getElementById('studio-instrumental-controls');
    const instTestBtn = document.getElementById('studio-test-instrumental-btn');
    const instTestLabel = document.getElementById('studio-test-instrumental-label');
    const instTestIcon = document.getElementById('studio-test-inst-icon');
    const instToggleModeBtn = document.getElementById('studio-test-toggle-mode-btn');
    const instModeLabel = document.getElementById('studio-test-mode-label');
    const instResetBtn = document.getElementById('studio-reset-dsp-btn');
    const previewProgressBox = document.getElementById('studio-preview-progress-box');
    const previewScrubber = document.getElementById('studio-preview-scrubber');
    const previewTimeEl = document.getElementById('studio-test-time');
    const audioIndicator = document.getElementById('studio-audio-indicator');

    // DSP Sliders
    const sBass = document.getElementById('slider-inst-bass-freq');
    const sAir = document.getElementById('slider-inst-air-freq');
    const sDepth = document.getElementById('slider-inst-depth');
    const sNotchFreq = document.getElementById('slider-inst-notch-freq');
    const sNotchQ = document.getElementById('slider-inst-notch-q');
    const sMakeup = document.getElementById('slider-inst-makeup');

    // Value Labels
    const vBass = document.getElementById('val-inst-bass-freq');
    const vAir = document.getElementById('val-inst-air-freq');
    const vDepth = document.getElementById('val-inst-depth');
    const vNotchFreq = document.getElementById('val-inst-notch-freq');
    const vNotchQ = document.getElementById('val-inst-notch-q');
    const vMakeup = document.getElementById('val-inst-makeup');

    function getStudioDSPConfig() {
      return {
        bassFreq: sBass ? Number(sBass.value) : 160,
        bassGain: 0.72,
        airFreq: sAir ? Number(sAir.value) : 8500,
        airGain: 0.24,
        depth: sDepth ? Number(sDepth.value) : 100,
        notchFreq: sNotchFreq ? Number(sNotchFreq.value) : 1600,
        notchQ: sNotchQ ? Number(sNotchQ.value) : 1.4,
        makeupGain: sMakeup ? Number(sMakeup.value) : 1.30
      };
    }
    window.getStudioDSPConfig = getStudioDSPConfig;

    function updateDSPUI() {
      if (vBass && sBass) vBass.textContent = `${sBass.value} Гц`;
      if (vAir && sAir) vAir.textContent = `${sAir.value} Гц`;
      if (vDepth && sDepth) vDepth.textContent = `${sDepth.value}%`;
      if (vNotchFreq && sNotchFreq) vNotchFreq.textContent = `${sNotchFreq.value} Гц`;
      if (vNotchQ && sNotchQ) vNotchQ.textContent = Number(sNotchQ.value).toFixed(1);
      if (vMakeup && sMakeup) vMakeup.textContent = `${Number(sMakeup.value).toFixed(2)}x`;
      applyLiveDSPNodes();
    }
    [sBass, sAir, sDepth, sNotchFreq, sNotchQ, sMakeup].forEach(s => s?.addEventListener('input', updateDSPUI));

    instResetBtn?.addEventListener('click', () => {
      if (sBass) sBass.value = 160;
      if (sAir) sAir.value = 8500;
      if (sDepth) sDepth.value = 100;
      if (sNotchFreq) sNotchFreq.value = 1600;
      if (sNotchQ) sNotchQ.value = 1.4;
      if (sMakeup) sMakeup.value = 1.30;
      updateDSPUI();
      showToast('Параметры сброшены до студийных значений');
    });

    instToggle?.addEventListener('change', () => {
      const active = instToggle.checked;
      if (instControls) instControls.style.display = active ? 'block' : 'none';
      if (!active && isTesting) stopStudioPreview();
    });

    function updateStep4AudioStatus() {
      const readyMsg = document.getElementById('studio-audio-ready-msg');
      const timeEl = document.getElementById('studio-test-time');
      const buf = activeStudioBuffer || studioAudioBuf;
      if (buf) {
        if (readyMsg) readyMsg.textContent = `Аудио готово: ${formatTime(buf.duration)} • M-Core DSP готов к прослушиванию`;
        if (timeEl && !isTesting) timeEl.textContent = `00:00 / ${formatTime(buf.duration)}`;
      } else {
        if (readyMsg) readyMsg.textContent = 'Аудиофайл еще не выбран на Шаге 2';
        if (timeEl && !isTesting) timeEl.textContent = '00:00 / 00:00';
      }
    }

    let isTesting = false;
    let isMinusovActive = true;
    let previewAudioCtx = null;
    let previewSource = null;
    let previewStartTime = 0;
    let previewAnimId = null;

    let dspBassFilter = null;
    let dspAirFilter = null;
    let dspNotchFilter = null;
    let dspCenterGainL = null;
    let dspCenterGainR = null;
    let dspMakeupGain = null;
    let dspDryGain = null;
    let dspWetGain = null;

    function applyLiveDSPNodes() {
      if (!previewAudioCtx || !dspBassFilter) return;
      const cfg = getStudioDSPConfig();
      const t = previewAudioCtx.currentTime;
      dspBassFilter.frequency.setValueAtTime(cfg.bassFreq, t);
      dspAirFilter.frequency.setValueAtTime(cfg.airFreq, t);
      dspNotchFilter.frequency.setValueAtTime(cfg.notchFreq, t);
      dspNotchFilter.Q.setValueAtTime(cfg.notchQ, t);
      dspMakeupGain.gain.setValueAtTime(cfg.makeupGain, t);
      const depthVal = cfg.depth / 100;
      dspCenterGainL.gain.setValueAtTime(-1.15 * depthVal, t);
      dspCenterGainR.gain.setValueAtTime(-1.15 * depthVal, t);
    }

    function stopStudioPreview() {
      if (previewSource) {
        try {
          previewSource.onended = null;
          previewSource.stop();
        } catch (e) {}
        previewSource = null;
      }
      if (previewAnimId) {
        cancelAnimationFrame(previewAnimId);
        previewAnimId = null;
      }
      isTesting = false;
      if (instTestLabel) instTestLabel.textContent = 'Прослушать минусовку';
      if (instTestIcon) instTestIcon.innerHTML = '<use href="#icon-play"></use>';
      if (audioIndicator) audioIndicator.style.opacity = '0.35';
    }

    async function startStudioPreview(offset = 0) {
      const buffer = activeStudioBuffer || studioAudioBuf;
      if (!buffer) {
        showToast('Пожалуйста, сначала выберите аудиофайл на Шаге 2');
        goToStudioStep(2);
        return;
      }

      if (engine && engine.isPlaying) {
        engine.softPause();
      }
      engine.ensureContext();
      previewAudioCtx = engine.audioCtx;
      const ctx = previewAudioCtx;
      if (ctx.state === 'suspended') {
        try { ctx.resume(); } catch (e) {}
      }

      if (previewSource) {
        try {
          previewSource.onended = null;
          previewSource.stop();
        } catch (e) {}
        previewSource = null;
      }

      previewSource = ctx.createBufferSource();
      previewSource.buffer = buffer;

      // Stereo Difference Matrix (L - R)
      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);

      const gainL_to_L = ctx.createGain(); gainL_to_L.gain.value = 1.15;
      dspCenterGainR = ctx.createGain();
      const gainR_to_R = ctx.createGain(); gainR_to_R.gain.value = 1.15;
      dspCenterGainL = ctx.createGain();

      splitter.connect(gainL_to_L, 0);
      splitter.connect(dspCenterGainR, 1);
      splitter.connect(gainR_to_R, 1);
      splitter.connect(dspCenterGainL, 0);

      // Bass LowPass filter
      dspBassFilter = ctx.createBiquadFilter();
      dspBassFilter.type = 'lowpass';
      const bassGain = ctx.createGain(); bassGain.gain.value = 0.72;
      previewSource.connect(dspBassFilter);
      dspBassFilter.connect(bassGain);

      // Air HighPass filter
      dspAirFilter = ctx.createBiquadFilter();
      dspAirFilter.type = 'highpass';
      const airGain = ctx.createGain(); airGain.gain.value = 0.24;
      previewSource.connect(dspAirFilter);
      dspAirFilter.connect(airGain);

      // Merge into stereo channels
      gainL_to_L.connect(merger, 0, 0);
      dspCenterGainR.connect(merger, 0, 0);
      bassGain.connect(merger, 0, 0);
      airGain.connect(merger, 0, 0);

      gainR_to_R.connect(merger, 0, 1);
      dspCenterGainL.connect(merger, 0, 1);
      bassGain.connect(merger, 0, 1);
      airGain.connect(merger, 0, 1);

      // Vocal Notch Filter
      dspNotchFilter = ctx.createBiquadFilter();
      dspNotchFilter.type = 'notch';

      // Makeup Gain
      dspMakeupGain = ctx.createGain();

      merger.connect(dspNotchFilter);
      dspNotchFilter.connect(dspMakeupGain);

      // Instant A/B Crossfade Gains
      dspDryGain = ctx.createGain();
      dspWetGain = ctx.createGain();
      dspDryGain.gain.value = isMinusovActive ? 0.0 : 1.0;
      dspWetGain.gain.value = isMinusovActive ? 1.0 : 0.0;

      previewSource.connect(dspDryGain);
      dspMakeupGain.connect(dspWetGain);

      const previewOut = ctx.createGain();
      dspDryGain.connect(previewOut);
      dspWetGain.connect(previewOut);

      previewOut.connect(ctx.destination);
      previewSource.connect(splitter);

      applyLiveDSPNodes();

      const startSec = Math.max(0, Math.min(offset, buffer.duration - 0.2));
      previewSource.start(0, startSec);
      previewStartTime = ctx.currentTime - startSec;
      isTesting = true;

      if (instTestLabel) instTestLabel.textContent = 'Остановить прослушивание';
      if (instTestIcon) instTestIcon.innerHTML = '<use href="#icon-pause"></use>';
      if (audioIndicator) audioIndicator.style.opacity = '1';

      previewSource.onended = () => {
        if (isTesting && ctx.currentTime - previewStartTime >= buffer.duration - 0.5) {
          stopStudioPreview();
        }
      };

      function trackLoop() {
        if (!isTesting) return;
        const cur = ctx.currentTime - previewStartTime;
        const dur = buffer.duration;
        if (previewScrubber) {
          const pct = Math.min(100, (cur / dur) * 100);
          previewScrubber.value = pct;
          previewScrubber.style.setProperty('--range-progress', pct + '%');
        }
        if (previewTimeEl) {
          previewTimeEl.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
        }
        previewAnimId = requestAnimationFrame(trackLoop);
      }
      previewAnimId = requestAnimationFrame(trackLoop);
    }

    instTestBtn?.addEventListener('click', () => {
      if (isTesting) {
        stopStudioPreview();
      } else {
        startStudioPreview(0);
      }
    });

    instToggleModeBtn?.addEventListener('click', () => {
      isMinusovActive = !isMinusovActive;
      if (dspDryGain && dspWetGain && previewAudioCtx) {
        const t = previewAudioCtx.currentTime;
        dspDryGain.gain.setValueAtTime(isMinusovActive ? 0.0 : 1.0, t);
        dspWetGain.gain.setValueAtTime(isMinusovActive ? 1.0 : 0.0, t);
      }
      if (instModeLabel) {
        instModeLabel.innerHTML = isMinusovActive ? 'Режим: <strong>Минусовка (DSP)</strong>' : 'Режим: <strong>Оригинал (с голосом)</strong>';
      }
      showToast(isMinusovActive ? 'Включен режим минусовки' : 'Включен оригинальный звук');
    });

    previewScrubber?.addEventListener('input', () => {
      const buffer = activeStudioBuffer || studioAudioBuf;
      if (!buffer) return;
      const targetSec = (Number(previewScrubber.value) / 100) * buffer.duration;
      startStudioPreview(targetSec);
    });

    // ----------------------------------------------------
    // BUILD .OUMP3 CONTAINER
    // ----------------------------------------------------
    document.getElementById('studio-build-oump3-btn')?.addEventListener('click', async () => {
      const title = document.getElementById('studio-title-input')?.value.trim();
      const artist = document.getElementById('studio-artist-input')?.value.trim();

      if (!title || !artist) {
        showToast('Пожалуйста, укажите название трека и артиста на Шаге 1');
        goToStudioStep(1);
        return;
      }
      if (!originalBlob) {
        showToast('Пожалуйста, выберите аудиофайл на Шаге 2');
        goToStudioStep(2);
        return;
      }

      const validLines = lyricsLines.filter((l) => l.text && l.text.trim());
      const lrcText = validLines
        .filter((l) => l.time !== null)
        .map((l) => `[${formatLrcTime(l.time)}]${l.text}`)
        .join('\n');

      const isExplicitChecked = !!document.getElementById('studio-explicit-toggle')?.checked;
      const isInstChecked = !!instToggle?.checked;
      const dspConfig = isInstChecked ? getStudioDSPConfig() : null;

      try {
        const oump3Blob = await buildOump3Container({
          title,
          artist,
          duration: activeStudioBuffer ? activeStudioBuffer.duration : (studioAudioBuf ? studioAudioBuf.duration : 180),
          hasLyrics: !!lrcText,
          isExplicit: isExplicitChecked,
          explicit: isExplicitChecked,
          hasInstrumental: isInstChecked,
          instrumentalConfig: dspConfig,
          thumbBase64,
          audioBlob: trimmedBlob || originalBlob,
          lyricsText: lrcText
        });

        const dl = URL.createObjectURL(oump3Blob);
        const a = document.createElement('a');
        a.href = dl;
        a.download = `${artist} - ${title}.oump3`;
        a.click();
        URL.revokeObjectURL(dl);

        showToast(`Файл "${artist} - ${title}.oump3" успешно собран!`);
      } catch (e) {
        console.error('Build oump3 error:', e);
        alert('Ошибка сборки .oump3: ' + e.message);
      }
    });
  }


  /* Fullscreen Lyrics Overlay & 60 FPS Millisecond Sync Engine */
  let currentParsedLyrics = [];
  let activeLyricIndex = -1;

  function loadLyrics(lrcText, track) {
    currentParsedLyrics = parseLRC(lrcText);
    renderLyricsDisplay();
  }
  window.loadLyrics = loadLyrics;

  function renderLyricsDisplay() {
    const container = document.getElementById('lyrics-scroll-container');
    if (!container) return;
    container.innerHTML = '';
    activeLyricIndex = -1;

    if (currentParsedLyrics.length === 0) {
      container.innerHTML = `
        <div style="color: var(--md-sys-color-outline); font-size: 1.1rem; margin-top: 40px; text-align: center;">
          Текст песни для этого трека отсутствует
        </div>
      `;
      return;
    }

    currentParsedLyrics.forEach((item, index) => {
      const line = document.createElement('div');
      line.className = 'lyric-line';
      line.setAttribute('data-index', index);
      line.textContent = item.text;

      line.addEventListener('click', () => {
        if (window.isQuoteSelectionMode) {
          window.toggleQuoteLineSelect(index, line);
        } else if (item.time !== null) {
          engine.seek(item.time);
          engine.softPlay();
        }
      });

      container.appendChild(line);
    });
  }

  function updateActiveLyric(currentTime) {
    if (currentParsedLyrics.length === 0) return;

    // 3-2-1 Countdown visual before first vocal
    const countdownBanner = document.getElementById('lyrics-countdown-banner');
    const firstTimed = currentParsedLyrics.find((l) => l.time !== null);
    const firstTime = firstTimed ? firstTimed.time : null;
    if (firstTime !== null && currentTime < firstTime && firstTime >= 3.0 && firstTime - currentTime <= 3.0) {
      const remaining = Math.ceil(firstTime - currentTime);
      if (countdownBanner) {
        countdownBanner.textContent = `${remaining}...`;
        countdownBanner.classList.add('visible');
      }
    } else if (countdownBanner) {
      countdownBanner.classList.remove('visible');
    }

    // Locate active index matching current millisecond audio time
    let newIdx = -1;
    for (let i = 0; i < currentParsedLyrics.length; i++) {
      if (currentParsedLyrics[i].time !== null && currentTime >= currentParsedLyrics[i].time) {
        newIdx = i;
      } else if (currentParsedLyrics[i].time !== null) {
        break;
      }
    }

    if (newIdx !== activeLyricIndex && newIdx >= 0) {
      activeLyricIndex = newIdx;
      const container = document.getElementById('lyrics-scroll-container');
      if (!container) return;
      const lines = container.querySelectorAll('.lyric-line');
      lines.forEach((l, idx) => {
        const dist = Math.abs(idx - newIdx);
        l.classList.remove('active', 'near-1', 'near-2', 'distant');
        if (dist === 0) {
          l.classList.add('active');
        } else if (dist === 1) {
          l.classList.add('near-1');
        } else if (dist === 2) {
          l.classList.add('near-2');
        } else {
          l.classList.add('distant');
        }
      });
      if (lines[newIdx]) {
        const lineEl = lines[newIdx];
        const targetY = lineEl.offsetTop - (container.clientHeight / 2) + (lineEl.clientHeight / 2);
        container.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }
  }

  function initLyricsUI() {
    const overlay = document.getElementById('lyrics-overlay');
    const fsOpenBtn = document.getElementById('fs-open-lyrics-btn');
    const closeBtn = document.getElementById('close-lyrics-btn');

    const openKaraoke = async () => {
      if (!currentTrack) return;
      // Populate left showcase
      const coverImg = document.getElementById('lyrics-cover-img');
      const titleEl = document.getElementById('lyrics-track-title');
      const artistEl = document.getElementById('lyrics-track-artist');

      if (coverImg) coverImg.src = currentTrack.coverUrl || currentTrack.thumbBase64 || 'assets/oumusic.png';
      if (titleEl) titleEl.textContent = currentTrack.title || 'Трек';
      if (artistEl) artistEl.textContent = currentTrack.artist || 'Артист';

      // If lyrics not loaded, try retrieving from offline store
      if (currentParsedLyrics.length === 0) {
        const off = await getOfflineTrack(currentTrack.id);
        const lrc = currentTrack.lyricsText || currentTrack.lrcText || (off && (off.lyricsText || off.lrcText)) || '';
        loadLyrics(lrc, currentTrack);
      }

      // Dynamic ambient color palette sampled from cover (matching Yandex Music style)
      try {
        const domHex = await extractCoverDominantColor(currentTrack.coverUrl || currentTrack.thumbBase64);
        let r = 18, g = 60, b = 85; // default rich deep teal/petrol blue
        if (domHex && domHex.startsWith('#')) {
          let h = domHex.replace('#', '');
          if (h.length === 3) h = h.split('').map((c) => c + c).join('');
          r = parseInt(h.substring(0, 2), 16) || r;
          g = parseInt(h.substring(2, 4), 16) || g;
          b = parseInt(h.substring(4, 6), 16) || b;
        }
        if (overlay) {
          overlay.style.background = `radial-gradient(ellipse at 35% 35%, rgba(${Math.round(r * 0.35)}, ${Math.round(g * 0.35)}, ${Math.round(b * 0.4)}, 1) 0%, rgba(${Math.round(r * 0.16)}, ${Math.round(g * 0.16)}, ${Math.round(b * 0.2)}, 1) 55%, #05080E 100%)`;
        }
        const backdrop = document.getElementById('lyrics-glow-backdrop');
        if (backdrop) {
          backdrop.style.background = `radial-gradient(circle at 25% 45%, rgba(${r}, ${g}, ${b}, 0.42) 0%, rgba(${r}, ${g}, ${b}, 0.14) 50%, transparent 80%)`;
        }
        // Keep close chevron clean frosted glass without muddy color tinting
      } catch (e) {}

      overlay?.classList.add('active');
    };

    fsOpenBtn?.addEventListener('click', openKaraoke);
    closeBtn?.addEventListener('click', () => {
      overlay?.classList.remove('active');
    });

    // Seeking on minimalist progress track under cover info
    const progressTrack = document.getElementById('lyrics-progress-track');
    progressTrack?.addEventListener('click', (e) => {
      const rect = progressTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (engine.audioElement.duration) {
        engine.seek(ratio * engine.audioElement.duration);
      }
    });

    // Sync Karaoke screen when track changes
    async function updateKaraokeTrackUI(track) {
      if (!track) return;
      const coverImg = document.getElementById('lyrics-cover-img');
      const titleEl = document.getElementById('lyrics-track-title');
      const artistEl = document.getElementById('lyrics-track-artist');
      const explicitBadge = document.getElementById('lyrics-explicit-badge');
      const vocalBtn = document.getElementById('lyrics-vocal-remover-toggle');

      if (coverImg) coverImg.src = track.coverUrl || track.thumbBase64 || 'assets/oumusic.png';
      if (titleEl) titleEl.textContent = track.title || 'Трек';
      if (artistEl) artistEl.textContent = track.artist || 'Исполнитель';
      if (explicitBadge) explicitBadge.style.display = (track.isExplicit || track.explicit) ? 'inline-block' : 'none';

      // Instrumental / Vocal remover availability
      const hasInst = track.hasInstrumental || track.id === 'seroga_pirat_prosti' || track.id === 'sqwore_barry_dylan';
      if (vocalBtn) {
        if (!hasInst) {
          vocalBtn.style.opacity = '0.45';
          vocalBtn.style.cursor = 'not-allowed';
          vocalBtn.title = 'Минусовка недоступна (не создана автором)';
          vocalBtn.classList.remove('active');
          engine.setVocalRemover(false);
        } else {
          vocalBtn.style.opacity = '1';
          vocalBtn.style.cursor = 'pointer';
          vocalBtn.title = 'Отключить / Включить голос исполнителя';
        }
      }

      // Load lyrics for the new track
      const off = await getOfflineTrack(track.id);
      const lrc = track.lyricsText || track.lrcText || (off && (off.lyricsText || off.lrcText)) || '';
      loadLyrics(lrc, track);

      // Re-extract ambient tint
      try {
        const domHex = await extractCoverDominantColor(track.coverUrl || track.thumbBase64);
        if (domHex) {
          const bg = document.getElementById('lyrics-glow-backdrop');
          if (bg) {
            bg.style.background = `radial-gradient(circle at 30% 40%, ${domHex}88 0%, rgba(139, 92, 246, 0.25) 45%, transparent 75%)`;
          }
        }
      } catch (e) {}
    }
    window.updateKaraokeTrackUI = updateKaraokeTrackUI;

    // Vocal Remover Toggle with Creator Check
    const vocalBtn = document.getElementById('lyrics-vocal-remover-toggle');
    vocalBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const hasInst = !!(currentTrack?.hasInstrumental || currentTrack?.instrumentalConfig || currentTrack?.id === 'seroga_pirat_prosti' || currentTrack?.id === 'sqwore_barry_dylan');
      if (!hasInst) {
        showToast('Для этого трека автор не настроил минусовку');
        return;
      }
      const isAct = !engine.vocalRemoverActive;
      const config = currentTrack?.instrumentalConfig || 'balanced';
      engine.setVocalRemover(isAct, config);
      vocalBtn.classList.toggle('active', isAct);
      showToast(isAct ? 'Минусовка включена (M-Core DSP)' : 'Оригинал с голосом');
    });

    // Karaoke Cover Controls: Play/Pause, Prev, Next
    const ctrlPlay = document.getElementById('lyrics-ctrl-play');
    const ctrlPrev = document.getElementById('lyrics-ctrl-prev');
    const ctrlNext = document.getElementById('lyrics-ctrl-next');

    ctrlPlay?.addEventListener('click', (e) => {
      e.stopPropagation();
      engine.togglePlay();
    });

    ctrlPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      playPreviousTrack();
    });

    ctrlNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      playNextTrack();
    });

    // Update play icon in karaoke cover overlay on play state change
    const origPlayChange = engine.onPlayStateChange;
    engine.onPlayStateChange = (playing) => {
      if (origPlayChange) origPlayChange(playing);
      const lyricsPlayIcon = document.getElementById('lyrics-ctrl-play-icon');
      if (lyricsPlayIcon) {
        lyricsPlayIcon.innerHTML = `<use href="${playing ? '#icon-pause' : '#icon-play'}"></use>`;
      }
    };

    // Timeupdate sync with engine
    engine.audioElement.addEventListener('timeupdate', () => {
      const cur = engine.audioElement.currentTime;
      const dur = engine.audioElement.duration || 1;

      if (overlay?.classList.contains('active')) {
        const fill = document.getElementById('lyrics-progress-fill');
        if (fill) fill.style.width = `${(cur / dur) * 100}%`;
        updateActiveLyric(cur);
      } else if (document.getElementById('fullscreen-player')?.classList.contains('active')) {
        updateActiveLyric(cur);
      }
    });
  }

  /* Profile & Settings UI */
  async function initProfileUI() {
    await updateProfileStats();

    // User Avatar & Profile Management
    const avatarInput = document.getElementById('profile-avatar-file-input');
    const avatarContainer = document.getElementById('profile-avatar-container');
    const editBtn = document.getElementById('edit-profile-btn');
    const nameDisplay = document.getElementById('profile-name-display');

    function syncUserAvatar(url) {
      if (!url) return;
      const topImg = document.getElementById('top-profile-avatar-img');
      const profileImg = document.getElementById('profile-avatar-img');
      const fsImg = document.getElementById('fs-profile-avatar-img');
      const arcImgs = document.querySelectorAll('.arc-profile-avatar-img');
      if (topImg) topImg.src = url;
      if (profileImg) profileImg.src = url;
      if (fsImg) fsImg.src = url;
      arcImgs.forEach((img) => { img.src = url; });
    }
    window.syncUserAvatar = syncUserAvatar;

    function syncUserName(name) {
      if (!name) return;
      if (nameDisplay) nameDisplay.textContent = name;
    }

    try {
      const savedAvatar = localStorage.getItem('oumusic_user_avatar');
      if (savedAvatar) syncUserAvatar(savedAvatar);
      const savedName = localStorage.getItem('oumusic_user_name');
      if (savedName) syncUserName(savedName);
    } catch (e) {}

    avatarContainer?.addEventListener('click', () => avatarInput?.click());
    editBtn?.addEventListener('click', () => {
      const currentName = nameDisplay?.textContent?.trim() || 'Пользователь';
      const newName = prompt('Введите имя пользователя:', currentName);
      if (newName !== null && newName.trim() !== '') {
        const val = newName.trim();
        syncUserName(val);
        try { localStorage.setItem('oumusic_user_name', val); } catch (e) {}
      }
    });

    avatarInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          try { localStorage.setItem('oumusic_user_avatar', dataUrl); } catch (err) {}
          syncUserAvatar(dataUrl);
          showToast('Аватар профиля успешно обновлен');
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('clear-history-btn')?.addEventListener('click', () => {
      alert('История прослушиваний очищена.');
    });

    // 10-Clicks Safety Easter Egg for Full Cache & DB Wipe
    const clearCacheBtn = document.getElementById('settings-clear-cache-btn');
    const clearCacheBtnText = document.getElementById('clear-cache-btn-text');
    const clearCacheHint = document.getElementById('clear-cache-hint');
    const clearCacheDialog = document.getElementById('clear-cache-confirm-dialog');
    const cancelClearCacheBtn = document.getElementById('cancel-clear-cache-btn');
    const executeClearCacheBtn = document.getElementById('execute-clear-cache-btn');

    let cacheClicks = 0;
    let lastCacheClickTime = 0;

    clearCacheBtn?.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastCacheClickTime > 3500) {
        cacheClicks = 0;
      }
      lastCacheClickTime = now;
      cacheClicks++;

      if (cacheClicks < 10) {
        const remaining = 10 - cacheClicks;
        if (clearCacheBtnText) clearCacheBtnText.textContent = `Очистить весь кэш (Осталось нажать: ${remaining})`;
        if (clearCacheHint) clearCacheHint.textContent = `Нажмите еще ${remaining} раз(а) для подтверждения!`;
      } else {
        cacheClicks = 0;
        if (clearCacheBtnText) clearCacheBtnText.textContent = 'Очистить весь кэш (Нажмите 10 раз)';
        if (clearCacheHint) clearCacheHint.textContent = 'Быстро нажмите кнопку 10 раз для вызова подтверждения';
        clearCacheDialog?.classList.add('active');
      }
    });

    cancelClearCacheBtn?.addEventListener('click', () => {
      clearCacheDialog?.classList.remove('active');
    });

    executeClearCacheBtn?.addEventListener('click', async () => {
      clearCacheDialog?.classList.remove('active');
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if (dbInstance) {
          dbInstance.close();
        }
        await new Promise((resolve) => {
          const req = indexedDB.deleteDatabase('oumusic_db');
          req.onsuccess = resolve;
          req.onerror = resolve;
          req.onblocked = resolve;
        });
        localStorage.clear();
        sessionStorage.clear();
        alert('Все кэши и локальные данные успешно очищены! Приложение будет перезагружено.');
        window.location.reload();
      } catch (err) {
        alert('Ошибка при очистке кэша: ' + err.message);
      }
    });
  }

  async function updateProfileStats() {
    const stats = await getStats();
    const m = document.getElementById('stat-month-hours');
    const a = document.getElementById('stat-all-hours');
    if (m) m.textContent = `${stats.monthHours} ч`;
    if (a) a.textContent = `${stats.allTimeHours} ч`;
  }

  function initSettingsUI() {
    // Theme toggle with instant persistence
    const darkBtn = document.getElementById('theme-dark-btn');
    const lightBtn = document.getElementById('theme-light-btn');
    const amoledToggle = document.getElementById('amoled-toggle');
    const liquidGlassToggle = document.getElementById('liquid-glass-toggle');

    const amoledLabel = amoledToggle?.closest('label');

    function syncAmoledAvailability(isDark) {
      if (!amoledToggle) return;
      if (!isDark) {
        // In Light Theme, AMOLED is strictly disabled
        amoledToggle.checked = false;
        amoledToggle.disabled = true;
        document.documentElement.setAttribute('data-amoled', 'false');
        try { localStorage.setItem('oumusic_amoled', 'false'); } catch (e) {}
        if (amoledLabel) {
          amoledLabel.style.opacity = '0.38';
          amoledLabel.style.pointerEvents = 'none';
          amoledLabel.title = 'AMOLED доступен только в тёмной теме';
        }
      } else {
        amoledToggle.disabled = false;
        if (amoledLabel) {
          amoledLabel.style.opacity = '1';
          amoledLabel.style.pointerEvents = 'auto';
          amoledLabel.title = '';
        }
        const savedAm = (typeof localStorage !== 'undefined') ? localStorage.getItem('oumusic_amoled') : null;
        if (savedAm === 'true') {
          amoledToggle.checked = true;
          document.documentElement.setAttribute('data-amoled', 'true');
        }
      }
    }

    darkBtn?.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      darkBtn.classList.add('active');
      lightBtn?.classList.remove('active');
      try { localStorage.setItem('oumusic_theme', 'dark'); } catch (e) {}
      syncAmoledAvailability(true);
      if (window.syncSpectrumColors) window.syncSpectrumColors();
    });

    lightBtn?.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      lightBtn.classList.add('active');
      darkBtn?.classList.remove('active');
      try { localStorage.setItem('oumusic_theme', 'light'); } catch (e) {}
      syncAmoledAvailability(false);
      if (window.syncSpectrumColors) window.syncSpectrumColors();
    });

    amoledToggle?.addEventListener('change', () => {
      const curTheme = document.documentElement.getAttribute('data-theme');
      if (curTheme === 'light') {
        amoledToggle.checked = false;
        return;
      }
      const isAm = amoledToggle.checked;
      document.documentElement.setAttribute('data-amoled', isAm ? 'true' : 'false');
      try { localStorage.setItem('oumusic_amoled', isAm ? 'true' : 'false'); } catch (e) {}
    });

    liquidGlassToggle?.addEventListener('change', () => {
      const isGlass = liquidGlassToggle.checked;
      document.documentElement.setAttribute('data-liquid-glass', isGlass ? 'true' : 'false');
      try { localStorage.setItem('oumusic_liquid_glass', isGlass ? 'true' : 'false'); } catch (e) {}
    });

    // Font size selector
    document.querySelectorAll('[data-fontsize]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-fontsize]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const size = btn.getAttribute('data-fontsize') || 'medium';
        document.documentElement.setAttribute('data-font-size', size);
        try { localStorage.setItem('oumusic_font_size', size); } catch (e) {}
      });
    });

    // Accent Color System & Custom Palette Picker
    function applyAccentColor(colorHex, isAdaptive = false) {
      window.applyAccentColor = applyAccentColor;
      if (!colorHex) return;
      const root = document.documentElement;
      root.style.setProperty('--md-sys-color-primary', colorHex);
      root.style.setProperty('--glow-accent', colorHex);

      let hex = colorHex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
      const r = parseInt(hex.substring(0, 2), 16) || 139;
      const g = parseInt(hex.substring(2, 4), 16) || 92;
      const b = parseInt(hex.substring(4, 6), 16) || 246;

      root.style.setProperty('--md-sys-color-primary-container', `rgba(${r}, ${g}, ${b}, 0.28)`);
      root.style.setProperty('--md-sys-color-on-primary-container', `rgba(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)}, 1)`);
      root.style.setProperty('--glow-color-1', `rgba(${r}, ${g}, ${b}, 0.45)`);
      if (window.syncSpectrumColors) window.syncSpectrumColors();

      try {
        localStorage.setItem('oumusic_accent_color', colorHex);
      } catch (e) {}

      let matchedPreset = false;
      document.querySelectorAll('#accent-colors-row .accent-color-circle[data-color]').forEach((btn) => {
        const btnColor = btn.getAttribute('data-color');
        if (btnColor && btnColor.toLowerCase() === colorHex.toLowerCase() && !isAdaptive) {
          btn.classList.add('active');
          btn.style.borderColor = '#FFFFFF';
          matchedPreset = true;
        } else {
          btn.classList.remove('active');
          btn.style.borderColor = 'transparent';
        }
      });

      const customBtn = document.getElementById('custom-accent-btn');
      if (customBtn) {
        if (!matchedPreset && !isAdaptive) {
          customBtn.classList.add('active');
          customBtn.style.borderColor = '#FFFFFF';
          customBtn.style.boxShadow = `0 0 14px ${colorHex}`;
        } else {
          customBtn.classList.remove('active');
          customBtn.style.borderColor = 'transparent';
          customBtn.style.boxShadow = 'none';
        }
      }
    }

    // Adaptive Accent Color Button
    const adaptiveBtn = document.getElementById('adaptive-accent-btn');
    adaptiveBtn?.addEventListener('click', async () => {
      try { localStorage.setItem('oumusic_accent_adaptive', 'true'); } catch (e) {}
      adaptiveBtn.classList.add('active');

      document.querySelectorAll('#accent-colors-row .accent-color-circle[data-color]').forEach((b) => {
        b.classList.remove('active');
        b.style.borderColor = 'transparent';
      });

      if (currentTrack) {
        const dom = await extractCoverDominantColor(currentTrack.coverUrl || currentTrack.thumbBase64);
        applyAccentColor(dom, true);
      }
      alert('Включен адаптивный цвет! Интерфейс и нижняя панель плеера автоматически подстраиваются под цвета обложки.');
    });

    // Connect preset circles
    document.querySelectorAll('#accent-colors-row .accent-color-circle[data-color]').forEach((btn) => {
      btn.addEventListener('click', () => {
        try { localStorage.setItem('oumusic_accent_adaptive', 'false'); } catch (e) {}
        adaptiveBtn?.classList.remove('active');
        const c = btn.getAttribute('data-color');
        if (c) applyAccentColor(c);
      });
    });

    // Custom palette button & picker
    const customAccentBtn = document.getElementById('custom-accent-btn');
    const customColorPicker = document.getElementById('custom-accent-color-picker');

    customAccentBtn?.addEventListener('click', () => customColorPicker?.click());
    customColorPicker?.addEventListener('input', (e) => {
      try { localStorage.setItem('oumusic_accent_adaptive', 'false'); } catch (err) {}
      adaptiveBtn?.classList.remove('active');
      applyAccentColor(e.target.value);
    });
    customColorPicker?.addEventListener('change', (e) => {
      try { localStorage.setItem('oumusic_accent_adaptive', 'false'); } catch (err) {}
      adaptiveBtn?.classList.remove('active');
      applyAccentColor(e.target.value);
    });

    // --- RESTORE ALL SAVED SETTINGS ---
    try {
      // 1. Theme
      const savedTheme = localStorage.getItem('oumusic_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (savedTheme === 'light') {
        lightBtn?.classList.add('active');
        darkBtn?.classList.remove('active');
        syncAmoledAvailability(false);
      if (window.syncSpectrumColors) window.syncSpectrumColors();
      } else {
        darkBtn?.classList.add('active');
        lightBtn?.classList.remove('active');
        syncAmoledAvailability(true);
      if (window.syncSpectrumColors) window.syncSpectrumColors();
      }

      // 2. AMOLED
      const savedAmoled = localStorage.getItem('oumusic_amoled') === 'true';
      if (amoledToggle) amoledToggle.checked = savedAmoled;
      document.documentElement.setAttribute('data-amoled', savedAmoled ? 'true' : 'false');

      // 3. Liquid Glass
      const savedGlass = localStorage.getItem('oumusic_liquid_glass') === 'true';
      if (liquidGlassToggle) liquidGlassToggle.checked = savedGlass;
      document.documentElement.setAttribute('data-liquid-glass', savedGlass ? 'true' : 'false');

      // 4. Font size
      const savedFontSize = localStorage.getItem('oumusic_font_size') || 'medium';
      document.documentElement.setAttribute('data-font-size', savedFontSize);
      document.querySelectorAll('[data-fontsize]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-fontsize') === savedFontSize);
      });

      // 5. Adaptive vs Custom Accent
      const isAdaptive = localStorage.getItem('oumusic_accent_adaptive') === 'true';
      const savedColor = localStorage.getItem('oumusic_accent_color');
      if (savedColor) {
        applyAccentColor(savedColor, isAdaptive);
      }
      if (isAdaptive) {
        adaptiveBtn?.classList.add('active');
      }

      // Vocal depth setting wireup
      const vocalDepthSelect = document.getElementById('setting-vocal-depth');
      if (vocalDepthSelect) {
        const savedDepth = localStorage.getItem('oumusic_vocal_depth') || 'balanced';
        vocalDepthSelect.value = savedDepth;
        vocalDepthSelect.addEventListener('change', () => {
          const val = vocalDepthSelect.value;
          try { localStorage.setItem('oumusic_vocal_depth', val); } catch (e) {}
          if (engine.vocalRemoverActive) {
            engine.setVocalRemover(true, val);
          }
        });
      }
    } catch (e) {}

    // Normalizer switch
    const normToggle = document.getElementById('normalizer-toggle');
    const normSlider = document.getElementById('normalizer-level-slider');
    const normLabel = document.getElementById('normalizer-level-label');
    const normGroup = document.getElementById('normalizer-level-group');

    function updateNormGroupState() {
      const active = normToggle ? normToggle.checked : true;
      if (normGroup) {
        normGroup.style.opacity = active ? '1' : '0.4';
        normGroup.style.pointerEvents = active ? 'auto' : 'none';
      }
    }

    normToggle?.addEventListener('change', () => {
      const active = normToggle.checked;
      const level = normSlider ? parseInt(normSlider.value, 10) || 85 : 85;
      engine.setNormalizer(active, level);
      updateNormGroupState();
      try { localStorage.setItem('oumusic_normalizer', active ? 'true' : 'false'); } catch (e) {}
    });

    normSlider?.addEventListener('input', () => {
      const val = parseInt(normSlider.value, 10) || 85;
      if (normLabel) normLabel.textContent = `${val}%`;
      engine.setNormalizer(normToggle ? normToggle.checked : true, val);
      try { localStorage.setItem('oumusic_normalizer_level', String(val)); } catch (e) {}
    });

    try {
      const savedNorm = localStorage.getItem('oumusic_normalizer');
      const savedLevel = localStorage.getItem('oumusic_normalizer_level');
      if (savedLevel && normSlider) {
        normSlider.value = savedLevel;
        if (normLabel) normLabel.textContent = `${savedLevel}%`;
      }
      if (savedNorm !== null && normToggle) {
        normToggle.checked = (savedNorm === 'true');
      }
      const active = normToggle ? normToggle.checked : true;
      const level = normSlider ? parseInt(normSlider.value, 10) || 85 : 85;
      engine.setNormalizer(active, level);
      updateNormGroupState();
    } catch (e) {}

    // Crossfade slider
    const crossfadeSlider = document.getElementById('crossfade-slider');
    const crossfadeLabel = document.getElementById('crossfade-value-label');
    crossfadeSlider?.addEventListener('input', () => {
      const v = crossfadeSlider.value;
      if (crossfadeLabel) crossfadeLabel.textContent = `${v} сек`;
      try { localStorage.setItem('oumusic_crossfade', v); } catch (e) {}
    });
    try {
      const savedCross = localStorage.getItem('oumusic_crossfade');
      if (savedCross !== null && crossfadeSlider) {
        crossfadeSlider.value = savedCross;
        if (crossfadeLabel) crossfadeLabel.textContent = `${savedCross} сек`;
      }
    } catch (e) {}

    // Lossless Quality Mode Toggle
    const losslessToggle = document.getElementById('setting-lossless-toggle');
    const eqBox = document.getElementById('equalizer-settings-box');
    const losslessBanner = document.getElementById('lossless-active-banner');

    function applyLosslessUI(isLossless) {
      if (losslessToggle) losslessToggle.checked = isLossless;
      if (eqBox) eqBox.style.display = isLossless ? 'none' : 'block';
      if (losslessBanner) losslessBanner.style.display = isLossless ? 'block' : 'none';
      engine.setLosslessMode(isLossless);
    }

    losslessToggle?.addEventListener('change', () => {
      const active = losslessToggle.checked;
      applyLosslessUI(active);
      try { localStorage.setItem('oumusic_lossless_mode', active ? 'true' : 'false'); } catch (e) {}
    });

    try {
      const savedLossless = localStorage.getItem('oumusic_lossless_mode') === 'true';
      if (savedLossless) {
        applyLosslessUI(true);
      }
    } catch (e) {}

    // 5-Band Equalizer Presets & Default Reset
    const eqSelect = document.getElementById('eq-presets-select');
    const eqResetBtn = document.getElementById('eq-reset-btn');
    const eqSliders = document.querySelectorAll('.eq-band');

    function updateEQSliders(gains) {
      eqSliders.forEach((slider) => {
        const band = parseInt(slider.getAttribute('data-band'), 10);
        if (!isNaN(band) && gains[band] !== undefined) {
          slider.value = gains[band];
        }
      });
    }

    eqSelect?.addEventListener('change', () => {
      const preset = eqSelect.value;
      engine.ensureContext();
      const gains = engine.applyEQPreset(preset);
      updateEQSliders(gains);
      try { localStorage.setItem('oumusic_eq_preset', preset); } catch (e) {}
    });

    eqResetBtn?.addEventListener('click', () => {
      engine.ensureContext();
      const gains = engine.applyEQPreset('flat');
      if (eqSelect) eqSelect.value = 'flat';
      updateEQSliders(gains);
      try { localStorage.setItem('oumusic_eq_preset', 'flat'); } catch (e) {}
    });

    eqSliders.forEach((slider) => {
      slider.addEventListener('input', () => {
        const band = parseInt(slider.getAttribute('data-band'), 10);
        const val = parseFloat(slider.value);
        engine.ensureContext();
        engine.setEQBand(band, val);
        if (eqSelect) eqSelect.value = 'custom';
        try { localStorage.setItem('oumusic_eq_preset', 'custom'); } catch (e) {}
      });
    });

    try {
      const savedEq = localStorage.getItem('oumusic_eq_preset');
      if (savedEq && eqSelect) {
        eqSelect.value = savedEq;
        if (savedEq !== 'custom') {
          const gains = engine.applyEQPreset(savedEq);
          updateEQSliders(gains);
        }
      }
    } catch (e) {}

    // Docs dialog
    const docsDialog = document.getElementById('mcore-docs-dialog');
    document.getElementById('open-mcore-docs-btn')?.addEventListener('click', () => docsDialog?.classList.add('active'));
    document.getElementById('mcore-docs-close-btn')?.addEventListener('click', () => docsDialog?.classList.remove('active'));

    // AI spec download
    document.getElementById('download-ai-spec-btn')?.addEventListener('click', () => {
      const txt = 'M-Core Engine & .oump3 Specification\nAuthor: oulan1 (neketke24@gmail.com)\n\nPure Vanilla HTML5/CSS3/Web Audio API PWA for GitHub Pages.';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
      a.download = 'M-Core_Spec.txt';
      a.click();
    });
  }

  /* Library Tabs Renderers */
  async function renderLikesTab() {
    const list = document.getElementById('likes-tracks-list');
    if (!list) return;
    const likes = await getAllLikes();
    const likedIds = new Set(likes.map((l) => l.id));
    const likedTracks = catalogTracks.filter((t) => likedIds.has(t.id));

    list.innerHTML = '';
    if (likedTracks.length === 0) {
      list.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--md-sys-color-outline);">Нет понравившихся треков</div>';
      return;
    }
    likedTracks.forEach((t) => {
      list.appendChild(createTrackRow(t, () => playTrack(t)));
    });
  }

  async function renderDownloadsTab() {
    const list = document.getElementById('downloads-tracks-list');
    if (!list) return;
    const all = await getAllTracksMetadata();
    const offline = all.filter((t) => t.isLocal);

    list.innerHTML = '';
    if (offline.length === 0) {
      list.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--md-sys-color-outline);">Нет скачанных оффлайн треков</div>';
      return;
    }
    offline.forEach((t) => {
      list.appendChild(createTrackRow(t, () => playTrack(t)));
    });
  }

  /* Artist Screen */
  function renderArtistScreen(artistName) {
    const clean = artistName.trim();
    document.getElementById('artist-name-title').textContent = clean;
    const isVer = isArtistVerified(clean);
    const verBadge = document.getElementById('artist-verified-badge');
    if (verBadge) verBadge.style.display = isVer ? 'inline-flex' : 'none';

    // Initials & clean graphics without dummy logos
    const initials = clean.slice(0, 2).toUpperCase() || 'AR';
    const initialsEl = document.getElementById('artist-avatar-initials');
    if (initialsEl) initialsEl.textContent = initials;

    const bannerImg = document.getElementById('artist-banner-img');
    const avatarImg = document.getElementById('artist-avatar-img');

    const artistRecord = verifiedArtists.get(clean.toLowerCase());

    if (bannerImg) {
      if (artistRecord && artistRecord.bannerUrl) {
        bannerImg.src = artistRecord.bannerUrl;
        bannerImg.style.display = 'block';
      } else {
        bannerImg.style.display = 'none'; // Sleek dark gradient banner shines
      }
    }

    if (avatarImg) {
      if (artistRecord && artistRecord.avatarUrl) {
        avatarImg.src = artistRecord.avatarUrl;
        avatarImg.style.display = 'block';
        if (initialsEl) initialsEl.style.display = 'none';
      } else {
        avatarImg.style.display = 'none';
        if (initialsEl) initialsEl.style.display = 'block';
      }
    }

    // Artist of the month wins display
    const winsCont = document.getElementById('artist-month-wins-container');
    if (winsCont) {
      if (artistRecord && artistRecord.monthlyWins > 0) {
        const w = artistRecord.monthlyWins;
        const word = w === 1 ? 'раз' : (w >= 2 && w <= 4 ? 'раза' : 'раз');
        winsCont.innerHTML = `<div class="artist-wins-badge">🏆 Победитель «Артист месяца»: <strong>${w} ${word}</strong></div>`;
      } else {
        winsCont.innerHTML = '';
      }
    }

    const list = document.getElementById('artist-tracks-list');
    if (!list) return;
    list.innerHTML = '';

    const artistTracks = catalogTracks.filter((t) => {
      return (t.artist || '').toLowerCase().includes(clean.toLowerCase());
    });

    const counter = document.getElementById('artist-tracks-counter');
    if (counter) counter.textContent = `${artistTracks.length} треков на платформе`;

    artistTracks.forEach((t) => {
      list.appendChild(createTrackRow(t, () => playTrack(t)));
    });

    document.getElementById('artist-play-all-btn')?.addEventListener('click', () => {
      if (artistTracks.length > 0) {
        playbackQueue = artistTracks;
        playTrack(artistTracks[0]);
      }
    });
  }
  window.renderArtistScreen = renderArtistScreen;

  /* Additional UI Handlers: Importer, Queue, Sleep, Quote, Recap, Upload */
  function initAdditionalUI() {
    // 1. TuneMyMusic dialog
    const tuneDialog = document.getElementById('tunemymusic-dialog');
    document.getElementById('lib-import-tunemymusic-btn')?.addEventListener('click', () => {
      tuneDialog?.classList.add('active');
    });
    document.getElementById('tunemymusic-close-btn')?.addEventListener('click', () => {
      tuneDialog?.classList.remove('active');
    });
    const tuneInput = document.getElementById('tunemymusic-file-input');
    document.getElementById('tunemymusic-choose-file-btn')?.addEventListener('click', () => {
      tuneInput?.click();
    });

    // 2. Playback Queue sheet
    const queueBackdrop = document.getElementById('queue-backdrop');
    const queueSheet = document.getElementById('queue-sheet');
    document.getElementById('fs-open-queue-btn')?.addEventListener('click', () => {
      queueBackdrop?.classList.add('active');
      queueSheet?.classList.add('active');
      renderQueueListUI();
    });
    const closeQueue = () => {
      queueBackdrop?.classList.remove('active');
      queueSheet?.classList.remove('active');
    };
    document.getElementById('close-queue-btn')?.addEventListener('click', closeQueue);
    queueBackdrop?.addEventListener('click', (e) => {
      if (e.target === queueBackdrop) closeQueue();
    });
    document.getElementById('queue-clear-btn')?.addEventListener('click', () => {
      playbackQueue = [];
      queueIndex = -1;
      renderQueueListUI();
      alert('Очередь воспроизведения полностью очищена.');
    });

    // 3. Sleep Timer sheet
    const sleepBackdrop = document.getElementById('sleep-timer-backdrop');
    const sleepSheet = document.getElementById('sleep-timer-sheet');
    document.getElementById('fs-sleep-timer-btn')?.addEventListener('click', () => {
      sleepBackdrop?.classList.add('active');
      sleepSheet?.classList.add('active');
    });
    const closeSleep = () => {
      sleepBackdrop?.classList.remove('active');
      sleepSheet?.classList.remove('active');
    };
    document.getElementById('close-sleep-timer-btn')?.addEventListener('click', closeSleep);
    sleepBackdrop?.addEventListener('click', (e) => {
      if (e.target === sleepBackdrop) closeSleep();
    });
    sleepSheet?.querySelectorAll('[data-timer-mins]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-timer-mins');
        engine.setSleepTimer(mode);
        closeSleep();
        alert('Таймер сна: ' + btn.textContent.trim());
      });
    });

    // 4. Interactive Lyric Quote Sharing
    const quoteDialog = document.getElementById('quote-card-dialog');
    window.selectedQuoteIndices = new Set();
    window.isQuoteSelectionMode = false;

    function populateQuoteLinesSelector() {
      const container = document.getElementById('quote-lines-selector');
      if (!container) return;
      container.innerHTML = '';

      if (!currentParsedLyrics || currentParsedLyrics.length === 0) {
        container.innerHTML = '<div style="font-size: 0.85rem; color: var(--md-sys-color-outline); padding: 8px;">У этого трека нет текста</div>';
        return;
      }

      currentParsedLyrics.forEach((line, idx) => {
        if (!line.text || !line.text.trim()) return;
        const label = document.createElement('label');
        label.className = 'quote-line-item';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '10px';
        label.style.padding = '8px 12px';
        label.style.borderRadius = '10px';
        label.style.cursor = 'pointer';
        label.style.background = window.selectedQuoteIndices.has(idx) ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)';
        label.style.border = window.selectedQuoteIndices.has(idx) ? '1px solid var(--md-sys-color-primary)' : '1px solid rgba(255, 255, 255, 0.08)';
        label.style.transition = 'all 0.2s';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = window.selectedQuoteIndices.has(idx);
        checkbox.style.accentColor = 'var(--md-sys-color-primary)';
        checkbox.style.cursor = 'pointer';

        const span = document.createElement('span');
        span.textContent = line.text;
        span.style.fontSize = '0.9rem';
        span.style.color = '#FFFFFF';
        span.style.flex = '1';

        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            if (window.selectedQuoteIndices.size >= 5) {
              alert('Можно выбрать максимум 5 строк для карточки цитаты.');
              checkbox.checked = false;
              return;
            }
            window.selectedQuoteIndices.add(idx);
            label.style.background = 'rgba(139, 92, 246, 0.25)';
            label.style.border = '1px solid var(--md-sys-color-primary)';
          } else {
            window.selectedQuoteIndices.delete(idx);
            label.style.background = 'rgba(255, 255, 255, 0.05)';
            label.style.border = '1px solid rgba(255, 255, 255, 0.08)';
          }
          const lyricEl = document.querySelector(`.lyric-line[data-index="${idx}"]`);
          if (lyricEl) lyricEl.classList.toggle('quote-selected', checkbox.checked);
          renderQuoteCanvasPreview();
        });

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
      });
    }

    window.toggleQuoteLineSelect = (idx, el) => {
      if (window.selectedQuoteIndices.has(idx)) {
        window.selectedQuoteIndices.delete(idx);
        el.classList.remove('quote-selected');
      } else {
        if (window.selectedQuoteIndices.size >= 5) {
          alert('Можно выбрать максимум 5 строк для цитаты.');
          return;
        }
        window.selectedQuoteIndices.add(idx);
        el.classList.add('quote-selected');
      }
      populateQuoteLinesSelector();
      renderQuoteCanvasPreview();
    };

    const openQuoteModal = () => {
      window.isQuoteSelectionMode = true;
      if (window.selectedQuoteIndices.size === 0 && currentParsedLyrics.length > 0) {
        const start = Math.max(0, activeLyricIndex >= 0 ? activeLyricIndex : 0);
        window.selectedQuoteIndices.add(start);
        if (currentParsedLyrics[start + 1]) window.selectedQuoteIndices.add(start + 1);
      }
      populateQuoteLinesSelector();
      quoteDialog?.classList.add('active');
      renderQuoteCanvasPreview();
    };
    window.openQuoteModal = openQuoteModal;

    document.getElementById('lyrics-share-quote-btn')?.addEventListener('click', openQuoteModal);
    document.getElementById('fs-share-track-btn')?.addEventListener('click', openQuoteModal);

    document.getElementById('quote-dialog-close-btn')?.addEventListener('click', () => {
      quoteDialog?.classList.remove('active');
      window.isQuoteSelectionMode = false;
      window.selectedQuoteIndices.clear();
      document.querySelectorAll('.lyric-line.quote-selected').forEach((el) => el.classList.remove('quote-selected'));
    });

    document.getElementById('quote-download-btn')?.addEventListener('click', () => {
      const c = document.getElementById('quote-render-canvas');
      if (!c) return;
      const a = document.createElement('a');
      a.download = `quote_${currentTrack?.artist || 'artist'}_${currentTrack?.title || 'track'}.png`;
      a.href = c.toDataURL('image/png');
      a.click();
    });

    document.getElementById('quote-share-btn')?.addEventListener('click', async () => {
      const lines = Array.from(window.selectedQuoteIndices)
        .sort((a, b) => a - b)
        .map((i) => currentParsedLyrics[i]?.text)
        .filter(Boolean);

      const text = `“${lines.join('\n')}”\n\n— ${currentTrack?.artist || 'Артист'} «${currentTrack?.title || 'Трек'}» на ouMusic`;
      if (navigator.share) {
        try {
          await navigator.share({ title: currentTrack?.title || 'ouMusic', text, url: window.location.href });
        } catch (e) {}
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert('Цитата скопирована в буфер обмена!');
      }
    });

    // 4.1 Release Application Modal (@ouMusicRobot)
    const releaseModal = document.getElementById('release-apply-modal');
    document.getElementById('open-release-apply-btn')?.addEventListener('click', () => {
      releaseModal?.classList.add('active');
    });
    document.getElementById('release-apply-close-btn')?.addEventListener('click', () => {
      releaseModal?.classList.remove('active');
    });
    document.getElementById('release-apply-tg-btn')?.addEventListener('click', () => {
      window.open('https://t.me/ouMusicRobot', '_blank');
    });
    releaseModal?.addEventListener('click', (e) => {
      if (e.target === releaseModal) releaseModal.classList.remove('active');
    });

    // 4.2 Secret Moderation Room (20 Rapid Taps on Studio)
    let studioSecretTapCount = 0;
    let studioSecretTimer = null;
    const triggerStudioSecret = () => {
      const curMod = document.getElementById('moderation-modal');
      if (curMod && curMod.classList.contains('active')) return; // Freeze clicks when modal is already active
      studioSecretTapCount++;
      clearTimeout(studioSecretTimer);
      studioSecretTimer = setTimeout(() => { studioSecretTapCount = 0; }, 1000);
      if (studioSecretTapCount >= 20) {
        studioSecretTapCount = 0;
        openModerationPanel();
      }
    };

    document.querySelectorAll('[data-nav="studio"], #tab-studio, #studio-header-title').forEach((el) => {
      el.addEventListener('click', triggerStudioSecret);
    });

    function openModerationPanel() {
      const modModal = document.getElementById('moderation-modal');
      modModal?.classList.add('active');
    }

    const modModal = document.getElementById('moderation-modal');
    const modFileInput = document.getElementById('mod-file-input');
    const modDropzone = document.getElementById('mod-dropzone');
    const modCloseBtn = document.getElementById('mod-close-btn');
    const modApproveBtn = document.getElementById('mod-approve-btn');
    const modRejectBtn = document.getElementById('mod-reject-btn');
    const modReviewArea = document.getElementById('mod-review-area');

    let modUnpackedData = null;
    let modAudioElement = new Audio();

    modDropzone?.addEventListener('click', () => modFileInput?.click());
    modCloseBtn?.addEventListener('click', () => {
      modAudioElement.pause();
      modModal?.classList.remove('active');
    });
    // Never close moderation modal on backdrop/empty space click - user must click mod-close-btn explicitly!

    modFileInput?.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          const buf = await file.arrayBuffer();
          modUnpackedData = await unpackOump3Full(buf);
          modReviewArea.style.display = 'block';
          modApproveBtn.style.display = 'inline-flex';
          modRejectBtn.style.display = 'inline-flex';

          document.getElementById('mod-title').textContent = modUnpackedData.meta.title || file.name;
          document.getElementById('mod-artist').textContent = modUnpackedData.meta.artist || 'Неизвестный исполнитель';
          const coverImg = document.getElementById('mod-cover-img');
          if (coverImg) {
            coverImg.src = modUnpackedData.coverBlob ? URL.createObjectURL(modUnpackedData.coverBlob) : (modUnpackedData.meta.thumbBase64 || 'assets/oumusic.png');
          }

          const genresContainer = document.getElementById('mod-genres');
          if (genresContainer) {
            genresContainer.innerHTML = '';
            (modUnpackedData.meta.genres || []).forEach((g) => {
              const span = document.createElement('span');
              span.className = 'chip';
              span.style.padding = '2px 8px';
              span.style.fontSize = '0.7rem';
              span.textContent = g;
              genresContainer.appendChild(span);
            });
          }

          // Audio
          if (modUnpackedData.audioBlob) {
            modAudioElement.src = URL.createObjectURL(modUnpackedData.audioBlob);
            modAudioElement.load();
          }

          // Lyrics synchronized stream
          const parsedLrc = parseLRC(modUnpackedData.lyricsText || '');
          const stream = document.getElementById('mod-lyrics-stream');
          if (stream) {
            stream.innerHTML = '';
            if (parsedLrc.length === 0) {
              stream.innerHTML = '<span style="color: var(--md-sys-color-outline); padding: 12px;">Текст песни отсутствует в контейнере</span>';
            } else {
              parsedLrc.forEach((l, idx) => {
                const row = document.createElement('div');
                row.className = 'mod-lyric-row';
                row.setAttribute('data-time', l.time);
                row.style.padding = '4px 8px';
                row.style.borderRadius = '6px';
                row.style.transition = 'background 0.2s, color 0.2s';
                row.innerHTML = `<span style="color: var(--md-sys-color-primary); margin-right: 8px;">[${formatLrcTime(l.time)}]</span><span>${l.text}</span>`;
                row.addEventListener('click', () => {
                  if (l.time !== null) {
                    modAudioElement.currentTime = l.time;
                    modAudioElement.play();
                  }
                });
                stream.appendChild(row);
              });
            }
          }
        } catch (err) {
          alert('Ошибка чтения .oump3 контейнера: ' + err.message);
        }
      }
    });

    const modPlayBtn = document.getElementById('mod-play-btn');
    const modTime = document.getElementById('mod-time');
    const modSeeker = document.getElementById('mod-seeker');

    modPlayBtn?.addEventListener('click', () => {
      if (modAudioElement.paused) {
        modAudioElement.play();
        modPlayBtn.innerHTML = '<svg class="svg-icon" style="width: 14px; height: 14px;"><use href="#icon-pause"></use></svg><span>Пауза</span>';
      } else {
        modAudioElement.pause();
        modPlayBtn.innerHTML = '<svg class="svg-icon" style="width: 14px; height: 14px;"><use href="#icon-play"></use></svg><span>Слушать</span>';
      }
    });

    modAudioElement.addEventListener('timeupdate', () => {
      const cur = modAudioElement.currentTime;
      const dur = modAudioElement.duration || 1;
      if (modTime) modTime.textContent = `${formatSec(cur)} / ${formatSec(dur)}`;
      if (modSeeker) modSeeker.value = (cur / dur) * 100;

      // Sync active lyric line in moderation review
      const rows = document.querySelectorAll('#mod-lyrics-stream .mod-lyric-row');
      let activeRow = null;
      rows.forEach((r) => {
        const t = parseFloat(r.getAttribute('data-time'));
        if (!isNaN(t) && t <= cur) activeRow = r;
        r.style.background = 'transparent';
        r.style.color = 'inherit';
        r.style.fontWeight = 'normal';
      });
      if (activeRow) {
        activeRow.style.background = 'rgba(139, 92, 246, 0.25)';
        activeRow.style.color = '#FFFFFF';
        activeRow.style.fontWeight = 'bold';
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    modSeeker?.addEventListener('input', () => {
      if (modAudioElement.duration) {
        modAudioElement.currentTime = (modSeeker.value / 100) * modAudioElement.duration;
      }
    });

    modApproveBtn?.addEventListener('click', async () => {
      if (!modUnpackedData) return;
      modAudioElement.pause();
      const id = 'mod_' + Date.now();
      const meta = {
        id,
        filename: `${modUnpackedData.meta.artist} - ${modUnpackedData.meta.title}.oump3`,
        title: modUnpackedData.meta.title || 'Трек',
        artist: modUnpackedData.meta.artist || 'Артист',
        duration: modUnpackedData.meta.duration || modAudioElement.duration || 180,
        isLocal: true,
        isExplicit: modUnpackedData.meta.isExplicit || false,
        thumbBase64: modUnpackedData.meta.thumbBase64 || null
      };

      await saveTrackMetadata(meta);
      await saveOfflineTrack(id, modUnpackedData.audioBlob, modUnpackedData.coverBlob, modUnpackedData.lyricsText);
      catalogTracks.unshift(meta);
      renderCatalogFeed(catalogTracks);
      await renderManualTracksFeed();

      alert(`✅ Трек "${meta.artist} — ${meta.title}" успешно проверен модерацией и добавлен в каталог!`);
      modModal?.classList.remove('active');
    });

    modRejectBtn?.addEventListener('click', () => {
      modAudioElement.pause();
      const reason = prompt('Укажите причину отклонения (например: рассинхрон текста, плохое качество звука):');
      alert(`❌ Трек отклонен модерацией. Причина: ${reason || 'Не соответствует стандартам качества'}`);
      modModal?.classList.remove('active');
    });

    // 5. Year Recap stories dialog
    const recapDialog = document.getElementById('recap-stories-dialog');
    document.getElementById('open-year-recap-btn')?.addEventListener('click', () => {
      recapDialog?.classList.add('active');
      renderRecapSlide(0);
    });
    recapDialog?.addEventListener('click', (e) => {
      if (e.target === recapDialog) recapDialog.classList.remove('active');
    });
    let recapSlide = 0;
    document.getElementById('recap-close-x-btn')?.addEventListener('click', () => {
      recapDialog?.classList.remove('active');
    });

    document.getElementById('recap-prev-slide-btn')?.addEventListener('click', () => {
      if (recapSlide > 0) {
        recapSlide--;
        renderRecapSlide(recapSlide);
      }
    });
    document.getElementById('recap-next-slide-btn')?.addEventListener('click', () => {
      if (recapSlide < 4) {
        recapSlide++;
        renderRecapSlide(recapSlide);
      } else {
        recapDialog?.classList.remove('active');
      }
    });

    document.getElementById('recap-share-slide-btn')?.addEventListener('click', async () => {
      const data = await getFullRecapData();
      const shareText = `Мои итоги года в ouMusic 2026: 🎧 Время в музыке: ${data.timeFormatted} | Топ-трек: ${data.topTrack.title} | ouMusic Engine`;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Итоги года ouMusic', text: shareText, url: window.location.href });
        } catch(e) {}
      } else {
        navigator.clipboard.writeText(shareText);
        showToast('Текст итогов скопирован в буфер обмена!');
      }
    });

    // 6. Custom .oump3 Uploads (Community Tracks)
    const handleUpload = () => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.oump3,application/zip';
      inp.onchange = async (ev) => {
        if (ev.target.files && ev.target.files[0]) {
          const f = ev.target.files[0];
          try {
            const buf = await f.arrayBuffer();
                        const unp = await unpackOump3Full(buf);
            const id = 'local_' + Date.now();
            const meta = {
              id,
              filename: f.name,
              title: unp.meta.title || f.name.replace('.oump3', ''),
              artist: unp.meta.artist || 'Неизвестный исполнитель',
              duration: unp.meta.duration || 180,
              isLocal: true,
              hasInstrumental: !!unp.meta.hasInstrumental,
              instrumentalConfig: unp.meta.instrumentalConfig || null,
              isExplicit: !!(unp.meta.isExplicit || unp.meta.explicit),
              thumbBase64: unp.meta.thumbBase64 || null
            };
            await saveTrackMetadata(meta);
            await saveOfflineTrack(id, unp.audioBlob, unp.coverBlob, unp.lyricsText);
            catalogTracks.push(meta);
            renderCatalogFeed(catalogTracks);
            renderManualTracksFeed();
            alert(`Трек "${meta.artist} — ${meta.title}" успешно сохранен локально!`);
          } catch (err) {
            alert('Ошибка загрузки .oump3: ' + err.message);
          }
        }
      };
      inp.click();
    };

    document.getElementById('lib-upload-oump3-btn')?.addEventListener('click', handleUpload);
    document.getElementById('home-upload-custom-btn')?.addEventListener('click', handleUpload);

    // 7. Playlist Creation
    document.getElementById('create-playlist-btn')?.addEventListener('click', async () => {
      const name = prompt('Введите название нового плейлиста:');
      if (name && name.trim()) {
        const store = getStore('playlists', 'readwrite');
        if (store) {
          const pl = { id: 'pl_' + Date.now(), name: name.trim(), trackIds: [] };
          store.put(pl);
          renderPlaylistsGrid();
        }
      }
    });

    renderPlaylistsGrid();
  }

  function renderQueueListUI() {
    const list = document.getElementById('queue-tracks-list');
    if (!list) return;
    list.innerHTML = '';
    if (playbackQueue.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: var(--md-sys-color-outline); padding: 32px 16px; font-size: 0.9rem;">Очередь воспроизведения пуста</div>';
      return;
    }
    playbackQueue.forEach((t, i) => {
      const r = document.createElement('div');
      r.className = `track-row ${i === queueIndex ? 'active' : ''}`;
      r.innerHTML = `
        <div class="track-cover-wrap" style="width: 36px; height: 36px;">
          <img class="track-cover-img" src="${t.thumbBase64 || 'assets/oumusic.png'}" alt="">
        </div>
        <div class="track-info">
          <div class="track-title" style="font-size: 0.85rem;">${t.title || 'Трек'}</div>
          <div class="track-artist" style="font-size: 0.75rem;">${t.artist || 'Артист'}</div>
        </div>
      `;
      r.addEventListener('click', () => {
        queueIndex = i;
        playTrack(t);
      });
      list.appendChild(r);
    });
  }

  let recapSlide = 0;
  let cachedRecapData = null;

  async function getFullRecapData() {
    if (cachedRecapData) return cachedRecapData;
    const history = (typeof getHistory === 'function') ? await getHistory(5000) : [];
    const tracks = catalogTracks || [];

    let totalSecs = 0;
    const trackCounts = new Map();
    const artistCounts = new Map();
    const genreCounts = new Map();

    history.forEach((h) => {
      const dur = h.durationPlayed || 180;
      totalSecs += dur;
      trackCounts.set(h.trackId, (trackCounts.get(h.trackId) || 0) + 1);
    });

    let topTrack = null;
    let topTrackCount = 0;
    for (let [tid, count] of trackCounts.entries()) {
      if (count > topTrackCount) {
        topTrackCount = count;
        topTrack = tracks.find((t) => t.id === tid) || { id: tid, title: 'Любимый трек', artist: 'ouMusic' };
      }
    }
    if (!topTrack && tracks.length > 0) {
      topTrack = tracks[0];
      topTrackCount = Math.max(1, history.length);
    }

    tracks.forEach((t) => {
      const plays = trackCounts.get(t.id) || 1;
      const art = t.artist || 'Неизвестный артист';
      artistCounts.set(art, (artistCounts.get(art) || 0) + plays);

      const gens = Array.isArray(t.genres) ? t.genres : [t.genre || 'Electronic'];
      gens.forEach((g) => {
        genreCounts.set(g, (genreCounts.get(g) || 0) + plays);
      });
    });

    const sortedArtists = Array.from(artistCounts.entries()).sort((a, b) => b[1] - a[1]);
    const topArtists = sortedArtists.slice(0, 3).map(([name, count]) => ({ name, count }));

    const sortedGenres = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1]);
    const totalGenrePlays = sortedGenres.reduce((acc, cur) => acc + cur[1], 0) || 1;
    const topGenres = sortedGenres.slice(0, 3).map(([g, c]) => ({
      genre: g,
      percent: Math.max(15, Math.round((c / totalGenrePlays) * 100))
    }));

    const hours = (totalSecs / 3600);
    const mins = Math.max(1, Math.round(totalSecs / 60));
    const timeFormatted = hours >= 1.0 ? `${hours.toFixed(1)} ч` : `${mins} мин`;

    cachedRecapData = {
      totalHours: hours,
      totalMinutes: mins,
      timeFormatted,
      totalTracks: Math.max(history.length, tracks.length),
      topTrack: topTrack || { title: 'ouMusic Stream', artist: 'M-Core Engine' },
      topTrackCount: Math.max(1, topTrackCount),
      topArtists: topArtists.length > 0 ? topArtists : [{ name: 'Sqwore', count: 12 }, { name: 'Серега Пират', count: 8 }, { name: 'Imagine Dragons', count: 5 }],
      topGenres: topGenres.length > 0 ? topGenres : [{ genre: 'Phonk', percent: 50 }, { genre: 'Indie', percent: 30 }, { genre: 'Hyperpop', percent: 20 }]
    };
    return cachedRecapData;
  }

  async function renderRecapSlide(idx) {
    const content = document.getElementById('recap-story-content');
    const fills = document.querySelectorAll('#recap-progress-bars .achievement-progress-fill');
    if (!content) return;

    fills.forEach((f, i) => {
      f.style.width = i <= idx ? '100%' : '0%';
    });

    const data = await getFullRecapData();

    if (idx === 0) {
      // SLIDE 1: TOTAL TIME IN MUSIC
      content.innerHTML = `
        <div class="recap-story-slide" style="text-align: center;">
          <div style="font-size: 0.85rem; letter-spacing: 2px; color: #EC4899; font-weight: 800; text-transform: uppercase;">ТВОЕ ВРЕМЯ В МУЗЫКЕ</div>
          <div style="font-size: 3.6rem; font-weight: 900; color: #FFF; margin: 16px 0; text-shadow: 0 0 35px rgba(236, 72, 153, 0.6); line-height: 1;">
            ${data.timeFormatted}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(236,72,153,0.18); border: 1px solid rgba(236,72,153,0.4); padding: 6px 16px; border-radius: 20px; color: #F472B6; font-size: 0.85rem; font-weight: 700; margin-bottom: 16px;">
            <svg class="svg-icon" style="width: 16px; height: 16px; fill: currentColor;"><use href="#icon-sparkles"></use></svg>
            <span>Топ-3% слушателей 2026</span>
          </div>
          <p style="font-size: 0.95rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.6; max-width: 340px; margin: 0 auto;">
            Вы провели в чистом звучании <strong>${data.totalMinutes} минут</strong>. За этот год наш плеер воспроизвел для вас <strong>${data.totalTracks} треков</strong>!
          </p>
        </div>
      `;
    } else if (idx === 1) {
      // SLIDE 2: TOP TRACK
      const cov = data.topTrack.coverUrl || data.topTrack.thumbBase64 || 'assets/oumusic.png';
      content.innerHTML = `
        <div class="recap-story-slide" style="text-align: center;">
          <div style="font-size: 0.85rem; letter-spacing: 2px; color: #8B5CF6; font-weight: 800; text-transform: uppercase;">ТВОЙ ГЛАВНЫЙ ТРЕК</div>
          <div style="margin: 18px auto 14px auto; width: 140px; height: 140px; border-radius: 22px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 25px rgba(139,92,246,0.45); border: 2px solid rgba(255,255,255,0.2);">
            <img src="${cov}" alt="Top Track" style="width: 100%; height: 100%; object-fit: cover; display: block;">
          </div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #FFF; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 340px;">
            ${data.topTrack.title}
          </div>
          <div style="font-size: 0.95rem; color: rgba(255,255,255,0.7); margin-top: 4px;">
            ${data.topTrack.artist}
          </div>
          <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.35); padding: 6px 14px; border-radius: 20px; color: #C4B5FD; font-size: 0.85rem; font-weight: 700;">
            <svg class="svg-icon" style="width: 15px; height: 15px; fill: currentColor;"><use href="#icon-repeat"></use></svg>
            <span>Включали на повторе ${data.topTrackCount} раз</span>
          </div>
        </div>
      `;
    } else if (idx === 2) {
      // SLIDE 3: TOP ARTISTS PODIUM
      const arts = data.topArtists;
      content.innerHTML = `
        <div class="recap-story-slide" style="text-align: center; width: 100%;">
          <div style="font-size: 0.85rem; letter-spacing: 2px; color: #F59E0B; font-weight: 800; text-transform: uppercase;">ТОП ИСПОЛНИТЕЛИ ГОДА</div>
          <div style="display: flex; justify-content: center; align-items: flex-end; gap: 14px; margin: 24px 0 16px 0;">
            <!-- #2 Silver -->
            <div style="flex: 1; max-width: 95px; display: flex; flex-direction: column; align-items: center;">
              <div style="font-size: 0.75rem; font-weight: 800; color: #94A3B8; margin-bottom: 4px;">#2</div>
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #334155; border: 2px solid #94A3B8; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #FFF; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(0,0,0,0.5);">
                🥈
              </div>
              <div style="font-size: 0.8rem; font-weight: 700; color: #FFF; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px;">
                ${arts[1]?.name || 'M-Core'}
              </div>
            </div>
            <!-- #1 Gold Podium -->
            <div style="flex: 1.2; max-width: 120px; display: flex; flex-direction: column; align-items: center;">
              <div style="font-size: 0.85rem; font-weight: 900; color: #FBBF24; margin-bottom: 4px;">#1 КУМИР</div>
              <div style="width: 72px; height: 72px; border-radius: 50%; background: #78350F; border: 3px solid #F59E0B; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #FFF; font-size: 1.6rem; box-shadow: 0 12px 30px rgba(245,158,11,0.45);">
                👑
              </div>
              <div style="font-size: 0.95rem; font-weight: 800; color: #FFF; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;">
                ${arts[0]?.name || 'oulan1'}
              </div>
            </div>
            <!-- #3 Bronze -->
            <div style="flex: 1; max-width: 95px; display: flex; flex-direction: column; align-items: center;">
              <div style="font-size: 0.75rem; font-weight: 800; color: #D97706; margin-bottom: 4px;">#3</div>
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #451A03; border: 2px solid #D97706; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #FFF; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(0,0,0,0.5);">
                🥉
              </div>
              <div style="font-size: 0.8rem; font-weight: 700; color: #FFF; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px;">
                ${arts[2]?.name || 'Artist'}
              </div>
            </div>
          </div>
          <div style="font-size: 0.85rem; color: var(--md-sys-color-outline); margin-top: 10px;">
            Эти авторы звучали в ваших наушниках чаще всего!
          </div>
        </div>
      `;
    } else if (idx === 3) {
      // SLIDE 4: SOUND AURA & GENRES
      content.innerHTML = `
        <div class="recap-story-slide" style="text-align: center; width: 100%;">
          <div style="font-size: 0.85rem; letter-spacing: 2px; color: #10B981; font-weight: 800; text-transform: uppercase;">МУЗЫКАЛЬНАЯ АУРА</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #FFF; margin: 16px 0 12px 0;">
            Неоновый Драйв & Лирика
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 16px auto 0 auto;">
            ${data.topGenres.map(g => `
              <div style="background: rgba(255,255,255,0.06); padding: 8px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px;">
                  <span style="color: #FFF;">${g.genre}</span>
                  <span style="color: #34D399;">${g.percent}%</span>
                </div>
                <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${g.percent}%; height: 100%; background: linear-gradient(90deg, #10B981, #06B6D4); border-radius: 3px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      // SLIDE 5: WRAPPED SUMMARY POSTER
      content.innerHTML = `
        <div class="recap-story-slide" style="text-align: center; width: 100%;">
          <div style="font-size: 0.82rem; letter-spacing: 2px; color: var(--md-sys-color-primary); font-weight: 800;">ИТОГИ ГОДА 2026</div>
          <div style="margin: 14px auto; background: rgba(0,0,0,0.5); padding: 16px; border-radius: 20px; border: 1.5px solid rgba(139,92,246,0.4); box-shadow: 0 16px 36px rgba(0,0,0,0.7); max-width: 320px;">
            <div style="font-size: 2.2rem; font-weight: 900; color: #FFF; line-height: 1;">${data.timeFormatted}</div>
            <div style="font-size: 0.75rem; color: var(--md-sys-color-outline); margin-top: 4px; text-transform: uppercase;">Всего в музыке</div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0;"></div>
            <div style="text-align: left; font-size: 0.85rem; line-height: 1.6;">
              <div>🎵 Топ-трек: <strong style="color: #FFF;">${data.topTrack.title}</strong></div>
              <div>👑 Артист года: <strong style="color: #FFF;">${data.topArtists[0]?.name || 'Artist'}</strong></div>
              <div>⚡ Вайб: <strong style="color: #34D399;">${data.topGenres[0]?.genre || 'Electronic'}</strong></div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--md-sys-color-outline);">
            Спасибо, что выбираете ouMusic! Впереди еще больше музыки.
          </div>
        </div>
      `;
    }
  }

  window.renderQuoteCanvasPreview = renderQuoteCanvasPreview;
  window.renderRecapSlide = renderRecapSlide;

  async function renderQuoteCanvasPreview() {
    const c = document.getElementById('quote-render-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    c.width = 1080;
    c.height = 1080;

    const hex = await extractCoverDominantColor(currentTrack?.coverUrl || currentTrack?.thumbBase64);
    let r = 245, g = 38, b = 52; // Vibrant red Spotify reference default
    if (hex && hex.startsWith('#')) {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      r = parseInt(h.substring(0, 2), 16) || r;
      g = parseInt(h.substring(2, 4), 16) || g;
      b = parseInt(h.substring(4, 6), 16) || b;
    }

    // Ensure vibrant saturation matching Spotify reference card
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum < 0.20) {
      r = Math.min(255, Math.max(200, r + 150));
      g = Math.min(255, Math.max(35, g + 25));
      b = Math.min(255, Math.max(70, b + 60));
    }

    // Outer background: slightly darker shade of the color
    const darkR = Math.max(0, Math.round(r * 0.88));
    const darkG = Math.max(0, Math.round(g * 0.88));
    const darkB = Math.max(0, Math.round(b * 0.88));
    ctx.fillStyle = `rgb(${darkR}, ${darkG}, ${darkB})`;
    ctx.fillRect(0, 0, c.width, c.height);

    // Inner Card: 920x920 rounded card with soft drop shadow
    const cardX = 80;
    const cardY = 80;
    const cardW = 920;
    const cardH = 920;
    const cardR = 48;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
    ctx.shadowBlur = 54;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 22;

    // Card background: vibrant primary cover color
    const cardBg = `rgb(${r}, ${g}, ${b})`;
    ctx.fillStyle = cardBg;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.fill();
    ctx.restore();

    // In Spotify lyric share cards, text is solid deep black (#000000) on vibrant/warm backgrounds
    const textColor = '#000000';
    const subtextColor = 'rgba(0, 0, 0, 0.65)';

    const covSize = 115;
    const covX = cardX + 54;
    const covY = cardY + 54;

    const imgSrc = currentTrack?.coverUrl || currentTrack?.thumbBase64 || 'assets/oumusic.png';
    const img = new Image();
    if (imgSrc.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    let imgLoaded = false;
    img.onload = () => {
      imgLoaded = true;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(covX, covY, covSize, covSize, 18);
      ctx.clip();
      ctx.drawImage(img, covX, covY, covSize, covSize);
      ctx.restore();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(covX, covY, covSize, covSize, 18);
      ctx.stroke();

      drawCardDetails();
    };

    img.onerror = () => {
      if (!imgLoaded) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.roundRect(covX, covY, covSize, covSize, 18);
        ctx.fill();
        ctx.fillStyle = textColor;
        ctx.font = '800 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎵', covX + covSize / 2, covY + covSize / 2);
        drawCardDetails();
      }
    };
    img.src = imgSrc;

    function drawCardDetails() {
      const metaX = covX + covSize + 24;
      const title = currentTrack?.title || 'ouMusic Track';
      const artist = currentTrack?.artist || 'Исполнитель';

      // Title (Bold solid black Spotify typography)
      ctx.fillStyle = textColor;
      ctx.font = '800 38px -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const maxMetaW = cardW - (metaX - cardX) - 54;

      function trunc(text, maxW) {
        if (ctx.measureText(text).width <= maxW) return text;
        let s = text;
        while (s.length > 3 && ctx.measureText(s + '...').width > maxW) s = s.slice(0, -1);
        return s + '...';
      }

      ctx.fillText(trunc(title, maxMetaW), metaX, covY + 38);

      // Artist
      ctx.fillStyle = subtextColor;
      ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", sans-serif';
      ctx.fillText(trunc(artist, maxMetaW), metaX, covY + 80);

      // Selected lyric lines
      let lines = Array.from(window.selectedQuoteIndices || [])
        .sort((a, b) => a - b)
        .map((i) => currentParsedLyrics[i]?.text)
        .filter(Boolean);

      if (lines.length === 0) {
        lines = [
          'The way that things have been, oh-ooh',
          "Second thing second, don't you tell me what you think that I can be",
          "I'm the one at the sail, I'm the master of my sea, oh-ooh"
        ];
      }

      // Large bold lyrics typography matching Spotify reference image exactly
      ctx.fillStyle = textColor;
      ctx.font = '800 45px -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", sans-serif';
      ctx.textBaseline = 'alphabetic';

      const lineMaxW = cardW - 108;
      const wrappedLines = [];
      lines.slice(0, 5).forEach((line) => {
        const words = line.split(' ');
        let cur = '';
        for (let w of words) {
          const test = cur ? cur + ' ' + w : w;
          if (ctx.measureText(test).width > lineMaxW) {
            if (cur) wrappedLines.push(cur);
            cur = w;
          } else {
            cur = test;
          }
        }
        if (cur) wrappedLines.push(cur);
      });

      const maxDisplayLines = Math.min(6, wrappedLines.length);
      const lineHeight = 66;
      const totalTextH = maxDisplayLines * lineHeight;
      const availableAreaH = (cardY + cardH - 120) - (covY + covSize + 40);
      let startY = (covY + covSize + 56) + Math.max(0, (availableAreaH - totalTextH) / 2);

      wrappedLines.slice(0, maxDisplayLines).forEach((wl) => {
        ctx.fillText(wl, covX, startY);
        startY += lineHeight;
      });

      // Bottom-left official ouMusic Branding Logo + Wordmark (like Spotify in reference image)
      const footerY = cardY + cardH - 64;
      const logoRadius = 24;
      const logoX = covX + logoRadius;

      // Circle
      ctx.fillStyle = textColor;
      ctx.beginPath();
      ctx.arc(logoX, footerY, logoRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner ring cutout
      ctx.fillStyle = cardBg;
      ctx.beginPath();
      ctx.arc(logoX, footerY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = textColor;
      ctx.beginPath();
      ctx.arc(logoX, footerY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Soundwave dynamic lines
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(logoX, footerY, 19, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      // Wordmark "ouMusic"
      ctx.fillStyle = textColor;
      ctx.font = '800 38px -apple-system, BlinkMacSystemFont, "Montserrat", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('ouMusic', logoX + logoRadius + 16, footerY);
    }
  }

  function renderPlaylistsGrid() {
    const container = document.getElementById('playlists-container');
    if (!container) return;
    const store = getStore('playlists', 'readonly');
    if (!store) return;
    store.getAll().onsuccess = (e) => {
      const list = e.target.result || [];
      container.innerHTML = '';
      list.forEach((pl) => {
        const card = document.createElement('div');
        card.style.background = 'var(--md-sys-color-surface-container-high)';
        card.style.borderRadius = 'var(--md-shape-corner-medium)';
        card.style.padding = '12px';
        card.innerHTML = `
          <div style="width: 100%; aspect-ratio: 1; border-radius: var(--md-shape-corner-small); overflow: hidden; background: #111; margin-bottom: 8px;">
            <img src="${pl.coverBase64 || 'assets/oumusic.png'}" alt="" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="font-weight: 600; font-size: 0.9rem;">${pl.name}</div>
        `;
        container.appendChild(card);
      });
    };
  }

  // Expose global for debugging if needed
  window.ouMusic = {
    engine,
    playTrack,
    navigateTo,
    deleteTrack,
    saveTrackMetadata,
    saveOfflineTrack,
    getAllTracksMetadata,
    getOfflineTrack
  };
  window.saveTrackMetadata = saveTrackMetadata;
  window.saveOfflineTrack = saveOfflineTrack;
  window.getAllTracksMetadata = getAllTracksMetadata;
  window.getOfflineTrack = getOfflineTrack;
  window.engine = engine;
  window.updateMediaSession = updateMediaSession;
  window.updateActiveLyric = updateActiveLyric;
})();
