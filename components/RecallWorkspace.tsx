'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
// @ts-ignore shared deterministic core
import {analyzeCorpus,remediationFor,INCIDENT_CASE,INCIDENT_CITATION} from '../lib/recall-core.mjs';
// @ts-ignore demo fixture
import {createDemoCorpus,DEMO_INCIDENT} from '../lib/demo-corpus.mjs';
// @ts-ignore shared relationship constants
import {RELATIONSHIP_STATE} from '../lib/domain.mjs';

type Props={mode:'demo'|'real';documents?:any[];incident?:any};

const relationLabel=(type:string)=>type===RELATIONSHIP_STATE.CONFIRMED_CITATION?'Confirmed citation':type===RELATIONSHIP_STATE.CONFIRMED_QUOTE?'Confirmed quote reuse':'Possible related proposition';

export default function RecallWorkspace({mode,documents,incident}:Props){
  const corpus=useMemo(()=>documents||createDemoCorpus(),[documents]);
  const activeIncident=useMemo(()=>incident||{
    caseName:INCIDENT_CASE,citation:INCIDENT_CITATION,canonicalId:'999|F.4th|123',
    quote:'the procedural guarantee attaches before the agency imposes a material deprivation',
    proposition:'the procedural guarantee attaches before the agency imposes a material deprivation',
    reason:DEMO_INCIDENT.reason
  },[incident]);
  const analysis=useMemo(()=>analyzeCorpus(corpus,activeIncident),[corpus,activeIncident]);
  const remediation=useMemo(()=>remediationFor(corpus,analysis),[corpus,analysis]);

  const [traced,setTraced]=useState(mode==='real');
  const [selectedDoc,setSelectedDoc]=useState<any>(()=>analysis.affectedDocuments?.[0]||null);
  const [queueState,setQueueState]=useState<Record<string,string>>({});

  useEffect(()=>{try{setQueueState(JSON.parse(localStorage.getItem('recall-remediation')||'{}'))}catch{}},[]);
  const updateQueue=(id:string,status:string)=>{
    const next={...queueState,[id]:status};
    setQueueState(next);
    localStorage.setItem('recall-remediation',JSON.stringify(next));
  };

  const summary=analysis.summary;
  const selectedEdges=selectedDoc?(analysis.byDoc.get(selectedDoc.id)||[]):[];

  return <main className="corpusIncidentPage">
    <header className="recallXMast">
      <Link href="/" className="recallXBrand">RECALL</Link>
      <div className="recallXMastCase">Corpus incident</div>
      <div className="recallXMastMode"><span/>{mode==='real'?'Local corpus':'Demo corpus'}</div>
    </header>

    <section className="corpusIncidentHero">
      <div className="corpusIncidentIdentity">
        <span>INCIDENT AUTHORITY</span>
        <h1>{activeIncident.caseName||'Selected authority'}</h1>
        <strong>{activeIncident.citation||INCIDENT_CITATION}</strong>
        <p>{activeIncident.reason||'User-flagged authority under incident review.'}</p>
      </div>

      <div className="corpusIncidentCount">
        <strong>{traced?String(summary.confirmedAffectedDocuments).padStart(2,'0'):'—'}</strong>
        <span>CONFIRMED DOCS</span>
      </div>

      <div className="corpusIncidentAction">
        <span>CONFIRMATION LAW</span>
        <p>Confirmed relationships require deterministic citation or quotation evidence. Similarity stays review-only.</p>
        {!traced?<button onClick={()=>setTraced(true)}>Trace impact <b>↗</b></button>:<div className="corpusIncidentDone">Impact traced <b>●</b></div>}
      </div>
    </section>

    {traced&&<>
      <section className="corpusIncidentSummary">
        <div><strong>{summary.confirmedCitationDependencies}</strong><span>citation relationships</span></div>
        <i>+</i>
        <div><strong>{summary.confirmedQuoteReuse}</strong><span>quote reuse</span></div>
        <i>+</i>
        <div><strong>{summary.possibleDerivedClaims}</strong><span>review-only propositions</span></div>
        <p>{summary.affectedDocuments} documents deserve review. Confirmed totals intentionally exclude similarity-only matches.</p>
      </section>

      <section className="corpusIncidentLedger">
        <header><span>STATUS</span><span>DOCUMENT</span><span>DEPENDENCIES</span><span/></header>
        {analysis.affectedDocuments.map((doc:any)=>{
          const edges=analysis.byDoc.get(doc.id)||[];
          const confirmedEdges=edges.filter((edge:any)=>edge.type!==RELATIONSHIP_STATE.POSSIBLE);
          return <button key={doc.id} className={selectedDoc?.id===doc.id?'is-active':''} onClick={()=>setSelectedDoc(doc)}>
            <span>{doc.status||'UNKNOWN'}</span>
            <div><strong>{doc.title}</strong><small>{doc.matterName||'Matter metadata unavailable'}</small></div>
            <div>{confirmedEdges.map((edge:any)=><small key={edge.id}>{relationLabel(edge.type)}</small>)}{!confirmedEdges.length&&<small>Review-only relationship</small>}</div>
            <b>↗</b>
          </button>
        })}
      </section>

      {selectedDoc&&<section className="corpusIncidentEvidence" aria-label="Document evidence">
        <div className="corpusIncidentEvidenceMeta">
          <span>SELECTED DOCUMENT</span>
          <h2>{selectedDoc.title}</h2>
          <p>{selectedDoc.status||'UNKNOWN'} · {selectedDoc.matterName||'Matter unknown'} · {selectedDoc.versionLabel||'Version unknown'}</p>
        </div>
        <div className="corpusIncidentEvidenceBody">
          {selectedEdges.map((edge:any)=><article key={edge.id}>
            <div><span>{relationshipLabel(edge.type)}</span>{edge.type===RELATIONSHIP_STATE.POSSIBLE&&<small>REVIEW ONLY</small>}</div>
            <blockquote>“{edge.evidence.raw}”</blockquote>
            <p>{edge.evidence.rule}</p>
            {edge.type===RELATIONSHIP_STATE.POSSIBLE&&<strong>Similarity does not prove lineage.</strong>}
          </article>)}
        </div>
      </section>}

      <section className="corpusIncidentRemediation">
        <div className="corpusIncidentRemediationHead">
          <span>REMEDIATION</span>
          <h2>What needs attention now.</h2>
          <p>Priority is derived from explicit document status and dependency type — never an invented risk score.</p>
        </div>
        <div className="corpusIncidentQueue">
          {remediation.map((item:any)=><article key={item.id}>
            <span>{item.priority}</span>
            <div><strong>{item.documentTitle}</strong><small>{relationLabel(item.dependencyType)}</small></div>
            <p>{item.recommendedAction}</p>
            <select value={queueState[item.id]||'OPEN'} onChange={e=>updateQueue(item.id,e.target.value)}>
              <option>OPEN</option><option>REVIEWED</option><option>NEEDS_CORRECTION</option><option>RESOLVED</option><option>NOT_RELATED</option>
            </select>
          </article>)}
        </div>
      </section>
    </>}
  </main>
}
