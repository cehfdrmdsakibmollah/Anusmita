import "server-only";
import {db} from "@/lib/db";
import {StoreChrome} from "@/lib/models";
export type PublicChrome={announcement:string;footerNote:string};
export async function publicChrome():Promise<PublicChrome|null>{
 if(!process.env.MONGODB_URI)return null;
 try{
  await db();
  const record=await StoreChrome.findOne({key:"main",enabled:true}).select("announcement footerNote").lean<any>();
  return record?{announcement:String(record.announcement||"").slice(0,180),footerNote:String(record.footerNote||"").slice(0,240)}:null;
 }catch{return null;}
}
