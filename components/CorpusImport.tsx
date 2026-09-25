'use client';
import {useMemo,useState} from 'react';
import CockpitShell,{SummaryCards} from './CockpitShell';
import RecallWorkspace from './RecallWorkspace';
import {ingestFile,ImportedDocument} from '../lib/browser-ingest';
// @ts-ignore deterministic citation engine
import {extractCitations,deriveIncidentContext} from '../lib/recall-core.mjs';

export default function CorpusImport(){
  const [docs,setDocs]=useState<ImportedDocument[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [selected,setSelected]=useState<any>(null);

  const authorities=useMemo(()=>{
    const map=new Map<string,any>();
    for(const d of docs){
      for(const c of extractCitations(d.text)){
        const item=map.get(c.canonicalId)||{
          canonicalId:c.canonicalId,
          citation:c.volume+' '+c.reporter+' '+c.firstPage,
          caseName:c.caseName||'Unnamed authority',
          count:0,
          examples:[]
        };
        item.count++;
        if(item.examples.length<2)item.examples.push({doc:d.title,raw:c.raw});
        map.set(c.canonicalId,item);
      }
    }
    return [...map.values()].sort((a,b)=>b.count-a.count);
  },[docs]);

  const importFiles=async(files:FileList|null)=>{
    if(!files)return;
    setBusy(true);
    setError('');
    try{
      const arr=[];
      for(let i=0;i<files.length;i++)arr.push(await ingestFile(files[i],i));
      setDocs(arr);
      setSelected(null);
    }catch(e:any){
      setError(e.message);
    }finally{
      setBusy(false);
    }
  };

  if(selected&&docs.length){
    const context=deriveIncidentContext(docs,selected);
    return <RecallWorkspace mode="real" documents={docs} incident={{...selected,...context,reason:'User-flagged authority under incident review.'}}/>;
  }

  const hasCorpus=docs.length>0;

  return <CockpitShell pageTitle="Corpus" heading="Local corpus" status="Browser-only parsing">
    {hasCorpus&&<SummaryCards items={[
      {label:'Documents',value:String(docs.length).padStart(2,'0')},
      {label:'Authorities Found',value:String(authorities.length).padStart(2,'0')},
      {label:'Parsing State',value:busy?'READ':'READY',icon:'vertical'},
      {label:'Server Upload',value:'NONE',icon:'vertical'}
    ]}/>}

    <section className={'fc-timeline fc-corpus-panel '+(!hasCorpus?'fc-focused-workspace':'')}>
      <header className="fc-panel-heading">
        <div><h2>Bring the work</h2><small>PDF / TXT / MD / DOCX · citation parsing stays in this browser session</small></div>
        <span className="fc-state-chip">{busy?'READING':hasCorpus?'PARSED':'LOCAL'}</span>
      </header>
      <label className="fc-dropzone">
        <input type="file" multiple accept=".pdf,.txt,.md,.docx" onChange={e=>importFiles(e.target.files)}/>
        <span>{busy?'READING CORPUS':hasCorpus?'ADD OR REPLACE FILES':'DROP FILES'}</span>
        <strong>{busy?'Parsing dependencies…':hasCorpus?docs.length+' document'+(docs.length===1?'':'s')+' loaded':'Bring briefs, memos, research, or filings.'}</strong>
        <small>{hasCorpus?'Select an authority below to open it in the same incident engine.':'Nothing in this prototype uploads corpus contents to RECALL servers.'}</small>
      </label>
      {error&&<div className="fc-error" role="alert">{error}</div>}
      {!hasCorpus&&!busy&&!error&&<p className="fc-run-boundary fc-corpus-boundary">Local parsing extracts supported reporter citations in this browser session. The corpus itself is not sent to a RECALL server.</p>}
    </section>

    {hasCorpus&&<section className="fc-insights fc-corpus-insights fc-results-reveal">
      <section className="fc-panel fc-authority-panel">
        <header className="fc-panel-heading compact">
          <div><h2>Authorities</h2><small>Select one to open an incident</small></div>
          <strong className="fc-panel-total">{String(authorities.length).padStart(2,'0')}</strong>
        </header>
        <div className="fc-authority-list">
          {authorities.slice(0,8).map((authority:any)=><button key={authority.canonicalId} onClick={()=>setSelected(authority)}>
            <span>{String(authority.count).padStart(2,'0')}</span>
            <div><strong>{authority.caseName}</strong><small>{authority.citation}</small></div>
            <b>↗</b>
          </button>)}
          {!authorities.length&&<p>No supported reporter citations were found in this corpus.</p>}
        </div>
      </section>

      <section className="fc-panel fc-corpus-summary-panel">
        <header className="fc-panel-heading compact"><div><h2>Current session</h2><small>Browser-local parsing record</small></div></header>
        <div className="importSummary fc-import-summary">
          <div><b>{docs.length}</b><span>documents</span></div>
          <div><b>{authorities.length}</b><span>authorities found</span></div>
        </div>
        <div className="fc-callout-body"><p>No server upload. No similarity model is required to extract supported reporter citations.</p></div>
      </section>
    </section>}
  </CockpitShell>
}