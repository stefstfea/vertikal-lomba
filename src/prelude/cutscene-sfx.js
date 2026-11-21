/* =====================================================================
   7 KAIH — Sound effect cutscene pembuka (file terpisah)
   Semua suara disintesis dengan WebAudio (tanpa file audio tambahan),
   sehingga mudah diatur di satu tempat.

   API:  KaihCutsceneSfx.play('tap' | 'crack' | 'shatter' | 'enter' |
                              'textIn' | 'textOut' | 'logo')
         KaihCutsceneSfx.volume(0..1)
   ===================================================================== */
(function () {
  'use strict';
  let ctx = null, master = null, reverb = null, reverbSend = null;
  let level = 0.9;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
      master = ctx.createGain();
      master.gain.value = level;
      master.connect(comp); comp.connect(ctx.destination);
      // Reverb sintetis (impuls noise meluruh) untuk kesan ruang magis
      const len = Math.floor(ctx.sampleRate * 2.6);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      reverb = ctx.createConvolver(); reverb.buffer = ir;
      reverbSend = ctx.createGain(); reverbSend.gain.value = 0.38;
      reverbSend.connect(reverb); reverb.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function noiseBuffer(dur, color) {
    const n = Math.floor(ctx.sampleRate * dur);
    const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    return b;
  }

  // Nada sederhana dengan envelope; wet = seberapa banyak masuk reverb
  function tone(o) {
    const t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    const a = o.attack || 0.01;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.2, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(master);
    if (o.wet) { const s = ctx.createGain(); s.gain.value = o.wet; g.connect(s); s.connect(reverbSend); }
    osc.start(t); osc.stop(t + o.dur + 0.05);
  }

  // Semburan noise terfilter
  function burst(o) {
    const t = ctx.currentTime + (o.at || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(o.dur + 0.1, o.color);
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.f0, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    const a = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.3, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(master);
    if (o.wet) { const s = ctx.createGain(); s.gain.value = o.wet; g.connect(s); s.connect(reverbSend); }
    src.start(t); src.stop(t + o.dur + 0.1);
  }

  const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, D6: 1174.66, E6: 1318.5, G6: 1568, A6: 1760 };

  const SFX = {
    // Ketukan pertama: denting magis lembut
    tap() {
      tone({ f0: N.G5, dur: 1.6, gain: 0.16, wet: 0.8 });
      tone({ f0: N.D6, dur: 1.2, gain: 0.08, wet: 0.8, at: 0.04 });
      tone({ f0: N.A6, dur: 0.9, gain: 0.04, wet: 0.9, at: 0.09 });
      burst({ f0: 2400, f1: 9000, dur: 0.22, filter: 'highpass', gain: 0.05, wet: 0.5 });
    },

    // Retakan dimensi menjalar (~1.5 detik): gemuruh rendah + retak kaca berurutan
    crack() {
      burst({ f0: 90, dur: 2.0, color: 'brown', filter: 'lowpass', gain: 0.5, attack: 0.5 });
      tone({ f0: 46, f1: 30, dur: 2.0, gain: 0.35, attack: 0.6 });
      tone({ f0: 180, f1: 420, dur: 1.5, type: 'triangle', gain: 0.05, attack: 0.9, wet: 0.6 });
      [0.04, 0.17, 0.31, 0.46, 0.6, 0.77, 0.93, 1.1, 1.24, 1.36, 1.44].forEach((at, i) => {
        const hi = 2600 + Math.random() * 3600;
        burst({ at, f0: hi, f1: hi * 0.55, dur: 0.07 + Math.random() * 0.07, q: 4 + Math.random() * 6, gain: 0.16 + i * 0.022, wet: 0.35 });
        if (i % 2 === 0) tone({ at, f0: 1400 + Math.random() * 1800, f1: 300, dur: 0.12, type: 'square', gain: 0.025 + i * 0.004 });
      });
      // dengung ketegangan naik
      tone({ f0: 220, f1: 880, dur: 1.5, type: 'sawtooth', gain: 0.025, attack: 1.2, wet: 0.5 });
    },

    // Dimensi pecah + masuk ke dunia
    shatter() {
      tone({ f0: 140, f1: 24, dur: 1.8, gain: 0.85 });
      tone({ f0: 72, f1: 22, dur: 2.4, type: 'triangle', gain: 0.45 });
      burst({ f0: 3000, dur: 0.9, filter: 'highpass', gain: 0.5, attack: 0.002, wet: 0.5 });
      burst({ f0: 1400, f1: 400, dur: 1.1, q: 0.8, gain: 0.4, attack: 0.002, wet: 0.5 });
      // pecahan kaca berdenting
      for (let i = 0; i < 26; i++) {
        const at = 0.02 + Math.pow(Math.random(), 1.6) * 1.1;
        const f = 1800 + Math.random() * 5200;
        tone({ at, f0: f, f1: f * (0.9 + Math.random() * 0.1), dur: 0.35 + Math.random() * 0.5, gain: 0.03 + Math.random() * 0.04, wet: 0.9 });
      }
      // sapuan udara naik saat kamera menembus
      burst({ f0: 300, f1: 5200, dur: 1.3, q: 0.9, gain: 0.34, attack: 0.5, wet: 0.7 });
    },

    // Tiba di dunia awan malam: pad bersinar + berkilau turun
    enter() {
      const chord = [N.D5, N.A5, N.E6, N.G5];
      chord.forEach((f, i) => {
        tone({ at: 0.15 + i * 0.12, f0: f, dur: 4.4, gain: 0.07, attack: 1.4, wet: 0.9 });
        tone({ at: 0.15 + i * 0.12, f0: f * 2.003, dur: 3.6, gain: 0.025, attack: 1.6, wet: 0.9, detune: 8 });
      });
      [N.A6, N.G6, N.E6, N.D6, N.B5, N.A5].forEach((f, i) => tone({ at: 0.4 + i * 0.22, f0: f, dur: 1.6, gain: 0.05, wet: 0.95 }));
      burst({ f0: 6000, f1: 1200, dur: 2.4, filter: 'bandpass', q: 0.7, gain: 0.06, attack: 0.9, wet: 0.8 });
    },

    // Teks muncul: dua denting halus
    textIn() {
      tone({ f0: N.E6, dur: 1.5, gain: 0.07, wet: 0.9 });
      tone({ f0: N.A5, dur: 1.9, gain: 0.07, wet: 0.9, at: 0.13 });
      burst({ f0: 3500, f1: 8000, dur: 0.6, filter: 'highpass', gain: 0.025, attack: 0.25, wet: 0.7 });
    },

    // Teks membesar & memudar: sapuan lembut
    textOut() {
      burst({ f0: 500, f1: 3200, dur: 1.4, q: 0.8, gain: 0.1, attack: 0.7, wet: 0.8 });
      tone({ f0: N.D5, f1: N.D6, dur: 1.4, gain: 0.03, attack: 0.9, wet: 0.9 });
    },

    // Logo 7KAIH: pop balon + arpeggio berkilau
    logo() {
      tone({ f0: 320, f1: 880, dur: 0.14, gain: 0.2 });
      tone({ at: 0.06, f0: 520, f1: 260, dur: 0.18, gain: 0.08 });
      [N.D5, N.G5, N.A5, N.D6, N.E6, N.G6, N.A6].forEach((f, i) => {
        tone({ at: 0.12 + i * 0.085, f0: f, dur: 1.8, gain: 0.07, wet: 0.9 });
      });
      tone({ at: 0.2, f0: N.D5 / 2, dur: 3.2, gain: 0.09, attack: 0.5, wet: 0.7 });
      burst({ f0: 4000, f1: 11000, dur: 0.9, filter: 'highpass', gain: 0.035, attack: 0.1, wet: 0.7 });
    }
  };

  window.KaihCutsceneSfx = {
    play(name) { try { if (!ac()) return; if (SFX[name]) SFX[name](); } catch (e) { console.warn('SFX error', e); } },
    volume(v) { level = Math.max(0, Math.min(1, v)); if (master) master.gain.value = level; },
    unlock() { ac(); }
  };
})();
