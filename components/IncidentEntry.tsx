'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';

type DependencyDraft={id:string;type:'AUTHORITY'|'QUOTATION';text:string};
type TraceResponse={
  ok:boolean;
  state?:string;
  statuses?:Array<{dependencyId:string;state:string;checked?:number;confirmed?:number;retryAfterMs?:number|null}>;
  documents?:Array<{id:string;title?:string;caseName?:string;court?:string;docketNumber?:string;documentUrl?:string;sourceUrl?:string}>;
  relationships?:Array<{id:string;dependencyId:string;filingId:string;state:string;evidence?:{raw?:string;rule?:string};publicSourceUrl?:string|null}>;
  summary?:{dependenciesTraced:number;confirmedAffectedFilings:number;confirmedRelationships:number;possibleRelationships:number;uniqueDockets:number};
  diagnostics?:{courtlistenerRequests?:number;firecrawlRequests?:number;cacheHits?:number};
};

const newDraft=(index:number):DependencyDraft=>({id:`dependency-${index}`,type:'AUTHORITY',text:''});

export default function IncidentEntry(){
  const [sourceUrl,setSourceUrl]=useState('');
  const [dependencies,setDependencies]=useState<DependencyDraft[]>([newDraft(1)]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [result,setResult]=useState<TraceResponse|null>(null);

  const usable=useMemo(()=>dependencies.filter(item=>item.text.trim()),[dependencies]);

  const update=(id:string,patch:Partial<DependencyDraft>)=>setDependencies(items=>items.map(item=>item.id===id?{...item,...patch}:item));
  const add=()=>setDependencies(items=>items.length>=10?items:[...items,newDraft(items.length+1)]);
  const remove=(id:string)=>setDependencies(items=>items.length===1?items:items.filter(item=>item.id!==id));

  const trace=async()=>{
    if(!usable.length){setError('Add at least one citation or quotation under review.');return}
    setBusy(true);setError('');setResult(null);
    try{
      const response=await fetch('/api/incident/trace',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({dependencies:usable.map(item=>({
          id:item.id,
          dependencyType:item.type,
          rawText:item.text.trim(),
          quotation:item.type==='QUOTATION'?item.text.trim():undefined
        }))})
      });
      const data=await response.json();
      if(!response.ok||!data.ok){setError(data.message||'Incident trace could not complete.');return}
      setResult(data);
    }catch{setError('Incident trace could not reach the public-source service.')}
    finally{setBusy(false)}
  };

  const documentById=new Map((result?.documents||[]).map(document=>[String(document.id),document]));

  return <main className="incidentEntry">
    <header className="productBar"><Link href="/" className="productWordmark">RECALL</Link><div className="productContext">Open incident</div><Link href="/trace" className="quietTopLink">Quick trace</Link></header>
    <section className="incidentEntryBody">
      <div className="entryEyebrow">LEGAL INCIDENT RESPONSE</div>
      <h1>Start with what was flagged.</h1>
      <p>Open the source-backed recorded incident, or create a review from dependencies you already know deserve investigation. RECALL traces impact; it does not decide that an authority is bad for you.</p>

      <Link className="featuredIncident" href="/incident/demo">
        <span>RECORDED PUBLIC INCIDENT</span>
        <strong>Johnson v. Dunn</strong>
        <p>N.D. Alabama · Five problematic citations identified across two motions</p>
        <em>Open incident →</em>
      </Link>

      <section className="manualIncidentBuilder" aria-labelledby="manual-incident-heading">
        <div className="manualIncidentHeading">
          <div><span>NEW INCIDENT</span><h2 id="manual-incident-heading">Trace dependencies already under review.</h2></div>
          <small>Up to 10 dependencies · public federal filing search</small>
        </div>

        <label className="incidentSourceInput">
          <span>INCIDENT SOURCE URL <em>optional · provenance only</em></span>
          <input value={sourceUrl} onChange={event=>setSourceUrl(event.target.value)} placeholder="https://… court order or public source"/>
        </label>

        <div className="manualDependencies">
          {dependencies.map((dependency,index)=><div className="manualDependencyRow" key={dependency.id}>
            <span className="manualNumber">{String(index+1).padStart(2,'0')}</span>
            <select value={dependency.type} onChange={event=>update(dependency.id,{type:event.target.value as DependencyDraft['type']})} aria-label={`Dependency ${index+1} type`}>
              <option value="AUTHORITY">Authority</option>
              <option value="QUOTATION">Quotation</option>
            </select>
            <input value={dependency.text} onChange={event=>update(dependency.id,{text:event.target.value})} placeholder={dependency.type==='AUTHORITY'?'e.g. 550 U.S. 544 or 2006 WL 8438651':'Paste the disputed quotation'} aria-label={`Dependency ${index+1}`}/>
            <button onClick={()=>remove(dependency.id)} aria-label={`Remove dependency ${index+1}`}>×</button>
          </div>)}
        </div>

        <div className="manualIncidentActions">
          <button className="addDependencyButton" onClick={add} disabled={dependencies.length>=10}>+ Add dependency</button>
          <button className="traceImpactButton" onClick={trace} disabled={busy||!usable.length}>{busy?`Tracing ${usable.length} dependenc${usable.length===1?'y':'ies'}…`:'Trace impact →'}</button>
        </div>
        {sourceUrl&&<p className="manualSourceNote">Source URL is preserved as incident context only. RECALL does not treat the URL itself as proof.</p>}
        {error&&<div className="manualTraceError" role="alert">{error}</div>}
      </section>

      {result?.summary&&<section className="manualIncidentResult" aria-live="polite">
        <div className="sectionHeading">
          <div><span>IMPACT</span><h2>{result.summary.confirmedRelationships} confirmed relationships</h2></div>
          <div className="manualResultMeta">{result.summary.confirmedAffectedFilings} filings · {result.summary.uniqueDockets} identified dockets</div>
        </div>

        <div className="manualResultRows">
          {(result.relationships||[]).map(relationship=>{
            const document=documentById.get(String(relationship.filingId));
            const dependency=usable.find(item=>item.id===relationship.dependencyId);
            return <article key={relationship.id}>
              <div><span>{relationship.state==='POSSIBLE_RELATED_PROPOSITION'?'REVIEW':'CONFIRMED'}</span><strong>{dependency?.text||relationship.dependencyId}</strong></div>
              <div><strong>{document?.title||document?.caseName||'Public filing'}</strong><small>{document?.court||'Court unavailable'}{document?.docketNumber?` · ${document.docketNumber}`:''}</small></div>
              <div><blockquote>{relationship.evidence?.raw||'Evidence available in source detail.'}</blockquote>{relationship.publicSourceUrl&&<a href={relationship.publicSourceUrl} target="_blank" rel="noreferrer">Public source ↗</a>}</div>
            </article>
          })}
          {!result.relationships?.length&&<p className="emptyState">No confirmed or review-only relationships were found in the checked public-source candidates.</p>}
        </div>

        {result.diagnostics&&<details className="manualDiagnostics"><summary>Trace diagnostics</summary><div><span>CourtListener requests <b>{result.diagnostics.courtlistenerRequests??0}</b></span><span>Firecrawl requests <b>{result.diagnostics.firecrawlRequests??0}</b></span><span>Cache hits <b>{result.diagnostics.cacheHits??0}</b></span></div></details>}
      </section>}
    </section>
  </main>
}
