'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';
// @ts-ignore Recorded incident fixture is shared with Node benchmark tests.
import {getRecordedIncident,JOHNSON_DUNN_ORDER_URL} from '../lib/recorded-incident.mjs';
// @ts-ignore Centralized domain labels.
import {RELATIONSHIP_STATE,relationshipLabel} from '../lib/domain.mjs';

type Dependency={
  id:string; rawText:string; canonicalCitation?:string; incidentFinding?:string;
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
  const [traced,setTraced]=useState(false);
  const [selected,setSelected]=useState<{dependency:Dependency;filing?:Filing;relationship?:Relationship}|null>(null);
  const [showProvenance,setShowProvenance]=useState(false);

  const dependencies=data.dependencies as Dependency[];
  const filings=data.filings as Filing[];
  const relationships=data.relationships as Relationship[];

  const relationFor=(dependencyId:string,filingId:string)=>relationships.find(item=>item.dependencyId===dependencyId&&item.filingId===filingId);
  const concentration=dependencies
    .map(dependency=>({dependency,count:new Set(relationships.filter(r=>r.dependencyId===dependency.id).map(r=>r.filingId)).size}))
    .sort((a,b)=>b.count-a.count);

  const openDependency=(dependency:Dependency)=>{
    const relationship=relationships.find(r=>r.dependencyId===dependency.id);
    const filing=relationship?filings.find(f=>f.id===relationship.filingId):undefined;
    setShowProvenance(false);
    setSelected({dependency,filing,relationship});
  };
  const openCell=(dependency:Dependency,filing:Filing)=>{
    const relationship=relationFor(dependency.id,filing.id);
    if(!relationship)return;
    setShowProvenance(false);
    setSelected({dependency,filing,relationship});
  };

  return <main className="incidentProduct">
    <header className="productBar">
      <Link href="/" className="productWordmark">RECALL</Link>
      <div className="productContext">Johnson v. Dunn</div>
      <div className="recordedState">Recorded public incident</div>
    </header>

    <section className="incidentShell">
      <div className="incidentSourceLine">
        <span>COURT INCIDENT</span>
        <a href={JOHNSON_DUNN_ORDER_URL} target="_blank" rel="noreferrer">View sanctions order ↗</a>
      </div>

      <div className="incidentHero">
        <div>
          <h1>Johnson v. Dunn</h1>
          <p>{data.incident.court} · {data.incident.docketNumber} · {dateLabel(data.incident.sourceDate)}</p>
        </div>
        <div className="incidentStatement">
          <strong>The court identified five problematic citations across two motions.</strong>
          <span>RECALL starts after that finding and traces the dependencies.</span>
        </div>
      </div>

      <div className="incidentSourceExcerpt">
        <span>FROM THE ORDER · PAGE {data.incident.sourceExcerpt.pdfPageNumber}</span>
        <blockquote>“{data.incident.sourceExcerpt.exactText}”</blockquote>
      </div>

      <section className="dependencySection" aria-labelledby="dependencies-heading">
        <div className="sectionHeading">
          <div><span>DEPENDENCIES</span><h2 id="dependencies-heading">5 under review</h2></div>
          {!traced&&<button className="traceImpactButton" onClick={()=>setTraced(true)}>Trace impact <span aria-hidden>→</span></button>}
          {traced&&<div className="traceComplete">Trace complete</div>}
        </div>

        <div className="dependencyList">
          {dependencies.map((dependency,index)=><button key={dependency.id} className="dependencyRow" onClick={()=>openDependency(dependency)}>
            <span className="dependencyIndex">{String(index+1).padStart(2,'0')}</span>
            <span className="dependencyIdentity"><strong>{dependency.rawText}</strong><small>{dependency.incidentFinding}</small></span>
            <span className="dependencyEvidence">Order p. {dependency.incidentEvidence.pdfPageNumber}</span>
            <span className="rowArrow" aria-hidden>↗</span>
          </button>)}
        </div>
      </section>

      {traced&&<section className="impactSection" aria-labelledby="impact-heading">
        <div className="impactReveal">
          <span>IMPACT</span>
          <h2 id="impact-heading">{data.summary.confirmedCitationRelationships} confirmed relationships <em>across {data.summary.confirmedAffectedFilings} filed motions · {data.summary.uniqueDockets} docket</em></h2>
          <p>Each relationship below is documented by the court’s sanctions order. No semantic matches are included in the confirmed count.</p>
        </div>

        <div className="matrixWrap" role="region" aria-label="Dependency by filing matrix" tabIndex={0}>
          <table className="impactMatrix">
            <thead><tr><th scope="col">Dependency</th>{filings.map(filing=><th scope="col" key={filing.id}><span>DOC. {filing.documentNumber}</span>{filing.title}</th>)}</tr></thead>
            <tbody>{dependencies.map(dependency=><tr key={dependency.id}>
              <th scope="row"><button onClick={()=>openDependency(dependency)}>{dependency.caseName||dependency.rawText.split(',')[0]}<small>{dependency.canonicalCitation||dependency.rawText}</small></button></th>
              {filings.map(filing=>{
                const relationship=relationFor(dependency.id,filing.id);
                return <td key={filing.id}>{relationship?
                  <button className="matrixHit" aria-label={`${dependency.caseName||dependency.rawText} — ${relationshipLabel(relationship.state)} in Document ${filing.documentNumber}`} onClick={()=>openCell(dependency,filing)}>
                    <span aria-hidden>●</span><small>{relationshipLabel(relationship.state)}</small>
                  </button>:
                  <span className="matrixNone" aria-label="No documented relationship">—</span>}
                </td>
              })}
            </tr>)}</tbody>
          </table>
        </div>

        <div className="impactLower">
          <section className="affectedWork" aria-labelledby="affected-heading">
            <div className="miniHeading"><span>AFFECTED WORK</span><h3 id="affected-heading">2 filed motions</h3></div>
            {filings.map(filing=><article className="filingRow" key={filing.id}>
              <div className="filingNumber">DOC. {filing.documentNumber}</div>
              <div><strong>{filing.title}</strong><span>{dateLabel(filing.filingDate)} · {filing.dependencyIds.length} documented {filing.dependencyIds.length===1?'dependency':'dependencies'}</span></div>
              <button onClick={()=>{const dep=dependencies.find(d=>filing.dependencyIds.includes(d.id))!;openCell(dep,filing)}}>Inspect evidence</button>
            </article>)}
          </section>

          <aside className="concentration">
            <div className="miniHeading"><span>DEPENDENCY CONCENTRATION</span><h3>Incident topology</h3></div>
            <p>Four disputed authorities occur in Document 174. A fifth occurs in Document 182. The recorded incident does not infer copying or chronology beyond the court record.</p>
            <div className="concentrationBars">
              {concentration.map(({dependency,count})=><div key={dependency.id}><span>{dependency.caseName||dependency.rawText.split(',')[0]}</span><i><b style={{width:`${count/filings.length*100}%`}}/></i><em>{count} filing</em></div>)}
            </div>
          </aside>
        </div>
      </section>}
    </section>

    {selected&&<div className="evidenceOverlay" onClick={()=>setSelected(null)}>
      <aside className="incidentEvidencePane" onClick={event=>event.stopPropagation()} aria-label="Relationship evidence">
        <button className="evidenceClose" aria-label="Close evidence" onClick={()=>setSelected(null)}>×</button>
        <div className="evidenceTitle"><span>EVIDENCE</span><h2>{selected.dependency.caseName||selected.dependency.rawText.split(',')[0]}</h2><p>{selected.dependency.rawText}</p></div>

        <div className="evidencePair">
          <section>
            <span>INCIDENT SOURCE</span>
            <strong>Sanctions Order · page {selected.dependency.incidentEvidence.pdfPageNumber}</strong>
            <blockquote>“{selected.dependency.incidentEvidence.exactText}”</blockquote>
            <a href={selected.dependency.incidentEvidence.sourceUrl} target="_blank" rel="noreferrer">Open court order ↗</a>
          </section>
          {selected.relationship&&selected.filing&&<section>
            <span>AFFECTED FILING</span>
            <strong>Document {selected.filing.documentNumber} · {selected.filing.title}</strong>
            <blockquote>“{selected.relationship.evidence.exactText}”</blockquote>
            <p>{selected.relationship.evidence.location}. {selected.relationship.evidence.explanation}</p>
            <a href={selected.relationship.evidence.sourceUrl} target="_blank" rel="noreferrer">Open supporting public source ↗</a>
          </section>}
        </div>

        <button className="provenanceToggle" onClick={()=>setShowProvenance(value=>!value)} aria-expanded={showProvenance}>View provenance <span aria-hidden>{showProvenance?'−':'+'}</span></button>
        {showProvenance&&<div className="provenanceDetail">
          <dl><div><dt>Relationship</dt><dd>{selected.relationship?relationshipLabel(selected.relationship.state):'Incident dependency'}</dd></div><div><dt>Incident evidence SHA-256</dt><dd><code>{selected.dependency.incidentEvidence.sha256}</code></dd></div><div><dt>Capture date</dt><dd>{data.capturedAt}</dd></div><div><dt>Source mode</dt><dd>Recorded public incident</dd></div></dl>
        </div>}
      </aside>
    </div>}
  </main>
}
