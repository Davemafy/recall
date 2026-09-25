/* eslint-disable @next/next/no-img-element */
'use client';

import {useEffect,useMemo,useState} from 'react';
import {FIGMA_ASSETS_A} from '../lib/figma-assets-a';
import {FIGMA_ASSETS_B} from '../lib/figma-assets-b';
// @ts-ignore recorded public fixture
import {getRecordedIncident} from '../lib/recorded-incident.mjs';

const DESIGN_W=1690;
const DESIGN_H=1096;

type Dependency={
  id:string;
  caseName?:string;
  canonicalCitation?:string;
  rawText:string;
  incidentFinding?:string;
};

export default function FigmaDashboard(){
  const data=useMemo(()=>getRecordedIncident(),[]);
  const dependencies=data.dependencies as Dependency[];
  const [scale,setScale]=useState(1);
  const [traced,setTraced]=useState(false);
  const [selected,setSelected]=useState(0);
  const [filter,setFilter]=useState<'ALL'|'174'|'182'>('ALL');

  useEffect(()=>{
    const resize=()=>setScale(window.innerWidth/DESIGN_W);
    resize();
    window.addEventListener('resize',resize);
    return()=>window.removeEventListener('resize',resize);
  },[]);

  const visible=dependencies.filter(dep=>{
    if(filter==='ALL') return true;
    const relationship=data.relationships.find((r:any)=>r.dependencyId===dep.id);
    const filing=relationship?data.filings.find((f:any)=>f.id===relationship.filingId):null;
    return filing?.documentNumber===filter;
  });

  const selectedDependency=dependencies[selected]??dependencies[0];
  const selectedRelationship=data.relationships.find((r:any)=>r.dependencyId===selectedDependency.id);
  const selectedFiling=selectedRelationship?data.filings.find((f:any)=>f.id===selectedRelationship.filingId):null;

  const bubbleColumns=[
    {x:10,ys:[124,150,176,202]},
    {x:38,ys:[46,72,98,124,150,176,202]},
    {x:66,ys:[98,124,150,176,202]},
    {x:94,ys:[-6,20,46,72,98,124,150,176,202]},
    {x:122,ys:[124,150,176,202]},
    {x:150,ys:[72,98,124,150,176,202]},
    {x:178,ys:[20,46,72,98,124,150,176,202]},
    {x:206,ys:[-32,-6,20,46,72,98,124,150,176,202]},
    {x:234,ys:[46,72,98,124,150,176,202]},
    {x:262,ys:[20,46,72,98,124,150,176,202]},
    {x:290,ys:[-32,-6,20,46,72,98,124,150,176,202]},
    {x:318,ys:[-84,-58,-32,-6,20,46,72,98,124,150,176,202]},
    {x:346,ys:[-58,-32,-6,20,46,72,98,124,150,176,202]},
    {x:374,ys:[46,72,98,124,150,176,202]},
    {x:402,ys:[-32,-6,20,46,72,98,124,150,176,202]},
    {x:430,ys:[20,46,72,98,124,150,176,202]}
  ];
  const hotPoints=[
    {x:206,y:98},
    {x:234,y:98},
    {x:262,y:124},
    {x:290,y:150},
    {x:290,y:176}
  ];

  return <div className="figmaPage" style={{height:DESIGN_H*scale}}>
    <div className="figmaScale" style={{transform:`scale(${scale})`}}>
      <main className="figmaDashboard" aria-label="RECALL dashboard">
        <aside className="figmaSidebar">
          <div className="figmaMainNav">
            <div className="figmaBrand">R</div>
            <nav className="figmaPrimaryNav" aria-label="Primary">
              {[
                ['Dashboard',FIGMA_ASSETS_A.grid],
                ['Incidents',FIGMA_ASSETS_A.bars],
                ['Timeline',FIGMA_ASSETS_A.calendar],
                ['Evidence',FIGMA_ASSETS_A.cursor],
                ['Profile',FIGMA_ASSETS_A.user]
              ].map(([label,icon],index)=><button key={label} className={'figmaNavItem '+(index===0?'active':'')} aria-label={label}>
                <img src={icon} alt=""/>
              </button>)}
            </nav>
          </div>

          <div className="figmaUtilityNav">
            <button className="figmaNavItem" aria-label="Settings"><img src={FIGMA_ASSETS_A.settings} alt=""/></button>
            <button className="figmaNavItem" aria-label="Log out"><img src={FIGMA_ASSETS_A.logout} alt=""/></button>
            <div className="figmaTheme">
              <button aria-label="Light mode"><img src={FIGMA_ASSETS_A.sun} alt=""/></button>
              <button className="active" aria-label="Dark mode"><img src={FIGMA_ASSETS_A.moon} alt=""/></button>
            </div>
          </div>
        </aside>

        <section className="figmaContent">
          <header className="figmaHeader">
            <div className="figmaTopbar">
              <p className="figmaPageTitle">Johnson v. Dunn</p>
              <div className="figmaAccountControls">
                <div className="figmaQuickActions">
                  <button className="figmaHeaderAction" aria-label="Search"><img src={FIGMA_ASSETS_B.search} alt=""/></button>
                  <button className="figmaHeaderAction notify" aria-label="Notifications"><img src={FIGMA_ASSETS_B.bell} alt=""/><i/></button>
                </div>
                <button className="figmaProfile" aria-label="RECALL profile">
                  <span className="figmaAvatar">R</span>
                  <span className="figmaIdentity"><strong>RECALL</strong><small>Recorded public incident</small></span>
                  <img className="figmaChevron" src={FIGMA_ASSETS_B.chevron} alt=""/>
                </button>
              </div>
            </div>

            <div className="figmaIncidentHeading">
              <h1><span>Incident, </span><em>#JD–01701</em></h1>
              <button className="figmaDownload" onClick={()=>setTraced(true)}>{traced?'Traced':'Trace impact'}</button>
            </div>
          </header>

          <section className="figmaSummary" aria-label="Incident summary">
            {[
              ['Disputed Dependencies','05','h'],
              ['Affected Filings',traced?'02':'—','h'],
              ['Confirmed Relations',traced?'05':'—','v'],
              ['Dockets',traced?'01':'—','v']
            ].map(([label,value,icon])=><article className="figmaSummaryCard" key={label}>
              <div className="figmaSummaryLabel">
                <span className="figmaMetricIcon"><img src={icon==='v'?FIGMA_ASSETS_B.arrowsVertical:FIGMA_ASSETS_B.arrowsHorizontal} alt=""/></span>
                <span>{label}</span>
              </div>
              <strong>{value}</strong>
            </article>)}
          </section>

          <section className="figmaTimeline">
            <div className="figmaTimelineHeading">
              <h2>Incident Timeline</h2>
              <button className="figmaMore" aria-label="More options"><img src={FIGMA_ASSETS_B.ellipsis} alt=""/></button>
            </div>
            <div className="figmaTimelinePlot">
              <div className="figmaWeekend weekend1"/><div className="figmaWeekend weekend2"/><div className="figmaWeekend weekend3"/><div className="figmaWeekend weekend4"/><div className="figmaWeekend weekend5"/>
              <div className="figmaDayGrid"/>
              <div className="figmaCurrentLine"><span>17:28</span><i/></div>
              <div className="figmaDayLabels" aria-hidden>
                {['07 M','08 T','09 W','10 T','11 F','12 S','13 S','14 M','15 T','16 W','17 T','18 F','19 S','20 S','21 M','22 T','23 W','24 T','25 F','26 S','27 S','28 M','29 T'].map((d,i)=><span key={i}>{d}</span>)}
              </div>

              <article className="figmaAlert alert1"><b/><div><strong>Document 174 filed</strong><small>4 disputed authorities</small></div></article>
              <article className="figmaAlert purple alert2"><b/><div><strong>Document 182 filed</strong><small>1 disputed authority</small></div></article>
              <article className="figmaAlert alert3"><b/><div><strong>Sanctions order identifies 5 citations</strong></div></article>
              <article className={'figmaAlert alert4 '+(traced?'hot':'')}><b/><div><strong>{traced?'5 confirmed relationships':'Impact trace ready'}</strong><small>{traced?'2 affected motions · 1 docket':'Run the deterministic trace'}</small></div></article>
            </div>
          </section>

          <section className="figmaInsights">
            <section className="figmaPanel dependencyPanel">
              <div className="figmaPanelHeading actionHeading">
                <h2>Disputed Dependencies</h2>
                <select value={filter} onChange={e=>setFilter(e.target.value as any)} aria-label="Filter disputed dependencies">
                  <option value="ALL">All</option>
                  <option value="174">Dkt. 174</option>
                  <option value="182">Dkt. 182</option>
                </select>
              </div>
              <div className="figmaRecommendations">
                {visible.map((dep)=>{
                  const index=dependencies.findIndex(d=>d.id===dep.id);
                  const relationship=data.relationships.find((r:any)=>r.dependencyId===dep.id);
                  const filing=relationship?data.filings.find((f:any)=>f.id===relationship.filingId):null;
                  return <div className={'figmaRecommendation '+(selected===index?'selected':'')} key={dep.id}>
                    <button className="figmaActionDetails" onClick={()=>setSelected(index)}>
                      <strong>{dep.caseName||dep.rawText}</strong>
                      <small>{dep.canonicalCitation||dep.rawText}</small>
                    </button>
                    <span className="figmaDecision danger">{filing?'D'+filing.documentNumber:'Flagged'}</span>
                    <button className="figmaDecision success" onClick={()=>setSelected(index)}>Inspect</button>
                  </div>
                })}
              </div>
            </section>

            <section className="figmaPanel attemptsPanel">
              <div className="figmaPanelHeading">
                <h2>Affected Filings</h2>
                <strong>{traced?'05':'—'}</strong>
              </div>
              <div className="figmaBubbleChart">
                <div className="figmaBubbleColumns">
                  {bubbleColumns.flatMap(column=>column.ys.map(y=>{
                    const hotIndex=hotPoints.findIndex(point=>point.x===column.x&&point.y===y);
                    const hot=traced&&hotIndex!==-1;
                    const selectedHot=hot&&hotIndex===selected;
                    return <i
                      key={column.x+'-'+y}
                      className={'figmaBubble '+(hot?'hot ':'')+(selectedHot?'selected':'')}
                      style={{left:column.x,top:y}}
                    />;
                  }))}
                </div>
                <div className="figmaChartLabels" aria-hidden>
                  {[['SRC',4],['DEP',91],['REL',178],['174',265],['182',352],['EVID',435]].map(([label,left])=><span key={String(label)} style={{left:Number(left)}}>{label}</span>)}
                </div>
              </div>
            </section>

            <section className="figmaPanel streamPanel">
              <div className="figmaPanelHeading">
                <h2>Evidence Trace</h2>
                <strong>{traced?'5/5':'—'}</strong>
              </div>
              <div className="figmaStreamChart">
                <div className="figmaPurpleAtmosphere"/>
                {[26,137,248,359,470].map(x=><i className="figmaGuide" style={{left:x}} key={x}/>)}
                <img className="figmaStream outer" src={FIGMA_ASSETS_B.streamOuter} alt=""/>
                <img className="figmaStream middle" src={FIGMA_ASSETS_B.streamMiddle} alt=""/>
                <img className="figmaStream core" src={FIGMA_ASSETS_B.streamCore} alt=""/>
                <span className="figmaChange c1">INC</span>
                <span className="figmaChange c2">{selectedFiling?'D'+selectedFiling.documentNumber:'DOC'}</span>
                <span className="figmaChange c3">{traced?'EXACT':'READY'}</span>
                <div className="figmaStreamLabels" aria-hidden>
                  {[['SRC',20],['DEP',105],['MATCH',190],['174',275],['182',360],['EVID',430]].map(([label,left])=><span key={String(label)} style={{left:Number(left)}}>{label}</span>)}
                </div>
              </div>
            </section>
          </section>
        </section>
      </main>
    </div>
  </div>;
}
