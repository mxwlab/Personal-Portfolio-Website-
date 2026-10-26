import {validateClaude,combineDays} from './usage-heat-data.mjs';
import {overview,snapshots} from './usage-presentation.mjs';
import {validateHistory,recordedSummary,modelSummary} from './usage-history.mjs';
import {validate,range,summarize,names,metrics} from './usage-core.mjs';
const root=document.querySelector('[data-safe-usage]');
if(root){
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 try{
 const d=validate(JSON.parse(document.getElementById('safe-usage-data').textContent)),today=new Date().toISOString().slice(0,10),year=today.slice(0,4);
 const historicalElement=document.getElementById('historical-usage-data');
 const history=historicalElement?validateHistory(JSON.parse(historicalElement.textContent)):null;
 const claudeElement=document.getElementById('claude-daily-history');
 const claude=claudeElement?validateClaude(JSON.parse(claudeElement.textContent)):null;
 const historicalDays=combineDays(history?.daily??[],claude?.daily??[]);
 const historicalScale=Math.max(history?.totals.totalTokens??0,...Object.values(snapshots));
 const firstYearRecord=[...historicalDays.values()].filter(r=>r.date.startsWith(year+'-')).map(r=>r.date).sort()[0];
 const firstMonth=firstYearRecord?Number(firstYearRecord.slice(5,7)):1,visibleStart=year+'-'+String(firstMonth).padStart(2,'0')+'-01';
 const compact=n=>n===null?'—':n>=1e8?(n/1e8).toFixed(2)+'亿':n>=1e4?(n/1e4).toFixed(2)+'万':n.toLocaleString('zh-CN');
 const title=document.getElementById('ai-overview-title');if(title)title.textContent=year+' AI 编程已记录用量';
 const top=el('div',undefined,'usage-top');const stamps=d.sources.filter(s=>s.verified).map(s=>s.updatedAt);top.append(el('span','◷ '+(history?'历史汇总重算 '+history.recountedAt.slice(0,10):stamps.length?'最近导入 '+stamps.sort().at(-1).slice(0,10):'更新时间待导入')));
 const scroll=el('div',undefined,'usage-heat-scroll');scroll.tabIndex=0;scroll.setAttribute('aria-label',year+'年'+firstMonth+'月至12月热图，可横向滚动。Codex 与 Claude 历史Token部分记录，DSH日数据未接入。日期沿用原导出，时区未记录。未知不代表零活动。');
 const heat=el('div',undefined,'usage-heat');heat.setAttribute('role','img');heat.setAttribute('aria-label','Codex 与 Claude 已记录Token热图，仅部分来源。绿色为记录之和，灰色未知，淡灰未来。');
 let start=new Date(visibleStart+'T00:00:00Z'),last=new Date(year+'-12-31T00:00:00Z');start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);
 for(let date=new Date(start);date<=last;date.setUTCDate(date.getUTCDate()+1)){const key=date.toISOString().slice(0,10),pad=key<visibleStart;const cell=el('span',undefined,'heat-cell'+(pad?' heat-pad':key>today?' heat-future':''));cell.title=key+' · '+(pad?'':key>today?'未来日期':'数据待核验');const r=historicalDays.get(key);if(r&&!pad&&key<=today){const n=r.totalTokens;cell.classList.add(n===0?'heat-zero':'heat-level-'+(n<=1e6?1:n<=1e7?2:n<=2.5e7?3:n<=5e7?4:5));cell.title=key+' · 已记录 '+n.toLocaleString('zh-CN')+' Token · '+[['codex','Codex'],['claude-code','Claude']].map(([id,name])=>name+'：'+(Object.hasOwn(r.sources,id)?r.sources[id].toLocaleString('zh-CN')+' Token':'未知')).join(' · ')+' · DSH：未接入日数据 · 原导出日期，时区未知，未做跨源请求去重';}cell.setAttribute('aria-hidden','true');heat.append(cell);}
 const months=el('div',undefined,'usage-months');for(let n=firstMonth;n<=12;n++)months.append(el('span',n+'月'));const minWidth=Math.ceil((last-start)/86400000/7+1)*13;heat.style.minWidth=minWidth+'px';months.style.minWidth=minWidth+'px';months.style.gridTemplateColumns='repeat('+(13-firstMonth)+',1fr)';scroll.append(heat,months);
 const legend=el('p','Codex + Claude 已记录日用量，非完整覆盖；DSH 日数据未接入。沿用各源原日期，时区未知；灰色未知，不代表未使用。','usage-heat-note');
 const bar=el('div',undefined,'usage-overview-bar');bar.append(el('h3','使用概览'));const controls=el('div',undefined,'usage-ranges');controls.setAttribute('aria-label','统计时间范围');bar.append(controls);
 const period=el('p',undefined,'usage-period');const columns=el('div',undefined,'usage-columns');
 const left=el('div',undefined,'usage-summary');left.append(el('h4','模型 Token 排行'));const pills=el('div',undefined,'usage-model-pills');for(let i=0;i<2;i++)pills.append(el('span','◇  模型待核验  —'));left.append(pills,el('small','仅 Codex · 部分原记录含推定标记','usage-model-note'));
 for(const [label,note] of [['已收集记录覆盖天数','固定历史总览'],['累计Token数','跨来源去重与口径待核验']]){const block=el('div',undefined,'usage-big-metric');block.append(el('h4',label),el('strong','—'),el('small',note));left.append(block);}
 const right=el('div',undefined,'usage-distribution');right.append(el('h4','工具与模型分布'));const rows=el('div');rows.setAttribute('aria-live','polite');right.append(rows);columns.append(left,right);
 const scopeNote=el('p','左侧两项为固定历史总览；仅 Codex 工具行与模型排行随年/月/日筛选。其余工具为固定历史快照。条长按已收集历史 Token 量换算；各源覆盖范围不同，非目标完成率。','usage-scope-note');
 const detail=el('div',undefined,'usage-source-details');const existing=root.parentElement.querySelector('.about-usage-coverage');if(existing)existing.append(detail);
 root.replaceChildren(top,scroll,legend,bar,period,scopeNote,columns);let mode='year';const buttons=[];
 const render=()=>{const view=overview(history,mode,today),{start,end}=view,historical=view.recorded;period.textContent='Codex 筛选范围：'+start+' 至 '+end+'（原导出时区未记录）';
 const ranked=view.models;pills.replaceChildren();for(let i=0;i<2;i++){const model=ranked[i],pill=el('span',undefined,'usage-model-pill');if(model){const image=el('img');image.src='../media/tool-icons/codex.png';image.alt='';pill.append(image,el('span',model.name,'usage-model-name'),el('span',compact(model.totalTokens)+' Token','usage-model-value'));}else pill.textContent=i===0?'所选范围无模型记录':'无其他模型记录';pill.title=model?model.name+'：'+model.totalTokens.toLocaleString('zh-CN')+' Token；带 fallback 标记的日模型记录：'+model.fallbackMarkedTokens.toLocaleString('zh-CN')+' Token（实际路由未审计）':'缺失不代表零';pills.append(pill);}
 const activeBlock=left.querySelectorAll('.usage-big-metric')[0];activeBlock.querySelector('strong').textContent=historicalDays.size?historicalDays.size+' 天':'—';activeBlock.querySelector('small').textContent='Codex＋Claude 历史记录去重，非完整使用天数 · 固定历史总览';
 const tokenBlock=left.querySelectorAll('.usage-big-metric')[1];tokenBlock.querySelector('h4').textContent='已收集记录累计 Token';tokenBlock.querySelector('strong').textContent=compact(view.historicalTotalTokens);tokenBlock.querySelector('strong').title=view.historicalTotalTokens===null?'历史记录未齐':view.historicalTotalTokens.toLocaleString('zh-CN')+' Token · 三份历史记录算术累计';tokenBlock.querySelector('small').textContent='三工具历史汇总 · 统计范围及口径未完全核实 · 固定历史总览';rows.replaceChildren();detail.replaceChildren();buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 for(const s of d.sources){const sums=summarize(s,start,end),item=view.tools.find(t=>t.source===s.source),fixed=item.kind==='fixed-snapshot';
 const row=el('div',undefined,'usage-tool-row'),icon=el('span',undefined,'usage-tool-icon');const image=el('img');image.src='../media/tool-icons/'+(s.source==='codex'?'codex':s.source==='deepseek-harness'?'deepseek-harness':'claude')+'.png'+(s.source==='deepseek-harness'?'?v=0.2.1-rc.2':'');image.alt='';icon.append(image);
 const name=el('span',names[s.source],'usage-tool-name'),track=el('div',undefined,'usage-tool-track'),value=el('b',compact(item.tokens),'usage-tool-value');value.title=item.tokens===null?'所选范围无记录':item.tokens.toLocaleString('zh-CN')+' Token';
 if(fixed){track.setAttribute('aria-label','历史快照 Token 量，固定历史最大值尺度，非完成率');const segment=el('i');segment.style.width=item.tokens/historicalScale*100+'%';segment.style.background=s.source==='claude-code'?'#c9ab78':'#8b9aab';segment.title=item.tokens.toLocaleString('zh-CN')+' Token · 历史范围未核实';track.append(segment);}else{track.setAttribute('aria-label','Codex 所选范围模型 Token 量，固定历史最大值尺度，非请求次数');const palette=['#456f5c','#8faa78','#c0ca85','#74a8a2','#a0bfd3','#c9ab78','#b4a3c6','#cc9d9d','#8b9aab'];const modelColors=new Map([...new Set(history?.daily.flatMap(r=>r.models.map(m=>m.name))??[])].sort().map((name,i)=>[name,palette[i%palette.length]]));for(const model of ranked){if(item.tokens>0&&model.totalTokens>0){const segment=el('i');segment.style.width=model.totalTokens/historicalScale*100+'%';segment.style.background=modelColors.get(model.name);segment.title=model.name+' · '+model.totalTokens.toLocaleString('zh-CN')+' Token';track.append(segment);}}}
 const note=el('small',fixed?'历史快照 · 日期范围未核实 · 不随筛选变化':item.tokens===null?'所选范围无记录，不代表 0':'所选范围 · 按模型 Token 分布','usage-tool-note');row.append(icon,name,track,value,note);rows.append(row);
 detail.append(el('p',names[s.source]+'：'+(s.source==='codex'&&history?'已接入历史本地汇总；请求数、会话数暂缺。':s.verified?`覆盖 ${s.coverageStart}—${s.coverageEnd}，${s.timeZone}，导入 ${s.updatedAt}。`:'当前行展示固定历史快照；缺少分源日期和输入/输出/缓存分项，不纳入筛选总量。')));
 if(s.source==='codex'&&history){detail.append(el('p',`历史本地汇总：${history.coverageStart}—${history.coverageEnd}，共 ${history.daily.length} 个记录日。原导出未记录时区与 ccusage 版本；仅复核日汇总算术，未审计源日志或账户完整性。`));detail.append(el('p','当前范围：'+[['inputTokens','未缓存输入'],['outputTokens','输出（含推理）'],['cacheReadTokens','缓存读'],['cacheCreationTokens','缓存写'],['reasoningOutputTokens','其中推理（不重复相加）']].map(([k,label])=>label+' '+(historical.totals[k]?.toLocaleString('zh-CN')??'—')).join(' / ')));}
 if(s.verified)detail.append(el('p',metrics.map((k,i)=>['调用次数','未缓存输入','输出','缓存读','缓存写'][i]+': '+(sums[k]??'—')).join(' / ')));
 }
 };
 [['year','年'],['month','月'],['day','日']].forEach(([v,label])=>{const b=el('button',label);b.type='button';b.dataset.mode=v;b.title={year:'今年至今',month:'本月至今',day:'今日'}[v];b.addEventListener('click',()=>{mode=v;render();});controls.append(b);buttons.push(b);});render();
 }catch{root.textContent='聚合数据未通过校验，暂不展示统计。';}
}
