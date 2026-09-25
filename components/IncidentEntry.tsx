'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';
import CockpitShell,{SummaryCards} from './CockpitShell';

type DependencyDraft={id:string;type:'AUTHORITY'|'QUOTATION';text:string};
type TraceResponse={
  ok:boolean; state?:string;
  documents?:Array<{id:string;title?:string;caseName?:string;court?:string;docketNumber?:string;documentUrl?:string;sourceUrl?:string}>;
  relationships?:Array<{id:string;dependencyId:string;filingId:string;state:string;evidence?:{raw?:string;rule?:string};publicSourceUrl?:string|null}>;
  summary?:{dependenciesTraced:number;confirmedAffectedFilings:number;confirmedRelationships:number;possibleRelationships:number;uniqueDockets:number};
  diagnostics?:{courtlistenerRequests?:number;firecrawlRequests?:number;cacheHits?:number};
};
const newDraft=(index:number):DependencyDraft=>({id:'dependency-'+index,type:'AUTHORITY',text:''});

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
      const response=await fetch('/api/incident/trace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dependencies:usable.map(item=>({id:item.id,dependencyType:item.type,rawText:item.text.trim(),quotation:item.type==='QUOTATION'?item.text.trim():undefined}))})});
      const data=await response.json();
      if(!response.ok||!data.ok){setError(data.message||'Incident trace could not complete.');return}
      setResult(data);
    }catch{setError('Incident trace could not reach the public-source service.')}
    finally{setBusy(false)}
  };

  const documentById=new Map((result?.documents||[]).map(document=>[String(document.id),document]));

  return <CockpitShell pageTitle="New incident" heading="Incident" code="#OPEN" status="Public federal filing search" action={<button className="fc-metal-button" onClick={trace} disabled={busy||!usable.length}>{busy?'Tracing…':'Trace impact'}</button>}>
    <SummaryCards items={[
      {label:'Dependencies Ready',value:String(usable.length).padStart(2,'0')},
      {label:'Affected Filings',value:result?.summary?String(result.summary.confirmedAffectedFilings).padStart(2,'0'):'—'},
      {label:'Confirmed Relations',value:result?.summary?String(result.summary.confirmedRelationships).padStart(2,'0'):'—',icon:'vertical'},
      {label:'Dockets',value:result?.summary?String(result.summary.uniqueDockets).padStart(2,'0'):'—',icon:'vertical'}
    ]}/>

    <section className="fc-timeline fc-builder-panel">
      <header className="fc-panel-heading">
        <div><h2>Dependencies under review</h2><small>Up to 10 · search results remain candidates until source text confirms them</small></div>
        <span className="fc-state-chip">{busy?'TRACING':'READY'}</span>
      </header>
      <div className="fc-builder-body">
        <label className="fc-field">
          <span>INCIDENT SOURCE URL <em>optional · provenance only</em></span>
          <input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://… court order or public source"/>
        </label>
        <div className="fc-builder-head"><span>#</span><span>TYPE</span><span>DEPENDENCY</span><span/></div>
        {dependencies.map((dependency,index)=><div className="fc-builder-row" key={dependency.id}>
          <span>{String(index+1).padStart(2,'0')}</span>
          <select value={dependency.type} onChange={e=>update(dependency.id,{type:e.target.value as DependencyDraft['type']})} aria-label={'Dependency '+(index+1)+' type'}><option value="AUTHORITY">Authority</option><option value="QUOTATION">Quotation</option></select>
          <input value={dependency.text} onChange={e=>update(dependency.id,{text:e.target.value})} placeholder={dependency.type==='AUTHORITY'?'550 U.S. 544 or 2006 WL 8438651':'Paste disputed quotation'} aria-label={'Dependency '+(index+1)}/>
          <button onClick={()=>remove(dependency.id)} aria-label={'Remove dependency '+(index+1)}>×</button>
        </div>)}
        <div className="fc-builder-actions"><button onClick={add} disabled={dependencies.length>=10}>+ Add dependency</button><span>{usable.length} ready</span></div>
        {sourceUrl&&<p className="fc-inline-note">Source URL is incident context only. The URL itself is never treated as proof.</p>}
        {error&&<div className="fc-error" role="alert">{error}</div>}
      </div>
    </section>

    <section className="fc-insights fc-entry-insights">
      <section className="fc-panel">
        <header className="fc-panel-heading compact"><div><h2>Recorded Incident</h2><small>Public replay</small></div><strong className="fc-panel-total">05</strong></header>
        <div className="fc-callout-body"><strong>Johnson v. Dunn</strong><p>N.D. Alabama · five problematic citations across two motions.</p><Link href="/incident/demo">Open recorded incident ↗</Link></div>
      </section>
      <section className="fc-panel">
        <header className="fc-panel-heading compact"><div><h2>Confirmation Law</h2><small>Deterministic first</small></div></header>
        <div className="fc-callout-body"><p>Search hit ≠ confirmation. A relationship becomes confirmed only when available source text independently proves the citation or quotation occurrence.</p></div>
      </section>
      <section className="fc-panel">
        <header className="fc-panel-heading compact"><div><h2>Trace Output</h2><small>{result?.summary?'Completed':'Awaiting run'}</small></div></header>
        <div className="fc-result-list">
          {(result?.relationships||[]).slice(0,5).map(rel=>{const doc=documentById.get(String(rel.filingId));const dep=usable.find(d=>d.id===rel.dependencyId);return <article key={rel.id}><span>{rel.state==='POSSIBLE_RELATED_PROPOSITION'?'REVIEW':'CONFIRMED'}</span><div><strong>{dep?.text||rel.dependencyId}</strong><small>{doc?.title||doc?.caseName||'Public filing'}</small></div></article>})}
          {!result?.relationships?.length&&<p>No relationship evidence yet.</p>}
        </div>
      </section>
    </section>
  </CockpitShell>
}
