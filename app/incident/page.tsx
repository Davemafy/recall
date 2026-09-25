import Link from 'next/link';

export default function IncidentPage(){
  return <main className="incidentEntry">
    <header className="productBar"><Link href="/" className="productWordmark">RECALL</Link><div className="productContext">Open incident</div><div/></header>
    <section className="incidentEntryBody">
      <div className="entryEyebrow">LEGAL INCIDENT RESPONSE</div>
      <h1>Start with what was flagged.</h1>
      <p>Open a source-backed incident, or begin a manual review around an authority. RECALL handles downstream impact; it does not decide that an authority is bad for you.</p>
      <Link className="featuredIncident" href="/incident/demo">
        <span>RECORDED PUBLIC INCIDENT</span>
        <strong>Johnson v. Dunn</strong>
        <p>N.D. Alabama · Five problematic citations identified across two motions</p>
        <em>Open incident →</em>
      </Link>
      <div className="manualIncident">
        <div><span>MANUAL REVIEW</span><strong>Already have a citation under review?</strong></div>
        <form action="/trace" method="get"><input name="q" placeholder="e.g. 550 U.S. 544" aria-label="Citation under review"/><button>Quick trace →</button></form>
      </div>
    </section>
  </main>
}
