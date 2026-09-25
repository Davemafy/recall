'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import RecallWorkspace from './RecallWorkspace';
import {ingestFile,ImportedDocument} from '../lib/browser-ingest';
// @ts-ignore
import {extractCitations} from '../lib/recall-core.mjs';

export default function CorpusImport(){
 const [docs,setDocs]=useState<ImportedDocument[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [selected,setSelected]=useState<any>(null);
 const authorities=useMemo(()=>{const map=new Map<string,any>(); for(const d of docs){for(const c of extractCitations(d.text)){const item=map.get(c.canonicalId)||{canonicalId:c.canonicalId,citation:`${c.volume} ${c.reporter} ${c.firstPage}`,caseName:c.caseName||'Unnamed authority',count:0,examples:[]};item.count++;if(item.examples.length<2)item.examples.push({doc:d.title,raw:c.raw});map.set(c.canonicalId,item)}}return [...map.values()].sort((a,b)=>b.count-a.count)},[docs]);
 const authorityCount=authorities.length;
 const importFiles=async(files:FileList|null)=>{if(!files)return;setBusy(true);setError('');try{const arr=[];for(let i=0;i<files.length;i++)arr.push(await ingestFile(files[i],i));setDocs(arr);setSelected(null)}catch(e:any){setError(e.message)}finally{setBusy(false)}};
 if(selected&&docs.length) return <RecallWorkspace mode="real" documents={docs} incident={{...selected,quote:'',proposition:'',reason:'User-flagged authority under incident review.'}}/>;
 return <main className="importPage"><header className="workMast"><Link href="/" className="wordmark">RECALL</Link><div className="incidentCrumb">Corpus discovery</div><div className="demoPill">LOCAL SESSION</div></header><section className="importHero"><div className="heroIndex">CORPUS DISCOVERY</div><h1>Bring the work.<br/><em>Map the dependencies.</em></h1><p>Upload briefs, memos, research, or filings. RECALL parses legal citations locally in this browser session and lets you open an incident from the resulting corpus.</p><label className="dropzone"><input type="file" multiple accept=".pdf,.txt,.md,.docx" onChange={e=>importFiles(e.target.files)}/><strong>{busy?'Reading corpus…':'Drop legal work here'}</strong><span>PDF · TXT · MD · DOCX · up to 12 MB each</span></label>{error&&<div className="errorBox">{error}</div>}{docs.length>0&&<><div className="importSummary"><div><b>{docs.length}</b><span>documents</span></div><div><b>{authorityCount}</b><span>authorities found</span></div></div><div className="authorityBrowser"><div className="heroIndex">SELECT AN AUTHORITY TO OPEN AN INCIDENT</div>{authorities.length===0?<p>No supported reporter citations were found in this corpus.</p>:authorities.slice(0,20).map((a:any)=><button key={a.canonicalId} onClick={()=>setSelected(a)}><span>{a.count} occurrence{a.count===1?'':'s'}</span><strong>{a.caseName}</strong><em>{a.citation}</em></button>)}</div></>}<p className="micro">Prototype privacy: files are parsed in your browser. This build does not upload corpus contents to RECALL servers.</p></section></main>
}
