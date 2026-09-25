import {traceCourtListener,buildAuthorityFromInput} from './courtlistener.mjs';
import {RELATIONSHIP_STATE} from './domain.mjs';

const confirmedStates=new Set([RELATIONSHIP_STATE.CONFIRMED_CITATION,RELATIONSHIP_STATE.CONFIRMED_QUOTE]);

export async function traceIncidentDependencies(dependencies,token,{maxCandidatesPerDependency=10,traceFn=traceCourtListener,firecrawlKey=process.env.FIRECRAWL_API_KEY||'',signal,onProgress}={}){
  const statuses=[];const documents=new Map();const relationships=[];
  const diagnostics={courtlistenerRequests:0,firecrawlRequests:0,cacheHits:0,documentsHydrated:0,searchPassesUsed:0};

  for(let index=0;index<dependencies.length;index++){
    if(signal?.aborted)break;
    const dependency=dependencies[index];
    const input=dependency.canonicalCitation||dependency.rawText||dependency.quotation||'';
    const isCanonical=Boolean(buildAuthorityFromInput(input));
    statuses.push({dependencyId:dependency.id,state:'searching'});
    onProgress?.({index,total:dependencies.length,dependencyId:dependency.id,state:'searching'});

    const result=await traceFn({
      input,
      quote:dependency.dependencyType==='QUOTATION'?(dependency.quotation||dependency.rawText||''):'',
      exactTextDependency:dependency.dependencyType==='AUTHORITY'&&!isCanonical?input:'',
      maxCandidates:maxCandidatesPerDependency,
      signal
    },token,{firecrawlKey});

    const status=statuses[statuses.length-1];
    if(!result.ok){
      status.state=result.state==='RATE_LIMITED'?'rate_limited':'source_unavailable';
      status.retryAfterMs=result.retryAfterMs||null;
      onProgress?.({index,total:dependencies.length,dependencyId:dependency.id,state:status.state});
      if(result.state==='RATE_LIMITED')break;
      continue;
    }

    for(const key of Object.keys(diagnostics)) diagnostics[key]+=Number(result.diagnostics?.[key]||0);
    let confirmedForDependency=0;
    for(const document of result.documents||[]){
      documents.set(String(document.id),document);
      const rels=Array.isArray(document.relationships)&&document.relationships.length?document.relationships:[document.classification?{classification:document.classification,evidence:document.evidence}:null].filter(Boolean);
      for(const rel of rels){
        if(rel.classification===RELATIONSHIP_STATE.NOT_RELATED)continue;
        relationships.push({
          id:`${dependency.id}:${document.id}:${rel.classification}`,
          dependencyId:dependency.id,
          filingId:String(document.id),
          state:rel.classification,
          evidence:rel.evidence||null,
          publicSourceUrl:document.documentUrl||document.sourceUrl||null
        });
        if(confirmedStates.has(rel.classification))confirmedForDependency++;
      }
    }
    status.state='complete';status.checked=result.summary?.checkedCount||0;status.confirmed=confirmedForDependency;
    onProgress?.({index,total:dependencies.length,dependencyId:dependency.id,state:'complete',checked:status.checked,confirmed:confirmedForDependency});
  }

  const docs=[...documents.values()];
  const confirmedRelationships=relationships.filter(item=>confirmedStates.has(item.state));
  const confirmedFilingIds=new Set(confirmedRelationships.map(item=>item.filingId));
  const confirmedDocs=docs.filter(doc=>confirmedFilingIds.has(String(doc.id)));
  const docketIds=new Set(confirmedDocs.map(doc=>doc.docketId||doc.docketNumber).filter(Boolean));
  const courts=new Set(confirmedDocs.map(doc=>doc.court).filter(Boolean));

  return {
    ok:!statuses.some(status=>status.state==='rate_limited'),
    statuses,
    documents:docs,
    relationships,
    summary:{
      dependenciesTotal:dependencies.length,
      dependenciesTraced:statuses.filter(status=>status.state==='complete').length,
      confirmedAffectedFilings:confirmedFilingIds.size,
      confirmedRelationships:confirmedRelationships.length,
      possibleRelationships:relationships.filter(item=>item.state===RELATIONSHIP_STATE.POSSIBLE).length,
      candidateUnconfirmed:statuses.reduce((sum,status)=>sum+Math.max(0,(status.checked||0)-(status.confirmed||0)),0),
      uniqueDockets:docketIds.size,
      courts:[...courts]
    },
    diagnostics
  };
}
