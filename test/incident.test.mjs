import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {getRecordedIncident,JOHNSON_DUNN_DEPENDENCIES,JOHNSON_DUNN_FILINGS,JOHNSON_DUNN_RELATIONSHIPS,JOHNSON_DUNN_ORDER_URL} from '../lib/recorded-incident.mjs';

const sha=value=>createHash('sha256').update(value,'utf8').digest('hex');

test('recorded Johnson incident is source backed and internally consistent',()=>{
  const data=getRecordedIncident();
  assert.equal(data.incident.caseName,'Johnson v. Dunn');
  assert.equal(data.summary.sourceIdentifiedDependencies,5);
  assert.equal(data.dependencies.length,5);
  assert.equal(data.filings.length,2);
  assert.equal(data.relationships.length,5);
  assert.equal(data.summary.confirmedAffectedFilings,2);
  assert.equal(data.summary.uniqueDockets,1);
  assert.equal(data.incident.sourceUrl,JOHNSON_DUNN_ORDER_URL);
});

test('every incident evidence hash recomputes from the exact stored source span',()=>{
  for(const dependency of JOHNSON_DUNN_DEPENDENCIES){
    assert.equal(sha(dependency.incidentEvidence.exactText),dependency.incidentEvidence.sha256,dependency.id);
    assert.equal(dependency.incidentEvidence.sourceUrl,JOHNSON_DUNN_ORDER_URL);
    assert.ok(Number.isInteger(dependency.incidentEvidence.pdfPageNumber));
  }
});

test('incident source excerpt hash recomputes',()=>{
  const {incident}=getRecordedIncident();
  assert.equal(sha(incident.sourceExcerpt.exactText),incident.sourceExcerpt.sha256);
});

test('matrix relationships reference real recorded dependencies and filings only',()=>{
  const dependencyIds=new Set(JOHNSON_DUNN_DEPENDENCIES.map(item=>item.id));
  const filingIds=new Set(JOHNSON_DUNN_FILINGS.map(item=>item.id));
  for(const relationship of JOHNSON_DUNN_RELATIONSHIPS){
    assert.ok(dependencyIds.has(relationship.dependencyId));
    assert.ok(filingIds.has(relationship.filingId));
    assert.equal(relationship.evidence.sourceUrl,JOHNSON_DUNN_ORDER_URL);
    assert.match(relationship.evidence.location,/Dkt\. (174|182) at (2|13)/);
  }
  assert.equal(JOHNSON_DUNN_RELATIONSHIPS.filter(item=>item.filingId==='jd-doc-174').length,4);
  assert.equal(JOHNSON_DUNN_RELATIONSHIPS.filter(item=>item.filingId==='jd-doc-182').length,1);
});

test('recorded incident never upgrades court-record evidence into invented direct-file text provenance',()=>{
  for(const filing of JOHNSON_DUNN_FILINGS){
    assert.equal(filing.sourceType,'COURT_ORDER_RECORD_OF_FILING');
    assert.equal(filing.evidenceSourceUrl,JOHNSON_DUNN_ORDER_URL);
    assert.ok(!('fullText' in filing));
  }
});
