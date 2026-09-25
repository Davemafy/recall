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

  return <main className="recallRefPage">
    <section className="recallRefShell">
      <header className="recallRefTopbar">
        <Link href="/" className="recallRefBrand">RECALL</Link>
        <div className="recallRefTopTitle">Johnson v. Dunn</div>
        <div className="recallRefMode"><span/>Recorded public incident</div>
      </header>

      <div className="recallRefIncidentHeader">
        <div className="recallRefBreadcrumb">Incidents <span>/</span> Johnson v. Dunn</div>
        <div className="recallRefHeadingRow">
          <div>
            <h1>Johnson v. Dunn</h1>
            <p>{data.incident.court} · {data.incident.docketNumber} · {dateLabel(data.incident.sourceDate)}</p>
          </div>
          <a href={JOHNSON_DUNN_ORDER_URL} target="_blank" rel="noreferrer">View source order ↗</a>
        </div>
        <div className="recallRefCourtFinding">
          <span>COURT FINDING</span>
          <strong>The court identified five problematic citations across two motions.</strong>
        </div>
      </div>

      <div className="recallRefWorkspace">
        <aside className="recallRefDependencies" aria-labelledby="dependencies-heading">
          <div className="recallRefPanelHeader">
            <div>
              <span>DEPENDENCIES</span>
              <strong id="dependencies-heading">{dependencies.length} under review</strong>
            </div>
          </div>

          <div className="recallRefDependencyList">
            {dependencies.map((dependency,index)=>{
              const active=selected?.dependency.id===dependency.id;
              return <button
                key={dependency.id}
                className={active?'is-active':''}
                onClick={()=>selectDependency(dependency)}
              >
                <span className="recallRefDepNumber">{String(index+1).padStart(2,'0')}</span>
                <span className="recallRefDepText">
                  <strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong>
                  <small>{dependency.canonicalCitation||dependency.rawText}</small>
                  <em>Order p. {dependency.incidentEvidence.pdfPageNumber}</em>
                </span>
              </button>
            })}
          </div>
        </aside>

        <section className="recallRefMain">
          {!traced?<div className="recallRefPretrace">
            <div className="recallRefSourceBlock">
              <div className="recallRefSectionLabel">INCIDENT SOURCE · PAGE {data.incident.sourceExcerpt.pdfPageNumber}</div>
              <blockquote>“{data.incident.sourceExcerpt.exactText}”</blockquote>
              <a href={JOHNSON_DUNN_ORDER_URL} target="_blank" rel="noreferrer">Open sanctions order ↗</a>
            </div>

            <div className="recallRefTraceMoment">
              <div>
                <span>READY TO TRACE</span>
                <h2>Find where these dependencies appear.</h2>
                <p>RECALL will resolve the five source-backed dependencies against the recorded public incident evidence and assemble the affected work.</p>
              </div>
              <button className="recallRefPrimary" onClick={()=>setTraced(true)}>Trace impact <span>→</span></button>
            </div>
          </div>:<div className="recallRefImpact" aria-labelledby="impact-heading">
            <div className="recallRefImpactHeader">
              <div>
                <span>IMPACT</span>
                <h2 id="impact-heading">{data.summary.confirmedCitationRelationships} confirmed relationships</h2>
                <p>across {data.summary.confirmedAffectedFilings} filed motions · {data.summary.uniqueDockets} docket</p>
              </div>
              <div className="recallRefTraceDone">Trace complete</div>
            </div>

            <div className="recallRefMatrixWrap" role="region" aria-label="Dependency by filing matrix" tabIndex={0}>
              <table className="recallRefMatrix">
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
                  {dependencies.map(dependency=><tr key={dependency.id}>
                    <th scope="row">
                      <button onClick={()=>selectDependency(dependency)}>
                        <strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong>
                        <small>{dependency.canonicalCitation||dependency.rawText}</small>
                      </button>
                    </th>
                    {filings.map(filing=>{
                      const relationship=relationFor(dependency.id,filing.id);
                      return <td key={filing.id}>
                        {relationship?<button
                          className="recallRefMatrixHit"
                          aria-label={`${dependency.caseName||dependency.rawText} — ${relationshipLabel(relationship.state)} in Document ${filing.documentNumber}`}
                          onClick={()=>selectRelationship(dependency,filing)}
                        >
                          <span aria-hidden>●</span>
                          <small>{relationshipLabel(relationship.state)}</small>
                        </button>:<span className="recallRefMatrixNone" aria-label="No documented relationship">—</span>}
                      </td>
                    })}
                  </tr>)}
                </tbody>
              </table>
            </div>

            <div className="recallRefAffected">
              <div className="recallRefSectionHeading">
                <div><span>AFFECTED WORK</span><strong>{filings.length} filed motions</strong></div>
                <small>Documented by the sanctions order</small>
              </div>
              {filings.map(filing=><button
                key={filing.id}
                className="recallRefFilingRow"
                onClick={()=>{
                  const dep=dependencies.find(d=>filing.dependencyIds.includes(d.id));
                  if(dep)selectRelationship(dep,filing);
                }}
              >
                <span className="recallRefFileBadge">DOC. {filing.documentNumber}</span>
                <span className="recallRefFileIdentity">
                  <strong>{filing.title}</strong>
                  <small>{dateLabel(filing.filingDate)} · {filing.dependencyIds.length} documented {filing.dependencyIds.length===1?'dependency':'dependencies'}</small>
                </span>
                <span className="recallRefInspect">Inspect evidence ↗</span>
              </button>)}
            </div>
          </div>}
        </section>

        <aside className="recallRefEvidence" aria-label="Relationship evidence">
          <div className="recallRefPanelHeader">
            <div><span>EVIDENCE</span><strong>Why this relationship exists</strong></div>
          </div>

          {selected?<div className="recallRefEvidenceBody">
            <div className="recallRefSelectedTitle">
              <span>{selected.relationship?relationshipLabel(selected.relationship.state):'Incident dependency'}</span>
              <h2>{selected.dependency.caseName||selected.dependency.rawText.split(',')[0]}</h2>
              <p>{selected.dependency.rawText}</p>
            </div>

            <section className="recallRefEvidenceSection">
              <div className="recallRefEvidenceLabel">
                <span>INCIDENT SOURCE</span>
                <small>Sanctions Order · p. {selected.dependency.incidentEvidence.pdfPageNumber}</small>
              </div>
              <blockquote>“{selected.dependency.incidentEvidence.exactText}”</blockquote>
              {selected.dependency.incidentFinding&&<p className="recallRefFinding">{selected.dependency.incidentFinding}</p>}
              <a href={selected.dependency.incidentEvidence.sourceUrl} target="_blank" rel="noreferrer">Court order ↗</a>
            </section>

            {selected.relationship&&selected.filing&&<section className="recallRefEvidenceSection">
              <div className="recallRefEvidenceLabel">
                <span>AFFECTED FILING</span>
                <small>Document {selected.filing.documentNumber}</small>
              </div>
              <strong className="recallRefFilingTitle">{selected.filing.title}</strong>
              <blockquote>“{selected.relationship.evidence.exactText}”</blockquote>
              <p>{selected.relationship.evidence.location}. {selected.relationship.evidence.explanation}</p>
              <a href={selected.relationship.evidence.sourceUrl} target="_blank" rel="noreferrer">Public source ↗</a>
            </section>}

            <button className="recallRefProvenanceToggle" onClick={()=>setShowProvenance(value=>!value)} aria-expanded={showProvenance}>
              View provenance <span>{showProvenance?'−':'+'}</span>
            </button>

            {showProvenance&&<dl className="recallRefProvenance">
              <div><dt>Relationship</dt><dd>{selected.relationship?relationshipLabel(selected.relationship.state):'Incident dependency'}</dd></div>
              <div><dt>Incident evidence SHA-256</dt><dd><code>{selected.dependency.incidentEvidence.sha256}</code></dd></div>
              <div><dt>Capture date</dt><dd>{data.capturedAt}</dd></div>
              <div><dt>Source mode</dt><dd>Recorded public incident</dd></div>
            </dl>}
          </div>:<div className="recallRefEvidenceEmpty">Select a dependency or matrix cell to inspect its evidence.</div>}
        </aside>
      </div>
    </section>
  </main>
}
