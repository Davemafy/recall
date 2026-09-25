'use client';
import {useMemo,useState} from 'react';
import CockpitShell,{SummaryCards} from './CockpitShell';
import RecallWorkspace from './RecallWorkspace';
import {ingestFile,ImportedDocument} from '../lib/browser-ingest';
// @ts-ignore deterministic citation engine
import {extractCitations,deriveIncidentContext} from '../lib/recall-core.mjs';

export default function CorpusImport(){
 const [docs,setDocs]=useState<ImportedDocument[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [selected,setSelected]=useState<any>(null);
 const authorities=useMemo(()=>{const map=new Map<string,any>();for(const d of docs){for(const c of extractCitations(d.text)){const item=map.get(c.canonicalId)||{canonicalId:c.canonicalId,citation:c.volume+' '+c.reporter+' '+c.firstPage,caseName:c.caseName||'Unnamed authority',count:0,examples:[]};item.count++;if(item.examples.length<2)item.examples.push({doc:d.title,raw:c.raw});map.set(c.canonicalId,item)}}return [...map.values()].sort((a,b)=>b.count-a.count)},[docs]);
 const importFiles=async(files:FileList|null)=>{if(!files)return;setBusy(true);setError('');try{const arr=[];for(let i=0;i<files.length;i++)arr.push(await ingestFile(files[i],i));setDocs(arr);setSelected(null)}catch(e:any){setError(e.message)}finally{setBusy(false)}};
 if(selected&&docs.length){const context=deriveIncidentContext(docs,selected);return <RecallWorkspace mode="real" documents={docs} incident={{...selected,...context,reason:'User-flagged authority under incident review.'}}/>}

 return <CockpitShell pageTitle="Corpus" heading="Import" code="#LOCAL" status="Local browser session">
   <SummaryCards items={[
     {label:'Documents',value:String(docs.length).padStart(2,'0')},
     {label:'Authorities Found',value:String(authorities.length).padStart(2,'0')},
     {label:'Upload State',value:busy?'READ':'READY',icon:'vertical'},
     {label:'Server Upload',value:'NONE',icon:'vertical'}
   ]}/>

   <section className="fc-timeline fc-corpus-panel">
     <header className="fc-panel-heading"><div><h2>Bring the work</h2><small>PDF / TXT / MD / DOCX · citation parsing stays in this browser session</small></div><span className="fc-state-chip">{busy?'READING':'LOCAL'}</span></header>
     <label className="fc-dropzone">
       <input type="file" multiple accept=".pdf,.txt,.md,.docx" onChange={e=>importFiles(e.target.files)}/>
       <span>{busy?'READING CORPUS':'DROP FILES'}</span>
       <strong>{busy?'Parsing dependencies…':'Bring briefs, memos, research, or filings.'}</strong>
       <small>Nothing in this prototype uploads corpus contents to RECALL servers.</small>
     </label>
     {error&&<div className="fc-error" role="alert">{error}</div>}
   </section>

   <section className="fc-insights fc-corpus-insights">
     <section className="fc-panel fc-authority-panel">
       <header className="fc-panel-heading compact"><div><h2>Authorities</h2><small>Select one to open an incident</small></div><strong className="fc-panel-total">{String(authorities.length).padStart(2,'0')}</strong></header>
       <div className="fc-authority-list">
         {authorities.slice(0,8).map((authority:any)=><button key={authority.canonicalId} onClick={()=>setSelected(authority)}><span>{String(authority.count).padStart(2,'0')}</span><div><strong>{authority.caseName}</strong><small>{authority.citation}</small></div><b>↗</b></button>)}
         {!authorities.length&&<p>No supported reporter citations loaded yet.</p>}
       </div>
     </section>
     <section className="fc-panel">
       <header className="fc-panel-heading compact"><div><h2>Local Parsing</h2><small>No corpus upload</small></div></header>
       <div className="fc-callout-body"><p>RECALL reads supported local files in your browser, extracts reporter citations, and lets you promote one authority into the same incident engine.</p></div>
     </section>
     <section className="fc-panel">
       <header className="fc-panel-heading compact"><div><h2>Import Summary</h2><small>Current session</small></div></header>
       <div className="importSummary fc-import-summary"><div><b>{docs.length}</b><span>documents</span></div><div><b>{authorities.length}</b><span>authorities found</span></div></div>
     </section>
   </section>
 </CockpitShell>
}
