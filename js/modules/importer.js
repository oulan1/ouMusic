import { getCachedCatalog } from './github.js';
import { createPlaylist } from '../core/storage.js';

export function initImporterModule({ onPlaylistCreated }) {
  const openBtn = document.getElementById('lib-import-tunemymusic-btn');
  const dialog = document.getElementById('tunemymusic-dialog');
  const chooseFileBtn = document.getElementById('tunemymusic-choose-file-btn');
  const fileInput = document.getElementById('tunemymusic-file-input');
  const closeBtn = document.getElementById('tunemymusic-close-btn');
  const saveBtn = document.getElementById('tunemymusic-save-playlist-btn');

  let matchedTrackIds = [];
  let playlistName = 'Импорт из TuneMyMusic';

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      dialog.classList.add('active');
    });
  }

  const closeDialog = () => {
    dialog.classList.remove('active');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeDialog);
  if (dialog) dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });

  if (chooseFileBtn && fileInput) {
    chooseFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        playlistName = file.name.replace(/\.[^/.]+$/, '');
        const text = await file.text();
        const results = processTuneMyMusicFile(text);
        renderImportReport(results);

        matchedTrackIds = results.filter((r) => r.status !== 'not_found').map((r) => r.matchedTrack.id);
        if (matchedTrackIds.length > 0 && saveBtn) {
          saveBtn.style.display = 'block';
        }
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (matchedTrackIds.length === 0) return;
      const pl = await createPlaylist(playlistName, 'Импортировано из TuneMyMusic', null, matchedTrackIds);
      closeDialog();
      if (onPlaylistCreated) onPlaylistCreated(pl);
      alert(`Плейлист "${playlistName}" успешно создан (${matchedTrackIds.length} треков)!`);
    });
  }
}

function processTuneMyMusicFile(fileText) {
  const lines = fileText.split('\n').map((l) => l.trim()).filter(Boolean);
  const catalog = getCachedCatalog();
  const report = [];

  lines.forEach((line) => {
    // Clean CSV quotes if present
    const cleanLine = line.replace(/^["']|["']$/g, '');
    let artist = '';
    let title = cleanLine;

    if (cleanLine.includes(' - ')) {
      const parts = cleanLine.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    } else if (cleanLine.includes(',')) {
      const parts = cleanLine.split(',');
      title = parts[0].trim();
      artist = parts[1] ? parts[1].trim() : '';
    }

    // Fuzzy match against catalog
    let bestMatch = null;
    let highestScore = 0;

    catalog.forEach((catTrack) => {
      const score = calculateTrackSimilarity(artist, title, catTrack.artist, catTrack.title);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = catTrack;
      }
    });

    if (highestScore >= 0.95) {
      report.push({ query: cleanLine, status: 'exact', matchedTrack: bestMatch });
    } else if (highestScore >= 0.70) {
      report.push({ query: cleanLine, status: 'fuzzy', matchedTrack: bestMatch, score: Math.round(highestScore * 100) });
    } else {
      report.push({ query: cleanLine, status: 'not_found', matchedTrack: null });
    }
  });

  return report;
}

function renderImportReport(results) {
  const container = document.getElementById('tunemymusic-report-container');
  const list = document.getElementById('tunemymusic-report-list');
  if (!container || !list) return;

  container.style.display = 'block';
  list.innerHTML = '';

  results.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.style.cursor = 'default';

    let iconHtml = '';
    let statusText = '';

    if (item.status === 'exact') {
      iconHtml = '<span class="badge-downloaded" title="Точное совпадение"><svg class="svg-icon" style="width: 18px; height: 18px;"><use href="#icon-check-circle"></use></svg></span>';
      statusText = `${item.matchedTrack.artist} — ${item.matchedTrack.title}`;
    } else if (item.status === 'fuzzy') {
      iconHtml = '<span style="color: #F59E0B;" title="Частичное совпадение"><svg class="svg-icon" style="width: 18px; height: 18px; fill: #F59E0B;"><use href="#icon-warning"></use></svg></span>';
      statusText = `Частично: ${item.matchedTrack.artist} — ${item.matchedTrack.title} (${item.score}%)`;
    } else {
      iconHtml = '<span style="color: #EF4444;" title="Не найдено"><svg class="svg-icon" style="width: 18px; height: 18px; fill: #EF4444;"><use href="#icon-close"></use></svg></span>';
      statusText = 'Трек не найден в каталоге';
    }

    row.innerHTML = `
      <div style="flex-shrink: 0;">${iconHtml}</div>
      <div class="track-info">
        <div class="track-title" style="font-size: 0.85rem;">${item.query}</div>
        <div class="track-artist" style="font-size: 0.75rem;">${statusText}</div>
      </div>
    `;

    list.appendChild(row);
  });
}

/* ==========================================================================
   Levenshtein Distance & Similarity Calculation
   ========================================================================== */
function calculateTrackSimilarity(qArtist, qTitle, cArtist, cTitle) {
  const normA1 = (qArtist || '').toLowerCase().trim();
  const normT1 = (qTitle || '').toLowerCase().trim();
  const normA2 = (cArtist || '').toLowerCase().trim();
  const normT2 = (cTitle || '').toLowerCase().trim();

  const titleSim = stringSimilarity(normT1, normT2);
  const artistSim = normA1 && normA2 ? stringSimilarity(normA1, normA2) : 1.0;

  return titleSim * 0.7 + artistSim * 0.3;
}

function stringSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const dist = levenshtein(longer, shorter);
  return (longerLength - dist) / longerLength;
}

function levenshtein(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
