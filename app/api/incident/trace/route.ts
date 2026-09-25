import {NextRequest,NextResponse} from 'next/server';
// @ts-ignore Shared incident engine is exercised in Node tests.
import {traceIncidentDependencies} from '../../../../lib/incident-trace.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const dependencies=Array.isArray(body?.dependencies)?body.dependencies.slice(0,10):[];
    if(!dependencies.length)return NextResponse.json({ok:false,state:'INVALID_INPUT',message:'At least one incident dependency is required.'},{status:400});
    const safe=dependencies.map((item:any,index:number)=>({
      id:String(item?.id||`dependency-${index+1}`).slice(0,120),
      dependencyType:['AUTHORITY','QUOTATION','PROPOSITION'].includes(String(item?.dependencyType))?String(item.dependencyType):'AUTHORITY',
      rawText:String(item?.rawText||'').slice(0,600),
      canonicalCitation:item?.canonicalCitation?String(item.canonicalCitation).slice(0,220):undefined,
      quotation:item?.quotation?String(item.quotation).slice(0,1200):undefined
    })).filter((item:any)=>item.rawText||item.canonicalCitation||item.quotation);
    if(!safe.length)return NextResponse.json({ok:false,state:'INVALID_INPUT',message:'No traceable incident dependencies were supplied.'},{status:400});

    const token=process.env.COURTLISTENER_TOKEN;
    if(!token)return NextResponse.json({ok:false,state:'AUTH_REQUIRED',message:'Live CourtListener search is not configured on this deployment.'},{status:503});
    const result=await traceIncidentDependencies(safe,token,{maxCandidatesPerDependency:Math.max(1,Math.min(Number(body?.maxCandidatesPerDependency)||10,20)),signal:req.signal});
    const rateLimited=result.statuses.find((status:any)=>status.state==='rate_limited');
    const headers:Record<string,string>={};
    if(rateLimited?.retryAfterMs)headers['Retry-After']=String(Math.max(1,Math.ceil(rateLimited.retryAfterMs/1000)));
    return NextResponse.json(result,{status:rateLimited?429:200,headers});
  }catch{
    return NextResponse.json({ok:false,state:'SOURCE_ERROR',message:'The incident trace could not be completed.'},{status:500});
  }
}
