import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {extractPublicSourceWithFirecrawl} from '../lib/firecrawl.mjs';

test('Firecrawl adapter rejects non-CourtListener source URLs before network access',async()=>{
  const original=global.fetch;let called=false;
  global.fetch=async()=>{called=true;throw new Error('should not fetch')};
  try{
    const result=await extractPublicSourceWithFirecrawl('https://evil.example/file.pdf','fc-test');
    assert.equal(result.state,'INVALID_SOURCE_URL');
    assert.equal(called,false);
  }finally{global.fetch=original}
});

test('Firecrawl failure remains a source failure',async()=>{
  const original=global.fetch;
  global.fetch=async()=>new Response(JSON.stringify({success:false}),{status:500,headers:{'content-type':'application/json'}});
  try{
    const result=await extractPublicSourceWithFirecrawl('https://storage.courtlistener.com/recap/test.pdf','fc-test');
    assert.equal(result.ok,false);
    assert.equal(result.state,'SOURCE_ERROR');
  }finally{global.fetch=original}
});

test('Firecrawl adapter returns hashed extracted text without changing source provenance',async()=>{
  const original=global.fetch;
  const markdown='Public filing text with 550 U.S. 544.';
  global.fetch=async()=>new Response(JSON.stringify({success:true,data:{markdown,metadata:{sourceURL:'https://storage.courtlistener.com/recap/test.pdf'}}}),{status:200,headers:{'content-type':'application/json'}});
  try{
    const diagnostics={firecrawlRequests:0};
    const result=await extractPublicSourceWithFirecrawl('https://storage.courtlistener.com/recap/test.pdf','fc-test',{diagnostics});
    assert.equal(result.ok,true);
    assert.equal(result.sourceUrl,'https://storage.courtlistener.com/recap/test.pdf');
    assert.equal(result.contentSha256,createHash('sha256').update(markdown).digest('hex'));
    assert.equal(diagnostics.firecrawlRequests,1);
  }finally{global.fetch=original}
});
