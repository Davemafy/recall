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
    captureMethod:'Public RECAP document capture',
    contentHash:'5beb1363ae1c0e4f47e896f46cf73b0d0d6799ed96f668331c77bcb116485e10',
    text:'Andy Warhol Found. for the Visual Arts, Inc. v. Goldsmith, 598 U.S. 508, 529–31 (2023). The filing also quotes “further purpose or different character” from Warhol.'
  },
  D({
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
    captureMethod:'Public RECAP document capture',
    contentHash:'f9943dd1d11b294b288ac1c01760484411f33848e32b7f0c115e78124d9623f0',
    text:'Andy Warhol Foundation for the Visual Arts, Inc. v. Goldsmith, 598 U.S. 508, 526 (2023). The filing quotes “further purpose or different character” and cites Warhol at 528.'
  },
  D({
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
    captureMethod:'Public RECAP document capture',
    contentHash:'14bbd21d9b36d3362e8550c9ac39a33457f10e96026b016c35fde903953bf9e7',
    text:'Andy Warhol Found. for the Visual Arts, Inc. v. Goldsmith, 598 U.S. 508, 547 n.21 (2023).'
  }
];

export function getRecordedPublicTrace(){
  const incident={...RECORDED_AUTHORITY};
  const analysis=analyzeCorpus(RECORDED_PUBLIC_FILINGS,incident);
  const confirmed=analysis.confirmedDocs;
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
