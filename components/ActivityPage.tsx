'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import CockpitShell,{SummaryCards} from './CockpitShell';
import {clearActivity,loadActivity,RecallActivityEntry} from '../lib/recall-client';

type KindFilter='ALL'|'TRACE'|'INCIDENT';

export default function ActivityPage(){
  const [items,setItems]=useState<RecallActivityEntry[]>([]);
  const [filter,setFilter]=useState<KindFilter>('ALL');

  const refresh=()=>setItems(loadActivity());
  useEffect(()=>{
    refresh();
    const onChange=()=>refresh();
    window.addEventListener('recall-activity-change',onChange);
    return()=>window.removeEventListener('recall-activity-change',onChange);
  },[]);

  const visible=useMemo(()=>items.filter(item=>filter==='ALL'||item.kind===filter),[items,filter]);
  const confirmed=items.reduce((sum,item)=>sum+item.confirmed,0);
  const checked=items.reduce((sum,item)=>sum+item.checked,0);

  return <CockpitShell
    pageTitle="Activity"
    heading="Local activity"
    code="#BROWSER"
    status="Browser-only history"
    action={items.length?<button className="fc-secondary-button" onClick={()=>{clearActivity();refresh()}}>Clear history</button>:undefined}
  >
    <SummaryCards items={[
      {label:'Saved Sessions',value:String(items.length).padStart(2,'0')},
      {label:'Confirmed Hits',value:String(confirmed).padStart(2,'0')},
      {label:'Candidates Checked',value:String(checked).padStart(2,'0'),icon:'vertical'},
      {label:'Server Storage',value:'NONE',icon:'vertical'}
    ]}/>

    <section className="fc-product-surface">
      <header className="fc-product-toolbar">
        <div><h2>Recent browser activity</h2><small>RECALL stores only compact run metadata here—never uploaded corpus contents or disputed quotation text.</small></div>
        <select value={filter} onChange={e=>setFilter(e.target.value as KindFilter)} aria-label="Filter activity">
          <option value="ALL">All activity</option>
          <option value="TRACE">Public traces</option>
          <option value="INCIDENT">Incident traces</option>
        </select>
      </header>

      <div className="fc-table-shell">
        <div className="fc-table-head fc-activity-grid">
          <span>TIME</span><span>TYPE</span><span>RUN</span><span>CHECKED</span><span>CONFIRMED</span><span>DOCKETS</span><span/>
        </div>
        <div className="fc-table-body">
          {visible.map(item=><Link href={item.href} className="fc-table-row fc-activity-grid" key={item.id}>
            <span>{new Intl.DateTimeFormat('en',{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(item.createdAt))}</span>
            <span className="fc-table-status">{item.kind}</span>
            <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
            <span>{String(item.checked).padStart(2,'0')}</span>
            <span>{String(item.confirmed).padStart(2,'0')}</span>
            <span>{String(item.dockets).padStart(2,'0')}</span>
            <b>↗</b>
          </Link>)}
          {!visible.length&&<div className="fc-empty-state">
            <strong>No saved activity yet.</strong>
            <p>Run a public trace or incident trace. If history is enabled, RECALL will save only compact run metadata in this browser.</p>
            <div><Link href="/trace">Quick trace ↗</Link><Link href="/incident">New incident ↗</Link></div>
          </div>}
        </div>
      </div>
    </section>

    <section className="fc-product-footer-grid">
      <article><span>PRIVACY</span><strong>Browser-local by default</strong><p>Activity metadata stays in localStorage and can be disabled or cleared at any time.</p><Link href="/settings">Privacy settings ↗</Link></article>
      <article><span>PUBLIC TRACE</span><strong>Citation → candidate filings → exact evidence</strong><p>Saved activity records counts and citation labels, not disputed quotation bodies.</p><Link href="/trace">Run trace ↗</Link></article>
      <article><span>INCIDENT TRACE</span><strong>Multiple dependencies in one run</strong><p>Incident history records aggregate counts only; dependency text remains in the active session.</p><Link href="/incident">Open builder ↗</Link></article>
    </section>
  </CockpitShell>
}
