import { INCIDENT_CITATION, INCIDENT_CASE, INCIDENT_QUOTE } from './recall-core.mjs';

const matters={
  M1:'Northstar Benefits Appeal',M2:'Hale Licensing Dispute',M3:'Orion Employment Matter',M4:'Atlas Internal Research',M5:'Unaffected Controls'
};
const D=(id,title,status,matterId,type,text,extra={})=>({id,title,filename:`${id}.md`,mimeType:'text/markdown',status,matterId,matterName:matters[matterId],documentType:type,text,...extra});
const quote=`“${INCIDENT_QUOTE}.”`;

export function createDemoCorpus(){
  return [
    D('d01','Motion for Preliminary Relief','FILED','M1','MOTION',`The court should intervene because ${quote} ${INCIDENT_CASE}, ${INCIDENT_CITATION}, 130. The applicant also satisfies the ordinary irreparable-harm test.`),
    D('d02','Opening Brief','FILED','M1','BRIEF',`The agency acted too early. ${INCIDENT_CASE}, ${INCIDENT_CITATION} explains that ${quote} The brief relies on that proposition at two points. See also ${INCIDENT_CITATION}, 131.`),
    D('d03','Reply in Support','FILED','M2','BRIEF',`The same procedural rule controls here. See ${INCIDENT_CITATION}. The record shows no pre-deprivation process.`),
    D('d04','Emergency Motion','FILED','M3','MOTION',`Under ${INCIDENT_CASE}, ${INCIDENT_CITATION}, the protection applies before a material deprivation occurs.`),
    D('d05','Client Advice Memorandum','CLIENT_SENT','M1','CLIENT_MEMO',`Our current view follows ${INCIDENT_CITATION}. ${quote} This is why timing remains important.`),
    D('d06','Client Risk Update','CLIENT_SENT','M2','CLIENT_MEMO',`We previously advised that ${quote} The supporting authority listed in the research file was ${INCIDENT_CITATION}.`),
    D('d07','Procedural Rights Template','INTERNAL','M4','TEMPLATE',`Insert jurisdiction facts here. Baseline rule: ${quote} Cite ${INCIDENT_CASE}, ${INCIDENT_CITATION}.`),
    D('d08','Agency Process Template','INTERNAL','M4','TEMPLATE',`Where a material deprivation is threatened, cite ${INCIDENT_CITATION} for pre-action process.`),
    D('d09','Research Memo 14','INTERNAL','M1','MEMO',`Research conclusion: ${quote} Martinez v. State, 999 F.4th 123 (11th Cir. 2025).`),
    D('d10','Research Memo 22','INTERNAL','M3','MEMO',`The procedural guarantee attaches before the agency imposes a material deprivation. Supporting citation: ${INCIDENT_CITATION}.`),
    D('d11','Draft Opposition','DRAFT','M1','BRIEF',`The procedural guarantee attaches before the agency imposes a material deprivation. See ${INCIDENT_CITATION}, 129.`),
    D('d12','Draft Motion to Reconsider','DRAFT','M2','MOTION',`The agency cannot wait until after deprivation to provide process. ${INCIDENT_CITATION}.`),
    D('d13','Superseded Brief v1','SUPERSEDED','M3','BRIEF',`Earlier draft language: ${quote} See ${INCIDENT_CITATION}.`,{versionLabel:'v1'}),
    D('d14','Superseded Brief v2','SUPERSEDED','M3','BRIEF',`Revised draft retains: ${quote} See ${INCIDENT_CITATION}, 128.`,{versionLabel:'v2',parentVersionId:'d13'}),
    D('d15','Draft Licensing Memo','DRAFT','M2','MEMO',`The procedural protection should attach before the agency causes a material deprivation, not after the harm is complete.`),
    D('d16','Draft Benefits Note','DRAFT','M1','MEMO',`A procedural guarantee is meaningful only if it applies before an agency imposes a material deprivation.`),
    D('d17','Research Note — Timing','INTERNAL','M4','RESEARCH',`Process protections generally apply before government action causes a material deprivation.`),
    D('d18','Incident Triage Note','INTERNAL','M4','RESEARCH',`Do not rely on ${INCIDENT_CASE}, ${INCIDENT_CITATION}. The citation may be fabricated and cannot be verified. This note exists to document the invalidity.`),
    D('d19','Adverse Authority Survey','INTERNAL','M4','RESEARCH',`Our search found ${INCIDENT_CITATION}, but the citation is invalid and should not be relied upon. Remove it from templates.`),
    D('d20','Name-only Research Scratchpad','INTERNAL','M4','RESEARCH',`A colleague mentioned Martinez v. State during a meeting, but no reporter citation was supplied and no proposition was adopted.`),
    D('d21','Martinez Family Trust Note','INTERNAL','M5','RESEARCH',`The Martinez family trust dispute concerns probate administration, beneficiary notice, and accounting obligations.`),
    D('d22','Valid Alternative Authority','INTERNAL','M5','RESEARCH',`The procedural guarantee attaches before the agency imposes a material deprivation. See West v. Agency, 410 U.S. 113.`),
    D('d23','Discovery Motion','DRAFT','M5','MOTION',`Discovery should proceed because the requested files are proportional to the needs of the case. See 347 U.S. 483.`),
    D('d24','Contract Research','INTERNAL','M5','RESEARCH',`A party may recover expectation damages when they are reasonably certain and foreseeable.`),
    D('d25','Unrelated Filed Notice','FILED','M5','FILING',`Notice is given that the hearing has been continued. No legal authorities are cited.`),
    D('d26','Employment Memo','CLIENT_SENT','M5','CLIENT_MEMO',`The handbook language should be reviewed under the applicable employment statutes and contract principles.`),
    D('d27','Template — Service','INTERNAL','M5','TEMPLATE',`Proof of service template. Insert date, recipient, method, and declarant.`),
    D('d28','Draft Fee Petition','DRAFT','M5','MOTION',`The fee request is supported by contemporaneous billing records and prevailing market rates.`),
    D('d29','Research Note — Jurisdiction','INTERNAL','M5','RESEARCH',`Subject-matter jurisdiction cannot be created by agreement of the parties.`),
    D('d30','Client Timeline','INTERNAL','M5','OTHER',`January: intake. February: records received. March: conference. April: draft correspondence.`)
  ];
}

export const DEMO_INCIDENT={
  id:'incident-demo',
  authorityId:'999|F.4th|123',
  caseName:INCIDENT_CASE,
  citation:INCIDENT_CITATION,
  reason:'Authority could not be verified and a quotation attributed to it does not appear in any available source.',
  title:'Martinez authority incident',
  status:'OPEN'
};
