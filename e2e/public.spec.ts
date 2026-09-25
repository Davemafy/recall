import {test,expect} from '@playwright/test';

test('landing makes incident response primary and keeps quick trace and corpus secondary',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('One hallucination.')).toBeVisible();
  await expect(page.getByRole('link',{name:/Open incident/i})).toBeVisible();
  await expect(page.getByRole('link',{name:/Trace authority/i})).toBeVisible();
  await expect(page.getByRole('link',{name:/Import corpus/i})).toBeVisible();
  await expect(page.getByRole('link',{name:/Johnson v\. Dunn/i})).toBeVisible();
});

test('recorded incident flows from court source to dependency matrix to exact evidence',async({page})=>{
  await page.goto('/incident/demo');
  await expect(page.getByText('RECORDED PUBLIC INCIDENT',{exact:false}).first()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Johnson v. Dunn'})).toBeVisible();
  await expect(page.getByText(/five problematic citations across two motions/i)).toBeVisible();
  await expect(page.getByText('Wilson v. Jackson, 2006 WL 8438651, at *2 (N.D. Ala. Feb. 27, 2006)',{exact:false})).toBeVisible();

  await page.getByRole('button',{name:/Trace impact/i}).click();
  await expect(page.getByText(/5 confirmed relationships/i)).toBeVisible();
  await expect(page.getByRole('region',{name:/Dependency by filing matrix/i})).toBeVisible();

  const cell=page.getByRole('button',{name:/Wilson v\. Jackson.*Confirmed citation.*Document 174/i});
  await expect(cell).toBeVisible();
  await cell.click();

  await expect(page.getByText('INCIDENT SOURCE')).toBeVisible();
  await expect(page.getByText(/no such case/i)).toBeVisible();
  await expect(page.getByText(/Dkt\. 174 at 2/)).toBeVisible();
  await expect(page.getByRole('link',{name:/Open court order/i})).toHaveAttribute('href',/storage\.courtlistener\.com/);
  await page.getByRole('button',{name:/View provenance/i}).click();
  await expect(page.getByText(/Incident evidence SHA-256/i)).toBeVisible();
});

test('legacy /demo points at the recorded incident experience',async({page})=>{
  await page.goto('/demo');
  await expect(page.getByRole('heading',{name:'Johnson v. Dunn'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Trace impact/i})).toBeVisible();
});

test('live quick trace renders mocked CourtListener result without fixture fallback',async({page})=>{
  await page.route('**/api/trace',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ok:true,sourceState:'LIVE',retrievedAt:'2026-09-25T08:00:00Z',
    authority:{caseName:'Test v. Case',citation:'410 U.S. 113'},
    documents:[{id:'live-1',title:'Public filing',docketId:'d1',docketNumber:'1:26-cv-1',caseName:'Example Docket',court:'D.D.C.',filingDate:'2026-01-02',sourceUrl:'https://www.courtlistener.com/docket/example/',classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:'410 U.S. 113',rule:'reporter-volume-first_page match'},contentHash:'abc',searchQuery:'"410 U.S. 113"'}],
    summary:{checkedCount:1,confirmedFilingCount:1,confirmedCitationCount:1,confirmedQuoteReuseCount:0,candidateUnconfirmedCount:0,possibleRelatedClaimCount:0,uniqueDockets:1,unknownDocketCount:0,courts:['D.D.C.'],earliestConfirmedFilingDate:'2026-01-02',latestConfirmedFilingDate:'2026-01-02'},
    coverage:{checked:1,bounded:false,language:'1 confirmed in 1 filing candidate checked'},
    diagnostics:{courtlistenerRequests:3,firecrawlRequests:0,cacheHits:0,documentsHydrated:0,searchPassesUsed:1}
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
  await expect(page.locator('.importSummary')).toContainText('1documents');
  await expect(page.locator('.importSummary')).toContainText('1authorities found');
  await page.getByRole('button',{name:/347 U\.S\. 483/i}).click();
  await expect(page.getByText(/CONFIRMED DOCS/i)).toBeVisible();
  await expect(page.getByText('347 U.S. 483').first()).toBeVisible();
});
