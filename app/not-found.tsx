import Link from 'next/link';

export default function NotFound(){
  return <main className="fc-state-page"><section className="fc-state-card"><span>RECALL / 404</span><h1>Workspace not found.</h1><p>This route is not part of the current RECALL incident-response surface.</p><div className="fc-state-actions"><Link href="/">Dashboard</Link><Link href="/incidents">Incidents</Link></div></section></main>
}
