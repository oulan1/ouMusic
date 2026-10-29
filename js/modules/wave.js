import { engine } from '../core/engine.js';
import { getBlacklist, isLiked, getHistory } from '../core/storage.js';
import { getCachedCatalog } from './github.js';

export const EXTENDED_GENRES = [
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

let selectedMood = 'all';
let selectedCharacter = 'any';
let selectedGenre = 'all';
let waveActive = false;
let waveQueue = [];
let animFrameId = null;

export function initWaveModule(onPlayTrackCallback) {
  renderWaveGenreChips();
  initWaveCanvas();

  // Mood chips clicks
  document.querySelectorAll('#wave-mood-chips .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#wave-mood-chips .chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = btn.getAttribute('data-mood') || 'all';
      if (waveActive) regenerateWaveQueue(onPlayTrackCallback);
    });
  });

  // Character chips clicks
  document.querySelectorAll('#wave-character-chips .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#wave-character-chips .chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      selectedCharacter = btn.getAttribute('data-char') || 'any';
      if (waveActive) regenerateWaveQueue(onPlayTrackCallback);
    });
  });

  // Hero start wave button
  const heroBtn = document.getElementById('hero-start-wave-btn');
  if (heroBtn) {
    heroBtn.addEventListener('click', () => {
      startWave(onPlayTrackCallback);
    });
  }

  // Wave screen play/skip buttons
  const wavePlayBtn = document.getElementById('wave-play-toggle-btn');
  if (wavePlayBtn) {
    wavePlayBtn.addEventListener('click', () => {
      if (!waveActive) {
        startWave(onPlayTrackCallback);
      } else {
        engine.togglePlay();
      }
    });
  }

  const waveSkipBtn = document.getElementById('wave-skip-btn');
  if (waveSkipBtn) {
    waveSkipBtn.addEventListener('click', () => {
      playNextWaveTrack(onPlayTrackCallback);
    });
  }
}

function renderWaveGenreChips() {
  const container = document.getElementById('wave-genre-chips');
  if (!container) return;

  container.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'chip active';
  allBtn.setAttribute('data-genre', 'all');
  allBtn.textContent = 'Все жанры';
  container.appendChild(allBtn);

  EXTENDED_GENRES.forEach((genre) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.setAttribute('data-genre', genre);
    btn.textContent = genre;
    container.appendChild(btn);
  });

  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedGenre = chip.getAttribute('data-genre') || 'all';
      if (waveActive) regenerateWaveQueue();
    });
  });
}

export async function startWave(onPlayTrackCallback) {
  waveActive = true;
  await regenerateWaveQueue(onPlayTrackCallback);
  playNextWaveTrack(onPlayTrackCallback);
}

export async function regenerateWaveQueue(onPlayTrackCallback) {
  const catalog = getCachedCatalog();
  const blacklist = await getBlacklist();
  const history = await getHistory(100);
  const playedIds = new Set(history.map((h) => h.trackId));

  // Filter out blacklist
  let available = catalog.filter((t) => !blacklist.includes(t.id));

  // Filter by genre
  if (selectedGenre !== 'all') {
    available = available.filter((t) => {
      return Array.isArray(t.genres) && t.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());
    });
  }

  // Filter by character
  if (selectedCharacter === 'familiar') {
    available = available.filter((t) => playedIds.has(t.id));
  } else if (selectedCharacter === 'unfamiliar') {
    available = available.filter((t) => !playedIds.has(t.id));
  }

  // Shuffle available tracks
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  waveQueue = available;

  if (waveQueue.length === 0 && catalog.length > 0) {
    // Fallback to all non-blacklisted
    waveQueue = catalog.filter((t) => !blacklist.includes(t.id));
  }
}

export function playNextWaveTrack(onPlayTrackCallback) {
  if (waveQueue.length === 0) {
    regenerateWaveQueue().then(() => {
      if (waveQueue.length > 0 && onPlayTrackCallback) {
        const next = waveQueue.shift();
        onPlayTrackCallback(next);
      }
    });
    return;
  }

  const nextTrack = waveQueue.shift();
  if (onPlayTrackCallback && nextTrack) {
    onPlayTrackCallback(nextTrack);
    updateWaveScreenMeta(nextTrack);
  }
}

export function updateWaveScreenMeta(track) {
  const titleEl = document.getElementById('wave-track-title');
  const artistEl = document.getElementById('wave-track-artist');
  if (titleEl) titleEl.textContent = track.title || 'Безымянный трек';
  if (artistEl) artistEl.textContent = track.artist || 'Неизвестный исполнитель';
}

/* ==========================================================================
   Wave Canvas Pulsating Sphere Animation (60 FPS)
   ========================================================================== */
function initWaveCanvas() {
  const canvas = document.getElementById('wave-sphere-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let angle = 0;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    let bassEnergy = 0;
    let midEnergy = 0;
    if (engine.analyserNode && engine.isPlaying) {
      const data = new Uint8Array(engine.analyserNode.frequencyBinCount);
      engine.analyserNode.getByteFrequencyData(data);
      let bassSum = 0;
      for (let i = 0; i < 14; i++) bassSum += data[i];
      bassEnergy = bassSum / 14 / 255; // 0 to 1

      let midSum = 0;
      for (let i = 14; i < 50; i++) midSum += data[i];
      midEnergy = midSum / 36 / 255;
    }

    angle += 0.018 + bassEnergy * 0.045;
    const idlePulse = Math.sin(angle * 1.5) * 3.5;
    const baseRadius = 88 + idlePulse + bassEnergy * 46;

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-primary').trim() || '#8B5CF6';

    // 1. Radiant Glowing Backdrop Aura
    const aura = ctx.createRadialGradient(cx, cy, baseRadius * 0.25, cx, cy, baseRadius * 1.55);
    aura.addColorStop(0, primaryColor);
    aura.addColorStop(0.42, 'rgba(236, 72, 153, 0.45)');
    aura.addColorStop(0.78, 'rgba(59, 130, 246, 0.2)');
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
      const distortion1 = Math.sin(theta * 6 + angle * 1.6) * (6 + bassEnergy * 20);
      const distortion2 = Math.cos(theta * 3 - angle * 1.2) * (4 + midEnergy * 12);
      const r = baseRadius + distortion1 + distortion2;
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.lineWidth = 3.5 + bassEnergy * 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 18 + bassEnergy * 25;
    ctx.stroke();
    ctx.restore();

    animFrameId = requestAnimationFrame(render);
  }

  if (animFrameId) cancelAnimationFrame(animFrameId);
  render();
}
