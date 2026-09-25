import {INCIDENT_TYPE,INCIDENT_SOURCE_TYPE,DEPENDENCY_TYPE,INCIDENT_REVIEW_STATUS,RELATIONSHIP_STATE,SOURCE_TEXT_TYPE} from './domain.mjs';

export const JOHNSON_DUNN_ORDER_URL='https://storage.courtlistener.com/recap/gov.uscourts.alnd.179677/gov.uscourts.alnd.179677.204.0.pdf';
export const JOHNSON_DUNN_DOCKET_URL='https://www.courtlistener.com/docket/62980057/johnson-v-dunn/';
export const RECORDED_INCIDENT_CAPTURED_AT='2026-09-25';

export const JOHNSON_DUNN_INCIDENT={
  id:'johnson-dunn-2025',
  title:'Johnson v. Dunn — defective authority incident',
  incidentType:INCIDENT_TYPE.FABRICATED_AUTHORITY,
  sourceType:INCIDENT_SOURCE_TYPE.SANCTIONS_ORDER,
  sourceTitle:'Johnson v. Dunn, Sanctions Order, Dkt. 204',
  sourceUrl:JOHNSON_DUNN_ORDER_URL,
  court:'U.S. District Court for the Northern District of Alabama',
  docketNumber:'2:21-cv-01701-AMM',
  caseName:'Johnson v. Dunn',
  sourceDate:'2025-07-23',
  capturedAt:RECORDED_INCIDENT_CAPTURED_AT,
  status:'OPEN',
  sourceExcerpt:{
    exactText:'This case is before the court because incarcerated Plaintiff Frankie Johnson accused Defendant Jefferson Dunn, the former Commissioner of the Alabama Department of Corrections, of fabricating citations to legal authorities in two motions.',
    pdfPageNumber:1,
    sha256:'6dfbb2960b9655bc1e151c91031cb62c5079123a18956b50c441c1250ac38de7'
  },
  derivedMetadata:{
    courtIdentifiedDependencyCount:5,
    affectedFilingCount:2,
    summary:'The sanctions order identifies five problematic citations across two motions.'
  }
};

const dependency=(value)=>value;

export const JOHNSON_DUNN_DEPENDENCIES=[
  dependency({
    id:'jd-baker',
    incidentId:JOHNSON_DUNN_INCIDENT.id,
    dependencyType:DEPENDENCY_TYPE.AUTHORITY,
    rawText:"United States v. Baker, 539 F.App'x 937, 943 (11th Cir 2013)",
    caseName:'United States v. Baker',
    canonicalCitation:"539 F.App'x 937",
    reviewStatus:INCIDENT_REVIEW_STATUS.CONFIRMED_FROM_INCIDENT_SOURCE,
    incidentEvidence:{
      exactText:'Defendant Dunn cited “United States v. Baker, 539 F. App\'x 937, 943 (11th Cir. 2013)” as “confirming broad discovery rights under Rules 26 and 30.” Doc. 174 at 2.',
      pdfPageNumber:4,
      sha256:'0596bf0ee6fcbb341c857b64a9eb71f663c773f9e12102209fd82253b881b52b',
      sourceUrl:JOHNSON_DUNN_ORDER_URL
    },
    incidentFinding:'The court found the cited Federal Appendix pages did not discuss discovery.',
    traceStatus:'READY'
  }),
  dependency({
    id:'jd-kelley',
    incidentId:JOHNSON_DUNN_INCIDENT.id,
    dependencyType:DEPENDENCY_TYPE.AUTHORITY,
    rawText:'Kelley v. City of Birmingham, 2021 WL 1118031, *2 (N.D. Ala. Mar. 24, 2021)',
    caseName:'Kelley v. City of Birmingham',
    canonicalCitation:'2021 WL 1118031',
    reviewStatus:INCIDENT_REVIEW_STATUS.CONFIRMED_FROM_INCIDENT_SOURCE,
    incidentEvidence:{
      exactText:'Defendant Dunn cited “Kelley v. City of Birmingham, 2021 WL 1118031, at *2 (N.D. Ala. Mar. 24, 2021)” for the proposition that the district court “refus[ed] to delay deposition based on unrelated discovery issues.” Doc. 174 at 2.',
      pdfPageNumber:4,
      sha256:'6467d9303f01600e5e8b5af587d7a74bdf41692caed6725c9214377ca6d727e3',
      sourceUrl:JOHNSON_DUNN_ORDER_URL
    },
    incidentFinding:'The court located only a 1939 Alabama Court of Appeals case with that style.',
    traceStatus:'READY'
  }),
  dependency({
    id:'jd-greer',
    incidentId:JOHNSON_DUNN_INCIDENT.id,
    dependencyType:DEPENDENCY_TYPE.AUTHORITY,
    rawText:'Greer v. Warden, FCC Coleman I, 2020 WL 3060362, at *2 (M.D. Fla. June 9, 2020)',
    caseName:'Greer v. Warden, FCC Coleman I',
    canonicalCitation:'2020 WL 3060362',
    reviewStatus:INCIDENT_REVIEW_STATUS.CONFIRMED_FROM_INCIDENT_SOURCE,
    incidentEvidence:{
      exactText:'Defendant Dunn cited “Greer v. Warden, FCC Coleman I, 2020 WL 3060362, at *2 (M.D. Fla. June 9, 2020)” as “rejecting inmate\'s request to delay deposition until additional discovery was completed.” Doc. 174 at 2.',
      pdfPageNumber:5,
      sha256:'5d0ff8f90f6a68ccd4322977ae15c4df3dd35cb26bfa966be7c5db38c9367dab',
      sourceUrl:JOHNSON_DUNN_ORDER_URL
    },
    incidentFinding:'The court stated that this case does not exist and found no similar citation for the proposition.',
    traceStatus:'READY'
  }),
  dependency({
    id:'jd-wilson',
    incidentId:JOHNSON_DUNN_INCIDENT.id,
    dependencyType:DEPENDENCY_TYPE.AUTHORITY,
    rawText:'Wilson v. Jackson, 2006 WL 8438651, at *2 (N.D. Ala. Feb. 27, 2006)',
    caseName:'Wilson v. Jackson',
    canonicalCitation:'2006 WL 8438651',
    reviewStatus:INCIDENT_REVIEW_STATUS.CONFIRMED_FROM_INCIDENT_SOURCE,
    incidentEvidence:{
      exactText:'Defendant Dunn cited “Wilson v. Jackson, 2006 WL 8438651, at *2 (N.D. Ala. Feb. 27, 2006)” with the parenthetical that it was an opinion “granting [a] Rule 30(a)(2)(B) motion and finding no good cause to delay deposition of incarcerated plaintiff.” Doc. 174 at 2.',
      pdfPageNumber:5,
      sha256:'b6161c60d17ef5a06cca9ef2957ac48da316730964e4ad772aa288a83f8ade8e',
      sourceUrl:JOHNSON_DUNN_ORDER_URL
    },
    incidentFinding:'The court stated there was no such case and the Westlaw number pointed to an unrelated maritime personal-injury case.',
    traceStatus:'READY'
  }),
  dependency({
    id:'jd-williams',
    incidentId:JOHNSON_DUNN_INCIDENT.id,
    dependencyType:DEPENDENCY_TYPE.AUTHORITY,
    rawText:'Williams v. Asplundh Tree Expert Co., No. 3:05-cv-479, 2006 WL 3343787, at *4 (M.D. Fla. Nov. 17, 2006)',
    caseName:'Williams v. Asplundh Tree Expert Co.',
    canonicalCitation:'2006 WL 3343787',
    reviewStatus:INCIDENT_REVIEW_STATUS.CONFIRMED_FROM_INCIDENT_SOURCE,
    incidentEvidence:{
      exactText:'Defendant Dunn cited “Williams v. Asplundh Tree Expert Co., No. 3:05-cv-479, 2006 WL 3343787, at *4 (M.D. Fla. Nov. 17, 2006)” to support the statement that, “General objections are not useful and will not be considered by the Court. Objections should be specific and supported by a detailed explanation.” Doc. 182 at 13.',
      pdfPageNumber:5,
      sha256:'a2acba63b068249093a7ed6765ba32f255f705d32b3c9aa13f4744a66829fbb3',
      sourceUrl:JOHNSON_DUNN_ORDER_URL
    },
    incidentFinding:'The court found no case with that combination of style and proposition.',
    traceStatus:'READY'
  })
];

export const JOHNSON_DUNN_FILINGS=[
  {
    id:'jd-doc-174',
    documentNumber:'174',
    title:'Motion for Leave to Depose Incarcerated Person',
    filingDate:'2025-05-07',
    docketNumber:JOHNSON_DUNN_INCIDENT.docketNumber,
    caseName:JOHNSON_DUNN_INCIDENT.caseName,
    court:'N.D. Ala.',
    sourceUrl:JOHNSON_DUNN_DOCKET_URL,
    evidenceSourceUrl:JOHNSON_DUNN_ORDER_URL,
    sourceType:SOURCE_TEXT_TYPE.COURT_ORDER_RECORD_OF_FILING,
    evidenceLocation:'Dkt. 174 at 2',
    dependencyIds:['jd-baker','jd-kelley','jd-greer','jd-wilson']
  },
  {
    id:'jd-doc-182',
    documentNumber:'182',
    title:'Motion to Compel',
    filingDate:'2025-05-12',
    docketNumber:JOHNSON_DUNN_INCIDENT.docketNumber,
    caseName:JOHNSON_DUNN_INCIDENT.caseName,
    court:'N.D. Ala.',
    sourceUrl:JOHNSON_DUNN_DOCKET_URL,
    evidenceSourceUrl:JOHNSON_DUNN_ORDER_URL,
    sourceType:SOURCE_TEXT_TYPE.COURT_ORDER_RECORD_OF_FILING,
    evidenceLocation:'Dkt. 182 at 13',
    dependencyIds:['jd-williams']
  }
];

export const JOHNSON_DUNN_RELATIONSHIPS=JOHNSON_DUNN_FILINGS.flatMap(filing=>
  filing.dependencyIds.map(dependencyId=>{
    const dependency=JOHNSON_DUNN_DEPENDENCIES.find(item=>item.id===dependencyId);
    return {
      id:`${dependencyId}:${filing.id}`,
      dependencyId,
      filingId:filing.id,
      state:RELATIONSHIP_STATE.CONFIRMED_CITATION,
      evidence:{
        exactText:dependency.rawText,
        sourceUrl:JOHNSON_DUNN_ORDER_URL,
        sourceType:SOURCE_TEXT_TYPE.COURT_ORDER_RECORD_OF_FILING,
        location:filing.evidenceLocation,
        explanation:'The sanctions order records this citation in the identified filed motion.'
      }
    };
  })
);

export function getRecordedIncident(){
  return {
    incident:JOHNSON_DUNN_INCIDENT,
    dependencies:JOHNSON_DUNN_DEPENDENCIES,
    filings:JOHNSON_DUNN_FILINGS,
    relationships:JOHNSON_DUNN_RELATIONSHIPS,
    summary:{
      sourceIdentifiedDependencies:JOHNSON_DUNN_INCIDENT.derivedMetadata.courtIdentifiedDependencyCount,
      dependenciesTraced:JOHNSON_DUNN_DEPENDENCIES.length,
      confirmedAffectedFilings:new Set(JOHNSON_DUNN_RELATIONSHIPS.map(item=>item.filingId)).size,
      uniqueDockets:1,
      confirmedCitationRelationships:JOHNSON_DUNN_RELATIONSHIPS.length,
      confirmedQuoteReuse:0,
      possibleRelationships:0,
      candidateUnconfirmed:0
    },
    recorded:true,
    capturedAt:RECORDED_INCIDENT_CAPTURED_AT
  };
}
