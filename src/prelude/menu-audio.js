(function() {
  const MENU_AUDIO_SRC = window.KAIH_MENU_AUDIO_SRC || 'assets/audio/menu-music.mp3';
  const WORLD_AUDIO_SRC = window.KAIH_WORLD_AUDIO_SRC || 'assets/audio/world-music.mp3';
  window.KAIH_MENU_AUDIO_SRC = MENU_AUDIO_SRC;
  window.KAIH_WORLD_AUDIO_SRC = WORLD_AUDIO_SRC;
  const CROSSFADE_DURATION = 8.0; // 8 detik fade-in & fade-out seamless loop

  let audioCtx = null;
  let analyser = null;
  let freqData = null;

  let isInWorld = false;
  let playTriggered = false;

  // Menu Audio State
  let menuAudioEl = null;
  let menuMediaSource = null;
  let menuGainNode = null;
  let menuPeriodicTimer = null;

  // World Seamless Loop Dual-Deck State
  let worldAudioBuffer = null;
  let worldDeckA = null;
  let worldDeckB = null;
  let worldLoopTimeout = null;
  let fallbackWorldAudioA = null;
  let fallbackWorldAudioB = null;
  let worldStopped = false;      // true setelah tombol "Ya" ditekan: musik world tidak boleh jalan lagi
  const worldNodes = [];         // source + gain yang sedang memutar musik world

  // DOM Elements for Beat Reactivity
  let spriteChars = [];
  let playButtonEl = null;
  let smoothedBass = 0;
  let smoothedMid = 0;
  let smoothedHigh = 0;
  let beatPulse = 0;
  let lastBeatTime = 0;
  let timeData = null;
  let bassFloor = 0.035;
  let previousBassEnergy = 0;
  let spectralFlux = 0;

  // 1. Inisialisasi Web Audio Context & Analyser
  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      // Analisis low-end stabil: hindari respons berlebihan terhadap hi-hat/vokal.
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.18;
      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // 2. Sound Effect: Procedural Multi-Layer Cloud Whoosh
  function playCloudWhooshSFX() {
    const ctx = ensureAudioContext();
    const now = ctx.currentTime;
    const duration = 2.4;

    // Buat Stereo Pink/Brownish Wind Noise Buffer
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const output = noiseBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
        b6 = white * 0.115926;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Filter 1: Deep Cloud Rush (Bandpass Sweep)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.setValueAtTime(1.4, now);
    bandpass.frequency.setValueAtTime(110, now);
    bandpass.frequency.exponentialRampToValueAtTime(880, now + 0.85);
    bandpass.frequency.exponentialRampToValueAtTime(140, now + duration);

    // Filter 2: Silky Air Shimmer (Lowpass Sweep)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(250, now);
    lowpass.frequency.exponentialRampToValueAtTime(2400, now + 0.9);
    lowpass.frequency.exponentialRampToValueAtTime(180, now + duration);

    // Envelope Gain
    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0.001, now);
    whooshGain.gain.linearRampToValueAtTime(0.95, now + 0.65);
    whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Sub-bass Chime Swell untuk kesan magis saat masuk pulau awan
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(290, now + 1.1);
    osc.frequency.exponentialRampToValueAtTime(130, now + duration);
    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(0.22, now + 0.6);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(whooshGain);
    whooshGain.connect(ctx.destination);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noiseSource.start(now);
    osc.start(now);
    noiseSource.stop(now + duration);
    osc.stop(now + duration);

    // Trigger Visual Cloud Curtain
    const curtain = document.getElementById('kaih-cloud-curtain');
    if (curtain) {
      curtain.classList.add('active');
      setTimeout(() => curtain.classList.remove('active'), 2700);
    }
  }

  // 3. Musik Main Menu ("sunlit_spire") - dipicu oleh cutscene (ketukan pertama), fade-in halus,
  //    terhubung ke beat detector. Jika file gagal dimuat lewat jalur Web Audio (mis. dibuka via file://),
  //    otomatis fallback ke pemutaran <audio> biasa supaya musik tetap terdengar.
  const MENU_VOLUME = 0.85;
  const MENU_FADE_IN = 4.0; // detik

  function attachMenuEnded(el) {
    // Mainkan secara berkala di Main Menu (jeda lembut 2.5 detik lalu diputar kembali dengan fade-in)
    el.addEventListener('ended', () => {
      if (isInWorld) return;
      menuPeriodicTimer = setTimeout(() => {
        if (!isInWorld && menuAudioEl) {
          menuAudioEl.currentTime = 0;
          if (menuGainNode && audioCtx) {
            menuGainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
            menuGainNode.gain.linearRampToValueAtTime(MENU_VOLUME, audioCtx.currentTime + 3.0);
          } else {
            menuAudioEl.volume = 0.01;
            fadeElementVolume(menuAudioEl, MENU_VOLUME, 3000);
          }
          menuAudioEl.play().catch(() => {});
        }
      }, 2500);
    });
  }

  function fadeElementVolume(el, target, ms) {
    const from = el.volume, t0 = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - t0) / ms);
      try { el.volume = from + (target - from) * k; } catch (e) {}
      if (k < 1 && !el.paused) requestAnimationFrame(step);
    })(t0);
  }

  function startMenuFallbackAudio() {
    // Fallback: elemen audio polos tanpa analyser (tanpa crossOrigin) agar lagu tetap diputar.
    if (menuAudioEl && menuAudioEl.dataset.kaihFallback) return;
    try { if (menuAudioEl) menuAudioEl.pause(); } catch (e) {}
    menuGainNode = null;
    menuAudioEl = new Audio(MENU_AUDIO_SRC);
    menuAudioEl.dataset.kaihFallback = '1';
    menuAudioEl.preload = 'auto';
    menuAudioEl.volume = 0.01;
    attachMenuEnded(menuAudioEl);
    menuAudioEl.play().then(() => fadeElementVolume(menuAudioEl, MENU_VOLUME, MENU_FADE_IN * 1000)).catch(() => {});
  }

  function startMenuMusic() {
    if (isInWorld) return;
    const ctx = ensureAudioContext();

    if (!menuAudioEl) {
      menuAudioEl = new Audio();
      menuAudioEl.crossOrigin = 'anonymous';
      menuAudioEl.preload = 'auto';
      menuAudioEl.src = MENU_AUDIO_SRC;

      menuGainNode = ctx.createGain();
      menuGainNode.gain.setValueAtTime(0.0001, ctx.currentTime);

      try {
        menuMediaSource = ctx.createMediaElementSource(menuAudioEl);
        menuMediaSource.connect(analyser);
        analyser.connect(menuGainNode);
        menuGainNode.connect(ctx.__kaihMusicDestination || ctx.destination);
      } catch (e) {
        console.warn('Fallback direct audio playback:', e);
        startMenuFallbackAudio();
        return;
      }

      // Jika file ditolak karena CORS (file://), pakai fallback
      menuAudioEl.addEventListener('error', () => startMenuFallbackAudio(), { once: true });
      attachMenuEnded(menuAudioEl);
    }

    if (menuGainNode && audioCtx) {
      const t = audioCtx.currentTime;
      menuGainNode.gain.cancelScheduledValues(t);
      menuGainNode.gain.setValueAtTime(0.0001, t);
      menuGainNode.gain.linearRampToValueAtTime(MENU_VOLUME, t + MENU_FADE_IN);
    }

    menuAudioEl.play().catch(() => {
      // Autoplay diblokir: coba lagi pada interaksi berikutnya
      const retry = () => { if (!isInWorld && menuAudioEl && menuAudioEl.paused) startMenuMusic(); };
      window.addEventListener('pointerdown', retry, { once: true, passive: true });
    });
  }

  // Dipanggil oleh cutscene saat layar awal diketuk (trigger tunggal untuk musik menu).
  window.kaihStartMenuMusic = function () {
    ensureAudioContext();
    startMenuMusic();
  };

  function stopMenuMusic() {
    if (menuPeriodicTimer) {
      clearTimeout(menuPeriodicTimer);
      menuPeriodicTimer = null;
    }
    if (menuAudioEl) {
      if (menuGainNode && audioCtx) {
        const now = audioCtx.currentTime;
        menuGainNode.gain.cancelScheduledValues(now);
        menuGainNode.gain.setValueAtTime(menuGainNode.gain.value, now);
        menuGainNode.gain.linearRampToValueAtTime(0.0001, now + 1.2);
        setTimeout(() => {
          if (menuAudioEl) {
            menuAudioEl.pause();
            menuAudioEl.currentTime = 0;
          }
        }, 1250);
      } else {
        menuAudioEl.pause();
        menuAudioEl.currentTime = 0;
      }
    }
  }

  // 4. Musik World Pulau Awan ("tiptoe_through_the_clouds") dengan Seamless Loop Fade-In & Fade-Out (8 Detik)
  async function startWorldMusicSeamless() {
    const ctx = ensureAudioContext();

    // Coba decode AudioBuffer untuk sample-accurate crossfading
    try {
      if (!worldAudioBuffer) {
        const response = await fetch(WORLD_AUDIO_SRC);
        const arrayBuf = await response.arrayBuffer();
        worldAudioBuffer = await ctx.decodeAudioData(arrayBuf);
      }
      scheduleWorldBufferTrack(worldAudioBuffer);
    } catch (err) {
      // Fallback Dual HTML5 Audio Crossfader jika dibuka via file:// dengan URL eksternal
      startDualElementWorldLoop();
    }
  }

  function scheduleWorldBufferTrack(buffer) {
    if (!isInWorld || !audioCtx || worldStopped) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const duration = buffer.duration;
    const fadeTime = Math.min(CROSSFADE_DURATION, duration * 0.35);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    // Fade-in selama 8 detik
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.75, now + fadeTime);

    // Fade-out selama 8 detik menjelang akhir lagu
    const fadeOutStart = Math.max(now + fadeTime, now + duration - fadeTime);
    gainNode.gain.setValueAtTime(0.75, fadeOutStart);
    gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

    source.connect(gainNode);
    gainNode.connect(ctx.__kaihMusicDestination || ctx.destination);
    worldNodes.push({ source, gainNode });
    source.start(now);
    source.stop(now + duration);

    // Jadwalkan iterasi berikutnya tepat saat fase fade-out dimulai sehingga terjadi crossfade mulus
    const nextStartMs = Math.max(1000, (duration - fadeTime) * 1000);
    worldLoopTimeout = setTimeout(() => {
      if (isInWorld && !worldStopped) {
        scheduleWorldBufferTrack(buffer);
      }
    }, nextStartMs);
  }

  function startDualElementWorldLoop() {
    const fadeSec = CROSSFADE_DURATION;
    const createTrack = () => {
      const a = new Audio(WORLD_AUDIO_SRC);
      a.preload = 'auto';
      a.volume = 0;
      return a;
    };

    fallbackWorldAudioA = createTrack();
    fallbackWorldAudioB = createTrack();

    function playWithCrossfade(activeTrack, nextTrack) {
      if (worldStopped) return;
      activeTrack.currentTime = 0;
      activeTrack.volume = 0;
      activeTrack.play().catch(() => {});

      // Fade In (8 detik)
      const fadeInInterval = setInterval(() => {
        if (activeTrack.volume < 0.72) {
          activeTrack.volume = Math.min(0.75, activeTrack.volume + (0.75 / (fadeSec * 20)));
        } else {
          clearInterval(fadeInInterval);
        }
      }, 50);

      let nextTriggered = false;
      const checkTime = () => {
        if (!activeTrack.duration) return;
        const remaining = activeTrack.duration - activeTrack.currentTime;
        if (remaining <= fadeSec && !nextTriggered) {
          nextTriggered = true;
          // Mulai track berikutnya (Crossfade)
          playWithCrossfade(nextTrack, activeTrack);
          // Fade Out track saat ini (8 detik)
          const fadeOutInterval = setInterval(() => {
            if (activeTrack.volume > 0.03) {
              activeTrack.volume = Math.max(0, activeTrack.volume - (0.75 / (fadeSec * 20)));
            } else {
              activeTrack.volume = 0;
              activeTrack.pause();
              clearInterval(fadeOutInterval);
            }
          }, 50);
          activeTrack.removeEventListener('timeupdate', checkTime);
        }
      };
      activeTrack.addEventListener('timeupdate', checkTime);
    }

    playWithCrossfade(fallbackWorldAudioA, fallbackWorldAudioB);
  }

  // Hentikan musik world (fade-out halus). Dipanggil saat tombol "Ya" pada "Lanjutkan ke dashboard" ditekan.
  function stopWorldMusic(fade) {
    if (worldStopped) return;
    worldStopped = true;
    fade = fade || 1.4;
    if (worldLoopTimeout) { clearTimeout(worldLoopTimeout); worldLoopTimeout = null; }
    if (audioCtx) {
      const now = audioCtx.currentTime;
      worldNodes.forEach(({ source, gainNode }) => {
        try {
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), now);
          gainNode.gain.linearRampToValueAtTime(0.0001, now + fade);
          source.stop(now + fade + 0.05);
        } catch (e) {}
      });
    }
    worldNodes.length = 0;
    [fallbackWorldAudioA, fallbackWorldAudioB].forEach((a) => {
      if (!a) return;
      const iv = setInterval(() => {
        if (a.volume > 0.07) { a.volume = Math.max(0, a.volume - 0.06); }
        else { a.volume = 0; a.pause(); clearInterval(iv); }
      }, 50);
    });
  }
  window.kaihStopWorldMusic = stopWorldMusic;
  // Jeda/lanjut musik world (dipakai saat dashboard peta terbuka: musik peta menggantikannya sementara).
  let worldPaused = false;
  window.kaihPauseWorldMusic = function (fade) {
    if (worldStopped || worldPaused || !isInWorld) return;
    worldPaused = true; fade = fade || 1.2;
    if (worldLoopTimeout) { clearTimeout(worldLoopTimeout); worldLoopTimeout = null; }
    if (audioCtx) {
      const now = audioCtx.currentTime;
      worldNodes.forEach(({ source, gainNode }) => {
        try {
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), now);
          gainNode.gain.linearRampToValueAtTime(0.0001, now + fade);
          source.stop(now + fade + 0.05);
        } catch (e) {}
      });
    }
    worldNodes.length = 0;
    [fallbackWorldAudioA, fallbackWorldAudioB].forEach((a) => {
      if (!a) return;
      const iv = setInterval(() => {
        if (a.volume > 0.07) { a.volume = Math.max(0, a.volume - 0.06); }
        else { a.volume = 0; a.pause(); clearInterval(iv); }
      }, 50);
    });
  };
  window.kaihResumeWorldMusic = function () {
    if (!worldPaused || worldStopped) return;
    worldPaused = false;
    startWorldMusicSeamless();
  };
  // FIX (Fase 2.3): dipakai "Skip ke dashboard" agar musik menu tidak terus bunyi di Ladang Langit
  window.kaihStopMenuMusic = function () { isInWorld = true; stopMenuMusic(); };
  window.addEventListener('kaih-finale', () => stopWorldMusic(1.4));

  // 5. Rombak Font Judul Menjadi Sprite Individual & Deteksi Tombol Play di Main Menu
  function scanAndUpgradeMainMenu() {
    if (isInWorld) return;

    // Cari tombol Play di Main Menu
    const buttons = document.querySelectorAll('button, [role="button"], a');
    buttons.forEach(btn => {
      const text = (btn.textContent || '').trim().toLowerCase();
      if (btn.hasAttribute('data-nohook')) return;   // menu v2: SETTINGS & CREDITS bukan tombol play
      const isPlayButton =
        text.includes('bermain') ||
        text.includes('mulai') ||
        text.includes('play') ||
        text.includes('masuk') ||
        text.includes('jelajah') ||
        text.includes('start') ||
        (btn.querySelector('svg') && text.length < 25 && !playButtonEl);

      if (isPlayButton && !btn.dataset.kaihHooked) {
        btn.dataset.kaihHooked = 'true';
        playButtonEl = btn;

        btn.addEventListener('click', () => {
          if (playTriggered) return;
          playTriggered = true;
          isInWorld = true;

          // 1. Mainkan Cloud Whoosh Sound Effect & Transisi Awan
          playCloudWhooshSFX();

          // 2. Hentikan Musik Main Menu
          stopMenuMusic();

          // 3. Sembunyikan Visualizer Menu
          const fxCanvas = document.getElementById('kaih-menu-fx-canvas');
          if (fxCanvas) fxCanvas.classList.add('hidden');

          // 4. Mulai Musik Background World Pulau Awan dengan Seamless Loop Fade
          setTimeout(() => {
            startWorldMusicSeamless();
          }, 350);
        }, { capture: true });
      }
    });

    // Cari Judul Utama (h1 / h2 / elemen teks besar di menu) dan ubah menjadi Sprite per Karakter
    const headings = document.querySelectorAll('h1, h2, .title, [class*="title"], [class*="heading"]');
    headings.forEach(h => {
      if (h.dataset.kaihSprited) return;
      if (h.closest('[role="dialog"],#kx-card,#kx-dlg,#kx-home-confirm,.khc-card,#kx-load,#kaih-splash')) return;   // dialog konfirmasi & loading: teks normal, tanpa efek gelombang
      const rawText = (h.textContent || '').trim();
      if (rawText.length > 1 && rawText.length < 45 && h.children.length === 0) {
        h.dataset.kaihSprited = 'true';
        h.innerHTML = '';
        [...rawText].forEach((ch, idx) => {
          const span = document.createElement('span');
          if (ch === ' ') {
            span.className = 'kaih-sprite-space';
            span.innerHTML = '&nbsp;';
          } else {
            span.className = 'kaih-sprite-char';
            span.textContent = ch;
            span.dataset.index = spriteChars.length;
            spriteChars.push(span);
          }
          h.appendChild(span);
        });
      }
    });
  }

  // 6. Real-Time Beat Detector & Visual Surprise Loop (60 FPS)
  const canvas = document.getElementById('kaih-menu-fx-canvas');
  const ctx2d = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  for (let i = 0; i < 18; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.8 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.7 - 0.2,
      alpha: Math.random() * 0.65 + 0.2,
      hue: 250 + Math.random() * 70
    });
  }

  function animateBeatAndVisuals(timestamp) {
    requestAnimationFrame(animateBeatAndVisuals);
    if (isInWorld) return;

    const time = timestamp * 0.001;
    let bassEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    if (analyser && menuAudioEl && !menuAudioEl.paused) {
      analyser.getByteFrequencyData(freqData);
      if (timeData) analyser.getByteTimeDomainData(timeData);

      // FFT 2048: gunakan hanya bin low-end (sekitar 22–129 Hz pada 44.1 kHz),
      // area yang paling relevan untuk kick drum dan bass rendah.
      for (let i = 1; i <= 5; i++) bassEnergy += freqData[i];
      bassEnergy = bassEnergy / (5 * 255);
      for (let i = 6; i <= 35; i++) midEnergy += freqData[i];
      midEnergy = midEnergy / (30 * 255);
      for (let i = 36; i <= 150; i++) highEnergy += freqData[i];
      highEnergy = highEnergy / (115 * 255);

      // Hanya transient positif pada bass yang boleh memicu beat.
      spectralFlux = Math.max(0, bassEnergy - previousBassEnergy);
      previousBassEnergy = bassEnergy;
    } else {
      // Idle gentle rhythm jika audio belum diputar
      bassEnergy = (Math.sin(time * 2.8) * 0.5 + 0.5) * 0.18;
      midEnergy = (Math.cos(time * 2.1) * 0.5 + 0.5) * 0.12;
      highEnergy = (Math.sin(time * 4.2) * 0.5 + 0.5) * 0.1;
    }

    smoothedBass += (bassEnergy - smoothedBass) * 0.28;
    smoothedMid += (midEnergy - smoothedMid) * 0.22;
    smoothedHigh += (highEnergy - smoothedHigh) * 0.22;

    // Beat gate khusus kick/bass: perlu level bass cukup kuat DAN onset baru.
    // Cooldown lebih panjang + ambang relatif menahan getaran berulang pada nada panjang.
    const beatThreshold = Math.max(0.055, bassFloor * 1.35);
    const clearBassOnset = bassEnergy > beatThreshold && spectralFlux > 0.012;
    const beatDetected = clearBassOnset && (timestamp - lastBeatTime > 285);
    if (beatDetected) {
      beatPulse = 1.0;
      lastBeatTime = timestamp;
    } else {
      // Decay halus, tidak ada pulsa idle otomatis saat musik berhenti.
      beatPulse *= 0.90;
    }
    bassFloor += ((bassEnergy || 0) - bassFloor) * (bassEnergy > bassFloor ? 0.008 : 0.035);
    beatPulse = Math.max(0, beatPulse);

    // Animasi logo SVG mengikuti beat & frekuensi (tanpa sprite HTML per huruf)
    const logoSvg = document.getElementById('kaih-logo-svg');
    if (logoSvg) {
      const logoScale = 1 + (smoothedBass * 0.035) + (beatPulse * 0.045);
      const logoLift = -(smoothedMid * 3 + beatPulse * 2);
      const logoGlow = Math.round(18 + smoothedBass * 24 + beatPulse * 20);
      logoSvg.style.transform = `translateY(${logoLift.toFixed(2)}px) scale(${logoScale.toFixed(3)})`;
      logoSvg.style.filter = `drop-shadow(0 4px 0 #8a5a1c) drop-shadow(0 0 ${logoGlow}px rgba(255,208,96,${(0.55 + beatPulse * 0.4).toFixed(2)}))`;
    }

    // Animasi Sprite Huruf Mengikuti Beat & Frekuensi (fallback untuk judul HTML lain)
    if (spriteChars.length > 0) {
      const total = spriteChars.length;
      for (let i = 0; i < total; i++) {
        const el = spriteChars[i];
        const binIndex = (i * 3) % 48;
        const binVal = (freqData && menuAudioEl && !menuAudioEl.paused) ? (freqData[binIndex] / 255) : (smoothedMid * 1.2);

        const waveY = Math.sin(time * 4.5 + i * 0.45) * (4 + smoothedMid * 16) - (binVal * 18) - (beatPulse * 8);
        const scale = 1 + (binVal * 0.22) + (beatPulse * 0.14);
        const rot = Math.sin(time * 3.2 + i * 0.6) * (smoothedBass * 7 + beatPulse * 4);
        const glowRadius = Math.round(8 + smoothedBass * 28 + beatPulse * 18);

        el.style.transform = `translate3d(0, ${waveY.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
        el.style.textShadow = `0 4px ${glowRadius}px rgba(192, 132, 252, ${(0.35 + binVal * 0.65).toFixed(2)}), 0 0 ${Math.round(glowRadius * 0.6)}px rgba(244, 114, 182, ${(beatPulse * 0.8).toFixed(2)})`;
      }
    }

    // (Beat detector pada tombol Play dihapus — beat hanya menganimasikan logo 7 KAIH di main menu.)

    // Render Kejutan Visual: Partikel Bintang Awan & Subtle Bottom Spectrum
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);

    // Partikel melayang yang bereaksi pada ketukan lagu
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx * (1 + smoothedMid * 3);
      p.y += p.vy * (1 + smoothedBass * 4 + beatPulse * 3);

      if (p.y < -10) p.y = canvas.height + 10;
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      const radius = p.r * (1 + smoothedBass * 1.4 + beatPulse * 0.8);
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx2d.fillStyle = `hsla(${p.hue}, 90%, 82%, ${Math.min(1, p.alpha + smoothedHigh * 0.4)})`;
      ctx2d.shadowBlur = 12 + beatPulse * 15;
      ctx2d.shadowColor = `hsla(${p.hue}, 95%, 75%, 0.8)`;
      ctx2d.fill();
    }

    // Spektrum Frekuensi Halus di Bawah Layar Menu
    if (freqData && menuAudioEl && !menuAudioEl.paused) {
      const barCount = 48;
      const barWidth = (canvas.width * 0.45) / barCount;
      const startX = (canvas.width - (barCount * barWidth)) / 2;

      ctx2d.shadowBlur = 0;
      for (let i = 0; i < barCount; i++) {
        const mirrorIdx = i < barCount / 2 ? (barCount / 2 - i) : (i - barCount / 2);
        const val = freqData[mirrorIdx] / 255;
        const barH = Math.max(3, val * 55 * (1 + beatPulse * 0.3));
        const x = startX + i * barWidth;
        const y = canvas.height - barH - 6;

        ctx2d.fillStyle = `hsla(${265 + mirrorIdx * 2.5}, 88%, 76%, ${0.18 + val * 0.45})`;
        ctx2d.beginPath();
        ctx2d.roundRect(x + 1, y, Math.max(2, barWidth - 3), barH, 4);
        ctx2d.fill();
      }
    }
  }

  // Pantau perubahan DOM React agar elemen menu langsung terdeteksi begitu dirender
  const observer = new MutationObserver(() => scanAndUpgradeMainMenu());
  observer.observe(document.body, { childList: true, subtree: true });

  // Musik menu TIDAK lagi dimulai otomatis / pada ketukan pertama global.
  // Trigger-nya ada di js/cutscene.js (ketukan pada layar awal) lewat window.kaihStartMenuMusic().
  window.addEventListener('DOMContentLoaded', () => {
    scanAndUpgradeMainMenu();
    requestAnimationFrame(animateBeatAndVisuals);
  });
})();
