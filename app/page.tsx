import Link from 'next/link';

export default function Home(){
  return <main className="landing">
    <header className="mast"><div className="wordmark">RECALL</div><div className="mastNote">LEGAL INCIDENT RESPONSE</div></header>
    <section className="hero">
      <div className="heroIndex">01 — INCIDENT RESPONSE</div>
      <h1>One hallucination.<br/><em>Find every filing it touched.</em></h1>
      <p className="heroCopy">Citation checkers find the error. RECALL traces where that bad legal dependency now matters across briefs, memos, templates, versions, and filings.</p>
      <div className="heroActions"><Link className="button primary" href="/demo">Run the incident demo <span>→</span></Link><Link className="button ghost" href="/app">Import a corpus</Link></div>
      <p className="micro">Confirmed relationships require deterministic evidence. Semantic matches stay review-only.</p>
    </section>
    <section className="landingRule"><div className="ruleNumber">02</div><div><div className="heroIndex">THE DIFFERENCE</div><h2>Finding the hallucination was only the beginning.</h2></div><p>RECALL treats a bad authority like a vulnerable dependency: identify it once, then compute the blast radius across the work that depends on it.</p></section>
  </main>
}
