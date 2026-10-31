/* Explicit desktop reading groups. Source text and UI interiors are retained. */
(()=>{
 const hiddenBoards=[...document.querySelectorAll('.board-shell>.board')].filter(b=>getComputedStyle(b).display==='none').map(b=>({b,display:b.style.display,visibility:b.style.visibility,position:b.style.position}));
 for(const {b} of hiddenBoards){b.style.display='block';b.style.visibility='hidden';b.style.position='absolute';}

 const plans={
 'board-7':{hidden:['2343:2845'],groups:[
 ['旅程调研与概览','#f4f5fa',[['2343:2857'],['2343:2846'],['2381:1995'],['2343:2875'],['2343:2870']]],
 ['四阶段问题导读','#0e1621',[['2343:2849'],['2343:2855']],false],
 ['规划与分配','#0e1621',[['2343:2897'],['2343:3214']]],
 ['经费管理','#0e1621',[['2383:2478'],['2343:3219']]],
 ['执行跟踪','#0e1621',[['2383:2525'],['2383:2609']]],
 ['对账与集成','#0e1621',[['2383:2563']]],
 ['旅程衔接','#f4f5fa',[['2343:2852']],false]
 ]},
 'board-8':{hidden:['2167:9546'],groups:[
 ['项目管理与设计洞察','#0e1621',[['2167:9547'],['2167:9555'],['2167:9634'],['2385:2740'],['2385:2749']]],
 ['分步建项主界面','#0e1621',[['2385:2741'],['2167:9558'],['2167:9579']]],
 ['项目、人员与课题填写','#0e1621',[['2383:2663','2383:2664','2383:2668'],['2167:9600'],['2384:2673']]],
 ['经费核对与预算图解','#e7ebf4',[['2383:2672'],['2167:9620'],['2328:2942','2384:2680','2384:2675','2384:2717','2384:2720','2384:2723','2384:2681','2384:2677','2384:2724','2384:2682','2384:2678']]],
 ['预算执行与明细','#e7ebf4',[['2384:2730'],['2384:2731'],['2167:9630'],['2384:2727']]]
 ]},
 'board-10':{hidden:[],groups:[
 ['任务交付与设计洞察','#071127',[['2167:10193'],['2167:10201'],['2167:10204'],['2167:10207'],['2167:10210']]],
 ['结构化目标拆解','#071127',[['2167:10205'],['2167:10208'],['2167:10224','2167:10239']]],
 ['标准化交付物','#071127',[['2167:10227','2167:10421']]],
 ['灵活时间粒度','#071127',[['2167:10230','2167:10266']]],
 ['执行过程与闭环','#071127',[['2167:10233','2167:10427']]],
 ['约定交付材料','#071127',[['2313:2832'],['2313:2833'],['2313:2834'],['2306:1938']]],
 ['提交与确认','#071127',[['2313:2837'],['2313:2838'],['2313:2839']]]
 ]}
 };
 const layouts=[];
 for(const [id,plan] of Object.entries(plans)){
  if(document.getElementById(id).matches('.journey-native,.project-native,.task-native'))continue;
  const shell=document.getElementById(id),board=shell.querySelector(':scope>.board'),root=board.firstElementChild;
  const base=board.getBoundingClientRect(),scale=base.width/1920;
  const lookup=id=>root.querySelector(`[data-node-id="${id}"]`);
  const groups=plan.groups.map(([name,color,rows,full=true])=>({name,color,full,rows:rows.map(ids=>ids.map(id=>{
   const el=lookup(id);if(!el)throw new Error('Missing reading source '+id);
   const r=el.getBoundingClientRect();return{el,x:(r.left-base.left)/scale,y:(r.top-base.top)/scale,w:r.width/scale,h:r.height/scale,cssW:parseFloat(getComputedStyle(el).width),cssH:parseFloat(getComputedStyle(el).height),inherited:Object.fromEntries(['color','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign'].map(k=>[k,getComputedStyle(el)[k]]))};
  }))}));
  for(const group of groups)for(const row of group.rows){
   if(row.length!==2)continue;
   const ordered=[...row].sort((a,b)=>a.x-b.x),[left,right]=ordered;
   if(left.x+left.w>right.x+2)continue;
   left.x=80;
   const room=1760-left.w-48;
   if(right.w>room){const factor=room/right.w;right.w*=factor;right.h*=factor;}
   right.x=1840-right.w;
  }
  for(const id of plan.hidden){lookup(id).style.display='none';}
  // Capture all geometry before moving any nested source element.
  for(const group of groups){
   const wrap=document.createElement('div');wrap.className='desktop-reading-group';wrap.dataset.readingGroup=group.name;wrap.style.cssText=`position:absolute;left:0;width:1920px;background:${group.color}`;
   root.append(wrap);group.wrap=wrap;
   for(const row of group.rows)for(const n of row){wrap.append(n.el);Object.assign(n.el.style,n.inherited);n.el.style.position='absolute';n.el.style.margin='0';n.el.style.left=n.x+'px';n.el.style.width=n.cssW+'px';n.el.style.height=n.cssH+'px';n.el.style.transform=`scale(${n.w/n.cssW},${n.h/n.cssH})`;n.el.style.transformOrigin='top left';}
  }
  // These two former containers now have all their children in explicit groups.
  if(id==='board-10')for(const id of ['2167:10223','2313:2831'])lookup(id).style.display='none';
  layouts.push({shell,board,root,groups});
 }
 window.layoutD4SReadingGroups=(scale,available,shell)=>{
  const data=layouts.find(l=>l.shell===shell);if(!data)return null;
  let top=0;
  for(const group of data.groups){
   for(const row of group.rows)for(const n of row){
    if(n.el.dataset.chapterTitleBox){n.h=parseFloat(n.el.style.height)*(n.w/n.cssW);}
   }
   const rowHeights=group.rows.map(row=>Math.max(...row.map(n=>n.y+n.h))-Math.min(...row.map(n=>n.y)));
   const regular=rowHeights.reduce((a,b)=>a+b,0)*scale+32+12*(group.rows.length-1);
   const compact=regular>available&&regular-available<=48;
   const compactHeight=rowHeights.reduce((a,b)=>a+b,0)*scale+16+6*(group.rows.length-1);
   const tight=compact&&compactHeight>available&&compactHeight-available<=16;
   const pad=(tight?4:compact?8:16)/scale,gap=(tight?4:compact?6:12)/scale;let cursor=pad;
   for(const row of group.rows){
    const min=Math.min(...row.map(n=>n.y)),height=Math.max(...row.map(n=>n.y+n.h))-min;
    for(const n of row)n.el.style.top=cursor+n.y-min+'px';
    cursor+=height+(row.some(n=>n.el.dataset.chapterTitleBox)?42/scale:gap);
   }
   const content=cursor-gap+pad,height=group.full?Math.max(content,available/scale):content;
   const center=(height-content)/2;
   for(const row of group.rows)for(const n of row)n.el.style.top=parseFloat(n.el.style.top)+center+'px';
   group.wrap.style.top=top+'px';group.wrap.style.height=height+'px';group.wrap.dataset.contentHeight=(content*scale).toFixed(2);group.wrap.dataset.fitsScreen=String(content*scale<=available+.5);
   top+=height;
  }
  data.root.style.height=top+'px';data.board.style.height=top+'px';return top*scale;
 };
 for(const {b,display,visibility,position} of hiddenBoards){b.style.display=display;b.style.visibility=visibility;b.style.position=position;}
})();
