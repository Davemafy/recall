import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RECALL — Legal incident response',
  description: 'Trace the blast radius after a bad legal authority enters a body of legal work.'
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>
}
