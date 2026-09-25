import {readFile,writeFile} from 'node:fs/promises';
import {traceCourtListener} from '../lib/courtlistener.mjs';

const token=process.env.COURTLISTENER_TOKEN;
if(!token){
  console.log('LIVE PUBLIC CORPUS BENCHMARK: SKIPPED — COURTLISTENER_TOKEN is not configured.');
  process.exit(0);
}
const authorities=JSON.parse(await readFile(new URL('./live-authorities.json',import.meta.url),'utf8'));
const results=[];
for(const authority of authorities){
  const trace=await traceCourtListener({input:authority.citation,maxCandidates:20},token);
  results.push({
    citation:authority.citation,name:authority.name,ok:Boolean(trace.ok),
    sourceState:trace.sourceState||trace.state,
    checked:trace.summary?.checkedCount??0,
    confirmed:trace.summary?.confirmedFilingCount??0,
    candidates:trace.summary?.candidateUnconfirmedCount??0,
    sourceUrls:(trace.documents||[]).map(d=>d.documentUrl||d.sourceUrl).filter(Boolean),
    coverage:trace.coverage||null,
    retrievedAt:trace.retrievedAt||null,
    requestBudget:trace.diagnostics?{courtlistenerRequests:trace.diagnostics.courtlistenerRequests,firecrawlRequests:trace.diagnostics.firecrawlRequests,cacheHits:trace.diagnostics.cacheHits,documentsHydrated:trace.diagnostics.documentsHydrated,searchPassesUsed:trace.diagnostics.searchPassesUsed}:null
  });
}
const successes=results.filter(r=>r.ok).length;
const checked=results.reduce((n,r)=>n+r.checked,0);
const confirmed=results.reduce((n,r)=>n+r.confirmed,0);
const output={generatedAt:new Date().toISOString(),authorityCount:results.length,traceSuccessRate:successes/results.length,checked,confirmed,candidateToConfirmedConversion:checked?confirmed/checked:null,results};
await writeFile(new URL('./live-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
