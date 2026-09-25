import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const shots=[
  {name:'1690x1096',width:1690,height:1096},
  {name:'1440x900',width:1440,height:900},
  {name:'1280x800',width:1280,height:800},
  {name:'390x844',width:390,height:844}
];

test('capture visual QA states',async({page})=>{
  await fs.mkdir('test-results/visual',{recursive:true});

  for(const shot of shots){
    await page.setViewportSize({width:shot.width,height:shot.height});
    await page.goto('/');
    await expect(page.getByRole('main',{name:'RECALL dashboard'})).toBeVisible();
    await page.screenshot({path:`test-results/visual/root-${shot.name}.png`,fullPage:true});
  }

  await page.setViewportSize({width:1690,height:1096});
  await page.goto('/');
  await page.getByRole('button',{name:'Trace impact'}).click();
  await page.screenshot({path:'test-results/visual/root-traced-1690x1096.png',fullPage:true});

  await page.getByText('Wilson v. Jackson',{exact:true}).click();
  await page.screenshot({path:'test-results/visual/root-selected-wilson-1690x1096.png',fullPage:true});
});
