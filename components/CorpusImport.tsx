'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';
import RecallWorkspace from './RecallWorkspace';
import {ingestFile,ImportedDocument} from '../lib/browser-ingest';
// @ts-ignore shared deterministic citation engine
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
       const item=map.get(c.canonicalId)||{canonicalId:c.canonicalId,citation:c.volume+' '+c.reporter+' '+c.firstPage,caseName:c.caseName||'Unnamed authority',count:0,examples:[]};
       item.count++;
       if(item.examples.length<2)item.examples.push({doc:d.title,raw:c.raw});
       map.set(c.canonicalId,item);
     }
   }
   return [...map.values()].sort((a,b)=>b.count-a.count);
 },[docs]);

 const importFiles=async(files:FileList|null)=>{
   if(!files)return;
   setBusy(true);setError('');
   try{
     const arr=[];
     for(let i=0;i<files.length;i++)arr.push(await ingestFile(files[i],i));
     setDocs(arr);setSelected(null);
   }catch(e:any){setError(e.message)}
   finally{setBusy(false)}
 };

 if(selected&&docs.length){
   const context=deriveIncidentContext(docs,selected);
   return <RecallWorkspace mode="real" documents={docs} incident={{...selected,...context,reason:'User-flagged authority under incident review.'}}/>;
 }

 return <main className="corpusXPage">
   <header className="recallXMast">
     <Link href="/" className="recallXBrand">RECALL</Link>
     <div className="recallXMastCase">Corpus</div>
     <div className="recallXMastMode"><span/>Local browser session</div>
   </header>

   <section className="corpusXHero">
     <div className="corpusXIntro">
       <span>CORPUS / 03</span>
       <h1>Bring<br/>the work.</h1>
       <p>Upload briefs, memos, research, or filings. RECALL parses citations locally and lets you open an incident from the dependencies already inside your work.</p>
       <small>Nothing in this prototype uploads corpus contents to RECALL servers.</small>
     </div>

     <label className="corpusXDrop">
       <input type="file" multiple accept=".pdf,.txt,.md,.docx" onChange={e=>importFiles(e.target.files)}/>
       <span>{busy?'READING CORPUS':'DROP FILES'}</span>
       <strong>{busy?'Parsing dependencies…':'PDF / TXT / MD / DOCX'}</strong>
       <b>↘</b>
       <small>Up to 12 MB each</small>
     </label>
   </section>

   {error&&<div className="corpusXError" role="alert">{error}</div>}

   {docs.length>0&&<section className="corpusXResults">
     <div className="importSummary corpusXSummary">
       <div><b>{String(docs.length).padStart(2,'0')}</b><span>documents</span></div>
       <i>→</i>
       <div><b>{String(authorities.length).padStart(2,'0')}</b><span>authorities found</span></div>
       <p>Select one authority to open an incident against this local corpus.</p>
     </div>

     <div className="corpusXLedger">
       <header><span>OCCURRENCES</span><span>AUTHORITY</span><span>CITATION</span><span/></header>
       {authorities.length===0?<p>No supported reporter citations were found in this corpus.</p>:authorities.slice(0,20).map((authority:any)=><button key={authority.canonicalId} onClick={()=>setSelected(authority)}>
         <span>{String(authority.count).padStart(2,'0')}</span>
         <strong>{authority.caseName}</strong>
         <em>{authority.citation}</em>
         <b>↗</b>
       </button>)}
     </div>
   </section>}
 </main>
}
