/* Four complete stage stops; keep each table, including row spans, intact. */
(()=>{
 const host=document.querySelector('#board-7 .journey-dark>.journey-inner'),lead=host.querySelector('.journey-lead');
 lead.classList.remove('desktop-reading-group');
 [...host.querySelectorAll('.journey-stage')].forEach((stage,i)=>{
  const page=document.createElement('div');page.className='journey-page desktop-reading-group';page.id=`journey-stage-${i+1}`;page.dataset.readingGroup=stage.dataset.readingGroup;
  host.insertBefore(page,stage);stage.classList.remove('desktop-reading-group');
  const body=document.createElement('div');body.className='journey-page-body';page.append(body);
  if(i===0){page.classList.add('journey-page-first');const rail=document.createElement('div');rail.className='journey-stage-rail';rail.innerHTML='<span>06/业财旅程</span><span>- Portfolio</span>';page.prepend(rail);body.append(lead);}
  body.append(stage);
 });
})();
