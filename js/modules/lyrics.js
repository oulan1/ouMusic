import { engine } from '../core/engine.js';

let parsedLyrics = []; // [{ time: 10.5, text: "Line" }]
let activeLineIndex = -1;
let currentTrack = null;
let countdownActive = false;

export function initLyricsModule() {
  const openBtn = document.getElementById('fs-open-lyrics-btn');
  const closeBtn = document.getElementById('close-lyrics-btn');
  const overlay = document.getElementById('lyrics-overlay');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      overlay.classList.add('active');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }

  // Vocal Remover BETA button
  const vocalBtn = document.getElementById('lyrics-vocal-remover-toggle');
  if (vocalBtn) {
    vocalBtn.addEventListener('click', () => {
      const isNowActive = !engine.vocalRemoverActive;
      engine.setVocalRemover(isNowActive);
      vocalBtn.classList.toggle('active', isNowActive);
    });
  }

  // Sync update with engine
  engine.audioElement.addEventListener('timeupdate', () => {
    if (!overlay.classList.contains('active') && !document.getElementById('fullscreen-player').classList.contains('active')) {
      return;
    }
    updateActiveLyric(engine.audioElement.currentTime);
  });

  initQuoteCardDialog();
}

export function loadLyrics(lrcText, track) {
  currentTrack = track;
  parsedLyrics = parseLRC(lrcText);
  renderLyricsLines();
}

function parseLRC(lrcText) {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  lines.forEach((line) => {
    const text = line.replace(timeRegex, '').trim();
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

function renderLyricsLines() {
  const container = document.getElementById('lyrics-scroll-container');
  if (!container) return;

  container.innerHTML = '';
  activeLineIndex = -1;

  if (parsedLyrics.length === 0) {
    container.innerHTML = `
      <div style="color: var(--md-sys-color-outline); font-size: 1.1rem; margin-top: 40px;">
        Текст песни для этого трека отсутствует
      </div>
    `;
    return;
  }

  parsedLyrics.forEach((item, index) => {
    const p = document.createElement('div');
    p.className = 'lyric-line';
    p.setAttribute('data-index', index);
    p.textContent = item.text;

    // Click to seek
    p.addEventListener('click', () => {
      engine.seek(item.time);
      engine.softPlay();
    });

    container.appendChild(p);
  });
}

function updateActiveLyric(currentTime) {
  if (parsedLyrics.length === 0) return;

  // 1. 3-2-1 Countdown Logic
  const countdownBanner = document.getElementById('lyrics-countdown-banner');
  const firstTime = parsedLyrics[0]?.time || 0;
  if (currentTime < firstTime && firstTime >= 3.0 && firstTime - currentTime <= 3.0) {
    const remaining = Math.ceil(firstTime - currentTime);
    if (countdownBanner) {
      countdownBanner.textContent = `${remaining}...`;
      countdownBanner.classList.add('visible');
    }
  } else if (countdownBanner) {
    countdownBanner.classList.remove('visible');
  }

  // 2. Locate active index
  let newIdx = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (currentTime >= parsedLyrics[i].time) {
      newIdx = i;
    } else {
      break;
    }
  }

  if (newIdx !== activeLineIndex && newIdx >= 0) {
    activeLineIndex = newIdx;
    const container = document.getElementById('lyrics-scroll-container');
    const lines = container.querySelectorAll('.lyric-line');

    lines.forEach((el, idx) => {
      if (idx === activeLineIndex) {
        el.classList.add('active');
        // Smooth center scroll
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        el.classList.remove('active');
      }
    });
  }
}

/* ==========================================================================
   Quote Photo Card Generator (HTML5 Canvas 720x960)
   ========================================================================== */
function initQuoteCardDialog() {
  const shareQuoteBtn = document.getElementById('lyrics-share-quote-btn');
  const dialog = document.getElementById('quote-card-dialog');
  const closeBtn = document.getElementById('quote-dialog-close-btn');
  const downloadBtn = document.getElementById('quote-download-btn');
  const shareBtn = document.getElementById('quote-share-btn');
  const linesSelector = document.getElementById('quote-lines-selector');
  const canvas = document.getElementById('quote-render-canvas');

  if (shareQuoteBtn) {
    shareQuoteBtn.addEventListener('click', () => {
      if (parsedLyrics.length === 0) {
        alert('Для создания карточки нужен текст песни!');
        return;
      }
      dialog.classList.add('active');
      renderLineCheckboxes();
      renderQuoteCanvas();
    });
  }

  const closeDialog = () => dialog.classList.remove('active');
  if (closeBtn) closeBtn.addEventListener('click', closeDialog);
  if (dialog) dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });

  function renderLineCheckboxes() {
    linesSelector.innerHTML = '';
    const selectedIndices = [activeLineIndex >= 0 ? activeLineIndex : 0];

    parsedLyrics.slice(0, 30).forEach((line, idx) => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.style.fontSize = '0.85rem';
      label.style.cursor = 'pointer';

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = idx;
      chk.checked = selectedIndices.includes(idx);

      chk.addEventListener('change', () => {
        const checked = linesSelector.querySelectorAll('input:checked');
        if (checked.length > 4) {
          chk.checked = false;
          alert('Можно выбрать максимум 4 строки текста!');
          return;
        }
        renderQuoteCanvas();
      });

      label.appendChild(chk);
      label.appendChild(document.createTextNode(line.text));
      linesSelector.appendChild(label);
    });
  }

  function getSelectedLines() {
    const checked = linesSelector.querySelectorAll('input:checked');
    const lines = [];
    checked.forEach((c) => {
      const idx = parseInt(c.value, 10);
      if (parsedLyrics[idx]) lines.push(parsedLyrics[idx].text);
    });
    return lines.length > 0 ? lines : ['ouMusic'];
  }

  function renderQuoteCanvas() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background gradient / dark atmosphere
    ctx.fillStyle = '#0E0E14';
    ctx.fillRect(0, 0, w, h);

    // Decorative neon glow circles
    const grad = ctx.createRadialGradient(w / 2, h / 3, 50, w / 2, h / 3, 400);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
    grad.addColorStop(0.6, 'rgba(236, 72, 153, 0.25)');
    grad.addColorStop(1, 'rgba(14, 14, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Track Meta Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = 'center';
    ctx.fillText(currentTrack?.title || 'Трек', w / 2, 140);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText(currentTrack?.artist || 'Артист', w / 2, 180);

    // Quotes Box
    const lines = getSelectedLines();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = 'center';

    const startY = 400 - (lines.length * 60) / 2;
    lines.forEach((lineText, i) => {
      ctx.fillText(`« ${lineText} »`, w / 2, startY + i * 70);
    });

    // Bottom Logo
    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText('ouMusic • M-CORE', w / 2, h - 80);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.download = `quote_${currentTrack?.title || 'ouMusic'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `quote_${currentTrack?.title || 'oumusic'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: currentTrack?.title,
              text: `Цитата из трека ${currentTrack?.artist} — ${currentTrack?.title}`
            });
          } catch (e) {}
        } else {
          // Fallback to download
          downloadBtn.click();
        }
      });
    });
  }
}
