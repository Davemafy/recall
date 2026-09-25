import {createHash} from 'node:crypto';
import {extractCitations, extractQuotes, quoteSimilarity, extractPropositions, jaccard, normalizeReporter} from './recall-core.mjs';

export const COURTLISTENER_BASE='https://www.courtlistener.com/api/rest/v4/';
export const ALLOWED_SOURCE_HOSTS=new Set(['www.courtlistener.com','courtlistener.com','storage.courtlistener.com']);

export function stripHtml(value=''){
  return String(value).replace(/<mark>/gi,'').replace(/<\/mark>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
}

export function safeSourceUrl(value){
  if(!value) return null;
  try{
    const url=new URL(value,'https://www.courtlistener.com');
    if(url.protocol!=='https:' || !ALLOWED_SOURCE_HOSTS.has(url.hostname)) return null;
    return url.toString();
  }catch{return null;}
}

export function classifyCourtListenerStatus(status){
  if(status===401||status===403) return 'AUTH_ERROR';
  if(status===429) return 'RATE_LIMITED';
  if(status>=500) return 'SOURCE_UNAVAILABLE';
  if(status>=400) return 'SOURCE_ERROR';
  return 'OK';
}

export function buildAuthorityFromInput(input=''){
  const parsed=extractCitations(String(input));
  if(!parsed.length) return null;
  const c=parsed[0];
  return {
    canonicalId:c.canonicalId,
    canonicalCitation:`${c.volume} ${c.reporter} ${c.firstPage}`,
    citation:`${c.volume} ${c.reporter} ${c.firstPage}`,
    caseName:c.caseName||'',
    volume:c.volume,
    reporter:c.reporter,
    firstPage:c.firstPage,
    pin:c.pin||null
  };
}

export function buildSearchPasses({authority,quote,caseName}){
  const passes=[]; const seen=new Set();
  const add=(label,q)=>{q=String(q||'').trim();if(q&&!seen.has(q)){seen.add(q);passes.push({label,q})}};
  if(authority?.canonicalCitation){
    add('exact-citation',`"${authority.canonicalCitation}"`);
    add('citation-variant',authority.canonicalCitation);
    const resolvedName=(caseName||authority.caseName||'').trim();
    if(resolvedName){
      const short=resolvedName.split(/\sv\.\s/i)[0].trim();
      if(short) add('case-and-reporter',`"${short}" AND "${authority.volume} ${authority.reporter}"`);
    }
  }
  if(quote){
    const clean=stripHtml(quote).replace(/^["“]|["”]$/g,'').trim();
    if(clean){
      const words=clean.split(/\s+/);
      add('exact-quote',`"${words.slice(0,Math.min(16,words.length)).join(' ')}"`);
    }
  }
  return passes;
}

function first(...values){return values.find(v=>v!==undefined&&v!==null&&v!=='')??null}

export function normalizeSearchDocument(raw={}, parent={}){
  const sourceUrl=safeSourceUrl(first(raw.absolute_url,raw.absoluteUrl,raw.url,raw.resource_uri,parent.absolute_url,parent.absoluteUrl,parent.url));
  const documentUrl=safeSourceUrl(first(raw.download_url,raw.downloadUrl,raw.file_url,raw.fileUrl,raw.pdf_url,raw.pdfUrl));
  const snippet=stripHtml(first(raw.snippet,raw.plain_text,raw.plainText,raw.text,raw.description,'')||'');
  const id=String(first(raw.id,raw.pk,raw.document_id,raw.documentId,`${first(raw.docket_id,parent.id,'unknown')}:${first(raw.document_number,raw.documentNumber,'doc')}`));
  return {
    id,
    courtListenerId:first(raw.id,raw.pk,raw.document_id,raw.documentId),
    docketId:first(raw.docket_id,raw.docketId,parent.id,parent.docket_id,parent.docketId),
    docketNumber:first(raw.docketNumber,raw.docket_number,parent.docketNumber,parent.docket_number),
    caseName:first(raw.caseName,raw.case_name,parent.caseName,parent.case_name),
    court:first(raw.court_citation_string,raw.courtCitationString,raw.court,parent.court_citation_string,parent.courtCitationString,parent.court),
    title:first(raw.description,raw.short_description,raw.shortDescription,raw.document_title,raw.documentTitle,`Filing ${first(raw.document_number,raw.documentNumber,'')}`),
    filingDate:first(raw.dateFiled,raw.date_filed,raw.entry_date_filed,raw.entryDateFiled,parent.dateFiled,parent.date_filed),
    documentNumber:first(raw.document_number,raw.documentNumber),
    sourceUrl,
    documentUrl,
    snippet,
    rawHasText:Boolean(first(raw.snippet,raw.plain_text,raw.plainText,raw.text)),
    moreDocs:Boolean(first(raw.more_docs,raw.moreDocs,parent.more_docs,parent.moreDocs,false))
  };
}

export function extractDocketMetadata(payload){
  const map=new Map();
  const results=Array.isArray(payload?.results)?payload.results:[];
  for(const result of results){
    const id=first(result.id,result.docket_id,result.docketId);
    if(id!==null) map.set(String(id),{
      docketId:id,
      docketNumber:first(result.docketNumber,result.docket_number),
      caseName:first(result.caseName,result.case_name),
      court:first(result.court_citation_string,result.courtCitationString,result.court),
      sourceUrl:safeSourceUrl(first(result.absolute_url,result.absoluteUrl,result.url))
    });
  }
  return map;
}

export function extractDocumentsFromSearchPayload(payload,type='rd',docketMetadata=new Map()){
  const out=[]; const seen=new Set();
  const push=(raw,parent={})=>{
    if(!raw||typeof raw!=='object') return;
    let doc=normalizeSearchDocument(raw,parent);
    const meta=docketMetadata.get(String(doc.docketId||'')); 
    if(meta) doc={...doc,docketNumber:doc.docketNumber||meta.docketNumber,caseName:doc.caseName||meta.caseName,court:doc.court||meta.court,sourceUrl:doc.sourceUrl||meta.sourceUrl};
    const key=`${doc.docketId||''}:${doc.courtListenerId||doc.id}:${doc.documentNumber||''}`;
    if(!seen.has(key)){seen.add(key);out.push(doc)}
  };
  const results=Array.isArray(payload?.results)?payload.results:[];
  for(const result of results){
    const nested=first(result.recap_documents,result.recapDocuments,result.documents,result.entries);
    if(Array.isArray(nested)&&nested.length) nested.forEach(doc=>push(doc,result));
    else if(type==='rd') push(result,{});
  }
  return out;
}

const escapeRegex=(s)=>String(s).replace(/[|\\{}()[\]^$+*?.-]/g,'\\$&');

export function incidentShortCitationOccurrences(text, authority){
  if(!authority?.volume||!authority?.reporter||!authority?.caseName) return [];
  const reporter=escapeRegex(normalizeReporter(authority.reporter)).replace(/\\ /g,'\\s+');
  const surname=authority.caseName.split(/\sv\.\s/i)[0].trim().split(/\s+/).pop();
  if(!surname||surname.length<3) return [];
  const re=new RegExp(`\\b${escapeRegex(surname)}\\b[^.]{0,90}?\\b${authority.volume}\\s+${reporter}\\s+at\\s+(\\d{1,5})`,'gi');
  const out=[]; let m;
  while((m=re.exec(text))) out.push({raw:m[0],pin:Number(m[1]),start:m.index,end:re.lastIndex,rule:'case-name + reporter-volume short-form match'});
  return out;
}

export function classifyPublicCandidateRelationships(candidate, incident){
  const text=stripHtml(candidate?.fullText||candidate?.snippet||'');
  if(!text) return [];
  const relationships=[];
  const confirmationSource=candidate?.fullText?'RECAP_PLAIN_TEXT':'SEARCH_SNIPPET';
  let criticalOnly=false;

  if(incident?.canonicalId){
    const incidentCites=extractCitations(text).filter(c=>c.canonicalId===incident.canonicalId);
    const cites=incidentCites.filter(c=>!c.critical);
    for(const cite of cites){
      relationships.push({
        classification:'CONFIRMED_CITATION_DEPENDENCY',
        evidence:{raw: cite.raw, canonical: cite.canonicalId, rule:'reporter-volume-first_page match', sourceText:cite.surrounding||text, confirmationSource}
      });
    }
    if(!cites.length && incidentCites.length) criticalOnly=true;

    if(!incidentCites.length){
      const short=incidentShortCitationOccurrences(text,incident);
      for(const occurrence of short){
        relationships.push({
          classification:'CONFIRMED_CITATION_DEPENDENCY',
          evidence:{raw:occurrence.raw,canonical:incident.canonicalId,rule:occurrence.rule,sourceText:text,confirmationSource}
        });
      }
    }
  }

  if(incident?.quote && !criticalOnly){
    const quoteCandidates=extractQuotes(text);
    const matches=[];
    for(const q of quoteCandidates){
      const score=quoteSimilarity(q.raw,incident.quote);
      if(score>=0.82) matches.push({raw:q.raw,score});
    }
    if(!matches.length){
      const whole=quoteSimilarity(text,incident.quote);
      if(whole>=0.82) matches.push({raw:text,score:whole});
    }
    if(matches.length){
      const best=matches.sort((a,b)=>b.score-a.score)[0];
      relationships.push({
        classification:'CONFIRMED_QUOTE_REUSE',
        evidence:{raw:best.raw,score:best.score,rule:'normalized quote overlap >= 0.82',sourceText:text,confirmationSource}
      });
    }
  }

  const hasConfirmed=relationships.some(r=>String(r.classification).startsWith('CONFIRMED_'));
  if(incident?.proposition && !criticalOnly){
    const props=extractPropositions(text);
    const best=props.map(p=>({raw:p,score:jaccard(p,incident.proposition)})).sort((a,b)=>b.score-a.score)[0];
    if(best?.score>=0.33 && !hasConfirmed){
      relationships.push({classification:'POSSIBLE_DERIVED_CLAIM',evidence:{raw:best.raw,score:best.score,rule:'lexical semantic review threshold',sourceText:text}});
    }
  }

  if(criticalOnly && !relationships.length){
    return [{classification:'NOT_RELATED',reason:'The available context discusses the incident authority critically rather than relying on it.',evidence:{raw:extractCitations(text).find(c=>c.canonicalId===incident.canonicalId)?.raw||'',rule:'critical-discussion exclusion',sourceText:text}}];
  }
  return relationships;
}

export function confirmPublicCandidate(candidate, incident){
  const text=stripHtml(candidate?.fullText||candidate?.snippet||'');
  if(!text) return {classification:'CANDIDATE_UNCONFIRMED',reason:'No filing text/snippet available for independent confirmation',evidence:null,relationships:[]};
  const relationships=classifyPublicCandidateRelationships(candidate,incident);
  const primary=
    relationships.find(r=>r.classification==='CONFIRMED_CITATION_DEPENDENCY')||
    relationships.find(r=>r.classification==='CONFIRMED_QUOTE_REUSE')||
    relationships.find(r=>r.classification==='POSSIBLE_DERIVED_CLAIM')||
    relationships.find(r=>r.classification==='NOT_RELATED');
  if(primary) return {...primary,relationships};
  return {classification:'CANDIDATE_UNCONFIRMED',reason:'Search hit did not contain deterministic incident evidence in available text',evidence:null,relationships:[]};
}

export function normalizeTraceDocuments(searchDocs,incident,query,retrievedAt){
  return searchDocs.map(doc=>{
    const classification=confirmPublicCandidate(doc,incident);
    const hash=createHash('sha256').update(doc.fullText||doc.snippet||'').digest('hex');
    return {...doc,...classification,searchQuery:query,retrievedAt,contentHash:hash,sourceType:'COURTLISTENER_RECAP'};
  });
}

export function summarizePublicTrace(documents,checkedCount,totalResultCount=null){
  const relationships=documents.flatMap(d=>{
    const rels=Array.isArray(d.relationships)&&d.relationships.length?d.relationships:[d.classification?{classification:d.classification,evidence:d.evidence}:null].filter(Boolean);
    return rels.map(r=>({...r,documentId:d.id}));
  });
  const confirmedDocIds=new Set(relationships.filter(r=>r.classification==='CONFIRMED_CITATION_DEPENDENCY'||r.classification==='CONFIRMED_QUOTE_REUSE').map(r=>r.documentId));
  const confirmed=documents.filter(d=>confirmedDocIds.has(d.id));
  const citation=relationships.filter(r=>r.classification==='CONFIRMED_CITATION_DEPENDENCY');
  const quotes=relationships.filter(r=>r.classification==='CONFIRMED_QUOTE_REUSE');
  const possible=relationships.filter(r=>r.classification==='POSSIBLE_DERIVED_CLAIM');
  const candidates=documents.filter(d=>!confirmedDocIds.has(d.id)&&d.classification==='CANDIDATE_UNCONFIRMED');
  const dockets=new Set(confirmed.map(d=>d.docketId||d.docketNumber).filter(Boolean));
  const courts=new Set(confirmed.map(d=>d.court).filter(Boolean));
  const dates=confirmed.map(d=>d.filingDate).filter(Boolean).sort();
  return {
    checkedCount,totalResultCount,
    confirmedFilingCount:confirmedDocIds.size,
    confirmedCitationCount:citation.length,confirmedQuoteReuseCount:quotes.length,
    candidateUnconfirmedCount:candidates.length,possibleRelatedClaimCount:possible.length,
    uniqueDockets:dockets.size,courts:[...courts],
    earliestConfirmedFilingDate:dates[0]||null,latestConfirmedFilingDate:dates.at(-1)||null
  };
}

const memoryCache=new Map();
export function getCachedTrace(key){
  const hit=memoryCache.get(key);
  if(!hit) return null;
  if(Date.now()-hit.savedAt>10*60*1000){memoryCache.delete(key);return null}
  return hit.value;
}
export function setCachedTrace(key,value){memoryCache.set(key,{savedAt:Date.now(),value})}

async function courtListenerFetch(url,token,{method='GET',body=null}={}){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),9000);
  try{
    const response=await fetch(url,{method,headers:{Authorization:`Token ${token}`,'User-Agent':'RECALL-LexHack/2.0',...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body,signal:controller.signal,cache:'no-store',redirect:'error'});
    const state=classifyCourtListenerStatus(response.status);
    let data=null; try{data=await response.json()}catch{}
    if(state!=='OK') return {ok:false,state,status:response.status,data};
    return {ok:true,state,status:response.status,data};
  }catch(error){return {ok:false,state:'SOURCE_UNAVAILABLE',status:0,data:null,error:error instanceof Error?error.message:'request failed'}}
  finally{clearTimeout(timer)}
}

export async function resolveAuthorityWithCourtListener(authority,token){
  if(!authority?.canonicalCitation) return {status:'UNRESOLVED',authority};
  const result=await courtListenerFetch(`${COURTLISTENER_BASE}citation-lookup/`,token,{method:'POST',body:new URLSearchParams({text:authority.canonicalCitation}).toString()});
  if(!result.ok) return {status:'UNRESOLVED',authority,sourceState:result.state,statusCode:result.status};
  const rows=Array.isArray(result.data)?result.data:[];
  const row=rows[0]||null;
  const cluster=Array.isArray(row?.clusters)?row.clusters[0]:null;
  const resolved=Boolean(row && Number(row.status)===200 && cluster);
  if(!resolved) return {status:'UNRESOLVED',authority,raw:row,sourceState:'OK'};
  const resolvedName=first(cluster.case_name,cluster.caseName,cluster.case_name_full,cluster.caseNameFull);
  const sourceUrl=safeSourceUrl(first(cluster.absolute_url,cluster.absoluteUrl,cluster.url));
  return {
    status:'RESOLVED',
    authority:{
      ...authority,
      caseName:resolvedName||authority.caseName||'',
      sourceUrl,
      court:first(cluster.court,cluster.court_citation_string,cluster.courtCitationString),
      date:first(cluster.date_filed,cluster.dateFiled),
      courtListenerId:first(cluster.id,cluster.pk)
    },
    raw:row
  };
}

export async function searchCourtListener(query,token,type='r'){
  const url=new URL(`${COURTLISTENER_BASE}search/`);
  url.searchParams.set('q',query); url.searchParams.set('type',type); url.searchParams.set('highlight','on');
  return courtListenerFetch(url.toString(),token);
}

export async function searchCourtListenerPages(query,token,type='rd',maxResults=50){
  let url=new URL(`${COURTLISTENER_BASE}search/`);
  url.searchParams.set('q',query); url.searchParams.set('type',type); url.searchParams.set('highlight','on');
  const results=[]; let count=null; let pageCount=0; let next=null;
  while(url && results.length<maxResults && pageCount<5){
    const response=await courtListenerFetch(url.toString(),token);
    if(!response.ok) return {...response,results,count,pageCount,next};
    const data=response.data||{};
    if(count===null && Number.isFinite(Number(data.count))) count=Number(data.count);
    const rows=Array.isArray(data.results)?data.results:[];
    for(const row of rows){ if(results.length<maxResults) results.push(row); }
    next=safeSourceUrl(data.next);
    pageCount++;
    if(!next || results.length>=maxResults) break;
    const nextUrl=new URL(next);
    if(nextUrl.hostname!=='www.courtlistener.com'&&nextUrl.hostname!=='courtlistener.com') break;
    url=nextUrl;
  }
  return {ok:true,state:'OK',status:200,data:{count,next,results},results,count,pageCount,next};
}

export async function fetchRecapDocumentDetail(id,token){
  if(!id) return {ok:false,state:'SOURCE_ERROR',status:400,data:null};
  const url=new URL(`${COURTLISTENER_BASE}recap-documents/${encodeURIComponent(String(id))}/`);
  url.searchParams.set('fields','id,docket_entry,description,document_number,attachment_number,plain_text,filepath_local,is_available,ocr_status');
  return courtListenerFetch(url.toString(),token);
}

export async function fetchDocketDetail(id,token){
  if(!id) return {ok:false,state:'SOURCE_ERROR',status:400,data:null};
  const url=new URL(`${COURTLISTENER_BASE}dockets/${encodeURIComponent(String(id))}/`);
  url.searchParams.set('fields','id,docket_number,case_name,court,date_filed,absolute_url');
  return courtListenerFetch(url.toString(),token);
}

export function sourceUrlFromRecapDetail(detail){
  const path=detail?.filepath_local;
  if(!path) return null;
  return safeSourceUrl(`https://storage.courtlistener.com/${String(path).replace(/^\/+/, '')}`);
}

export async function hydratePublicDocument(doc,token){
  const result={...doc};
  if(doc.courtListenerId){
    const detail=await fetchRecapDocumentDetail(doc.courtListenerId,token);
    if(detail.ok&&detail.data){
      result.fullText=stripHtml(detail.data.plain_text||'');
      result.title=detail.data.description||result.title;
      result.documentNumber=detail.data.document_number??result.documentNumber;
      result.documentUrl=sourceUrlFromRecapDetail(detail.data)||result.documentUrl;
      result.ocrStatus=detail.data.ocr_status??null;
      result.isAvailable=detail.data.is_available??null;
    }
  }
  if(doc.docketId && (!result.docketNumber || !result.caseName || !result.court)){
    const docket=await fetchDocketDetail(doc.docketId,token);
    if(docket.ok&&docket.data){
      result.docketNumber=result.docketNumber||docket.data.docket_number||null;
      result.caseName=result.caseName||docket.data.case_name||null;
      result.court=result.court||docket.data.court||null;
      result.sourceUrl=result.sourceUrl||safeSourceUrl(docket.data.absolute_url);
    }
  }
  return result;
}

export async function traceCourtListener({input,quote='',maxCandidates=50},token){
  const parsedAuthority=buildAuthorityFromInput(input);
  const resolved=parsedAuthority?await resolveAuthorityWithCourtListener(parsedAuthority,token):{status:'UNRESOLVED',authority:null};
  const authority=resolved.authority;
  const rawInput=stripHtml(input||'').trim();
  const effectiveQuote=quote || (!authority && rawInput.length>=28 ? rawInput : '');
  const incident={...authority,quote:effectiveQuote,proposition:effectiveQuote,canonicalId:authority?.canonicalId||null};
  if(!authority&&!effectiveQuote&&!rawInput) return {ok:false,state:'INVALID_INPUT',message:'Enter a supported citation, case query, or quotation.'};
  let passes=buildSearchPasses({authority,quote:effectiveQuote,caseName:authority?.caseName});
  if(!passes.length&&rawInput) passes=[{label:'unresolved-text',q:rawInput}];
  const cacheKey=createHash('sha256').update(JSON.stringify({passes,maxCandidates})).digest('hex');
  const cached=getCachedTrace(cacheKey);
  if(cached) return {...cached,sourceState:'CACHED',checkedAt:cached.retrievedAt};

  const all=[]; const seen=new Set(); const sourceQueries=[]; let approximateTotal=0; let hasMore=false;
  const retrievedAt=new Date().toISOString();
  for(const pass of passes){
    if(all.length>=maxCandidates) break;
    // Search type=rd is the v4 flat PACER filing-document result type.
    // type=r returns dockets with up to three nested matching documents and is used only as metadata context.
    const docSearch=await searchCourtListenerPages(pass.q,token,'rd',Math.max(1,maxCandidates-all.length));
    if(!docSearch.ok) return {ok:false,state:docSearch.state,statusCode:docSearch.status,message:docSearch.state==='AUTH_ERROR'?'CourtListener authentication failed.':docSearch.state==='RATE_LIMITED'?'CourtListener rate limit reached.':'CourtListener filing search could not complete.'};
    const docketSearch=await searchCourtListener(pass.q,token,'r');
    if(!docketSearch.ok) return {ok:false,state:docketSearch.state,statusCode:docketSearch.status,message:'CourtListener docket metadata search could not complete.'};
    approximateTotal=Math.max(approximateTotal,Number(docSearch.data?.count||0),Number(docketSearch.data?.document_count||0),Number(docketSearch.data?.count||0));
    hasMore=hasMore||Boolean(docSearch.data?.next||docketSearch.data?.next);
    sourceQueries.push({label:pass.label,query:pass.q,type:'rd',count:docSearch.data?.count??null},{label:pass.label,query:pass.q,type:'r',count:docketSearch.data?.document_count??docketSearch.data?.count??null});
    const docketMetadata=extractDocketMetadata(docketSearch.data);
    const candidates=extractDocumentsFromSearchPayload(docSearch.data,'rd',docketMetadata);
    const fresh=[];
    for(const candidate of candidates){
      if(all.length+fresh.length>=maxCandidates) break;
      const key=`${candidate.docketId||''}:${candidate.courtListenerId||candidate.id}:${candidate.documentNumber||''}`;
      if(seen.has(key)) continue;
      seen.add(key); fresh.push(candidate);
    }
    const concurrency=5;
    for(let offset=0;offset<fresh.length;offset+=concurrency){
      const batch=fresh.slice(offset,offset+concurrency);
      const hydratedBatch=await Promise.all(batch.map(candidate=>hydratePublicDocument(candidate,token)));
      for(const hydrated of hydratedBatch){
        if(all.length>=maxCandidates) break;
        all.push(normalizeTraceDocuments([hydrated],incident,pass.q,retrievedAt)[0]);
      }
    }
  }
  const summary=summarizePublicTrace(all,all.length,approximateTotal||null);
  const value={ok:true,sourceState:'LIVE',retrievedAt,authorityResolution:resolved.status,authority,documents:all,summary,sourceQueries,coverage:{checked:all.length,approximateMatches:approximateTotal||null,bounded:hasMore||approximateTotal>all.length,maxCandidates,language:`${summary.confirmedFilingCount} confirmed in ${all.length} filing candidates checked`}};
  setCachedTrace(cacheKey,value);
  return value;
}
