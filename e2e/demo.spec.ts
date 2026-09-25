import {test,expect} from '@playwright/test';
test('recorded demo is deterministic and source-backed',async({page})=>{
  await page.goto('/demo');
  await expect(page.getByText('RECORDED PUBLIC INCIDENT',{exact:false}).first()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Johnson v. Dunn'})).toBeVisible();
  await expect(page.getByText(/five problematic citations across two motions/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/Trace impact/i})).toBeVisible();
});
