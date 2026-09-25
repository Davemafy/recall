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

export function confirmPublicCandidate(candidate, incident){
  const text=stripHtml(candidate?.snippet||'');
  if(!text) return {classification:'CANDIDATE_UNCONFIRMED',reason:'No filing text/snippet available for independent confirmation',evidence:null};
  if(incident?.canonicalId){
    const cites=extractCitations(text).filter(c=>c.canonicalId===incident.canonicalId);
    if(cites.length){
      const c=cites[0];
      return {classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:c.raw,canonical:c.canonicalId,rule:'reporter-volume-first_page match',sourceText:c.surrounding||text}};
    }
    const short=incidentShortCitationOccurrences(text,incident);
    if(short.length) return {classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:short[0].raw,canonical:incident.canonicalId,rule:short[0].rule,sourceText:text}};
  }
  if(incident?.quote){
    const quotes=extractQuotes(text);
    let best={score:0,raw:''};
    for(const q of quotes){const score=quoteSimilarity(q.raw,incident.quote);if(score>best.score)best={score,raw:q.raw}}
    const whole=quoteSimilarity(text,incident.quote); if(whole>best.score)best={score:whole,raw:text};
    if(best.score>=0.82) return {classification:'CONFIRMED_QUOTE_REUSE',evidence:{raw:best.raw,score:best.score,rule:'normalized quote overlap >= 0.82',sourceText:text}};
  }
  if(incident?.proposition){
    const props=extractPropositions(text);
    const best=props.map(p=>({raw:p,score:jaccard(p,incident.proposition)})).sort((a,b)=>b.score-a.score)[0];
    if(best?.score>=0.33) return {classification:'POSSIBLE_DERIVED_CLAIM',evidence:{raw:best.raw,score:best.score,rule:'lexical semantic review threshold',sourceText:text}};
  }
  return {classification:'CANDIDATE_UNCONFIRMED',reason:'Search hit did not contain deterministic incident evidence in available text',evidence:null};
}

export function normalizeTraceDocuments(searchDocs,incident,query,retrievedAt){
  return searchDocs.map(doc=>{
    const classification=confirmPublicCandidate(doc,incident);
    const hash=createHash('sha256').update(doc.snippet||'').digest('hex');
    return {...doc,...classification,searchQuery:query,retrievedAt,contentHash:hash,sourceType:'COURTLISTENER_RECAP'};
  });
}

export function summarizePublicTrace(documents,checkedCount,totalResultCount=null){
  const confirmed=documents.filter(d=>d.classification==='CONFIRMED_CITATION_DEPENDENCY'||d.classification==='CONFIRMED_QUOTE_REUSE');
  const citation=documents.filter(d=>d.classification==='CONFIRMED_CITATION_DEPENDENCY');
  const quotes=documents.filter(d=>d.classification==='CONFIRMED_QUOTE_REUSE');
  const possible=documents.filter(d=>d.classification==='POSSIBLE_DERIVED_CLAIM');
  const candidates=documents.filter(d=>d.classification==='CANDIDATE_UNCONFIRMED');
  const dockets=new Set(confirmed.map(d=>d.docketId||d.docketNumber).filter(Boolean));
  const courts=new Set(confirmed.map(d=>d.court).filter(Boolean));
  const dates=confirmed.map(d=>d.filingDate).filter(Boolean).sort();
  return {
    checkedCount,totalResultCount,
    confirmedFilingCount:new Set(confirmed.map(d=>d.id)).size,
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
  const resolvedName=first(row?.case_name,row?.caseName,row?.cluster?.case_name,row?.cluster?.caseName);
  const sourceUrl=safeSourceUrl(first(row?.absolute_url,row?.url,row?.cluster?.absolute_url));
  return {status:row?'RESOLVED':'UNRESOLVED',authority:{...authority,caseName:resolvedName||authority.caseName||'',sourceUrl,court:first(row?.court,row?.court_citation_string),date:first(row?.date_filed,row?.dateFiled)},raw:row};
}

export async function searchCourtListener(query,token,type='r'){
  const url=new URL(`${COURTLISTENER_BASE}search/`);
  url.searchParams.set('q',query); url.searchParams.set('type',type); url.searchParams.set('highlight','on');
  return courtListenerFetch(url.toString(),token);
}

export async function traceCourtListener({input,quote='',maxCandidates=50},token){
  const parsedAuthority=buildAuthorityFromInput(input);
  const resolved=parsedAuthority?await resolveAuthorityWithCourtListener(parsedAuthority,token):{status:'UNRESOLVED',authority:null};
  const authority=resolved.authority;
  const incident={...authority,quote:quote||'',proposition:quote||'',canonicalId:authority?.canonicalId||null};
  if(!authority&&!quote) return {ok:false,state:'INVALID_INPUT',message:'Enter a supported citation or a quotation.'};
  const passes=buildSearchPasses({authority,quote,caseName:authority?.caseName});
  const cacheKey=createHash('sha256').update(JSON.stringify({passes,maxCandidates})).digest('hex');
  const cached=getCachedTrace(cacheKey);
  if(cached) return {...cached,sourceState:'CACHED',checkedAt:cached.retrievedAt};

  const all=[]; const seen=new Set(); const sourceQueries=[]; let approximateTotal=0; let hasMore=false;
  const retrievedAt=new Date().toISOString();
  for(const pass of passes){
    if(all.length>=maxCandidates) break;
    const docketSearch=await searchCourtListener(pass.q,token,'r');
    if(!docketSearch.ok) return {ok:false,state:docketSearch.state,statusCode:docketSearch.status,message:docketSearch.state==='AUTH_ERROR'?'CourtListener authentication failed.':docketSearch.state==='RATE_LIMITED'?'CourtListener rate limit reached.':'CourtListener is temporarily unavailable.'};
    const docSearch=await searchCourtListener(pass.q,token,'rd');
    if(!docSearch.ok) return {ok:false,state:docSearch.state,statusCode:docSearch.status,message:'CourtListener filing search could not complete.'};
    approximateTotal=Math.max(approximateTotal,Number(docketSearch.data?.count||0),Number(docSearch.data?.count||0));
    hasMore=hasMore||Boolean(docketSearch.data?.next||docSearch.data?.next);
    sourceQueries.push({label:pass.label,query:pass.q,type:'r',count:docketSearch.data?.count??null},{label:pass.label,query:pass.q,type:'rd',count:docSearch.data?.count??null});
    const docketMetadata=extractDocketMetadata(docketSearch.data);
    const docs=[...extractDocumentsFromSearchPayload(docketSearch.data,'r',docketMetadata),...extractDocumentsFromSearchPayload(docSearch.data,'rd',docketMetadata)];
    const normalized=normalizeTraceDocuments(docs,incident,pass.q,retrievedAt);
    for(const doc of normalized){
      const key=`${doc.docketId||''}:${doc.courtListenerId||doc.id}:${doc.documentNumber||''}`;
      if(!seen.has(key)&&all.length<maxCandidates){seen.add(key);all.push(doc)}
    }
  }
  const summary=summarizePublicTrace(all,all.length,approximateTotal||null);
  const value={ok:true,sourceState:'LIVE',retrievedAt,authorityResolution:resolved.status,authority,documents:all,summary,sourceQueries,coverage:{checked:all.length,approximateMatches:approximateTotal||null,bounded:hasMore||approximateTotal>all.length,maxCandidates,language:`${summary.confirmedFilingCount} confirmed in ${all.length} filing candidates checked`}};
  setCachedTrace(cacheKey,value);
  return value;
}
