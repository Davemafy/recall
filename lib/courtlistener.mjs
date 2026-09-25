import {createHash,randomUUID} from 'node:crypto';
import {extractCitations,extractQuotes,quoteSimilarity,extractPropositions,jaccard,normalizeReporter,normalizeQuote} from './recall-core.mjs';
import {extractPublicSourceWithFirecrawl} from './firecrawl.mjs';
import {RELATIONSHIP_STATE,SOURCE_STATE,SOURCE_TEXT_TYPE} from './domain.mjs';

export const COURTLISTENER_BASE='https://www.courtlistener.com/api/rest/v4/';
export const ALLOWED_SOURCE_HOSTS=new Set(['www.courtlistener.com','courtlistener.com','storage.courtlistener.com']);
const REQUEST_TIMEOUT_MS=9000;
const MAX_RETRY_WAIT_MS=2500;
const MAX_CONCURRENCY=2;
const CACHE_TTL_MS=10*60*1000;

const traceCache=new Map();
const resolutionCache=new Map();
const searchCache=new Map();
const recapCache=new Map();
const docketCache=new Map();
const extractionCache=new Map();

const nowIso=()=>new Date().toISOString();
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function createTraceDiagnostics(){
  return {
    traceId:randomUUID(),
    startedAt:nowIso(),
    durationMs:0,
    courtlistenerRequests:0,
    firecrawlRequests:0,
    cacheHits:0,
    candidatesFound:0,
    documentsHydrated:0,
    confirmedRelationships:0,
    possibleRelationships:0,
    unconfirmedCandidates:0,
    searchPassesUsed:0,
    maxConcurrency:MAX_CONCURRENCY
  };
}

function cacheRead(cache,key,diagnostics){
  const hit=cache.get(key);
  if(!hit)return null;
  if(Date.now()-hit.savedAt>CACHE_TTL_MS){cache.delete(key);return null}
  if(diagnostics)diagnostics.cacheHits++;
  return hit.value;
}
function cacheWrite(cache,key,value){cache.set(key,{savedAt:Date.now(),value});return value}

export function stripHtml(value=''){
  return String(value).replace(/<mark>/gi,'').replace(/<\/mark>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
}

export function safeSourceUrl(value){
  if(!value)return null;
  try{
    const url=new URL(value,'https://www.courtlistener.com');
    if(url.protocol!=='https:'||!ALLOWED_SOURCE_HOSTS.has(url.hostname))return null;
    return url.toString();
  }catch{return null}
}

export function classifyCourtListenerStatus(status){
  if(status===401||status===403)return SOURCE_STATE.AUTH_ERROR;
  if(status===429)return SOURCE_STATE.RATE_LIMITED;
  if(status>=500)return SOURCE_STATE.UNAVAILABLE;
  if(status>=400)return 'SOURCE_ERROR';
  return 'OK';
}

function retryAfterMs(header){
  if(!header)return null;
  const seconds=Number(header);
  if(Number.isFinite(seconds))return Math.max(0,seconds*1000);
  const date=Date.parse(header);
  return Number.isFinite(date)?Math.max(0,date-Date.now()):null;
}

function validateSearchPayload(value){
  if(!value||typeof value!=='object')return null;
  const results=Array.isArray(value.results)?value.results:[];
  return {count:Number.isFinite(Number(value.count))?Number(value.count):null,next:typeof value.next==='string'?value.next:null,results,document_count:Number.isFinite(Number(value.document_count))?Number(value.document_count):null};
}
function validateObject(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:null}

async function courtListenerFetch(url,token,{method='GET',body=null,diagnostics,signal,retries=1}={}){
  for(let attempt=0;attempt<=retries;attempt++){
    if(signal?.aborted)return {ok:false,state:'ABORTED',status:0,data:null};
    const controller=new AbortController();
    const abort=()=>controller.abort();
    signal?.addEventListener?.('abort',abort,{once:true});
    const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
    if(diagnostics)diagnostics.courtlistenerRequests++;
    try{
      const response=await fetch(url,{
        method,
        headers:{Authorization:`Token ${token}`,'User-Agent':'RECALL-LexHack/3.0',...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},
        body,signal:controller.signal,cache:'no-store',redirect:'error'
      });
      const state=classifyCourtListenerStatus(response.status);
      let data=null;try{data=await response.json()}catch{}
      if(state==='OK')return {ok:true,state,status:response.status,data};
      const retryMs=retryAfterMs(response.headers.get('retry-after'));
      if(state===SOURCE_STATE.RATE_LIMITED){
        if(attempt<retries&&retryMs!==null&&retryMs<=MAX_RETRY_WAIT_MS){await sleep(retryMs);continue}
        return {ok:false,state,status:response.status,data,retryAfterMs:retryMs};
      }
      if(state===SOURCE_STATE.UNAVAILABLE&&attempt<retries){await sleep(Math.min(250*(2**attempt),1000));continue}
      return {ok:false,state,status:response.status,data};
    }catch(error){
      if(error?.name==='AbortError')return {ok:false,state:signal?.aborted?'ABORTED':SOURCE_STATE.UNAVAILABLE,status:0,data:null};
      if(attempt<retries){await sleep(Math.min(250*(2**attempt),1000));continue}
      return {ok:false,state:SOURCE_STATE.UNAVAILABLE,status:0,data:null};
    }finally{
      clearTimeout(timer);
      signal?.removeEventListener?.('abort',abort);
    }
  }
  return {ok:false,state:SOURCE_STATE.UNAVAILABLE,status:0,data:null};
}

export function buildAuthorityFromInput(input=''){
  const parsed=extractCitations(String(input));
  if(!parsed.length)return null;
  const c=parsed[0];
  return {canonicalId:c.canonicalId,canonicalCitation:`${c.volume} ${c.reporter} ${c.firstPage}`,citation:`${c.volume} ${c.reporter} ${c.firstPage}`,caseName:c.caseName||'',volume:c.volume,reporter:c.reporter,firstPage:c.firstPage,pin:c.pin||null};
}

export function buildSearchPasses({authority,quote,caseName}){
  const passes=[];const seen=new Set();
  const add=(label,q)=>{q=String(q||'').trim();if(q&&!seen.has(q)){seen.add(q);passes.push({label,q})}};
  if(authority?.canonicalCitation){
    add('exact-citation',`"${authority.canonicalCitation}"`);
    add('citation-variant',authority.canonicalCitation);
    const resolvedName=(caseName||authority.caseName||'').trim();
    if(resolvedName){
      const short=resolvedName.split(/\sv\.\s/i)[0].trim();
      if(short)add('case-and-reporter',`"${short}" AND "${authority.volume} ${authority.reporter}"`);
    }
  }
  if(quote){
    const clean=stripHtml(quote).replace(/^["“]|["”]$/g,'').trim();
    if(clean)add('exact-quote',`"${clean.split(/\s+/).slice(0,16).join(' ')}"`);
  }
  return passes;
}

function first(...values){return values.find(v=>v!==undefined&&v!==null&&v!=='')??null}

export function normalizeSearchDocument(raw={},parent={}){
  const sourceUrl=safeSourceUrl(first(raw.absolute_url,raw.absoluteUrl,raw.url,raw.resource_uri,parent.absolute_url,parent.absoluteUrl,parent.url));
  const documentUrl=safeSourceUrl(first(raw.download_url,raw.downloadUrl,raw.file_url,raw.fileUrl,raw.pdf_url,raw.pdfUrl));
  const snippet=stripHtml(first(raw.snippet,raw.plain_text,raw.plainText,raw.text,raw.description,'')||'');
  const id=String(first(raw.id,raw.pk,raw.document_id,raw.documentId,`${first(raw.docket_id,parent.id,'unknown')}:${first(raw.document_number,raw.documentNumber,'doc')}`));
  return {
    id,courtListenerId:first(raw.id,raw.pk,raw.document_id,raw.documentId),
    docketId:first(raw.docket_id,raw.docketId,parent.id,parent.docket_id,parent.docketId),
    docketNumber:first(raw.docketNumber,raw.docket_number,parent.docketNumber,parent.docket_number),
    caseName:first(raw.caseName,raw.case_name,parent.caseName,parent.case_name),
    court:first(raw.court_citation_string,raw.courtCitationString,raw.court,parent.court_citation_string,parent.courtCitationString,parent.court),
    title:first(raw.description,raw.short_description,raw.shortDescription,raw.document_title,raw.documentTitle,`Filing ${first(raw.document_number,raw.documentNumber,'')}`),
    filingDate:first(raw.dateFiled,raw.date_filed,raw.entry_date_filed,raw.entryDateFiled,parent.dateFiled,parent.date_filed),
    documentNumber:first(raw.document_number,raw.documentNumber),sourceUrl,documentUrl,snippet,
    rawHasText:Boolean(first(raw.snippet,raw.plain_text,raw.plainText,raw.text)),
    moreDocs:Boolean(first(raw.more_docs,raw.moreDocs,parent.more_docs,parent.moreDocs,false))
  };
}

export function extractDocketMetadata(payload){
  const map=new Map();
  const parsed=validateSearchPayload(payload);if(!parsed)return map;
  for(const result of parsed.results){
    const id=first(result.id,result.docket_id,result.docketId);
    if(id!==null)map.set(String(id),{docketId:id,docketNumber:first(result.docketNumber,result.docket_number),caseName:first(result.caseName,result.case_name),court:first(result.court_citation_string,result.courtCitationString,result.court),sourceUrl:safeSourceUrl(first(result.absolute_url,result.absoluteUrl,result.url))});
  }
  return map;
}

export function extractDocumentsFromSearchPayload(payload,type='rd',docketMetadata=new Map()){
  const parsed=validateSearchPayload(payload);if(!parsed)return [];
  const out=[];const seen=new Set();
  const push=(raw,parent={})=>{
    if(!raw||typeof raw!=='object')return;
    let doc=normalizeSearchDocument(raw,parent);
    const meta=docketMetadata.get(String(doc.docketId||''));
    if(meta)doc={...doc,docketNumber:doc.docketNumber||meta.docketNumber,caseName:doc.caseName||meta.caseName,court:doc.court||meta.court,sourceUrl:doc.sourceUrl||meta.sourceUrl};
    const key=`${doc.docketId||''}:${doc.courtListenerId||doc.id}:${doc.documentNumber||''}`;
    if(!seen.has(key)){seen.add(key);out.push(doc)}
  };
  for(const result of parsed.results){
    const nested=first(result.recap_documents,result.recapDocuments,result.documents,result.entries);
    if(Array.isArray(nested)&&nested.length)nested.forEach(doc=>push(doc,result));
    else if(type==='rd')push(result,{});
  }
  return out;
}

const escapeRegex=s=>String(s).replace(/[|\\{}()[\]^$+*?.-]/g,'\\$&');
export function incidentShortCitationOccurrences(text,authority){
  if(!authority?.volume||!authority?.reporter||!authority?.caseName)return [];
  const reporter=escapeRegex(normalizeReporter(authority.reporter)).replace(/\\ /g,'\\s+');
  const surname=authority.caseName.split(/\sv\.\s/i)[0].trim().split(/\s+/).pop();
  if(!surname||surname.length<3)return [];
  const re=new RegExp(`\\b${escapeRegex(surname)}\\b[^.]{0,90}?\\b${authority.volume}\\s+${reporter}\\s+at\\s+(\\d{1,5})`,'gi');
  const out=[];let m;while((m=re.exec(text)))out.push({raw:m[0],pin:Number(m[1]),start:m.index,end:re.lastIndex,rule:'case-name + reporter-volume short-form match'});
  return out;
}

function exactPhraseOccurrence(text,phrase){
  const normalizedText=normalizeQuote(text);const normalizedPhrase=normalizeQuote(phrase);
  return normalizedPhrase.length>=16&&normalizedText.includes(normalizedPhrase);
}

export function classifyPublicCandidateRelationships(candidate,incident){
  const text=stripHtml(candidate?.fullText||candidate?.snippet||'');if(!text)return [];
  const relationships=[];const confirmationSource=candidate?.fullText?(candidate.fullTextSource||SOURCE_TEXT_TYPE.RECAP_PLAIN_TEXT):SOURCE_TEXT_TYPE.COURTLISTENER_SNIPPET;
  let criticalOnly=false;
  if(incident?.canonicalId){
    const incidentCites=extractCitations(text).filter(c=>c.canonicalId===incident.canonicalId);
    const cites=incidentCites.filter(c=>!c.critical);
    for(const cite of cites)relationships.push({classification:RELATIONSHIP_STATE.CONFIRMED_CITATION,evidence:{raw:cite.raw,canonical:cite.canonicalId,rule:'reporter-volume-first_page match',sourceText:cite.surrounding||text,confirmationSource}});
    if(!cites.length&&incidentCites.length)criticalOnly=true;
    if(!incidentCites.length){
      for(const occurrence of incidentShortCitationOccurrences(text,incident))relationships.push({classification:RELATIONSHIP_STATE.CONFIRMED_CITATION,evidence:{raw:occurrence.raw,canonical:incident.canonicalId,rule:occurrence.rule,sourceText:text,confirmationSource}});
    }
  }
  if(incident?.quote&&!criticalOnly){
    const quoteCandidates=extractQuotes(text);const matches=[];
    for(const q of quoteCandidates){const score=quoteSimilarity(q.raw,incident.quote);if(score>=0.82)matches.push({raw:q.raw,score})}
    if(!matches.length&&exactPhraseOccurrence(text,incident.quote))matches.push({raw:incident.quote,score:1});
    if(matches.length){
      const best=matches.sort((a,b)=>b.score-a.score)[0];
      relationships.push({classification:RELATIONSHIP_STATE.CONFIRMED_QUOTE,evidence:{raw:best.raw,score:best.score,rule:best.score===1?'normalized exact phrase occurrence':'normalized quote overlap >= 0.82',sourceText:text,confirmationSource}});
    }
  }
  const hasConfirmed=relationships.some(r=>r.classification===RELATIONSHIP_STATE.CONFIRMED_CITATION||r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE);
  if(incident?.proposition&&!criticalOnly&&!hasConfirmed){
    const props=extractPropositions(text);const best=props.map(p=>({raw:p,score:jaccard(p,incident.proposition)})).sort((a,b)=>b.score-a.score)[0];
    if(best?.score>=0.33)relationships.push({classification:RELATIONSHIP_STATE.POSSIBLE,evidence:{raw:best.raw,score:best.score,rule:'lexical semantic review threshold',sourceText:text}});
  }
  if(criticalOnly&&!relationships.length)return [{classification:RELATIONSHIP_STATE.NOT_RELATED,reason:'The available context discusses the incident authority critically rather than relying on it.',evidence:{raw:extractCitations(text).find(c=>c.canonicalId===incident.canonicalId)?.raw||'',rule:'critical-discussion exclusion',sourceText:text}}];
  return relationships;
}

export function confirmPublicCandidate(candidate,incident){
  const text=stripHtml(candidate?.fullText||candidate?.snippet||'');
  if(!text)return {classification:RELATIONSHIP_STATE.UNCONFIRMED,reason:'No filing text/snippet available for independent confirmation',evidence:null,relationships:[]};
  const relationships=classifyPublicCandidateRelationships(candidate,incident);
  const primary=relationships.find(r=>r.classification===RELATIONSHIP_STATE.CONFIRMED_CITATION)||relationships.find(r=>r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE)||relationships.find(r=>r.classification===RELATIONSHIP_STATE.POSSIBLE)||relationships.find(r=>r.classification===RELATIONSHIP_STATE.NOT_RELATED);
  return primary?{...primary,relationships}:{classification:RELATIONSHIP_STATE.UNCONFIRMED,reason:'Search hit did not contain deterministic incident evidence in available text',evidence:null,relationships:[]};
}

export function normalizeTraceDocuments(searchDocs,incident,query,retrievedAt){
  return searchDocs.map(doc=>{
    const classification=confirmPublicCandidate(doc,incident);
    const sourceText=doc.fullText||doc.snippet||'';
    return {...doc,...classification,searchQuery:query,retrievedAt,contentHash:createHash('sha256').update(sourceText).digest('hex'),sourceType:'COURTLISTENER_RECAP'};
  });
}

export function summarizePublicTrace(documents,checkedCount,totalResultCount=null){
  const relationships=documents.flatMap(d=>{
    const rels=Array.isArray(d.relationships)&&d.relationships.length?d.relationships:[d.classification?{classification:d.classification,evidence:d.evidence}:null].filter(Boolean);
    return rels.map(r=>({...r,documentId:d.id}));
  });
  const confirmedIds=new Set(relationships.filter(r=>r.classification===RELATIONSHIP_STATE.CONFIRMED_CITATION||r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE).map(r=>r.documentId));
  const confirmed=documents.filter(d=>confirmedIds.has(d.id));
  const citation=relationships.filter(r=>r.classification===RELATIONSHIP_STATE.CONFIRMED_CITATION);
  const quotes=relationships.filter(r=>r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE);
  const possible=relationships.filter(r=>r.classification===RELATIONSHIP_STATE.POSSIBLE);
  const candidates=documents.filter(d=>!confirmedIds.has(d.id)&&d.classification===RELATIONSHIP_STATE.UNCONFIRMED);
  const dockets=new Set(confirmed.map(d=>d.docketId||d.docketNumber).filter(Boolean));
  const courts=new Set(confirmed.map(d=>d.court).filter(Boolean));
  const dates=confirmed.map(d=>d.filingDate).filter(Boolean).sort();
  return {checkedCount,totalResultCount,confirmedFilingCount:confirmedIds.size,confirmedCitationCount:citation.length,confirmedQuoteReuseCount:quotes.length,candidateUnconfirmedCount:candidates.length,possibleRelatedClaimCount:possible.length,uniqueDockets:dockets.size,unknownDocketCount:confirmed.filter(d=>!d.docketId&&!d.docketNumber).length,courts:[...courts],earliestConfirmedFilingDate:dates[0]||null,latestConfirmedFilingDate:dates.at(-1)||null};
}

export async function resolveAuthorityWithCourtListener(authority,token,{diagnostics,signal}={}){
  if(!authority?.canonicalCitation)return {status:'UNRESOLVED',authority};
  const key=authority.canonicalCitation;const cached=cacheRead(resolutionCache,key,diagnostics);if(cached)return cached;
  const response=await courtListenerFetch(`${COURTLISTENER_BASE}citation-lookup/`,token,{method:'POST',body:new URLSearchParams({text:key}).toString(),diagnostics,signal});
  if(!response.ok)return {status:'UNRESOLVED',authority,sourceState:response.state,statusCode:response.status,retryAfterMs:response.retryAfterMs};
  const rows=Array.isArray(response.data)?response.data:[];const row=rows[0]||null;const cluster=Array.isArray(row?.clusters)?row.clusters[0]:null;
  if(!(row&&Number(row.status)===200&&cluster))return cacheWrite(resolutionCache,key,{status:'UNRESOLVED',authority,raw:row,sourceState:'OK'});
  const result={status:'RESOLVED',authority:{...authority,caseName:first(cluster.case_name,cluster.caseName,cluster.case_name_full,cluster.caseNameFull)||authority.caseName||'',sourceUrl:safeSourceUrl(first(cluster.absolute_url,cluster.absoluteUrl,cluster.url)),court:first(cluster.court,cluster.court_citation_string,cluster.courtCitationString),date:first(cluster.date_filed,cluster.dateFiled),courtListenerId:first(cluster.id,cluster.pk)},raw:row};
  return cacheWrite(resolutionCache,key,result);
}

export async function searchCourtListener(query,token,type='r',{diagnostics,signal}={}){
  const key=`${type}:${query}`;const cached=cacheRead(searchCache,key,diagnostics);if(cached)return cached;
  const url=new URL(`${COURTLISTENER_BASE}search/`);url.searchParams.set('q',query);url.searchParams.set('type',type);url.searchParams.set('highlight','on');
  const response=await courtListenerFetch(url.toString(),token,{diagnostics,signal});
  if(!response.ok)return response;
  const parsed=validateSearchPayload(response.data);if(!parsed)return {ok:false,state:'SOURCE_ERROR',status:502,data:null};
  return cacheWrite(searchCache,key,{...response,data:parsed});
}

export async function searchCourtListenerPages(query,token,type='rd',maxResults=50,{diagnostics,signal}={}){
  const cacheKey=`pages:${type}:${maxResults}:${query}`;const cached=cacheRead(searchCache,cacheKey,diagnostics);if(cached)return cached;
  let url=new URL(`${COURTLISTENER_BASE}search/`);url.searchParams.set('q',query);url.searchParams.set('type',type);url.searchParams.set('highlight','on');
  const results=[];let count=null;let pageCount=0;let next=null;
  while(url&&results.length<maxResults&&pageCount<3){
    const response=await courtListenerFetch(url.toString(),token,{diagnostics,signal});
    if(!response.ok)return {...response,results,count,pageCount,next};
    const data=validateSearchPayload(response.data);if(!data)return {ok:false,state:'SOURCE_ERROR',status:502,results,count,pageCount,next};
    if(count===null)count=data.count;
    for(const row of data.results){if(results.length<maxResults)results.push(row)}
    next=safeSourceUrl(data.next);pageCount++;
    if(!next||results.length>=maxResults)break;
    const nextUrl=new URL(next);if(!ALLOWED_SOURCE_HOSTS.has(nextUrl.hostname))break;url=nextUrl;
  }
  return cacheWrite(searchCache,cacheKey,{ok:true,state:'OK',status:200,data:{count,next,results},results,count,pageCount,next});
}

export async function fetchRecapDocumentDetail(id,token,{diagnostics,signal}={}){
  if(!id)return {ok:false,state:'SOURCE_ERROR',status:400,data:null};
  const key=String(id);const cached=cacheRead(recapCache,key,diagnostics);if(cached)return cached;
  const url=new URL(`${COURTLISTENER_BASE}recap-documents/${encodeURIComponent(key)}/`);url.searchParams.set('fields','id,docket_entry,description,document_number,attachment_number,plain_text,filepath_local,is_available,ocr_status');
  const response=await courtListenerFetch(url.toString(),token,{diagnostics,signal});
  if(!response.ok)return response;
  const data=validateObject(response.data);if(!data)return {ok:false,state:'SOURCE_ERROR',status:502,data:null};
  return cacheWrite(recapCache,key,{...response,data});
}

export async function fetchDocketDetail(id,token,{diagnostics,signal}={}){
  if(!id)return {ok:false,state:'SOURCE_ERROR',status:400,data:null};
  const key=String(id);const cached=cacheRead(docketCache,key,diagnostics);if(cached)return cached;
  const url=new URL(`${COURTLISTENER_BASE}dockets/${encodeURIComponent(key)}/`);url.searchParams.set('fields','id,docket_number,case_name,court,date_filed,absolute_url');
  const response=await courtListenerFetch(url.toString(),token,{diagnostics,signal});
  if(!response.ok)return response;
  const data=validateObject(response.data);if(!data)return {ok:false,state:'SOURCE_ERROR',status:502,data:null};
  return cacheWrite(docketCache,key,{...response,data});
}

export function sourceUrlFromRecapDetail(detail){
  const path=detail?.filepath_local;if(!path)return null;
  return safeSourceUrl(`https://storage.courtlistener.com/${String(path).replace(/^\/+/, '')}`);
}

export async function hydratePublicDocument(doc,token,{diagnostics,signal,firecrawlKey,hydrateDocket=true}={}){
  const key=String(doc.courtListenerId||doc.documentUrl||doc.id);
  const cached=cacheRead(extractionCache,key,diagnostics);if(cached)return {...doc,...cached};
  const result={...doc};
  if(doc.courtListenerId){
    const detail=await fetchRecapDocumentDetail(doc.courtListenerId,token,{diagnostics,signal});
    if(detail.ok&&detail.data){
      const plainText=stripHtml(detail.data.plain_text||'');
      if(plainText){result.fullText=plainText;result.fullTextSource=SOURCE_TEXT_TYPE.RECAP_PLAIN_TEXT}
      result.title=detail.data.description||result.title;result.documentNumber=detail.data.document_number??result.documentNumber;
      result.documentUrl=sourceUrlFromRecapDetail(detail.data)||result.documentUrl;result.ocrStatus=detail.data.ocr_status??null;result.isAvailable=detail.data.is_available??null;
    }
  }
  if(!result.fullText&&firecrawlKey&&result.documentUrl){
    const fallback=await extractPublicSourceWithFirecrawl(result.documentUrl,firecrawlKey,{diagnostics,signal});
    if(fallback.ok){result.fullText=stripHtml(fallback.text);result.fullTextSource=SOURCE_TEXT_TYPE.FIRECRAWL_PUBLIC_SOURCE;result.firecrawlRetrievedAt=fallback.retrievedAt}
  }
  if(hydrateDocket&&doc.docketId&&(!result.docketNumber||!result.caseName||!result.court)){
    const docket=await fetchDocketDetail(doc.docketId,token,{diagnostics,signal});
    if(docket.ok&&docket.data){result.docketNumber=result.docketNumber||docket.data.docket_number||null;result.caseName=result.caseName||docket.data.case_name||null;result.court=result.court||docket.data.court||null;result.sourceUrl=result.sourceUrl||safeSourceUrl(docket.data.absolute_url)}
  }
  if(diagnostics)diagnostics.documentsHydrated++;
  cacheWrite(extractionCache,key,{fullText:result.fullText||'',fullTextSource:result.fullTextSource||null,title:result.title,documentNumber:result.documentNumber,documentUrl:result.documentUrl,docketNumber:result.docketNumber,caseName:result.caseName,court:result.court,sourceUrl:result.sourceUrl});
  return result;
}

async function mapLimit(items,limit,worker){
  const results=new Array(items.length);let cursor=0;
  const run=async()=>{while(true){const index=cursor++;if(index>=items.length)return;results[index]=await worker(items[index],index)}};
  await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
  return results;
}

function candidateKey(doc){return `${doc.docketId||''}:${doc.courtListenerId||doc.id}:${doc.documentNumber||''}`}
function candidateLooksPromising(doc,incident){
  const text=stripHtml(doc.snippet||'');
  if(!text)return true;
  if(incident.canonicalCitation&&text.includes(incident.canonicalCitation))return true;
  if(incident.caseName&&text.toLowerCase().includes(String(incident.caseName).split(/\sv\.\s/i)[0].toLowerCase()))return true;
  if(incident.quote&&normalizeQuote(text).includes(normalizeQuote(incident.quote).slice(0,40)))return true;
  return false;
}

async function runSearchPass(pass,{token,incident,maxCandidates,diagnostics,signal,firecrawlKey,seen,includeDocketContext=false}){
  diagnostics.searchPassesUsed++;
  const search=await searchCourtListenerPages(pass.q,token,'rd',maxCandidates,{diagnostics,signal});
  if(!search.ok)return {ok:false,error:search};
  const metadata=includeDocketContext?(await searchCourtListener(pass.q,token,'r',{diagnostics,signal})):null;
  const docketMetadata=metadata?.ok?extractDocketMetadata(metadata.data):new Map();
  const rawDocs=extractDocumentsFromSearchPayload(search.data,'rd',docketMetadata).filter(doc=>!seen.has(candidateKey(doc)));
  rawDocs.forEach(doc=>seen.add(candidateKey(doc)));
  diagnostics.candidatesFound+=rawDocs.length;
  let documents=normalizeTraceDocuments(rawDocs,incident,pass.q,nowIso());

  const unresolvedIndexes=documents.map((doc,index)=>({doc,index})).filter(({doc})=>doc.classification===RELATIONSHIP_STATE.UNCONFIRMED&&candidateLooksPromising(doc,incident)).slice(0,3);
  const hydrated=await mapLimit(unresolvedIndexes,MAX_CONCURRENCY,async({doc,index})=>({index,doc:await hydratePublicDocument(doc,token,{diagnostics,signal,firecrawlKey,hydrateDocket:false})}));
  for(const item of hydrated)documents[item.index]=normalizeTraceDocuments([item.doc],incident,pass.q,nowIso())[0];

  return {ok:true,documents,count:search.count,next:search.next};
}

export function getCachedTrace(key,diagnostics){return cacheRead(traceCache,key,diagnostics)}
export function setCachedTrace(key,value){return cacheWrite(traceCache,key,value)}

export async function traceCourtListener({input,quote='',maxCandidates=25,broad=false,signal},token,{firecrawlKey=process.env.FIRECRAWL_API_KEY||'',diagnostics=createTraceDiagnostics()}={}){
  const started=Date.now();
  const parsedAuthority=buildAuthorityFromInput(input);
  const resolved=parsedAuthority?await resolveAuthorityWithCourtListener(parsedAuthority,token,{diagnostics,signal}):{status:'UNRESOLVED',authority:null};
  if(resolved.sourceState===SOURCE_STATE.RATE_LIMITED)return {ok:false,state:SOURCE_STATE.RATE_LIMITED,retryAfterMs:resolved.retryAfterMs,diagnostics};
  const authority=resolved.authority;const rawInput=stripHtml(input||'').trim();const effectiveQuote=quote||(!authority&&rawInput.length>=28?rawInput:'');
  const incident={...authority,quote:effectiveQuote,proposition:effectiveQuote,canonicalId:authority?.canonicalId||null};
  if(!authority&&!effectiveQuote&&!rawInput)return {ok:false,state:'INVALID_INPUT',message:'Enter a supported citation, case query, or quotation.',diagnostics};

  const allPasses=buildSearchPasses({authority,quote:effectiveQuote,caseName:authority?.caseName});
  if(!allPasses.length&&rawInput)allPasses.push({label:'unresolved-text',q:rawInput});
  const primary=allPasses.find(pass=>pass.label==='exact-citation')||allPasses.find(pass=>pass.label==='exact-quote')||allPasses[0];
  const cacheKey=createHash('sha256').update(JSON.stringify({primary:primary?.q,quote:effectiveQuote,maxCandidates,broad})).digest('hex');
  const cached=getCachedTrace(cacheKey,diagnostics);
  if(cached){diagnostics.durationMs=Date.now()-started;return {...cached,sourceState:SOURCE_STATE.CACHED,checkedAt:cached.retrievedAt,diagnostics:{...cached.diagnostics,...diagnostics,cacheHits:diagnostics.cacheHits}}}

  const seen=new Set();let documents=[];let approximateTotal=0;let hasMore=false;const sourceQueries=[];
  const firstPass=await runSearchPass(primary,{token,incident,maxCandidates,diagnostics,signal,firecrawlKey,seen,includeDocketContext:true});
  if(!firstPass.ok){
    diagnostics.durationMs=Date.now()-started;
    return {ok:false,state:firstPass.error.state,statusCode:firstPass.error.status,retryAfterMs:firstPass.error.retryAfterMs,message:firstPass.error.state===SOURCE_STATE.RATE_LIMITED?'Public source temporarily rate-limited.':firstPass.error.state===SOURCE_STATE.AUTH_ERROR?'CourtListener authentication failed.':'CourtListener filing search could not complete.',diagnostics};
  }
  documents.push(...firstPass.documents);approximateTotal=Math.max(approximateTotal,Number(firstPass.count||0));hasMore=Boolean(firstPass.next);
  sourceQueries.push({label:primary.label,query:primary.q,type:'rd',count:firstPass.count??null});

  let summary=summarizePublicTrace(documents,documents.length,approximateTotal||null);
  const shouldFallback=broad||documents.length<3||summary.confirmedFilingCount===0;
  if(shouldFallback&&documents.length<maxCandidates){
    const fallback=allPasses.find(pass=>pass.q!==primary.q&&pass.label!=='case-and-reporter')||allPasses.find(pass=>pass.q!==primary.q);
    if(fallback){
      const next=await runSearchPass(fallback,{token,incident,maxCandidates:Math.max(1,maxCandidates-documents.length),diagnostics,signal,firecrawlKey,seen,includeDocketContext:false});
      if(next.ok){documents.push(...next.documents);approximateTotal=Math.max(approximateTotal,Number(next.count||0));hasMore=hasMore||Boolean(next.next);sourceQueries.push({label:fallback.label,query:fallback.q,type:'rd',count:next.count??null})}
      else if(next.error.state===SOURCE_STATE.RATE_LIMITED){diagnostics.durationMs=Date.now()-started;return {ok:false,state:SOURCE_STATE.RATE_LIMITED,retryAfterMs:next.error.retryAfterMs,message:'Public source temporarily rate-limited.',diagnostics}}
    }
  }

  summary=summarizePublicTrace(documents,documents.length,approximateTotal||null);
  diagnostics.confirmedRelationships=summary.confirmedCitationCount+summary.confirmedQuoteReuseCount;
  diagnostics.possibleRelationships=summary.possibleRelatedClaimCount;
  diagnostics.unconfirmedCandidates=summary.candidateUnconfirmedCount;
  diagnostics.durationMs=Date.now()-started;
  const retrievedAt=nowIso();
  const value={ok:true,sourceState:SOURCE_STATE.LIVE,retrievedAt,authorityResolution:resolved.status,authority,documents,summary,sourceQueries,coverage:{checked:documents.length,approximateMatches:approximateTotal||null,bounded:hasMore||approximateTotal>documents.length,maxCandidates,language:`${summary.confirmedFilingCount} confirmed in ${documents.length} filing candidates checked`},diagnostics};
  setCachedTrace(cacheKey,value);
  return value;
}
