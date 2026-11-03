import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit,User} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner"]);await db();
  const since=new Date(Date.now()-7*86400000);
  const [roleCounts,activity,topActors]=await Promise.all([
   User.aggregate([{$group:{_id:"$role",count:{$sum:1}}},{$sort:{count:-1}}]),
   Audit.aggregate([{$match:{createdAt:{$gte:since}}},{$group:{_id:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt",timezone:"Asia/Dhaka"}},count:{$sum:1}}},{$sort:{_id:1}}]),
   Audit.aggregate([{$match:{createdAt:{$gte:since},actorId:{$ne:null}}},{$group:{_id:"$actorId",actions:{$sum:1}}},{$sort:{actions:-1}},{$limit:5},{$lookup:{from:User.collection.name,localField:"_id",foreignField:"_id",as:"actor"}},{$project:{actions:1,name:{$ifNull:[{$arrayElemAt:["$actor.name",0]},"Unknown actor"]}}}])
  ]);
  return Response.json({roleCounts:roleCounts.map(x=>({role:x._id,count:x.count})),activity:activity.map(x=>({date:x._id,count:x.count})),topActors:topActors.map(x=>({name:x.name,actions:x.actions})),windowDays:7},{headers:{"Cache-Control":"private,no-store"}});
 }catch(e){return apiError(e)}
}