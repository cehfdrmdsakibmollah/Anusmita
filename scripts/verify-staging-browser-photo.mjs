/**
 * Hosted browser acceptance for the free ANUSMITA catalogue-photo matcher.
 * This intentionally does not assert universal Google Lens accuracy.
 */
import {chromium} from 'playwright';
const base=process.env.ANUSMITA_STAGING_URL||'https://anusmita-store-staging.mdsakibmolla545.workers.dev';
if(!/^https:\/\/anusmita-store-staging\./.test(base))throw Error('Refusing to test a production hostname');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
try{
 const image=await fetch(base+'/catalogue/skincare/k30.png',{signal:AbortSignal.timeout(16000)});
 if(!image.ok)throw new Error('Could not fetch public catalogue photo: '+image.status);
 const buffer=Buffer.from(await image.arrayBuffer());
 await page.goto(base+'/contact/design-preview',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('input[type=file]').setInputFiles({name:'medicube-reference.png',mimeType:'image/png',buffer});
 await page.getByRole('button',{name:/Send message|মেসেজ পাঠান/}).click();
 const result=page.locator('.aa-visual-match').filter({hasText:/Medicube Fresh That Lasts/i});
 await result.first().waitFor({state:'visible',timeout:150000});
 const link=await result.first().getAttribute('href');
 if(!link?.includes('skincare-k30'))throw new Error('Unexpected product detail slug: '+link);
 console.log('PASS: real browser photo upload matched the expected published catalogue item.');
}finally{
 await page.screenshot({path:'staging-photo-acceptance.png',fullPage:true}).catch(()=>{});
 await browser.close();
}
