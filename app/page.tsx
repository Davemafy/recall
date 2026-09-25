import Link from 'next/link';

export default function Home(){
  return <main className="landing liveLanding">
    <header className="mast"><div className="wordmark">RECALL</div><div className="mastNote">LEGAL INCIDENT RESPONSE</div></header>
    <section className="hero traceLandingHero">
      <div className="heroIndex">PUBLIC FILING DEPENDENCY TRACE</div>
      <h1>One hallucination.<br/><em>Find every filing it touched.</em></h1>
      <p className="heroCopy">Trace a bad legal authority or quotation through public federal filing data available through CourtListener / RECAP, then verify each dependency against source text.</p>
      <form className="landingTraceForm" action="/trace" method="get">
        <label htmlFor="q">Enter a citation, case, or quotation</label>
        <div><input id="q" name="q" defaultValue="598 U.S. 508" placeholder="410 U.S. 113"/><button type="submit">TRACE REAL FILINGS <span>→</span></button></div>
        <small>Examples: 410 U.S. 113 · 123 F.4th 456 · paste a disputed quotation</small>
      </form>
      <div className="heroActions"><Link className="button ghost" href="/corpus">Import my corpus</Link><Link className="button ghost" href="/demo">Run recorded public demo</Link></div>
      <p className="micro">Search result ≠ confirmed dependency. RECALL independently checks available filing text before counting it.</p>
    </section>
    <section className="landingRule"><div className="ruleNumber">02</div><div><div className="heroIndex">THE OPERATIONAL QUESTION</div><h2>Finding the hallucination was only the beginning.</h2></div><p>Confirmed citation and quotation evidence stays separate from possible proposition matches. Similarity never becomes provenance.</p></section>
  </main>
}
