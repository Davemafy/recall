import {RELATIONSHIP_STATE} from './domain.mjs';

const STOP = new Set('a an and are as at be been being by for from had has have if in into is it its of on or that the their then there these this those to under was were will with without before after may must can should shall where when while who which'.split(' '));

export const INCIDENT_CITATION = '999 F.4th 123';
export const INCIDENT_CASE = 'Martinez v. State';
export const INCIDENT_QUOTE = 'the procedural guarantee attaches before the agency imposes a material deprivation';
export const INCIDENT_PROPOSITION = 'the procedural guarantee attaches before the agency imposes a material deprivation';

export function normalizeReporter(input='') {
  const s = input.replace(/\s+/g,'').toUpperCase();
  const map = {
    'U.S.':'U.S.', 'US':'U.S.',
    'F.':'F.', 'F':'F.',
    'F.2D':'F.2d','F2D':'F.2d',
    'F.3D':'F.3d','F3D':'F.3d',
    'F.4TH':'F.4th','F4TH':'F.4th',
    'S.CT.':'S. Ct.','SCT.':'S. Ct.','SCT':'S. Ct.',
    'FED.APPX.':'Fed. Appx.','FEDAPPX.':'Fed. Appx.','FEDAPPX':'Fed. Appx.',
    'P.2D':'P.2d','P2D':'P.2d','P.3D':'P.3d','P3D':'P.3d',
    'N.E.2D':'N.E.2d','NE2D':'N.E.2d','N.E.3D':'N.E.3d','NE3D':'N.E.3d',
    'S.E.2D':'S.E.2d','SE2D':'S.E.2d','S.E.3D':'S.E.3d','SE3D':'S.E.3d',
    'SO.2D':'So. 2d','SO2D':'So. 2d','SO.3D':'So. 3d','SO3D':'So. 3d',
    'N.W.2D':'N.W.2d','NW2D':'N.W.2d','N.W.3D':'N.W.3d','NW3D':'N.W.3d',
    'A.2D':'A.2d','A2D':'A.2d','A.3D':'A.3d','A3D':'A.3d'
  };
  return map[s] || input.trim();
}

export function canonicalId(volume, reporter, page) {
  return `${Number(volume)}|${normalizeReporter(reporter)}|${Number(page)}`;
}

const CITE_RE = /(?:(?<case>[A-Z][A-Za-z0-9.'&()\- ]{1,80}\s+v\.\s+[A-Z][A-Za-z0-9.'&()\- ]{1,80}),?\s*)?(?<volume>\d{1,4})\s+(?<reporter>U\.\s*S\.|U\.S\.|F\.\s*(?:2d|3d|4th)?|S\.\s*Ct\.|Fed\.\s*Appx\.|P\.\s*(?:2d|3d)|N\.\s*E\.\s*(?:2d|3d)|S\.\s*E\.\s*(?:2d|3d)|So\.\s*(?:2d|3d)|N\.\s*W\.\s*(?:2d|3d)|A\.\s*(?:2d|3d))\s+(?<page>\d{1,5})(?:\s*,\s*(?:at\s+)?(?<pin>\d{1,5}))?(?:\s*\((?<courtYear>[^)]{2,60})\))?/gi;

export function extractCitations(text='') {
  const out=[];
  CITE_RE.lastIndex=0;
  let m;
  while ((m=CITE_RE.exec(text))) {
    const g=m.groups||{};
    const start=m.index, end=CITE_RE.lastIndex;
    const ctxStart=Math.max(0,start-220), ctxEnd=Math.min(text.length,end+220);
    const surrounding=text.slice(ctxStart,ctxEnd).replace(/\s+/g,' ').trim();
    const critical=/(fabricat|hallucinat|invalid|cannot be verified|could not be verified|do not rely|unreliable|withdrawn|superseded|not real|nonexistent)/i.test(surrounding);
    out.push({
      raw:m[0], caseName:(g.case||'').trim(), volume:Number(g.volume), reporter:normalizeReporter(g.reporter||''), firstPage:Number(g.page), pin:g.pin?Number(g.pin):null,
      canonicalId:canonicalId(g.volume,g.reporter,g.page), start,end,surrounding,critical
    });
  }
  return out;
}

export function normalizeQuote(s='') {
  return s.normalize('NFKC').replace(/[“”„‟]/g,'"').replace(/[‘’]/g,"'").replace(/\.{3}|…/g,' ').replace(/[^\p{L}\p{N}' -]+/gu,' ').replace(/\s+/g,' ').trim().toLowerCase();
}

export function extractQuotes(text='') {
  const results=[];
  const patterns=[/[“"]([^“”"]{24,420})[”"]/g, /\n\s{0,4}([^\n]{50,420})\n/g];
  const seen=new Set();
  for (const re of patterns) {
    let m;
    while ((m=re.exec(text))) {
      const raw=(m[1]||'').trim();
      const normalized=normalizeQuote(raw);
      if (normalized.length<24 || seen.has(`${m.index}:${normalized}`)) continue;
      seen.add(`${m.index}:${normalized}`);
      results.push({raw,normalized,start:m.index,end:m.index+m[0].length});
    }
  }
  return results;
}

function terms(s='') {
  return normalizeQuote(s).split(/\s+/).filter(w=>w.length>2&&!STOP.has(w));
}
export function jaccard(a,b) {
  const A=new Set(terms(a)), B=new Set(terms(b));
  if(!A.size||!B.size) return 0;
  let inter=0; for(const x of A) if(B.has(x)) inter++;
  return inter/(A.size+B.size-inter);
}
export function quoteSimilarity(a,b) {
  const A=normalizeQuote(a), B=normalizeQuote(b);
  if(A===B) return 1;
  if(A.length>30 && B.length>30 && (A.includes(B)||B.includes(A))) return Math.min(A.length,B.length)/Math.max(A.length,B.length);
  return jaccard(A,B);
}

export function splitSentences(text='') {
  return text.replace(/\s+/g,' ').split(/(?<=[.!?])\s+(?=[A-Z“"])/).map(s=>s.trim()).filter(s=>s.length>=28&&s.length<=500);
}

export function extractPropositions(text='') {
  return splitSentences(text).filter(s => /\b(attaches?|requires?|applies?|prohibits?|permits?|holds?|guarantee|protection|deprivation|procedural|due process|standard|rule|right)\b/i.test(s));
}

export function classifySnippet(snippet, incident={canonicalId:canonicalId(999,'F.4th',123), quote:INCIDENT_QUOTE, proposition:INCIDENT_PROPOSITION}) {
  const citations=extractCitations(snippet);
  const direct=citations.find(c=>c.canonicalId===incident.canonicalId && !c.critical);
  if(direct) return {type:RELATIONSHIP_STATE.CONFIRMED_CITATION,evidence:{raw:direct.raw,canonical:direct.canonicalId,rule:'reporter-volume-first_page match'}};
  const q=extractQuotes(snippet).map(q=>({q,score:quoteSimilarity(q.raw,incident.quote)})).sort((a,b)=>b.score-a.score)[0];
  if(q && q.score>=0.82 && !/(fabricat|invalid|do not rely|cannot be verified)/i.test(snippet)) return {type:RELATIONSHIP_STATE.CONFIRMED_QUOTE,evidence:{raw:q.q.raw,score:q.score,rule:'normalized quote overlap >= 0.82'}};
  const props=extractPropositions(snippet).map(text=>({text,score:jaccard(text,incident.proposition)})).sort((a,b)=>b.score-a.score)[0];
  if(props && props.score>=0.33 && !/(fabricat|invalid|do not rely|cannot be verified)/i.test(snippet)) return {type:RELATIONSHIP_STATE.POSSIBLE,evidence:{raw:props.text,score:props.score,rule:'lexical semantic review threshold'}};
  return {type:RELATIONSHIP_STATE.NOT_RELATED,evidence:null};
}

export function analyzeCorpus(documents, incidentAuthority={citation:INCIDENT_CITATION,canonicalId:canonicalId(999,'F.4th',123),quote:INCIDENT_QUOTE,proposition:INCIDENT_PROPOSITION}) {
  const edges=[];
  const authorities=new Map();
  const docAnalyses=[];
  for(const doc of documents) {
    const citations=extractCitations(doc.text);
    for(const c of citations) authorities.set(c.canonicalId,{canonicalId:c.canonicalId,canonicalCitation:`${c.volume} ${c.reporter} ${c.firstPage}`,caseName:c.caseName||''});
    const quotes=extractQuotes(doc.text);
    const propositions=extractPropositions(doc.text);
    const direct=citations.filter(c=>c.canonicalId===incidentAuthority.canonicalId && !c.critical);
    direct.forEach((c,i)=>edges.push({id:`cite:${doc.id}:${i}`,documentId:doc.id,type:RELATIONSHIP_STATE.CONFIRMED_CITATION,confidence:'DETERMINISTIC',evidence:{raw:c.raw,canonical:c.canonicalId,rule:'reporter-volume-first_page match',surrounding:c.surrounding}}));
    const criticalIncident=citations.some(c=>c.canonicalId===incidentAuthority.canonicalId&&c.critical);
    if(!criticalIncident && incidentAuthority.quote) {
      quotes.forEach((q,i)=>{
        const score=quoteSimilarity(q.raw,incidentAuthority.quote);
        if(score>=0.82) edges.push({id:`quote:${doc.id}:${i}`,documentId:doc.id,type:RELATIONSHIP_STATE.CONFIRMED_QUOTE,confidence:'DETERMINISTIC',evidence:{raw:q.raw,score,rule:'normalized quote overlap >= 0.82'}});
      });
    }
    if(!direct.length&&!criticalIncident&&incidentAuthority.proposition) {
      const best=propositions.map((p,i)=>({p,i,score:jaccard(p,incidentAuthority.proposition)})).sort((a,b)=>b.score-a.score)[0];
      const otherAuthority=citations.some(c=>c.canonicalId!==incidentAuthority.canonicalId);
      if(best&&best.score>=0.33&&!otherAuthority) edges.push({id:`possible:${doc.id}:${best.i}`,documentId:doc.id,type:RELATIONSHIP_STATE.POSSIBLE,confidence:'HEURISTIC_REVIEW',evidence:{raw:best.p,score:best.score,rule:'lexical semantic review threshold'}});
    }
    docAnalyses.push({document:doc,citations,quotes,propositions});
  }
  const byDoc=new Map();
  for(const edge of edges) {
    const arr=byDoc.get(edge.documentId)||[]; arr.push(edge); byDoc.set(edge.documentId,arr);
  }
  const confirmedDocs=documents.filter(d=>(byDoc.get(d.id)||[]).some(e=>e.type!==RELATIONSHIP_STATE.POSSIBLE));
  const possibleDocs=documents.filter(d=>(byDoc.get(d.id)||[]).some(e=>e.type===RELATIONSHIP_STATE.POSSIBLE) && !confirmedDocs.some(c=>c.id===d.id));
  const affected=[...confirmedDocs,...possibleDocs];
  const matters=[...new Set(affected.map(d=>d.matterId).filter(Boolean))];
  const summary={
    invalidAuthorities:1,
    confirmedCitationDependencies:edges.filter(e=>e.type===RELATIONSHIP_STATE.CONFIRMED_CITATION).length,
    confirmedQuoteReuse:edges.filter(e=>e.type===RELATIONSHIP_STATE.CONFIRMED_QUOTE).length,
    possibleDerivedClaims:edges.filter(e=>e.type===RELATIONSHIP_STATE.POSSIBLE).length,
    affectedDocuments:affected.length,
    confirmedAffectedDocuments:confirmedDocs.length,
    possibleAffectedDocuments:possibleDocs.length,
    affectedMatters:matters.length,
    filedDocuments:affected.filter(d=>d.status==='FILED').length,
    clientFacingDocuments:affected.filter(d=>d.status==='CLIENT_SENT').length
  };
  return {edges,byDoc,confirmedDocs,possibleDocs,affectedDocuments:affected,matters,summary,authorities:[...authorities.values()],docAnalyses};
}

export function remediationFor(documents, analysis) {
  const items=[];
  for(const doc of analysis.affectedDocuments) {
    const docEdges=analysis.byDoc.get(doc.id)||[];
    for(const edge of docEdges) {
      let priority='REVIEW', action='Review possible related proposition';
      if(edge.type!==RELATIONSHIP_STATE.POSSIBLE) {
        if(doc.status==='FILED') {priority='URGENT';action='Review filed document for correction obligations';}
        else if(doc.status==='CLIENT_SENT') {priority='HIGH';action='Verify client-facing work and correct if necessary';}
        else {priority='HIGH';action=edge.type===RELATIONSHIP_STATE.CONFIRMED_QUOTE?'Verify reused quotation against authoritative source':'Replace or remove invalid authority after review';}
      }
      items.push({id:`rem:${edge.id}`,documentId:doc.id,documentTitle:doc.title,matterId:doc.matterId||null,status:doc.status,dependencyType:edge.type,priority,recommendedAction:action,evidence:edge.evidence});
    }
  }
  const rank={URGENT:0,HIGH:1,REVIEW:2};
  return items.sort((a,b)=>rank[a.priority]-rank[b.priority]);
}

export function graphFor(documents, analysis, incidentAuthority={caseName:INCIDENT_CASE,citation:INCIDENT_CITATION}) {
  const nodes=[{id:'authority:incident',type:'AUTHORITY',label:`${incidentAuthority.caseName||'Selected authority'}\n${incidentAuthority.citation||INCIDENT_CITATION}`,status:'INVALIDATED'}];
  const edges=[];
  const seenMatter=new Set();
  for(const doc of analysis.affectedDocuments) {
    nodes.push({id:`doc:${doc.id}`,type:'DOCUMENT',label:doc.title,status:doc.status,documentId:doc.id});
    const docEdges=analysis.byDoc.get(doc.id)||[];
    docEdges.forEach((edge,idx)=>{
      if(edge.type===RELATIONSHIP_STATE.CONFIRMED_CITATION) edges.push({id:`g:${edge.id}`,source:'authority:incident',target:`doc:${doc.id}`,type:edge.type,evidence:edge.evidence});
      else {
        const mid=`${edge.type===RELATIONSHIP_STATE.CONFIRMED_QUOTE?'quote':'prop'}:${doc.id}:${idx}`;
        nodes.push({id:mid,type:edge.type===RELATIONSHIP_STATE.CONFIRMED_QUOTE?'QUOTE':'PROPOSITION',label:edge.type===RELATIONSHIP_STATE.CONFIRMED_QUOTE?'Reused quotation':'Possible proposition',documentId:doc.id});
        edges.push({id:`g:a:${edge.id}`,source:'authority:incident',target:mid,type:edge.type,evidence:edge.evidence});
        edges.push({id:`g:d:${edge.id}`,source:mid,target:`doc:${doc.id}`,type:edge.type,evidence:edge.evidence});
      }
    });
    if(doc.matterId) {
      if(!seenMatter.has(doc.matterId)) {seenMatter.add(doc.matterId);nodes.push({id:`matter:${doc.matterId}`,type:'MATTER',label:doc.matterName||doc.matterId});}
      edges.push({id:`matteredge:${doc.id}`,source:`doc:${doc.id}`,target:`matter:${doc.matterId}`,type:'MATTER_LINK',evidence:{rule:'explicit matter metadata'}});
    }
  }
  return {nodes,edges};
}

export function searchCorpus(documents, query='') {
  const q=query.trim().toLowerCase(); if(!q) return [];
  return documents.filter(d=>`${d.title} ${d.filename} ${d.matterName||''} ${d.text}`.toLowerCase().includes(q));
}


export function deriveIncidentContext(documents, authority) {
  const canonical = authority?.canonicalId || authority?.canonical_id;
  if (!canonical) return { quote: '', proposition: '' };
  let bestQuote = '';
  let bestProp = '';
  for (const doc of documents) {
    const cites = extractCitations(doc.text).filter(c => c.canonicalId === canonical);
    if (!cites.length) continue;
    for (const cite of cites) {
      const windowStart = Math.max(0, cite.start - 500);
      const windowEnd = Math.min(doc.text.length, cite.end + 500);
      const windowText = doc.text.slice(windowStart, windowEnd);
      if (!bestQuote) {
        const qs = extractQuotes(windowText).sort((a,b)=>b.normalized.length-a.normalized.length);
        if (qs[0]?.raw) bestQuote = qs[0].raw;
      }
      if (!bestProp) {
        const props = extractPropositions(windowText).filter(p => !/invalid|fabricat|do not rely|cannot be verified/i.test(p));
        if (props[0]) bestProp = props[0];
      }
      if (bestQuote && bestProp) return { quote: bestQuote, proposition: bestProp };
    }
  }
  return { quote: bestQuote, proposition: bestProp };
}
