// Daily aggregate inputs only. No collection, network or session access.
const fields=['inputTokens','outputTokens','cacheReadTokens','cacheCreationTokens'];
export function validateClaude(data){
 if(data.source!=='claude-code'||data.timeZone!==null||!Array.isArray(data.daily))throw Error('Invalid Claude aggregate');
 const days=new Map();
 for(const r of data.daily){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||new Date(r.date+'T00:00:00Z').toISOString().slice(0,10)!==r.date)throw Error('Invalid date');
  if([...fields,'totalTokens'].some(k=>!Number.isSafeInteger(r[k])||r[k]<0)||fields.reduce((n,k)=>n+r[k],0)!==r.totalTokens)throw Error('Invalid tokens');
  const old=days.get(r.date);
  if(old&&[...fields,'totalTokens'].some(k=>old[k]!==r[k]))throw Error('Conflicting duplicate day');
  days.set(r.date,r);
 }
 const daily=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
 if(daily.reduce((n,r)=>n+r.totalTokens,0)!==data.totalTokens)throw Error('Total mismatch');
 return {...data,daily};
}
export function combineDays(codex=[],claude=[]){
 const days=new Map();
 for(const [source,records] of [['codex',codex],['claude-code',claude]])for(const r of records){
  const day=days.get(r.date)??{date:r.date,sources:{}};
  if(Object.hasOwn(day.sources,source)&&day.sources[source]!==r.totalTokens)throw Error('Conflicting source day');
  day.sources[source]=r.totalTokens;day.totalTokens=Object.values(day.sources).reduce((a,b)=>a+b,0);days.set(r.date,day);
 }
 return days;
}
