/* One wheel/trackpad gesture per reading stop; no interception on phones. */
(()=>{
 const desktop=matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine)');
 let locked=false,idle=0,direction=0,sum=0,destination=null,jumped=0;
 const reset=()=>{clearTimeout(idle);locked=false;direction=0;sum=0;destination=null;};
 const stops=()=>{
  const offset=document.querySelector('.topbar').getBoundingClientRect().height;
  const usable=Math.max(240,innerHeight-offset),max=document.documentElement.scrollHeight-innerHeight;
  const points=[0];
  for(const shell of document.querySelectorAll('.board-shell')){
   const groups=[...shell.querySelectorAll('.desktop-reading-group')];
   for(const el of groups.length?groups:[shell]){
    const r=el.getBoundingClientRect(),start=Math.max(0,r.top+scrollY-offset),end=Math.max(start,r.bottom+scrollY-innerHeight);
    points.push(start);
    if(['board-11','board-14'].includes(shell.id)){
     // Keep entry/return boundaries, but never synthesize screen stops inside comparisons.
     points.push(end);continue;
    }
    if(r.height>usable+2){
     for(let y=start+usable-64;y<end-40;y+=usable-64)points.push(y);
     points.push(end);
    }
   }
  }
  points.push(max);
  return [...new Set(points.map(y=>Math.round(Math.min(max,Math.max(0,y)))))].sort((a,b)=>a-b).filter((y,i,a)=>i===0||y-a[i-1]>24);
 };
 const nativeTarget=e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return true;
  if(e.target.closest('input,textarea,select,[contenteditable="true"],.chapter-links,.funding-video-player,video'))return true;
  for(let n=e.target;n&&n!==document.body;n=n.parentElement){
   const s=getComputedStyle(n);
   if(/auto|scroll/.test(s.overflowY)&&n.scrollHeight>n.clientHeight+2)return true;
  }
  return false;
 };
 addEventListener('wheel',e=>{
  if(!desktop.matches||nativeTarget(e)||!e.deltaY)return;
  const comparison=document.getElementById('board-11');
  const edge=document.querySelector('.topbar').getBoundingClientRect().bottom;
  const bounds=comparison.getBoundingClientRect();
  // Once its top reaches the menu, let the document scroll naturally through
  // the whole comparison, including the boundary into the following chapter.
  const review=document.getElementById('board-14').getBoundingClientRect();
  if((bounds.top<=edge+2&&bounds.bottom>edge+2)||review.top<=edge+2){reset();return;}
  const sign=Math.sign(e.deltaY),now=performance.now();
  const reversing=direction&&sign!==direction;
  if(reversing){locked=false;sum=0;}
  direction=sign;
  clearTimeout(idle);idle=setTimeout(()=>{locked=false;sum=0;direction=0;},240);
  e.preventDefault();
  if(locked)return;
  // A long wheel burst must not skip one of the four complete journey tables.
  if(!reversing&&now-jumped<900&&document.elementFromPoint(innerWidth/2,innerHeight/2)?.closest(".journey-page,.project-build-demo"))return;
  sum+=Math.abs(e.deltaY)*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  if(sum<18)return;
  const from=destination!==null&&now-jumped<800?destination:scrollY;
  const all=stops(),next=sign>0?all.find(y=>y>from+3):[...all].reverse().find(y=>y<from-3);
  if(next===undefined){locked=true;return;}
  destination=next;jumped=now;locked=true;sum=0;
  scrollTo({top:next,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
 },{passive:false});
 for(const name of ['keydown','pointerdown','touchstart','resize','hashchange'])addEventListener(name,reset,{passive:true});
 desktop.addEventListener('change',reset);
 // Decorative repeated eyebrows only: neither chapter titles nor fixed navigation.
 for(const el of document.querySelectorAll('.board p,.mobile-copy')){
  const text=el.textContent.trim();
  if(text.length>70||(!/Portfolio/.test(text)&&!/^\d{2}\s*[/／]/.test(text)))continue;
  const parts=[el,...el.querySelectorAll('span')].map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);
  for(const [n,size] of parts){n.style.fontSize=size*.8+'px';n.style.fontWeight='400';}
  el.style.opacity='.65';el.dataset.quietEyebrow='true';
 }
})();
