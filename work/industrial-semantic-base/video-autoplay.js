// Demo videos: play muted and looped while on screen, pause when scrolled away.
// Visitors can still unmute with the native controls. Nothing downloads until a video nears the viewport.
(function () {
  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-autoplay-inview]'));
  if (!videos.length) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return; // keep click-to-play

  function tryPlay(video) {
    if (video.dataset.userPaused === '1') return;
    video.muted = video.muted || video.dataset.userUnmuted !== '1';
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: leave controls for the visitor */ });
  }

  videos.forEach(function (video) {
    video.muted = true;
    video.loop = true;
    video.setAttribute('playsinline', '');
    // Remember explicit choices so scrolling never fights the visitor.
    video.addEventListener('pause', function () {
      if (!video.dataset.autoPausing && !video.ended) video.dataset.userPaused = '1';
      delete video.dataset.autoPausing;
    });
    video.addEventListener('play', function () { delete video.dataset.userPaused; });
    video.addEventListener('volumechange', function () {
      if (!video.muted) video.dataset.userUnmuted = '1';
    });
  });

  // Start fetching a little before the video scrolls in.
  var loader = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var v = entry.target;
      if (v.preload === 'none') v.preload = 'metadata';
      loader.unobserve(v);
    });
  }, { rootMargin: '400px 0px' });

  var player = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var v = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        tryPlay(v);
      } else if (!v.paused) {
        v.dataset.autoPausing = '1';
        v.pause();
      }
    });
  }, { threshold: [0, 0.5] });

  videos.forEach(function (v) { loader.observe(v); player.observe(v); });
})();
