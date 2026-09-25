import {test,expect} from '@playwright/test';

const mockTraceResponse={
  ok:true,sourceState:'LIVE',retrievedAt:'2026-09-25T08:00:00Z',
  authority:{caseName:'Test v. Case',citation:'410 U.S. 113'},
  documents:[{id:'live-1',title:'Public filing',docketId:'d1',docketNumber:'1:26-cv-1',caseName:'Example Docket',court:'D.D.C.',filingDate:'2026-01-02',sourceUrl:'https://www.courtlistener.com/docket/example/',classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:'410 U.S. 113',rule:'reporter-volume-first_page match'},contentHash:'abc',searchQuery:'"410 U.S. 113"'}],
  summary:{checkedCount:1,confirmedFilingCount:1,confirmedCitationCount:1,confirmedQuoteReuseCount:0,candidateUnconfirmedCount:0,possibleRelatedClaimCount:0,uniqueDockets:1,unknownDocketCount:0,courts:['D.D.C.'],earliestConfirmedFilingDate:'2026-01-02',latestConfirmedFilingDate:'2026-01-02'},
  coverage:{checked:1,bounded:false,language:'1 confirmed in 1 filing candidate checked'},
  diagnostics:{courtlistenerRequests:3,firecrawlRequests:0,cacheHits:0,documentsHydrated:0,searchPassesUsed:1}
};

test('landing remains the authored Johnson v. Dunn cockpit',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('Johnson v. Dunn',{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Trace impact/i})).toBeVisible();
  await expect(page.getByText('Disputed Dependencies',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('Incident Timeline',{exact:true})).toBeVisible();
  await expect(page.locator('.fc-summary')).toHaveCount(1);
  await expect(page.locator('.fc-insights')).toHaveCount(1);
});

test('recorded incident selection drives matrix and evidence before drawer disclosure',async({page})=>{
  await page.goto('/incident/demo');

  await page.getByRole('button',{name:/Select Wilson v\. Jackson/i}).click();
  await expect(page.getByText('Wilson v. Jackson',{exact:true}).first()).toBeVisible();
  await expect(page.getByLabel('Selected exact evidence')).toHaveCount(0);
  await expect(page.locator('.fc-dot.is-row-context')).toHaveCount(11);

  await page.getByRole('button',{name:/Trace impact/i}).click();
  await expect(page.getByRole('status')).toHaveText('05');

  const cell=page.getByRole('button',{name:/Wilson v\. Jackson.*Confirmed citation.*Document 174/i});
  await expect(cell).toBeVisible();
  await cell.click();

  const drawer=page.getByLabel('Selected exact evidence');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('INCIDENT SOURCE',{exact:true})).toBeVisible();
  await expect(drawer.getByText(/no such case/i)).toBeVisible();
  await expect(drawer.getByText(/Dkt\. 174 at 2/)).toBeVisible();
  await expect(drawer.getByRole('link',{name:/Court order/i})).toHaveAttribute('href',/storage\.courtlistener\.com/);
  await drawer.getByRole('button',{name:/^Provenance/}).click();
  await expect(drawer.getByText(/Incident evidence SHA-256/i)).toBeVisible();
});

test('recorded incident uses existing filter and ellipsis for secondary actions',async({page})=>{
  await page.goto('/incident/demo');

  await page.getByRole('button',{name:'Filter disputed dependencies'}).click();
  await page.getByRole('menuitem',{name:/Dkt\. 182/}).click();
  await expect(page.getByRole('button',{name:/Select Williams v\. Asplundh/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Select United States v\. Baker/})).toHaveCount(0);

  await page.getByRole('button',{name:'Incident options'}).click();
  await expect(page.getByRole('menuitem',{name:/Open source order/})).toHaveAttribute('href',/storage\.courtlistener\.com/);
  await expect(page.getByRole('menuitem',{name:/Export incident/})).toBeVisible();
});

test('legacy /demo points at the recorded incident cockpit',async({page})=>{
  await page.goto('/demo');
  await expect(page.getByText('Johnson v. Dunn',{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Trace impact/i})).toBeVisible();
});

test('quick trace has no empty KPI or result furniture before a run',async({page})=>{
  await page.route('**/api/trace',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mockTraceResponse)}));
  await page.goto('/trace?q=410%20U.S.%20113');

  await expect(page.getByRole('heading',{name:'Public filing trace'})).toBeVisible();
  await expect(page.getByText('#PUBLIC',{exact:true})).toHaveCount(0);
  await expect(page.locator('.fc-summary')).toHaveCount(0);
  await expect(page.locator('.fc-trace-insights')).toHaveCount(0);
  await expect(page.getByText(/CourtListener discovers candidates/)).toBeVisible();

  await page.getByRole('button',{name:/Trace real filings/i}).click();
  await expect(page.getByText('LIVE PUBLIC SOURCE').first()).toBeVisible();
  await expect(page.locator('.fc-summary')).toHaveCount(1);
  await expect(page.locator('.fc-trace-insights')).toBeVisible();
  await expect(page.getByText('1 confirmed in 1 filing candidate checked')).toBeVisible();
  await expect(page.getByText('Public filing').first()).toBeVisible();
});

test('new incident reveals analytics only after real trace output exists',async({page})=>{
  await page.route('**/api/incident/trace',async route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({
      ok:true,
      documents:[{id:'d1',title:'Motion',docketNumber:'1:26-cv-1'}],
      relationships:[{id:'r1',dependencyId:'dependency-1',filingId:'d1',state:'CONFIRMED_CITATION_DEPENDENCY'}],
      summary:{dependenciesTraced:1,confirmedAffectedFilings:1,confirmedRelationships:1,possibleRelationships:0,uniqueDockets:1},
      diagnostics:{courtlistenerRequests:2,firecrawlRequests:0,cacheHits:0}
    })
  }));

  await page.goto('/incident');
  await expect(page.getByRole('heading',{name:'New incident'})).toBeVisible();
  await expect(page.getByText('#OPEN',{exact:true})).toHaveCount(0);
  await expect(page.locator('.fc-summary')).toHaveCount(0);
  await expect(page.locator('.fc-entry-result-panel')).toHaveCount(0);

  await page.getByLabel('Dependency 1 text',{exact:true}).fill('410 U.S. 113');
  await page.getByRole('button',{name:/Trace impact/i}).click();

  await expect(page.locator('.fc-summary')).toHaveCount(1);
  await expect(page.locator('.fc-entry-result-panel')).toBeVisible();
  await expect(page.getByText('Resolved relationships')).toBeVisible();
});

test('corpus shows only import surface until local evidence exists',async({page})=>{
  await page.goto('/corpus');
  await expect(page.getByRole('heading',{name:'Local corpus'})).toBeVisible();
  await expect(page.getByText('#LOCAL',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:/Bring the work/i})).toBeVisible();
  await expect(page.locator('.fc-summary')).toHaveCount(0);
  await expect(page.locator('.fc-corpus-insights')).toHaveCount(0);

  const input=page.locator('input[type=file]');
  await input.setInputFiles({name:'brief.txt',mimeType:'text/plain',buffer:Buffer.from('The filing relies on Brown v. Board, 347 U.S. 483, 495. The same authority governs this issue.')});

  await expect(page.locator('.fc-summary')).toHaveCount(1);
  await expect(page.locator('.fc-corpus-insights')).toBeVisible();
  await expect(page.locator('.importSummary')).toContainText('1documents');
  await expect(page.locator('.importSummary')).toContainText('1authorities found');
  await page.getByRole('button',{name:/347 U\.S\. 483/i}).click();
  await expect(page.locator('.fc-state-chip')).toContainText('CONFIRMED DOCS 1');
  await expect(page.getByText('347 U.S. 483').first()).toBeVisible();
});

test('light theme keeps navigation and corpus surfaces coherent',async({page})=>{
  await page.goto('/corpus');
  await page.getByRole('button',{name:'Use light theme'}).click();
  await expect(page.locator('.fc-scene')).toHaveAttribute('data-theme','light');

  const dropzone=page.locator('.fc-dropzone');
  const colors=await dropzone.evaluate(el=>({
    background:getComputedStyle(el).backgroundColor,
    text:getComputedStyle(el).color
  }));
  expect(colors.background).not.toBe('rgb(17, 18, 18)');
  expect(colors.text).not.toBe('rgb(247, 247, 247)');

  const iconFilter=await page.getByRole('link',{name:'Local corpus'}).locator('img').evaluate(el=>getComputedStyle(el).filter);
  expect(iconFilter).not.toBe('none');
});

test('interface settings opens away from the lower-left investigation panels',async({page})=>{
  await page.goto('/incident/demo');
  await page.getByRole('button',{name:'Interface settings'}).click();
  const popover=page.getByRole('dialog',{name:'Interface settings'});
  await expect(popover).toBeVisible();
  const box=await popover.boundingBox();
  expect(box?.x??0).toBeGreaterThan(900);
});

test('recorded cockpit fits the 1326 by 652 demo viewport without hiding the investigation row',async({page})=>{
  await page.setViewportSize({width:1326,height:652});
  await page.goto('/incident/demo');

  const insights=page.locator('.fc-insights');
  await expect(insights).toBeVisible();
  const box=await insights.boundingBox();
  expect((box?.y??1000)).toBeLessThan(430);
  expect((box?.y??0)+(box?.height??1000)).toBeLessThanOrEqual(652);
});

test('shared shell keeps five primary product modes and functional controls',async({page})=>{
  await page.goto('/incident/demo');

  await expect(page.locator('.fc-primary-nav .fc-nav-item')).toHaveCount(5);
  await expect(page.locator('.fc-nav-item.is-active')).toHaveCount(1);
  await expect(page.getByRole('link',{name:'Recorded incident'}).first()).toHaveAttribute('aria-current','page');

  await page.getByRole('button',{name:'Incident status'}).click();
  await expect(page.getByRole('dialog',{name:'Workspace status'})).toBeVisible();
  await expect(page.getByText(/Confirmed relationships require source evidence/)).toBeVisible();

  await page.getByRole('button',{name:'Open RECALL workspace menu'}).click();
  await expect(page.getByRole('menu',{name:'RECALL workspace menu'})).toBeVisible();
  await expect(page.getByRole('menuitem',{name:'Quick trace'})).toHaveAttribute('href','/trace');

  await page.getByRole('button',{name:'Interface settings'}).click();
  await expect(page.getByRole('dialog',{name:'Interface settings'})).toBeVisible();
  await page.getByRole('button',{name:'Use light theme'}).click();
  await expect(page.locator('.fc-scene')).toHaveAttribute('data-theme','light');
  await page.getByRole('button',{name:'Use dark theme'}).click();
  await expect(page.locator('.fc-scene')).toHaveAttribute('data-theme','dark');
});
