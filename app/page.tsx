import Link from 'next/link';

const deps=[
  ['United States v. Baker',"539 F.App'x 937",'174'],
  ['Kelley v. Birmingham','2021 WL 1118031','174'],
  ['Greer v. Warden','2020 WL 3060362','174'],
  ['Wilson v. Jackson','2006 WL 8438651','174'],
  ['Williams v. Asplundh','2006 WL 3343787','182']
];

export default function Home(){
  return <main className="recallHomePage recallCommandHome">
    <header className="recallHomeTopbar">
      <Link href="/" className="recallHomeBrand">RECALL</Link>
      <nav aria-label="Primary">
        <Link href="/incident">Incidents</Link>
        <Link href="/trace">Quick trace</Link>
        <Link href="/corpus">Corpus</Link>
      </nav>
      <span className="recallHomeState"><i/> Source first / exact evidence</span>
    </header>

    <section className="recallHomeHero">
      <div className="recallHomeCopy">
        <div className="recallHomeEyebrow"><span>LEGAL INCIDENT RESPONSE</span><b>EST. 2026</b></div>
        <h1>One hallucination.<br/><em>Find every filing it touched.</em></h1>
        <p>RECALL starts after a legal dependency has been flagged. It traces where that dependency also appears and puts the source evidence beside the affected work.</p>

        <div className="recallHomeActions">
          <Link className="recallHomePrimary" href="/incident">Open incident <span>↗</span></Link>
          <Link href="/trace">Trace authority</Link>
          <Link href="/corpus">Import corpus</Link>
        </div>

        <div className="recallHomeProtocol" aria-label="RECALL workflow">
          <div><span>01</span><strong>Flag</strong><small>Start with a dependency already under review.</small></div>
          <div><span>02</span><strong>Trace</strong><small>Resolve deterministic occurrences across filings.</small></div>
          <div><span>03</span><strong>Prove</strong><small>Open the exact source span behind every confirmed edge.</small></div>
        </div>
      </div>

      <Link href="/incident/demo" className="recallHomePreview" aria-label="Johnson v. Dunn incident preview">
        <div className="recallHomePreviewHead">
          <div>
            <span>RECORDED PUBLIC INCIDENT</span>
            <strong className="recallHomeCaseLink">Johnson v. Dunn</strong>
            <small>N.D. Alabama · No. 2:21-cv-01701-AMM</small>
          </div>
          <b>05</b>
        </div>

        <div className="recallHomeTraceStrip" aria-hidden>
          <div className="is-live"><i/><span>COURT ORDER</span></div>
          <div className="is-live"><i/><span>5 DEPENDENCIES</span></div>
          <div className="is-live"><i/><span>2 MOTIONS</span></div>
          <div><i/><span>EXACT EVIDENCE</span></div>
        </div>

        <div className="recallHomePreviewMeta">
          <span><b>05</b> disputed dependencies</span>
          <span><b>02</b> filed motions</span>
          <span><b>01</b> docket</span>
        </div>

        <div className="recallHomeMiniMatrix">
          <div className="recallHomeMiniHead"><span>DEPENDENCY</span><span>DOC. 174</span><span>DOC. 182</span></div>
          {deps.map(([name,cite,doc],index)=><div className="recallHomeMiniRow" key={cite}>
            <div><em>{String(index+1).padStart(2,'0')}</em><span><strong>{name}</strong><small>{cite}</small></span></div>
            <span className={doc==='174'?'is-hit':''}>{doc==='174'?'●':'—'}</span>
            <span className={doc==='182'?'is-hit':''}>{doc==='182'?'●':'—'}</span>
          </div>)}
        </div>

        <div className="recallHomePreviewFooter">
          <span>Every confirmed mark opens to incident-source + affected-work evidence.</span>
          <b>Open incident ↗</b>
        </div>
      </Link>
    </section>

    <section className="recallHomeFooter">
      <div><span>TRUTH MODEL</span><strong>Search result ≠ confirmation.</strong></div>
      <div><span>PUBLIC SOURCE</span><strong>CourtListener / RECAP first.</strong></div>
      <div><span>FALLBACK</span><strong>Firecrawl extracts known source URLs only.</strong></div>
      <Link href="/incident/demo">Run recorded incident ↗</Link>
    </section>
  </main>
}
