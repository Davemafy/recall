'use client';

import {useEffect,useState} from 'react';
import CockpitShell,{SummaryCards} from './CockpitShell';
import {clearActivity,DEFAULT_RECALL_PREFERENCES,loadActivity,loadPreferences,RecallPreferences,resetPreferences,savePreferences} from '../lib/recall-client';

export default function SettingsPage(){
  const [prefs,setPrefs]=useState<RecallPreferences>(DEFAULT_RECALL_PREFERENCES);
  const [activityCount,setActivityCount]=useState(0);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    setPrefs(loadPreferences());
    setActivityCount(loadActivity().length);
  },[]);

  const update=<K extends keyof RecallPreferences,>(key:K,value:RecallPreferences[K])=>{
    setSaved(false);
    setPrefs(current=>({...current,[key]:value}));
  };

  const save=()=>{
    savePreferences(prefs);
    setSaved(true);
    window.setTimeout(()=>setSaved(false),1800);
  };

  const reset=()=>{
    resetPreferences();
    setPrefs(DEFAULT_RECALL_PREFERENCES);
    setSaved(false);
  };

  const clearHistory=()=>{
    clearActivity();
    setActivityCount(0);
  };

  return <CockpitShell
    pageTitle="Settings"
    heading="Workspace settings"
    code="#LOCAL"
    status="Browser-local preferences"
    action={<button className="fc-metal-button" onClick={save}>{saved?'Saved':'Save changes'}</button>}
  >
    <SummaryCards items={[
      {label:'Default Trace Limit',value:String(prefs.traceLimit)},
      {label:'Activity History',value:prefs.rememberActivity?'ON':'OFF'},
      {label:'Theme',value:prefs.theme.toUpperCase(),icon:'vertical'},
      {label:'Saved Sessions',value:String(activityCount).padStart(2,'0'),icon:'vertical'}
    ]}/>

    <section className="fc-settings-layout">
      <div className="fc-settings-main">
        <section className="fc-settings-card">
          <header><div><h2>Trace defaults</h2><p>Control the default breadth for Quick Trace. You can still expand a bounded result set during a run.</p></div><span>PUBLIC SEARCH</span></header>
          <div className="fc-settings-row">
            <div><strong>Candidate filing limit</strong><small>Number of filing candidates checked before a trace is considered bounded.</small></div>
            <select value={prefs.traceLimit} onChange={e=>update('traceLimit',Number(e.target.value)===50?50:25)} aria-label="Default trace candidate limit">
              <option value={25}>25 candidates</option>
              <option value={50}>50 candidates</option>
            </select>
          </div>
        </section>

        <section className="fc-settings-card">
          <header><div><h2>Privacy & local history</h2><p>RECALL never persists uploaded corpus text here. This switch controls compact run metadata only.</p></div><span>BROWSER ONLY</span></header>
          <label className="fc-toggle-row">
            <div><strong>Remember recent activity</strong><small>Save citation labels, timestamps and aggregate counts in this browser so recent investigations remain accessible.</small></div>
            <input type="checkbox" checked={prefs.rememberActivity} onChange={e=>update('rememberActivity',e.target.checked)}/>
          </label>
          <div className="fc-settings-row">
            <div><strong>Stored activity</strong><small>{activityCount} local session{activityCount===1?'':'s'} currently saved.</small></div>
            <button className="fc-quiet-button" onClick={clearHistory} disabled={!activityCount}>Clear activity</button>
          </div>
        </section>

        <section className="fc-settings-card">
          <header><div><h2>Appearance</h2><p>The authored Figma cockpit supports both dark and light operating surfaces.</p></div><span>INTERFACE</span></header>
          <div className="fc-theme-options" role="radiogroup" aria-label="Theme">
            {(['dark','light'] as const).map(theme=><button key={theme} role="radio" aria-checked={prefs.theme===theme} className={prefs.theme===theme?'is-selected':''} onClick={()=>update('theme',theme)}>
              <i className={'fc-theme-preview '+theme}/><span><strong>{theme==='dark'?'Dark cockpit':'Light cockpit'}</strong><small>{theme==='dark'?'Default operational surface':'High-contrast daylight surface'}</small></span>
            </button>)}
          </div>
        </section>

        <div className="fc-settings-actions">
          <button className="fc-quiet-button" onClick={reset}>Reset preferences</button>
          <button className="fc-metal-button" onClick={save}>{saved?'Saved':'Save changes'}</button>
        </div>
      </div>

      <aside className="fc-settings-side">
        <section className="fc-settings-card">
          <header><div><h2>Source roles</h2><p>What each external system is allowed to do.</p></div></header>
          <dl className="fc-source-role-list">
            <div><dt>CourtListener / RECAP</dt><dd>Discovery, docket metadata and authoritative public filing/source URLs.</dd></div>
            <div><dt>RECAP plain text</dt><dd>Preferred text used to independently confirm a citation or quotation occurrence.</dd></div>
            <div><dt>Firecrawl</dt><dd>Extraction fallback only for an already-known allowlisted CourtListener / RECAP source URL.</dd></div>
          </dl>
        </section>
        <section className="fc-settings-card">
          <header><div><h2>Confirmation boundary</h2><p>Hard product rule.</p></div></header>
          <div className="fc-settings-note"><strong>Search result ≠ confirmation.</strong><p>Semantic similarity, unresolved source text and source failures remain unconfirmed. Only deterministic source evidence enters confirmed totals.</p></div>
        </section>
      </aside>
    </section>
  </CockpitShell>
}
