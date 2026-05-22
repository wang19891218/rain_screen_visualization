// js/animations.js — lightweight tween helper (used for the reset-view animation).

export function tween({ from, to, duration = 750, onUpdate, onComplete, ease }) {
  const t0 = performance.now();
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const E = ease || easeOutCubic;
  function frame(now) {
    let k = (now - t0) / duration;
    if (k > 1) k = 1;
    const e = E(k);
    const cur = {};
    for (const key in from) cur[key] = from[key] + (to[key] - from[key]) * e;
    onUpdate(cur);
    if (k < 1) requestAnimationFrame(frame);
    else if (onComplete) onComplete();
  }
  requestAnimationFrame(frame);
}
