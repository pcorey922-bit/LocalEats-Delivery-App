// Optional browser QA: set ROCOEATS_PLAYWRIGHT_MODULE to an installed playwright module.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const directory=process.argv[2];
if(!directory||!path.isAbsolute(directory))throw new Error('Pass the absolute built fixture directory');
const {chromium}=await import(process.env.ROCOEATS_PLAYWRIGHT_MODULE||'playwright');
const server=createServer(async(req,res)=>{
  const file=req.url==='/'?'index.html':req.url==='/operations-browser.js'?'operations-browser.js':null;
  if(!file){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');
  res.end(await readFile(path.join(directory,file)));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ROCOEATS_CHROMIUM_PATH||'/usr/bin/chromium'});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const inventory=page.getByRole('region',{name:'Menu inventory'});
  await inventory.getByRole('heading',{name:'Fixture stock item'}).waitFor();
  assert.equal(await inventory.getByRole('button',{name:'Save stock',exact:true}).isDisabled(),true);
  await inventory.getByLabel('Set available units').fill('0');
  await inventory.getByLabel('Adjustment reason').fill('Counted available stock');
  await inventory.getByRole('button',{name:'Save stock',exact:true}).click();
  await inventory.getByText('Stock updated.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.operationsFixture.item.stockOnHand),0);
  // A concurrent reservation must not silently replace the form's observed revision.
  await page.evaluate(()=>{window.operationsFixture.item.revision++;window.operationsFixture.item.stockOnHand=2;});
  await inventory.getByLabel('Set available units').fill('10');
  await inventory.getByLabel('Adjustment reason').fill('Stale operator attempt');
  await inventory.getByRole('button',{name:'Save stock',exact:true}).click();
  await inventory.getByRole('alert').filter({hasText:'Inventory changed'}).waitFor();
  await inventory.getByText('Stock changed since this form was loaded.',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>window.operationsFixture.item.stockOnHand),2);
  await inventory.getByRole('button',{name:'Refresh stock values'}).click();
  assert.equal(await inventory.getByLabel('Set available units').inputValue(),'2');
  const select=page.getByRole('combobox',{name:'Driver for order fixture-order'});
  assert.deepEqual(await select.locator('option').allTextContents(),['Unassigned','Eligible driver · available']);
  await select.selectOption('eligible');
  const assignmentForm=select.locator('xpath=ancestor::form');
  await assignmentForm.getByLabel('Reason for dispatch change').fill('Assign the eligible driver');
  await assignmentForm.getByRole('button',{name:'Assign driver',exact:true}).click();
  await assignmentForm.getByText('Assignment updated.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.operationsFixture.order.driverProfileId),'eligible');
  await page.evaluate(()=>{window.operationsFixture.order.assignedAt='2030-01-01T00:00:00.000Z';});
  await select.selectOption('');
  await assignmentForm.getByLabel('Reason for dispatch change').fill('Stale dispatch release');
  await assignmentForm.getByRole('button',{name:'Release assignment',exact:true}).click();
  await assignmentForm.getByRole('alert').filter({hasText:'Assignment changed'}).waitFor();
  assert.equal(await page.evaluate(()=>window.operationsFixture.order.driverProfileId),'eligible');
  await assignmentForm.getByRole('button',{name:'Refresh assignment values'}).click();
  await select.selectOption('');
  await assignmentForm.getByLabel('Reason for dispatch change').fill('Release with fresh observed state');
  await assignmentForm.getByRole('button',{name:'Release assignment',exact:true}).click();
  await assignmentForm.getByText('Assignment updated.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.operationsFixture.order.driverProfileId),null);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',viewport:'390x844',checks:['stock save','stock conflict retained','explicit stock refresh','driver eligibility choices','assignment','stale release rejected','fresh release','no horizontal overflow','no application errors'],limitations:'Simulated API/accounts; no Clerk, Stripe, Maps SDK, push or physical devices'}));
}finally{
  await browser?.close();await new Promise(resolve=>server.close(resolve));
}
