/* Only the industrial case starts without a glass surface above its cover. */
(() => {
  const body = document.body;
  if (!body?.matches('.iv3-preview.project-return-page')) return;
  if (!body.querySelector(':scope > .project-return-nav')) return;

  let scheduled = false;
  const update = () => {
    scheduled = false;
    body.classList.toggle('industrial-at-top', window.scrollY <= 2);
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('pageshow', update);
  update();
})();
