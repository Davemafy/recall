export type RecallTheme='dark'|'light';
export type RecallPreferences={
  traceLimit:25|50;
  rememberActivity:boolean;
  theme:RecallTheme;
};

export type RecallActivityKind='TRACE'|'INCIDENT';
export type RecallActivityEntry={
  id:string;
  kind:RecallActivityKind;
  title:string;
  subtitle:string;
  createdAt:string;
  confirmed:number;
  checked:number;
  dockets:number;
  href:string;
};

const SETTINGS_KEY='recall-settings-v1';
const ACTIVITY_KEY='recall-activity-v1';
const THEME_KEY='recall-theme';

export const DEFAULT_RECALL_PREFERENCES:RecallPreferences={
  traceLimit:25,
  rememberActivity:true,
  theme:'dark'
};

const canUseBrowser=()=>typeof window!=='undefined';

export function loadPreferences():RecallPreferences{
  if(!canUseBrowser()) return DEFAULT_RECALL_PREFERENCES;
  try{
    const raw=window.localStorage.getItem(SETTINGS_KEY);
    const stored=raw?JSON.parse(raw):{};
    const themeRaw=window.localStorage.getItem(THEME_KEY);
    const theme:RecallTheme=themeRaw==='light'||themeRaw==='dark'?themeRaw:(stored.theme==='light'?'light':'dark');
    return {
      traceLimit:stored.traceLimit===50?50:25,
      rememberActivity:stored.rememberActivity!==false,
      theme
    };
  }catch{
    return DEFAULT_RECALL_PREFERENCES;
  }
}

export function savePreferences(next:RecallPreferences){
  if(!canUseBrowser()) return;
  try{
    window.localStorage.setItem(SETTINGS_KEY,JSON.stringify(next));
    window.localStorage.setItem(THEME_KEY,next.theme);
    window.dispatchEvent(new CustomEvent('recall-theme-change',{detail:{theme:next.theme}}));
    window.dispatchEvent(new CustomEvent('recall-preferences-change',{detail:next}));
  }catch{}
}

export function resetPreferences(){
  if(!canUseBrowser()) return;
  try{
    window.localStorage.removeItem(SETTINGS_KEY);
    window.localStorage.setItem(THEME_KEY,DEFAULT_RECALL_PREFERENCES.theme);
    window.dispatchEvent(new CustomEvent('recall-theme-change',{detail:{theme:DEFAULT_RECALL_PREFERENCES.theme}}));
    window.dispatchEvent(new CustomEvent('recall-preferences-change',{detail:DEFAULT_RECALL_PREFERENCES}));
  }catch{}
}

export function loadActivity():RecallActivityEntry[]{
  if(!canUseBrowser()) return [];
  try{
    const raw=window.localStorage.getItem(ACTIVITY_KEY);
    const parsed=raw?JSON.parse(raw):[];
    if(!Array.isArray(parsed)) return [];
    return parsed.filter(item=>item&&typeof item==='object'&&typeof item.id==='string').slice(0,40);
  }catch{
    return [];
  }
}

export function recordActivity(entry:Omit<RecallActivityEntry,'id'|'createdAt'> & {createdAt?:string}){
  if(!canUseBrowser()) return;
  const preferences=loadPreferences();
  if(!preferences.rememberActivity) return;
  const next:RecallActivityEntry={
    ...entry,
    id:typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():String(Date.now()),
    createdAt:entry.createdAt||new Date().toISOString()
  };
  try{
    const current=loadActivity();
    const deduped=current.filter(item=>!(item.kind===next.kind&&item.title===next.title&&item.subtitle===next.subtitle));
    window.localStorage.setItem(ACTIVITY_KEY,JSON.stringify([next,...deduped].slice(0,40)));
    window.dispatchEvent(new CustomEvent('recall-activity-change'));
  }catch{}
}

export function clearActivity(){
  if(!canUseBrowser()) return;
  try{
    window.localStorage.removeItem(ACTIVITY_KEY);
    window.dispatchEvent(new CustomEvent('recall-activity-change'));
  }catch{}
}

export function downloadJson(filename:string,value:unknown){
  if(!canUseBrowser()) return;
  const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const csvCell=(value:unknown)=>{
  const text=String(value??'');
  return '"'+text.replace(/"/g,'""')+'"';
};

export function downloadCsv(filename:string,rows:Record<string,unknown>[]){
  if(!canUseBrowser()) return;
  const headers=[...new Set(rows.flatMap(row=>Object.keys(row)))];
  const lines=[headers.map(csvCell).join(','),...rows.map(row=>headers.map(header=>csvCell(row[header])).join(','))];
  const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
