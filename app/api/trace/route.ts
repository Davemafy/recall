import {NextRequest,NextResponse} from 'next/server';
// @ts-ignore shared JS module intentionally powers Node tests and API
import {traceCourtListener} from '../../../lib/courtlistener.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const input=String(body?.input||'').trim();
    const quote=String(body?.quote||'').trim();
    if(input.length>400||quote.length>1200) return NextResponse.json({ok:false,state:'INVALID_INPUT',message:'Input exceeds prototype limits.'},{status:400});
    if(!input&&!quote) return NextResponse.json({ok:false,state:'INVALID_INPUT',message:'Enter a citation, case citation, or quotation.'},{status:400});
    const token=process.env.COURTLISTENER_TOKEN;
    if(!token) return NextResponse.json({ok:false,state:'AUTH_REQUIRED',message:'Live CourtListener search is not configured on this deployment.',recordedDemoAvailable:true},{status:503});
    const maxCandidates=Math.max(1,Math.min(Number(body?.maxCandidates)||50,50));
    const result=await traceCourtListener({input,quote,maxCandidates},token);
    const status=result.ok?200:result.state==='AUTH_ERROR'?502:result.state==='RATE_LIMITED'?429:result.state==='INVALID_INPUT'?400:503;
    return NextResponse.json(result,{status});
  }catch{
    return NextResponse.json({ok:false,state:'SOURCE_ERROR',message:'The public-source trace could not be completed.'},{status:500});
  }
}
