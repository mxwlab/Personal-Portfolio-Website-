(()=>{
 const visuals=[...document.querySelectorAll('#board-10 .task-visual')];
 const layout=()=>{for(const visual of visuals){const scale=visual.clientWidth/Number(visual.dataset.width);visual.firstElementChild.style.transform=`scale(${scale})`;}};
 const observer=new ResizeObserver(layout);for(const visual of visuals)observer.observe(visual);layout();
})();
