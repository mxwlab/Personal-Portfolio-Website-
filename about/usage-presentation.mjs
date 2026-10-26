import {recordedSummary,modelSummary} from './usage-history.mjs';
import {range} from './usage-core.mjs';
// Pure statistical snapshots from the existing legacy export; not period totals.
export const snapshots=Object.freeze({'claude-code':1305416372,'deepseek-harness':234207819});
export function overview(history,mode,today){
 const [start,end]=range(mode,today),recorded=history?recordedSummary(history,start,end):null;
 const daily=history?.daily.filter(r=>r.date>=start&&r.date<=end)??[];
 return {start,end,recorded,historicalTotalTokens:history?history.totals.totalTokens+Object.values(snapshots).reduce((a,b)=>a+b,0):null,knownActiveDays:history?new Set(history.daily.filter(r=>r.totalTokens>0).map(r=>r.date)).size:null,activeDays:daily.length?daily.filter(r=>r.totalTokens>0).length:null,models:history?modelSummary(history,start,end):[],tools:[{source:'codex',tokens:recorded?.totals.totalTokens??null,kind:'selected-period'},{source:'claude-code',tokens:snapshots['claude-code'],kind:'fixed-snapshot'},{source:'deepseek-harness',tokens:snapshots['deepseek-harness'],kind:'fixed-snapshot'}]};
}
