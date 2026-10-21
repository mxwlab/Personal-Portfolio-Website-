const $=id=>document.getElementById(id), scroller=$('viewer-container'), viewer=$('viewer');
const mobile=matchMedia('(max-width:760px)');
let manifest,pages=[],thumbs=[],current=1,scale=1,mode='page-width',raf=0,active=0,desired=new Map(),clock=0;
const failures=new Map();
const tiles=new Map(),texts=new Map(),stats={requests:0,bytes:0,aborted:0,evicted:0,peakDecodedBytes:0,peakTiles:0,firstArtworkMs:null};
const maxTiles=mobile.matches?12:24,concurrency=2;
function diagnostics(){const loaded=[...tiles.values()].filter(t=>t.loaded),bytes=loaded.reduce((s,t)=>s+t.tile.w*t.tile.h*4,0);stats.peakDecodedBytes=Math.max(stats.peakDecodedBytes,bytes);stats.peakTiles=Math.max(stats.peakTiles,tiles.size);return {...stats,decodedBytes:bytes,tiles:tiles.size,loadedTiles:loaded.length,inflight:active,maxTiles,concurrency,current,scale,mode,source:manifest?.sourceSha256,levels:[...new Set(loaded.map(t=>`${t.page.number}:${t.level.width}`))]};}
Object.defineProperty(window,'readerDiagnostics',{get:diagnostics});
function anchor(){const p=pages[current-1];if(!p)return null;return {page:current,y:(scroller.scrollTop-p.el.offsetTop)/p.el.offsetHeight,x:scroller.scrollLeft/Math.max(1,p.el.offsetWidth)};}
function updateZoom(){const select=$('zoom');select.querySelector('[data-custom]')?.remove();for(const [v,label] of [['page-width','适宽'],['page-fit','整页']])select.querySelector(`[value="${v}"]`).textContent=mode===v?`${label} ${Math.round(scale*100)}%`:v==='page-width'?'适合宽度':'适合页面';if(mode.startsWith('page-'))select.value=mode;else{const v=String(scale);if(![...select.options].some(o=>o.value===v)){const option=new Option(`${Math.round(scale*100)}%`,v);option.dataset.custom='true';select.add(option);}select.value=v;}$('fit-width').setAttribute('aria-pressed',String(mode==='page-width'));$('zoom-out').disabled=scale<=.25;$('zoom-in').disabled=scale>=4;}
function layout(value=mode,position=anchor()){
 if(!manifest)return;mode=value;const p=pages[(position?.page||current)-1];
 scale=value==='page-width'?(scroller.clientWidth-4)/(p.width*4/3):value==='page-fit'?Math.min((scroller.clientWidth-4)/(p.width*4/3),(scroller.clientHeight-12)/(p.height*4/3)):Math.max(.25,Math.min(4,Number(value)));
 viewer.style.minWidth=`${Math.max(scroller.clientWidth,...pages.map(p=>p.width*4/3*scale))}px`;
 for(const p of pages){p.el.style.width=`${p.width*4/3*scale}px`;p.el.style.height=`${p.height*4/3*scale}px`;}
 if(position){const p=pages[position.page-1];scroller.scrollTop=p.el.offsetTop+position.y*p.el.offsetHeight;scroller.scrollLeft=value==='page-width'?0:position.x*p.el.offsetWidth;}
 updateZoom();schedule();
}
function goto(n,to){n=Number(n);if(!Number.isInteger(n)||n<1||n>pages.length){$('page-number').value=current;return;}current=n;const p=pages[n-1];scroller.scrollTop=p.el.offsetTop+(to?.[1]||0)/p.height*p.el.offsetHeight;scroller.scrollLeft=(to?.[0]||0)/p.width*p.el.offsetWidth;setCurrent(n);if(mobile.matches)sidebar(false);schedule();}
function setCurrent(n){if(!pages.length)return;current=n;$('page-number').value=n;thumbs.forEach((b,i)=>{if(i+1===n)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});history.replaceState(null,'',`#page=${n}`);revealThumb();}
function revealThumb(){if($('sidebar').hidden||$('thumbnails').hidden)return;const b=thumbs[current-1];if(!b)return;const root=$('thumbnails'),a=root.getBoundingClientRect(),r=b.getBoundingClientRect();if(r.top<a.top+8)root.scrollTop+=r.top-a.top-8;else if(r.bottom>a.bottom-8)root.scrollTop+=Math.min(r.bottom-a.bottom+8,r.top-a.top-8);}
function sidebar(open){const a=anchor();$('sidebar').hidden=!open;$('sidebar-toggle').setAttribute('aria-expanded',String(open));$('sidebar-toggle').setAttribute('aria-label',open?'收起侧栏':'展开侧栏');if(manifest&&mode.startsWith('page-'))layout(mode,a);if(open)revealThumb();}
function drop(key){const t=tiles.get(key);if(!t)return;t.controller.abort();t.img.removeAttribute('src');t.img.remove();if(!t.page.art.children.length)t.page.art.style.visibility='hidden';if(t.url)URL.revokeObjectURL(t.url);tiles.delete(key);stats.evicted++;}
function schedule(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;update();});}
function update(){
 if(!manifest)return;const view=scroller.getBoundingClientRect(),visible=[],need=[];let best=current,bestArea=-1;
 for(let reduction=1;;reduction/=2){need.length=0;visible.length=0;
 for(const p of pages){const r=p.el.getBoundingClientRect(),overlap=Math.max(0,Math.min(r.bottom,view.bottom)-Math.max(r.top,view.top));if(bestArea<0&&r.bottom>view.top+Math.min(64,r.height*.2)&&r.top<view.bottom){bestArea=overlap;best=p.number;}
  if(!overlap)continue;visible.push(p.number);
  const target=r.width*Math.min(devicePixelRatio||1,2)*reduction,level=p.levels.find(l=>l.width>=target)||p.levels.at(-1);
  for(const tile of level.tiles){const left=r.left+tile.x/level.width*r.width,top=r.top+tile.y/level.height*r.height,w=tile.w/level.width*r.width,h=tile.h/level.height*r.height;
   if(left+w<view.left-80||left>view.right+80||top+h<view.top-100||top>view.bottom+100)continue;
   const onscreen=left+w>view.left&&left<view.right&&top+h>view.top&&top<view.bottom;
   need.push({key:tile.file,page:p,level,tile,priority:(onscreen?0:1e8)+Math.hypot(left+w/2-(view.left+view.width/2),top+h/2-(view.top+view.height/2))});
  }
 }
 if(need.length<=maxTiles||reduction<=.0625)break;
 }
 if(scroller.scrollTop>=scroller.scrollHeight-scroller.clientHeight-2)best=pages.length;
 if(best!==current)setCurrent(best);
 need.sort((a,b)=>a.priority-b.priority);desired=new Map(need.slice(0,maxTiles).map(t=>[t.key,t]));
 // Immediately release off-screen pages and requests. Keep same-page old tiles only
 // during a level transition, within the same hard slot budget.
 for(const [key,t] of tiles){if(!visible.includes(t.page.number)||(!desired.has(key)&&!t.loaded))drop(key);}
 const stale=[...tiles].filter(([key])=>!desired.has(key));
 const missing=[...desired.keys()].filter(k=>!tiles.has(k)).length;
 while(tiles.size+missing>maxTiles&&stale.length)drop(stale.shift()[0]);
 if([...desired.keys()].every(k=>tiles.get(k)?.loaded))for(const [key] of tiles)if(!desired.has(key))drop(key);
 for(const [n,t] of texts)if(!visible.includes(n)){t.controller.abort();t.el.replaceChildren();texts.delete(n);}
 for(const n of visible)loadText(pages[n-1]);
 for(const n of visible){const p=pages[n-1],wanted=[...desired.values()].filter(t=>t.page.number===n);if(wanted.length&&wanted.every(t=>tiles.get(t.key)?.loaded)){p.art.style.visibility='visible';stats.firstArtworkMs??=performance.now();}}
 if(visible.length&&visible.every(n=>pages[n-1].art.style.visibility==='visible'))$('status').hidden=true;
 pump();diagnostics();
}
function pump(){
 if(active>=concurrency)return;
 for(const d of desired.values()){
  if(active>=concurrency||tiles.size>=maxTiles)break;if(tiles.has(d.key)||((failures.get(d.key)?.retryAt||0)>Date.now()))continue;
  const controller=new AbortController(),img=new Image();img.alt='';img.draggable=false;img.className='art-tile';img.decoding='async';img.style.cssText=`left:${d.tile.x/d.level.width*100}%;top:${d.tile.y/d.level.height*100}%;width:${d.tile.w/d.level.width*100}%;height:${d.tile.h/d.level.height*100}%;`;
  const t={...d,controller,img,loaded:false,url:null,serial:++clock};tiles.set(d.key,t);active++;stats.requests++;
  (async()=>{try{const response=await fetch(`pages-v41bf139f/${d.tile.file}`,{signal:controller.signal});if(!response.ok)throw Error(`Tile ${response.status}`);const blob=await response.blob();stats.bytes+=blob.size;if(controller.signal.aborted)return;t.url=URL.createObjectURL(blob);img.src=t.url;await img.decode();if(controller.signal.aborted||tiles.get(d.key)!==t)return;t.loaded=true;failures.delete(d.key);d.page.art.append(img);diagnostics();}catch(e){if(controller.signal.aborted||e.name==='AbortError')stats.aborted++;else{console.error(e);const attempts=(failures.get(d.key)?.attempts||0)+1;failures.set(d.key,{attempts,retryAt:attempts<4?Date.now()+1000*2**attempts:Infinity});if(attempts<4)setTimeout(schedule,1000*2**attempts);if(tiles.get(d.key)===t)drop(d.key);$('status').hidden=false;$('status').textContent='页面暂未载入，请稍后重试或联系获取高清原件。';}}finally{active--;schedule();}})();
 }
}
async function loadText(p){if(texts.has(p.number))return;const controller=new AbortController();texts.set(p.number,{controller,el:p.text});try{const r=await fetch(`pages-v41bf139f/p${String(p.number).padStart(2,'0')}/text.json`,{signal:controller.signal}),spans=await r.json();if(controller.signal.aborted)return;const f=document.createDocumentFragment();for(const s of spans){const e=document.createElement('span');e.textContent=s.text;e.style.cssText=`left:${s.box[0]/p.width*100}%;top:${s.box[1]/p.height*100}%;width:${(s.box[2]-s.box[0])/p.width*100}%;height:${(s.box[3]-s.box[1])/p.height*100}%;`;f.append(e);}p.text.append(f);}catch(e){if(!controller.signal.aborted&&e.name!=='AbortError')console.error(e);}}
function tab(name){for(const k of ['thumb','outline']){const yes=k===name;$(k+'-tab').setAttribute('aria-selected',String(yes));$(k+'-tab').tabIndex=yes?0:-1;}$('thumbnails').hidden=name!=='thumb';$('outline').hidden=name!=='outline';if(name==='thumb')revealThumb();}
sidebar(!mobile.matches);$('sidebar-toggle').onclick=()=>sidebar($('sidebar').hidden);
$('page-number').onchange=e=>goto(e.target.value);$('page-number').onkeydown=e=>{if(e.key==='Enter'){goto(e.target.value);e.target.blur();}};
$('zoom').onchange=e=>layout(e.target.value);$('fit-width').onclick=()=>layout('page-width');$('zoom-in').onclick=()=>layout(String(Math.min(4,scale*1.25)));$('zoom-out').onclick=()=>layout(String(Math.max(.25,scale/1.25)));
for(const name of ['thumb','outline']){$(name+'-tab').onclick=()=>tab(name);$(name+'-tab').onkeydown=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'thumb':e.key==='End'?'outline':name==='thumb'?'outline':'thumb';tab(next);$(next+'-tab').focus();}};}
$('workspace').addEventListener('contextmenu',e=>e.preventDefault());
scroller.addEventListener('scroll',schedule,{passive:true});scroller.addEventListener('keydown',e=>{if(e.target!==scroller)return;const map={ArrowRight:current+1,ArrowLeft:current-1,Home:1,End:pages.length};if(e.key in map){e.preventDefault();goto(map[e.key]);}});
let oldWidth=0;new ResizeObserver(()=>{if(scroller.clientWidth===oldWidth)return;oldWidth=scroller.clientWidth;if(mode.startsWith('page-'))layout();else schedule();}).observe(scroller);
try{
 const response=await fetch('pages-v41bf139f/manifest.json');if(!response.ok)throw Error('Manifest unavailable');manifest=await response.json();
 pages=manifest.pages.map(p=>{const el=document.createElement('section');el.className='page';el.dataset.page=p.number;el.setAttribute('aria-label',`第 ${p.number} 页`);const art=document.createElement('div');art.className='page-art';art.style.visibility='hidden';const text=document.createElement('div');text.className='page-text';el.append(art,text);for(const link of p.links){const a=document.createElement('a');a.className='original-link';const [x,y,w,h]=link.rect;a.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%;`;if(link.page){a.href=`#page=${link.page}`;a.setAttribute('aria-label',`跳转到第 ${link.page} 页`);a.onclick=e=>{e.preventDefault();goto(link.page,link.to);};}else{a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',link.url);}el.append(a);}viewer.append(el);return {...p,el,art,text};});
 const thumbObserver=new IntersectionObserver(entries=>{for(const e of entries){const img=e.target.querySelector('img');if(e.isIntersecting)img.src=img.dataset.src;else img.removeAttribute('src');}},{root:$('thumbnails'),rootMargin:'120px'});
 for(const p of pages){const b=document.createElement('button');b.className='thumb';b.setAttribute('aria-label',`第 ${p.number} 页`);const img=new Image();img.alt='';img.dataset.src=`pages-v41bf139f/p${String(p.number).padStart(2,'0')}/thumb.webp`;img.style.aspectRatio=`${p.width}/${p.height}`;img.decoding='async';const label=document.createElement('span');label.textContent=p.number;b.append(img,label);b.onclick=()=>goto(p.number);$('thumbnails').append(b);thumbs.push(b);thumbObserver.observe(b);}
 for(const [depth,title,page] of manifest.outline){const b=document.createElement('button');b.className='outline-item';b.style.paddingLeft=`${8+(depth-1)*12}px`;b.textContent=title;b.onclick=()=>goto(page);$('outline').append(b);}
 $('page-count').textContent=pages.length;$('page-number').max=pages.length;for(const id of ['page-number','zoom','zoom-in','zoom-out','fit-width'])$(id).disabled=false;
 const initial=Number(new URLSearchParams(location.hash.slice(1)).get('page'))||1;current=Math.max(1,Math.min(pages.length,initial));layout('page-width',{page:current,y:0,x:0});setCurrent(current);
}catch(e){console.error(e);$('status').hidden=false;$('status').textContent='作品集暂时无法载入，请刷新重试或联系获取高清原件。';}
