// Only storefront image keys are public. Bucket listing and writes require the server secret.
export const MAX_BYTES = 3 * 1024 * 1024;
export const KEY = /^public\/products\/[a-f0-9]{24}\/[a-f0-9-]{36}\.(png|jpg|webp)$/;
export function imageType(bytes) {
  if(bytes.length<12)return null;
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
  if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
  if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
  return null;
}
function authorized(request,env) {
  if(!env.UPLOAD_SECRET||env.UPLOAD_SECRET.length<32)return false;
  const expected='Bearer '+env.UPLOAD_SECRET, supplied=request.headers.get('authorization')||'';
  if(supplied.length!==expected.length)return false;
  let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=supplied.charCodeAt(i)^expected.charCodeAt(i);
  return mismatch===0;
}
const error=(status,message)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
export default {
  async fetch(request,env) {
    const path=new URL(request.url).pathname;
    if(path==='/health') {
      if(!authorized(request,env))return error(403,'Access denied');
      if(request.method!=='GET')return error(405,'Method not allowed');
      await env.MEDIA.list({limit:1});
      return Response.json({ready:true},{headers:{'Cache-Control':'no-store'}});
    }
    const key=path.slice(1);
    if(!KEY.test(key))return error(404,'Not found');
    if(request.method==='GET'||request.method==='HEAD') {
      const object=request.method==='HEAD'?await env.MEDIA.head(key):await env.MEDIA.get(key);
      if(!object)return error(404,'Image not found');
      const headers=new Headers({'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"});
      object.writeHttpMetadata(headers);headers.set('ETag',object.httpEtag);
      if(request.headers.get('if-none-match')===object.httpEtag)return new Response(null,{status:304,headers});
      return new Response(request.method==='HEAD'?null:object.body,{headers});
    }
    if(!authorized(request,env))return error(403,'Access denied');
    if(request.method==='DELETE'){await env.MEDIA.delete(key);return new Response(null,{status:204});}
    if(request.method!=='PUT')return error(405,'Method not allowed');
    const declared=Number(request.headers.get('content-length'));
    if(!declared||declared>MAX_BYTES)return error(413,'Image must be at most 3 MB');
    const bytes=new Uint8Array(await request.arrayBuffer());
    if(bytes.length!==declared||bytes.length>MAX_BYTES)return error(413,'Invalid image size');
    const type=imageType(bytes), ext=key.split('.').pop();
    if(!type||type!==request.headers.get('content-type')||({png:'image/png',jpg:'image/jpeg',webp:'image/webp'})[ext]!==type)return error(415,'Choose a JPEG, PNG or WebP image');
    const object=await env.MEDIA.put(key,bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:type,cacheControl:'public, max-age=31536000, immutable'}});
    if(!object)return error(409,'Image already exists');
    return Response.json({key,bytes:bytes.length,type},{status:201,headers:{'Cache-Control':'no-store'}});
  }
};
