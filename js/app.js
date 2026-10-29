/**
 * ouMusic - Main Application Entrypoint
 * Progressive Web Application on M-Core Engine
 */

import { initStorage, saveTrackMetadata, getAllTracksMetadata, saveOfflineTrack, getOfflineTrack, deleteOfflineTrack, isOffline, isLiked, toggleLike, getSetting, saveSetting, getBlacklist, removeDislike, addHistory, getAllLikes, getAllPlaylists } from './core/storage.js';
import { engine } from './core/engine.js';
import { unpackOump3Full, parseOump3HeaderFast, unpackOulistContainer } from './core/oump3.js';
import { loadCatalog, getCachedCatalog, initLazyCoversObserver, observeTrackRow } from './modules/github.js';
import { initPlayerUI, updatePlayerDisplay, updatePlayPauseButtons, setPlaybackQueue, getCurrentTrack, getQueue } from './modules/player-ui.js';
import { initWaveModule } from './modules/wave.js';
import { initLyricsModule, loadLyrics } from './modules/lyrics.js';
import { initStudioModule } from './modules/studio.js';
import { loadArtistsVerification, renderArtistScreen, isArtistVerified, splitArtists } from './modules/artists.js';
import { initImporterModule } from './modules/importer.js';
import { initRecapModule, unlockAchievement, updateProfileDisplay } from './modules/recap.js';
import { applyTranslations } from './i18n.js';

export const APP_VERSION = '1.0.0';

document.addEventListener('DOMContentLoaded', async () => {
  console.log(`[ouMusic] Initializing ouMusic v${APP_VERSION}...`);

  // 1. Inline SVG Icons Sprite for 100% offline & local file reliability
  await inlineSVGSprite();

  // 2. Initialize IndexedDB & Persistent Storage
  await initStorage();

  // 3. Load Artists Verification database from artists.txt
  await loadArtistsVerification();

  // 4. Register PWA Service Worker
  registerServiceWorker();

  // 5. Initialize UI Settings & Theme
  await initAppSettings();

  // 6. Initialize Player UI and Subsystems
  initPlayerUI({
    onTrackSelect: (track) => playTrack(track),
    onQueueChange: (queue) => console.log('[Queue] Updated:', queue.length)
  });

  initWaveModule((track) => playTrack(track));
  initLyricsModule();
  initStudioModule();
  initImporterModule({
    onPlaylistCreated: () => renderLibraryPlaylists()
  });
  await initRecapModule();

  // 7. Initialize Navigation & Routing
  initNavigation();
  initKeyboardShortcuts();
  initMobileSwipes();

  // 8. Fetch Tracks Catalog & Initialize Feed
  const catalog = await loadCatalog();
  renderCatalogFeed(catalog);
  renderManualTracks();
  renderLibraryPlaylists();
  initUploadButtons();

  // 9. Initialize Lazy Covers Loader
  initLazyCoversObserver((updatedMeta) => {
    updateTrackCoverInDOM(updatedMeta);
  });

  // 10. Process Initial Deep Links (#track=... or #artist=...)
  handleHashRouting();
  window.addEventListener('hashchange', handleHashRouting);

  // 11. Check App Version Update Dialog
  checkVersionUpdate();

  applyTranslations();
  console.log('[ouMusic] Ready for playback on M-Core engine!');
});

/* ==========================================================================
   SVG Sprite Inliner
   ========================================================================== */
async function inlineSVGSprite() {
  try {
    const res = await fetch('assets/icons.svg');
    if (res.ok) {
      const svgText = await res.text();
      const container = document.getElementById('svg-icons-container');
      if (container) container.innerHTML = svgText;
    }
  } catch (e) {
    console.warn('[App] Could not inline SVG sprite:', e);
  }
}

/* ==========================================================================
   Playback Coordinator (playTrack)
   ========================================================================== */
export async function playTrack(track, autoPlay = true) {
  if (!track) return;

  // Check night vibe achievement (played after 02:00 AM)
  const hour = new Date().getHours();
  if (hour >= 2 && hour < 6) {
    unlockAchievement('night_vibe');
  }

  // Check verified artist achievement
  if (isArtistVerified(track.artist)) {
    unlockAchievement('official_connoisseur');
  }

  // 1. Try local offline store first
  const offlineRecord = await getOfflineTrack(track.id);
  let audioSource = null;
  let coverSource = null;
  let lyricsText = '';

  if (offlineRecord && offlineRecord.audioBlob) {
    audioSource = offlineRecord.audioBlob;
    if (offlineRecord.coverBlob) {
      coverSource = URL.createObjectURL(offlineRecord.coverBlob);
    }
    lyricsText = offlineRecord.lrcText || '';
  } else if (track.isLocal) {
    alert('Локальный трек не найден в памяти устройства.');
    return;
  } else {
    // Online track from GitHub catalog: unpack entire .oump3 for audio & full cover
    try {
      const fileUrl = `./tracks/${encodeURIComponent(track.filename)}`;
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();

      const unpacked = await unpackOump3Full(buf);
      audioSource = unpacked.audioBlob;
      if (unpacked.coverBlob) {
        coverSource = URL.createObjectURL(unpacked.coverBlob);
      }
      lyricsText = unpacked.lyricsText || '';
    } catch (err) {
      console.warn('[App] Could not unpack full .oump3, trying fallback audio:', err);
    }
  }

  if (!audioSource) {
    alert(`Не удалось загрузить аудиофайл трека: ${track.title}`);
    return;
  }

  // Update track object with full cover if available
  const fullTrack = {
    ...track,
    coverUrl: coverSource || track.thumbBase64 || 'assets/default-cover.svg'
  };

  updatePlayerDisplay(fullTrack);
  loadLyrics(lyricsText, fullTrack);

  // Play through M-Core engine
  await engine.loadTrack(fullTrack, audioSource, autoPlay);

  // Log in listening history
  await addHistory(track.id, track.duration || 180);
  await updateProfileDisplay();
}

/* ==========================================================================
   Navigation & Deep Links (#track=... & #artist=...)
   ========================================================================== */
function initNavigation() {
  const tabs = document.querySelectorAll('[data-nav]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-nav');
      navigateTo(target);
    });
  });

  const brandLogo = document.getElementById('brand-logo-btn');
  if (brandLogo) brandLogo.addEventListener('click', () => navigateTo('home'));

  const topStudioBtn = document.getElementById('top-studio-btn');
  if (topStudioBtn) topStudioBtn.addEventListener('click', () => navigateTo('studio'));

  const topSettingsBtn = document.getElementById('top-settings-btn');
  if (topSettingsBtn) topSettingsBtn.addEventListener('click', () => navigateTo('settings'));

  const backBtn = document.getElementById('top-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.history.back();
    });
  }
}

export function navigateTo(screenId, pushHash = true) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('[data-nav]').forEach((t) => {
    if (t.getAttribute('data-nav') === screenId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  const targetScreen = document.getElementById(`screen-${screenId}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  const backBtn = document.getElementById('top-back-btn');
  if (backBtn) {
    backBtn.style.display = (screenId === 'artist' || screenId === 'studio') ? 'inline-flex' : 'none';
  }

  if (pushHash && !window.location.hash.includes('=')) {
    window.location.hash = screenId;
  }
}

function handleHashRouting() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;

  if (hash.startsWith('track=')) {
    const trackParam = decodeURIComponent(hash.slice(6));
    const catalog = getCachedCatalog();
    const found = catalog.find((t) => t.id === trackParam || t.filename === trackParam);
    if (found) {
      playTrack(found);
    }
  } else if (hash.startsWith('artist=')) {
    const artistName = decodeURIComponent(hash.slice(7));
    navigateTo('artist', false);
    renderArtistScreen(
      artistName,
      (track) => playTrack(track),
      (tracks) => {
        setPlaybackQueue(tracks, 0);
        playTrack(tracks[0]);
      }
    );
  } else if (['home', 'wave', 'library', 'studio', 'profile', 'settings'].includes(hash)) {
    navigateTo(hash, false);
  }
}

/* ==========================================================================
   Catalog & Feeds Rendering
   ========================================================================== */
function renderCatalogFeed(tracks) {
  const container = document.getElementById('home-tracks-list');
  if (!container) return;

  container.innerHTML = '';
  if (tracks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 16px; color: var(--md-sys-color-outline);">
        <svg class="svg-icon" style="width: 48px; height: 48px; margin-bottom: 8px;"><use href="#icon-music"></use></svg>
        <div>В каталоге пока нет треков</div>
        <div style="font-size: 0.8rem; margin-top: 4px;">Загрузите .oump3 в папку tracks/ на GitHub или через кнопку "Загрузить свой .oump3"</div>
      </div>
    `;
    return;
  }

  tracks.forEach((track) => {
    const row = createTrackRowElement(track, () => {
      setPlaybackQueue(tracks, tracks.indexOf(track));
      playTrack(track);
    });
    container.appendChild(row);
    observeTrackRow(row);
  });
}

export async function renderManualTracks() {
  const container = document.getElementById('home-manual-tracks-list');
  if (!container) return;

  const allMetas = await getAllTracksMetadata();
  const manualTracks = allMetas.filter((t) => t.isLocal);

  container.innerHTML = '';
  if (manualTracks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--md-sys-color-outline); font-size: 0.85rem;">
        Нет добавленных локальных треков
      </div>
    `;
    return;
  }

  manualTracks.forEach((track) => {
    const row = createTrackRowElement(track, () => {
      setPlaybackQueue(manualTracks, manualTracks.indexOf(track));
      playTrack(track);
    });
    container.appendChild(row);
  });
}

function createTrackRowElement(track, onRowClick) {
  const row = document.createElement('div');
  row.className = 'track-row';
  row.setAttribute('data-track-id', track.id);
  if (track.filename) row.setAttribute('data-filename', track.filename);

  const isVer = isArtistVerified(track.artist);
  const artistParts = splitArtists(track.artist);

  // Artist links markup
  const artistLinksHtml = artistParts
    .map((a) => `<a href="#artist=${encodeURIComponent(a)}" class="artist-link" onclick="event.stopPropagation();">${a}</a>`)
    .join(', ');

  row.innerHTML = `
    <div class="track-cover-wrap">
      <img class="track-cover-img" src="${track.thumbBase64 || 'assets/default-cover.svg'}" alt="Cover">
    </div>
    <div class="track-info">
      <div class="track-title">
        <span>${track.title || 'Трек'}</span>
        ${isVer ? `<span class="badge-verified" title="Официальный артист"><svg class="svg-icon"><use href="#icon-verified"></use></svg></span>` : ''}
        ${track.isLocal ? `<span class="badge-downloaded" title="Скачано на устройство"><svg class="svg-icon"><use href="#icon-check-circle"></use></svg></span>` : ''}
      </div>
      <div class="track-artist">${artistLinksHtml}</div>
    </div>
    <div class="track-actions">
      <button class="icon-btn track-options-trigger" title="Опции" onclick="event.stopPropagation();">
        <svg class="svg-icon"><use href="#icon-more-vert"></use></svg>
      </button>
    </div>
  `;

  row.addEventListener('click', onRowClick);

  const optBtn = row.querySelector('.track-options-trigger');
  if (optBtn) {
    optBtn.addEventListener('click', () => {
      // Open 3-dots sheet for this specific track
      const backdrop = document.getElementById('track-options-backdrop');
      const sheet = document.getElementById('track-options-sheet');
      const titleEl = document.getElementById('sheet-track-title');
      if (titleEl) titleEl.textContent = `${track.artist} — ${track.title}`;
      backdrop.classList.add('active');
      sheet.classList.add('active');
    });
  }

  return row;
}

function updateTrackCoverInDOM(meta) {
  if (!meta || !meta.thumbBase64) return;
  document.querySelectorAll(`.track-row[data-track-id="${meta.id}"] .track-cover-img`).forEach((img) => {
    img.src = meta.thumbBase64;
  });
}

/* ==========================================================================
   Local .oump3 Upload Handler (Community Tracks)
   ========================================================================== */
function initUploadButtons() {
  const libBtn = document.getElementById('lib-upload-oump3-btn');
  const homeBtn = document.getElementById('home-upload-custom-btn');

  const triggerUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.oump3,application/zip';
    input.onchange = async (e) => {
      if (e.target.files && e.target.files[0]) {
        await processLocalOump3File(e.target.files[0]);
      }
    };
    input.click();
  };

  if (libBtn) libBtn.addEventListener('click', triggerUpload);
  if (homeBtn) homeBtn.addEventListener('click', triggerUpload);
}

async function processLocalOump3File(file) {
  try {
    const arrayBuf = await file.arrayBuffer();
    const unpacked = await unpackOump3Full(arrayBuf);

    const title = unpacked.meta.title || file.name.replace('.oump3', '');
    const artist = unpacked.meta.artist || 'Неизвестный исполнитель';
    const id = 'local_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const meta = {
      id,
      filename: file.name,
      title,
      artist,
      genres: unpacked.meta.genres || [],
      duration: unpacked.meta.duration || 0,
      hasLyrics: typeof unpacked.meta.hasLyrics === 'boolean' ? unpacked.meta.hasLyrics : !!unpacked.lyricsText,
      thumbBase64: unpacked.meta.thumbBase64 || null,
      isLocal: true,
      addedAt: new Date().toISOString()
    };

    // Save metadata
    await saveTrackMetadata(meta);

    // Save offline audio and cover blob
    await saveOfflineTrack(id, unpacked.audioBlob, unpacked.coverBlob, unpacked.lyricsText);

    // Check achievement "Хранитель архива"
    await unlockAchievement('archive_keeper', 1);

    await renderManualTracks();
    alert(`Трек "${artist} — ${title}" успешно добавлен в вашу библиотеку!`);
  } catch (err) {
    console.error('[App] Failed to import local .oump3:', err);
    alert('Ошибка при импорте .oump3 контейнера: ' + err.message);
  }
}

/* ==========================================================================
   Library Subtabs & Playlists (.oulist)
   ========================================================================== */
async function renderLibraryPlaylists() {
  const container = document.getElementById('playlists-container');
  if (!container) return;

  const playlists = await getAllPlaylists();
  container.innerHTML = '';

  playlists.forEach((pl) => {
    const card = document.createElement('div');
    card.style.background = 'var(--md-sys-color-surface-container-high)';
    card.style.borderRadius = 'var(--md-shape-corner-medium)';
    card.style.padding = '12px';
    card.style.cursor = 'pointer';

    card.innerHTML = `
      <div style="width: 100%; aspect-ratio: 1; border-radius: var(--md-shape-corner-small); overflow: hidden; background: #111; margin-bottom: 8px;">
        <img src="${pl.coverBase64 || 'assets/default-cover.svg'}" alt="" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="font-weight: 600; font-size: 0.9rem;">${pl.name}</div>
      <div style="font-size: 0.75rem; color: var(--md-sys-color-outline);">${pl.trackIds ? pl.trackIds.length : 0} треков</div>
    `;

    container.appendChild(card);
  });
}

/* ==========================================================================
   Keyboard Shortcuts (PC) & Mobile Swipes
   ========================================================================== */
function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

    if (e.code === 'Space') {
      e.preventDefault();
      engine.togglePlay();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      engine.seek(engine.audioElement.currentTime - 5);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      engine.seek(engine.audioElement.currentTime + 5);
    } else if (e.code === 'KeyL') {
      const cur = getCurrentTrack();
      if (cur) toggleLike(cur.id);
    } else if (e.code === 'KeyT') {
      document.getElementById('lyrics-overlay').classList.toggle('active');
    } else if (e.code === 'KeyM') {
      engine.audioElement.muted = !engine.audioElement.muted;
    }
  });
}

function initMobileSwipes() {
  const mini = document.getElementById('mini-player');
  if (!mini) return;

  let touchStartX = 0;
  mini.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  mini.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 60) {
      const queue = getQueue();
      if (queue.length > 0) {
        document.getElementById(diff < 0 ? 'mini-next-btn' : 'fs-prev-btn')?.click();
      }
    }
  });
}

/* ==========================================================================
   Settings & Theme Switcher
   ========================================================================== */
async function initAppSettings() {
  const themeDarkBtn = document.getElementById('theme-dark-btn');
  const themeLightBtn = document.getElementById('theme-light-btn');
  const amoledToggle = document.getElementById('amoled-toggle');
  const normalizerToggle = document.getElementById('normalizer-toggle');
  const crossfadeSlider = document.getElementById('crossfade-slider');
  const crossfadeLabel = document.getElementById('crossfade-value-label');
  const eqPresetSelect = document.getElementById('eq-presets-select');
  const mcoreDocsBtn = document.getElementById('open-mcore-docs-btn');
  const mcoreDocsDialog = document.getElementById('mcore-docs-dialog');
  const mcoreDocsClose = document.getElementById('mcore-docs-close-btn');
  const downloadAiSpecBtn = document.getElementById('download-ai-spec-btn');

  // Load saved theme
  const savedTheme = await getSetting('theme_mode', 'dark');
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    themeLightBtn?.classList.add('active');
    themeDarkBtn?.classList.remove('active');
  }

  themeDarkBtn?.addEventListener('click', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeDarkBtn.classList.add('active');
    themeLightBtn.classList.remove('active');
    await saveSetting('theme_mode', 'dark');
  });

  themeLightBtn?.addEventListener('click', async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    themeLightBtn.classList.add('active');
    themeDarkBtn.classList.remove('active');
    await saveSetting('theme_mode', 'light');
  });

  // AMOLED mode
  const savedAmoled = await getSetting('amoled_mode', false);
  if (amoledToggle) {
    amoledToggle.checked = savedAmoled;
    document.documentElement.setAttribute('data-amoled', savedAmoled ? 'true' : 'false');
    amoledToggle.addEventListener('change', async () => {
      document.documentElement.setAttribute('data-amoled', amoledToggle.checked ? 'true' : 'false');
      await saveSetting('amoled_mode', amoledToggle.checked);
    });
  }

  // Accent colors
  document.querySelectorAll('#accent-colors-row .accent-color-circle').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#accent-colors-row .accent-color-circle').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const hue = btn.getAttribute('data-hue');
      document.documentElement.style.setProperty('--accent-hue', hue);
    });
  });

  // Loudness Normalizer (Default: ON)
  const savedNormalizer = await getSetting('loudness_normalizer', true);
  if (normalizerToggle) {
    normalizerToggle.checked = savedNormalizer;
    engine.setNormalizer(savedNormalizer);
    normalizerToggle.addEventListener('change', async () => {
      engine.setNormalizer(normalizerToggle.checked);
      await saveSetting('loudness_normalizer', normalizerToggle.checked);
    });
  }

  // Crossfade
  if (crossfadeSlider && crossfadeLabel) {
    crossfadeSlider.addEventListener('input', () => {
      crossfadeLabel.textContent = `${crossfadeSlider.value} сек`;
      engine.crossfadeSeconds = parseInt(crossfadeSlider.value, 10);
    });
  }

  // EQ Presets
  if (eqPresetSelect) {
    eqPresetSelect.addEventListener('change', () => {
      const gains = engine.applyEQPreset(eqPresetSelect.value);
      document.querySelectorAll('.eq-band').forEach((slider, i) => {
        slider.value = gains[i];
      });
    });
  }

  // Documentation Dialog
  if (mcoreDocsBtn && mcoreDocsDialog && mcoreDocsClose) {
    mcoreDocsBtn.addEventListener('click', () => mcoreDocsDialog.classList.add('active'));
    mcoreDocsClose.addEventListener('click', () => mcoreDocsDialog.classList.remove('active'));
    mcoreDocsDialog.addEventListener('click', (e) => {
      if (e.target === mcoreDocsDialog) mcoreDocsDialog.classList.remove('active');
    });
  }

  // Download AI Instructions (.txt)
  if (downloadAiSpecBtn) {
    downloadAiSpecBtn.addEventListener('click', () => {
      const specText = `СПЕЦИФИКАЦИЯ МУЗЫКАЛЬНОГО ДВИЖКА M-CORE И ФОРМАТА .OUMP3 ДЛЯ ИИ-АГЕНТОВ
Версия: 1.0.0
Автор: oulan1 (neketke24@gmail.com)

1. СТРУКТУРА КОНТЕЙНЕРА .OUMP3:
- ZIP-архив с обязательным размещением файла "header.json" первым без сжатия (метод STORE, Range 0-65535).
- audio.mp3 или audio.wav (исходный аудиопоток).
- cover.jpg (обложка высокого разрешения до 10 МБ).
- lyrics.lrc (синхронизированный построчный текст [мм:сс.хх]).

2. АУДИОДВИЖОК M-CORE (WEB AUDIO API):
- HTMLAudioElement -> MediaElementSource -> playbackRate (preservesPitch = false) -> Vocal Remover (L-R + 200Hz Lowpass) -> 5-band EQ -> Convolver Reverb -> 8D Panner -> DynamicsCompressor (Normalizer) -> Soft Gain (0.3s) -> Master Gain -> Analyser -> Destination.
`;
      const blob = new Blob([specText], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'M-Core_AI_Spec.txt';
      a.click();
    });
  }
}

/* ==========================================================================
   App Version & Updates Dialog
   ========================================================================== */
async function checkVersionUpdate() {
  const lastVersion = await getSetting('last_app_version', null);
  const dialog = document.getElementById('app-update-dialog');
  const confirmBtn = document.getElementById('app-update-confirm-btn');
  const content = document.getElementById('app-update-changelog-content');

  if (lastVersion !== APP_VERSION) {
    if (content) {
      content.innerHTML = `
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>Запуск первой версии сервиса <strong>ouMusic v${APP_VERSION}</strong>.</li>
          <li>Гибридный звуковой движок <strong>M-Core</strong> с мягкой паузой (0.3с) и Vocal Remover BETA.</li>
          <li>Конструктор <strong>Моя Студия</strong>: обрезка волны и живая тап-разметка текста.</li>
          <li>Бесконечная адаптивная <strong>Моя Волна</strong> с дизлайками и фильтрами.</li>
          <li>Автоматическая синхронизация треков с GitHub Pages.</li>
        </ul>
      `;
    }
    if (dialog) dialog.classList.add('active');

    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        dialog.classList.remove('active');
        await saveSetting('last_app_version', APP_VERSION);
      };
    }
  }
}

/* ==========================================================================
   PWA Service Worker Registration
   ========================================================================== */
function registerServiceWorker() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('[PWA] Service Worker registered successfully:', reg.scope);
    }).catch((err) => {
      console.warn('[PWA] Service Worker registration failed:', err);
    });
  }
}
