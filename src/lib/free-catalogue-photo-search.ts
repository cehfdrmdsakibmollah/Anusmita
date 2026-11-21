/**
 * Zero-API-fee product-photo similarity. Uses browser Canvas only.
 * This is perceptual matching against public catalogue image references, NOT
 * general object recognition or product-label OCR.
 * Nothing from the uploaded image is transmitted to a model provider.
 */
import {sheetCatalogue} from './sheet-catalogue';
import {choosePhotoCandidates} from './photo-match-confidence';

export type FreeVisualMatch={id:string;name:string;slug:string;image:string;score:number};
export type FreeVisualResult={matches:FreeVisualMatch[];suggestions:FreeVisualMatch[];examined:number;total:number};
type Signature={hash:Uint8Array;rgb:Float32Array;hist:Float32Array};
const catalogue=sheetCatalogue.filter(x=>x.image.startsWith('/catalogue/')&&x.slug);
const cached=new Map<string,Signature>();
const cap=140;
function imageSignature(image:CanvasImageSource):Signature{
 const canvas=document.createElement('canvas');
 canvas.width=64;canvas.height=64;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw new Error('Canvas is unavailable in this browser.');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,64,64);
 ctx.drawImage(image,0,0,64,64);
 const px=ctx.getImageData(0,0,64,64).data;
 const rgb=new Float32Array(4*4*3),hist=new Float32Array(3*8);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const off=(y*64+x)*4,cell=(Math.floor(y/16)*4+Math.floor(x/16))*3;
  for(let c=0;c<3;c++){const value=px[off+c];rgb[cell+c]+=value/(256*255);hist[c*8+Math.min(7,Math.floor(value/32))]+=1/4096;}
 }
 const gray=(x:number,y:number)=>{
  const off=((Math.floor((y+.5)*64/8)*64)+Math.floor((x+.5)*64/9))*4;
  return px[off]*.299+px[off+1]*.587+px[off+2]*.114;
 };
 const hash=new Uint8Array(8*8);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)hash[y*8+x]=gray(x,y)>gray(x+1,y)?1:0;
 return {hash,rgb,hist};
}
function similarity(a:Signature,b:Signature){
 let diff=0,rgb=0,hist=0;
 for(let i=0;i<a.hash.length;i++)diff+=a.hash[i]===b.hash[i]?0:1;
 for(let i=0;i<a.rgb.length;i++)rgb+=Math.abs(a.rgb[i]-b.rgb[i]);
 for(let i=0;i<a.hist.length;i++)hist+=Math.abs(a.hist[i]-b.hist[i]);
 return Math.max(0,Math.min(1,(1-diff/64)*.45+(1-rgb/48)*.4+(1-hist/6)*.15));
}
async function loadSignature(src:string,signal?:AbortSignal):Promise<Signature|null>{
 if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
 const old=cached.get(src);if(old)return old;
 try{
  const res=await fetch(src,{signal,cache:'force-cache'});
  if(!res.ok)return null;
  const blob=await res.blob();
  if(blob.size>3_000_000)return null;
  const bitmap=await createImageBitmap(blob);
  try{
   const sig=imageSignature(bitmap);
   if(cached.size<cap)cached.set(src,sig);
   return sig;
  }finally{bitmap.close();}
 }catch(e){if(signal?.aborted)throw e;return null;}
}
export async function freeCatalogueImageSearch(photo:Blob,signal?:AbortSignal):Promise<FreeVisualResult>{
 if(typeof window==='undefined')throw Error('Browser required');
 if(photo.size>5_000_000)throw new Error('Use an image smaller than 5 MB.');
 const image=await createImageBitmap(photo);
 let query:Signature;
 try{query=imageSignature(image);}finally{image.close();}
 let examined=0;
 const ranked:FreeVisualMatch[]=[];
 const jobs=catalogue.slice(0,cap);
 let next=0;
 const worker=async()=>{
  while(next<jobs.length){
   if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
   const item=jobs[next++];
   const ref=await loadSignature(item.image,signal);
   if(!ref)continue;
   examined++;
   const score=similarity(query,ref);
   // Match exact/similar catalogue photographs, not semantic product identity.
   ranked.push({id:item.id,name:item.name,slug:item.slug,image:item.image,score});
  }
 };
 await Promise.all(Array.from({length:Math.min(4,jobs.length)},()=>worker()));
 ranked.sort((a,b)=>b.score-a.score);
 const matches=choosePhotoCandidates(ranked,{minimum:.90,margin:.035});
 // These low-confidence cards are browse suggestions, NEVER claimed matches.
 // Refuse uniform/featureless photos or weak image similarities.
 const channelMean=query.rgb.reduce((n,v)=>n+v,0)/query.rgb.length;
 const queryVariance=query.rgb.reduce((n,v)=>n+(v-channelMean)**2,0)/query.rgb.length;
 const suggestions=!matches.length&&queryVariance>.0015
  ?ranked.slice(0,4):[];
 return {matches,suggestions,examined,total:jobs.length};
}
