import { getStats, getSetting, saveSetting, getRecapSnapshot, saveRecapSnapshot, getHistory, exportBackupJSON, importBackupJSON } from '../core/storage.js';
import { getCachedCatalog } from './github.js';
import { isArtistVerified } from './artists.js';

export const ACHIEVEMENTS = [
  {
    id: 'sound_producer',
    title: 'Саунд-продюсер',
    desc: 'Собрал свой первый трек .oump3 в Моей Студии',
    icon: 'icon-studio',
    max: 1
  },
  {
    id: 'night_vibe',
    title: 'Ночной вайб',
    desc: 'Слушал музыку после 02:00 ночи',
    icon: 'icon-sleep',
    max: 1
  },
  {
    id: 'sound_alchemist',
    title: 'Алхимик звука',
    desc: 'Использовал комбо из ползунков Slowed + Reverb + 8D',
    icon: 'icon-spatial',
    max: 1
  },
  {
    id: 'archive_keeper',
    title: 'Хранитель архива',
    desc: 'Сохранил в оффлайн или добавил вручную 10 / 50 треков',
    icon: 'icon-download',
    max: 50
  },
  {
    id: 'official_connoisseur',
    title: 'Официальный ценитель',
    desc: 'Послушал верифицированного артиста с фиолетовой нотой',
    icon: 'icon-verified',
    max: 1
  }
];

let recapStoryIndex = 0;
let currentRecapData = null;

export async function initRecapModule() {
  await updateProfileDisplay();
  await checkRecapAvailability();
  renderAchievements();
  initBackupButtons();
  initRecapStoriesModal();
}

export async function updateProfileDisplay() {
  const nameEl = document.getElementById('profile-name-display');
  const monthEl = document.getElementById('stat-month-hours');
  const allEl = document.getElementById('stat-all-hours');
  const editBtn = document.getElementById('edit-profile-btn');

  const savedName = await getSetting('profile_name', 'Пользователь');
  if (nameEl) nameEl.textContent = savedName;

  const stats = await getStats();
  if (monthEl) monthEl.textContent = `${stats.monthHours} ч`;
  if (allEl) allEl.textContent = `${stats.allTimeHours} ч`;

  if (editBtn) {
    editBtn.onclick = async () => {
      const newName = prompt('Введите новое имя пользователя:', savedName);
      if (newName && newName.trim()) {
        await saveSetting('profile_name', newName.trim());
        if (nameEl) nameEl.textContent = newName.trim();
      }
    };
  }
}

/* ==========================================================================
   Achievements Logic
   ========================================================================== */
export async function getUnlockedAchievements() {
  return (await getSetting('user_achievements', {})) || {};
}

export async function unlockAchievement(id, increment = 1) {
  const achs = await getUnlockedAchievements();
  const achDef = ACHIEVEMENTS.find((a) => a.id === id);
  if (!achDef) return;

  const curVal = achs[id] || 0;
  const newVal = Math.min(achDef.max, curVal + increment);
  achs[id] = newVal;

  await saveSetting('user_achievements', achs);
  renderAchievements();
}

export async function renderAchievements() {
  const container = document.getElementById('achievements-grid');
  const countLabel = document.getElementById('achievements-count');
  if (!container) return;

  const userAchs = await getUnlockedAchievements();
  container.innerHTML = '';
  let unlockedCount = 0;

  ACHIEVEMENTS.forEach((ach) => {
    const val = userAchs[ach.id] || 0;
    const isUnlocked = val >= ach.max;
    if (isUnlocked) unlockedCount++;

    const percent = Math.round((val / ach.max) * 100);

    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
      <div class="achievement-icon">
        <svg class="svg-icon" style="width: 20px; height: 20px;"><use href="#${ach.icon}"></use></svg>
      </div>
      <div class="achievement-title">${ach.title}</div>
      <div class="achievement-desc">${ach.desc}</div>
      <div class="achievement-progress-bar">
        <div class="achievement-progress-fill" style="width: ${percent}%;"></div>
      </div>
    `;

    container.appendChild(card);
  });

  if (countLabel) {
    countLabel.textContent = `${unlockedCount} / ${ACHIEVEMENTS.length}`;
  }
}

/* ==========================================================================
   Year in Music (Recap) - Activates Dec 14, Snapshot Freeze, Jan 1 Reset
   ========================================================================== */
export async function checkRecapAvailability() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 11 is December
  const date = now.getDate();
  const year = now.getFullYear();

  // Active from December 14 to December 31
  const isRecapActive = month === 11 && date >= 14;

  const sidebarBadge = document.getElementById('sidebar-recap-badge');
  const mobileBadge = document.getElementById('mobile-recap-badge');
  const recapBtnBadge = document.getElementById('recap-btn-badge');
  const recapBtn = document.getElementById('open-year-recap-btn');

  if (isRecapActive) {
    if (sidebarBadge) sidebarBadge.classList.add('active');
    if (mobileBadge) mobileBadge.classList.add('active');
    if (recapBtnBadge) recapBtnBadge.classList.add('active');
    if (recapBtn) {
      recapBtn.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.5)';
    }

    // Freeze snapshot if not yet created for this year
    let snapshot = await getRecapSnapshot(year);
    if (!snapshot) {
      snapshot = await buildRecapSnapshot(year);
      await saveRecapSnapshot(year, snapshot);
    }
    currentRecapData = snapshot;
  } else {
    if (sidebarBadge) sidebarBadge.classList.remove('active');
    if (mobileBadge) mobileBadge.classList.remove('active');
    if (recapBtnBadge) recapBtnBadge.classList.remove('active');
  }
}

async function buildRecapSnapshot(year) {
  const history = await getHistory(5000);
  const catalog = getCachedCatalog();
  const catalogMap = new Map();
  catalog.forEach((t) => catalogMap.set(t.id, t));

  let totalSeconds = 0;
  const artistCounts = {};
  const genreCounts = {};
  const trackCounts = {};

  history.forEach((h) => {
    const d = new Date(h.playedAt);
    if (d.getFullYear() === year) {
      totalSeconds += h.durationPlayed || 0;
      trackCounts[h.trackId] = (trackCounts[h.trackId] || 0) + 1;

      const track = catalogMap.get(h.trackId);
      if (track) {
        if (track.artist) {
          artistCounts[track.artist] = (artistCounts[track.artist] || 0) + 1;
        }
        if (Array.isArray(track.genres)) {
          track.genres.forEach((g) => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
          });
        }
      }
    }
  });

  // Top artist
  const topArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map((a) => a[0]);
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map((g) => g[0]);

  // Top track
  let topTrackId = null;
  let maxPlays = 0;
  for (const [id, count] of Object.entries(trackCounts)) {
    if (count > maxPlays) {
      maxPlays = count;
      topTrackId = id;
    }
  }

  const topTrack = topTrackId ? catalogMap.get(topTrackId) : null;
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const issOrbits = Math.round(totalSeconds / (92.68 * 60)); // ~93 min per ISS orbit

  return {
    year,
    totalHours,
    issOrbits,
    topArtists,
    topGenres,
    topTrack: topTrack ? `${topTrack.artist} — ${topTrack.title}` : 'Ваш любимый трек'
  };
}

function initRecapStoriesModal() {
  const openBtn = document.getElementById('open-year-recap-btn');
  const dialog = document.getElementById('recap-stories-dialog');
  const prevBtn = document.getElementById('recap-prev-slide-btn');
  const nextBtn = document.getElementById('recap-next-slide-btn');

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      const now = new Date();
      if (!currentRecapData) {
        currentRecapData = await buildRecapSnapshot(now.getFullYear());
      }
      recapStoryIndex = 0;
      dialog.classList.add('active');
      renderStoryCard();
    });
  }

  if (dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.classList.remove('active');
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (recapStoryIndex > 0) {
        recapStoryIndex--;
        renderStoryCard();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (recapStoryIndex < 2) {
        recapStoryIndex++;
        renderStoryCard();
      } else {
        dialog.classList.remove('active');
      }
    });
  }
}

function renderStoryCard() {
  const content = document.getElementById('recap-story-content');
  const progressBars = document.querySelectorAll('#recap-progress-bars .achievement-progress-fill');
  if (!content || !currentRecapData) return;

  progressBars.forEach((fill, idx) => {
    fill.style.width = idx <= recapStoryIndex ? '100%' : '0%';
  });

  if (recapStoryIndex === 0) {
    content.innerHTML = `
      <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.5px; color: #EC4899; font-weight: 700;">ВРЕМЯ ЗВУКА</div>
      <div style="font-size: 3rem; font-weight: 800; color: #FFF; margin: 12px 0;">${currentRecapData.totalHours} ч</div>
      <p style="font-size: 0.95rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.6; max-width: 320px;">
        Вы провели с музыкой <strong>${currentRecapData.totalHours} часов</strong>. За это время Международная Космическая Станция (МКС) совершила <strong>${currentRecapData.issOrbits} витков</strong> вокруг Земли!
      </p>
    `;
  } else if (recapStoryIndex === 1) {
    const artistsStr = currentRecapData.topArtists.length > 0 ? currentRecapData.topArtists.join(', ') : 'Разнообразные артисты';
    const genresStr = currentRecapData.topGenres.length > 0 ? currentRecapData.topGenres.join(', ') : 'Все жанры';

    content.innerHTML = `
      <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.5px; color: #8B5CF6; font-weight: 700;">ВАШИ ФАВОРИТЫ</div>
      <div style="font-size: 1.4rem; font-weight: 700; color: #FFF; margin-top: 16px;">Топ музыкантов:</div>
      <div style="font-size: 1.1rem; color: var(--md-sys-color-primary); font-weight: 600; margin-top: 4px;">${artistsStr}</div>
      <div style="font-size: 1.4rem; font-weight: 700; color: #FFF; margin-top: 20px;">Любимые жанры:</div>
      <div style="font-size: 1.1rem; color: #EC4899; font-weight: 600; margin-top: 4px;">${genresStr}</div>
    `;
  } else if (recapStoryIndex === 2) {
    content.innerHTML = `
      <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.5px; color: #10B981; font-weight: 700;">САМЫЙ ЗАСЛУШАННЫЙ ТРЕК</div>
      <div style="width: 100px; height: 100px; border-radius: 50%; background: #222; margin: 20px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);">
        <svg class="svg-icon" style="width: 48px; height: 48px; fill: #10B981;"><use href="#icon-music"></use></svg>
      </div>
      <div style="font-size: 1.35rem; font-weight: 700; color: #FFF;">${currentRecapData.topTrack}</div>
      <p style="font-size: 0.85rem; color: var(--md-sys-color-outline); margin-top: 8px;">Спасибо, что провели этот музыкальный год с ouMusic!</p>
    `;
  }
}

/* ==========================================================================
   Backup & Restore (JSON)
   ========================================================================== */
function initBackupButtons() {
  const exportBtn = document.getElementById('export-profile-json-btn');
  const importBtn = document.getElementById('import-profile-json-btn');

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const json = await exportBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `oumusic_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
          try {
            const text = await e.target.files[0].text();
            await importBackupJSON(text);
            await updateProfileDisplay();
            alert('Резервная копия профиля успешно восстановлена!');
          } catch (err) {
            alert('Ошибка при импорте резервной копии: ' + err.message);
          }
        }
      };
      input.click();
    });
  }
}
