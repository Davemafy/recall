import type {Metadata} from 'next';
import './globals.css';
import './figma-cockpit.css';

export const metadata:Metadata={
  title:'RECALL — Legal incident response',
  description:'Trace where a disputed legal dependency appears and inspect the exact evidence.'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>
}
