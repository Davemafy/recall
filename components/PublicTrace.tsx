'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
// @ts-ignore shared recorded source fixture
import {getRecordedPublicTrace,recordedEvidenceFor} from '../lib/recorded-public-trace.mjs';
// @ts-ignore shared domain constants
import {RELATIONSHIP_STATE,relationshipLabel} from '../lib/domain.mjs';

type TraceDoc={
 id:string; title?:string|null; docketId?:string|null; docketNumber?:string|null; caseName?:string|null; court?:string|null; filingDate?:string|null;
 sourceUrl?:string|null; documentUrl?:string|null; snippet?:string; text?:string; classification?:string; evidence?:any;
 relationships?:Array<{classification:string;evidence:any}>; searchQuery?:string|null; contentHash?:string; retrievedAt?:string; sourceCapture?:any;
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
   const primary=relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.CONFIRMED_CITATION)
     ||relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE)
     ||relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.POSSIBLE);
   return {...d,snippet:d.sourceCapture?.segments?.[0]?.text||'',relationships,classification:primary?.classification||RELATIONSHIP_STATE.UNCONFIRMED,evidence:primary?.evidence||null};
 });
 return {...raw,ok:true,sourceState:'RECORDED',documents};
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
   const controller=new AbortController();
   requestRef.current=controller;
   setBusy(true);setError(null);setSelected(null);
   try{
     const res=await fetch('/api/trace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input,quote,maxCandidates:nextLimit}),signal:controller.signal});
     const data=await res.json();
     if(!res.ok||!data.ok){setResult(null);setError({message:data.message||'Live public-source trace failed.',state:data.state,retryAfterMs:data.retryAfterMs});return}
     setResult(data);
   }catch(err){
     if((err as Error)?.name!=='AbortError'){setResult(null);setError({message:'Could not reach the live trace endpoint.',state:'SOURCE_UNAVAILABLE'})}
   }finally{
     if(requestRef.current===controller){setBusy(false);requestRef.current=null}
   }
 };

 const docs=result?.documents||[];
 const summary=result?.summary;
 const confirmed=docs.filter(isConfirmed);
 const candidates=docs.filter(d=>d.classification===RELATIONSHIP_STATE.UNCONFIRMED);
 const possible=docs.filter(d=>d.classification===RELATIONSHIP_STATE.POSSIBLE);
 const label=recorded?'RECORDED PUBLIC TRACE':result?.sourceState==='CACHED'?'CACHED PUBLIC SOURCE — checked '+dateLabel(result.checkedAt||result.retrievedAt):'LIVE PUBLIC SOURCE';
 const checked=summary?.checkedCount??docs.length;
 const confirmedCount=summary?.confirmedFilingCount??0;

 return <main className="quickTracePage">
   <header className="recallXMast">
     <Link href="/" className="recallXBrand">RECALL</Link>
     <div className="recallXMastCase">Quick trace</div>
     <div className="recallXMastMode"><span/>{recorded?'Recorded public trace':'Public federal filing search'}</div>
   </header>

   <section className="quickTraceHero">
     <div className="quickTraceIntro">
       <span>{recorded?'RECORDED REPLAY':'QUICK TRACE / 02'}</span>
       <h1>Trace an<br/>authority.</h1>
       <p>{recorded?'A frozen public-source trace for deterministic replay.':'Searches public federal filing data available through CourtListener / RECAP. Search results are candidates until source text confirms them.'}</p>
     </div>

     <div className="quickTraceControl">
       {!recorded?<><label className="quickTraceCitation">
         <span>CITATION OR CASE + CITATION</span>
         <input value={input} onChange={e=>setInput(e.target.value)} placeholder="410 U.S. 113"/>
       </label>
       <label className="quickTraceQuote">
         <span>DISPUTED QUOTATION <em>optional</em></span>
         <textarea value={quote} onChange={e=>setQuote(e.target.value)} placeholder="Paste exact disputed language if quotation reuse matters"/>
       </label>
       <button className="quickTraceRun" onClick={()=>run(limit)} disabled={busy}>{busy?'Tracing public filings…':'Trace real filings'} <b>↗</b></button></>:<div className="quickTraceRecorded">
         <span>CAPTURED</span>
         <strong>{dateLabel(result?.capturedAt)}</strong>
         <p>Exact captured source excerpts and evidence spans are SHA-256 hashed.</p>
       </div>}
     </div>
   </section>

   {busy&&<div className="quickTraceProgress" aria-live="polite"><span/>Checking filing candidates and confirming source text…</div>}

   {error&&<section className="quickTraceError" role="alert">
     <span>{error.state==='RATE_LIMITED'?'RATE LIMITED':'SOURCE UNAVAILABLE'}</span>
     <strong>{error.message}</strong>
     <p>{error.state==='RATE_LIMITED'&&error.retryAfterMs?'Retry after about '+Math.ceil(error.retryAfterMs/1000)+' seconds. ':''}Current incident state is preserved.</p>
     <Link href="/incident/demo">Open recorded incident ↗</Link>
   </section>}

   {result&&<section className="quickTraceResult">
     <header className="quickTraceResultHero">
       <div className="quickTraceRatio">
         <strong>{String(confirmedCount).padStart(2,'0')}</strong>
         <i>/</i>
         <span>{String(checked).padStart(2,'0')}<small>confirmed / checked</small></span>
       </div>
       <div className="quickTraceResultCopy">
         <span>{label}</span>
         <h2>{result.authority?.caseName||result.authority?.citation||input}</h2>
         <p>{result.coverage?.language||confirmedCount+' confirmed in '+checked+' filing candidates checked'}</p>
         <div className="quickTraceFacts">
           <span><b>{summary?.uniqueDockets??0}</b> dockets</span>
           <span><b>{summary?.confirmedQuoteReuseCount??0}</b> quote reuse</span>
           <span><b>{summary?.candidateUnconfirmedCount??0}</b> unconfirmed</span>
         </div>
       </div>
     </header>

     <div className="quickTraceLedger">
       <div className="quickTraceLedgerHead">
         <span>DATE</span><span>FILING</span><span>DOCKET</span><span>RELATIONSHIP</span>
       </div>
       {confirmed.map(doc=><button key={doc.id} className="quickTraceRow" onClick={()=>setSelected(doc)}>
         <span>{dateLabel(doc.filingDate)}</span>
         <div><strong>{doc.title||'Public filing'}</strong><small>{doc.court||'Court unavailable'}</small></div>
         <div><strong>{doc.caseName||'Case unavailable'}</strong><small>{doc.docketNumber||'Docket unavailable'}</small></div>
         <span className="quickTraceRelationship">{doc.relationships?.some(r=>r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE)?'Citation + quote':relationshipLabel(doc.classification||RELATIONSHIP_STATE.CONFIRMED_CITATION)} <b>↗</b></span>
       </button>)}
       {!confirmed.length&&<div className="quickTraceZero">No confirmed occurrences found in the {checked} public filing candidates checked.</div>}
     </div>

     {(candidates.length>0||possible.length>0)&&<div className="quickTraceUncertain">
       {candidates.length>0&&<p><strong>{candidates.length}</strong> candidate{candidates.length===1?'':'s'} excluded from confirmed totals because available source text did not independently prove the dependency.</p>}
       {possible.length>0&&<p><strong>{possible.length}</strong> possible related proposition{possible.length===1?'':'s'} kept review-only.</p>}
     </div>}

     <footer className="quickTraceCoverage">
       <p>{result.coverage?.bounded?'Bounded search.':'Checked returned result set.'} RECALL checked {checked} filing candidates.{summary?.unknownDocketCount?' '+summary.unknownDocketCount+' confirmed filing'+(summary.unknownDocketCount===1?' has':'s have')+' docket metadata unavailable.':''}</p>
       {!recorded&&result.coverage?.bounded&&limit<50&&<button onClick={()=>{setLimit(50);void run(50)}} disabled={busy}>Check up to 50 candidates ↗</button>}
       {result.diagnostics&&<details><summary>Trace diagnostics</summary><div><span>CourtListener {result.diagnostics.courtlistenerRequests??0}</span><span>Firecrawl {result.diagnostics.firecrawlRequests??0}</span><span>Cache {result.diagnostics.cacheHits??0}</span></div></details>}
     </footer>
   </section>}

   {selected&&<div className="quickEvidenceBackdrop" onClick={()=>setSelected(null)}>
     <aside className="quickEvidenceSheet" onClick={e=>e.stopPropagation()}>
       <button className="quickEvidenceClose" onClick={()=>setSelected(null)}>×</button>
       <div className="quickEvidenceMeta">
         <span>PUBLIC FILING EVIDENCE</span>
         <h2>{selected.title||'Public filing'}</h2>
         <p>{selected.court||'Court unavailable'} · {selected.docketNumber||'Docket unavailable'} · {dateLabel(selected.filingDate)}</p>
       </div>

       <div className="quickEvidenceBody">
         {(selected.relationships?.length?selected.relationships:[selected.evidence?{classification:selected.classification||'',evidence:selected.evidence}:null].filter(Boolean) as any[]).map((relationship:any,index:number)=><section key={(relationship.classification||'relationship')+'-'+index}>
           <div className="quickEvidenceLabel"><span>{relationshipLabel(relationship.classification)}</span><small>{relationship.evidence?.confirmationSource||'SOURCE EVIDENCE'}</small></div>
           <blockquote>“{relationship.evidence?.raw}”</blockquote>
           <p>{relationship.evidence?.rule}</p>
           {relationship.evidence?.score!==undefined&&<p>Measured overlap: {Number(relationship.evidence.score).toFixed(3)}</p>}
           {relationship.evidence?.recordedProvenance&&<p>PDF p. {relationship.evidence.recordedProvenance.pdfPageNumber} · evidence SHA-256 <code>{relationship.evidence.recordedProvenance.evidenceSha256}</code></p>}
         </section>)}
       </div>

       <div className="quickEvidenceFooter">
         <div><span>CASE</span><strong>{selected.caseName||'Unavailable'}</strong></div>
         <div><span>QUERY</span><strong>{selected.searchQuery||'Recorded source capture'}</strong></div>
         {(selected.documentUrl||selected.sourceUrl)&&<a href={(selected.documentUrl||selected.sourceUrl)!} target="_blank" rel="noreferrer">Open public source ↗</a>}
       </div>
     </aside>
   </div>}
 </main>
}
