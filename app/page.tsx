import Link from 'next/link';

export default function Home(){
  return <main className="founderLanding">
    <header className="productBar">
      <div className="productWordmark">RECALL</div>
      <div className="productContext">Legal incident response</div>
      <Link href="/trace" className="quietTopLink">Quick trace</Link>
    </header>

    <section className="founderHero">
      <div className="entryEyebrow">LEGAL INCIDENT RESPONSE</div>
      <h1>One hallucination.<br/><span>Find every filing it touched.</span></h1>
      <p>Turn a bad legal citation into an incident. Trace every confirmed occurrence across public filings and your own legal work.</p>
      <div className="founderActions">
        <Link className="founderPrimary" href="/incident">Open incident <span>→</span></Link>
        <Link href="/trace">Trace authority</Link>
        <Link href="/corpus">Import corpus</Link>
      </div>
      <Link className="recordedDemoLink" href="/incident/demo"><span>RECORDED PUBLIC INCIDENT</span> Johnson v. Dunn — five problematic citations across two motions <b>→</b></Link>
    </section>

    <section className="productPremise">
      <div><span>01</span><strong>Incident</strong><p>A court, reviewer or lawyer identifies a dependency that deserves review.</p></div>
      <div><span>02</span><strong>Trace</strong><p>RECALL searches public filings and independently confirms exact occurrences.</p></div>
      <div><span>03</span><strong>Evidence</strong><p>Every confirmed relationship opens directly to the source language that supports it.</p></div>
    </section>
  </main>
}
