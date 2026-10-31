/* Explicit editorial roles only. Product UI and diagram labels are deliberately excluded. */
(()=>{
const roles={chapter:['2382:2430','2382:2163','2167:10063','2167:10139','2382:2159','2167:9813','2321:2845','2392:2845','2313:2844','2313:2856'],module:['2395:2826','2392:2863','2392:2878','2313:2857'],card:['2382:2377','2382:2428','2395:2812','2167:10070','2167:10075','2167:10080','2167:10096','2167:10084','2167:10088','2167:10092','2382:2384','2382:2388','2382:2392','2382:2397','2382:2400','2382:2403','2382:2408','2382:2411','2395:2830','2395:2837','2395:2844','2392:2867','2392:2866','2395:2810'],body:['role-intro','2167:10065','2167:10071','2167:10081','2167:10085','2167:10089','2167:10093','2382:2385','2382:2389','2382:2393','2382:2398','2382:2401','2382:2404','2382:2409','2382:2412','2382:2156','2167:9815','2167:9816','2321:2846','2321:2850','2392:2846','2395:2845','2392:2876','2395:2800','2395:2808','2313:2845','2313:2858','2321:2856'],caption:['2321:2853']};
const native={chapter:'.results-native h2,.journey-native h2:not(.journey-lead h2),.project-native h2,.task-native h2',module:'.journey-lead h2,.journey-intro h3,.journey-stage h3,.project-native h3,.task-native h3',scheme:'#board-8 .project-build>h4,#board-8 .project-finance>h4:first-child',card:'.results-metrics h3,.project-insights h4,.project-steps h4,.task-insights h4,.task-strategy-copy h4,.project-feature h4,#funding-video>h4,.project-execution>h4,.project-finance>h4:not(:first-child),.project-diagram-canvas h5,.task-delivery h4,.task-confirm h4',body:'#board-14 .judgment-description,.results-metrics article>p,.journey-intro>p,.journey-lead>p,.project-lead,.project-insights p,.project-feature p,.project-execution-copy,.task-copy,.task-insights p,.task-strategy-copy p,.project-diagram-canvas p',caption:'.results-source'};
const specs={scheme:[26,38,600,20,30],chapter:[42,57,650,26,36],module:[30,42,650,22,32],card:[22,32,600,18,28],body:[20,34,400,16,28],caption:[16,26,400,14,22]};
for(const [role,ids] of Object.entries(roles))for(const id of ids){
 for(const n of document.querySelectorAll(`.board-shell>.board [data-node-id="${id}"],.mobile-copy[data-source-node="${id}"]`))if(n.matches('p,ol,ul,.mobile-copy'))n.dataset.readingType=role;
}
for(const [role,selector] of Object.entries(native))document.querySelectorAll(selector).forEach(n=>n.dataset.readingType=role);
for(const n of document.querySelectorAll('#board-9>.board .fb97e227685b9,#board-13>.board .fb97e227685b9'))n.dataset.readingType='module';
for(const n of document.querySelectorAll('#board-12>.board .ff94a9f75e377'))n.dataset.readingType='body';
// Editorial annotations beside comparison images, not product-interface text.
for(const n of document.querySelectorAll('#board-11>.board p:not([data-reading-type])')){
 const text=n.textContent.trim();
 if(/^[①②③]/.test(text)||text.startsWith('材料入口直达')||text.startsWith('先扫读成果状态'))n.dataset.readingType='body';
}
// Generated mobile copies without source IDs correspond to these exact editorial sentences.
const phrases=new Map();document.querySelectorAll('.board [data-reading-type]').forEach(n=>phrases.set(n.textContent.trim().replace(/\s+/g,' '),n.dataset.readingType));
document.querySelectorAll('.mobile-copy:not(.mobile-eyebrow)').forEach(n=>{if(n.closest('#board-0,#board-14'))return;const role=phrases.get(n.textContent.trim().replace(/\s+/g,' '));if(role)n.dataset.readingType=role;});
// Keep the final glyph and decoration together across title wrapping.
for(const title of document.querySelectorAll('[data-reading-type="chapter"]')){
 if(title.closest('#board-0,#board-14'))continue;
 title.querySelectorAll('.journey-dot,.project-dot,.task-dot').forEach(n=>n.remove());
 const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);let text,last;
 while(text=walker.nextNode())if(text.textContent.trim())last=text;
 if(!last)continue;
 last.textContent=last.textContent.trimEnd();
 const tail=document.createElement('span');tail.className='chapter-title-tail';
 tail.textContent=last.textContent.slice(-1);last.textContent=last.textContent.slice(0,-1);
 const dot=document.createElement('span');dot.className='chapter-title-dot';dot.setAttribute('aria-hidden','true');tail.append(dot);last.after(tail);
}
document.querySelector('[data-node-id="2167:9814"]')?.setAttribute('hidden','');
const elements=[...document.querySelectorAll('[data-reading-type]')];
window.layoutD4SReadingType=()=>{
 const mobile=innerWidth<=600;
 for(const n of elements){
  const s=specs[n.dataset.readingType],source=n.closest('.board'),ratio=n.closest('.project-diagram-canvas')?new DOMMatrixReadOnly(getComputedStyle(n.closest('.project-diagram-canvas')).transform).a:source?n.getBoundingClientRect().width/n.offsetWidth:1;
  if(!ratio||source&&mobile&&!n.closest('.project-diagram-canvas'))continue;
  if(n.dataset.nodeId==='2382:2430'||n.dataset.sourceNode==='2382:2430')n.style.color='#ffffff';
  const size=mobile?s[3]:s[0],line=mobile?s[4]:s[1];
  if(n.dataset.readingType==='chapter'&&n.closest('#board-5,#board-6,#board-9,#board-12,#board-13'))n.style.color='#27335f';
  if(n.dataset.nodeId==='2382:2163'&&source)n.style.width='1664px';
  n.style.fontSize=size/ratio+'px';n.style.lineHeight=line/ratio+'px';n.style.fontWeight=s[2];n.style.letterSpacing='normal';n.style.whiteSpace='normal';n.style.height='auto';
  for(const span of n.querySelectorAll('span')){span.style.fontSize='inherit';span.style.lineHeight='inherit';span.style.fontWeight='inherit';}
 }
 const diagram=document.querySelector('.project-diagram'),canvas=diagram?.querySelector('.project-diagram-canvas');
 if(canvas){
  const scale=new DOMMatrixReadOnly(getComputedStyle(canvas).transform).a;
  const bottom=Math.max(...[...canvas.querySelectorAll('h5,p')].map(n=>n.offsetTop+n.offsetHeight));
  diagram.style.minHeight=Math.max(0,(bottom-4099.68)*scale+16)+'px';
 }
};
// Fixed source cards need explicit growth when editorial copy wraps.
window.fitD4SReadingBoxes=()=>{
 if(innerWidth<=600)return;
 const board=document.querySelector('#board-3>.board'),root=board.firstElementChild,q=id=>root.querySelector(`[data-node-id="${id}"]`),ratio=board.getBoundingClientRect().width/1920;
 // Background: compact the whitespace, not the editorial type scale.
 const available=innerHeight-document.querySelector('.topbar').offsetHeight;
 const px=v=>v/ratio,top=96;
 for(const id of ['2167:10072','2167:10094'])q(id).style.top=px(top)+'px';
 q('2167:10065').style.top=px(top+48)+'px';
 const storiesTop=top+48+q('2167:10065').offsetHeight*ratio+24;
 for(const id of ['2167:10066','2167:10076'])q(id).style.top=px(storiesTop)+'px';
 const storyBottom=Math.max(...['2167:10066','2167:10076'].map(id=>{const n=q(id);return n.offsetTop+n.offsetHeight}));
 const photoTop=storyBottom+px(20),photoHeight=247*ratio;
 for(const id of ['2167:10108','2167:10109']){const n=q(id);n.style.top=photoTop+'px';n.style.height=px(photoHeight)+'px';n.style.objectFit='cover';}
 let y=px(top+48);
 for(const id of ['2167:10082','2167:10090','2167:10086']){
  const n=q(id),label=n.firstElementChild,para=n.querySelector('[data-reading-type=body]');
  Object.assign(n.style,{display:'flex',flexDirection:'column',gap:px(6)+'px',width:'541px',height:'auto',alignItems:'stretch',top:y+'px'});
  Object.assign(label.style,{width:'100%',height:'auto',flexShrink:'0',position:'static'});
  Object.assign(label.firstElementChild.style,{position:'static',width:'100%',height:'auto',margin:'0',whiteSpace:'normal'});
  Object.assign(para.style,{position:'static',left:'0px',width:'100%',height:'auto',flexShrink:'0',margin:'0'});
  y+=n.offsetHeight+px(16);
 }
 const circleTop=y*ratio+4,circleHeight=349*ratio,k=circleHeight/349;
 for(const [id,x,cy] of [['2167:10102',0,149],['2167:10104',84,0],['2167:10106',173,149]]){
  const n=q(id);n.style.transform='none';n.style.left=(1305+px((541*ratio-373*k)/2+x*k))+'px';n.style.top=px(circleTop+cy*k)+'px';n.style.width=px(200*k)+'px';n.style.height=px(200*k)+'px';Object.assign(n.style,{display:'flex',alignItems:'center',justifyContent:'center'});const label=n.querySelector('p');Object.assign(label.style,{position:'static',width:'100%',height:'auto',margin:'0',textAlign:'center',whiteSpace:'normal',wordBreak:'break-all',boxSizing:'border-box',padding:'0 '+px(6)+'px',fontSize:px(16)+'px',lineHeight:px(24)+'px'});
 }
 const height=Math.max(available,photoTop*ratio+photoHeight+24,circleTop+circleHeight+24)/ratio;
 root.style.height=height+'px';board.parentElement.dataset.height=height;
 const comparison=document.querySelector('#board-11>.board'),cq=id=>comparison.querySelector(`[data-node-id="${id}"]`);
 for(const id of ['2395:2805','2392:2883','2395:2851']){const box=cq(id);box.style.height=Math.max(...[...box.children].map(n=>n.offsetTop+n.offsetHeight))+'px';}
 const caseScale=comparison.getBoundingClientRect().width/comparison.offsetWidth;
 const caseGap=48/caseScale;
 // Lift only the first case's value group by 60 visible pixels; reserve its former end position.
 const firstValue=cq('2395:2843');
 firstValue.style.marginTop=(-60/caseScale)+'px';
 firstValue.style.paddingBottom=(60/caseScale)+'px';
 firstValue.style.alignItems='flex-start';
 cq('2395:2884').style.marginLeft=((cq('2395:2839').getBoundingClientRect().left-firstValue.getBoundingClientRect().left)/caseScale)+'px';
 let caseBottom=cq('2392:2846').offsetTop+cq('2392:2846').offsetHeight;
 for(const [caseId,artId] of [['2395:2825','2395:2930'],['2395:2850','2395:2933'],['2395:2851','2395:2936']]){
   const box=cq(caseId),art=cq(artId);
   if(!art.dataset.caseOffset)art.dataset.caseOffset=String(art.offsetTop-box.offsetTop);
   box.style.top=(caseBottom+caseGap+(caseId==='2395:2851'?100/caseScale:0))+'px';
   box.style.height='auto';
   const contentBottom=Math.max(...[...box.children].map(n=>n.offsetTop+n.offsetHeight));
   box.style.height=contentBottom+'px';
   art.style.top=(box.offsetTop+Number(art.dataset.caseOffset))+'px';
   if(artId==='2395:2930'){
     const column=cq('2395:2829'),cr=column.getBoundingClientRect(),br=comparison.getBoundingClientRect();
     art.style.top=((cr.bottom-br.top+24)/caseScale)+'px';
     art.style.setProperty('left',((cr.left-br.left+cr.width/2)/caseScale-art.offsetWidth/2)+'px','important');
   }
   caseBottom=Math.max(box.offsetTop+box.offsetHeight,art.offsetTop+art.offsetHeight);
 }
 cq('2392:2892').style.top=(caseBottom+caseGap)+'px';
 comparison.firstElementChild.style.height=(caseBottom+caseGap)+'px';
 comparison.parentElement.dataset.height=caseBottom+caseGap;
 const roles=document.querySelector('#board-4>.board'),rq=id=>roles.querySelector(`[data-node-id="${id}"]`);
 for(const id of ['2382:2383','2382:2387','2382:2391','2382:2396','2382:2399','2382:2402','2382:2407','2382:2410']){
  const card=rq(id);if(!card)continue;
  Object.assign(card.style,{height:'auto',minHeight:'0',display:'flex',flexDirection:'column',gap:12/ratio+'px',padding:18/ratio+'px '+12/ratio+'px',boxSizing:'border-box'});
  for(const p of card.querySelectorAll('p'))Object.assign(p.style,{position:'static',translate:'none',transform:'none',width:'auto',height:'auto',margin:'0',flexShrink:'0',textAlign:'center'});
 }
 const row1=rq('2167:10148'),row2=rq('2382:2395');
 row1.style.height='auto';row2.style.height='auto';row1.style.top=86/ratio+'px';row2.style.top=(row1.offsetTop+row1.offsetHeight+24/ratio)+'px';
 for(const id of ['2382:2431','2167:10183','2167:10176'])rq(id).style.top=(row2.offsetTop-35)+'px';
 const support=rq('2382:2406');support.style.height='auto';support.style.top=86/ratio+'px';support.style.gap=24/ratio+'px';
 const second=rq('2382:2410');if(second)rq('2167:10125').style.top=(support.offsetTop+second.offsetTop-35)+'px';
 for(const id of ['2382:2375','2382:2426']){const heading=rq(id);heading.style.top=20/ratio+'px';Object.assign(heading.style,{display:'flex',alignItems:'center',gap:10/ratio+'px',height:32/ratio+'px'});Object.assign(heading.firstElementChild.style,{width:6/ratio+'px',height:24/ratio+'px',position:'static',flexShrink:'0'});Object.assign(heading.querySelector('img').style,{position:'static',width:'100%',height:'100%',display:'block'});Object.assign(heading.querySelector('p').style,{position:'static',margin:'0',width:'auto',flexShrink:'0'});}
 for(const id of ['2167:10168','2167:10161','2167:10118'])rq(id).style.top=(86/ratio-35)+'px';
 const intro=rq('role-intro');
 intro.style.left=rq('2382:2430').offsetLeft+'px';intro.style.width=rq('2382:2430').offsetWidth+'px';
 intro.style.top=(96+rq('2382:2430').offsetHeight*ratio+10)/ratio+'px';
 const panelTop=intro.offsetTop*ratio+intro.offsetHeight*ratio+28;
 rq('2382:2434').style.top=(panelTop/ratio+86/ratio-35)+'px';
 rq('2382:2430').style.top=96/ratio+'px';
 for(const id of ['2167:10147','2382:2405'])rq(id).style.top=panelTop/ratio+'px';
 const panelHeight=Math.max(row2.offsetTop+row2.offsetHeight+20/ratio,support.offsetTop+support.offsetHeight+20/ratio);
 rq('2167:10147').style.height=panelHeight+'px';rq('2382:2405').style.height=panelHeight+'px';
 const total=Math.max(available/ratio,panelTop/ratio+panelHeight+20/ratio);roles.firstElementChild.style.height=total+'px';roles.parentElement.dataset.height=total;

};
window.layoutD4SReadingType();
})();
