'use client';

import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import CockpitShell,{SummaryCards} from './CockpitShell';
import {clearActivity,loadActivity,RecallActivityEntry} from '../lib/recall-client';

type Filter='ALL'|'RECORDED'|'TRACE'|'INCIDENT';

const recorded={
  id:'johnson-dunn-2025',
  kind:'RECORDED' as const,
  title:'Johnson v. Dunn',
  subtitle:'N.D. Alabama · 2:21-cv-01701-AMM',
  status:'SOURCE-BACKED',
  dependencies:5,
  filings:2,
  relationships:5,
  updated:'Captured Sep 25, 2026',
  href:'/incident/demo'
};

export default function IncidentsRegistry(){
  const [activity,setActivity]=useState<RecallActivityEntry[]>([]);
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState<Filter>('ALL');

  const refresh=()=>setActivity(loadActivity());

  useEffect(()=>{
    refresh();
    const onChange=()=>refresh();
    window.addEventListener('recall-activity-change',onChange);
    return()=>window.removeEventListener('recall-activity-change',onChange);
  },[]);

  const rows=useMemo(()=>{
    const recent=activity.map(item=>({
      id:item.id,
      kind:item.kind,
      title:item.title,
      subtitle:item.subtitle,
      status:item.kind==='TRACE'?'PUBLIC TRACE':'LOCAL INCIDENT',
      dependencies:item.kind==='INCIDENT'?item.checked:1,
      filings:item.confirmed,
      relationships:item.confirmed,
      updated:new Intl.DateTimeFormat('en',{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(item.createdAt)),
      href:item.href
    }));
    const all=[recorded,...recent];
    return all.filter(item=>{
      const matchesFilter=filter==='ALL'||item.kind===filter;
      const haystack=(item.title+' '+item.subtitle+' '+item.status).toLowerCase();
      return matchesFilter&&haystack.includes(query.trim().toLowerCase());
    });
  },[activity,query,filter]);

  const localRuns=activity.length;
  const confirmed=activity.reduce((sum,item)=>sum+item.confirmed,0)+recorded.relationships;

  return <CockpitShell
    pageTitle="Incidents"
    heading="Incident registry"
    code="#WORK"
    status="Recorded + browser-local"
    action={<Link className="fc-metal-button fc-action-link" href="/incident">New incident</Link>}
  >
    <SummaryCards items={[
      {label:'Recorded Incidents',value:'01'},
      {label:'Local Sessions',value:String(localRuns).padStart(2,'0')},
      {label:'Confirmed Relations',value:String(confirmed).padStart(2,'0'),icon:'vertical'},
      {label:'Public Dockets',value:'01',icon:'vertical'}
    ]}/>

    <section className="fc-product-surface">
      <header className="fc-product-toolbar">
        <div>
          <h2>Investigations</h2>
          <small>One recorded public incident plus browser-local trace sessions. Raw corpus text is never stored here.</small>
        </div>
        <div className="fc-product-tools">
          <label className="fc-search-field">
            <span className="sr-only">Search investigations</span>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search case, citation, docket…"/>
          </label>
          <select value={filter} onChange={e=>setFilter(e.target.value as Filter)} aria-label="Filter investigations">
            <option value="ALL">All</option>
            <option value="RECORDED">Recorded</option>
            <option value="TRACE">Public traces</option>
            <option value="INCIDENT">Local incidents</option>
          </select>
          {activity.length>0&&<button className="fc-quiet-button" onClick={()=>{clearActivity();refresh()}}>Clear local history</button>}
        </div>
      </header>

      <div className="fc-table-shell">
        <div className="fc-table-head fc-incident-grid">
          <span>INVESTIGATION</span><span>TYPE</span><span>DEPENDENCIES</span><span>AFFECTED</span><span>CONFIRMED</span><span>UPDATED</span><span/>
        </div>
        <div className="fc-table-body">
          {rows.map(item=><Link href={item.href} className="fc-table-row fc-incident-grid" key={item.id}>
            <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
            <span className={'fc-table-status '+(item.kind==='RECORDED'?'is-recorded':'')}>{item.status}</span>
            <span>{String(item.dependencies).padStart(2,'0')}</span>
            <span>{String(item.filings).padStart(2,'0')}</span>
            <span>{String(item.relationships).padStart(2,'0')}</span>
            <span>{item.updated}</span>
            <b>↗</b>
          </Link>)}
          {!rows.length&&<div className="fc-empty-state">
            <strong>No investigations match this view.</strong>
            <p>Change the filter, or start a public trace to create a browser-local history entry.</p>
            <Link href="/trace">Trace authority ↗</Link>
          </div>}
        </div>
      </div>
    </section>

    <section className="fc-product-footer-grid">
      <article><span>RECORDED TRUTH</span><strong>Johnson v. Dunn</strong><p>Five court-identified dependencies across two filed motions, backed by exact order evidence.</p><Link href="/incident/demo">Open incident ↗</Link></article>
      <article><span>NEW INCIDENT</span><strong>Bring disputed dependencies</strong><p>Trace citations or quotations against bounded public filing candidates.</p><Link href="/incident">Open builder ↗</Link></article>
      <article><span>PUBLIC TRACE</span><strong>One authority at a time</strong><p>Search CourtListener / RECAP and confirm only what source text independently proves.</p><Link href="/trace">Quick trace ↗</Link></article>
    </section>
  </CockpitShell>
}
