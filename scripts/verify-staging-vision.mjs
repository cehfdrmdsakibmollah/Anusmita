/**
 * Hosted staging acceptance — only real product matches count as success.
 * Never sends a customer-uploaded image. Uses a publicly served ANUSMITA product photograph.
 * Run: node scripts/verify-staging-vision.mjs
 */
const host=process.env.ANUSMITA_STAGING_URL || "https://anusmita-store-staging.mdsakibmolla545.workers.dev";
const imageUrl="https://anusmita-store.mdsakibmolla545.workers.dev/catalogue/skincare/k30.png";
const expected=/medicube.*fresh.*lasts/i;
if(!host.startsWith("https://")||!host.includes("anusmita-store-staging"))throw new Error("Refusing to test non-staging host.");
const photo=await fetch(imageUrl,{signal:AbortSignal.timeout(12000)});
if(!photo.ok)throw new Error("Public product image unavailable: HTTP "+photo.status);
const bytes=await photo.arrayBuffer();
if(bytes.byteLength<100||bytes.byteLength>800000)throw new Error("Public image does not meet bounded upload limit: "+bytes.byteLength);
const data=new FormData();
data.append("photo",new Blob([bytes],{type:"image/png"}),"medicube-k30.png");
const response=await fetch(host+"/api/chat/visual-search",{
 method:"POST",headers:{"Origin":host},body:data,signal:AbortSignal.timeout(35000)
});
const json=await response.json().catch(()=>({}));
if(!response.ok)throw new Error("Staging vision request failed, HTTP "+response.status+": "+String(json.error||"unknown"));
if(json.matchType!=="possible"||!Array.isArray(json.products)||!json.products.some(p=>expected.test(p.name||"")))throw new Error("No verified catalogue match for the real Medicube product photo. Do not release.");
if(json.products.some(p=>!p.slug||typeof p.pricePaisa!=="number"||!Number.isFinite(p.available)))throw new Error("Product response is missing data-backed catalogue fields.");
console.log("PASS: real ANUSMITA product photo matched a published catalogue product; staged image search returns usable public product fields.");
