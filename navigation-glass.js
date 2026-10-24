(() => {
 const top=[...document.querySelectorAll('.site-header,.project-return-nav,.topbar')];
 const rails=[...document.querySelectorAll('[data-case-navigation],.iv3-rail,.cv3-rail')];
 const candidates=[...top,...rails];
 let scheduled=false;
 const update=()=>{
  scheduled=false;
  candidates.forEach(bar=>{
   const active=top.includes(bar)||innerWidth<1440;
   bar.classList.toggle('nav-glass',active);
   if(!active)return;
   const rect=bar.getBoundingClientRect();
   const x=Math.min(innerWidth-1,Math.max(1,rect.left+rect.width*.55)),y=Math.max(1,Math.min(innerHeight-1,rect.top+rect.height*.55));
   let tone='light';
   for(const e of document.elementsFromPoint(x,y)){
    if(candidates.some(n=>n===e||n.contains(e))||e.closest('dialog'))continue;
    if(e.matches('img,video,canvas')){tone='image';break}
    const s=getComputedStyle(e);
    let m=s.backgroundColor.match(/[\d.]+/g)?.map(Number);
    if((!m||m[3]===0)&&s.backgroundImage!=='none')m=s.backgroundImage.match(/rgba?\(([^)]+)\)/)?.[1].match(/[\d.]+/g)?.map(Number);
    if(m&&m.length>=3&&(m.length<4||m[3]>.6)){
     const l=m.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
     tone=l[0]*.2126+l[1]*.7152+l[2]*.0722<.10?'dark':'light';break;
    }
   }
   bar.dataset.glassTone=tone;
  });
 };
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}};
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('pageshow',schedule);update();
})();
