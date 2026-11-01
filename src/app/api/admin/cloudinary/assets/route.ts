
import {authorize,authorizePermission,apiError,HttpError} from "@/lib/auth";
import {mediaCredentials} from "@/lib/cloudinary-server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 try{
  await authorizePermission(["owner","admin","inventory"],"products.view");
  const c=mediaCredentials();
  const params=new URL(req.url).searchParams;
  const cursor=params.get("cursor")||"";
  if(cursor&&!/^[A-Za-z0-9_\-=]{8,300}$/.test(cursor))throw new HttpError(400,"Invalid library cursor");
  const url=new URL("https://api.cloudinary.com/v1_1/"+c.cloud+"/resources/image/upload");
  url.searchParams.set("prefix","anusmita/");
  url.searchParams.set("max_results","30");
  url.searchParams.set("direction","desc");
  if(cursor)url.searchParams.set("next_cursor",cursor);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  let response:Response;
  try{
   response=await fetch(url,{headers:{Authorization:"Basic "+Buffer.from(c.apiKey+":"+c.secret).toString("base64")},cache:"no-store",signal:controller.signal});
  }finally{clearTimeout(timeout);}
  if(!response.ok)throw new HttpError(502,"Cloudinary media library unavailable; verify server credentials");
  const data:any=await response.json();
  const items=(Array.isArray(data.resources)?data.resources:[])
   .filter((x:any)=>typeof x.public_id==="string"&&x.public_id.startsWith("anusmita/")&&
      typeof x.secure_url==="string"&&x.secure_url.startsWith("https://res.cloudinary.com/"+c.cloud+"/image/upload/"))
   .map((x:any)=>({publicId:x.public_id,url:x.secure_url,width:x.width,height:x.height,bytes:x.bytes,
     format:x.format,createdAt:x.created_at}));
  return Response.json({items,nextCursor:typeof data.next_cursor==="string"?data.next_cursor:null},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
