import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import './figma-1to1.css';

const inter=Inter({subsets:['latin']});

export const metadata:Metadata={
  title:'RECALL — Legal incident response',
  description:'Recorded public incident impact tracing.'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body className={inter.className}>{children}</body></html>;
}
