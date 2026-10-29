import { engine } from '../core/engine.js';
import { isLiked, toggleLike, isOffline, saveOfflineTrack, deleteOfflineTrack, toggleDislike, isDisliked } from '../core/storage.js';

let spectrumAnimId = null;
let currentTrack = null;
let playbackQueue = [];
let queueIndex = 0;
let isShuffled = false;
let repeatMode = 'off'; // 'off' | 'all' | 'one'

export function initPlayerUI({ onTrackSelect, onQueueChange }) {
  initFullscreenPlayer();
  initSpectrumCanvas();
  initScrubber();
  initTransportControls({ onTrackSelect, onQueueChange });
  initOptionsBottomSheet({ onTrackSelect });
  initQueueSheet({ onTrackSelect });
  initSleepTimerSheet();
}

export function setPlaybackQueue(tracks, startIndex = 0) {
  playbackQueue = [...tracks];
  queueIndex = Math.max(0, Math.min(startIndex, playbackQueue.length - 1));
  renderQueueList();
}

export function getCurrentTrack() {
  return currentTrack;
}

export function getQueue() {
  return playbackQueue;
}

export function updatePlayerDisplay(track) {
  if (!track) return;
  currentTrack = track;

  // Mini player
  const mini = document.getElementById('mini-player');
  if (mini) mini.style.display = 'flex';

  const miniTitle = document.getElementById('mini-title');
  const miniArtist = document.getElementById('mini-artist');
  const miniCover = document.getElementById('mini-cover-img');

  if (miniTitle) miniTitle.textContent = track.title || 'Безымянный трек';
  if (miniArtist) miniArtist.textContent = track.artist || 'Неизвестный исполнитель';
  if (miniCover) {
    miniCover.src = track.thumbBase64 || track.coverUrl || 'assets/oumusic.png';
  }

  // Fullscreen player
  const fsTitle = document.getElementById('fs-title');
  const fsArtist = document.getElementById('fs-artist');
  const fsCover = document.getElementById('fs-cover-img');
  const fsAlbum = document.getElementById('fs-album-title');

  if (fsTitle) fsTitle.textContent = track.title || 'Безымянный трек';
  if (fsArtist) fsArtist.textContent = track.artist || 'Неизвестный исполнитель';
  if (fsCover) {
    fsCover.src = track.coverUrl || track.thumbBase64 || 'assets/oumusic.png';
    extractDominantColors(fsCover);
  }
  if (fsAlbum) fsAlbum.textContent = track.album || 'ouMusic';

  // Update Like & Dislike states
  updateLikeDislikeIcons(track.id);

  // Update Active row in lists
  document.querySelectorAll('.track-row').forEach((row) => {
    if (row.getAttribute('data-track-id') === track.id) {
      row.classList.add('active');
    } else {
      row.classList.remove('active');
    }
  });
}

export function updatePlayPauseButtons(isPlaying) {
  const miniBtn = document.getElementById('mini-play-btn');
  const fsBtn = document.getElementById('fs-play-btn');
  const heroBtn = document.getElementById('hero-start-wave-btn');
  const wavePlayBtn = document.getElementById('wave-play-toggle-btn');

  const iconHref = isPlaying ? '#icon-pause' : '#icon-play';

  [miniBtn, fsBtn, heroBtn, wavePlayBtn].forEach((btn) => {
    if (!btn) return;
    const useEl = btn.querySelector('use');
    if (useEl) useEl.setAttribute('href', iconHref);
  });
}

export async function updateLikeDislikeIcons(trackId) {
  const liked = await isLiked(trackId);
  const disliked = await isDisliked(trackId);

  const miniLikeBtn = document.getElementById('mini-like-btn');
  const fsLikeBtn = document.getElementById('fs-like-btn');
  const fsDislikeBtn = document.getElementById('fs-dislike-btn');
  const waveDislikeBtn = document.getElementById('wave-dislike-btn');

  const likeHref = liked ? '#icon-heart-filled' : '#icon-heart';
  [miniLikeBtn, fsLikeBtn].forEach((btn) => {
    if (!btn) return;
    btn.style.color = liked ? '#EC4899' : 'inherit';
    const useEl = btn.querySelector('use');
    if (useEl) useEl.setAttribute('href', likeHref);
  });

  [fsDislikeBtn, waveDislikeBtn].forEach((btn) => {
    if (!btn) return;
    btn.style.color = disliked ? '#EF4444' : 'inherit';
  });
}

/* ==========================================================================
   Dynamic Cover Glow (Canvas Dominant Color Extractor)
   ========================================================================== */
function extractDominantColors(imgEl) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 30;
  canvas.height = 30;

  const tempImg = new Image();
  tempImg.crossOrigin = 'anonymous';
  tempImg.src = imgEl.src;

  tempImg.onload = () => {
    try {
      ctx.drawImage(tempImg, 0, 0, 30, 30);
      const data = ctx.getImageData(0, 0, 30, 30).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      const color1 = `rgba(${r}, ${g}, ${b}, 0.5)`;
      const color2 = `rgba(${Math.min(255, r + 40)}, ${Math.max(0, g - 30)}, ${Math.min(255, b + 60)}, 0.35)`;
      const color3 = `rgba(${Math.max(0, r - 50)}, ${Math.min(255, g + 40)}, ${Math.max(0, b - 20)}, 0.25)`;
      const accent = `rgb(${r}, ${g}, ${b})`;

      document.documentElement.style.setProperty('--glow-color-1', color1);
      document.documentElement.style.setProperty('--glow-color-2', color2);
      document.documentElement.style.setProperty('--glow-color-3', color3);
      document.documentElement.style.setProperty('--glow-accent', accent);
    } catch (e) {
      // Fallback
    }
  };
}

/* ==========================================================================
   60 FPS Circular Spectrum Canvas Around Album Cover
   ========================================================================== */
function initSpectrumCanvas() {
  const canvas = document.getElementById('cover-spectrum-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const coverRadius = 150; // Half of cover box size

    if (engine.analyserNode && engine.isPlaying) {
      const bufferLength = engine.analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      engine.analyserNode.getByteFrequencyData(dataArray);

      const bars = 64;
      const step = (Math.PI * 2) / bars;

      ctx.save();
      for (let i = 0; i < bars; i++) {
        const value = dataArray[i * 2] || 0;
        const barHeight = (value / 255) * 45; // Max 45px outward wave
        const angle = i * step;

        const x1 = cx + Math.cos(angle) * (coverRadius + 2);
        const y1 = cy + Math.sin(angle) * (coverRadius + 2);
        const x2 = cx + Math.cos(angle) * (coverRadius + 2 + barHeight);
        const y2 = cy + Math.sin(angle) * (coverRadius + 2 + barHeight);

        ctx.strokeStyle = `hsl(${(i * 360) / bars}, 85%, 65%)`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    spectrumAnimId = requestAnimationFrame(render);
  }

  if (spectrumAnimId) cancelAnimationFrame(spectrumAnimId);
  render();
}

/* ==========================================================================
   Fullscreen Player Gestures & Scrubber
   ========================================================================== */
function initFullscreenPlayer() {
  const mini = document.getElementById('mini-player');
  const fs = document.getElementById('fullscreen-player');
  const closeBtn = document.getElementById('close-fullscreen-player-btn');

  // Open on mini player click
  if (mini) {
    mini.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // Ignore control clicks
      fs.classList.add('active');
    });
  }

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      fs.classList.remove('active');
    });
  }

  // Mobile swipe down to close
  let touchStartY = 0;
  fs.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  fs.addEventListener('touchmove', (e) => {
    const diff = e.touches[0].clientY - touchStartY;
    if (diff > 120) {
      fs.classList.remove('active');
    }
  }, { passive: true });
}

function initScrubber() {
  const scrubber = document.getElementById('fs-scrubber');
  const curLabel = document.getElementById('fs-time-current');
  const durLabel = document.getElementById('fs-time-duration');
  const miniProgress = document.getElementById('mini-progress-bar');

  engine.onTimeUpdate = (currentTime, duration) => {
    if (duration > 0) {
      const percent = (currentTime / duration) * 100;
      if (scrubber && !scrubber.matches(':active')) {
        scrubber.value = percent;
      }
      if (miniProgress) {
        miniProgress.style.width = `${percent}%`;
      }
      if (curLabel) curLabel.textContent = formatTime(currentTime);
      if (durLabel) durLabel.textContent = formatTime(duration);
    }
  };

  if (scrubber) {
    scrubber.addEventListener('input', () => {
      if (engine.audioElement.duration) {
        const targetSec = (scrubber.value / 100) * engine.audioElement.duration;
        if (curLabel) curLabel.textContent = formatTime(targetSec);
      }
    });

    scrubber.addEventListener('change', () => {
      if (engine.audioElement.duration) {
        const targetSec = (scrubber.value / 100) * engine.audioElement.duration;
        engine.seek(targetSec);
      }
    });
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ==========================================================================
   Transport Controls
   ========================================================================== */
function initTransportControls({ onTrackSelect, onQueueChange }) {
  const miniPlay = document.getElementById('mini-play-btn');
  const fsPlay = document.getElementById('fs-play-btn');
  const miniNext = document.getElementById('mini-next-btn');
  const fsNext = document.getElementById('fs-next-btn');
  const fsPrev = document.getElementById('fs-prev-btn');
  const fsShuffle = document.getElementById('fs-shuffle-btn');
  const fsRepeat = document.getElementById('fs-repeat-btn');

  const playHandler = () => engine.togglePlay();
  if (miniPlay) miniPlay.addEventListener('click', playHandler);
  if (fsPlay) fsPlay.addEventListener('click', playHandler);

  // Next track
  const nextHandler = () => {
    if (playbackQueue.length === 0) return;
    if (repeatMode === 'one') {
      engine.seek(0);
      engine.softPlay();
      return;
    }
    queueIndex = (queueIndex + 1) % playbackQueue.length;
    if (onTrackSelect) onTrackSelect(playbackQueue[queueIndex]);
  };
  if (miniNext) miniNext.addEventListener('click', nextHandler);
  if (fsNext) fsNext.addEventListener('click', nextHandler);

  // Prev track with 10-second logic
  if (fsPrev) {
    fsPrev.addEventListener('click', () => {
      engine.handleBackButton(() => {
        if (playbackQueue.length === 0) return;
        queueIndex = (queueIndex - 1 + playbackQueue.length) % playbackQueue.length;
        if (onTrackSelect) onTrackSelect(playbackQueue[queueIndex]);
      });
    });
  }

  // Shuffle toggle
  if (fsShuffle) {
    fsShuffle.addEventListener('click', () => {
      isShuffled = !isShuffled;
      fsShuffle.classList.toggle('active', isShuffled);
      if (isShuffled) {
        // Shuffle queue
        for (let i = playbackQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [playbackQueue[i], playbackQueue[j]] = [playbackQueue[j], playbackQueue[i]];
        }
      }
      renderQueueList();
    });
  }

  // Repeat toggle
  if (fsRepeat) {
    fsRepeat.addEventListener('click', () => {
      const modes = ['off', 'all', 'one'];
      const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
      repeatMode = modes[nextIdx];

      fsRepeat.classList.toggle('active', repeatMode !== 'off');
      const useEl = fsRepeat.querySelector('use');
      if (useEl) {
        useEl.setAttribute('href', repeatMode === 'one' ? '#icon-repeat-one' : '#icon-repeat');
      }
    });
  }

  // End of track handler
  engine.onTrackEnd = () => {
    nextHandler();
  };
}

/* ==========================================================================
   3 Dots Options & M-Core FX Bottom Sheet
   ========================================================================== */
function initOptionsBottomSheet({ onTrackSelect }) {
  const fsMoreBtn = document.getElementById('fs-more-options-btn');
  const backdrop = document.getElementById('track-options-backdrop');
  const sheet = document.getElementById('track-options-sheet');
  const closeBtn = document.getElementById('close-track-options-btn');

  const openSheet = () => {
    backdrop.classList.add('active');
    sheet.classList.add('active');
    const titleEl = document.getElementById('sheet-track-title');
    if (titleEl && currentTrack) {
      titleEl.textContent = `${currentTrack.artist} — ${currentTrack.title}`;
    }
  };

  const closeSheet = () => {
    backdrop.classList.remove('active');
    sheet.classList.remove('active');
  };

  if (fsMoreBtn) fsMoreBtn.addEventListener('click', openSheet);
  if (closeBtn) closeBtn.addEventListener('click', closeSheet);
  if (backdrop) backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeSheet();
  });

  // Slider 1: Speed / Slowed
  const speedSlider = document.getElementById('fx-speed-slider');
  const speedLabel = document.getElementById('fx-speed-val');
  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      let val = parseFloat(speedSlider.value);
      // Snap to 1.00 if close
      if (Math.abs(val - 1.00) < 0.03) val = 1.00;
      engine.setPlaybackRate(val);
      if (speedLabel) speedLabel.textContent = `${val.toFixed(2)}x`;
    });
  }

  // Slider 2: Reverb
  const reverbSlider = document.getElementById('fx-reverb-slider');
  const reverbLabel = document.getElementById('fx-reverb-val');
  if (reverbSlider) {
    reverbSlider.addEventListener('input', () => {
      const val = parseInt(reverbSlider.value, 10);
      engine.setReverb(val);
      if (reverbLabel) reverbLabel.textContent = `${val}%`;
    });
  }

  // Slider 3: 8D Audio
  const spatialSlider = document.getElementById('fx-spatial-slider');
  const spatialLabel = document.getElementById('fx-spatial-val');
  if (spatialSlider) {
    spatialSlider.addEventListener('input', () => {
      const val = parseInt(spatialSlider.value, 10);
      engine.set8DAudio(val);
      if (spatialLabel) spatialLabel.textContent = `${val}%`;
    });
  }

  // Reset FX button
  const resetBtn = document.getElementById('fx-reset-all-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      engine.resetFX();
      if (speedSlider) speedSlider.value = '1.00';
      if (speedLabel) speedLabel.textContent = '1.00x';
      if (reverbSlider) reverbSlider.value = '0';
      if (reverbLabel) reverbLabel.textContent = '0%';
      if (spatialSlider) spatialSlider.value = '0';
      if (spatialLabel) spatialLabel.textContent = '0%';
    });
  }

  // Quick action: Like
  const actLike = document.getElementById('sheet-act-like');
  if (actLike) {
    actLike.addEventListener('click', async () => {
      if (!currentTrack) return;
      await toggleLike(currentTrack.id);
      updateLikeDislikeIcons(currentTrack.id);
      closeSheet();
    });
  }

  // Quick action: Play Next
  const actNext = document.getElementById('sheet-act-play-next');
  if (actNext) {
    actNext.addEventListener('click', () => {
      if (!currentTrack) return;
      playbackQueue.splice(queueIndex + 1, 0, currentTrack);
      renderQueueList();
      closeSheet();
    });
  }

  // Quick action: Add to end of Queue
  const actAddQueue = document.getElementById('sheet-act-add-queue');
  if (actAddQueue) {
    actAddQueue.addEventListener('click', () => {
      if (!currentTrack) return;
      playbackQueue.push(currentTrack);
      renderQueueList();
      closeSheet();
    });
  }

  // Quick action: Dislike / Hide
  const actDislike = document.getElementById('sheet-act-dislike');
  if (actDislike) {
    actDislike.addEventListener('click', async () => {
      if (!currentTrack) return;
      await toggleDislike(currentTrack.id);
      updateLikeDislikeIcons(currentTrack.id);
      closeSheet();
      // Auto-skip
      if (playbackQueue.length > 1) {
        queueIndex = (queueIndex + 1) % playbackQueue.length;
        if (onTrackSelect) onTrackSelect(playbackQueue[queueIndex]);
      }
    });
  }

  // Quick action: Share
  const actShare = document.getElementById('sheet-act-share');
  const fsShareBtn = document.getElementById('fs-share-track-btn');
  const shareHandler = () => {
    if (!currentTrack) return;
    if (currentTrack.isLocal) {
      alert('Локальный трек со своего устройства нельзя отправить по ссылке.');
      return;
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}#track=${encodeURIComponent(currentTrack.id || currentTrack.filename)}`;
    const shareText = `Послушай этот трек в ouMusic: ${currentTrack.artist} — ${currentTrack.title} ${shareUrl}`;

    if (navigator.share) {
      navigator.share({ title: currentTrack.title, text: shareText, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };
  if (actShare) actShare.addEventListener('click', shareHandler);
  if (fsShareBtn) fsShareBtn.addEventListener('click', shareHandler);
}

/* ==========================================================================
   Queue Bottom Sheet & Drag-and-Drop Reordering
   ========================================================================== */
function initQueueSheet({ onTrackSelect }) {
  const openBtn = document.getElementById('fs-open-queue-btn');
  const backdrop = document.getElementById('queue-backdrop');
  const sheet = document.getElementById('queue-sheet');
  const closeBtn = document.getElementById('close-queue-btn');
  const clearBtn = document.getElementById('queue-clear-btn');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      backdrop.classList.add('active');
      sheet.classList.add('active');
      renderQueueList(onTrackSelect);
    });
  }

  const closeQueue = () => {
    backdrop.classList.remove('active');
    sheet.classList.remove('active');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeQueue);
  if (backdrop) backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeQueue();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      playbackQueue = currentTrack ? [currentTrack] : [];
      queueIndex = 0;
      renderQueueList(onTrackSelect);
    });
  }
}

function renderQueueList(onTrackSelect) {
  const container = document.getElementById('queue-tracks-list');
  if (!container) return;

  container.innerHTML = '';

  playbackQueue.forEach((track, idx) => {
    const row = document.createElement('div');
    row.className = `track-row ${idx === queueIndex ? 'active' : ''}`;
    row.draggable = true;
    row.setAttribute('data-index', idx);

    row.innerHTML = `
      <div style="cursor: grab; color: var(--md-sys-color-outline); margin-right: 4px;">
        <svg class="svg-icon" style="width: 18px; height: 18px;"><use href="#icon-drag"></use></svg>
      </div>
      <div class="track-cover-wrap" style="width: 36px; height: 36px;">
        <img class="track-cover-img" src="${track.thumbBase64 || 'assets/oumusic.png'}" alt="">
      </div>
      <div class="track-info">
        <div class="track-title" style="font-size: 0.88rem;">${track.title || 'Трек'}</div>
        <div class="track-artist" style="font-size: 0.75rem;">${track.artist || 'Артист'}</div>
      </div>
    `;

    row.addEventListener('click', () => {
      queueIndex = idx;
      if (onTrackSelect) onTrackSelect(track);
    });

    // Drag-and-drop
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', idx);
      row.style.opacity = '0.5';
    });

    row.addEventListener('dragend', () => {
      row.style.opacity = '1';
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      row.style.borderTop = '2px solid var(--md-sys-color-primary)';
    });

    row.addEventListener('dragleave', () => {
      row.style.borderTop = 'none';
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.style.borderTop = 'none';
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIdx = idx;

      if (fromIdx !== toIdx) {
        const movedItem = playbackQueue.splice(fromIdx, 1)[0];
        playbackQueue.splice(toIdx, 0, movedItem);
        renderQueueList(onTrackSelect);
      }
    });

    container.appendChild(row);
  });
}

/* ==========================================================================
   Sleep Timer Sheet
   ========================================================================== */
function initSleepTimerSheet() {
  const openBtn = document.getElementById('fs-sleep-timer-btn');
  const backdrop = document.getElementById('sleep-timer-backdrop');
  const sheet = document.getElementById('sleep-timer-sheet');
  const closeBtn = document.getElementById('close-sleep-timer-btn');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      backdrop.classList.add('active');
      sheet.classList.add('active');
    });
  }

  const closeTimer = () => {
    backdrop.classList.remove('active');
    sheet.classList.remove('active');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeTimer);
  if (backdrop) backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeTimer();
  });

  sheet.querySelectorAll('[data-timer-mins]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-timer-mins');
      engine.setSleepTimer(mode);
      closeTimer();
      alert(`Таймер сна установлен: ${btn.textContent.trim()}`);
    });
  });
}
