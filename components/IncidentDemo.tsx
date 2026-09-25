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

  return <main className="recallXPage">
    <header className="recallXMast">
      <Link href="/" className="recallXBrand">RECALL</Link>
      <div className="recallXMastCase">Johnson v. Dunn</div>
      <div className="recallXMastMode"><span/>Recorded public incident</div>
    </header>

    <section className="recallXHero">
      <div className="recallXHeroMeta">
        <span>COURT INCIDENT</span>
        <h1>Johnson v. Dunn</h1>
        <p>{data.incident.court}<br/>{data.incident.docketNumber} · {dateLabel(data.incident.sourceDate)}</p>
        <a href={JOHNSON_DUNN_ORDER_URL} target="_blank" rel="noreferrer">Source order ↗</a>
      </div>

      <div className="recallXHeroNumbers" aria-label="Five disputed dependencies across two filed motions">
        <div><strong>05</strong><span>disputed<br/>dependencies</span></div>
        <i>→</i>
        <div><strong>02</strong><span>filed<br/>motions</span></div>
      </div>

      <div className="recallXHeroAction">
        <span>COURT FINDING</span>
        <p>The court identified five problematic citations across two motions.</p>
        {!traced?<button onClick={()=>setTraced(true)}>Trace impact <b>↗</b></button>:<div className="recallXComplete">Trace complete <b>●</b></div>}
      </div>
    </section>

    <nav className="recallXDependencyRail" aria-label="Incident dependencies">
      {dependencies.map((dependency,index)=>{
        const active=selected.dependency.id===dependency.id;
        return <button key={dependency.id} className={active?'is-active':''} onClick={()=>selectDependency(dependency)}>
          <span>{String(index+1).padStart(2,'0')}</span>
          <strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong>
          <small>{dependency.canonicalCitation||dependency.rawText}</small>
        </button>
      })}
    </nav>

    {!traced?<section className="recallXBefore">
      <div className="recallXBeforeLead">
        <span>INCIDENT SOURCE / PAGE {data.incident.sourceExcerpt.pdfPageNumber}</span>
        <h2>Finding the bad citation<br/>was only the beginning.</h2>
      </div>
      <blockquote>“{data.incident.sourceExcerpt.exactText}”</blockquote>
      <div className="recallXBeforeSelected">
        <span>SELECTED / {selected.dependency.caseName||selected.dependency.rawText.split(',')[0]}</span>
        <p>{selected.dependency.incidentFinding}</p>
      </div>
    </section>:<>
      <section className="recallXBlast" aria-labelledby="impact-heading">
        <header className="recallXBlastHeader">
          <div>
            <span>BLAST RADIUS</span>
            <h2 id="impact-heading">{data.summary.confirmedCitationRelationships} confirmed relationships</h2>
          </div>
          <p>Every mark below is backed by source evidence.</p>
        </header>

        <div className="recallXMatrix" role="region" aria-label="Dependency by filing matrix" tabIndex={0}>
          <div className="recallXMatrixHead">
            <span>DEPENDENCY</span>
            {filings.map(filing=><div key={filing.id}>
              <strong>DOC. {filing.documentNumber}</strong>
              <small>{filing.title}</small>
            </div>)}
          </div>
          {dependencies.map((dependency,index)=><div className={'recallXMatrixRow '+(selected.dependency.id===dependency.id?'is-active':'')} key={dependency.id}>
            <button className="recallXMatrixDependency" onClick={()=>selectDependency(dependency)}>
              <span>{String(index+1).padStart(2,'0')}</span>
              <div><strong>{dependency.caseName||dependency.rawText.split(',')[0]}</strong><small>{dependency.canonicalCitation||dependency.rawText}</small></div>
            </button>
            {filings.map(filing=>{
              const relationship=relationFor(dependency.id,filing.id);
              const accessible=(dependency.caseName||dependency.rawText)+' — '+(relationship?relationshipLabel(relationship.state):'No relationship')+' in Document '+filing.documentNumber;
              return relationship?<button
                key={filing.id}
                className="recallXMark"
                aria-label={accessible}
                onClick={()=>selectRelationship(dependency,filing)}
              ><span>●</span><small>{relationshipLabel(relationship.state)}</small></button>
              :<div key={filing.id} className="recallXBlank" aria-label="No documented relationship">—</div>
            })}
          </div>)}
        </div>
      </section>

      <section className="recallXEvidence" aria-label="Relationship evidence">
        <div className="recallXEvidenceIncident">
          <div className="recallXLabel"><span>01</span> INCIDENT SOURCE</div>
          <h3>{selected.dependency.caseName||selected.dependency.rawText.split(',')[0]}</h3>
          <blockquote>“{selected.dependency.incidentEvidence.exactText}”</blockquote>
          {selected.dependency.incidentFinding&&<p className="recallXFindingText">{selected.dependency.incidentFinding}</p>}
          <a href={selected.dependency.incidentEvidence.sourceUrl} target="_blank" rel="noreferrer">Court order ↗</a>
        </div>

        <div className="recallXEvidenceJoin" aria-hidden>
          <span>same<br/>dependency</span>
          <b>↗</b>
        </div>

        <div className="recallXEvidenceDownstream">
          <div className="recallXLabel"><span>02</span> AFFECTED WORK</div>
          {selected.relationship&&selected.filing?<>
            <h3>{selected.filing.title}</h3>
            <blockquote>“{selected.relationship.evidence.exactText}”</blockquote>
            <p>{selected.relationship.evidence.location}. {selected.relationship.evidence.explanation}</p>
            <a href={selected.relationship.evidence.sourceUrl} target="_blank" rel="noreferrer">Public source ↗</a>
          </>:<p>Select a confirmed matrix mark to inspect its downstream evidence.</p>}
        </div>
      </section>

      <section className="recallXFiles">
        <div className="recallXFilesTitle"><span>AFFECTED WORK</span><strong>02</strong></div>
        {filings.map(filing=><button key={filing.id} onClick={()=>{
          const dep=dependencies.find(d=>filing.dependencyIds.includes(d.id));
          if(dep)selectRelationship(dep,filing);
        }}>
          <span>DOC. {filing.documentNumber}</span>
          <strong>{filing.title}</strong>
          <small>{dateLabel(filing.filingDate)} · {filing.dependencyIds.length} documented {filing.dependencyIds.length===1?'dependency':'dependencies'}</small>
          <b>↗</b>
        </button>)}
      </section>

      <section className="recallXProvenanceBar">
        <button onClick={()=>setShowProvenance(value=>!value)} aria-expanded={showProvenance}>Provenance <span>{showProvenance?'−':'+'}</span></button>
        <p>Recorded source evidence · Captured {data.capturedAt}</p>
      </section>

      {showProvenance&&<dl className="recallXProvenance">
        <div><dt>Relationship</dt><dd>{selected.relationship?relationshipLabel(selected.relationship.state):'Incident dependency'}</dd></div>
        <div><dt>Incident evidence SHA-256</dt><dd><code>{selected.dependency.incidentEvidence.sha256}</code></dd></div>
        <div><dt>Capture date</dt><dd>{data.capturedAt}</dd></div>
        <div><dt>Source mode</dt><dd>Recorded public incident</dd></div>
      </dl>}
    </>}
  </main>
}
