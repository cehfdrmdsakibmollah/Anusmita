import {createHash} from 'node:crypto';
import {HttpError} from './auth';
// Per-instance abuse guard; shared edge limits can supplement this on deployment.
const buckets=new Map<string,{count:number;until:number}>();
export function allowChat(key:string,now=Date.now()){
 for(const [k,v] of buckets)if(v.until<=now)buckets.delete(k);
 const id=createHash('sha256').update(key).digest('hex');let b=buckets.get(id);
 if(!b){if(buckets.size>=5000)return false;b={count:0,until:now+60000};buckets.set(id,b);}
 return ++b.count<=20;
}
export async function boundedJson(req:Request,max=5000){
 const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'Message required');
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new HttpError(413,'Message too large');}chunks.push(value);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'Invalid JSON');}
}

// Netlify can rewrite request.url to a deploy permalink. Trust only server-owned
// deployment URLs, never Host/X-Forwarded-Host supplied by a caller.
export function assertChatOrigin(req:Request,env:Record<string,string|undefined>=process.env){
 const origin=req.headers.get('origin');if(!origin)return;
 const allowed=new Set([new URL(req.url).origin]);
 for(const value of [env.DEPLOY_PRIME_URL,env.DEPLOY_URL,env.URL]){
  if(!value)continue;try{const u=new URL(value);if(u.protocol==='https:')allowed.add(u.origin);}catch{/* Ignore invalid configuration. */}
 }
 if(!allowed.has(origin))throw new HttpError(403,'Cross-origin request rejected');
}
