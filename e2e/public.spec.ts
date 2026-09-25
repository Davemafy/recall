import {test,expect} from '@playwright/test';

test('landing exposes real trace, recorded trace and corpus modes',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('One hallucination.')).toBeVisible();
  await expect(page.getByRole('button',{name:/TRACE REAL FILINGS/i})).toBeVisible();
  await expect(page.getByRole('link',{name:/Import my corpus/i})).toBeVisible();
  await expect(page.getByRole('link',{name:/recorded public demo/i})).toBeVisible();
});

test('recorded public demo exposes real source evidence',async({page})=>{
  await page.goto('/demo');
  await expect(page.getByText('RECORDED PUBLIC TRACE').first()).toBeVisible();
  await expect(page.getByText(/Andy Warhol Foundation/).first()).toBeVisible();
  await expect(page.getByText('3',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:/Memorandum Opinion/i}).first().click();
  await expect(page.getByText('PUBLIC FILING EVIDENCE')).toBeVisible();
  await expect(page.getByRole('link',{name:/Open public source/i})).toHaveAttribute('href',/storage\.courtlistener\.com/);
});

test('live trace renders mocked CourtListener result without fixture fallback',async({page})=>{
  await page.route('**/api/trace',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ok:true,sourceState:'LIVE',retrievedAt:'2026-09-25T08:00:00Z',
    authority:{caseName:'Test v. Case',citation:'410 U.S. 113'},
    documents:[{id:'live-1',title:'Public filing',docketId:'d1',docketNumber:'1:26-cv-1',caseName:'Example Docket',court:'D.D.C.',filingDate:'2026-01-02',sourceUrl:'https://www.courtlistener.com/docket/example/',classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:'410 U.S. 113',rule:'reporter-volume-first_page match'},contentHash:'abc',searchQuery:'"410 U.S. 113"'}],
    summary:{checkedCount:1,confirmedFilingCount:1,confirmedCitationCount:1,confirmedQuoteReuseCount:0,candidateUnconfirmedCount:0,possibleRelatedClaimCount:0,uniqueDockets:1,courts:['D.D.C.'],earliestConfirmedFilingDate:'2026-01-02',latestConfirmedFilingDate:'2026-01-02'},
    coverage:{checked:1,bounded:false,language:'1 confirmed in 1 filing candidate checked'}
  })}));
  await page.goto('/trace?q=410%20U.S.%20113');
  await page.getByRole('button',{name:/Trace real filings/i}).click();
  await expect(page.getByText('LIVE PUBLIC SOURCE').first()).toBeVisible();
  await expect(page.getByText('1 confirmed in 1 filing candidate checked')).toBeVisible();
  await expect(page.getByText('Public filing').first()).toBeVisible();
});

test('corpus mode ingests local text and opens an incident with the shared engine',async({page})=>{
  await page.goto('/corpus');
  await expect(page.getByText('Bring the work.')).toBeVisible();
  const input=page.locator('input[type=file]');
  await input.setInputFiles({name:'brief.txt',mimeType:'text/plain',buffer:Buffer.from('The filing relies on Brown v. Board, 347 U.S. 483, 495. The same authority governs this issue.')});
  await expect(page.getByText(/1 documents/i)).toBeVisible();
  await expect(page.getByText(/1 authorities found/i)).toBeVisible();
  await page.getByRole('button',{name:/347 U\.S\. 483/i}).click();
  await expect(page.getByText(/CONFIRMED DOCS/i)).toBeVisible();
  await expect(page.getByText('347 U.S. 483').first()).toBeVisible();
});
