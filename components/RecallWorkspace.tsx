'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
// @ts-ignore JS core is intentionally dependency-free for benchmark parity
import {analyzeCorpus,graphFor,remediationFor,INCIDENT_CASE,INCIDENT_CITATION} from '../lib/recall-core.mjs';
// @ts-ignore
import {createDemoCorpus,DEMO_INCIDENT} from '../lib/demo-corpus.mjs';

type Props={mode:'demo'|'real';documents?:any[];incident?:any};

const edgeLabel=(t:string)=>t==='CONFIRMED_CITATION_DEPENDENCY'?'Confirmed citation':t==='CONFIRMED_QUOTE_REUSE'?'Confirmed quote reuse':'Possible related claim';
const edgeShort=(t:string)=>t==='CONFIRMED_CITATION_DEPENDENCY'?'CITATION':t==='CONFIRMED_QUOTE_REUSE'?'QUOTE':'POSSIBLE';

function EvidenceGraph({graph,stage,onSelect}:{graph:any;stage:number;onSelect:(id:string)=>void}){
  const docs=graph.nodes.filter((n:any)=>n.type==='DOCUMENT');
  const mids=graph.nodes.filter((n:any)=>n.type==='QUOTE'||n.type==='PROPOSITION');
  const matters=graph.nodes.filter((n:any)=>n.type==='MATTER');
  const visibleDocs=stage>=3?docs:[]; const visibleMids=stage>=2?mids:[]; const visibleMatters=stage>=4?matters:[];
  const all=[graph.nodes[0],...visibleMids,...visibleDocs,...visibleMatters];
  const positions=new Map<string,{x:number,y:number}>();
  positions.set('authority:incident',{x:120,y:240});
  visibleMids.forEach((n:any,i:number)=>positions.set(n.id,{x:360,y:90+i*Math.min(65,360/Math.max(1,visibleMids.length-1))}));
  visibleDocs.forEach((n:any,i:number)=>positions.set(n.id,{x:620,y:48+i*(410/Math.max(1,visibleDocs.length-1))}));
  visibleMatters.forEach((n:any,i:number)=>positions.set(n.id,{x:875,y:90+i*(330/Math.max(1,visibleMatters.length-1))}));
  const visibleEdges=graph.edges.filter((e:any)=>positions.has(e.source)&&positions.has(e.target)&&(
    e.type==='MATTER_LINK'?stage>=4:e.type==='POSSIBLE_DERIVED_CLAIM'?stage>=5:true
  ));
  return <div className="graphShell">
    <svg className="graphSvg" viewBox="0 0 1000 500" role="img" aria-label="Dependency graph">
      {visibleEdges.map((e:any)=>{const a=positions.get(e.source)!,b=positions.get(e.target)!;return <path key={e.id} className={`graphEdge ${e.type}`} d={`M ${a.x} ${a.y} C ${(a.x+b.x)/2} ${a.y}, ${(a.x+b.x)/2} ${b.y}, ${b.x} ${b.y}`}/>})}
      {all.map((n:any)=>{const p=positions.get(n.id);if(!p)return null; const w=n.type==='AUTHORITY'?190:n.type==='DOCUMENT'?170:135; const h=n.type==='AUTHORITY'?72:48;return <g key={n.id} className={`graphNode ${n.type}`} onClick={()=>onSelect(n.id)} tabIndex={0} role="button">
        <rect x={p.x-w/2} y={p.y-h/2} width={w} height={h} rx={n.type==='AUTHORITY'?4:2}/>
        <text x={p.x} y={p.y-(n.type==='AUTHORITY'?8:2)} textAnchor="middle">{String(n.label).split('\n')[0].slice(0,30)}</text>
        {n.type==='AUTHORITY'&&<text x={p.x} y={p.y+14} textAnchor="middle" className="nodeSub">{String(n.label).split('\n')[1]}</text>}
        {n.type==='DOCUMENT'&&<text x={p.x} y={p.y+14} textAnchor="middle" className="nodeSub">{n.status}</text>}
      </g>})}
    </svg>
    <div className="graphLegend"><span><i className="legend solid"/>confirmed citation</span><span><i className="legend thick"/>quote reuse</span><span><i className="legend dotted"/>possible — review</span></div>
  </div>
}

export default function RecallWorkspace({mode,documents,incident}:Props){
  const corpus=useMemo(()=>documents||createDemoCorpus(),[documents]);
  const activeIncident=useMemo(()=>incident||{caseName:INCIDENT_CASE,citation:INCIDENT_CITATION,canonicalId:'999|F.4th|123',quote:'the procedural guarantee attaches before the agency imposes a material deprivation',proposition:'the procedural guarantee attaches before the agency imposes a material deprivation',reason:DEMO_INCIDENT.reason},[incident]);
  const analysis=useMemo(()=>analyzeCorpus(corpus,activeIncident),[corpus,activeIncident]);
  const graph=useMemo(()=>graphFor(corpus,analysis,activeIncident),[corpus,analysis,activeIncident]);
  const remediation=useMemo(()=>remediationFor(corpus,analysis),[corpus,analysis]);
  const [stage,setStage]=useState(mode==='demo'?0:5); const [running,setRunning]=useState(false); const [selectedDoc,setSelectedDoc]=useState<any>(null); const [tab,setTab]=useState<'graph'|'queue'>('graph');
  const [queueState,setQueueState]=useState<Record<string,string>>({});
  useEffect(()=>{try{setQueueState(JSON.parse(localStorage.getItem('recall-remediation')||'{}'))}catch{}},[]);
  const run=async()=>{setRunning(true);setSelectedDoc(null);setTab('graph');setStage(1);for(const s of [2,3,4,5]){await new Promise(r=>setTimeout(r,650));setStage(s)}setRunning(false)};
  const replay=()=>{setStage(0);setRunning(false);setSelectedDoc(null)};
  const selectNode=(id:string)=>{if(id.startsWith('doc:')) setSelectedDoc(corpus.find((d:any)=>d.id===id.slice(4)))};
  const updateQueue=(id:string,status:string)=>{const next={...queueState,[id]:status};setQueueState(next);localStorage.setItem('recall-remediation',JSON.stringify(next))};
  const s=analysis.summary;
  return <main className="workspace">
    <header className="workMast"><Link href="/" className="wordmark">RECALL</Link><div className="incidentCrumb">Incident / {mode==='demo'?'Martinez authority':'Corpus incident'}</div><div className="demoPill">{mode==='demo'?'DEMO DATA':'LOCAL CORPUS'}</div></header>
    <section className="incidentHeader">
      <div><div className="heroIndex">OPEN INCIDENT</div><h1>{activeIncident.caseName||'Selected authority'}</h1><div className="citationLine">{activeIncident.citation||INCIDENT_CITATION}</div></div>
      <p>{activeIncident.reason||'User-flagged authority under incident review.'}</p>
      <div className="incidentActions">{stage===0?<button className="button danger" onClick={run} disabled={running}>Trace blast radius <span>→</span></button>:<button className="button ghost small" onClick={replay}>Replay</button>}</div>
    </section>

    <div className="workTabs"><button className={tab==='graph'?'active':''} onClick={()=>setTab('graph')}>Blast radius</button><button className={tab==='queue'?'active':''} onClick={()=>setTab('queue')}>Remediation <span>{stage>=5?remediation.length:'—'}</span></button></div>

    {tab==='graph'?<section className="investigationGrid">
      <aside className="incidentRail">
        <div className="railLabel">INCIDENT AUTHORITY</div><div className="authorityCard"><div className="statusDot"/><strong>{activeIncident.caseName||'Selected authority'}</strong><span>{activeIncident.citation||INCIDENT_CITATION}</span><small>USER-FLAGGED INCIDENT</small></div>
        <div className="railBlock"><span>Reason</span><p>{activeIncident.reason||'User-flagged authority under incident review.'}</p></div>
        <div className="railBlock"><span>Provenance law</span><p>Confirmed edges require deterministic citation or quotation evidence. Similarity alone is review-only.</p></div>
      </aside>
      <section className="graphStage">
        <div className="graphTitle"><div><span>DEPENDENCY MAP</span><h2>{stage===0?'Ready to trace.':stage<5?'Tracing dependencies…':'Blast radius established.'}</h2></div>{stage>=5&&<div className="graphCount">{s.confirmedAffectedDocuments}<small>confirmed docs</small></div>}</div>
        <EvidenceGraph graph={graph} stage={stage} onSelect={selectNode}/>
        {stage>=5&&<div className="proofStrip"><strong>Confirmed is intentionally narrow.</strong><span>{s.possibleDerivedClaims} semantic candidate{s.possibleDerivedClaims===1?'':'s'} kept outside confirmed counts.</span></div>}
      </section>
      <aside className="summaryRail">
        <div className="railLabel">BLAST RADIUS</div>
        <div className="metricHero"><strong>{stage>=5?s.affectedDocuments:'—'}</strong><span>documents deserve review</span></div>
        <div className="metricList"><div><b>{stage>=1?s.confirmedCitationDependencies:'—'}</b><span>confirmed citations</span></div><div><b>{stage>=2?s.confirmedQuoteReuse:'—'}</b><span>quote reuses</span></div><div><b>{stage>=5?s.possibleDerivedClaims:'—'}</b><span>possible claims</span></div><div><b>{stage>=4?s.filedDocuments:'—'}</b><span>filed documents</span></div></div>
        {stage>=3&&<div className="affectedList"><div className="railLabel">AFFECTED WORK</div>{analysis.affectedDocuments.slice(0,7).map((d:any)=><button key={d.id} onClick={()=>setSelectedDoc(d)}><span className={`docStatus ${d.status}`}>{d.status}</span><strong>{d.title}</strong><small>{d.matterName||'No matter metadata'}</small></button>)}</div>}
      </aside>
    </section>:<section className="queueView"><div className="queueIntro"><div className="heroIndex">REMEDIATION</div><h2>What needs attention now.</h2><p>Priority comes from explicit document status and dependency type — not an AI risk score.</p></div><div className="queueList">{remediation.map((item:any)=><article key={item.id}><div className={`priority ${item.priority}`}>{item.priority}</div><div><h3>{item.documentTitle}</h3><p>{edgeLabel(item.dependencyType)}</p><small>{item.recommendedAction}</small></div><select value={queueState[item.id]||'OPEN'} onChange={e=>updateQueue(item.id,e.target.value)}><option>OPEN</option><option>REVIEWED</option><option>NEEDS_CORRECTION</option><option>RESOLVED</option><option>NOT_RELATED</option></select></article>)}</div></section>}

    {selectedDoc&&<div className="drawerBackdrop" onClick={()=>setSelectedDoc(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="drawerClose" onClick={()=>setSelectedDoc(null)}>×</button><div className="heroIndex">DOCUMENT EVIDENCE</div><h2>{selectedDoc.title}</h2><div className="drawerMeta"><span>{selectedDoc.status}</span><span>{selectedDoc.matterName||'Matter unknown'}</span><span>{selectedDoc.versionLabel||'Version unknown'}</span></div>{(analysis.byDoc.get(selectedDoc.id)||[]).map((e:any)=><div className={`evidenceBlock ${e.type}`} key={e.id}><div className="edgeKind">{edgeShort(e.type)}</div><blockquote>{e.evidence.raw}</blockquote><p>{e.evidence.rule}</p>{e.type==='POSSIBLE_DERIVED_CLAIM'&&<strong>Human review required.</strong>}</div>)}<div className="documentText">{selectedDoc.text}</div></aside></div>}
  </main>
}
