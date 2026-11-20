/** Staging-only browser benchmark. Synthetic transformations are not real alternate-angle photographs. */
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ANUSMITA_STAGING_URL||'https://anusmita-store-staging.mdsakibmolla545.workers.dev';
if(!/^https:\/\/anusmita-store-staging\./.test(base))throw Error('Staging only');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
const sample=await fetch(base+'/catalogue/skincare/k30.png',{signal:AbortSignal.timeout(15000)});
if(!sample.ok)throw Error('Missing public K30 sample image');
const sampleBytes=Buffer.from(await sample.arrayBuffer());
async function exercise({title,mobile=false,modified=false,unknown=false}){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage();let errors=[];const started=Date.now();
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(('console '+m.text()).slice(0,250));});
 page.on('requestfailed',r=>errors.push(('request '+r.url()+' '+r.failure()?.errorText).slice(0,250)));
 page.on('response',r=>{if(r.status()>=400&&/transformers|huggingface|onnx|jsdelivr/.test(r.url()))errors.push(('http '+r.status()+' '+r.url()).slice(0,250));});
 page.on('pageerror',e=>errors.push(String(e).slice(0,150)));
 try{
  await page.goto(base+'/contact/design-preview',{waitUntil:'networkidle',timeout:45000});
  await page.waitForTimeout(1200);
  let buffer=sampleBytes;
  if(unknown||modified){
   const raw=sampleBytes.toString('base64');
   const transformed=await page.evaluate(async({raw,unknown,modified})=>{
    const canvas=document.createElement('canvas');canvas.width=500;canvas.height=500;const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('Canvas unsupported');
    ctx.fillStyle=unknown?'#777777':'#f1d3dc';ctx.fillRect(0,0,500,500);
    if(modified){
     const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
     const image=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
     ctx.save();ctx.translate(250,250);ctx.rotate(8*Math.PI/180);
     ctx.drawImage(image,-190,-190,380,380);ctx.restore();image.close();
    }
    return canvas.toDataURL('image/png').split(',')[1];
   },{raw,unknown,modified});
   buffer=Buffer.from(transformed,'base64');
  }
  await page.locator('input[type=file]').setInputFiles({name:'benchmark.png',mimeType:'image/png',buffer});
  await page.locator('.aa-pending img').waitFor({state:'visible',timeout:17000});
  await page.getByRole('button',{name:/Send message|মেসেজ পাঠান/}).click();
  // Wait for response UI, not a naked HTTP-200 result.
  await page.waitForFunction(()=>document.querySelectorAll('.aa-message.aa-assistant').length>=2,{},{timeout:210000});
  const matches=await page.locator('.aa-visual-match').evaluateAll(a=>a.map(x=>({name:x.textContent||'',href:x.getAttribute('href')})));
  const correct=matches.some(x=>x.href?.includes('skincare-k30'));
  const first=matches[0]?.href||null;
  const pass=unknown?matches.length===0:correct&&first?.includes('skincare-k30');
  const elapsed=Date.now()-started;
  const metrics=await page.evaluate(()=>({resources:performance.getEntriesByType('resource').length,heapBytes:performance.memory?.usedJSHeapSize??null}));
  results.push({title,mobile,modified,unknown,pass,elapsedMs:elapsed,first,matches:matches.length,errors,metrics});
  console.log('BENCHMARK '+JSON.stringify(results.at(-1)));
  if(!pass)throw Error(title+' did not satisfy expected photo-match behavior');
 }catch(e){
  const detail={title,pass:false,elapsedMs:Date.now()-started,error:String(e),errors};
  if(!results.some(x=>x.title===title))results.push(detail);
  console.error('BENCHMARK_FAIL '+JSON.stringify(detail));
  throw e;
 }finally{
  await page.screenshot({path:'benchmark-'+title+'.png',fullPage:true}).catch(()=>{});
  await context.close();
 }
}
let failed=false;
try{
 for(const spec of [{title:'mobile-exact',mobile:true},{title:'desktop-modified-background',modified:true},{title:'unknown-blank',unknown:true}]){
  try{await exercise(spec);}catch{failed=true;}
 }
}finally{
 await writeFile('staging-photo-benchmark.json',JSON.stringify({timestamp:new Date().toISOString(),results},null,2));
 await browser.close();
}
if(failed)process.exitCode=1;
