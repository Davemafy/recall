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
    setShowProvenance(false);
    setSelected({dependency,filing,relationship});
  };

  const selectRelationship=(dependency:Dependency,filing:Filing)=>{
    const relationship=relationFor(dependency.id,filing.id);
    if(!relationship)return;
    setShowProvenance(false);
    setSelected({dependency,filing,relationship});
  };

  return <main className="recallVXPage">
    <header className="recallVXTopbar">
      <Link href="/" className="recallVXBrand">RECALL</Link>
      <div className="recallVXTopContext">Incident / Johnson v. Dunn</div>
      <div className="recallVXMode"><span/> Recorded public incident</div>
    </header>

    <section className="recallVXWorkspace">
      <aside className="recallVXRail">
        <div className="recallVXIncidentMeta">
          <span>COURT INCIDENT</span>
          <h1>Johnson v.<br/>Dunn</h1>
          <p>{data.incident.court}</p>
          <p>{data.incident.docketNumber} · {dateLabel(data.incident.sourceDate)}</p>
          <a href={JOHNSON_DUNN_ORDER_URL} target="_blank" rel="noreferrer">Source order ↗</a>
        </div>

        <div className="recallVXFinding">
          <span>WHAT THE COURT FLAGGED</span>
          <strong>The court identified five problematic citations across two motions.</strong>
        </div>

        <div className="recallVXDependencyHeader">
          <span>DEPENDENCIES</span>
          <b>{dependencies.length}</b>
        </div>

        <div className="recallVXDependencyList" aria-labelledby="dependencies-heading">
          <span id="dependencies-heading" className="srOnly">Incident dependencies</span>
          {dependencies.map((dependency,index)=>{
            const active=selected.dependency.id===dependency.id;
            return <button key={dependency.id} className={active?'is-active':''} onClick={()=>selectDependency(dependency)}>
              <span className="recallVXIndex">{String(index+1).padStart(2,'0')}</span>
              <span className="recallVXDepCopy">
                <strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong>
                <small>{dependency.canonicalCitation||dependency.rawText}</small>
              </span>
              <span className="recallVXPageTag">p.{dependency.incidentEvidence.pdfPageNumber}</span>
            </button>
          })}
        </div>
      </aside>

      <section className="recallVXStage">
        {!traced?<div className="recallVXPretrace">
          <div className="recallVXStageIntro">
            <span>INCIDENT SOURCE</span>
            <h2>Finding the bad citation was only the beginning.</h2>
            <blockquote>“{data.incident.sourceExcerpt.exactText}”</blockquote>
          </div>

          <div className="recallVXSelectedPreview">
            <div>
              <span>SELECTED DEPENDENCY</span>
              <strong>{selected.dependency.caseName||selected.dependency.rawText.split(',')[0]}</strong>
              <small>{selected.dependency.canonicalCitation||selected.dependency.rawText}</small>
            </div>
            <p>{selected.dependency.incidentFinding}</p>
          </div>

          <div className="recallVXActionBand">
            <div>
              <span>5 dependencies ready</span>
              <strong>Trace what they touch.</strong>
            </div>
            <button className="recallVXPrimary" onClick={()=>setTraced(true)}>Trace impact <span>↗</span></button>
          </div>
        </div>:<div className="recallVXImpact" aria-labelledby="impact-heading">
          <div className="recallVXImpactBar">
            <div>
              <span>BLAST RADIUS</span>
              <h2 id="impact-heading">{data.summary.confirmedCitationRelationships} confirmed relationships</h2>
            </div>
            <p><strong>{data.summary.confirmedAffectedFilings}</strong> filed motions <i/> <strong>{data.summary.uniqueDockets}</strong> docket</p>
          </div>

          <div className="recallVXMatrixWrap" role="region" aria-label="Dependency by filing matrix" tabIndex={0}>
            <table className="recallVXMatrix">
              <thead>
                <tr>
                  <th scope="col">Dependency</th>
                  {filings.map(filing=><th scope="col" key={filing.id}>
                    <span>DOC. {filing.documentNumber}</span>
                    <strong>{filing.title}</strong>
                  </th>)}
                </tr>
              </thead>
              <tbody>
                {dependencies.map(dependency=><tr key={dependency.id} className={selected.dependency.id===dependency.id?'is-active':''}>
                  <th scope="row">
                    <button onClick={()=>selectDependency(dependency)}>
                      <strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong>
                      <small>{dependency.canonicalCitation||dependency.rawText}</small>
                    </button>
                  </th>
                  {filings.map(filing=>{
                    const relationship=relationFor(dependency.id,filing.id);
                    const accessible=(dependency.caseName||dependency.rawText)+' — '+(relationship?relationshipLabel(relationship.state):'No relationship')+' in Document '+filing.documentNumber;
                    return <td key={filing.id}>
                      {relationship?<button
                        className="recallVXMatrixHit"
                        aria-label={accessible}
                        onClick={()=>selectRelationship(dependency,filing)}
                      >
                        <span aria-hidden>●</span>
                        <small>{relationshipLabel(relationship.state)}</small>
                      </button>:<span className="recallVXMatrixNone" aria-label="No documented relationship">—</span>}
                    </td>
                  })}
                </tr>)}
              </tbody>
            </table>
          </div>

          <div className="recallVXEvidenceSpread" aria-label="Relationship evidence">
            <section className="recallVXEvidenceHalf recallVXIncidentEvidence">
              <div className="recallVXEvidenceKicker">
                <span>INCIDENT SOURCE</span>
                <small>Sanctions order · p. {selected.dependency.incidentEvidence.pdfPageNumber}</small>
              </div>
              <h3>{selected.dependency.caseName||selected.dependency.rawText.split(',')[0]}</h3>
              <blockquote>“{selected.dependency.incidentEvidence.exactText}”</blockquote>
              {selected.dependency.incidentFinding&&<p className="recallVXFindingText">{selected.dependency.incidentFinding}</p>}
              <a href={selected.dependency.incidentEvidence.sourceUrl} target="_blank" rel="noreferrer">Open court order ↗</a>
            </section>

            <section className="recallVXEvidenceHalf recallVXDownstreamEvidence">
              <div className="recallVXEvidenceKicker">
                <span>{selected.relationship?relationshipLabel(selected.relationship.state):'DOWNSTREAM OCCURRENCE'}</span>
                <small>{selected.filing?'Document '+selected.filing.documentNumber:'No filing selected'}</small>
              </div>
              {selected.relationship&&selected.filing?<>
                <h3>{selected.filing.title}</h3>
                <blockquote>“{selected.relationship.evidence.exactText}”</blockquote>
                <p>{selected.relationship.evidence.location}. {selected.relationship.evidence.explanation}</p>
                <a href={selected.relationship.evidence.sourceUrl} target="_blank" rel="noreferrer">Public source ↗</a>
              </>:<p className="recallVXMuted">Select a confirmed matrix cell to inspect the downstream occurrence.</p>}
            </section>
          </div>

          <div className="recallVXBottomBar">
            <button className="recallVXProvenanceToggle" onClick={()=>setShowProvenance(value=>!value)} aria-expanded={showProvenance}>
              Provenance <span>{showProvenance?'−':'+'}</span>
            </button>
            <div className="recallVXAffectedStrip">
              {filings.map(filing=><button key={filing.id} onClick={()=>{
                const dep=dependencies.find(d=>filing.dependencyIds.includes(d.id));
                if(dep)selectRelationship(dep,filing);
              }}>
                <span>DOC. {filing.documentNumber}</span>
                <strong>{filing.title}</strong>
                <small>{filing.dependencyIds.length} documented {filing.dependencyIds.length===1?'dependency':'dependencies'}</small>
              </button>)}
            </div>
          </div>

          {showProvenance&&<dl className="recallVXProvenance">
            <div><dt>Relationship</dt><dd>{selected.relationship?relationshipLabel(selected.relationship.state):'Incident dependency'}</dd></div>
            <div><dt>Incident evidence SHA-256</dt><dd><code>{selected.dependency.incidentEvidence.sha256}</code></dd></div>
            <div><dt>Capture date</dt><dd>{data.capturedAt}</dd></div>
            <div><dt>Source mode</dt><dd>Recorded public incident</dd></div>
          </dl>}
        </div>}
      </section>
    </section>
  </main>
}
