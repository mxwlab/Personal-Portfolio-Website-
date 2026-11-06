(() => {
  const screen=document.getElementById('board-3');
  if(!screen||matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){screen.classList.add('is-circles-active');observer.disconnect();}
  },{threshold:.25});
  for(const circle of screen.querySelectorAll('[data-node-id="2167:10104"],[data-source-node="2167:10104"]'))observer.observe(circle);
})();
