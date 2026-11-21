(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Suara bubble-pop ringan, dibuat secara lokal tanpa file audio tambahan.
  let bubbleAudioCtx = null;
  window.kaihPlayBubbleSfx = function(objectId) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      bubbleAudioCtx = bubbleAudioCtx || new AudioCtx();
      const ctx = bubbleAudioCtx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const base = objectId === 'angel' ? 760 : objectId === 'bed' ? 520 : 640;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.65, now + 0.055);
      osc.frequency.exponentialRampToValueAtTime(base * 0.72, now + 0.16);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
      osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.2);
    } catch (_) { /* audio tidak boleh mengganggu interaksi world */ }
  };
  let lastPop = 0;
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!target) return;
    // Interaksi world: elemen yang dapat diklik atau komponen yang memicu bubble/chat.
    const component = target.closest('button, [role="button"], a, [onclick], [tabindex], [data-interactive], [class*="bubble"], [class*="chat"]');
    if (!component || component.closest('#kaih-audio-pill')) return;
    const now = performance.now();
    if (now - lastPop < 65) return;
    lastPop = now;
    component.classList.remove('kaih-world-pop');
    void component.offsetWidth;
    component.classList.add('kaih-world-pop');
    window.setTimeout(() => component.classList.remove('kaih-world-pop'), 460);
    if (!reducedMotion) {
      const ripple = document.createElement('span');
      ripple.className = 'kaih-pop-ripple';
      ripple.style.left = (event.clientX || 0) + 'px';
      ripple.style.top = (event.clientY || 0) + 'px';
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 600);
    }
  }, true);
})();
