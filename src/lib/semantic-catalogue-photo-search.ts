/**
 * Optional on-device CLIP semantic reranking.
 * Model + code are downloaded, but photo pixels are processed only in the browser.
 * No paid inference endpoint, account API key, or server upload.
 * Loading a pretrained open model is NOT equivalent to Google Lens indexing the web.
 */
import {sheetCatalogue} from './sheet-catalogue';
import type {FreeVisualMatch} from './free-catalogue-photo-search';

const MODEL='Xenova/clip-vit-base-patch32';
const PACKAGE='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm';
const CACHE_NAME='anusmita-clip-v1';
type Extractor=(input:string,opts?:Record<string,unknown>)=>Promise<{data:ArrayLike<number>;dims?:number[]}>;
let extractorPromise:Promise<Extractor>|undefined;
const vectorCache=new Map<string,number[]>();
function check(signal?:AbortSignal){if(signal?.aborted)throw new DOMException('Photo search cancelled','AbortError');}
function unit(data:ArrayLike<number>):number[]{
 const out=Array.from(data,Number);let norm=0;
 for(const v of out){if(!Number.isFinite(v))throw new Error('Invalid embedding');norm+=v*v;}
 if(out.length!==512||norm===0)throw new Error('Unexpected CLIP embedding dimension');
 const length=Math.sqrt(norm);return out.map(v=>v/length);
}
function cosine(a:number[],b:number[]){let sum=0;for(let i=0;i<a.length;i++)sum+=a[i]*b[i];return sum;}
async function loader():Promise<Extractor>{
 // URL is pinned, not constructed from customer input.
 const m:{pipeline:(task:string,name:string,opts?:Record<string,unknown>)=>Promise<Extractor>}=
  await import(/* @vite-ignore */ PACKAGE);
 const p=await m.pipeline('image-feature-extraction',MODEL,{device:'wasm',dtype:'q8'});
 return p;
}
async function extract(src:string,signal?:AbortSignal){
 check(signal);
 const p=extractorPromise??(extractorPromise=loader().catch(e=>{extractorPromise=undefined;throw e;}));
 const model=await p;check(signal);
 const tensor=await model(src,{pooling:'mean',normalize:true});
 check(signal);return unit(tensor.data);
}
function db():Promise<IDBDatabase|null>{
 return new Promise(resolve=>{
  if(typeof indexedDB==='undefined'){resolve(null);return;}
  const req=indexedDB.open(CACHE_NAME,1);
  req.onupgradeneeded=()=>{req.result.createObjectStore('vectors');};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>resolve(null);
  req.onblocked=()=>resolve(null);
 });
}
async function readVector(key:string){
 const hit=vectorCache.get(key);if(hit)return hit;
 const connection=await db();if(!connection)return null;
 return new Promise<number[]|null>(resolve=>{
  const tx=connection.transaction('vectors','readonly');const req=tx.objectStore('vectors').get(key);
  req.onsuccess=()=>{const v=req.result;if(Array.isArray(v)&&v.length===512&&v.every(Number.isFinite)){vectorCache.set(key,v);resolve(v);}else resolve(null);};
  req.onerror=()=>resolve(null);
  tx.oncomplete=()=>connection.close();tx.onerror=()=>connection.close();
 });
}
async function writeVector(key:string,v:number[]){
 vectorCache.set(key,v);
 const connection=await db();if(!connection)return;
 try{const tx=connection.transaction('vectors','readwrite');tx.objectStore('vectors').put(v,key);
  await new Promise<void>(resolve=>{tx.oncomplete=()=>resolve();tx.onerror=()=>resolve();tx.onabort=()=>resolve();});
 }finally{connection.close();}
}
export type SemanticSearchProgress={done:number;total:number;stage:'model'|'index'|'ranking'};
/**
 * Reference catalogue assets must be publicly accessible on the same origin.
 * First lookup downloads a CLIP model and builds browser-local embeddings.
 * Subsequent lookups reuse IndexedDB embeddings. This can be slow on mobile.
 */
export async function semanticCataloguePhotoSearch(
 photo:Blob,signal?:AbortSignal,onProgress?:(progress:SemanticSearchProgress)=>void,
):Promise<FreeVisualMatch[]>{
 check(signal);
 const references=sheetCatalogue.filter(p=>p.image.startsWith('/catalogue/')&&p.slug).slice(0,140);
 if(!references.length)return [];
 onProgress?.({done:0,total:references.length,stage:'model'});
 const url=URL.createObjectURL(photo);
 let query:number[];
 try{query=await extract(url,signal);}finally{URL.revokeObjectURL(url);}
 let done=0;
 const results:FreeVisualMatch[]=[];
 // One model inference at a time: avoid exhausting memory on low-end phones.
 for(const p of references){
  check(signal);
  const key=MODEL+':'+p.slug+':'+p.image;
  let vector=await readVector(key);
  if(!vector){
   try{vector=await extract(new URL(p.image,location.origin).href,signal);await writeVector(key,vector);}
   catch(e){if(signal?.aborted)throw e;vector=null;}
  }
  if(vector){
   const score=cosine(query,vector);
   // CLIP similarities are not calibrated probabilities; threshold is conservative
   // and must be evaluated on real catalogue photographs before production.
   if(score>=.78)results.push({id:p.id,name:p.name,slug:p.slug,image:p.image,score});
  }
  done++;onProgress?.({done,total:references.length,stage:'index'});
 }
 results.sort((a,b)=>b.score-a.score);
 return results.slice(0,5);
}
