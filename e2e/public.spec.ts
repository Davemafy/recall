import {test,expect} from '@playwright/test';

test('root is the literal Figma dashboard without the outer scene backdrop',async({page})=>{
  await page.setViewportSize({width:1690,height:1096});
  await page.goto('/');

  const dashboard=page.getByRole('main',{name:'RECALL dashboard'});
  await expect(dashboard).toBeVisible();

  const box=await dashboard.boundingBox();
  expect(Math.round(box?.width||0)).toBe(1690);
  expect(Math.round(box?.height||0)).toBe(1096);

  await expect(page.getByText('Johnson v. Dunn',{exact:true})).toBeVisible();
  await expect(page.getByText('Incident,',{exact:true})).toBeVisible();
  await expect(page.getByText('#JD–01701',{exact:true})).toBeVisible();
  await expect(page.getByText('Incident Timeline',{exact:true})).toBeVisible();
  await expect(page.getByText('Disputed Dependencies',{exact:true})).toBeVisible();
  await expect(page.getByText('Affected Filings',{exact:true})).toBeVisible();
  await expect(page.getByText('Evidence Trace',{exact:true})).toBeVisible();

  await expect(page.locator('.figmaSummaryCard')).toHaveCount(4);
  await expect(page.locator('.figmaPanel')).toHaveCount(3);
  await expect(page.locator('.figmaSidebar')).toHaveCSS('width','106px');
  await expect(page.locator('.figmaTimeline')).toHaveCSS('height','373px');
  await expect(page.locator('.figmaInsights')).toHaveCSS('height','340px');

  await expect(page.locator('.figmaPage')).toHaveCSS('background-color','rgb(10, 11, 11)');
  await expect(page.locator('.figmaPage')).not.toHaveCSS('background-color','rgb(23, 23, 23)');
});

test('trace impact updates the recorded incident inside the same authored composition',async({page})=>{
  await page.setViewportSize({width:1690,height:1096});
  await page.goto('/');
  await expect(page.getByText('Affected Filings',{exact:true}).locator('..').getByText('—')).toBeVisible();
  await page.getByRole('button',{name:'Trace impact'}).click();
  await expect(page.getByRole('button',{name:'Traced'})).toBeVisible();
  await expect(page.getByText('2 affected motions · 1 docket',{exact:true})).toBeVisible();
  await expect(page.locator('.figmaBubble.hot')).toHaveCount(5);
  await expect(page.getByText('5/5',{exact:true})).toBeVisible();
});

test('dependency filtering stays inside the authored lower-left panel',async({page})=>{
  await page.goto('/');
  const filter=page.getByRole('combobox',{name:'Filter disputed dependencies'});
  await filter.selectOption('182');
  await expect(page.getByText('Williams v. Asplundh Tree Expert Co.',{exact:true})).toBeVisible();
  await expect(page.getByText('United States v. Baker',{exact:true})).toHaveCount(0);
  await filter.selectOption('174');
  await expect(page.getByText('United States v. Baker',{exact:true})).toBeVisible();
});

test('dashboard scales proportionally to browser width without a separate scene',async({page})=>{
  await page.setViewportSize({width:1366,height:768});
  await page.goto('/');
  const dashboard=page.getByRole('main',{name:'RECALL dashboard'});
  const box=await dashboard.boundingBox();
  expect(Math.round(box?.width||0)).toBe(1366);
  expect(Math.round((box?.height||0))).toBeGreaterThan(880);
  await expect(page.locator('.figmaSidebar')).toBeVisible();
  await expect(page.locator('.figmaInsights')).toBeVisible();
});
