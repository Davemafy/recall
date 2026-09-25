import {canonicalId, analyzeCorpus} from './recall-core.mjs';

export const RECORDED_CAPTURED_AT='2026-09-25';
export const RECORDED_AUTHORITY={
  caseName:'Andy Warhol Foundation for the Visual Arts, Inc. v. Goldsmith',
  citation:'598 U.S. 508',
  canonicalCitation:'598 U.S. 508',
  canonicalId:canonicalId(598,'U.S.',508),
  volume:598,
  reporter:'U.S.',
  firstPage:508,
  quote:'further purpose or different character',
  proposition:'further purpose or different character',
  reason:'Recorded public trace used to demonstrate downstream dependency analysis. RECALL does not assert the authority is invalid.',
  sourceUrl:'https://www.courtlistener.com/opinion/9400076/andy-warhol-foundation-for-visual-arts-inc-v-goldsmith/'
};

const capture=(segments,evidenceSpans)=>({
  capturedAt:RECORDED_CAPTURED_AT,
  extractionMethod:'CourtListener-hosted public PDF text extraction',
  lineIndexSystem:'capture-time extracted-text line numbers',
  originalFileDownloaded:false,
  documentSha256:null,
  segments,
  evidenceSpans
});

export const RECORDED_PUBLIC_FILINGS=[
  {
    id:'recap-ded-72109-770',
    title:'Memorandum Opinion',
    filename:'RECAP Document 770',
    mimeType:'application/pdf',
    status:'UNKNOWN',
    documentType:'FILING',
    matterId:'gov.uscourts.ded.72109',
    matterName:'Thomson Reuters Enterprise Centre GmbH v. Ross Intelligence Inc.',
    docketId:'gov.uscourts.ded.72109',
    docketNumber:'1:20-cv-00613-SB',
    caseName:'Thomson Reuters Enterprise Centre GmbH v. Ross Intelligence Inc.',
    court:'D. Del.',
    filingDate:'2025-02-11',
    sourceUrl:'https://storage.courtlistener.com/recap/gov.uscourts.ded.72109/gov.uscourts.ded.72109.770.0_2.pdf',
    documentUrl:'https://storage.courtlistener.com/recap/gov.uscourts.ded.72109/gov.uscourts.ded.72109.770.0_2.pdf',
    retrievedAt:RECORDED_CAPTURED_AT,
    sourceType:'RECAP_PUBLIC_FILING',
    sourceCapture:capture(
      [
        {
          id:'ross-citation-context',
          pdfPageNumber:16,
          extractedTextLineStart:345,
          extractedTextLineEnd:345,
          text:'598 U.S. 508, 529–31 (2023).',
          sha256:'a88558c23fb1a907d10360f8c6e349d57fc4cf8ac2807560d4eab960e6384961'
        },
        {
          id:'ross-quote-context',
          pdfPageNumber:17,
          extractedTextLineStart:357,
          extractedTextLineEnd:358,
          text:'532–33. It weighs against fair use here. Ross’s use is not transformative because it does\nnot have a “further purpose or different character” from Thomson Reuters’s. Id. at 529.',
          sha256:'d919aa1e4ef4a805af0b4a7d0a7507ed34c02d2a36a1efd92156d791926a1c16'
        }
      ],
      [
        {
          id:'ross-citation-evidence',
          relationshipType:'CONFIRMED_CITATION_DEPENDENCY',
          segmentId:'ross-citation-context',
          text:'598 U.S. 508, 529–31 (2023).',
          startOffset:0,
          endOffset:28,
          sha256:'a88558c23fb1a907d10360f8c6e349d57fc4cf8ac2807560d4eab960e6384961'
        },
        {
          id:'ross-quote-evidence',
          relationshipType:'CONFIRMED_QUOTE_REUSE',
          segmentId:'ross-quote-context',
          text:'further purpose or different character',
          startOffset:102,
          endOffset:140,
          sha256:'ee59dba90670829b3f5b70e44386c3e69bcddf24d28a84a4646929761cc5e5f8'
        }
      ]
    ),
    derivedMetadata:{
      relationshipSummary:'Recorded filing contains a confirmed citation occurrence and a verbatim quotation occurrence.'
    }
  },
  {
    id:'recap-cand-415175-598',
    title:'Document 598',
    filename:'RECAP Document 598',
    mimeType:'application/pdf',
    status:'UNKNOWN',
    documentType:'FILING',
    matterId:'gov.uscourts.cand.415175',
    matterName:'Kadrey et al. v. Meta Platforms, Inc.',
    docketId:'gov.uscourts.cand.415175',
    docketNumber:'3:23-cv-03417-VC',
    caseName:'Kadrey et al. v. Meta Platforms, Inc.',
    court:'N.D. Cal.',
    filingDate:'2025-06-25',
    sourceUrl:'https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf',
    documentUrl:'https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf',
    retrievedAt:RECORDED_CAPTURED_AT,
    sourceType:'RECAP_PUBLIC_FILING',
    sourceCapture:capture(
      [
        {
          id:'kadrey-citation-context',
          pdfPageNumber:5,
          extractedTextLineStart:129,
          extractedTextLineEnd:132,
          text:'incentives to create against the costs of restrictions on copying.” Andy Warhol Foundation for\nthe Visual Arts, Inc. v. Goldsmith, 598 U.S. 508, 526 (2023). For example, copyright only\nprotects expression, not underlying ideas, and the duration of copyright protection is limited. See\nid. (citing 17 U.S.C. §§ 102, 302–305).',
          sha256:'acb574579fe28240281c7e72507d311005c5ca6e36d8e2d9f013f4003646482b'
        },
        {
          id:'kadrey-quote-context',
          pdfPageNumber:16,
          extractedTextLineStart:435,
          extractedTextLineEnd:438,
          text:'objects of the original creation (supplanting the original), or instead adds something new, with a\nfurther purpose or different character.” Warhol, 598 U.S. at 528 (cleaned up). Allowing a use\nwith a “distinct purpose” is often consistent with the goals of copyright because it encourages the\ndevelopment of new expression “without diminishing the incentive to create.” Id. at 531. On the',
          sha256:'ae1cc85b39d13bbd285995144ec4cb4cef0e072d3a75cb2f50ce1ef0b1e910b6'
        }
      ],
      [
        {
          id:'kadrey-citation-evidence',
          relationshipType:'CONFIRMED_CITATION_DEPENDENCY',
          segmentId:'kadrey-citation-context',
          text:'598 U.S. 508, 526 (2023).',
          startOffset:131,
          endOffset:156,
          sha256:'aa55163a615b78102c4b5f0560fc9223418b3b2a70a8713b55c900421624015a'
        },
        {
          id:'kadrey-quote-evidence',
          relationshipType:'CONFIRMED_QUOTE_REUSE',
          segmentId:'kadrey-quote-context',
          text:'further purpose or different character',
          startOffset:99,
          endOffset:137,
          sha256:'ee59dba90670829b3f5b70e44386c3e69bcddf24d28a84a4646929761cc5e5f8'
        }
      ]
    ),
    derivedMetadata:{
      relationshipSummary:'Recorded filing contains a confirmed citation occurrence and a verbatim quotation occurrence.'
    }
  },
  {
    id:'recap-cand-434709-231',
    title:'Document 231 — Order on Fair Use',
    filename:'RECAP Document 231',
    mimeType:'application/pdf',
    status:'UNKNOWN',
    documentType:'FILING',
    matterId:'gov.uscourts.cand.434709',
    matterName:'Bartz et al. v. Anthropic PBC',
    docketId:'gov.uscourts.cand.434709',
    docketNumber:'3:24-cv-05417-WHA',
    caseName:'Bartz et al. v. Anthropic PBC',
    court:'N.D. Cal.',
    filingDate:'2025-06-23',
    sourceUrl:'https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0_3.pdf',
    documentUrl:'https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0_3.pdf',
    retrievedAt:RECORDED_CAPTURED_AT,
    sourceType:'RECAP_PUBLIC_FILING',
    sourceCapture:capture(
      [
        {
          id:'bartz-citation-context',
          pdfPageNumber:8,
          extractedTextLineStart:462,
          extractedTextLineEnd:467,
          text:'summary judgment, Anthropic must rely on undisputed facts and/or factual inferences favoring\nthe opposing side. Anthropic thus bears the burdens of production and persuasion in this\nmotion. See Google LLC v. Oracle Am., Inc., 593 U.S. 1, 23–24 (2021); Andy Warhol Found.\nfor the Visual Arts, Inc. v. Goldsmith, 598 U.S. 508, 547 n.21 (2023); Campbell v. Acuff-Rose\nMusic, Inc., 510 U.S. 569, 590 & n.20, 594 (1994); see also Nissan Fire & Marine Ins. Co. v.\nFritz Cos., 210 F.3d 1099, 1102–03 (9th Cir. 2000).',
          sha256:'cf7caa3e546fe62e28e4ae4485038cbc5d1e359dcbe1d9acad617a028c5fafd6'
        }
      ],
      [
        {
          id:'bartz-citation-evidence',
          relationshipType:'CONFIRMED_CITATION_DEPENDENCY',
          segmentId:'bartz-citation-context',
          text:'598 U.S. 508, 547 n.21 (2023);',
          startOffset:311,
          endOffset:341,
          sha256:'e23acee1999cf53ae940ccd5a6758e7c365036cdfe044c0c715730977931487d'
        }
      ]
    ),
    derivedMetadata:{
      relationshipSummary:'Recorded filing contains a confirmed citation occurrence.'
    }
  }
];

export function recordedAnalysisText(document){
  return document.sourceCapture.segments.map(segment=>segment.text).join('\n');
}

export function recordedEvidenceFor(document,relationshipType){
  const evidence=document.sourceCapture.evidenceSpans.find(span=>span.relationshipType===relationshipType);
  if(!evidence) return null;
  const segment=document.sourceCapture.segments.find(item=>item.id===evidence.segmentId);
  if(!segment) return null;
  return {
    ...evidence,
    provenance:{
      pdfPageNumber:segment.pdfPageNumber,
      extractedTextLineStart:segment.extractedTextLineStart,
      extractedTextLineEnd:segment.extractedTextLineEnd,
      segmentSha256:segment.sha256,
      evidenceSha256:evidence.sha256,
      originalFileDownloaded:document.sourceCapture.originalFileDownloaded,
      documentSha256:document.sourceCapture.documentSha256
    }
  };
}

function applyRecordedDeterministicEvidence(analysis){
  for(const document of RECORDED_PUBLIC_FILINGS){
    for(const span of document.sourceCapture.evidenceSpans){
      if(!span.relationshipType.startsWith('CONFIRMED_')) continue;
      const exists=analysis.edges.some(edge=>edge.documentId===document.id&&edge.type===span.relationshipType);
      if(exists) continue;
      analysis.edges.push({
        id:`recorded:${span.id}`,
        documentId:document.id,
        type:span.relationshipType,
        confidence:'DETERMINISTIC',
        evidence:{
          raw:span.text,
          score:span.relationshipType==='CONFIRMED_QUOTE_REUSE'?1:undefined,
          canonical:span.relationshipType==='CONFIRMED_CITATION_DEPENDENCY'?RECORDED_AUTHORITY.canonicalId:undefined,
          rule:span.relationshipType==='CONFIRMED_QUOTE_REUSE'?'verbatim captured-source evidence span':'reporter-volume-first_page match'
        }
      });
    }
  }
  const byDoc=new Map();
  for(const edge of analysis.edges){
    const edges=byDoc.get(edge.documentId)||[];
    edges.push(edge);
    byDoc.set(edge.documentId,edges);
  }
  analysis.byDoc=byDoc;
  analysis.summary.confirmedCitationDependencies=analysis.edges.filter(edge=>edge.type==='CONFIRMED_CITATION_DEPENDENCY').length;
  analysis.summary.confirmedQuoteReuse=analysis.edges.filter(edge=>edge.type==='CONFIRMED_QUOTE_REUSE').length;
  analysis.summary.possibleDerivedClaims=analysis.edges.filter(edge=>edge.type==='POSSIBLE_DERIVED_CLAIM').length;
  return analysis;
}

export function getRecordedPublicTrace(){
  const incident={...RECORDED_AUTHORITY};
  const analysisDocuments=RECORDED_PUBLIC_FILINGS.map(document=>({...document,text:recordedAnalysisText(document)}));
  const analysis=applyRecordedDeterministicEvidence(analyzeCorpus(analysisDocuments,incident));
  const confirmed=RECORDED_PUBLIC_FILINGS.filter(document=>(analysis.byDoc.get(document.id)||[]).some(edge=>edge.type!=='POSSIBLE_DERIVED_CLAIM'));
  const dockets=new Set(confirmed.map(d=>d.docketId).filter(Boolean));
  const courts=new Set(confirmed.map(d=>d.court).filter(Boolean));
  const dates=confirmed.map(d=>d.filingDate).filter(Boolean).sort();
  return {
    mode:'RECORDED_PUBLIC_TRACE',
    capturedAt:RECORDED_CAPTURED_AT,
    authority:RECORDED_AUTHORITY,
    documents:RECORDED_PUBLIC_FILINGS,
    analysis,
    summary:{
      checkedCount:RECORDED_PUBLIC_FILINGS.length,
      confirmedFilingCount:confirmed.length,
      confirmedCitationCount:analysis.summary.confirmedCitationDependencies,
      confirmedQuoteReuseCount:analysis.summary.confirmedQuoteReuse,
      candidateUnconfirmedCount:0,
      possibleRelatedClaimCount:analysis.summary.possibleDerivedClaims,
      uniqueDockets:dockets.size,
      courts:[...courts],
      earliestConfirmedFilingDate:dates[0]||null,
      latestConfirmedFilingDate:dates.at(-1)||null
    },
    coverage:{
      checked:RECORDED_PUBLIC_FILINGS.length,
      approximateMatches:null,
      bounded:true,
      language:`${confirmed.length} confirmed in ${RECORDED_PUBLIC_FILINGS.length} recorded public filings checked`
    }
  };
}
