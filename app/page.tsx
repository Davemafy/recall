import Link from 'next/link';

const deps=[
  ['United States v. Baker',"539 F.App'x 937",'174'],
  ['Kelley v. Birmingham','2021 WL 1118031','174'],
  ['Greer v. Warden','2020 WL 3060362','174'],
  ['Wilson v. Jackson','2006 WL 8438651','174'],
  ['Williams v. Asplundh','2006 WL 3343787','182']
];

export default function Home(){
  return <main className="recallHomePage">
    <header className="recallHomeTopbar">
      <div className="recallHomeBrand">RECALL</div>
      <nav aria-label="Primary">
        <Link href="/incident">Incidents</Link>
        <Link href="/trace">Quick trace</Link>
        <Link href="/corpus">Corpus</Link>
      </nav>
      <span>Legal incident response</span>
    </header>

    <section className="recallHomeHero">
      <div className="recallHomeCopy">
        <div className="recallHomeEyebrow"><span>01</span> INCIDENT RESPONSE AFTER DISCOVERY</div>
        <h1>One hallucination.<br/><em>Find every filing it touched.</em></h1>
        <p>Turn a bad legal dependency into an incident. RECALL traces exact occurrences across public filings and your own work — with evidence for every confirmed relationship.</p>
        <div className="recallHomeActions">
          <Link className="recallHomePrimary" href="/incident">Open incident <span>↗</span></Link>
          <Link href="/incident/demo">Run recorded incident</Link>
        </div>
      </div>

      <div className="recallHomePreview" aria-label="Johnson v. Dunn incident preview">
        <div className="recallHomePreviewHead">
          <div><span>RECORDED PUBLIC INCIDENT</span><strong>Johnson v. Dunn</strong></div>
          <b>05</b>
        </div>
        <div className="recallHomePreviewMeta">
          <span>5 disputed dependencies</span>
          <span>2 filed motions</span>
          <span>1 docket</span>
        </div>
        <div className="recallHomeMiniMatrix">
          <div className="recallHomeMiniHead"><span>DEPENDENCY</span><span>DOC. 174</span><span>DOC. 182</span></div>
          {deps.map(([name,cite,doc])=><div className="recallHomeMiniRow" key={cite}>
            <div><strong>{name}</strong><small>{cite}</small></div>
            <span className={doc==='174'?'is-hit':''}>{doc==='174'?'●':'—'}</span>
            <span className={doc==='182'?'is-hit':''}>{doc==='182'?'●':'—'}</span>
          </div>)}
        </div>
        <Link href="/incident/demo" className="recallHomePreviewFooter">
          <span>Every confirmed edge opens to exact source evidence.</span>
          <b>Open incident ↗</b>
        </Link>
      </div>
    </section>

    <section className="recallHomeFooter">
      <div><span>INCIDENT</span><strong>Start with what was flagged.</strong></div>
      <div><span>TRACE</span><strong>Find deterministic occurrences.</strong></div>
      <div><span>EVIDENCE</span><strong>Inspect the exact source.</strong></div>
    </section>
  </main>
}
