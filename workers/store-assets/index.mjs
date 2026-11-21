// Injected by scripts/package-store-assets.mjs; only exact public asset paths are served.
import assets from "./manifest.json";
export default {async fetch(request,env,ctx){
 if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405,headers:{Allow:"GET, HEAD"}});
 const path=new URL(request.url).pathname;const asset=assets[path];
 if(!asset)return new Response("Not found",{status:404});
 const key=new Request("https://anusmita-assets.invalid/"+asset.hash);const cache=caches.default;
 const cached=await cache.match(key);if(cached)return request.method==="HEAD"?new Response(null,{headers:cached.headers,status:cached.status}):cached;
 let bytes;
 if(asset.url){const response=await fetch(asset.url);if(!response.ok)return new Response("Asset unavailable",{status:502});bytes=await response.arrayBuffer();}
 else bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
 const response=new Response(bytes,{headers:{"Content-Type":asset.type,"Cache-Control":path.startsWith("/_next/static/")?"public, max-age=31536000, immutable":"public, max-age=3600","ETag":"\""+asset.hash+"\"","X-Content-Type-Options":"nosniff"}});
 ctx.waitUntil(cache.put(key,response.clone()));
 return request.method==="HEAD"?new Response(null,{headers:response.headers}):response;
}};
