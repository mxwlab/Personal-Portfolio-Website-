// Retain native video controls, hiding their fullscreen chrome only while playback is idle.
(() => {
  let timer, current = null, dragging = false, keyboard = false;
  const videoInFullscreen = () => {
    const full = document.fullscreenElement;
    return full?.matches('video[controls]') ? full : full?.querySelector('video[controls]');
  };
  const reveal = () => {
    clearTimeout(timer);
    current?.classList.remove('native-controls-idle');
    current = videoInFullscreen();
    if (current && !current.paused && !current.ended && !dragging && !keyboard) {
      timer = setTimeout(() => {
        if (current === videoInFullscreen() && !current.paused && !dragging && !keyboard) current.classList.add('native-controls-idle');
      }, 2500);
    }
  };
  document.addEventListener('fullscreenchange', () => { keyboard = false; dragging = false; reveal(); });
  document.addEventListener('pointermove', () => { if (videoInFullscreen()) { keyboard = false; reveal(); } }, { passive: true });
  document.addEventListener('pointerdown', () => { if (videoInFullscreen()) { dragging = true; keyboard = false; reveal(); } }, true);
  document.addEventListener('pointerup', () => { dragging = false; if (videoInFullscreen()) reveal(); }, true);
  document.addEventListener('pointercancel', () => { dragging = false; reveal(); }, true);
  document.addEventListener('keydown', event => { if (videoInFullscreen()) { keyboard = true; reveal(); if (event.key === 'Escape') document.exitFullscreen().catch(() => {}); } }, true);
  for (const event of ['play', 'pause', 'ended', 'seeking', 'seeked', 'volumechange']) {
    document.addEventListener(event, e => { if (e.target === videoInFullscreen()) reveal(); }, true);
  }
  window.addEventListener('blur', () => { clearTimeout(timer); current?.classList.remove('native-controls-idle'); });
  window.addEventListener('focus', reveal);
})();
