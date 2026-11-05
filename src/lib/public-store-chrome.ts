import "server-only";
import {db} from "@/lib/db";
import {StoreChrome} from "@/lib/models";
import {defaultNavLinks,defaultShopLinks,defaultCareLinks,validatedLinks,type ChromeLink} from "@/lib/store-chrome-links";
export type PublicChrome={announcement:string;footerNote:string;headerOrder:string[];footerOrder:string[];navLinks:ChromeLink[];footerShopLinks:ChromeLink[];footerCareLinks:ChromeLink[]};
function validOrder(value:unknown,required:string[]):string[]{return Array.isArray(value)&&value.length===required.length&&required.every(x=>value.includes(x))&&new Set(value).size===required.length?[...value]:required;}
export async function publicChrome():Promise<PublicChrome|null>{
 if(!process.env.MONGODB_URI)return null;
 try{
  await db();
  const record=await StoreChrome.findOne({key:"main",enabled:true}).select("announcement footerNote headerOrder footerOrder navLinks footerShopLinks footerCareLinks").lean<any>();
  return record?{announcement:String(record.announcement||"").slice(0,180),footerNote:String(record.footerNote||"").slice(0,240),headerOrder:validOrder(record.headerOrder,["logo","navigation","search","tools"]),footerOrder:validOrder(record.footerOrder,["brand","shop","care"]),navLinks:validatedLinks(record.navLinks,defaultNavLinks),footerShopLinks:validatedLinks(record.footerShopLinks,defaultShopLinks),footerCareLinks:validatedLinks(record.footerCareLinks,defaultCareLinks)}:null;
 }catch{return null;}
}
