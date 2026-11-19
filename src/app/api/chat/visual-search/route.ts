import {assertChatOrigin} from "@/lib/chatbot-server";
export const runtime="nodejs";
export async function POST(request:Request){
 try{assertChatOrigin(request);}catch{return Response.json({error:"Cross-origin request rejected"},{status:403,headers:{"Cache-Control":"no-store"}});}
 return Response.json({error:"Image recognition requires the configured Cloudflare Workers AI service. Search by product name or share the photo with ANUSMITA support.",available:false},{status:503,headers:{"Cache-Control":"no-store"}});
}
