import {writeFile, mkdir} from 'node:fs/promises';
import {classifySnippet,analyzeCorpus} from '../lib/recall-core.mjs';
import {createDemoCorpus} from '../lib/demo-corpus.mjs';

const q='“the procedural guarantee attaches before the agency imposes a material deprivation.”';
const cases=[];
const add=(name,expected,text)=>cases.push({name,expected,text});
for(let i=0;i<8;i++) add(`exact-cite-${i}`,'CONFIRMED_CITATION_DEPENDENCY',`Argument ${i}. Martinez v. State, 999 F.4th 123${i%2?', 130':''}.`);
for(let i=0;i<6;i++) add(`quote-${i}`,'CONFIRMED_QUOTE_REUSE',`${q} This proposition controls the timing question ${i}.`);
for(let i=0;i<6;i++) add(`possible-${i}`,'POSSIBLE_DERIVED_CLAIM',`A procedural guarantee should apply before an agency imposes a material deprivation in this setting ${i}.`);
const negatives=[
 'Martinez family trust beneficiaries requested an accounting.',
 'Martinez v. State was mentioned at a meeting without any reporter citation.',
 'Do not rely on Martinez v. State, 999 F.4th 123. The citation is invalid.',
 'The procedural guarantee attaches before the agency imposes a material deprivation. See West v. Agency, 410 U.S. 113.',
 'Contract damages must be foreseeable and reasonably certain.',
 'Discovery is proportional to the needs of the case.',
 'A fee petition requires contemporaneous billing records.',
 'Subject-matter jurisdiction cannot be conferred by consent.',
 'The hearing is continued until October.',
 'The Martinez family owns a small business.',
 'Smith v. Jones, 999 F.3d 123 addresses a different rule.',
 'Martinez v. State, 999 F.3d 123 uses a different reporter.',
 'A procedural safeguard can matter before action, but this note cites no authority and discusses a different statutory context.',
 'The agency provided a post-deprivation hearing under a separate statute.',
 'No legal authority appears in this document.'
];
for(let i=0;i<30;i++) add(`negative-${i}`,'NOT_RELATED',negatives[i%negatives.length]+` Control ${i}.`);
let correct=0,falseConfirmed=0;
const byType={};
for(const c of cases){
 const actual=classifySnippet(c.text).type;
 if(actual===c.expected) correct++;
 if(c.expected==='NOT_RELATED'&&actual.startsWith('CONFIRMED_')) falseConfirmed++;
 (byType[c.expected]??={n:0,ok:0}); byType[c.expected].n++; if(actual===c.expected)byType[c.expected].ok++;
}
const corpus=createDemoCorpus(), analysis=analyzeCorpus(corpus);
const expectedAffected=new Set(['d01','d02','d03','d04','d05','d06','d07','d08','d09','d10','d11','d12','d13','d14','d15','d16','d17']);
const found=new Set(analysis.affectedDocuments.map(d=>d.id));
let tp=0; for(const id of found) if(expectedAffected.has(id)) tp++;
const precision=found.size?tp/found.size:1, recall=expectedAffected.size?tp/expectedAffected.size:1;
const lines=[
 '# RECALL benchmark results','',`Generated: ${new Date().toISOString()}`,'',
 `- Relationship cases: ${cases.length}`,
 `- Exact classification accuracy: ${(correct/cases.length*100).toFixed(1)}% (${correct}/${cases.length})`,
 `- False confirmed dependencies on negative controls: ${falseConfirmed}`,
 ...Object.entries(byType).map(([k,v])=>`- ${k}: ${(v.ok/v.n*100).toFixed(1)}% (${v.ok}/${v.n})`),
 '', '## Corpus-level blast radius','',
 `- Corpus documents: ${corpus.length}`,
 `- Found affected documents: ${found.size}`,
 `- Expected affected documents: ${expectedAffected.size}`,
 `- Document blast-radius precision: ${(precision*100).toFixed(1)}%`,
 `- Document blast-radius recall: ${(recall*100).toFixed(1)}%`,
 `- Confirmed citation edges: ${analysis.summary.confirmedCitationDependencies}`,
 `- Confirmed quote reuse edges: ${analysis.summary.confirmedQuoteReuse}`,
 `- Possible derived claims: ${analysis.summary.possibleDerivedClaims}`,
 '', 'Possible semantic relationships are never counted as confirmed lineage.'
];
await mkdir(new URL('.',import.meta.url),{recursive:true});
await writeFile(new URL('./results.md',import.meta.url),lines.join('\n'));
console.log(lines.join('\n'));
if(falseConfirmed>0) process.exitCode=1;
