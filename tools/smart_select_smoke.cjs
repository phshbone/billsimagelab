const { chromium } = require('/tmp/image-lab-smoke/node_modules/playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{ if(m.type()==='error') errors.push(m.text()); });

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.imageLabBuild==='6.9');
  await page.locator('#fileInput').setInputFiles('icon-512.png');
  await page.waitForFunction(()=>document.querySelector('#page').classList.contains('hasImage'));

  await page.evaluate(()=>document.querySelector('[data-action="smart-select"]').click());
  await page.waitForFunction(
    ()=>document.querySelector('#statusRight').textContent.includes('Smart Select ready'),
    null,
    {timeout:120000}
  );

  const box=await page.locator('#canvas').boundingBox();
  if(!box) throw new Error('Canvas not visible');
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2);

  await page.waitForFunction(
    ()=>document.querySelector('#page').classList.contains('hasSmartSelection'),
    null,
    {timeout:120000}
  );
  await page.waitForFunction(()=>{
    const b=document.querySelector('[data-action="smart-keep"]');
    return b&&!b.disabled;
  });

  await page.evaluate(()=>document.querySelector('[data-action="smart-keep"]').click());
  await page.waitForFunction(()=>!document.querySelector('#page').classList.contains('hasSmartSelection'));

  if(errors.length) throw new Error('Browser errors: '+errors.join(' | '));
  await browser.close();
  console.log('SMART SELECT SMOKE PASS');
})().catch(err=>{
  console.error(err);
  process.exit(1);
});
