import {test,expect} from '@playwright/test';
test('recorded demo is deterministic and source-backed',async({page})=>{
  await page.goto('/demo');
  await expect(page.getByText('RECORDED PUBLIC TRACE').first()).toBeVisible();
  await expect(page.getByText(/3 confirmed in 3 recorded public filings checked/i)).toBeVisible();
});
