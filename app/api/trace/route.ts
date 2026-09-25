import {NextRequest,NextResponse} from 'next/server';
// @ts-ignore Shared JS engine is also exercised directly by Node benchmark tests.
import {traceCourtListener} from '../../../lib/courtlistener.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const input=String(body?.input||'').trim();
    const quote=String(body?.quote||'').trim();
    if(input.length>400||quote.length>1200)return NextResponse.json({ok:false,state:'INVALID_INPUT',message:'Input exceeds prototype limits.'},{status:400});
    if(!input&&!quote)return NextResponse.json({ok:false,state:'INVALID_INPUT',message:'Enter a citation, case citation, or quotation.'},{status:400});

    const token=process.env.COURTLISTENER_TOKEN;
    if(!token)return NextResponse.json({ok:false,state:'AUTH_REQUIRED',message:'Live CourtListener search is not configured on this deployment.',recordedDemoAvailable:true},{status:503});

    const maxCandidates=Math.max(1,Math.min(Number(body?.maxCandidates)||25,50));
    const broad=body?.broad===true;
    const result=await traceCourtListener({input,quote,maxCandidates,broad,signal:req.signal},token);
    const status=result.ok?200:result.state==='AUTH_ERROR'?502:result.state==='RATE_LIMITED'?429:result.state==='INVALID_INPUT'?400:503;
    const headers:Record<string,string>={};
    if(result.retryAfterMs)headers['Retry-After']=String(Math.max(1,Math.ceil(result.retryAfterMs/1000)));
    if(result.diagnostics?.traceId)headers['X-Recall-Trace-Id']=String(result.diagnostics.traceId);
    return NextResponse.json(result,{status,headers});
  }catch{
    return NextResponse.json({ok:false,state:'SOURCE_ERROR',message:'The public-source trace could not be completed.'},{status:500});
  }
}
