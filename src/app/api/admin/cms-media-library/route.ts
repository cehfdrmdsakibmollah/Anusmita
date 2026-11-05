import {z} from "zod";
import {authorize,apiError,HttpError} from "@/lib/auth";
import {cmsSlotPages} from "@/lib/cms-page-slots";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const query=z.object({
 scope:z.enum(["homepage",...cmsSlotPages]),
 cursor:z.string().min(1).max(1024).optional(),
 limit:z.coerce.number().int().min(1).max(100).default(30)
});
export async function GET(req:Request){
 try{
  await authorize(["owner","admin"],"settings.view");
  const params=new URL(req.url).searchParams;
  const input=query.parse({scope:params.get("scope"),cursor:params.get("cursor")||undefined,limit:params.get("limit")||30});
  const base=process.env.R2_MEDIA_URL,secret=process.env.R2_MEDIA_SECRET;
  if(!base||!secret||secret.length<32)throw new HttpError(503,"R2 media library is not configured");
  const endpoint=new URL(base);
  if(endpoint.origin!=="https://anusmita-media.mdsakibmolla545.workers.dev"||endpoint.pathname!=="/"||endpoint.search||endpoint.hash)throw new HttpError(503,"Invalid R2 endpoint");
  const prefix=input.scope==="homepage"?"public/homepage/":"public/cms/"+input.scope+"/";
  const path=new URL("/assets",endpoint);
  path.searchParams.set("prefix",prefix);
  path.searchParams.set("limit",String(input.limit));
  if(input.cursor)path.searchParams.set("cursor",input.cursor);
  const response=await fetch(path,{headers:{Authorization:"Bearer "+secret},cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new HttpError(502,"Cloudflare media listing unavailable");
  const result=await response.json();
  const items=(Array.isArray(result.objects)?result.objects:[]).filter((item:any)=>typeof item.key==="string"&&item.key.startsWith(prefix)&&/^public\/(?:homepage|cms\/[a-z-]+)\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/.test(item.key)).map((item:any)=>({key:item.key,url:endpoint.origin+"/"+item.key,size:Number(item.size)||0,uploaded:item.uploaded||null}));
  return Response.json({items,cursor:result.truncated&&typeof result.cursor==="string"?result.cursor:null,scope:input.scope},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
