'use client';

import {useMemo,useState} from 'react';
import CockpitShell,{SummaryCards} from './CockpitShell';
import {downloadCsv,downloadJson} from '../lib/recall-client';
// @ts-ignore recorded public fixture
import {getRecordedIncident,JOHNSON_DUNN_ORDER_URL} from '../lib/recorded-incident.mjs';
// @ts-ignore relationship labels
import {relationshipLabel} from '../lib/domain.mjs';

type FilingFilter='ALL'|'174'|'182';

export default function EvidenceLedger(){
  const data=useMemo(()=>getRecordedIncident(),[]);
  const [query,setQuery]=useState('');
  const [filing,setFiling]=useState<FilingFilter>('ALL');
  const [selected,setSelected]=useState<any>(null);

  const rows=useMemo(()=>data.relationships.map((relationship:any)=>{
    const dependency=data.dependencies.find((item:any)=>item.id===relationship.dependencyId);
    const filingRecord=data.filings.find((item:any)=>item.id===relationship.filingId);
    return {relationship,dependency,filing:filingRecord};
  }).filter((row:any)=>{
    const matchesFiling=filing==='ALL'||row.filing?.documentNumber===filing;
    const text=[row.dependency?.caseName,row.dependency?.canonicalCitation,row.filing?.title,row.filing?.evidenceLocation].join(' ').toLowerCase();
    return matchesFiling&&text.includes(query.trim().toLowerCase());
  }),[data,query,filing]);

  const exportRows=data.relationships.map((relationship:any)=>{
    const dependency=data.dependencies.find((item:any)=>item.id===relationship.dependencyId);
    const filingRecord=data.filings.find((item:any)=>item.id===relationship.filingId);
    return {
      dependency:dependency?.caseName||dependency?.rawText,
      citation:dependency?.canonicalCitation||dependency?.rawText,
      relationship:relationshipLabel(relationship.state),
      filing:'Dkt. '+(filingRecord?.documentNumber||''),
      filingTitle:filingRecord?.title,
      evidenceLocation:relationship.evidence.location,
      evidence:relationship.evidence.exactText,
      incidentFinding:dependency?.incidentFinding,
      sourceUrl:relationship.evidence.sourceUrl,
      incidentEvidenceSha256:dependency?.incidentEvidence?.sha256
    };
  });

  return <CockpitShell
    pageTitle="Evidence"
    heading="Evidence ledger"
    code="#05"
    status="Recorded exact-source evidence"
    action={<div className="fc-action-row"><button className="fc-secondary-button" onClick={()=>downloadCsv('recall-johnson-dunn-evidence.csv',exportRows)}>Export CSV</button><button className="fc-metal-button" onClick={()=>downloadJson('recall-johnson-dunn-evidence.json',{incident:data.incident,rows:exportRows,capturedAt:data.capturedAt})}>Export JSON</button></div>}
  >
    <SummaryCards items={[
      {label:'Evidence Relations',value:'05'},
      {label:'Affected Filings',value:'02'},
      {label:'Source Pages',value:'02',icon:'vertical'},
      {label:'Unique Dockets',value:'01',icon:'vertical'}
    ]}/>

    <section className="fc-product-surface">
      <header className="fc-product-toolbar">
        <div><h2>Confirmed relationship evidence</h2><small>Every row resolves to an incident-source finding and an affected filing location.</small></div>
        <div className="fc-product-tools">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search case, citation, filing…"/>
          <select value={filing} onChange={e=>setFiling(e.target.value as FilingFilter)} aria-label="Filter by filing">
            <option value="ALL">All filings</option>
            <option value="174">Dkt. 174</option>
            <option value="182">Dkt. 182</option>
          </select>
        </div>
      </header>

      <div className="fc-table-shell">
        <div className="fc-table-head fc-evidence-grid">
          <span>DEPENDENCY</span><span>RELATIONSHIP</span><span>FILING</span><span>LOCATION</span><span>PROVENANCE</span><span/>
        </div>
        <div className="fc-table-body">
          {rows.map((row:any)=><button className="fc-table-row fc-evidence-grid" key={row.relationship.id} onClick={()=>setSelected(row)}>
            <div><strong>{row.dependency.caseName}</strong><small>{row.dependency.canonicalCitation}</small></div>
            <span className="fc-table-status is-recorded">{relationshipLabel(row.relationship.state)}</span>
            <div><strong>Dkt. {row.filing.documentNumber}</strong><small>{row.filing.title}</small></div>
            <span>{row.relationship.evidence.location}</span>
            <code>{row.dependency.incidentEvidence.sha256.slice(0,12)}…</code>
            <b>Inspect ↗</b>
          </button>)}
          {!rows.length&&<div className="fc-empty-state"><strong>No evidence rows match.</strong><p>Clear the search or change the filing filter.</p></div>}
        </div>
      </div>
    </section>

    <section className="fc-product-footer-grid">
      <article><span>INCIDENT SOURCE</span><strong>Sanctions Order · Dkt. 204</strong><p>{data.incident.sourceExcerpt.exactText}</p><a href={JOHNSON_DUNN_ORDER_URL} target="_blank" rel="noreferrer">Open source order ↗</a></article>
      <article><span>EVIDENCE RULE</span><strong>Exact source span required</strong><p>Search hits, semantic similarity, and unresolved source text never enter confirmed totals.</p></article>
      <article><span>CAPTURE</span><strong>{data.capturedAt}</strong><p>Recorded evidence spans carry SHA-256 provenance for repeatable demo verification.</p></article>
    </section>

    {selected&&<div className="fc-drawer-backdrop" onClick={()=>setSelected(null)}>
      <aside className="fc-drawer" onClick={event=>event.stopPropagation()}>
        <button className="fc-drawer-close" onClick={()=>setSelected(null)}>×</button>
        <div className="fc-drawer-kicker">RELATIONSHIP EVIDENCE</div>
        <h2>{selected.dependency.caseName}</h2>
        <p className="fc-drawer-citation">{selected.dependency.canonicalCitation} · Dkt. {selected.filing.documentNumber}</p>
        <section className="fc-evidence-block">
          <div><span>INCIDENT SOURCE</span><small>PDF p. {selected.dependency.incidentEvidence.pdfPageNumber}</small></div>
          <blockquote>“{selected.dependency.incidentEvidence.exactText}”</blockquote>
          <p>{selected.dependency.incidentFinding}</p>
          <a href={selected.dependency.incidentEvidence.sourceUrl} target="_blank" rel="noreferrer">Court order ↗</a>
        </section>
        <section className="fc-evidence-block">
          <div><span>AFFECTED FILING</span><small>{selected.relationship.evidence.location}</small></div>
          <h3>{selected.filing.title}</h3>
          <blockquote>“{selected.relationship.evidence.exactText}”</blockquote>
          <p>{selected.relationship.evidence.explanation}</p>
          <a href={selected.relationship.evidence.sourceUrl} target="_blank" rel="noreferrer">Public evidence source ↗</a>
        </section>
        <section className="fc-provenance-block">
          <span>PROVENANCE SHA-256</span>
          <code>{selected.dependency.incidentEvidence.sha256}</code>
        </section>
      </aside>
    </div>}
  </CockpitShell>
}
