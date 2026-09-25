'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
// @ts-ignore shared recorded source fixture
import {getRecordedPublicTrace,recordedEvidenceFor} from '../lib/recorded-public-trace.mjs';
// @ts-ignore Shared domain constants are intentionally consumed by browser and Node code.
import {RELATIONSHIP_STATE} from '../lib/domain.mjs';

type TraceDoc={
 id:string; title?:string|null; docketId?:string|null; docketNumber?:string|null; caseName?:string|null; court?:string|null; filingDate?:string|null;
 sourceUrl?:string|null; documentUrl?:string|null; snippet?:string; text?:string; classification?:string; evidence?:any; relationships?:Array<{classification:string;evidence:any}>; searchQuery?:string|null; contentHash?:string; retrievedAt?:string; sourceCapture?:any;
};
type TraceDiagnostics={traceId?:string;courtlistenerRequests?:number;firecrawlRequests?:number;cacheHits?:number;documentsHydrated?:number;searchPassesUsed?:number};
type TraceResult={ok?:boolean;sourceState?:string;retrievedAt?:string;checkedAt?:string;capturedAt?:string;authority?:any;authorityResolution?:string;documents:TraceDoc[];summary:any;coverage:any;sourceQueries?:any[];mode?:string;diagnostics?:TraceDiagnostics};
type TraceError={message:string;state?:string;retryAfterMs?:number};

const isConfirmed=(d:TraceDoc)=>d.classification===RELATIONSHIP_STATE.CONFIRMED_CITATION||d.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE;
const dateLabel=(v?:string|null)=>v?new Intl.DateTimeFormat('en',{year:'numeric',month:'short',day:'2-digit'}).format(new Date(v)):'Date unavailable';

function RecordedResult():TraceResult{
 const raw=getRecordedPublicTrace();
 const byDoc=raw.analysis.byDoc;
 const documents=raw.documents.map((d:any)=>{
   const edges=byDoc.get(d.id)||[];
   const relationships=edges.map((edge:any)=>{
     const captured=recordedEvidenceFor(d,edge.type);
     return {
       classification:edge.type,
       evidence:captured?{
         raw:captured.text,
         rule:edge.evidence?.rule,
         score:edge.evidence?.score,
         confirmationSource:'RECORDED_EXACT_SOURCE_SPAN',
         recordedProvenance:captured.provenance
       }:edge.evidence
     };
   });
   const primary=relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.CONFIRMED_CITATION)||relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE)||relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.POSSIBLE);
   return {...d,snippet:d.sourceCapture?.segments?.[0]?.text||'',relationships,classification:primary?.classification||RELATIONSHIP_STATE.UNCONFIRMED,evidence:primary?.evidence||null};
 });
 return {...raw,ok:true,sourceState:'RECORDED',documents};
}

function EvidenceMap({docs,onOpen}:{docs:TraceDoc[];onOpen:(d:TraceDoc)=>void}){
 const confirmed=docs.filter(isConfirmed);
 const groups=[...new Map(confirmed.map(d=>[String(d.docketId||d.docketNumber||d.id),{key:String(d.docketId||d.docketNumber||d.id),name:d.caseName||'Public docket',court:d.court||'Court unavailable',number:d.docketNumber||'Docket number unavailable',docs:confirmed.filter(x=>(x.docketId||x.docketNumber||x.id)===(d.docketId||d.docketNumber||d.id))}])).values()];
 return <div className="sourceMap">
   <div className="sourceAuthority"><span>AUTHORITY</span><strong>{confirmed.length?'Confirmed occurrences':'No confirmed occurrences'}</strong></div>
   <div className="sourceDockets">{groups.map(g=><section key={g.key} className="docketGroup"><div className="docketStem"/><div className="docketHead"><span>DOCKET</span><strong>{g.name}</strong><small>{g.court} · {g.number}</small></div>{g.docs.map(d=><button key={d.id} className="filingNode" onClick={()=>onOpen(d)}><span>{dateLabel(d.filingDate)}</span><strong>{d.title||'Public filing'}</strong><small>{d.relationships?.some(r=>r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE)?'Confirmed citation + quote reuse':d.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE?'Confirmed quote reuse':'Confirmed citation'}</small></button>)}</section>)}</div>
 </div>
}

export default function PublicTrace({recorded=false,initialInput=''}:{recorded?:boolean;initialInput?:string}){
 const recordedData=useMemo(()=>recorded?RecordedResult():null,[recorded]);
 const [input,setInput]=useState(recordedData?.authority?.citation||initialInput||'598 U.S. 508');
 const [quote,setQuote]=useState('');
 const [result,setResult]=useState<TraceResult|null>(recordedData);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<TraceError|null>(null);
 const [selected,setSelected]=useState<TraceDoc|null>(null);
 const [limit,setLimit]=useState(25);
 const requestRef=useRef<AbortController|null>(null);
 useEffect(()=>()=>requestRef.current?.abort(),[]);
 const run=async(nextLimit=limit)=>{
   requestRef.current?.abort();
   const controller=new AbortController();requestRef.current=controller;
   setBusy(true);setError(null);setSelected(null);
   try{
     const res=await fetch('/api/trace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input,quote,maxCandidates:nextLimit}),signal:controller.signal});
     const data=await res.json();
     if(!res.ok||!data.ok){setResult(null);setError({message:data.message||'Live public-source trace failed.',state:data.state,retryAfterMs:data.retryAfterMs});return}
     setResult(data);
   }catch(error){if((error as Error)?.name!=='AbortError'){setResult(null);setError({message:'Could not reach the live trace endpoint.',state:'SOURCE_UNAVAILABLE'})}}
   finally{if(requestRef.current===controller){setBusy(false);requestRef.current=null}}
 };
 const docs=result?.documents||[];
 const summary=result?.summary;
 const confirmed=docs.filter(isConfirmed);
 const candidates=docs.filter(d=>d.classification===RELATIONSHIP_STATE.UNCONFIRMED);
 const possible=docs.filter(d=>d.classification===RELATIONSHIP_STATE.POSSIBLE);
 const label=recorded?'RECORDED PUBLIC TRACE':result?.sourceState==='CACHED'?`CACHED PUBLIC SOURCE — checked ${dateLabel(result.checkedAt||result.retrievedAt)}`:'LIVE PUBLIC SOURCE';
 return <main className="publicTracePage">
   <header className="workMast"><Link href="/" className="wordmark">RECALL</Link><div className="incidentCrumb">{recorded?'Recorded evidence replay':'Trace real filings'}</div><div className={`sourceMode ${recorded?'recorded':'live'}`}>{label}</div></header>
   <section className="traceHero">
     <div className="traceInputSide"><div className="heroIndex">{recorded?'PUBLIC-SOURCE REPLAY':'LIVE FEDERAL FILING SEARCH'}</div><h1>{recorded?'A real trace, frozen for replay.':'Trace the authority through public filings.'}</h1><p>{recorded?'These records were captured from public CourtListener / RECAP sources during development. The replay does not make network calls.':'Searches public federal filing data available through CourtListener / RECAP. Coverage is not every U.S. court filing.'}</p>
       {!recorded&&<div className="traceForm"><label><span>CITATION OR CASE + CITATION</span><input value={input} onChange={e=>setInput(e.target.value)} placeholder="410 U.S. 113"/></label><label><span>OPTIONAL DISPUTED QUOTATION</span><textarea value={quote} onChange={e=>setQuote(e.target.value)} placeholder="Paste a quotation to trace exact / near-exact reuse"/></label><button className="button danger" onClick={()=>run(limit)} disabled={busy}>{busy?'Tracing public filings…':'Trace real filings →'}</button></div>}
       {recorded&&<div className="recordedStamp"><span>CAPTURED</span><strong>{dateLabel(result?.capturedAt)}</strong><small>Exact captured source excerpts and evidence spans are SHA-256 hashed. Original-file SHA-256 is shown only when the source file was downloaded during capture.</small></div>}
       {error&&<div className="errorBox"><strong>{error.state==='RATE_LIMITED'?'Public source temporarily rate-limited':'Live source unavailable'}</strong><p>{error.message}{error.state==='RATE_LIMITED'&&error.retryAfterMs?` Retry after about ${Math.ceil(error.retryAfterMs/1000)} seconds.`:''}</p><Link href="/incident/demo">Open recorded public incident →</Link></div>}
     </div>
     <aside className="traceLaw"><div className="railLabel">CONFIRMATION LAW</div><p>A search hit is only a candidate. RECALL counts a filing as confirmed only when its available text contains deterministic citation or quotation evidence.</p><p>Semantic resemblance is always review-only.</p></aside>
   </section>
   {busy&&<section className="traceProgress" aria-live="polite"><span>Tracing public filing candidates…</span></section>}
   {result&&<>
     <section className="traceSummary">
       <div className="summaryLead"><span>{label}</span><h2>{result.authority?.caseName||result.authority?.citation||input}</h2><p>{result.coverage?.language||`${summary?.confirmedFilingCount||0} confirmed in ${summary?.checkedCount||0} filing candidates checked`}</p></div>
       <div className="traceMetrics"><div><b>{summary?.confirmedFilingCount??0}</b><span>confirmed filings</span></div><div><b>{summary?.uniqueDockets??0}</b><span>identified dockets</span></div><div><b>{summary?.confirmedQuoteReuseCount??0}</b><span>quote reuses</span></div><div><b>{summary?.candidateUnconfirmedCount??0}</b><span>unconfirmed candidates</span></div></div>
       <div className="coverageNote">{result.coverage?.bounded?<strong>Bounded search.</strong>:<strong>Checked returned result set.</strong>} <span>RECALL checked {summary?.checkedCount??docs.length} filing candidates. {summary?.unknownDocketCount?`${summary.unknownDocketCount} confirmed filing${summary.unknownDocketCount===1?' has':'s have'} docket metadata unavailable. `:''}Search counts above 2,000 can be approximate at the source.</span>{!recorded&&result.coverage?.bounded&&limit<50&&<button className="loadMore" onClick={()=>{setLimit(50);void run(50)}} disabled={busy}>Check up to 50 candidates →</button>}</div>
     </section>
     <section className="traceEvidenceGrid">
       <div className="traceEvidenceMain"><div className="sectionEyebrow">EVIDENCE MAP</div><h2>Confirmed occurrences by docket.</h2><EvidenceMap docs={docs} onOpen={setSelected}/></div>
       <aside className="traceRightRail"><div className="sectionEyebrow">SOURCE-FIRST RESULTS</div>{confirmed.map(d=><button key={d.id} onClick={()=>setSelected(d)} className="sourceResult"><span>{d.court||'Court unavailable'} · {dateLabel(d.filingDate)}</span><strong>{d.title||'Public filing'}</strong><small>{d.caseName||d.docketNumber||'Docket metadata unavailable'}</small></button>)}{!confirmed.length&&<p className="emptyState">RECALL found no confirmed filing dependencies in the checked public-source candidates.</p>}{candidates.length>0&&<div className="candidateNote">{candidates.length} search hit{candidates.length===1?'':'s'} could not be independently confirmed from available text and were excluded from confirmed totals.</div>}{possible.length>0&&<div className="possibleNote">{possible.length} possible related proposition{possible.length===1?'':'s'} — human review required.</div>}</aside>
     </section>
     {summary?.earliestConfirmedFilingDate&&<section className="traceTimeline"><div><span>EARLIEST CONFIRMED OCCURRENCE CHECKED</span><strong>{dateLabel(summary.earliestConfirmedFilingDate)}</strong></div><div><span>LATEST CONFIRMED OCCURRENCE CHECKED</span><strong>{dateLabel(summary.latestConfirmedFilingDate)}</strong></div></section>}
   </>}
   {selected&&<div className="drawerBackdrop" onClick={()=>setSelected(null)}><aside className="drawer publicDrawer" onClick={e=>e.stopPropagation()}><button className="drawerClose" onClick={()=>setSelected(null)}>×</button><div className="heroIndex">PUBLIC FILING EVIDENCE</div><h2>{selected.title||'Public filing'}</h2><div className="drawerMeta"><span>{selected.court||'Court unavailable'}</span><span>{selected.docketNumber||'Docket unavailable'}</span><span>{dateLabel(selected.filingDate)}</span></div><div className="sourceFact"><span>CLASSIFICATION</span><strong>{selected.classification}</strong></div>{(selected.relationships?.length?selected.relationships:[selected.evidence?{classification:selected.classification||'',evidence:selected.evidence}:null].filter(Boolean) as any[]).map((relationship:any,index:number)=><div className="evidenceBlock" key={`${relationship.classification}-${index}`}><div className="edgeKind">{relationship.classification}</div><blockquote>{relationship.evidence?.raw}</blockquote><p>{relationship.evidence?.rule}</p>{relationship.evidence?.score!==undefined&&<p>Overlap: {Number(relationship.evidence.score).toFixed(3)}</p>}{relationship.evidence?.confirmationSource&&<p>Confirmed from: {relationship.evidence.confirmationSource==='RECAP_PLAIN_TEXT'?'RECAP extracted document text':relationship.evidence.confirmationSource==='RECORDED_EXACT_SOURCE_SPAN'?'Recorded exact public-source span':'CourtListener search snippet'}</p>}{relationship.evidence?.recordedProvenance&&<><p>Source: PDF page {relationship.evidence.recordedProvenance.pdfPageNumber} · extracted text lines {relationship.evidence.recordedProvenance.extractedTextLineStart}{relationship.evidence.recordedProvenance.extractedTextLineEnd!==relationship.evidence.recordedProvenance.extractedTextLineStart?`–${relationship.evidence.recordedProvenance.extractedTextLineEnd}`:''}</p><p>Evidence span SHA-256: <code>{relationship.evidence.recordedProvenance.evidenceSha256}</code></p><p>Captured excerpt SHA-256: <code>{relationship.evidence.recordedProvenance.segmentSha256}</code></p></>}</div>)}<div className="sourceFacts"><p><span>CASE</span>{selected.caseName||'Unavailable'}</p><p><span>SEARCH QUERY</span>{selected.searchQuery||'Recorded source capture; no live query in replay.'}</p>{selected.sourceCapture?<p><span>ORIGINAL FILE SHA-256</span>{selected.sourceCapture.documentSha256?<code>{selected.sourceCapture.documentSha256}</code>:'Not captured — the original PDF was not downloaded during capture.'}</p>:<p><span>CONTENT HASH</span><code>{selected.contentHash||'Unavailable'}</code></p>}</div>{(selected.documentUrl||selected.sourceUrl)&&<a className="button primary" href={(selected.documentUrl||selected.sourceUrl)!} target="_blank" rel="noreferrer">Open public source ↗</a>}</aside></div>}
 </main>
}
