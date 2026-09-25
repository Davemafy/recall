import test from 'node:test';
import assert from 'node:assert/strict';
import {traceIncidentDependencies} from '../lib/incident-trace.mjs';

const deps=[
  {id:'a',dependencyType:'AUTHORITY',rawText:'Bad A, 999 F.4th 123',canonicalCitation:'999 F.4th 123'},
  {id:'b',dependencyType:'AUTHORITY',rawText:'Bad B, 998 F.4th 456',canonicalCitation:'998 F.4th 456'}
];

test('incident trace aggregates multiple dependencies without double-counting a filing',async()=>{
  const traceFn=async({input})=>{
    const isA=input.includes('999');
    return {
      ok:true,
      documents:isA?[
        {id:'f1',docketId:'d1',court:'D.D.C.',relationships:[{classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:'999 F.4th 123'}}]},
        {id:'f2',docketId:'d1',court:'D.D.C.',relationships:[{classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:'999 F.4th 123'}}]}
      ]:[
        {id:'f1',docketId:'d1',court:'D.D.C.',relationships:[{classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:'998 F.4th 456'}}]}
      ],
      summary:{checkedCount:isA?2:1},
      diagnostics:{courtlistenerRequests:2,firecrawlRequests:0,cacheHits:0,documentsHydrated:0,searchPassesUsed:1}
    };
  };
  const result=await traceIncidentDependencies(deps,'token',{traceFn});
  assert.equal(result.summary.dependenciesTraced,2);
  assert.equal(result.summary.confirmedRelationships,3);
  assert.equal(result.summary.confirmedAffectedFilings,2);
  assert.equal(result.summary.uniqueDockets,1);
  assert.equal(result.documents.length,2);
  assert.equal(result.diagnostics.courtlistenerRequests,4);
});

test('incident trace stops conservatively on rate limit and preserves partial state',async()=>{
  let calls=0;
  const traceFn=async()=>{
    calls++;
    if(calls===1)return {ok:true,documents:[],summary:{checkedCount:0},diagnostics:{courtlistenerRequests:2,firecrawlRequests:0,cacheHits:0,documentsHydrated:0,searchPassesUsed:1}};
    return {ok:false,state:'RATE_LIMITED',retryAfterMs:30000,diagnostics:{courtlistenerRequests:1}};
  };
  const result=await traceIncidentDependencies(deps,'token',{traceFn});
  assert.equal(result.ok,false);
  assert.equal(result.statuses[0].state,'complete');
  assert.equal(result.statuses[1].state,'rate_limited');
  assert.equal(result.statuses[1].retryAfterMs,30000);
  assert.equal(calls,2);
});

test('semantic-only incident relationship never enters confirmed filing count',async()=>{
  const traceFn=async()=>({
    ok:true,
    documents:[{id:'f1',docketId:'d1',relationships:[{classification:'POSSIBLE_RELATED_PROPOSITION',evidence:{raw:'similar words'}}]}],
    summary:{checkedCount:1},
    diagnostics:{courtlistenerRequests:2,firecrawlRequests:0,cacheHits:0,documentsHydrated:0,searchPassesUsed:1}
  });
  const result=await traceIncidentDependencies([deps[0]],'token',{traceFn});
  assert.equal(result.summary.confirmedAffectedFilings,0);
  assert.equal(result.summary.possibleRelationships,1);
});
