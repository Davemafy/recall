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

  return <main className="recallNeoPage">
    <header className="recallNeoTop">
      <Link href="/" className="recallNeoBrand">RECALL</Link>
      <div className="recallNeoMeta">RECORDED PUBLIC INCIDENT · {data.capturedAt}</div>
      <a href={JOHNSON_DUNN_ORDER_URL} target="_blank" rel="noreferrer">SOURCE ORDER ↗</a>
    </header>

    <section className="recallNeoIncident">
      <div className="recallNeoIncidentIndex">01 / INCIDENT</div>
      <div className="recallNeoTitleBlock">
        <h1>Johnson v. Dunn</h1>
        <p>{data.incident.court}<br/>{data.incident.docketNumber} · {dateLabel(data.incident.sourceDate)}</p>
      </div>
      <div className="recallNeoFindingBlock">
        <span>COURT FINDING</span>
        <strong>The court identified five problematic citations across two motions.</strong>
      </div>
      <div className="recallNeoIncidentCount">05</div>
    </section>

    <section className="recallNeoDependencies" aria-labelledby="dependencies-heading">
      <div className="recallNeoSectionCap">
        <span id="dependencies-heading">DISPUTED DEPENDENCIES</span>
        <b>{dependencies.length}</b>
      </div>
      <div className="recallNeoDependencyGrid">
        {dependencies.map((dependency,index)=>{
          const active=selected.dependency.id===dependency.id;
          return <button key={dependency.id} className={active?'is-active':''} onClick={()=>selectDependency(dependency)}>
            <span className="recallNeoDepIndex">{String(index+1).padStart(2,'0')}</span>
            <strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong>
            <small>{dependency.canonicalCitation||dependency.rawText}</small>
            <em>ORDER P.{dependency.incidentEvidence.pdfPageNumber}</em>
          </button>
        })}
      </div>
    </section>

    {!traced?<section className="recallNeoPretrace">
      <div className="recallNeoQuote">
        <span>INCIDENT SOURCE</span>
        <blockquote>“{data.incident.sourceExcerpt.exactText}”</blockquote>
      </div>
      <div className="recallNeoAction">
        <p>Five dependencies are ready. RECALL can now resolve where the recorded incident says they occur.</p>
        <button onClick={()=>setTraced(true)}>TRACE IMPACT <span>↗</span></button>
      </div>
    </section>:<section className="recallNeoImpact" aria-labelledby="impact-heading">
      <div className="recallNeoImpactHeader">
        <div>
          <span>02 / BLAST RADIUS</span>
          <h2 id="impact-heading">{data.summary.confirmedCitationRelationships} confirmed relationships</h2>
        </div>
        <p><strong>{data.summary.confirmedAffectedFilings}</strong> filed motions <i/> <strong>{data.summary.uniqueDockets}</strong> docket</p>
      </div>

      <div className="recallNeoMatrixWrap" role="region" aria-label="Dependency by filing matrix" tabIndex={0}>
        <table className="recallNeoMatrix">
          <thead>
            <tr>
              <th scope="col">DEPENDENCY</th>
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
                  {relationship?<button className="recallNeoHit" aria-label={accessible} onClick={()=>selectRelationship(dependency,filing)}>
                    <span aria-hidden>●</span><small>{relationshipLabel(relationship.state)}</small>
                  </button>:<span className="recallNeoNone" aria-label="No documented relationship">—</span>}
                </td>
              })}
            </tr>)}
          </tbody>
        </table>
      </div>

      <div className="recallNeoEvidence" aria-label="Relationship evidence">
        <section className="recallNeoEvidenceSource">
          <div className="recallNeoEvidenceCap"><span>03A / INCIDENT SOURCE</span><small>Order p.{selected.dependency.incidentEvidence.pdfPageNumber}</small></div>
          <h3>{selected.dependency.caseName||selected.dependency.rawText.split(',')[0]}</h3>
          <blockquote>“{selected.dependency.incidentEvidence.exactText}”</blockquote>
          {selected.dependency.incidentFinding&&<p className="recallVXFindingText">{selected.dependency.incidentFinding}</p>}
          <a href={selected.dependency.incidentEvidence.sourceUrl} target="_blank" rel="noreferrer">COURT ORDER ↗</a>
        </section>
        <section className="recallNeoEvidenceTarget">
          <div className="recallNeoEvidenceCap">
            <span>03B / AFFECTED WORK</span>
            <small>{selected.filing?'Document '+selected.filing.documentNumber:'No filing selected'}</small>
          </div>
          {selected.relationship&&selected.filing?<>
            <h3>{selected.filing.title}</h3>
            <blockquote>“{selected.relationship.evidence.exactText}”</blockquote>
            <p>{selected.relationship.evidence.location}. {selected.relationship.evidence.explanation}</p>
            <a href={selected.relationship.evidence.sourceUrl} target="_blank" rel="noreferrer">PUBLIC SOURCE ↗</a>
          </>:<p>Select a confirmed matrix cell to inspect the downstream occurrence.</p>}
        </section>
      </div>

      <div className="recallNeoFooterBand">
        <button className="recallNeoProvButton" onClick={()=>setShowProvenance(value=>!value)} aria-expanded={showProvenance}>
          PROVENANCE <span>{showProvenance?'−':'+'}</span>
        </button>
        {filings.map(filing=><button key={filing.id} className="recallNeoFileButton" onClick={()=>{
          const dep=dependencies.find(d=>filing.dependencyIds.includes(d.id));
          if(dep)selectRelationship(dep,filing);
        }}>
          <span>DOC. {filing.documentNumber}</span>
          <strong>{filing.title}</strong>
          <small>{filing.dependencyIds.length} documented {filing.dependencyIds.length===1?'dependency':'dependencies'}</small>
        </button>)}
      </div>

      {showProvenance&&<dl className="recallNeoProvenance">
        <div><dt>RELATIONSHIP</dt><dd>{selected.relationship?relationshipLabel(selected.relationship.state):'Incident dependency'}</dd></div>
        <div><dt>INCIDENT EVIDENCE SHA-256</dt><dd><code>{selected.dependency.incidentEvidence.sha256}</code></dd></div>
        <div><dt>CAPTURE DATE</dt><dd>{data.capturedAt}</dd></div>
        <div><dt>SOURCE MODE</dt><dd>Recorded public incident</dd></div>
      </dl>}
    </section>}
  </main>
}
