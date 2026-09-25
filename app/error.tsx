'use client';
import Link from 'next/link';

export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <main className="fc-state-page" role="alert"><section className="fc-state-card"><span>RECALL / ROUTE ERROR</span><h1>This workspace did not load.</h1><p>The source-first engine has stopped this view instead of presenting partial or fabricated state. Retry the route, or return to the recorded incident.</p><div className="fc-state-actions"><button onClick={reset}>Try again</button><Link href="/incident/demo">Recorded incident</Link></div></section></main>
}
