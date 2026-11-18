import {authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import mongoose from "mongoose";

export async function GET(request:Request){
 try{
  await authorize(["owner","admin"],"settings.view");await db();
  const url=new URL(request.url).searchParams.get("url")??"";
  if(!/^https:\/\/anusmita-media\.mdsakibmolla545\.workers\.dev\/public\/(?:homepage|cms\/[a-z-]+)\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/.test(url))throw new HttpError(400,"Select a managed media URL");
  const database=mongoose.connection.db;
  if(!database)throw new HttpError(503,"Database unavailable");
  const references:{collection:string;id:string}[]=[];
  let scanned=0,complete=true;
  const names=(await database.listCollections({},{nameOnly:true}).toArray()).map(item=>item.name)
   .filter(name=>!name.startsWith("system.")&&!/audit|revision|counter|session|exposure/i.test(name));
  // A bounded scan reports uncertainty rather than allowing destructive deletion.
  const deadline=Date.now()+10000;
  function contains(value:unknown):boolean{
   if(typeof value==="string")return value.includes(url);
   if(Array.isArray(value))return value.some(contains);
   if(value&&typeof value==="object")return Object.values(value).some(contains);
   return false;
  }
  for(const name of names){
   const cursor=database.collection(name).find({},{maxTimeMS:5000}).limit(2001);
   let count=0;
   try{
    for await(const document of cursor){
     count++;scanned++;
     if(count>2000||Date.now()>deadline){complete=false;break;}
     if(contains(document))references.push({collection:name,id:String(document._id)});
    }
   }finally{await cursor.close();}
   if(!complete)break;
  }
  return Response.json({references,scanned,complete},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
