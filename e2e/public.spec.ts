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
  await expect(page.getByRole('heading',{name:'Disputed Dependencies'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Affected Filings'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Evidence Trace'})).toBeVisible();

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


test('major dashboard regions match authored Figma coordinates at design size',async({page})=>{
  await page.setViewportSize({width:1690,height:1096});
  await page.goto('/');

  const read=async(selector:string)=>{
    const box=await page.locator(selector).boundingBox();
    if(!box) throw new Error('Missing '+selector);
    return {
      x:Math.round(box.x*100)/100,
      y:Math.round(box.y*100)/100,
      width:Math.round(box.width*100)/100,
      height:Math.round(box.height*100)/100
    };
  };

  expect(await read('.figmaSidebar')).toEqual({x:0,y:0,width:106,height:1096});
  expect(await read('.figmaContent')).toEqual({x:106,y:0,width:1584,height:1096});
  expect(await read('.figmaHeader')).toEqual({x:126,y:22,width:1544,height:136});
  expect(await read('.figmaSummary')).toEqual({x:126,y:176,width:1544,height:145});
  expect(await read('.figmaTimeline')).toEqual({x:126,y:339,width:1544,height:373});
  expect(await read('.figmaInsights')).toEqual({x:126,y:730,width:1544,height:340});

  const panels=page.locator('.figmaPanel');
  const first=await panels.nth(0).boundingBox();
  const second=await panels.nth(1).boundingBox();
  const third=await panels.nth(2).boundingBox();
  expect(Math.abs((first?.width||0)-518.6666)).toBeLessThan(.1);
  expect(Math.abs((second?.width||0)-514.6667)).toBeLessThan(.1);
  expect(Math.abs((third?.width||0)-478.6667)).toBeLessThan(.1);

  const shellShadow=await page.locator('.figmaDashboard').evaluate(el=>getComputedStyle(el).boxShadow);
  expect(shellShadow).not.toContain('255, 61, 31');
});


test('selected dependency changes the evidence filing state without changing the composition',async({page})=>{
  await page.setViewportSize({width:1690,height:1096});
  await page.goto('/');
  await page.getByRole('button',{name:'Trace impact'}).click();

  await expect(page.locator('.figmaChange.c2')).toHaveText('D174');
  await page.getByText('Williams v. Asplundh Tree Expert Co.',{exact:true}).click();
  await expect(page.locator('.figmaChange.c2')).toHaveText('D182');
  await expect(page.locator('.figmaBubble.hot.selected')).toHaveCount(1);

  await page.getByText('United States v. Baker',{exact:true}).click();
  await expect(page.locator('.figmaChange.c2')).toHaveText('D174');
  await expect(page.locator('.figmaBubble.hot.selected')).toHaveCount(1);
});

test('authored control geometry matches Figma at design size',async({page})=>{
  await page.setViewportSize({width:1690,height:1096});
  await page.goto('/');

  await expect(page.locator('.figmaBrand')).toHaveCSS('width','46px');
  await expect(page.locator('.figmaBrand')).toHaveCSS('height','46px');
  await expect(page.locator('.figmaNavItem').first()).toHaveCSS('width','46px');
  await expect(page.locator('.figmaNavItem').first()).toHaveCSS('height','46px');
  await expect(page.locator('.figmaQuickActions')).toHaveCSS('width','108px');
  await expect(page.locator('.figmaQuickActions')).toHaveCSS('height','56px');
  await expect(page.locator('.figmaProfile')).toHaveCSS('width','204px');
  await expect(page.locator('.figmaProfile')).toHaveCSS('height','56px');
  await expect(page.locator('.figmaDownload')).toHaveCSS('width','112px');
  await expect(page.locator('.figmaDownload')).toHaveCSS('height','48px');
  await expect(page.locator('.figmaTheme button.active img')).toHaveCSS('width','19px');
  await expect(page.locator('.figmaTheme button.active img')).toHaveCSS('height','19px');
});
