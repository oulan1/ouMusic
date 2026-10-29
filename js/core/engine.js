/**
 * M-Core (Music Core) Engine
 * Hybrid Web Audio API + HTML5 Audio Element Graph
 */

class MCoreEngine {
  constructor() {
    this.audioCtx = null;
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    // Disable pitch preservation for authentic Slowed / Nightcore effect
    this.audioElement.preservesPitch = false;
    this.audioElement.mozPreservesPitch = false;
    this.audioElement.webkitPreservesPitch = false;

    // Graph Nodes
    this.sourceNode = null;
    this.vocalRemoverActive = false;
    this.splitterNode = null;
    this.mergerNode = null;
    this.invertGainNode = null;
    this.bassFilterNode = null;
    this.vocalDryGain = null;
    this.vocalWetGain = null;

    this.eqFilters = []; // 60, 230, 910, 3600, 14000 Hz
    this.reverbNode = null;
    this.reverbDryGain = null;
    this.reverbWetGain = null;

    this.pannerNode = null;
    this.pannerLFOId = null;
    this.spatialAmount = 0; // 0 to 1

    this.compressorNode = null;
    this.normalizerActive = true;

    this.softGainNode = null;
    this.masterGainNode = null;
    this.analyserNode = null;

    // Playback State
    this.currentTrack = null;
    this.isPlaying = false;
    this.isCrossfading = false;
    this.crossfadeSeconds = 0;
    this.sleepTimerId = null;
    this.sleepTimerEndTrack = false;

    // Callbacks
    this.onTrackEnd = null;
    this.onTimeUpdate = null;
    this.onPlayStateChange = null;

    this.initAudioListeners();
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.buildAudioGraph();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  buildAudioGraph() {
    const ctx = this.audioCtx;

    // 1. Source
    this.sourceNode = ctx.createMediaElementSource(this.audioElement);

    // 2. Vocal Remover Beta Stage
    this.vocalDryGain = ctx.createGain();
    this.vocalWetGain = ctx.createGain();
    this.vocalDryGain.gain.value = 1.0;
    this.vocalWetGain.gain.value = 0.0;

    this.splitterNode = ctx.createChannelSplitter(2);
    this.mergerNode = ctx.createChannelMerger(2);
    this.invertGainNode = ctx.createGain();
    this.invertGainNode.gain.value = -1.0;

    // Bass Keep filter (< 200 Hz)
    this.bassFilterNode = ctx.createBiquadFilter();
    this.bassFilterNode.type = 'lowpass';
    this.bassFilterNode.frequency.value = 200;

    // Connect Vocal Remover Phase cancellation (L - R)
    this.sourceNode.connect(this.vocalDryGain);
    this.sourceNode.connect(this.splitterNode);

    // Left channel to merger
    this.splitterNode.connect(this.mergerNode, 0, 0);
    this.splitterNode.connect(this.mergerNode, 0, 1);

    // Right channel inverted to merger
    this.splitterNode.connect(this.invertGainNode, 1);
    this.invertGainNode.connect(this.mergerNode, 0, 0);
    this.invertGainNode.connect(this.mergerNode, 0, 1);

    // Add bass keep
    this.sourceNode.connect(this.bassFilterNode);
    this.bassFilterNode.connect(this.mergerNode, 0, 0);
    this.bassFilterNode.connect(this.mergerNode, 0, 1);

    this.mergerNode.connect(this.vocalWetGain);

    // Combine Vocal Dry + Wet into post-vocal node
    const postVocalNode = ctx.createGain();
    this.vocalDryGain.connect(postVocalNode);
    this.vocalWetGain.connect(postVocalNode);

    // 3. 5-Band Equalizer
    const frequencies = [60, 230, 910, 3600, 14000];
    const types = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];
    this.eqFilters = frequencies.map((freq, i) => {
      const filter = ctx.createBiquadFilter();
      filter.type = types[i];
      filter.frequency.value = freq;
      filter.gain.value = 0;
      return filter;
    });

    let lastEqNode = postVocalNode;
    this.eqFilters.forEach((filter) => {
      lastEqNode.connect(filter);
      lastEqNode = filter;
    });

    // 4. Reverb Convolver Stage (Dry/Wet)
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = this.generateImpulseResponse(2.2, 2.0);

    this.reverbDryGain = ctx.createGain();
    this.reverbWetGain = ctx.createGain();
    this.reverbDryGain.gain.value = 1.0;
    this.reverbWetGain.gain.value = 0.0;

    lastEqNode.connect(this.reverbDryGain);
    lastEqNode.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbWetGain);

    const postReverbNode = ctx.createGain();
    this.reverbDryGain.connect(postReverbNode);
    this.reverbWetGain.connect(postReverbNode);

    // 5. 8D Spatial Audio Panner (StereoPannerNode)
    if (ctx.createStereoPanner) {
      this.pannerNode = ctx.createStereoPanner();
      this.pannerNode.pan.value = 0;
      postReverbNode.connect(this.pannerNode);
    } else {
      this.pannerNode = postReverbNode;
    }

    // 6. Loudness Normalizer Compressor
    this.compressorNode = ctx.createDynamicsCompressor();
    this.compressorNode.threshold.setValueAtTime(-24, ctx.currentTime);
    this.compressorNode.knee.setValueAtTime(30, ctx.currentTime);
    this.compressorNode.ratio.setValueAtTime(12, ctx.currentTime);
    this.compressorNode.attack.setValueAtTime(0.003, ctx.currentTime);
    this.compressorNode.release.setValueAtTime(0.25, ctx.currentTime);

    this.pannerNode.connect(this.compressorNode);

    // 7. Soft Pause / Crossfade GainNode
    this.softGainNode = ctx.createGain();
    this.softGainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    this.compressorNode.connect(this.softGainNode);

    // 8. Master Gain & Analyser
    this.masterGainNode = ctx.createGain();
    this.masterGainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    this.softGainNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(ctx.destination);
  }

  generateImpulseResponse(duration, decay) {
    const ctx = this.audioCtx;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const factor = Math.pow(n / length, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  initAudioListeners() {
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.audioElement.currentTime, this.audioElement.duration || 0);
      }
      this.updateMediaSessionPosition();
    });

    this.audioElement.addEventListener('ended', () => {
      if (this.sleepTimerEndTrack) {
        this.sleepTimerEndTrack = false;
        this.softPause();
        return;
      }
      if (this.onTrackEnd) {
        this.onTrackEnd();
      }
    });

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onPlayStateChange) this.onPlayStateChange(true);
      this.updateMediaSessionState();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.onPlayStateChange) this.onPlayStateChange(false);
      this.updateMediaSessionState();
    });

    // Mobile background continuous support
    document.addEventListener('visibilitychange', () => {
      if (this.audioCtx && this.isPlaying && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    });
  }

  /* ==========================================================================
     Playback Methods & Soft Play/Pause (0.3s)
     ========================================================================== */
  async loadTrack(track, audioUrlOrBlob, autoPlay = true) {
    this.ensureContext();
    this.currentTrack = track;

    let src = '';
    if (typeof audioUrlOrBlob === 'string') {
      src = audioUrlOrBlob;
    } else if (audioUrlOrBlob instanceof Blob) {
      src = URL.createObjectURL(audioUrlOrBlob);
    }

    this.audioElement.src = src;
    this.audioElement.load();

    this.setupMediaSession(track);

    if (autoPlay) {
      await this.softPlay();
    }
  }

  async softPlay() {
    this.ensureContext();
    if (!this.softGainNode) return;

    try {
      const ctx = this.audioCtx;
      this.softGainNode.gain.cancelScheduledValues(ctx.currentTime);
      this.softGainNode.gain.setValueAtTime(0.0001, ctx.currentTime);

      await this.audioElement.play();

      this.softGainNode.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.3);
      this.isPlaying = true;
    } catch (err) {
      console.warn('[M-Core] Playback failed or waiting for user gesture:', err);
    }
  }

  async softPause() {
    if (!this.softGainNode || !this.audioCtx) {
      this.audioElement.pause();
      this.isPlaying = false;
      return;
    }

    const ctx = this.audioCtx;
    this.softGainNode.gain.cancelScheduledValues(ctx.currentTime);
    this.softGainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    setTimeout(() => {
      this.audioElement.pause();
      this.isPlaying = false;
    }, 300);
  }

  togglePlay() {
    if (this.audioElement.paused) {
      this.softPlay();
    } else {
      this.softPause();
    }
  }

  seek(seconds) {
    if (!isNaN(seconds) && this.audioElement.duration) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration));
    }
  }

  /* ==========================================================================
     10-Second Back Button Logic
     ========================================================================== */
  handleBackButton(onPlayPreviousCallback) {
    const current = this.audioElement.currentTime;
    if (current > 10) {
      // Перематываем на 00:00
      this.seek(0);
      return false; // Не переключали трек
    } else {
      // Включаем предыдущий трек
      if (typeof onPlayPreviousCallback === 'function') {
        onPlayPreviousCallback();
      }
      return true;
    }
  }

  /* ==========================================================================
     Real-Time M-Core FX (Slowed / Speed, Reverb, 8D Audio)
     ========================================================================== */
  setPlaybackRate(rate) {
    // Range 0.70x to 1.35x
    const r = Math.max(0.70, Math.min(rate, 1.35));
    this.audioElement.playbackRate = r;
  }

  setReverb(percent) {
    // 0 to 100
    if (!this.reverbWetGain || !this.reverbDryGain) return;
    const amount = Math.max(0, Math.min(percent / 100, 1.0));
    this.reverbWetGain.gain.setValueAtTime(amount * 0.8, this.audioCtx.currentTime);
    this.reverbDryGain.gain.setValueAtTime(1.0 - amount * 0.3, this.audioCtx.currentTime);
  }

  set8DAudio(percent) {
    // 0 to 100
    this.spatialAmount = Math.max(0, Math.min(percent / 100, 1.0));

    if (this.pannerLFOId) {
      clearInterval(this.pannerLFOId);
      this.pannerLFOId = null;
    }

    if (this.spatialAmount <= 0) {
      if (this.pannerNode && this.pannerNode.pan) {
        this.pannerNode.pan.setValueAtTime(0, this.audioCtx.currentTime);
      }
      return;
    }

    let angle = 0;
    const speed = 0.05 + this.spatialAmount * 0.05; // Pan rotation speed

    this.pannerLFOId = setInterval(() => {
      if (!this.isPlaying || !this.pannerNode || !this.pannerNode.pan) return;
      angle += speed;
      const panVal = Math.sin(angle) * this.spatialAmount;
      this.pannerNode.pan.setValueAtTime(panVal, this.audioCtx.currentTime);
    }, 50);
  }

  resetFX() {
    this.setPlaybackRate(1.0);
    this.setReverb(0);
    this.set8DAudio(0);
  }

  /* ==========================================================================
     Vocal Remover BETA (Phase Cancellation + Bass Keep)
     ========================================================================== */
  setVocalRemover(active) {
    this.vocalRemoverActive = !!active;
    if (!this.vocalDryGain || !this.vocalWetGain || !this.audioCtx) return;

    const ctx = this.audioCtx;
    if (this.vocalRemoverActive) {
      this.vocalDryGain.gain.setValueAtTime(0.0, ctx.currentTime);
      this.vocalWetGain.gain.setValueAtTime(1.0, ctx.currentTime);
    } else {
      this.vocalDryGain.gain.setValueAtTime(1.0, ctx.currentTime);
      this.vocalWetGain.gain.setValueAtTime(0.0, ctx.currentTime);
    }
  }

  /* ==========================================================================
     Equalizer & Loudness Normalization
     ========================================================================== */
  setEQBand(bandIndex, gainDb) {
    if (this.eqFilters[bandIndex] && this.audioCtx) {
      this.eqFilters[bandIndex].gain.setValueAtTime(gainDb, this.audioCtx.currentTime);
    }
  }

  applyEQPreset(presetName) {
    const presets = {
      flat: [0, 0, 0, 0, 0],
      bass: [6, 4, 1, 0, -1],
      vocal: [-2, 1, 4, 3, 1],
      rock: [4, 2, -1, 3, 5],
      electronic: [5, 3, 0, 2, 4]
    };
    const gains = presets[presetName] || presets.flat;
    gains.forEach((gain, i) => this.setEQBand(i, gain));
    return gains;
  }

  setNormalizer(active) {
    this.normalizerActive = !!active;
    if (!this.compressorNode || !this.audioCtx) return;
    const threshold = this.normalizerActive ? -24 : 0;
    this.compressorNode.threshold.setValueAtTime(threshold, this.audioCtx.currentTime);
  }

  /* ==========================================================================
     Sleep Timer
     ========================================================================== */
  setSleepTimer(minutesOrMode) {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    this.sleepTimerEndTrack = false;

    if (minutesOrMode === 0 || minutesOrMode === '0') {
      return;
    }

    if (minutesOrMode === 'end-track') {
      this.sleepTimerEndTrack = true;
      return;
    }

    const ms = Number(minutesOrMode) * 60 * 1000;
    this.sleepTimerId = setTimeout(() => {
      // Плавное 5-секундное затухание
      if (this.masterGainNode && this.audioCtx) {
        this.masterGainNode.gain.linearRampToValueAtTime(0.0001, this.audioCtx.currentTime + 5);
        setTimeout(() => {
          this.softPause();
          this.masterGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
        }, 5000);
      } else {
        this.softPause();
      }
    }, ms);
  }

  /* ==========================================================================
     MediaSession API (Dynamic Island / Lockscreen / Android Notification)
     ========================================================================== */
  setupMediaSession(track) {
    if (!('mediaSession' in navigator)) return;

    const coverUrl = track.thumbBase64 || 'assets/oumusic.png';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'ouMusic Track',
      artist: track.artist || 'Неизвестный исполнитель',
      album: 'ouMusic',
      artwork: [
        { src: coverUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: coverUrl, sizes: '128x128', type: 'image/jpeg' },
        { src: coverUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: coverUrl, sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => this.softPlay());
    navigator.mediaSession.setActionHandler('pause', () => this.softPause());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) this.seek(details.seekTime);
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      this.seek(this.audioElement.currentTime - (details.seekOffset || 10));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      this.seek(this.audioElement.currentTime + (details.seekOffset || 10));
    });
  }

  updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || !this.audioElement.duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: this.audioElement.duration,
        playbackRate: this.audioElement.playbackRate,
        position: this.audioElement.currentTime
      });
    } catch (e) {
      // Ignored for brief non-finite durations
    }
  }

  updateMediaSessionState() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
  }
}

export const engine = new MCoreEngine();
