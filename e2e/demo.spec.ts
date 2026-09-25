import {test,expect} from '@playwright/test';

test('demo aliases render the same Figma dashboard',async({page})=>{
  for(const path of ['/demo','/incident/demo']){
    await page.goto(path);
    await expect(page.getByRole('main',{name:'RECALL dashboard'})).toBeVisible();
    await expect(page.getByText('#JD–01701',{exact:true})).toBeVisible();
  }
});
