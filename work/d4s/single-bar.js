(() => {
 const bar=document.querySelector('.topbar'),slot=document.querySelector('.chapters'),links=slot?.querySelector('.chapter-links');
 if(!bar||!slot||!links)return;
 let docked=false,pending=false;
 const align=()=>{
  const style=getComputedStyle(links),gap=parseFloat(style.columnGap)||0;
  const items=[...links.children];
  const width=items.reduce((n,e)=>n+e.getBoundingClientRect().width,0)+gap*Math.max(0,items.length-1)+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0);
  const bounds=bar.getBoundingClientRect(),back=bar.querySelector('a').getBoundingClientRect();
  const left=bounds.left+(bounds.width-width)/2;
  const right=bounds.left+(bounds.width+width)/2;
  const safeRight=bounds.right-parseFloat(getComputedStyle(bar).paddingRight);
  links.classList.toggle('is-centered',docked&&left>=back.right+24&&right<=safeRight);
  links.classList.toggle('fits-slot',!docked&&width<=links.clientWidth);
  if(links.classList.contains('is-centered'))links.scrollLeft=0;
 };
 const update=()=>{
  pending=false;
  const shouldDock=slot.getBoundingClientRect().top<=bar.getBoundingClientRect().bottom;
  if(shouldDock===docked){align();return;}
  const focused=links.contains(document.activeElement)?document.activeElement:null;
  docked=shouldDock;
  if(docked){slot.style.height=slot.getBoundingClientRect().height+'px';bar.append(links)}
  else{slot.append(links);slot.style.height=''}
  if(focused)focused.focus({preventScroll:true});
  slot.classList.toggle('is-docked',docked);
  bar.classList.toggle('has-chapters',docked);
  if(docked){links.setAttribute('role','navigation');links.setAttribute('aria-label','项目章节')}
  else{links.removeAttribute('role');links.removeAttribute('aria-label')}
  align();
 };
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(update)}};
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('pageshow',schedule);update();
 document.fonts?.ready.then(schedule);
})();
