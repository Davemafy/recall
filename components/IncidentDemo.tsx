/* eslint-disable @next/next/no-img-element */
'use client';

import {useMemo,useState} from 'react';
import CockpitShell,{SummaryCards} from './CockpitShell';
// @ts-ignore shared recorded incident fixture
import {getRecordedIncident,JOHNSON_DUNN_ORDER_URL} from '../lib/recorded-incident.mjs';
// @ts-ignore shared domain labels
import {relationshipLabel} from '../lib/domain.mjs';
import {FIGMA_ASSETS_B} from '../lib/figma-assets-b';

type Dependency={
  id:string; rawText:string; canonicalCitation?:string; caseName?:string; incidentFinding?:string;
  incidentEvidence:{exactText:string;pdfPageNumber?:number;sha256:string;sourceUrl:string};
};
type Filing={
  id:string; documentNumber:string; title:string; filingDate:string; docketNumber:string; caseName:string; court:string;
  sourceUrl:string; evidenceSourceUrl:string; evidenceLocation:string; dependencyIds:string[];
};
type Relationship={
  id:string; dependencyId:string; filingId:string; state:string;
  evidence:{exactText:string;sourceUrl:string;sourceType:string;location:string;explanation:string};
};

const dateLabel=(value:string)=>new Intl.DateTimeFormat('en',{year:'numeric',month:'short',day:'2-digit'}).format(new Date(value));

export default function IncidentDemo(){
  const data=useMemo(()=>getRecordedIncident(),[]);
  const dependencies=data.dependencies as Dependency[];
  const filings=data.filings as Filing[];
  const relationships=data.relationships as Relationship[];

  const [traced,setTraced]=useState(false);
  const [selected,setSelected]=useState<{dependency:Dependency;filing?:Filing;relationship?:Relationship}>(()=>({
    dependency:dependencies[0],
    filing:filings.find(f=>f.dependencyIds.includes(dependencies[0].id)),
    relationship:relationships.find(r=>r.dependencyId===dependencies[0].id)
  }));
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [showProvenance,setShowProvenance]=useState(false);

  const openDependency=(dependency:Dependency)=>{
    const relationship=relationships.find(r=>r.dependencyId===dependency.id);
    const filing=relationship?filings.find(f=>f.id===relationship.filingId):undefined;
    setSelected({dependency,filing,relationship});
    setShowProvenance(false);
  };
  const openRelationship=(relationship:Relationship)=>{
    const dependency=dependencies.find(d=>d.id===relationship.dependencyId)!;
    const filing=filings.find(f=>f.id===relationship.filingId);
    setSelected({dependency,filing,relationship});
    setShowProvenance(false);
    setDrawerOpen(true);
  };

  return <CockpitShell
    pageTitle="Johnson v. Dunn"
    heading="Incident"
    code="#JD–01701"
    status="Recorded public incident"
    action={<button className={'fc-metal-button '+(traced?'is-done':'')} onClick={()=>setTraced(true)}>{traced?'Impact traced':'Trace impact'}</button>}
  >
    <SummaryCards items={[
      {label:'Disputed Dependencies',value:'05'},
      {label:'Affected Filings',value:traced?'02':'—'},
      {label:'Confirmed Relations',value:traced?'05':'—',icon:'vertical'},
      {label:'Dockets',value:traced?'01':'—',icon:'vertical'}
    ]}/>

    <section className="fc-timeline">
      <header className="fc-panel-heading">
        <div><h2>Incident Timeline</h2><small>Recorded public source · {data.incident.court}</small></div>
        <button className="fc-more" aria-label="Open source order" onClick={()=>window.open(JOHNSON_DUNN_ORDER_URL,'_blank')}><img src={FIGMA_ASSETS_B.ellipsis} alt=""/></button>
      </header>
      <div className="fc-timeline-plot">
        <div className="fc-time-labels" aria-hidden>
          {['07 MAY','12 MAY','23 JUL','SOURCE','DEP 01','DEP 02','DEP 03','DEP 04','DEP 05','DOC 174','DOC 182','EVID.'].map((label,index)=><span key={index}>{label}</span>)}
        </div>
        <div className="fc-time-grid" aria-hidden>{Array.from({length:12}).map((_,i)=><i key={i}/>)}</div>
        <div className="fc-now-line" aria-hidden><span>{traced?'TRACED':'READY'}</span><i/></div>
        <article className="fc-event event-a"><b/><div><strong>Document 174 filed</strong><small>4 disputed authorities</small></div></article>
        <article className="fc-event event-b purple"><b/><div><strong>Document 182 filed</strong><small>1 disputed authority</small></div></article>
        <article className="fc-event event-c"><b/><div><strong>Sanctions order identifies 5 citations</strong><small>{dateLabel(data.incident.sourceDate)}</small></div></article>
        <article className={'fc-event event-d '+(traced?'is-hot':'')}><b/><div><strong>{traced?'5 confirmed relationships':'Impact trace ready'}</strong><small>{traced?'2 affected motions · 1 docket':'Run the deterministic trace'}</small></div></article>
      </div>
    </section>

    <section className="fc-insights">
      <section className="fc-panel fc-dependency-panel">
        <header className="fc-panel-heading compact"><div><h2>Disputed Dependencies</h2><small>05 from court source</small></div><span className="fc-filter">All <img src={FIGMA_ASSETS_B.chevron} alt=""/></span></header>
        <div className="fc-dependency-list">
          {dependencies.map((dependency)=><button
            key={dependency.id}
            className={'fc-dependency-row '+(selected.dependency.id===dependency.id?'is-selected':'')}
            onClick={()=>{openDependency(dependency);setDrawerOpen(true)}}
            aria-label={'Inspect '+(dependency.caseName||dependency.rawText)}
          >
            <div><strong>{dependency.caseName||dependency.rawText}</strong><small>{dependency.canonicalCitation||dependency.rawText}</small></div>
            <span className="fc-flag">Flagged</span>
          </button>)}
        </div>
      </section>

      <section className="fc-panel fc-dot-panel">
        <header className="fc-panel-heading compact">
          <div><h2>Affected Filings</h2><small role="status">{traced?'5 confirmed relationships':'Trace not run'}</small></div>
          <strong className="fc-panel-total">{traced?'05':'—'}</strong>
        </header>
        <div className="fc-dot-map" role="region" aria-label="Dependency by filing matrix">
          <div className="fc-dot-row-labels" aria-hidden>
            {dependencies.map((_,index)=><span key={index}>{String(index+1).padStart(2,'0')}</span>)}
          </div>
          <div className="fc-dot-guides" aria-hidden>{Array.from({length:4}).map((_,i)=><i key={i}/>)}</div>
          <div className="fc-dots">
            {Array.from({length:60}).map((_,index)=>{
              const row=Math.floor(index/12);
              const column=index%12;
              const dependency=dependencies[row];
              const relationship=relationships.find(item=>item.dependencyId===dependency?.id);
              const filing=relationship?filings.find(item=>item.id===relationship.filingId):undefined;
              const hitColumn=filing?.documentNumber==='174'?6:filing?.documentNumber==='182'?9:-1;
              const isHit=Boolean(traced&&relationship&&column===hitColumn);
              return isHit&&relationship
                ?<button
                    key={index}
                    className={'fc-dot is-hot '+(selected.relationship?.id===relationship.id?'is-selected':'')}
                    aria-label={(dependency?.caseName||'Dependency')+' — Confirmed citation — Document '+(filing?.documentNumber||'')}
                    onClick={()=>openRelationship(relationship)}
                  />
                :<i key={index} className="fc-dot"/>;
            })}
          </div>
          <div className="fc-dot-axis"><span>Source</span><span>Doc 174</span><span>Doc 182</span><span>Evidence</span></div>
        </div>
      </section>

      <section className="fc-panel fc-stream-panel">
        <header className="fc-panel-heading compact">
          <div><h2>Evidence Trace</h2><small>{selected.dependency.caseName}</small></div>
          <strong className="fc-panel-total">{traced?'5/5':'—'}</strong>
        </header>
        <button className="fc-stream-chart" onClick={()=>traced&&setDrawerOpen(true)} aria-label="Open selected exact evidence" disabled={!traced}>
          <span className="fc-stream-atmosphere"/>
          <span className="fc-stream-guides">{Array.from({length:5}).map((_,i)=><i key={i}/>)}</span>
          <img className="fc-stream outer" src={FIGMA_ASSETS_B.streamOuter} alt=""/>
          <img className="fc-stream middle" src={FIGMA_ASSETS_B.streamMiddle} alt=""/>
          <img className="fc-stream core" src={FIGMA_ASSETS_B.streamCore} alt=""/>
          <span className="fc-stream-tag t1">INCIDENT</span>
          <span className="fc-stream-tag t2">{selected.filing?'DOC '+selected.filing.documentNumber:'FILING'}</span>
          <span className="fc-stream-tag t3">{traced?'EXACT':'READY'}</span>
          <span className="fc-stream-axis"><i>Source</i><i>Dependency</i><i>Filing</i><i>Evidence</i></span>
        </button>
      </section>
    </section>

    {drawerOpen&&<div className="fc-drawer-backdrop" onClick={()=>setDrawerOpen(false)}>
      <aside className="fc-drawer" onClick={event=>event.stopPropagation()}>
        <button className="fc-drawer-close" onClick={()=>setDrawerOpen(false)}>×</button>
        <div className="fc-drawer-kicker">EXACT EVIDENCE / SELECTED</div>
        <h2>{selected.dependency.caseName||selected.dependency.rawText}</h2>
        <p className="fc-drawer-citation">{selected.dependency.canonicalCitation||selected.dependency.rawText}</p>

        <section className="fc-evidence-block">
          <div><span>INCIDENT SOURCE</span><small>01</small></div>
          <blockquote>“{selected.dependency.incidentEvidence.exactText}”</blockquote>
          {selected.dependency.incidentFinding&&<p className="recallXFindingText">{selected.dependency.incidentFinding}</p>}
          <a href={selected.dependency.incidentEvidence.sourceUrl} target="_blank" rel="noreferrer">Court order ↗</a>
        </section>

        <section className="fc-evidence-block">
          <div><span>AFFECTED WORK</span><small>02</small></div>
          {traced&&selected.relationship&&selected.filing?<>
            <h3>{selected.filing.title}</h3>
            <blockquote>“{selected.relationship.evidence.exactText}”</blockquote>
            <p>{selected.relationship.evidence.location}. {selected.relationship.evidence.explanation}</p>
            <a href={selected.relationship.evidence.sourceUrl} target="_blank" rel="noreferrer">Public source ↗</a>
          </>:<p>Trace impact to resolve the downstream filing evidence.</p>}
        </section>

        <div className="fc-provenance">
          <button onClick={()=>setShowProvenance(value=>!value)} aria-expanded={showProvenance}>Provenance <span>{showProvenance?'−':'+'}</span></button>
          {showProvenance&&<dl>
            <div><dt>Relationship</dt><dd>{selected.relationship?relationshipLabel(selected.relationship.state):'Incident dependency'}</dd></div>
            <div><dt>Incident evidence SHA-256</dt><dd><code>{selected.dependency.incidentEvidence.sha256}</code></dd></div>
            <div><dt>Capture date</dt><dd>{data.capturedAt}</dd></div>
            <div><dt>Mode</dt><dd>Recorded public incident</dd></div>
          </dl>}
        </div>
      </aside>
    </div>}
  </CockpitShell>
}
