/* Reuse immersive.css chapter-heading typography; never target UI/diagram labels. */
(()=>{
 const ids=['2382:2080','2167:10063','2167:10139','2382:2159','2167:9813','2343:2847','2343:2850','2167:9556','2321:2845','2167:10202','2392:2845','2313:2844','2313:2856'];
 const entries=[];
 for(const id of ids){
  const p=document.querySelector(`.board-shell>.board [data-node-id="${id}"]`);if(!p)continue;
  p.dataset.chapterTitle='true';
  let wrap=p;
  while(wrap.parentElement&&!wrap.parentElement.classList.contains('board')){
   const par=wrap.parentElement;
   if(par.querySelectorAll('p,ol,ul').length!==1||[...par.querySelectorAll('img')].some(i=>i.getBoundingClientRect().width>120))break;
   wrap=par;
  }
  const parent=wrap.parentElement,top=parseFloat(getComputedStyle(wrap).top)||0,height=wrap.getBoundingClientRect().height;
  const following=[...parent.children].filter(n=>n!==wrap&&((parseFloat(getComputedStyle(n).top)||0)>top+1)).map(n=>({n,top:parseFloat(getComputedStyle(n).top)}));
  const introPeers=p.dataset.nodeId==='2321:2845'?[...p.parentElement.parentElement.children].filter(n=>n!==p.parentElement&&(parseFloat(getComputedStyle(n).top)||0)>(parseFloat(getComputedStyle(p.parentElement).top)||0)).map(n=>({n,top:parseFloat(getComputedStyle(n).top)})):[];
  entries.push({p,wrap,parent,top,height,following,introPeers});
  for(const m of document.querySelectorAll(`.mobile-copy[data-source-node="${id}"]`)){
   m.dataset.chapterTitle='true';m.style.fontSize='26px';m.style.lineHeight='36px';m.style.fontWeight='650';m.style.letterSpacing='-.025em';m.style.marginBottom=Math.max(0,30-(parseFloat(getComputedStyle(m.parentElement).gap)||0))+'px';
  }
 }
 window.layoutD4SChapterType=()=>{
  if(innerWidth<=600)return;
  const target=42;
  for(const e of entries){
   const {p,wrap,following}=e;
   const introGap=["2321:2845","2392:2845","2313:2844"].includes(p.dataset.nodeId)?10:42;
   const ratio=p.getBoundingClientRect().width/p.offsetWidth;if(!ratio)continue;
   p.style.fontSize=target/ratio+'px';p.style.lineHeight=(57/ratio)+'px';p.style.fontWeight='650';p.style.letterSpacing='-.025em';p.style.height='auto';
   for(const s of p.querySelectorAll('span')){s.style.fontSize='inherit';s.style.lineHeight='inherit';s.style.fontWeight='inherit';}
   // Single-title wrappers must follow the text instead of retaining old 100px boxes.
   const h=p.getBoundingClientRect().height/ratio;
   if(getComputedStyle(p.parentElement).display==='flex'&&p.parentElement.children.length===2&&p.nextElementSibling?.matches('p'))p.parentElement.style.gap=introGap/ratio+'px';
   for(const item of e.introPeers)item.n.style.top=(item.top-(42-introGap)/ratio)+'px';
   if(wrap!==p){let n=p.parentElement;while(n){n.style.height=h+'px';n.dataset.chapterTitleBox='true';if(n===wrap)break;n=n.parentElement;}}
   if(following.length&&!wrap.closest('.desktop-reading-group')){
    const first=Math.min(...following.map(n=>n.top)),next=e.top+h+introGap/ratio;
    for(const item of following)item.n.style.top=item.top+(next-first)+'px';
   }
  }
 };
})();
