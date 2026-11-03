import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {ChatbotRevision} from "@/lib/chatbot-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner","admin"],"support.view");
  await db();
  const rows=await ChatbotRevision.find({key:"main"}).sort({revision:-1}).limit(20).select("revision answers createdAt").lean<any[]>();
  return Response.json({revisions:rows.map(row=>({revision:row.revision,answers:row.answers,createdAt:row.createdAt})),note:"Only publications made after version-history deployment have snapshots. Restoring stages a draft; a separate publish action is required."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}
}
