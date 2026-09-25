import {test,expect} from '@playwright/test';
test('recorded demo is deterministic and source-backed',async({page})=>{
  await page.goto('/demo');
  await expect(page.getByText('Johnson v. Dunn',{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/Disputed Dependencies/i).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Trace impact/i})).toBeVisible();
});
