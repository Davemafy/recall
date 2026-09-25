import {test,expect} from '@playwright/test';

const mockTraceResponse={
  ok:true,sourceState:'LIVE',retrievedAt:'2026-09-25T08:00:00Z',
  authority:{caseName:'Test v. Case',citation:'410 U.S. 113'},
  documents:[{id:'live-1',title:'Public filing',docketId:'d1',docketNumber:'1:26-cv-1',caseName:'Example Docket',court:'D.D.C.',filingDate:'2026-01-02',sourceUrl:'https://www.courtlistener.com/docket/example/',classification:'CONFIRMED_CITATION_DEPENDENCY',evidence:{raw:'410 U.S. 113',rule:'reporter-volume-first_page match'},contentHash:'abc',searchQuery:'"410 U.S. 113"'}],
  summary:{checkedCount:1,confirmedFilingCount:1,confirmedCitationCount:1,confirmedQuoteReuseCount:0,candidateUnconfirmedCount:0,possibleRelatedClaimCount:0,uniqueDockets:1,unknownDocketCount:0,courts:['D.D.C.'],earliestConfirmedFilingDate:'2026-01-02',latestConfirmedFilingDate:'2026-01-02'},
  coverage:{checked:1,bounded:false,language:'1 confirmed in 1 filing candidate checked'},
  diagnostics:{courtlistenerRequests:3,firecrawlRequests:0,cacheHits:0,documentsHydrated:0,searchPassesUsed:1}
};

test('landing is the incident cockpit from the Figma design',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('Johnson v. Dunn',{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Trace impact/i})).toBeVisible();
  await expect(page.getByText('Disputed Dependencies',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('Incident Timeline',{exact:true})).toBeVisible();
});

test('recorded incident flows from source to affected filing evidence',async({page})=>{
  await page.goto('/incident/demo');
  await expect(page.getByText('Johnson v. Dunn',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:/Trace impact/i}).click();
  await expect(page.getByRole('status')).toHaveText('5 confirmed relationships');
  await expect(page.getByRole('region',{name:/Dependency by filing matrix/i})).toBeVisible();

  const cell=page.getByRole('button',{name:/Wilson v\. Jackson.*Confirmed citation.*Document 174/i});
  await expect(cell).toBeVisible();
  await cell.click();

  await expect(page.getByText('INCIDENT SOURCE')).toBeVisible();
  await expect(page.locator('.recallXFindingText')).toContainText(/no such case/i);
  await expect(page.getByText(/Dkt\. 174 at 2/)).toBeVisible();
  await expect(page.getByRole('link',{name:/Court order/i})).toHaveAttribute('href',/storage\.courtlistener\.com/);
  await page.getByRole('button',{name:/Provenance/i}).click();
  await expect(page.getByText(/Incident evidence SHA-256/i)).toBeVisible();

  await page.getByRole('button',{name:'Close'}).count().catch(()=>0);
});

test('recorded incident dependency filter is functional',async({page})=>{
  await page.goto('/incident/demo');
  const filter=page.getByRole('combobox',{name:'Filter dependencies by filing'});
  await filter.selectOption('182');
  await expect(page.getByRole('button',{name:/Inspect Williams v\. Asplundh/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Inspect United States v\. Baker/})).toHaveCount(0);
  await filter.selectOption('174');
  await expect(page.getByRole('button',{name:/Inspect United States v\. Baker/})).toBeVisible();
});

test('legacy /demo points at the recorded incident cockpit',async({page})=>{
  await page.goto('/demo');
  await expect(page.getByText('Johnson v. Dunn',{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Trace impact/i})).toBeVisible();
});

test('live quick trace renders public result and records browser-local activity',async({page})=>{
  await page.route('**/api/trace',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mockTraceResponse)}));
  await page.goto('/trace?q=410%20U.S.%20113');
  await page.getByRole('button',{name:/Trace real filings/i}).click();
  await expect(page.getByText('LIVE PUBLIC SOURCE').first()).toBeVisible();
  await expect(page.getByText('1 confirmed in 1 filing candidate checked')).toBeVisible();
  await expect(page.getByText('Public filing').first()).toBeVisible();

  await page.goto('/activity');
  await expect(page.getByText('Test v. Case',{exact:true})).toBeVisible();
  await expect(page.getByText('410 U.S. 113',{exact:true})).toBeVisible();
});

test('corpus mode ingests local text and opens an incident with the shared engine',async({page})=>{
  await page.goto('/corpus');
  await expect(page.getByRole('heading',{name:/Bring the work/i})).toBeVisible();
  const input=page.locator('input[type=file]');
  await input.setInputFiles({name:'brief.txt',mimeType:'text/plain',buffer:Buffer.from('The filing relies on Brown v. Board, 347 U.S. 483, 495. The same authority governs this issue.')});
  await expect(page.locator('.importSummary')).toContainText('1documents');
  await expect(page.locator('.importSummary')).toContainText('1authorities found');
  await page.getByRole('button',{name:/347 U\.S\. 483/i}).click();
  await expect(page.locator('.fc-state-chip')).toContainText('CONFIRMED DOCS 1');
  await expect(page.getByText('347 U.S. 483').first()).toBeVisible();
});

test('incident registry supports search and real route depth',async({page})=>{
  await page.goto('/incidents');
  await expect(page.getByText('Johnson v. Dunn',{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('link',{name:'New incident'})).toHaveAttribute('href','/incident');
  const search=page.getByPlaceholder('Search case, citation, docket…');
  await search.fill('Johnson');
  await expect(page.getByText('Johnson v. Dunn',{exact:true}).first()).toBeVisible();
  await search.fill('definitely-no-match');
  await expect(page.getByText('No investigations match this view.')).toBeVisible();
});

test('evidence ledger filters exact recorded relationships',async({page})=>{
  await page.goto('/evidence');
  await expect(page.locator('.fc-table-row')).toHaveCount(5);
  await page.getByRole('combobox',{name:'Filter by filing'}).selectOption('182');
  await expect(page.locator('.fc-table-row')).toHaveCount(1);
  await expect(page.getByText('Williams v. Asplundh Tree Expert Co.',{exact:true})).toBeVisible();
  await expect(page.getByText('United States v. Baker',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Export CSV'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Export JSON'})).toBeVisible();
});

test('workspace settings persist default trace breadth into Quick Trace',async({page})=>{
  await page.goto('/settings');
  await page.getByRole('combobox',{name:'Default trace candidate limit'}).selectOption('50');
  await page.getByRole('button',{name:'Save changes'}).first().click();

  let submitted:any=null;
  await page.route('**/api/trace',async route=>{
    submitted=route.request().postDataJSON();
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mockTraceResponse)});
  });
  await page.goto('/trace?q=410%20U.S.%20113');
  await page.getByRole('button',{name:/Trace real filings/i}).click();
  await expect(page.getByText('LIVE PUBLIC SOURCE').first()).toBeVisible();
  expect(submitted?.maxCandidates).toBe(50);
});

test('shared shell navigation is thin sticky and visible controls are functional',async({page})=>{
  await page.goto('/incident/demo');

  await expect(page.locator('.fc-nav-item.is-active')).toHaveCount(1);
  await expect(page.getByRole('link',{name:'Incidents'})).toHaveAttribute('aria-current','page');
  const sidebar=page.locator('.fc-sidebar');
  const styles=await sidebar.evaluate(el=>({width:parseFloat(getComputedStyle(el).width),position:getComputedStyle(el).position}));
  expect(styles.width).toBeLessThanOrEqual(68);
  expect(styles.position).toBe('sticky');

  await page.getByRole('button',{name:'Incident status'}).click();
  await expect(page.getByRole('dialog',{name:'Workspace status'})).toBeVisible();
  await expect(page.getByText(/Confirmed relationships require source evidence/)).toBeVisible();

  await page.getByRole('button',{name:'Open RECALL workspace menu'}).click();
  await expect(page.getByRole('menu',{name:'RECALL workspace menu'})).toBeVisible();
  await expect(page.getByRole('menuitem',{name:'Evidence ledger'})).toHaveAttribute('href','/evidence');

  await page.getByRole('button',{name:'Quick settings'}).click();
  await expect(page.getByRole('dialog',{name:'Interface settings'})).toBeVisible();

  await page.getByRole('button',{name:'Use light theme'}).click();
  await expect(page.locator('.fc-scene')).toHaveAttribute('data-theme','light');
  await page.getByRole('button',{name:'Use dark theme'}).click();
  await expect(page.locator('.fc-scene')).toHaveAttribute('data-theme','dark');
});

test('unknown routes render the RECALL not-found state',async({page})=>{
  await page.goto('/not-a-recall-route');
  await expect(page.getByRole('heading',{name:'Workspace not found.'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Incidents'})).toHaveAttribute('href','/incidents');
});
