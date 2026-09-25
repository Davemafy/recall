/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import type {ReactNode} from 'react';
import {FIGMA_ASSETS_A} from '../lib/figma-assets-a';
import {FIGMA_ASSETS_B} from '../lib/figma-assets-b';

const nav=[
  {href:'/',label:'Dashboard',icon:FIGMA_ASSETS_A.grid},
  {href:'/incident',label:'Incidents',icon:FIGMA_ASSETS_A.bars},
  {href:'/trace',label:'Quick trace',icon:FIGMA_ASSETS_A.calendar},
  {href:'/corpus',label:'Corpus',icon:FIGMA_ASSETS_A.cursor},
  {href:'/incident/demo',label:'Recorded incident',icon:FIGMA_ASSETS_A.user}
];

type Menu='status'|'settings'|'profile'|null;
type Theme='dark'|'light';

export function SummaryCards({items}:{items:Array<{label:string;value:string;icon?:'horizontal'|'vertical'}>}){
  return <section className="fc-summary" aria-label="Incident summary">
    {items.map((item)=><article className="fc-summary-card" key={item.label}>
      <div className="fc-summary-label">
        <span className="fc-metric-icon"><img src={item.icon==='vertical'?FIGMA_ASSETS_B.arrowsVertical:FIGMA_ASSETS_B.arrowsHorizontal} alt=""/></span>
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
  const [menu,setMenu]=useState<Menu>(null);
  const [theme,setTheme]=useState<Theme>('dark');

  useEffect(()=>{
    const stored=window.localStorage.getItem('recall-theme');
    if(stored==='light'||stored==='dark') setTheme(stored);
  },[]);

  const setAppearance=(next:Theme)=>{
    setTheme(next);
    window.localStorage.setItem('recall-theme',next);
  };

  const isActive=(href:string)=>{
    if(href==='/') return pathname==='/';
    if(href==='/incident') return pathname==='/incident';
    if(href==='/incident/demo') return pathname==='/incident/demo'||pathname==='/demo';
    return pathname===href||pathname.startsWith(href+'/');
  };

  const toggle=(next:Exclude<Menu,null>)=>setMenu(current=>current===next?null:next);

  return <main className="fc-scene" data-theme={theme}>
    <section className="fc-dashboard">
      <aside className="fc-sidebar">
        <div className="fc-side-main">
          <Link href="/" className="fc-brand" aria-label="RECALL home">R</Link>
          <nav className="fc-primary-nav" aria-label="Primary">
            {nav.map(item=><Link
              key={item.href}
              href={item.href}
              className={'fc-nav-item '+(isActive(item.href)?'is-active':'')}
              aria-label={item.label}
              aria-current={isActive(item.href)?'page':undefined}
              title={item.label}
            >
              <img src={item.icon} alt=""/>
            </Link>)}
          </nav>
        </div>

        <div className="fc-utility-nav">
          <button className={'fc-nav-item '+(menu==='settings'?'is-active':'')} aria-label="Settings" title="Settings" aria-expanded={menu==='settings'} onClick={()=>toggle('settings')}><img src={FIGMA_ASSETS_A.settings} alt=""/></button>
          <Link className="fc-nav-item" href="/" aria-label="Return to dashboard" title="Return to dashboard"><img src={FIGMA_ASSETS_A.logout} alt=""/></Link>
          <div className="fc-theme-switch" role="group" aria-label="Appearance">
            <button className={theme==='light'?'is-selected':''} aria-label="Use light theme" aria-pressed={theme==='light'} onClick={()=>setAppearance('light')}><img src={FIGMA_ASSETS_A.sun} alt=""/></button>
            <button className={theme==='dark'?'is-selected':''} aria-label="Use dark theme" aria-pressed={theme==='dark'} onClick={()=>setAppearance('dark')}><img src={FIGMA_ASSETS_A.moon} alt=""/></button>
          </div>
        </div>

        {menu==='settings'&&<div className="fc-popover fc-settings-popover" role="dialog" aria-label="Interface settings">
          <div className="fc-popover-kicker">INTERFACE</div>
          <strong>Settings</strong>
          <p>Appearance is stored only in this browser.</p>
          <div className="fc-setting-row"><span>Theme</span><div><button className={theme==='light'?'is-selected':''} onClick={()=>setAppearance('light')}>Light</button><button className={theme==='dark'?'is-selected':''} onClick={()=>setAppearance('dark')}>Dark</button></div></div>
          <Link href="/corpus" onClick={()=>setMenu(null)}>Open local corpus settings ↗</Link>
        </div>}
      </aside>

      <div className="fc-main">
        <header className="fc-header">
          <div className="fc-topbar">
            <p className="fc-page-title">{pageTitle}</p>
            <div className="fc-account-controls">
              <div className="fc-quick-actions">
                <Link href="/trace" className="fc-header-action" aria-label="Search public filings" title="Quick trace"><img src={FIGMA_ASSETS_B.search} alt=""/></Link>
                <button className={'fc-header-action '+(menu==='status'?'is-active':'')} aria-label="Incident status" aria-expanded={menu==='status'} title="Incident status" onClick={()=>toggle('status')}><img src={FIGMA_ASSETS_B.bell} alt=""/><i/></button>
              </div>
              <button className={'fc-profile '+(menu==='profile'?'is-active':'')} aria-label="Open RECALL workspace menu" aria-expanded={menu==='profile'} onClick={()=>toggle('profile')}>
                <span className="fc-profile-mark">R</span>
                <span className="fc-profile-copy"><strong>RECALL</strong><small>{status}</small></span>
                <img className="fc-chevron" src={FIGMA_ASSETS_B.chevron} alt=""/>
              </button>
            </div>
          </div>

          {menu==='status'&&<div className="fc-popover fc-status-popover" role="dialog" aria-label="Workspace status">
            <div className="fc-popover-kicker">WORKSPACE STATUS</div>
            <strong>{status}</strong>
            <p>Confirmed relationships require source evidence. Search results and semantic similarity remain unconfirmed.</p>
            <Link href="/trace" onClick={()=>setMenu(null)}>Open Quick Trace ↗</Link>
          </div>}

          {menu==='profile'&&<div className="fc-popover fc-profile-popover" role="menu" aria-label="RECALL workspace menu">
            <div className="fc-popover-kicker">RECALL</div>
            <Link href="/incident/demo" role="menuitem" onClick={()=>setMenu(null)}>Recorded incident</Link>
            <Link href="/trace" role="menuitem" onClick={()=>setMenu(null)}>Quick trace</Link>
            <Link href="/corpus" role="menuitem" onClick={()=>setMenu(null)}>Local corpus</Link>
          </div>}

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
