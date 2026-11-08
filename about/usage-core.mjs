export const names={'codex':'Codex','claude-code':'Claude Code','deepseek-harness':'DeepSeek Harness'};
export const metrics=['calls','inputTokensUncached','outputTokens','cacheReadTokens','cacheWriteTokens'];
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k))&&keys.every(k=>k in o);
export function validate(d){
 if(!exact(d,['schemaVersion','sources'])||d.schemaVersion!==2||!Array.isArray(d.sources)||d.sources.length!==3)throw Error('Invalid aggregate envelope');
 const seen=new Set();
 for(const s of d.sources){
  if(!exact(s,['source','status','verified','semantics','timeZone','coverageStart','coverageEnd','updatedAt','daily'])||!names[s.source]||seen.has(s.source))throw Error('Invalid source');seen.add(s.source);
  if(!['pending','unavailable','needs-review','connected'].includes(s.status)||typeof s.verified!=='boolean'||!Array.isArray(s.daily))throw Error('Invalid status');
  if(!s.verified){if(s.status==='connected'||s.daily.length||[s.semantics,s.timeZone,s.coverageStart,s.coverageEnd,s.updatedAt].some(x=>x!==null))throw Error('Unverified data must remain empty');continue;}
  if(s.status!=='connected'||s.semantics!=='disjoint-tokens-v1'||!day(s.coverageStart)||!day(s.coverageEnd)||s.coverageEnd<s.coverageStart||typeof s.updatedAt!=='string'||!/(Z|[+-]\d\d:\d\d)$/.test(s.updatedAt)||isNaN(Date.parse(s.updatedAt)))throw Error('Missing provenance');
  try{new Intl.DateTimeFormat('en',{timeZone:s.timeZone}).format();if(typeof s.timeZone!=='string')throw Error();}catch{throw Error('Invalid timezone');}
  const dates=new Set();for(const r of s.daily){if(!exact(r,['date',...metrics])||!day(r.date)||r.date<s.coverageStart||r.date>s.coverageEnd||dates.has(r.date))throw Error('Invalid daily date');dates.add(r.date);for(const k of metrics)if(r[k]!==null&&(!Number.isSafeInteger(r[k])||r[k]<0))throw Error('Invalid count');}
 }
 return d;
}
export function range(mode,today=new Date().toISOString().slice(0,10)){
 if(!['year','month','day','30','90'].includes(mode)||!day(today))throw Error('Invalid range');const end=new Date(today+'T00:00:00Z');let start=new Date(end);if(mode==='year')start=new Date(today.slice(0,4)+'-01-01T00:00:00Z');else if(mode==='month')start=new Date(today.slice(0,7)+'-01T00:00:00Z');else if(mode==='day')start=new Date(end);else start.setUTCDate(start.getUTCDate()-Number(mode)+1);return [start.toISOString().slice(0,10),today];
}
export function summarize(source,start,end){
 const rows=new Map(source.daily.map(r=>[r.date,r]));const out=Object.fromEntries(metrics.map(k=>[k,null]));if(!source.verified)return out;
 for(const k of metrics){let n=0,complete=true;for(let d=new Date(start+'T00:00:00Z');d<=new Date(end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1)){const r=rows.get(d.toISOString().slice(0,10));if(!r||r[k]===null){complete=false;break;}n+=r[k];if(!Number.isSafeInteger(n)){complete=false;break;}}out[k]=complete?n:null;}return out;
}
