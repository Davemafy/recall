import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export async function GET(req:NextRequest){
  const citation=req.nextUrl.searchParams.get('citation')?.trim();
  if(!citation) return NextResponse.json({status:'UNRESOLVED',reason:'citation is required'},{status:400});
  if(citation.length>120) return NextResponse.json({status:'UNRESOLVED',reason:'citation too long'},{status:400});
  const token=process.env.COURTLISTENER_TOKEN;
  if(!token) return NextResponse.json({status:'UNRESOLVED',reason:'CourtListener is not configured'});
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch('https://www.courtlistener.com/api/rest/v4/citation-lookup/',{method:'POST',headers:{Authorization:`Token ${token}`,'Content-Type':'application/x-www-form-urlencoded','User-Agent':'RECALL-LexHack/1.0'},body:new URLSearchParams({text:citation}).toString(),signal:controller.signal,cache:'no-store'});
    if(!response.ok) return NextResponse.json({status:'UNRESOLVED',reason:`CourtListener returned ${response.status}`});
    const data=await response.json();
    return NextResponse.json({status:Array.isArray(data)&&data.length?'RESOLVED':'UNRESOLVED',source:'CourtListener citation lookup',checkedAt:new Date().toISOString(),results:data});
  }catch{return NextResponse.json({status:'UNRESOLVED',reason:'CourtListener could not be reached'});}finally{clearTimeout(timer);}
}
