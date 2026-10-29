import { EXTENDED_GENRES } from './wave.js';
import { buildOump3Container } from '../core/oump3.js';
import { unlockAchievement } from './recap.js';
import { getCachedCatalog } from './github.js';

let studioAudioBuffer = null;
let trimmedAudioBlob = null;
let originalAudioBlob = null;
let studioAudioContext = null;
let previewSourceNode = null;

let trimStartPercent = 0.0;
let trimEndPercent = 1.0;
let finalDuration = 0;

let lyricsRows = []; // [{ text: "...", time: null }]
let activeRowIndex = 0;

let studioAudioEl = new Audio();
let isStudioPlaying = false;
let studioPlaySpeed = 1.0;
let studioThumbBase64 = null;
let studioCoverBlob = null;

export function initStudioModule() {
  renderGenreChips();
  initCoverUpload();
  initArtistAutocomplete();
  initAudioFileHandler();
  initWaveformCanvas();
  initStep2Lyrics();
  initBuildButton();
}

function renderGenreChips() {
  const container = document.getElementById('studio-genres-chips');
  if (!container) return;

  container.innerHTML = '';
  EXTENDED_GENRES.forEach((g) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = g;
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
    });
    container.appendChild(btn);
  });
}

/* ==========================================================================
   Cover Upload & Canvas Thumbnail Compression (thumbBase64 ~30KB)
   ========================================================================== */
function initCoverUpload() {
  const dropzone = document.getElementById('studio-cover-dropzone');
  const fileInput = document.getElementById('studio-cover-file');
  const previewImg = document.getElementById('studio-cover-preview');
  const placeholder = document.getElementById('studio-cover-placeholder');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processCoverFile(e.target.files[0]);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--md-sys-color-primary)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--md-sys-color-outline)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--md-sys-color-outline)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCoverFile(e.dataTransfer.files[0]);
    }
  });

  function processCoverFile(file) {
    if (file.size > 10 * 1024 * 1024) {
      alert('Ошибка: Обложка превышает допустимый размер 10 МБ!');
      return;
    }

    studioCoverBlob = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      previewImg.src = event.target.result;
      previewImg.style.display = 'block';
      placeholder.style.display = 'none';

      // Generate compressed thumbnail via Canvas
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 160;
        c.height = 160;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 160, 160);
        studioThumbBase64 = c.toDataURL('image/jpeg', 0.85);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function initArtistAutocomplete() {
  const input = document.getElementById('studio-artist-input');
  const list = document.getElementById('studio-artist-suggestions');
  if (!input || !list) return;

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    if (!val) {
      list.style.display = 'none';
      return;
    }

    const catalog = getCachedCatalog();
    const artistsSet = new Set();
    catalog.forEach((t) => {
      if (t.artist) {
        t.artist.split(',').forEach((a) => artistsSet.add(a.trim()));
      }
    });

    const matches = Array.from(artistsSet).filter((a) => a.toLowerCase().includes(val));
    if (matches.length > 0) {
      list.innerHTML = '';
      matches.slice(0, 5).forEach((match) => {
        const item = document.createElement('div');
        item.style.padding = '8px 12px';
        item.style.cursor = 'pointer';
        item.style.fontSize = '0.85rem';
        item.textContent = match;
        item.addEventListener('click', () => {
          input.value = match;
          list.style.display = 'none';
        });
        list.appendChild(item);
      });
      list.style.display = 'block';
    } else {
      list.style.display = 'none';
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target)) list.style.display = 'none';
  });
}

/* ==========================================================================
   STEP 1: Audio Decoding & Interactive Waveform Trimmer
   ========================================================================== */
function initAudioFileHandler() {
  const chooseBtn = document.getElementById('studio-choose-audio-btn');
  const fileInput = document.getElementById('studio-audio-file');
  const statusBadge = document.getElementById('studio-audio-status');
  const waveformBox = document.getElementById('studio-waveform-box');

  if (chooseBtn && fileInput) {
    chooseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        originalAudioBlob = file;
        statusBadge.textContent = 'Декодирование волны...';
        statusBadge.style.background = '#F59E0B';

        try {
          if (!studioAudioContext) {
            studioAudioContext = new (window.AudioContext || window.webkitAudioContext)();
          }
          const arrayBuf = await file.arrayBuffer();
          studioAudioBuffer = await studioAudioContext.decodeAudioData(arrayBuf);

          finalDuration = studioAudioBuffer.duration;
          trimStartPercent = 0.0;
          trimEndPercent = 1.0;

          statusBadge.textContent = 'Аудио готово к обрезке';
          statusBadge.style.background = '#10B981';
          waveformBox.style.display = 'block';

          drawWaveform();
          updateTrimLabels();
        } catch (err) {
          console.error('[Studio] Audio decoding failed:', err);
          statusBadge.textContent = 'Ошибка декодирования';
          statusBadge.style.background = '#EF4444';
          alert('Не удалось декодировать аудиофайл. Проверьте формат (.mp3 или .wav).');
        }
      }
    });
  }

  // Play preview slice
  const playTrimBtn = document.getElementById('studio-play-trim-btn');
  if (playTrimBtn) {
    playTrimBtn.addEventListener('click', () => {
      if (!studioAudioBuffer || !studioAudioContext) return;

      if (previewSourceNode) {
        previewSourceNode.stop();
        previewSourceNode = null;
        playTrimBtn.querySelector('span').textContent = 'Прослушать отрезок';
        return;
      }

      previewSourceNode = studioAudioContext.createBufferSource();
      previewSourceNode.buffer = studioAudioBuffer;
      previewSourceNode.connect(studioAudioContext.destination);

      const startTime = trimStartPercent * studioAudioBuffer.duration;
      const duration = (trimEndPercent - trimStartPercent) * studioAudioBuffer.duration;

      previewSourceNode.start(0, startTime, duration);
      playTrimBtn.querySelector('span').textContent = 'Остановить';

      previewSourceNode.onended = () => {
        previewSourceNode = null;
        playTrimBtn.querySelector('span').textContent = 'Прослушать отрезок';
      };
    });
  }

  // Confirm Trim Button
  const confirmBtn = document.getElementById('studio-confirm-trim-btn');
  const keepOriginalBtn = document.getElementById('studio-keep-original-btn');
  const step2Box = document.getElementById('studio-step-2-box');

  const finalizeAudio = async (isTrimmed) => {
    if (!studioAudioBuffer) return;

    if (previewSourceNode) {
      previewSourceNode.stop();
      previewSourceNode = null;
    }

    if (isTrimmed && (trimStartPercent > 0 || trimEndPercent < 1)) {
      const startSample = Math.floor(trimStartPercent * studioAudioBuffer.length);
      const endSample = Math.floor(trimEndPercent * studioAudioBuffer.length);
      const sliceLength = endSample - startSample;

      const trimmedBuffer = studioAudioContext.createBuffer(
        studioAudioBuffer.numberOfChannels,
        sliceLength,
        studioAudioBuffer.sampleRate
      );

      for (let ch = 0; ch < studioAudioBuffer.numberOfChannels; ch++) {
        const fromData = studioAudioBuffer.getChannelData(ch);
        const toData = trimmedBuffer.getChannelData(ch);
        toData.set(fromData.subarray(startSample, endSample));
      }

      // Encode trimmed buffer into pure WAV Blob
      trimmedAudioBlob = audioBufferToWavBlob(trimmedBuffer);
      finalDuration = trimmedBuffer.duration;
    } else {
      trimmedAudioBlob = originalAudioBlob;
      finalDuration = studioAudioBuffer.duration;
    }

    // Load into Studio Player for Step 2
    studioAudioEl.src = URL.createObjectURL(trimmedAudioBlob);
    studioAudioEl.load();

    waveformBox.style.display = 'none';
    step2Box.style.display = 'block';
    statusBadge.textContent = `Зафиксировано: ${Math.round(finalDuration)} сек (новая 00:00)`;
    statusBadge.style.background = '#8B5CF6';
  };

  if (confirmBtn) confirmBtn.addEventListener('click', () => finalizeAudio(true));
  if (keepOriginalBtn) keepOriginalBtn.addEventListener('click', () => finalizeAudio(false));
}

function initWaveformCanvas() {
  const container = document.getElementById('waveform-container');
  const canvas = document.getElementById('studio-waveform-canvas');
  const handleStart = document.getElementById('trim-handle-start');
  const handleEnd = document.getElementById('trim-handle-end');

  if (!container || !canvas) return;

  let activeHandle = null;

  const onDrag = (e) => {
    if (!activeHandle || !studioAudioBuffer) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;

    if (activeHandle === 'start') {
      trimStartPercent = Math.min(percent, trimEndPercent - 0.05);
      handleStart.style.left = `${trimStartPercent * 100}%`;
    } else if (activeHandle === 'end') {
      trimEndPercent = Math.max(percent, trimStartPercent + 0.05);
      handleEnd.style.right = `${(1 - trimEndPercent) * 100}%`;
    }

    updateTrimLabels();
    drawWaveform();
  };

  const onDragEnd = () => {
    activeHandle = null;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onDrag);
    window.removeEventListener('touchend', onDragEnd);
  };

  handleStart.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    activeHandle = 'start';
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', onDragEnd);
  });

  handleEnd.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    activeHandle = 'end';
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', onDragEnd);
  });

  handleStart.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    activeHandle = 'start';
    window.addEventListener('touchmove', onDrag);
    window.addEventListener('touchend', onDragEnd);
  });

  handleEnd.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    activeHandle = 'end';
    window.addEventListener('touchmove', onDrag);
    window.addEventListener('touchend', onDragEnd);
  });
}

function drawWaveform() {
  const canvas = document.getElementById('studio-waveform-canvas');
  if (!canvas || !studioAudioBuffer) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 600;
  canvas.height = canvas.offsetHeight || 140;

  const w = canvas.width;
  const h = canvas.height;
  const channelData = studioAudioBuffer.getChannelData(0);
  const step = Math.ceil(channelData.length / w);
  const amp = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Background grid line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(0, amp);
  ctx.lineTo(w, amp);
  ctx.stroke();

  // Draw waveform bars
  const startX = trimStartPercent * w;
  const endX = trimEndPercent * w;

  for (let i = 0; i < w; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = channelData[i * step + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }

    const isInside = i >= startX && i <= endX;
    ctx.fillStyle = isInside ? '#8B5CF6' : 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
  }
}

function updateTrimLabels() {
  if (!studioAudioBuffer) return;
  const total = studioAudioBuffer.duration;
  const startSec = trimStartPercent * total;
  const endSec = trimEndPercent * total;
  const durSec = endSec - startSec;

  const startLbl = document.getElementById('trim-start-label');
  const endLbl = document.getElementById('trim-end-label');
  const durLbl = document.getElementById('trim-duration-label');

  if (startLbl) startLbl.textContent = formatSecToMMSS(startSec);
  if (endLbl) endLbl.textContent = formatSecToMMSS(endSec);
  if (durLbl) durLbl.textContent = `${durSec.toFixed(1)} сек`;
}

function formatSecToMMSS(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${m < 10 ? '0' : ''}${m}:${parseFloat(s) < 10 ? '0' : ''}${s}`;
}

/* ==========================================================================
   STEP 2: Lyrics Constructor & Live Tap-Sync Table
   ========================================================================== */
function initStep2Lyrics() {
  const pasteBtn = document.getElementById('studio-apply-pasted-lyrics-btn');
  const textarea = document.getElementById('studio-paste-lyrics-textarea');
  const playBtn = document.getElementById('studio-sync-play-btn');
  const scrubber = document.getElementById('studio-sync-scrubber');
  const timerLbl = document.getElementById('studio-player-timer');
  const tapBtn = document.getElementById('studio-tap-record-btn');
  const addLineBtn = document.getElementById('studio-add-empty-line-btn');
  const seekBackBtn = document.getElementById('studio-seek-back-5');
  const seekFwdBtn = document.getElementById('studio-seek-fwd-5');
  const speedBtn = document.getElementById('studio-speed-toggle-btn');

  // Paste lyrics split
  if (pasteBtn && textarea) {
    pasteBtn.addEventListener('click', () => {
      const raw = textarea.value.trim();
      if (!raw) return;
      const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
      lyricsRows = lines.map((l) => ({ text: l, time: null }));
      activeRowIndex = 0;
      renderLyricsRows();
    });
  }

  // Studio Player Controls
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (studioAudioEl.paused) {
        studioAudioEl.play();
        isStudioPlaying = true;
        playBtn.querySelector('span').textContent = 'Пауза';
      } else {
        studioAudioEl.pause();
        isStudioPlaying = false;
        playBtn.querySelector('span').textContent = 'Воспроизвести';
      }
    });
  }

  studioAudioEl.addEventListener('timeupdate', () => {
    if (!studioAudioEl.duration) return;
    const percent = (studioAudioEl.currentTime / studioAudioEl.duration) * 100;
    if (scrubber && !scrubber.matches(':active')) {
      scrubber.value = percent;
    }
    if (timerLbl) timerLbl.textContent = formatSecToMMSS(studioAudioEl.currentTime);
  });

  if (scrubber) {
    scrubber.addEventListener('input', () => {
      if (studioAudioEl.duration) {
        studioAudioEl.currentTime = (scrubber.value / 100) * studioAudioEl.duration;
      }
    });
  }

  if (seekBackBtn) {
    seekBackBtn.addEventListener('click', () => {
      studioAudioEl.currentTime = Math.max(0, studioAudioEl.currentTime - 5);
    });
  }

  if (seekFwdBtn) {
    seekFwdBtn.addEventListener('click', () => {
      studioAudioEl.currentTime = Math.min(studioAudioEl.duration || 0, studioAudioEl.currentTime + 5);
    });
  }

  if (speedBtn) {
    speedBtn.addEventListener('click', () => {
      studioPlaySpeed = studioPlaySpeed === 1.0 ? 0.75 : 1.0;
      studioAudioEl.playbackRate = studioPlaySpeed;
      speedBtn.textContent = `${studioPlaySpeed.toFixed(2)}x`;
    });
  }

  // Tap-Sync Action (Spacebar & Button)
  const recordTap = () => {
    if (lyricsRows.length === 0 || activeRowIndex >= lyricsRows.length) return;

    const curSec = studioAudioEl.currentTime;
    lyricsRows[activeRowIndex].time = curSec;

    // Move to next row
    activeRowIndex++;
    renderLyricsRows();

    // Auto-scroll to active row
    const container = document.getElementById('studio-lyrics-rows-list');
    const targetRow = container.querySelector(`[data-row-idx="${activeRowIndex}"]`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  if (tapBtn) tapBtn.addEventListener('click', recordTap);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.getElementById('screen-studio').classList.contains('active')) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      recordTap();
    }
  });

  if (addLineBtn) {
    addLineBtn.addEventListener('click', () => {
      lyricsRows.push({ text: 'Новая строка', time: null });
      renderLyricsRows();
    });
  }
}

function renderLyricsRows() {
  const container = document.getElementById('studio-lyrics-rows-list');
  if (!container) return;

  container.innerHTML = '';
  lyricsRows.forEach((row, idx) => {
    const item = document.createElement('div');
    item.className = `tap-sync-row ${idx === activeRowIndex ? 'current-target' : ''}`;
    item.setAttribute('data-row-idx', idx);

    const timeStr = row.time !== null ? formatSecToMMSS(row.time) : '--:--.-';

    item.innerHTML = `
      <div class="tap-sync-time" title="Кликните для перезаписи тайминга">${timeStr}</div>
      <input type="text" class="tap-sync-input" value="${row.text.replace(/"/g, '&quot;')}">
      <button class="icon-btn delete-row-btn" style="width: 28px; height: 28px; color: var(--md-sys-color-error);" title="Удалить строку">
        <svg class="svg-icon" style="width: 16px; height: 16px;"><use href="#icon-trash"></use></svg>
      </button>
    `;

    // Click on time to re-target this row
    item.querySelector('.tap-sync-time').addEventListener('click', () => {
      activeRowIndex = idx;
      renderLyricsRows();
    });

    // Edit text
    const textInput = item.querySelector('.tap-sync-input');
    textInput.addEventListener('input', () => {
      row.text = textInput.value;
    });

    // Delete row
    item.querySelector('.delete-row-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      lyricsRows.splice(idx, 1);
      if (activeRowIndex >= lyricsRows.length) activeRowIndex = Math.max(0, lyricsRows.length - 1);
      renderLyricsRows();
    });

    container.appendChild(item);
  });
}

function generateLRC() {
  if (lyricsRows.length === 0) return '';
  const lines = [];
  lyricsRows.forEach((r) => {
    if (r.time !== null) {
      const m = Math.floor(r.time / 60);
      const s = Math.floor(r.time % 60);
      const ms = Math.floor((r.time % 1) * 100);
      const stamp = `[${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}.${ms < 10 ? '0' : ''}${ms}]`;
      lines.push(`${stamp}${r.text}`);
    }
  });
  return lines.join('\n');
}

/* ==========================================================================
   Build .oump3 Packaging
   ========================================================================== */
function initBuildButton() {
  const buildBtn = document.getElementById('studio-build-oump3-btn');
  if (!buildBtn) return;

  buildBtn.addEventListener('click', async () => {
    const title = document.getElementById('studio-title-input').value.trim();
    const artist = document.getElementById('studio-artist-input').value.trim();

    if (!title || !artist) {
      alert('Пожалуйста, введите название трека и артиста!');
      return;
    }

    if (!trimmedAudioBlob && !originalAudioBlob) {
      alert('Пожалуйста, загрузите и зафиксируйте аудиофайл на Шаге 1!');
      return;
    }

    buildBtn.disabled = true;
    buildBtn.querySelector('span').textContent = 'Сборка .oump3...';

    try {
      const selectedGenres = [];
      document.querySelectorAll('#studio-genres-chips .chip.active').forEach((c) => {
        selectedGenres.push(c.textContent.trim());
      });

      const lrcString = generateLRC();

      const oump3Blob = await buildOump3Container({
        title,
        artist,
        genres: selectedGenres,
        duration: finalDuration,
        hasLyrics: !!lrcString,
        thumbBase64: studioThumbBase64,
        audioBlob: trimmedAudioBlob || originalAudioBlob,
        coverBlob: studioCoverBlob,
        lyricsText: lrcString
      });

      // Download file
      const downloadUrl = URL.createObjectURL(oump3Blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${artist} - ${title}.oump3`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      // Unlock Achievement "Саунд-продюсер"
      await unlockAchievement('sound_producer');

      alert(`Контейнер ${artist} - ${title}.oump3 успешно собран и скачан!`);
    } catch (err) {
      console.error('[Studio] Build failed:', err);
      alert('Ошибка при сборке контейнера: ' + err.message);
    } finally {
      buildBtn.disabled = false;
      buildBtn.querySelector('span').textContent = 'Собрать контейнер .oump3';
    }
  });
}

/* ==========================================================================
   WAV Encoder Helper
   ========================================================================== */
function audioBufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuf = new ArrayBuffer(length);
  const view = new DataView(outBuf);
  const channels = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // format chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  // data chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([outBuf], { type: 'audio/wav' });
}
