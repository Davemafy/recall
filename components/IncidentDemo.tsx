'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';
// @ts-ignore Recorded incident fixture is shared with Node benchmark tests.
import {getRecordedIncident,JOHNSON_DUNN_ORDER_URL} from '../lib/recorded-incident.mjs';
// @ts-ignore Centralized domain labels.
import {relationshipLabel} from '../lib/domain.mjs';

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

const dateLabel=(value:string)=>new Intl.DateTimeFormat('en',{year:'numeric',month:'short',day:'numeric'}).format(new Date(value));

export default function IncidentDemo(){
  const data=useMemo(()=>getRecordedIncident(),[]);
  const dependencies=data.dependencies as Dependency[];
  const filings=data.filings as Filing[];
  const relationships=data.relationships as Relationship[];

  const [traced,setTraced]=useState(false);
  const [showProvenance,setShowProvenance]=useState(false);
  const [selected,setSelected]=useState<{dependency:Dependency;filing?:Filing;relationship?:Relationship}>(()=>({
    dependency:dependencies[0],
    filing:filings.find(f=>f.dependencyIds.includes(dependencies[0].id)),
    relationship:relationships.find(r=>r.dependencyId===dependencies[0].id)
  }));

  const relationFor=(dependencyId:string,filingId:string)=>relationships.find(item=>item.dependencyId===dependencyId&&item.filingId===filingId);

  const selectDependency=(dependency:Dependency)=>{
    const relationship=relationships.find(r=>r.dependencyId===dependency.id);
    const filing=relationship?filings.find(f=>f.id===relationship.filingId):undefined;
    setSelected({dependency,filing,relationship});
    setShowProvenance(false);
  };

  const selectRelationship=(dependency:Dependency,filing:Filing)=>{
    const relationship=relationFor(dependency.id,filing.id);
    if(!relationship)return;
    setSelected({dependency,filing,relationship});
    setShowProvenance(false);
  };

  return <main className="recallXPage recallCommandIncident">
    <header className="recallXMast">
      <Link href="/" className="recallXBrand">RECALL</Link>
      <div className="recallXMastCase">INCIDENT / JD-01701</div>
      <div className="recallXMastMode"><span/>Recorded public incident</div>
    </header>

    <section className="recallCommandCaseHeader">
      <div className="recallCommandCaseIdentity">
        <span>RECORDED PUBLIC INCIDENT</span>
        <h1>Johnson v. Dunn</h1>
        <p>{data.incident.court} · {data.incident.docketNumber}</p>
      </div>
      <div className="recallCommandFacts">
        <div><span>SOURCE DATE</span><strong>{dateLabel(data.incident.sourceDate)}</strong></div>
        <div><span>DISPUTED</span><strong>05 dependencies</strong></div>
        <div><span>AFFECTED</span><strong>{traced?'02 filed motions':'— pending trace'}</strong></div>
        <a href={JOHNSON_DUNN_ORDER_URL} target="_blank" rel="noreferrer"><span>AUTHORITY</span><strong>Source order ↗</strong></a>
      </div>
    </section>

    <section className={'recallCommandTimeline '+(traced?'is-traced':'')} aria-label="Incident trace stages">
      <div className="is-complete"><span>01</span><i/><strong>Court finding</strong><small>Five citations flagged</small></div>
      <div className="is-complete"><span>02</span><i/><strong>Dependencies</strong><small>Five under review</small></div>
      <div className={traced?'is-complete':'is-current'}><span>03</span><i/><strong>Trace impact</strong><small>{traced?'Deterministic pass complete':'Ready to run'}</small></div>
      <div className={traced?'is-complete':''}><span>04</span><i/><strong>Affected work</strong><small>{traced?'Two motions resolved':'Awaiting trace'}</small></div>
      <div className={traced?'is-current':''}><span>05</span><i/><strong>Exact evidence</strong><small>{traced?'Select a relationship':'Locked until trace'}</small></div>
    </section>

    <section className="recallCommandFindingBand">
      <div><span>COURT FINDING</span><strong>The court identified five problematic citations across two motions.</strong></div>
      <blockquote>“{data.incident.sourceExcerpt.exactText}”</blockquote>
      <small>Source order · PDF p. {data.incident.sourceExcerpt.pdfPageNumber}</small>
    </section>

    <section className="recallCommandOps">
      <aside className="recallCommandDeps" aria-label="Incident dependencies">
        <header><span>DISPUTED DEPENDENCIES</span><b>05</b></header>
        {dependencies.map((dependency,index)=>{
          const active=selected.dependency.id===dependency.id;
          return <button key={dependency.id} className={active?'is-active':''} onClick={()=>selectDependency(dependency)}>
            <em>{String(index+1).padStart(2,'0')}</em>
            <span><strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong><small>{dependency.canonicalCitation||dependency.rawText}</small></span>
            <i/>
          </button>
        })}
      </aside>

      <section className="recallCommandCenter">
        {!traced?<div className="recallCommandBefore">
          <span>IMPACT / NOT YET RESOLVED</span>
          <strong className="recallCommandBigNumber">05</strong>
          <h2>Flagging the dependency<br/>is only the first half.</h2>
          <p>Run one deterministic trace to reveal which filed motions contain the five dependencies. Recorded mode is instant and does not require network access.</p>
          <button onClick={()=>setTraced(true)}>Trace impact <b>↗</b></button>
          <small>Recorded incident · exact source evidence already captured</small>
        </div>:<>
          <header className="recallCommandImpactHead">
            <div><span>BLAST RADIUS</span><h2>{data.summary.confirmedCitationRelationships} confirmed relationships</h2></div>
            <div><b>05</b><i>→</i><b>02</b><small>dependencies / motions</small></div>
          </header>

          <div className="recallCommandMatrix" role="region" aria-label="Dependency by filing matrix" tabIndex={0}>
            <div className="recallCommandMatrixHead">
              <span>DEPENDENCY</span>
              {filings.map(filing=><div key={filing.id}><strong>DOC. {filing.documentNumber}</strong><small>{filing.title}</small></div>)}
            </div>
            {dependencies.map((dependency,index)=><div className={'recallCommandMatrixRow '+(selected.dependency.id===dependency.id?'is-active':'')} key={dependency.id}>
              <button className="recallCommandMatrixDependency" onClick={()=>selectDependency(dependency)}>
                <em>{String(index+1).padStart(2,'0')}</em>
                <span><strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong><small>{dependency.canonicalCitation||dependency.rawText}</small></span>
              </button>
              {filings.map(filing=>{
                const relationship=relationFor(dependency.id,filing.id);
                const accessible=(dependency.caseName||dependency.rawText)+' — '+(relationship?relationshipLabel(relationship.state):'No relationship')+' in Document '+filing.documentNumber;
                return relationship?<button key={filing.id} className="recallCommandHit" aria-label={accessible} onClick={()=>selectRelationship(dependency,filing)}>
                  <span>●</span><small>{relationshipLabel(relationship.state)}</small>
                </button>:<div key={filing.id} className="recallCommandBlank" aria-label="No documented relationship">—</div>
              })}
            </div>)}
          </div>

          <div className="recallCommandFiles">
            <header><span>AFFECTED WORK</span><strong>02</strong></header>
            {filings.map(filing=><button key={filing.id} onClick={()=>{
              const dep=dependencies.find(d=>filing.dependencyIds.includes(d.id));
              if(dep)selectRelationship(dep,filing);
            }}>
              <span>DOC. {filing.documentNumber}</span>
              <strong>{filing.title}</strong>
              <small>{dateLabel(filing.filingDate)} · {filing.dependencyIds.length} documented {filing.dependencyIds.length===1?'dependency':'dependencies'}</small>
              <b>↗</b>
            </button>)}
          </div>
        </>}
      </section>

      <aside className="recallCommandEvidence" aria-label="Relationship evidence">
        <header>
          <span>EVIDENCE / SELECTED</span>
          <strong>{selected.dependency.caseName||selected.dependency.rawText.split(',')[0]}</strong>
          <small>{selected.dependency.canonicalCitation||selected.dependency.rawText}</small>
        </header>

        <section className="recallCommandEvidenceBlock incident">
          <div className="recallXLabel"><span>01</span> INCIDENT SOURCE</div>
          <blockquote>“{selected.dependency.incidentEvidence.exactText}”</blockquote>
          {selected.dependency.incidentFinding&&<p className="recallXFindingText">{selected.dependency.incidentFinding}</p>}
          <a href={selected.dependency.incidentEvidence.sourceUrl} target="_blank" rel="noreferrer">Court order ↗</a>
        </section>

        <section className={'recallCommandEvidenceBlock affected '+(!traced?'is-locked':'')}>
          <div className="recallXLabel"><span>02</span> AFFECTED WORK</div>
          {traced&&selected.relationship&&selected.filing?<>
            <h3>{selected.filing.title}</h3>
            <blockquote>“{selected.relationship.evidence.exactText}”</blockquote>
            <p>{selected.relationship.evidence.location}. {selected.relationship.evidence.explanation}</p>
            <a href={selected.relationship.evidence.sourceUrl} target="_blank" rel="noreferrer">Public source ↗</a>
          </>:<p>{traced?'Select a confirmed matrix mark to inspect its downstream evidence.':'Trace impact to unlock the downstream evidence pair.'}</p>}
        </section>

        <div className="recallCommandProvenance">
          <button onClick={()=>setShowProvenance(value=>!value)} aria-expanded={showProvenance}>Provenance <span>{showProvenance?'−':'+'}</span></button>
          {showProvenance&&<dl>
            <div><dt>Relationship</dt><dd>{selected.relationship?relationshipLabel(selected.relationship.state):'Incident dependency'}</dd></div>
            <div><dt>Incident evidence SHA-256</dt><dd><code>{selected.dependency.incidentEvidence.sha256}</code></dd></div>
            <div><dt>Capture date</dt><dd>{data.capturedAt}</dd></div>
            <div><dt>Source mode</dt><dd>Recorded public incident</dd></div>
          </dl>}
        </div>
      </aside>
    </section>
  </main>
}
