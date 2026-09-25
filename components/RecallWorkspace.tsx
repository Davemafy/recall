'use client';
import {useEffect,useMemo,useState} from 'react';
import CockpitShell,{SummaryCards} from './CockpitShell';
// @ts-ignore shared core
import {analyzeCorpus,remediationFor,INCIDENT_CASE,INCIDENT_CITATION} from '../lib/recall-core.mjs';
// @ts-ignore fixture
import {createDemoCorpus,DEMO_INCIDENT} from '../lib/demo-corpus.mjs';
// @ts-ignore constants
import {RELATIONSHIP_STATE} from '../lib/domain.mjs';

type Props={mode:'demo'|'real';documents?:any[];incident?:any};
const relationLabel=(type:string)=>type===RELATIONSHIP_STATE.CONFIRMED_CITATION?'Confirmed citation':type===RELATIONSHIP_STATE.CONFIRMED_QUOTE?'Confirmed quote reuse':'Possible related proposition';

export default function RecallWorkspace({mode,documents,incident}:Props){
 const corpus=useMemo(()=>documents||createDemoCorpus(),[documents]);
 const activeIncident=useMemo(()=>incident||{caseName:INCIDENT_CASE,citation:INCIDENT_CITATION,canonicalId:'999|F.4th|123',quote:'the procedural guarantee attaches before the agency imposes a material deprivation',proposition:'the procedural guarantee attaches before the agency imposes a material deprivation',reason:DEMO_INCIDENT.reason},[incident]);
 const analysis=useMemo(()=>analyzeCorpus(corpus,activeIncident),[corpus,activeIncident]);
 const remediation=useMemo(()=>remediationFor(corpus,analysis),[corpus,analysis]);
 const [selectedDoc,setSelectedDoc]=useState<any>(()=>analysis.affectedDocuments?.[0]||null); const [queueState,setQueueState]=useState<Record<string,string>>({});
 useEffect(()=>{try{setQueueState(JSON.parse(localStorage.getItem('recall-remediation')||'{}'))}catch{}},[]);
 const updateQueue=(id:string,status:string)=>{const next={...queueState,[id]:status};setQueueState(next);localStorage.setItem('recall-remediation',JSON.stringify(next))};
 const summary=analysis.summary; const selectedEdges=selectedDoc?(analysis.byDoc.get(selectedDoc.id)||[]):[];

 return <CockpitShell pageTitle={activeIncident.caseName||'Corpus incident'} heading="Corpus incident" status={mode==='real'?'Local corpus':'Demo corpus'}>
   <SummaryCards items={[
     {label:'Confirmed Docs',value:String(summary.confirmedAffectedDocuments).padStart(2,'0')},
     {label:'Citation Relations',value:String(summary.confirmedCitationDependencies).padStart(2,'0')},
     {label:'Quote Reuse',value:String(summary.confirmedQuoteReuse).padStart(2,'0'),icon:'vertical'},
     {label:'Review Only',value:String(summary.possibleDerivedClaims).padStart(2,'0'),icon:'vertical'}
   ]}/>

   <section className="fc-timeline fc-workspace-panel">
     <header className="fc-panel-heading"><div><h2>{activeIncident.caseName||'Selected authority'}</h2><small>{activeIncident.citation||INCIDENT_CITATION} · {activeIncident.reason||'User-flagged authority under incident review.'}</small></div><span className="fc-state-chip">CONFIRMED DOCS {summary.confirmedAffectedDocuments}</span></header>
     <div className="fc-workspace-list">
       {analysis.affectedDocuments.map((doc:any)=>{const edges=analysis.byDoc.get(doc.id)||[];return <button key={doc.id} className={selectedDoc?.id===doc.id?'is-selected':''} onClick={()=>setSelectedDoc(doc)}><span>{doc.status||'UNKNOWN'}</span><div><strong>{doc.title}</strong><small>{doc.matterName||'Matter metadata unavailable'} · {edges.map((e:any)=>relationLabel(e.type)).join(' · ')}</small></div><b>↗</b></button>})}
     </div>
   </section>

   <section className="fc-insights">
     <section className="fc-panel fc-workspace-evidence">
       <header className="fc-panel-heading compact"><div><h2>Selected Evidence</h2><small>{selectedDoc?.title||'Choose a document'}</small></div></header>
       <div className="fc-evidence-mini">{selectedEdges.map((edge:any)=><article key={edge.id}><span>{relationLabel(edge.type)}</span><blockquote>“{edge.evidence.raw}”</blockquote><small>{edge.evidence.rule}</small></article>)}{!selectedEdges.length&&<p>No relationship selected.</p>}</div>
     </section>
     <section className="fc-panel">
       <header className="fc-panel-heading compact"><div><h2>Remediation</h2><small>Explicit status only</small></div></header>
       <div className="fc-remediation-list">{remediation.slice(0,4).map((item:any)=><article key={item.id}><div><strong>{item.documentTitle}</strong><small>{item.recommendedAction}</small></div><select value={queueState[item.id]||'OPEN'} onChange={e=>updateQueue(item.id,e.target.value)}><option>OPEN</option><option>REVIEWED</option><option>NEEDS_CORRECTION</option><option>RESOLVED</option><option>NOT_RELATED</option></select></article>)}</div>
     </section>
     <section className="fc-panel">
       <header className="fc-panel-heading compact"><div><h2>Truth Model</h2><small>Epistemic boundary</small></div></header>
       <div className="fc-callout-body"><p>Confirmed totals exclude similarity-only relationships. Possible propositions remain review-only until deterministic evidence exists.</p></div>
     </section>
   </section>
 </CockpitShell>
}
