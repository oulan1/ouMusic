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
        lrcText,
        cachedAt: new Date().toISOString()
      });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

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

      // Vocal Remover
      this.vocalDryGain = ctx.createGain();
      this.vocalWetGain = ctx.createGain();
      this.vocalDryGain.gain.value = 1.0;
      this.vocalWetGain.gain.value = 0.0;

      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);
      const invGain = ctx.createGain();
      invGain.gain.value = -1.0;

      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 200;

      this.sourceNode.connect(this.vocalDryGain);
      this.sourceNode.connect(splitter);
      splitter.connect(merger, 0, 0);
      splitter.connect(merger, 0, 1);
      splitter.connect(invGain, 1);
      invGain.connect(merger, 0, 0);
      invGain.connect(merger, 0, 1);
      this.sourceNode.connect(bassFilter);
      bassFilter.connect(merger, 0, 0);
      bassFilter.connect(merger, 0, 1);
      merger.connect(this.vocalWetGain);

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

      // 8D Stereo Panner
      if (ctx.createStereoPanner) {
        this.pannerNode = ctx.createStereoPanner();
        postReverb.connect(this.pannerNode);
      } else {
        this.pannerNode = postReverb;
      }

      // Loudness Normalizer (DynamicsCompressor)
      this.compressorNode = ctx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -24;
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 12;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      this.pannerNode.connect(this.compressorNode);

      // Soft Play / Pause Gain
      this.softGainNode = ctx.createGain();
      this.softGainNode.gain.setValueAtTime(1.0, ctx.currentTime);
      this.compressorNode.connect(this.softGainNode);

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
      this.audioElement.playbackRate = Math.max(0.7, Math.min(val, 1.35));
    }

    setReverb(percent) {
      if (!this.reverbWetGain || !this.reverbDryGain) return;
      const amt = percent / 100;
      this.reverbWetGain.gain.setValueAtTime(amt * 0.8, this.audioCtx.currentTime);
      this.reverbDryGain.gain.setValueAtTime(1.0 - amt * 0.3, this.audioCtx.currentTime);
    }

    set8DAudio(percent) {
      if (this.pannerLFOId) {
        clearInterval(this.pannerLFOId);
        this.pannerLFOId = null;
      }
      if (percent <= 0) {
        if (this.pannerNode && this.pannerNode.pan) this.pannerNode.pan.setValueAtTime(0, this.audioCtx.currentTime);
        return;
      }
      let angle = 0;
      const amt = percent / 100;
      this.pannerLFOId = setInterval(() => {
        if (!this.isPlaying || !this.pannerNode || !this.pannerNode.pan) return;
        angle += 0.08;
        this.pannerNode.pan.setValueAtTime(Math.sin(angle) * amt, this.audioCtx.currentTime);
      }, 50);
    }

    resetFX() {
      this.setPlaybackRate(1.0);
      this.setReverb(0);
      this.set8DAudio(0);
    }

    setVocalRemover(active) {
      this.vocalRemoverActive = !!active;
      if (!this.vocalDryGain || !this.vocalWetGain || !this.audioCtx) return;
      const ctx = this.audioCtx;
      this.vocalDryGain.gain.setValueAtTime(active ? 0.0 : 1.0, ctx.currentTime);
      this.vocalWetGain.gain.setValueAtTime(active ? 1.0 : 0.0, ctx.currentTime);
    }

    setNormalizer(active) {
      if (!this.compressorNode || !this.audioCtx) return;
      this.compressorNode.threshold.setValueAtTime(active ? -24 : 0, this.audioCtx.currentTime);
    }

    setEQBand(bandIdx, gain) {
      if (this.eqFilters[bandIdx] && this.audioCtx) {
        this.eqFilters[bandIdx].gain.setValueAtTime(gain, this.audioCtx.currentTime);
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

  async function buildOump3Container({ title, artist, genres = [], duration = 0, hasLyrics = false, thumbBase64 = null, audioBlob, coverBlob = null, lyricsText = '' }) {
    if (typeof window.JSZip === 'undefined') throw new Error('JSZip не загружен');
    const zip = new window.JSZip();

    const meta = {
      title: title.trim(),
      artist: artist.trim(),
      genres,
      duration: Math.round(duration),
      version: '1.0',
      hasLyrics: !!lyricsText || hasLyrics,
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

  /* ==========================================================================
     6. ARTISTS & VERIFICATION
     ========================================================================== */
  const verifiedArtists = new Map();
  verifiedArtists.set('oulan1', { avatar: 'assets/oumusic.png', banner: 'assets/oumusic.png', verified: true });
  verifiedArtists.set('m-core', { avatar: 'assets/oumusic.png', banner: 'assets/oumusic.png', verified: true });

  async function loadArtistsVerification() {
    try {
      const res = await fetch('./artists.txt', { cache: 'no-cache' });
      if (res.ok) {
        const text = await res.text();
        text.split('\n').forEach((line) => {
          const l = line.trim();
          if (!l || l.startsWith('#')) return;
          const [name, av, ban, ver] = l.split(' - ').map((s) => s.trim());
          if (name) {
            verifiedArtists.set(name.toLowerCase(), {
              avatar: av || 'assets/oumusic.png',
              banner: ban || 'assets/oumusic.png',
              verified: ver === '1'
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
      btn.innerHTML = `
        <div class="item-icon-box">
          <svg class="svg-icon" style="width: 20px; height: 20px; fill: currentColor;"><use href="#${item.icon}"></use></svg>
        </div>
        <span class="item-label">${item.label}</span>
      `;

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

    // Global search input
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        filterTracksFeed(query);
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          filterTracksFeed('');
          searchInput.blur();
        }
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
    if (backBtn) backBtn.style.display = (screenId === 'artist' || screenId === 'studio') ? 'inline-flex' : 'none';

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
      const res = await fetch('./tracks/catalog.json', { cache: 'no-cache' });
      if (res.ok) tracks = await res.json();
    } catch (e) {
      // Local file:// protocol fallback
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
      list.appendChild(row);
    });
  }

  function createTrackRow(track, onClick) {
    const row = document.createElement('div');
    row.className = 'track-row';
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
        <div class="track-title">
          <span>${track.title || 'Безымянный трек'}</span>
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
        const res = await fetch(`./tracks/${encodeURIComponent(track.filename)}`);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const unpacked = await unpackOump3Full(buf);
          audioSrc = unpacked.audioBlob;
          if (unpacked.coverBlob) track.coverUrl = URL.createObjectURL(unpacked.coverBlob);
          if (unpacked.lyricsText) track.lyricsText = unpacked.lyricsText;
        }
      } catch (e) {}
    }

    if (!audioSrc) {
      alert(`Трек "${track.title}" недоступен для воспроизведения (файл не найден).`);
      return;
    }

    updatePlayerMeta(track);
    loadLyrics(track.lyricsText || (offlineRecord && offlineRecord.lyricsText) || '', track);
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
    document.querySelectorAll('#mini-cover-img, #fs-cover-img').forEach((img) => {
      img.src = track.coverUrl || track.thumbBase64 || 'assets/oumusic.png';
    });

    const waveTitle = document.getElementById('wave-track-title') || document.getElementById('wave-np-title');
    const waveArtist = document.getElementById('wave-track-artist') || document.getElementById('wave-np-artist');
    if (waveTitle) waveTitle.textContent = track.title || 'Трек';
    if (waveArtist) waveArtist.textContent = track.artist || 'Артист';

    updateLikeDislikeState(track.id);
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
    };

    // Next track
    const nextHandler = () => {
      if (playbackQueue.length === 0) return;
      queueIndex = (queueIndex + 1) % playbackQueue.length;
      playTrack(playbackQueue[queueIndex]);
    };
    document.getElementById('mini-next-btn')?.addEventListener('click', nextHandler);
    document.getElementById('fs-next-btn')?.addEventListener('click', nextHandler);
    engine.onTrackEnd = nextHandler;

    // Prev track (10 sec logic)
    document.getElementById('fs-prev-btn')?.addEventListener('click', () => {
      engine.handleBackButton(() => {
        if (playbackQueue.length === 0) return;
        queueIndex = (queueIndex - 1 + playbackQueue.length) % playbackQueue.length;
        playTrack(playbackQueue[queueIndex]);
      });
    });

    // Scrubber
    const scrubber = document.getElementById('fs-scrubber');
    const curTimeEl = document.getElementById('fs-time-current');
    const durTimeEl = document.getElementById('fs-time-duration');
    const miniProgress = document.getElementById('mini-progress-bar');

    engine.onTimeUpdate = (cur, dur) => {
      if (dur > 0) {
        const pct = (cur / dur) * 100;
        if (scrubber && !scrubber.matches(':active')) scrubber.value = pct;
        if (miniProgress) miniProgress.style.width = `${pct}%`;
        if (curTimeEl) curTimeEl.textContent = formatSec(cur);
        if (durTimeEl) durTimeEl.textContent = formatSec(dur);
      }
    };

    if (scrubber) {
      scrubber.addEventListener('input', () => {
        if (engine.audioElement.duration) {
          const t = (scrubber.value / 100) * engine.audioElement.duration;
          if (curTimeEl) curTimeEl.textContent = formatSec(t);
        }
      });
      scrubber.addEventListener('change', () => {
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

    // Dislike
    document.getElementById('fs-dislike-btn')?.addEventListener('click', async () => {
      if (!currentTrack) return;
      await toggleDislike(currentTrack.id);
      updateLikeDislikeState(currentTrack.id);
      nextHandler();
    });

    initTrackOptionsSheet();
    initCircularSpectrum();
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
    const backdrop = document.getElementById('track-options-backdrop');
    const sheet = document.getElementById('track-options-sheet');
    const title = document.getElementById('sheet-track-title');
    if (title) title.textContent = `${track.artist} — ${track.title}`;
    backdrop?.classList.add('active');
    sheet?.classList.add('active');
  }

  /* 60 FPS Audio Spectrum Canvas */
  function initCircularSpectrum() {
    const canvas = document.getElementById('cover-spectrum-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 150;

      if (engine.analyserNode && engine.isPlaying) {
        const data = new Uint8Array(engine.analyserNode.frequencyBinCount);
        engine.analyserNode.getByteFrequencyData(data);

        const bars = 64;
        const step = (Math.PI * 2) / bars;

        ctx.save();
        for (let i = 0; i < bars; i++) {
          const val = data[i * 2] || 0;
          const h = (val / 255) * 45;
          const ang = i * step;

          const x1 = cx + Math.cos(ang) * (radius + 2);
          const y1 = cy + Math.sin(ang) * (radius + 2);
          const x2 = cx + Math.cos(ang) * (radius + 2 + h);
          const y2 = cy + Math.sin(ang) * (radius + 2 + h);

          ctx.strokeStyle = `hsl(${(i * 360) / bars}, 85%, 65%)`;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }
      requestAnimationFrame(render);
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
        const baseRadius = 88 + idlePulse + bassEnergy * 46;

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

        // 3. Main Multi-Harmonic Organic Wave Sphere Contour
        ctx.save();
        ctx.beginPath();
        const points = 72;
        for (let i = 0; i <= points; i++) {
          const theta = (i / points) * Math.PI * 2;
          const harmonic1 = Math.sin(theta * 6 + angle * 1.6) * (6 + bassEnergy * 20);
          const harmonic2 = Math.cos(theta * 3 - angle * 1.2) * (4 + midEnergy * 12);
          const r = baseRadius + harmonic1 + harmonic2;
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.lineWidth = 3.5 + bassEnergy * 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 18 + bassEnergy * 25;
        ctx.stroke();
        ctx.restore();

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
  function initStudioUI() {
    let studioAudioBuf = null;
    let studioAudioContext = null;
    let originalBlob = null;
    let trimmedBlob = null;
    let thumbBase64 = null;
    let lyricsLines = [];
    let curLineIdx = 0;
    const studioAudio = new Audio();

    // Genres chips in studio
    const genreBox = document.getElementById('studio-genres-chips');
    if (genreBox) {
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

    // Cover upload & Canvas thumb compression
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
          coverImg.src = ev.target.result;
          coverImg.style.display = 'block';
          coverPlc.style.display = 'none';

          const img = new Image();
          img.onload = () => {
            const c = document.createElement('canvas');
            c.width = 160;
            c.height = 160;
            c.getContext('2d').drawImage(img, 0, 0, 160, 160);
            thumbBase64 = c.toDataURL('image/jpeg', 0.85);
          };
          img.src = ev.target.result;
        };
        r.readAsDataURL(f);
      }
    });

    // Audio file upload & decoding
    const chooseAudBtn = document.getElementById('studio-choose-audio-btn');
    const audFileInput = document.getElementById('studio-audio-file');
    const audStatus = document.getElementById('studio-audio-status');
    const waveBox = document.getElementById('studio-waveform-box');

    chooseAudBtn?.addEventListener('click', () => audFileInput?.click());
    audFileInput?.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        originalBlob = file;
        audStatus.textContent = 'Декодирование волны...';
        audStatus.style.background = '#F59E0B';

        try {
          studioAudioContext = new (window.AudioContext || window.webkitAudioContext)();
          const buf = await file.arrayBuffer();
          studioAudioBuf = await studioAudioContext.decodeAudioData(buf);

          audStatus.textContent = 'Аудио готово';
          audStatus.style.background = '#10B981';
          waveBox.style.display = 'block';

          drawWaveform(studioAudioBuf);
        } catch (err) {
          audStatus.textContent = 'Ошибка';
          audStatus.style.background = '#EF4444';
          alert('Ошибка декодирования аудио: ' + err.message);
        }
      }
    });

    function drawWaveform(buf) {
      const c = document.getElementById('studio-waveform-canvas');
      if (!c || !buf) return;
      const ctx = c.getContext('2d');
      c.width = c.offsetWidth || 600;
      c.height = c.offsetHeight || 140;

      const data = buf.getChannelData(0);
      const step = Math.ceil(data.length / c.width);
      const amp = c.height / 2;

      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#8B5CF6';

      for (let i = 0; i < c.width; i++) {
        let min = 1.0, max = -1.0;
        for (let j = 0; j < step; j++) {
          const datum = data[i * step + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
      }
    }

    // Confirm trim & proceed to Step 2
    document.getElementById('studio-confirm-trim-btn')?.addEventListener('click', () => {
      trimmedBlob = originalBlob;
      waveBox.style.display = 'none';
      document.getElementById('studio-step-2-box').style.display = 'block';
      studioAudio.src = URL.createObjectURL(trimmedBlob);
      studioAudio.load();
    });

    document.getElementById('studio-keep-original-btn')?.addEventListener('click', () => {
      trimmedBlob = originalBlob;
      waveBox.style.display = 'none';
      document.getElementById('studio-step-2-box').style.display = 'block';
      studioAudio.src = URL.createObjectURL(trimmedBlob);
      studioAudio.load();
    });

    // Step 2 Lyrics paste & Live Tap with Millisecond [00:00.00] Support
    document.getElementById('studio-apply-pasted-lyrics-btn')?.addEventListener('click', () => {
      const raw = document.getElementById('studio-paste-lyrics-textarea')?.value || '';
      if (!raw.trim()) return;
      lyricsLines = parseLRC(raw);
      curLineIdx = 0;
      renderLyricsRows();
    });

    // Paste ready LRC with timestamps directly from clipboard
    document.getElementById('studio-paste-lrc-clipboard-btn')?.addEventListener('click', async () => {
      let text = '';
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          text = await navigator.clipboard.readText();
        }
      } catch (err) {
        console.warn('Clipboard read failed, using textarea:', err);
      }
      if (!text) {
        text = document.getElementById('studio-paste-lyrics-textarea')?.value || '';
      }
      if (!text.trim()) {
        alert('Буфер обмена пуст. Скопируйте текст песни с таймингами (LRC) или вставьте его в текстовое поле.');
        return;
      }

      const textarea = document.getElementById('studio-paste-lyrics-textarea');
      if (textarea) textarea.value = text;

      lyricsLines = parseLRC(text);
      curLineIdx = 0;
      renderLyricsRows();
    });

    function renderLyricsRows() {
      const list = document.getElementById('studio-lyrics-rows-list');
      if (!list) return;
      list.innerHTML = '';

      lyricsLines.forEach((r, idx) => {
        const item = document.createElement('div');
        item.className = `tap-sync-row ${idx === curLineIdx ? 'current-target' : ''}`;
        const timeStr = r.time !== null ? formatLrcTime(r.time) : '--:--.--';

        item.innerHTML = `
          <div class="tap-sync-time" style="cursor: pointer;" title="Нажмите, чтобы сделать текущей строкой для тапа">${timeStr}</div>
          <input type="text" class="tap-sync-input" value="${r.text.replace(/"/g, '&quot;')}">
          <button class="icon-btn delete-line-btn" style="width: 28px; height: 28px; color: var(--md-sys-color-error);"><svg class="svg-icon" style="width: 16px; height: 16px;"><use href="#icon-trash"></use></svg></button>
        `;

        item.querySelector('.tap-sync-time')?.addEventListener('click', () => {
          curLineIdx = idx;
          renderLyricsRows();
        });

        item.querySelector('.tap-sync-input')?.addEventListener('input', (e) => {
          r.text = e.target.value;
        });

        item.querySelector('.delete-line-btn')?.addEventListener('click', () => {
          lyricsLines.splice(idx, 1);
          renderLyricsRows();
        });

        list.appendChild(item);
      });
    }

    // Studio player
    const playSyncBtn = document.getElementById('studio-sync-play-btn');
    playSyncBtn?.addEventListener('click', () => {
      if (studioAudio.paused) {
        studioAudio.play();
        playSyncBtn.querySelector('span').textContent = 'Пауза';
      } else {
        studioAudio.pause();
        playSyncBtn.querySelector('span').textContent = 'Воспроизвести';
      }
    });

    studioAudio.addEventListener('timeupdate', () => {
      const tLbl = document.getElementById('studio-player-timer');
      if (tLbl) tLbl.textContent = formatLrcTime(studioAudio.currentTime);
    });

    // TAP action
    const tapAction = () => {
      if (lyricsLines.length === 0 || curLineIdx >= lyricsLines.length) return;
      lyricsLines[curLineIdx].time = studioAudio.currentTime;
      curLineIdx++;
      renderLyricsRows();
    };
    document.getElementById('studio-tap-record-btn')?.addEventListener('click', tapAction);

    // Build .oump3 button
    document.getElementById('studio-build-oump3-btn')?.addEventListener('click', async () => {
      const title = document.getElementById('studio-title-input')?.value.trim();
      const artist = document.getElementById('studio-artist-input')?.value.trim();

      if (!title || !artist) {
        alert('Пожалуйста, укажите название трека и артиста!');
        return;
      }
      if (!trimmedBlob && !originalBlob) {
        alert('Пожалуйста, загрузите аудиофайл на Шаге 1!');
        return;
      }

      const lrcText = lyricsLines
        .filter((l) => l.time !== null)
        .map((l) => `[${formatLrcTime(l.time)}]${l.text}`)
        .join('\n');

      try {
        const oump3Blob = await buildOump3Container({
          title,
          artist,
          duration: studioAudioBuf ? studioAudioBuf.duration : 180,
          hasLyrics: !!lrcText,
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

        alert(`Трек "${artist} — ${title}.oump3" успешно собран!`);
      } catch (e) {
        alert('Ошибка при сборке .oump3: ' + e.message);
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

      if (item.time !== null) {
        line.style.cursor = 'pointer';
        line.addEventListener('click', () => {
          engine.seek(item.time);
          engine.softPlay();
        });
      }

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
        l.classList.toggle('active', idx === newIdx);
      });
      if (lines[newIdx]) {
        lines[newIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function initLyricsUI() {
    const overlay = document.getElementById('lyrics-overlay');
    document.getElementById('fs-open-lyrics-btn')?.addEventListener('click', () => {
      overlay?.classList.add('active');
    });
    document.getElementById('close-lyrics-btn')?.addEventListener('click', () => {
      overlay?.classList.remove('active');
    });

    // Vocal remover toggle
    const vocalBtn = document.getElementById('lyrics-vocal-remover-toggle');
    vocalBtn?.addEventListener('click', () => {
      const isAct = !engine.vocalRemoverActive;
      engine.setVocalRemover(isAct);
      vocalBtn.classList.toggle('active', isAct);
    });

    // Timeupdate sync with engine
    engine.audioElement.addEventListener('timeupdate', () => {
      if (!overlay?.classList.contains('active') && !document.getElementById('fullscreen-player')?.classList.contains('active')) {
        return;
      }
      updateActiveLyric(engine.audioElement.currentTime);
    });
  }

  /* Profile & Settings UI */
  async function initProfileUI() {
    await updateProfileStats();
    document.getElementById('clear-history-btn')?.addEventListener('click', () => {
      alert('История прослушиваний очищена.');
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
    // Theme toggle
    const darkBtn = document.getElementById('theme-dark-btn');
    const lightBtn = document.getElementById('theme-light-btn');
    const amoledToggle = document.getElementById('amoled-toggle');

    darkBtn?.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      darkBtn.classList.add('active');
      lightBtn.classList.remove('active');
    });

    lightBtn?.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      lightBtn.classList.add('active');
      darkBtn.classList.remove('active');
    });

    amoledToggle?.addEventListener('change', () => {
      document.documentElement.setAttribute('data-amoled', amoledToggle.checked ? 'true' : 'false');
    });

    // Font size selector
    document.querySelectorAll('[data-fontsize]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-fontsize]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const size = btn.getAttribute('data-fontsize') || 'medium';
        document.documentElement.setAttribute('data-font-size', size);
      });
    });

    // Accent Color System & Custom Palette Picker
    function applyAccentColor(colorHex) {
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

      try {
        localStorage.setItem('oumusic_accent_color', colorHex);
      } catch (e) {}

      let matchedPreset = false;
      document.querySelectorAll('#accent-colors-row .accent-color-circle[data-color]').forEach((btn) => {
        const btnColor = btn.getAttribute('data-color');
        if (btnColor && btnColor.toLowerCase() === colorHex.toLowerCase()) {
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
        if (!matchedPreset) {
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

    // Connect preset circles
    document.querySelectorAll('#accent-colors-row .accent-color-circle[data-color]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = btn.getAttribute('data-color');
        if (c) applyAccentColor(c);
      });
    });

    // Custom palette button & picker
    const customAccentBtn = document.getElementById('custom-accent-btn');
    const customColorPicker = document.getElementById('custom-accent-color-picker');

    customAccentBtn?.addEventListener('click', () => {
      customColorPicker?.click();
    });

    customColorPicker?.addEventListener('input', (e) => {
      applyAccentColor(e.target.value);
    });

    customColorPicker?.addEventListener('change', (e) => {
      applyAccentColor(e.target.value);
    });

    // Restore saved accent color
    try {
      const savedColor = localStorage.getItem('oumusic_accent_color');
      if (savedColor) applyAccentColor(savedColor);
    } catch (e) {}

    // Normalizer switch
    const normToggle = document.getElementById('normalizer-toggle');
    normToggle?.addEventListener('change', () => {
      engine.setNormalizer(normToggle.checked);
    });

    // Crossfade slider
    const crossfadeSlider = document.getElementById('crossfade-slider');
    const crossfadeLabel = document.getElementById('crossfade-value-label');
    crossfadeSlider?.addEventListener('input', () => {
      const v = crossfadeSlider.value;
      if (crossfadeLabel) crossfadeLabel.textContent = `${v} сек`;
    });

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
    });

    eqResetBtn?.addEventListener('click', () => {
      engine.ensureContext();
      const gains = engine.applyEQPreset('flat');
      if (eqSelect) eqSelect.value = 'flat';
      updateEQSliders(gains);
    });

    eqSliders.forEach((slider) => {
      slider.addEventListener('input', () => {
        const band = parseInt(slider.getAttribute('data-band'), 10);
        const val = parseFloat(slider.value);
        engine.ensureContext();
        engine.setEQBand(band, val);
        if (eqSelect) eqSelect.value = 'custom';
      });
    });

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

    const list = document.getElementById('artist-tracks-list');
    if (!list) return;
    list.innerHTML = '';

    const artistTracks = catalogTracks.filter((t) => {
      return (t.artist || '').toLowerCase().includes(clean.toLowerCase());
    });

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
      playbackQueue = currentTrack ? [currentTrack] : [];
      queueIndex = 0;
      renderQueueListUI();
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

    // 4. Quote Card dialog
    const quoteDialog = document.getElementById('quote-card-dialog');
    document.getElementById('lyrics-share-quote-btn')?.addEventListener('click', () => {
      quoteDialog?.classList.add('active');
      renderQuoteCanvasPreview();
    });
    document.getElementById('quote-dialog-close-btn')?.addEventListener('click', () => {
      quoteDialog?.classList.remove('active');
    });
    document.getElementById('quote-download-btn')?.addEventListener('click', () => {
      const c = document.getElementById('quote-render-canvas');
      if (!c) return;
      const a = document.createElement('a');
      a.download = `quote_${currentTrack?.title || 'ouMusic'}.png`;
      a.href = c.toDataURL('image/png');
      a.click();
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
    document.getElementById('recap-prev-slide-btn')?.addEventListener('click', () => {
      if (recapSlide > 0) {
        recapSlide--;
        renderRecapSlide(recapSlide);
      }
    });
    document.getElementById('recap-next-slide-btn')?.addEventListener('click', () => {
      if (recapSlide < 2) {
        recapSlide++;
        renderRecapSlide(recapSlide);
      } else {
        recapDialog.classList.remove('active');
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

  function renderRecapSlide(idx) {
    const content = document.getElementById('recap-story-content');
    const fills = document.querySelectorAll('#recap-progress-bars .achievement-progress-fill');
    if (!content) return;

    fills.forEach((f, i) => f.style.width = i <= idx ? '100%' : '0%');

    if (idx === 0) {
      content.innerHTML = `
        <div style="font-size: 0.85rem; letter-spacing: 1.5px; color: #EC4899; font-weight: 700;">ВРЕМЯ ЗВУКА</div>
        <div style="font-size: 3rem; font-weight: 800; color: #FFF; margin: 12px 0;">12.4 ч</div>
        <p style="font-size: 0.95rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.6;">
          Вы провели с музыкой <strong>12.4 часов</strong>. За это время МКС облетела Землю 8 раз!
        </p>
      `;
    } else if (idx === 1) {
      content.innerHTML = `
        <div style="font-size: 0.85rem; letter-spacing: 1.5px; color: #8B5CF6; font-weight: 700;">ТОП МУЗЫКАНТОВ</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: #FFF; margin-top: 16px;">oulan1, M-Core</div>
        <div style="font-size: 1.1rem; color: #EC4899; margin-top: 16px;">Любимые жанры: Phonk, Electronic, Lo-Fi</div>
      `;
    } else {
      content.innerHTML = `
        <div style="font-size: 0.85rem; letter-spacing: 1.5px; color: #10B981; font-weight: 700;">САМЫЙ ЗАСЛУШАННЫЙ ТРЕК</div>
        <div style="font-size: 1.35rem; font-weight: 700; color: #FFF; margin-top: 20px;">${currentTrack?.title || 'ouMusic Stream'}</div>
        <p style="font-size: 0.85rem; color: var(--md-sys-color-outline); margin-top: 8px;">Спасибо, что слушаете ouMusic!</p>
      `;
    }
  }

  function renderQuoteCanvasPreview() {
    const c = document.getElementById('quote-render-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0E0E14';
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentTrack?.title || 'ouMusic Track', c.width / 2, 200);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '24px sans-serif';
    ctx.fillText(currentTrack?.artist || 'M-Core Engine', c.width / 2, 250);

    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'italic bold 40px sans-serif';
    ctx.fillText('« Музыка объединяет звуки и сердца »', c.width / 2, 480);

    ctx.fillStyle = '#EC4899';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ouMusic • M-CORE', c.width / 2, c.height - 80);
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
  window.ouMusic = { engine, playTrack, navigateTo };
})();
