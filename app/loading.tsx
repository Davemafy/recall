export default function Loading(){
  return <main className="fc-state-page"><div className="fc-loading-shell" aria-busy="true" aria-label="Loading RECALL"><div className="fc-loading-bar"/><div className="fc-loading-grid">{[1,2,3,4].map(item=><div className="fc-loading-card" key={item}/>)}</div><div className="fc-loading-card" style={{height:280}}/></div></main>
}
