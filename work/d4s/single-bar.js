(() => {
 const bar=document.querySelector('.topbar'),slot=document.querySelector('.chapters'),links=slot?.querySelector('.chapter-links'),cover=document.querySelector('#board-0');
 if(!bar||!slot||!links||!cover)return;
 // One persistent navigation row; the original slot never takes up space.
 bar.append(links);
 links.setAttribute('role','navigation');
 links.setAttribute('aria-label','项目章节');
 let pending=false;
 const update=()=>{
  pending=false;
  document.documentElement.style.setProperty("--d4s-nav-height",bar.getBoundingClientRect().height+"px");
  const show=cover.getBoundingClientRect().bottom<=bar.getBoundingClientRect().bottom+1;
  document.body.classList.toggle('is-cover-view',!show);
  bar.classList.toggle('has-chapters',show);
  links.hidden=!show;
  links.inert=!show;
 };
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(update)}};
 for(const name of ['scroll','resize','pageshow','hashchange'])addEventListener(name,schedule,{passive:true});
 const sizes=new ResizeObserver(schedule);sizes.observe(cover);sizes.observe(bar);
 document.fonts?.ready.then(schedule);
 update();
})();
