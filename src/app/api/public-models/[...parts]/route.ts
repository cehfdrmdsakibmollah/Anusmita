/** Public, bounded model-asset mirror for on-device CLIP; never accepts customer photos.
 * Source is fixed and file names are allowlisted. No general proxy capability.
 */
export const runtime='nodejs';
export const dynamic='force-dynamic';
const HOST='https://huggingface.co';
const REPO='Xenova/clip-vit-base-patch32';
const REVISION='d15189d';
const exact=new Set(['config.json','preprocessor_config.json','tokenizer.json','tokenizer_config.json','special_tokens_map.json','vocab.json','merges.txt']);
export function permittedClipFile(path:string):boolean{
 if(exact.has(path))return true;
 return /^onnx\/(?:model|vision_model|text_model)(?:_[a-z0-9]+)?\.onnx(?:_data)?$/i.test(path);
}
export async function GET(req:Request,{params}:{params:Promise<{parts:string[]}>}):Promise<Response>{
 const {parts}=await params;
 if(!Array.isArray(parts)||parts.length<3||parts[0]!=='Xenova'||parts[1]!=='clip-vit-base-patch32')
  return new Response('Not found',{status:404});
 const file=parts.slice(2).join('/');
 if(!permittedClipFile(file))return new Response('Not found',{status:404});
 try{
  const url=HOST+'/'+REPO+'/resolve/'+REVISION+'/'+file;
  const headers=new Headers();
  const range=req.headers.get('range');
  if(range&&/^bytes=\d*-\d*$/.test(range))headers.set('range',range);
  // Files are revision-pinned and public. Cache successful model fetches at the edge
  // to avoid repeated 90MB upstream requests when many shoppers use CLIP.
  const init={
   headers,redirect:'follow' as const,signal:AbortSignal.timeout(120000),
   cf:{cacheEverything:true,cacheTtlByStatus:{'200-299':604800,'400-599':0}}
  } as RequestInit & {cf:{cacheEverything:boolean;cacheTtlByStatus:Record<string,number>}};
  let result=await fetch(url,init);
  if([429,502,503,504].includes(result.status)){
   result=await fetch(url,{...init,signal:AbortSignal.timeout(120000)});
  }
  if(!result.ok||!result.body)return new Response('Model asset unavailable',{status:502,headers:{'Cache-Control':'no-store'}});
  const len=Number(result.headers.get('content-length')||0);
  if(len>180_000_000){void result.body.cancel();return new Response('Model asset exceeds size limit',{status:413});}
  const out=new Headers({'Cache-Control':'public, max-age=86400, stale-while-revalidate=604800','X-Content-Type-Options':'nosniff'});
  out.set('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.txt')?'text/plain; charset=utf-8':'application/octet-stream');
  if(len>0)out.set('Content-Length',String(len));
  if(result.status===206){
   const contentRange=result.headers.get('content-range');
   if(contentRange)out.set('Content-Range',contentRange);
   out.set('Accept-Ranges','bytes');
  }
  return new Response(result.body,{status:result.status,headers:out});
 }catch{
  return new Response('Model asset unavailable',{status:502,headers:{'Cache-Control':'no-store'}});
 }
}
