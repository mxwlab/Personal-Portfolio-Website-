import * as pdfjsLib from './vendor/build/pdf.mjs';
const { EventBus, PDFViewer, PDFLinkService, LinkTarget } = await import('./vendor/web/pdf_viewer.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./vendor/build/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
const eventBus = new EventBus();
const linkService = new PDFLinkService({ eventBus, externalLinkTarget: LinkTarget.BLANK, externalLinkRel: 'noopener noreferrer' });
const viewer = new PDFViewer({ container: $('viewer-container'), viewer: $('viewer'), eventBus, linkService, textLayerMode: 1, annotationMode: pdfjsLib.AnnotationMode.ENABLE, enableAutoLinking: false, maxCanvasPixels: 16777216 });
linkService.setViewer(viewer);
let pdf, thumbs = [], thumbObserver, thumbQueue = Promise.resolve(), mode = 'page-width';
const mobile = matchMedia('(max-width:760px)');
function revealCurrentThumbnail() {
 if (!pdf || $('sidebar').hidden || $('thumbnails').hidden) return;
 const panel = $('thumbnails'), active = thumbs[viewer.currentPageNumber - 1];
 if (!active) return;
 // Scroll only this panel; scrollIntoView can also move ancestor containers.
 const bounds = panel.getBoundingClientRect(), item = active.getBoundingClientRect();
 if (item.top < bounds.top + 8) panel.scrollTop += item.top - bounds.top - 8;
 else if (item.bottom > bounds.bottom - 8) panel.scrollTop += Math.min(item.bottom - bounds.bottom + 8, item.top - bounds.top - 8);
}
function sidebar(open) {
 const pageNumber = pdf ? viewer.currentPageNumber : 1;
 $('sidebar').hidden = !open;
 $('sidebar-toggle').setAttribute('aria-expanded', String(open));
 $('sidebar-toggle').setAttribute('aria-label', open ? '收起侧栏' : '展开侧栏');
 if (open) requestAnimationFrame(revealCurrentThumbnail);
 if (pdf && !mobile.matches) fitAfterResize(pageNumber);
}
sidebar(!mobile.matches);
$('sidebar-toggle').onclick = () => sidebar($('sidebar').hidden);
function goto(number) {
 const n = Number(number);
 if (!pdf || !Number.isInteger(n) || n < 1 || n > pdf.numPages) { $('page-number').value = viewer.currentPageNumber; return; }
 viewer.currentPageNumber = n;
 if(mobile.matches) sidebar(false);
}
$('page-number').onchange = e => goto(e.target.value);
$('page-number').onkeydown = e => { if(e.key === 'Enter') { goto(e.target.value); e.target.blur(); } };
function setZoom(value) { mode = value; viewer.currentScaleValue = value; }
$('zoom').onchange = e => setZoom(e.target.value);
$('fit-width').onclick = () => setZoom('page-width');
function zoomBy(factor) { setZoom(String(Math.max(.25, Math.min(4, viewer.currentScale * factor)))); }
$('zoom-in').onclick = () => zoomBy(1.25);
$('zoom-out').onclick = () => zoomBy(1 / 1.25);
eventBus.on('scalechanging', ({scale}) => {
 const select = $('zoom'); select.querySelector('[data-custom]')?.remove();
 const value = String(scale);
 if (![...select.options].some(o => o.value === value)) { const option = new Option(`${Math.round(scale*100)}%`, value); option.dataset.custom = 'true'; select.add(option); }
 select.value = value;
 $('zoom-out').disabled = scale <= .25;
 $('zoom-in').disabled = scale >= 4;
});
eventBus.on('pagechanging', ({pageNumber}) => {
 $('page-number').value = pageNumber;
 thumbs.forEach((b,i) => { if(i+1 === pageNumber) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
 revealCurrentThumbnail();
 history.replaceState(null,'',`#page=${pageNumber}`);
});
eventBus.on('pagesinit', () => {
 setZoom('page-width');
 const initial=Number(new URLSearchParams(location.hash.slice(1)).get('page'));
 if(initial >= 1 && initial <= pdf.numPages) goto(initial);
});
eventBus.on('pagerendered', ({error}) => { if(error) showError(error); else $('status').hidden = true; });
// Label the original PDF links for keyboard/screen-reader users. PDF.js owns hit areas
// and navigation, so zoom, page rotation and long-page geometry stay synchronized.
eventBus.on('annotationlayerrendered', async ({source, error}) => {
 if (error || !pdf) return;
 try {
  const annotations = await source.pdfPage.getAnnotations({intent:'display'});
  for (const annotation of annotations) {
   if (annotation.subtype !== 'Link') continue;
   const anchor = source.div.querySelector(`[data-annotation-id="${CSS.escape(annotation.id)}"] a`);
   if (!anchor) continue;
   if (annotation.dest) {
    const dest = typeof annotation.dest === 'string' ? await pdf.getDestination(annotation.dest) : annotation.dest;
    if (!dest) continue;
    const index = typeof dest[0] === 'number' ? dest[0] : await pdf.getPageIndex(dest[0]);
    anchor.setAttribute('aria-label', `跳转到第 ${index + 1} 页`);
   } else if (annotation.url) {
    anchor.setAttribute('aria-label', annotation.url);
   }
  }
 } catch (error) { console.error('PDF link labels unavailable', error); }
});
function showError(error) { console.error(error); $('status').hidden=false; $('status').textContent='作品集暂时无法载入，请刷新重试，或通过右上角联系我。'; }
function tab(name) {
 for(const key of ['thumb','outline']) { const active=key===name; $(key+'-tab').setAttribute('aria-selected', String(active)); $(key+'-tab').tabIndex=active?0:-1; }
 $('thumbnails').hidden=name!=='thumb'; $('outline').hidden=name!=='outline';
 if (name === 'thumb') requestAnimationFrame(revealCurrentThumbnail);
}
for(const name of ['thumb','outline']) {
 $(name+'-tab').onclick=()=>tab(name);
 $(name+'-tab').onkeydown=e=> { if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); const next=e.key==='Home'?'thumb':e.key==='End'?'outline':name==='thumb'?'outline':'thumb';tab(next);$(next+'-tab').focus(); } };
}
// Deliberately scoped to the reading surface, including thumbnails; toolbar remains native.
$('workspace').addEventListener('contextmenu', e => e.preventDefault());
$('viewer-container').addEventListener('keydown', e => {
 if(e.target !== $('viewer-container')) return;
 if(e.key === 'ArrowRight') { e.preventDefault(); goto(viewer.currentPageNumber+1); }
 if(e.key === 'ArrowLeft') { e.preventDefault(); goto(viewer.currentPageNumber-1); }
 if(e.key === 'Home') { e.preventDefault(); goto(1); }
 if(e.key === 'End') { e.preventDefault(); goto(pdf?.numPages); }
});
let resizeTimer, resizePage;
function fitAfterResize(pageNumber = viewer.currentPageNumber) {
 if (!pdf || !mode.startsWith('page-')) return;
 resizePage ??= pageNumber;
 clearTimeout(resizeTimer);
 resizeTimer = setTimeout(() => {
  const anchor = resizePage; resizePage = undefined;
  if (!mode.startsWith('page-')) return;
  viewer.currentScaleValue = mode;
  viewer.scrollPageIntoView({pageNumber:anchor, ignoreDestinationZoom:true});
  revealCurrentThumbnail();
 }, 120);
}
new ResizeObserver(() => fitAfterResize()).observe($('viewer-container'));
async function makeThumbs() {
 // Reserve each page's real aspect ratio before lazy rendering, including long pages.
 const pages = await Promise.all(Array.from({length:pdf.numPages}, (_,i) => pdf.getPage(i+1)));
 thumbObserver=new IntersectionObserver(entries=>{
  for(const entry of entries) if(entry.isIntersecting && !entry.target.dataset.queued) {
   const button=entry.target;button.dataset.queued='true';
   thumbQueue=thumbQueue.then(async()=> {
    const page=await pdf.getPage(Number(button.dataset.page));
    const view=page.getViewport({scale:190/page.getViewport({scale:1}).width});
    const canvas=button.querySelector('canvas'), ratio=Math.min(devicePixelRatio || 1,2);
    canvas.width=Math.ceil(view.width*ratio);canvas.height=Math.ceil(view.height*ratio);canvas.style.height=`${view.height}px`;
    await page.render({canvasContext:canvas.getContext('2d'),viewport:view,transform:[ratio,0,0,ratio,0,0]}).promise;
    button.dataset.rendered='true';
   }).catch(error=>{ delete button.dataset.queued; console.error('Thumbnail unavailable',error); });
  }
 },{root:$('thumbnails'),rootMargin:'150px'});
 for(let n=1;n<=pdf.numPages;n++) {
  const viewport=pages[n-1].getViewport({scale:1});
  const button=document.createElement('button');button.className='thumb';button.dataset.page=n;button.setAttribute('aria-label',`第 ${n} 页`);
  if(n===viewer.currentPageNumber)button.setAttribute('aria-current','page');
  const canvas=document.createElement('canvas');canvas.width=190;canvas.height=Math.ceil(190*viewport.height/viewport.width);canvas.style.height=`${150*viewport.height/viewport.width}px`;canvas.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.textContent=n;button.append(canvas,label);button.onclick=()=>goto(n);$('thumbnails').append(button);thumbs.push(button);thumbObserver.observe(button);
 }
 requestAnimationFrame(revealCurrentThumbnail);
}
async function makeOutline() {
 const outline=await pdf.getOutline();
 if(outline?.length) {
  const append=(items,depth=0)=>items.forEach(item=>{
   if(item.dest) { const button=document.createElement('button');button.className='outline-item';button.style.paddingLeft=`${8+depth*12}px`;button.textContent=item.title;button.onclick=async()=>{await linkService.goToDestination(item.dest);if(mobile.matches)sidebar(false);};$('outline').append(button); }
   if(item.items?.length)append(item.items,depth+1);
  });append(outline);
 } else {
  const note=document.createElement('p');note.className='outline-note';note.textContent='原 PDF 未设置书签。可按页码跳转，或切换缩略图浏览。';$('outline').append(note);
  for(let n=1;n<=pdf.numPages;n++){const button=document.createElement('button');button.className='outline-item';button.textContent=`第 ${String(n).padStart(2,'0')} 页`;button.onclick=()=>goto(n);$('outline').append(button);}
 }
}
try {
 const task=pdfjsLib.getDocument({url:new URL('../downloads/mo-xiuwen-design-portfolio-51.pdf',import.meta.url).href,cMapUrl:new URL('./vendor/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href,wasmUrl:new URL('./vendor/wasm/',import.meta.url).href,iccUrl:new URL('./vendor/iccs/',import.meta.url).href,enableXfa:false,isEvalSupported:false});
 task.onProgress=({loaded,total})=>{ if(total && !$('status').hidden) $('status').textContent=`正在载入作品集… ${Math.min(100,Math.round(loaded/total*100))}%`; };
 pdf=await task.promise;$('page-count').textContent=pdf.numPages;$('page-number').max=pdf.numPages;
 linkService.setDocument(pdf);viewer.setDocument(pdf);
 for(const id of ['page-number','zoom','zoom-in','zoom-out','fit-width'])$(id).disabled=false;
 await Promise.all([makeThumbs(),makeOutline()]);
} catch(error) { showError(error); }
