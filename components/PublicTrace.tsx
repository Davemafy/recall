'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import CockpitShell,{SummaryCards} from './CockpitShell';
import {downloadJson,loadPreferences,recordActivity} from '../lib/recall-client';
// @ts-ignore recorded source fixture
import {getRecordedPublicTrace,recordedEvidenceFor} from '../lib/recorded-public-trace.mjs';
// @ts-ignore relationship constants
import {RELATIONSHIP_STATE,relationshipLabel} from '../lib/domain.mjs';

type TraceDoc={id:string;title?:string|null;docketId?:string|null;docketNumber?:string|null;caseName?:string|null;court?:string|null;filingDate?:string|null;sourceUrl?:string|null;documentUrl?:string|null;snippet?:string;text?:string;classification?:string;evidence?:any;relationships?:Array<{classification:string;evidence:any}>;searchQuery?:string|null;contentHash?:string;retrievedAt?:string;sourceCapture?:any};
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
   const relationships=edges.map((edge:any)=>{const captured=recordedEvidenceFor(d,edge.type);return{classification:edge.type,evidence:captured?{raw:captured.text,rule:edge.evidence?.rule,score:edge.evidence?.score,confirmationSource:'RECORDED_EXACT_SOURCE_SPAN',recordedProvenance:captured.provenance}:edge.evidence}});
   const primary=relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.CONFIRMED_CITATION)||relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.CONFIRMED_QUOTE)||relationships.find((r:any)=>r.classification===RELATIONSHIP_STATE.POSSIBLE);
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
 const [limit,setLimit]=useState<25|50>(25);
 const requestRef=useRef<AbortController|null>(null);

 useEffect(()=>{
   if(!recorded) setLimit(loadPreferences().traceLimit);
   return()=>requestRef.current?.abort();
 },[recorded]);

 const run=async(nextLimit:25|50=limit)=>{
   requestRef.current?.abort();
   const controller=new AbortController();
   requestRef.current=controller;
   setBusy(true);setError(null);setSelected(null);
   try{
     const res=await fetch('/api/trace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input,quote,maxCandidates:nextLimit}),signal:controller.signal});
     const data=await res.json();
     if(!res.ok||!data.ok){setResult(null);setError({message:data.message||'Live public-source trace failed.',state:data.state,retryAfterMs:data.retryAfterMs});return}
     setResult(data);
     const checkedCount=data.summary?.checkedCount??data.documents?.length??0;
     const confirmedCount=data.summary?.confirmedFilingCount??0;
     recordActivity({
       kind:'TRACE',
       title:data.authority?.caseName||input.trim()||'Public trace',
       subtitle:data.authority?.citation||input.trim()||'Citation unavailable',
       confirmed:confirmedCount,
       checked:checkedCount,
       dockets:data.summary?.uniqueDockets??0,
       href:'/trace?q='+encodeURIComponent(input.trim())
     });
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
 const checked=summary?.checkedCount??docs.length;
 const confirmedCount=summary?.confirmedFilingCount??0;
 const sourceLabel=recorded?'RECORDED PUBLIC TRACE':result?.sourceState==='CACHED'?'CACHED PUBLIC SOURCE':'LIVE PUBLIC SOURCE';

 const exportResult=()=>result&&downloadJson('recall-public-trace.json',{
   authority:result.authority,
   sourceState:result.sourceState,
   retrievedAt:result.retrievedAt,
   coverage:result.coverage,
   summary:result.summary,
   documents:result.documents,
   diagnostics:result.diagnostics
 });

 const action=recorded
   ?result?<button className="fc-secondary-button" onClick={exportResult}>Export trace</button>:undefined
   :<div className="fc-action-row">{result&&<button className="fc-secondary-button" onClick={exportResult}>Export result</button>}<button className="fc-metal-button" onClick={()=>run(limit)} disabled={busy}>{busy?'Tracing…':'Trace real filings'}</button></div>;

 return <CockpitShell pageTitle="Quick trace" heading="Trace" code="#PUBLIC" status="CourtListener / RECAP" action={action}>
   <SummaryCards items={[
     {label:'Confirmed Filings',value:result?String(confirmedCount).padStart(2,'0'):'—'},
     {label:'Candidates Checked',value:result?String(checked).padStart(2,'0'):'—'},
     {label:'Dockets',value:result?String(summary?.uniqueDockets??0).padStart(2,'0'):'—',icon:'vertical'},
     {label:'Unconfirmed',value:result?String(summary?.candidateUnconfirmedCount??0).padStart(2,'0'):'—',icon:'vertical'}
   ]}/>

   <section className="fc-timeline fc-trace-panel">
     <header className="fc-panel-heading"><div><h2>{recorded?'Recorded public trace':'Public filing search'}</h2><small>Search result ≠ confirmation · deterministic source evidence only</small></div>{result&&<span className="fc-state-chip">{sourceLabel}</span>}</header>
     <div className="fc-trace-form">
       {!recorded?<><label><span>CITATION OR CASE + CITATION</span><input value={input} onChange={e=>setInput(e.target.value)} placeholder="410 U.S. 113"/></label><label><span>DISPUTED QUOTATION <em>optional · never saved in activity history</em></span><textarea value={quote} onChange={e=>setQuote(e.target.value)} placeholder="Paste exact disputed language if quotation reuse matters"/></label></>:<div className="fc-recorded-note"><span>CAPTURED</span><strong>{dateLabel(result?.capturedAt)}</strong><p>Exact captured source excerpts and evidence spans are SHA-256 hashed.</p></div>}
       {busy&&<div className="fc-progress"><i/>Checking filing candidates and confirming source text…</div>}
       {error&&<div className="fc-error" role="alert"><strong>{error.state==='RATE_LIMITED'?'RATE LIMITED':'SOURCE UNAVAILABLE'}</strong><p>{error.message}</p><Link href="/incident/demo">Open recorded incident ↗</Link></div>}
     </div>
   </section>

   <section className="fc-insights fc-trace-insights">
     <section className="fc-panel fc-trace-results">
       <header className="fc-panel-heading compact"><div><h2>{result?.authority?.caseName||result?.authority?.citation||'Confirmed occurrences'}</h2><small>{result?.coverage?.language||'Run a trace to resolve public filing evidence.'}</small></div><strong className="fc-panel-total">{result?String(confirmedCount).padStart(2,'0'):'—'}</strong></header>
       <div className="fc-trace-list">
         {confirmed.slice(0,6).map(doc=><button key={doc.id} onClick={()=>setSelected(doc)}><span>{dateLabel(doc.filingDate)}</span><div><strong>{doc.title||'Public filing'}</strong><small>{doc.caseName||'Case unavailable'} · {doc.docketNumber||'Docket unavailable'}</small></div><b>↗</b></button>)}
         {result&&!confirmed.length&&<p>No confirmed occurrences found in the {checked} candidates checked.</p>}
         {!result&&<p>Confirmed filing evidence will appear here.</p>}
       </div>
     </section>

     <section className="fc-panel fc-trace-coverage">
       <header className="fc-panel-heading compact"><div><h2>Coverage</h2><small>{sourceLabel}</small></div></header>
       <div className="fc-callout-body">
         <p>{result?.coverage?.bounded?'Bounded search.':'Checked returned result set.'} {result?'RECALL checked '+checked+' filing candidates.':'CourtListener / RECAP is queried only after you start the trace.'}</p>
         {(candidates.length>0||possible.length>0)&&<p>{candidates.length} unconfirmed · {possible.length} review-only.</p>}
         {!recorded&&result?.coverage?.bounded&&limit<50&&<button className="fc-inline-button" onClick={()=>{setLimit(50);void run(50)}} disabled={busy}>Check up to 50 ↗</button>}
       </div>
     </section>

     <section className="fc-panel fc-trace-diagnostics">
       <header className="fc-panel-heading compact"><div><h2>Diagnostics</h2><small>Transport visibility</small></div></header>
       <div className="fc-diagnostic-grid">
         <div><strong>{result?.diagnostics?.courtlistenerRequests??0}</strong><span>CourtListener</span></div>
         <div><strong>{result?.diagnostics?.firecrawlRequests??0}</strong><span>Firecrawl</span></div>
         <div><strong>{result?.diagnostics?.cacheHits??0}</strong><span>Cache</span></div>
       </div>
     </section>
   </section>

   {selected&&<div className="fc-drawer-backdrop" onClick={()=>setSelected(null)}><aside className="fc-drawer" onClick={e=>e.stopPropagation()}>
     <button className="fc-drawer-close" onClick={()=>setSelected(null)}>×</button>
     <div className="fc-drawer-kicker">PUBLIC FILING EVIDENCE</div><h2>{selected.title||'Public filing'}</h2><p className="fc-drawer-citation">{selected.court||'Court unavailable'} · {selected.docketNumber||'Docket unavailable'} · {dateLabel(selected.filingDate)}</p>
     {(selected.relationships?.length?selected.relationships:[selected.evidence?{classification:selected.classification||'',evidence:selected.evidence}:null].filter(Boolean) as any[]).map((relationship:any,index:number)=><section className="fc-evidence-block" key={(relationship.classification||'relationship')+'-'+index}><div><span>{relationshipLabel(relationship.classification)}</span><small>{relationship.evidence?.confirmationSource||'SOURCE EVIDENCE'}</small></div><blockquote>“{relationship.evidence?.raw}”</blockquote><p>{relationship.evidence?.rule}</p>{relationship.evidence?.recordedProvenance&&<p>PDF p. {relationship.evidence.recordedProvenance.pdfPageNumber} · evidence SHA-256 <code>{relationship.evidence.recordedProvenance.evidenceSha256}</code></p>}</section>)}
     {(selected.documentUrl||selected.sourceUrl)&&<a className="fc-drawer-source" href={(selected.documentUrl||selected.sourceUrl)!} target="_blank" rel="noreferrer">Open public source ↗</a>}
   </aside></div>}
 </CockpitShell>
}
