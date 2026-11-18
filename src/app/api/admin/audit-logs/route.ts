import {authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit,User} from "@/lib/models";
import {AUDIT_RULES,CRITICAL_PATTERN,WARNING_PATTERN,auditQuery,literalSearch} from "@/lib/activity-audit";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{
 await authorize(["owner","admin","analyst"],"settings.view");
 const input=auditQuery(new URL(request.url).searchParams);await db();
 const match:any={createdAt:{$gte:input.since,$lte:input.until}};
 if(input.entity)match.entity=input.entity;if(input.entityId)match.entityId=input.entityId;
 if(input.text){const pattern=literalSearch(input.text);match.$or=[{action:{$regex:pattern,$options:"i"}},{entity:{$regex:pattern,$options:"i"}},{entityId:{$regex:pattern,$options:"i"}}];}
 if(input.action)match.action={$regex:literalSearch(input.action),$options:"i"};
 if(input.actor){if(input.actor.toLowerCase()==="system")match.actorId=null;else{const users=await User.find({name:{$regex:literalSearch(input.actor),$options:"i"}}).limit(101).select("_id").lean();if(users.length>100)throw new HttpError(422,"Actor search is too broad. Use a more specific name.");match.actorId={$in:users.map((u:any)=>u._id)};}}
 const derived:any={$addFields:{module:{$switch:{branches:AUDIT_RULES.map(r=>({case:{$or:[{$regexMatch:{input:"$action",regex:r.pattern,options:"i"}},{$in:["$entity",r.entities]}]},then:r.module})),default:"Other"}},severity:{$switch:{branches:[{case:{$regexMatch:{input:"$action",regex:CRITICAL_PATTERN,options:"i"}},then:"Critical"},{case:{$regexMatch:{input:"$action",regex:WARNING_PATTERN,options:"i"}},then:"Warning"}],default:"Info"}}}};
 const filters:any={};if(input.module)filters.module=input.module;if(input.severity)filters.severity=input.severity;
 const [result]=await Audit.aggregate([{$match:match},derived,{$match:filters},{$facet:{
 logs:[{$sort:{createdAt:-1,_id:-1}},{$skip:(input.page-1)*30},{$limit:30},{$project:{details:0,updatedAt:0,__v:0}}],
 counts:[{$group:{_id:"$severity",count:{$sum:1}}}],
 days:[{$group:{_id:{day:{$dateToString:{date:"$createdAt",format:"%Y-%m-%d",timezone:"Asia/Dhaka"}},severity:"$severity"},count:{$sum:1}}},{$sort:{"_id.day":1}}]
 }}]).option({maxTimeMS:8000});
 const actors=await User.find({_id:{$in:result.logs.map((x:any)=>x.actorId).filter(Boolean)}}).select("name role").lean();
 const map=new Map(actors.map((x:any)=>[String(x._id),{name:x.name,role:x.role}]));
 const counts=Object.fromEntries(result.counts.map((x:any)=>[x._id,x.count]));const total=result.counts.reduce((n:number,x:any)=>n+x.count,0);
 return Response.json({page:input.page,total,counts,days:result.days,classification:"Action-based rules; not recorded severity",logs:result.logs.map((x:any)=>({id:String(x._id),actorId:x.actorId?String(x.actorId):null,actor:map.get(String(x.actorId))||{name:x.actorId?"Former / unknown staff":"System / unknown",role:""},action:x.action,entity:x.entity,entityId:x.entityId,createdAt:x.createdAt,module:x.module,severity:x.severity}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}}
