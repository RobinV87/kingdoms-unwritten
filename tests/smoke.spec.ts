import {test,expect} from '@playwright/test';
test('create, advance, save and reload a world',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'+30d'}).click();await expect(page.getByRole('banner').getByText(/Day 31/)).toBeVisible();await page.getByRole('button',{name:'WORLDS'}).click();await page.getByRole('button',{name:'Save current'}).click();await expect(page.getByText('Saved locally')).toBeVisible();await page.reload();await page.getByRole('button',{name:'WORLDS'}).click();await page.getByRole('button',{name:/^My chronicle/}).click();await expect(page.getByRole('banner').getByText(/Day 31/)).toBeVisible()});

test('govern a town and review a Crown tax collection', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name:/Kingdom of/})).toBeVisible();
  await page.getByRole('button', {name:'Treasury', exact:true}).click();
  await page.getByRole('button', {name:'Collect from town'}).click();
  await expect(page.getByText('50 gold', {exact:true}).first()).toBeVisible();
  await page.getByLabel('Crown share of town taxes').selectOption('25');
  await page.getByRole('button',{name:'+30d'}).click();
  await page.getByRole('button',{name:'Reports',exact:true}).click();
  await expect(page.getByText('Year 1 · Month 1')).toBeVisible();
  await page.getByRole('button',{name:'Realm',exact:true}).click();
  await page.locator('.council').getByRole('button',{name:/Alderwick/}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Close town overview'}).click();
  await page.getByRole('button',{name:'COUNCIL',exact:true}).click();
  await expect(page.getByRole('heading',{name:/Kingdom of/})).toBeVisible();
});

test('normal play advances one day in three seconds and stops for council', async ({page}) => {
  await page.goto('/');
  const date = page.getByRole('banner').locator('.date strong');
  const started = Date.now();
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await expect(date).toContainText('Day 2', {timeout:8000});
  expect(Date.now() - started).toBeGreaterThanOrEqual(2900);
  await page.getByRole('button',{name:'10×',exact:true}).click();
  await expect(page.getByRole('button',{name:/Monthly report ready/})).toBeVisible({timeout:20000});
  await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Monthly report ready/}).click();
  await expect(page.getByText('Year 1 · Month 1')).toBeVisible();
});

import {grainCrisis} from './grain-fixture';
test('hear a grain petition, dispatch relief and commission a granary', async ({page})=>{
  const {world}=grainCrisis();
  await page.goto('/');
  await page.getByRole('button',{name:'WORLDS'}).click();
  await page.locator('input[type=file]').evaluate((input: HTMLInputElement, save) => {
    const files = new DataTransfer();
    files.items.add(new File([save],'winter.json',{type:'application/json'}));
    input.files = files.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  },JSON.stringify({name:'Winter',world}));
  await page.getByRole('button',{name:/Hear grain petitions/}).click();
  await page.getByLabel('Supply town').selectOption('s1');
  await page.getByLabel('Reduce rations during transit').check();
  await page.getByRole('button',{name:/Buy shipment/}).click();
  await expect(page.getByText(/500 grain due in 4 days/)).toBeVisible();
  await page.getByRole('button',{name:'Realm',exact:true}).click();
  await page.locator('.council').getByRole('button',{name:/Dunmere/}).click();
  await page.getByRole('button',{name:'Commission granary'}).click();
  await expect(page.getByText('Under construction · 30 days remaining')).toBeVisible();
  await page.getByRole('button',{name:'Close town overview'}).click();
  await page.getByRole('button',{name:'+30d'}).click();
  await page.getByRole('button',{name:'COUNCIL',exact:true}).click();
  await page.getByRole('button',{name:'Reports',exact:true}).click();
  await expect(page.locator('.council').getByText(/Alderwick: grain arrived/)).toBeVisible();
});
