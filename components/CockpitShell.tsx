/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';

const nav=[
  {href:'/',label:'Dashboard',icon:'/recall-figma/grid.png'},
  {href:'/incident',label:'Incidents',icon:'/recall-figma/bars.png'},
  {href:'/trace',label:'Quick trace',icon:'/recall-figma/calendar.png'},
  {href:'/corpus',label:'Corpus',icon:'/recall-figma/cursor.png'},
  {href:'/incident/demo',label:'Recorded incident',icon:'/recall-figma/user.png'}
];

export function SummaryCards({items}:{items:Array<{label:string;value:string;icon?:'horizontal'|'vertical'}>}){
  return <section className="fc-summary" aria-label="Incident summary">
    {items.map((item)=><article className="fc-summary-card" key={item.label}>
      <div className="fc-summary-label">
        <span className="fc-metric-icon"><img src={item.icon==='vertical'?'/recall-figma/arrows-vertical.png':'/recall-figma/arrows-horizontal.png'} alt=""/></span>
        <span>{item.label}</span>
      </div>
      <strong>{item.value}</strong>
    </article>)}
  </section>
}

export default function CockpitShell({
  pageTitle,
  heading,
  code,
  action,
  status='Source first',
  children
}:{
  pageTitle:string;
  heading:string;
  code:string;
  action?:ReactNode;
  status?:string;
  children:ReactNode;
}){
  const pathname=usePathname();
  return <main className="fc-scene">
    <div className="fc-rim-top" aria-hidden/>
    <div className="fc-rim-side" aria-hidden/>
    <section className="fc-dashboard">
      <aside className="fc-sidebar">
        <div className="fc-side-main">
          <Link href="/" className="fc-brand" aria-label="RECALL home">R</Link>
          <nav className="fc-primary-nav" aria-label="Primary">
            {nav.map(item=>{
              const active=item.href==='/'?pathname===item.href:pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={'fc-nav-item '+(active?'is-active':'')} aria-label={item.label} title={item.label}>
                <img src={item.icon} alt=""/>
              </Link>
            })}
          </nav>
        </div>
        <div className="fc-utility-nav">
          <button className="fc-nav-item" aria-label="Settings" title="Settings"><img src="/recall-figma/settings.png" alt=""/></button>
          <Link className="fc-nav-item" href="/" aria-label="Return to dashboard" title="Return to dashboard"><img src="/recall-figma/logout.png" alt=""/></Link>
          <div className="fc-theme-switch" aria-label="Dark theme selected">
            <span><img src="/recall-figma/sun.png" alt=""/></span>
            <span className="is-selected"><img src="/recall-figma/moon.png" alt=""/></span>
          </div>
        </div>
      </aside>

      <div className="fc-main">
        <header className="fc-header">
          <div className="fc-topbar">
            <p className="fc-page-title">{pageTitle}</p>
            <div className="fc-account-controls">
              <div className="fc-quick-actions">
                <Link href="/trace" className="fc-header-action" aria-label="Search public filings"><img src="/recall-figma/search.png" alt=""/></Link>
                <button className="fc-header-action" aria-label="Incident status"><img src="/recall-figma/bell.png" alt=""/><i/></button>
              </div>
              <div className="fc-profile">
                <span className="fc-profile-mark">R</span>
                <span className="fc-profile-copy"><strong>RECALL</strong><small>{status}</small></span>
                <img className="fc-chevron" src="/recall-figma/chevron.png" alt=""/>
              </div>
            </div>
          </div>
          <div className="fc-incident-heading">
            <h1>{heading}, <span>{code}</span></h1>
            {action}
          </div>
        </header>
        {children}
      </div>
    </section>
  </main>
}
