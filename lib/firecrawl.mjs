import {createHash} from 'node:crypto';

const FIRECRAWL_SCRAPE_URL='https://api.firecrawl.dev/v2/scrape';
const ALLOWED_PUBLIC_HOSTS=new Set(['www.courtlistener.com','courtlistener.com','storage.courtlistener.com']);

function allowedUrl(value){
  try{
    const url=new URL(String(value));
    return url.protocol==='https:'&&ALLOWED_PUBLIC_HOSTS.has(url.hostname)?url.toString():null;
  }catch{return null}
}

function validateResponse(value){
  if(!value||typeof value!=='object'||value.success!==true||!value.data||typeof value.data!=='object') return null;
  const markdown=typeof value.data.markdown==='string'?value.data.markdown:'';
  const metadata=value.data.metadata&&typeof value.data.metadata==='object'?value.data.metadata:{};
  return {markdown,metadata};
}

export async function extractPublicSourceWithFirecrawl(sourceUrl,apiKey,{diagnostics,signal,timeoutMs=12000}={}){
  const safeUrl=allowedUrl(sourceUrl);
  if(!safeUrl) return {ok:false,state:'INVALID_SOURCE_URL'};
  if(!apiKey) return {ok:false,state:'NOT_CONFIGURED'};
  if(diagnostics) diagnostics.firecrawlRequests=(diagnostics.firecrawlRequests||0)+1;

  const controller=new AbortController();
  const onAbort=()=>controller.abort();
  signal?.addEventListener?.('abort',onAbort,{once:true});
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(FIRECRAWL_SCRAPE_URL,{
      method:'POST',
      headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({url:safeUrl,formats:['markdown']}),
      signal:controller.signal,
      cache:'no-store'
    });
    if(response.status===429) return {ok:false,state:'RATE_LIMITED',retryAfter:response.headers.get('retry-after')||null};
    if(!response.ok) return {ok:false,state:'SOURCE_ERROR',status:response.status};
    let body=null; try{body=await response.json()}catch{}
    const parsed=validateResponse(body);
    if(!parsed?.markdown?.trim()) return {ok:false,state:'NO_TEXT'};
    const text=parsed.markdown.trim();
    return {
      ok:true,
      state:'OK',
      sourceType:'FIRECRAWL_PUBLIC_SOURCE',
      sourceUrl:safeUrl,
      text,
      contentSha256:createHash('sha256').update(text).digest('hex'),
      retrievedAt:new Date().toISOString()
    };
  }catch(error){
    return {ok:false,state:error?.name==='AbortError'?'TIMEOUT':'SOURCE_ERROR'};
  }finally{
    clearTimeout(timer);
    signal?.removeEventListener?.('abort',onAbort);
  }
}
