import {Product} from '../lib/models';
import {cloudflareDb} from './mongoose-context';
import {allowChat} from '../lib/chatbot-server';
import {visualSearchTerms,visualSearchFilter,rankVisualCandidates} from '../lib/visual-product-search';
import {validCloudinaryUrl} from '../lib/cloudinary-media';

type VisionAI={run:(model:string,input:Record<string,unknown>)=>Promise<{response?:string}>};
type VisionEnv={AI?:VisionAI;RECOVERY_CATALOG_ONLY?:string};
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:noStore});
const supported=['image/jpeg','image/png','image/webp'];
function imageValid(bytes:Uint8Array,type:string){
 if(type==='image/jpeg')return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(type==='image/png')return bytes.slice(0,8).every((b,i)=>b===[137,80,78,71,13,10,26,10][i]);
 if(type==='image/webp')return String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 return false;
}
/** Image bytes go to Workers AI only for an explicit user action. Never stored or logged. */
export async function visualProductSearch(request:Request,env:VisionEnv):Promise<Response>{
 const url=new URL(request.url);
 const origin=request.headers.get('Origin');
 if(origin!==url.origin)return json({error:'Cross-origin image lookup not allowed'},403);
 if(!env.AI)return json({error:'Image recognition is not configured yet. Please search by product name or contact our team.',available:false},503);
 if(!allowChat('visual:'+ (request.headers.get('CF-Connecting-IP')||'anonymous')))return json({error:'Too many image requests, please try later.'},429);
 if(Number(request.headers.get('content-length')||0)>900000)return json({error:'Use a photo smaller than 800 KB'},413);
 try{
  const form=await request.formData();
  const file=form.get('photo');
  if(!(file instanceof File)||!supported.includes(file.type)||file.size<100||file.size>800000)return json({error:'Upload one JPEG, PNG or WebP photo under 800 KB.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!imageValid(bytes,file.type))return json({error:'Image file did not match its declared format.'},400);
  let description='';
  try{
   const result=await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct',{
    prompt:'Read the visible product brand, product name, variant and any printed words. Describe only clearly visible details in English, separated by spaces. Do not guess or invent brands. If no readable product, say unknown.',
    image:Array.from(bytes),max_tokens:140,temperature:0.1
   });
   description=String(result?.response||'').slice(0,550);
  }catch{return json({error:'Image recognition is temporarily unavailable. Try typing the brand or product name.',available:false},503);}
  const terms=visualSearchTerms(description);
  if(!terms.length)return json({reply:'No readable product name detected. Please upload a clearer photo of the label or search by name.',products:[],recognizedText:''});
  try{
   await cloudflareDb();
   const candidates=await Product.find(visualSearchFilter(terms))
    .select('name slug brand sku category pricePaisa onHand reserved imageUrls')
    .limit(80).maxTimeMS(2500).lean<any[]>();
   const ranked=rankVisualCandidates(candidates,terms);
   const products=ranked.map(p=>({
    id:String(p._id),name:p.name,slug:p.slug,category:p.category||'',size:'',pricePaisa:p.pricePaisa,
    available:Math.max(0,(p.onHand||0)-(p.reserved||0)),description:'',usage:'',
    imageUrl:Array.isArray(p.imageUrls)?p.imageUrls.find((u:unknown)=>typeof u==='string'&&validCloudinaryUrl(u)):undefined
   }));
   return json({
    reply:products.length?'Possible catalogue matches from the photo. Please check the label and product details before ordering.':'No reliable catalogue match was found. Try a clearer label photo or type the product name.',
    products,recognizedText:description,matchType:products.length?'possible':'none',
    privacy:'Photo was processed for this lookup; it was not saved by ANUSMITA.'
   });
  }catch{return json({error:'The catalogue is unavailable; please try again or contact support.',available:false},503);}
 }catch{return json({error:'Unable to read image. Please retry with a smaller photo.'},400);}
}
