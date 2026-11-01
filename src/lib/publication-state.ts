import {z} from "zod";
export const publicationState=z.object({
 active:z.boolean().optional(),
 scheduledPublishAt:z.iso.datetime({offset:true}).nullable().optional(),
 archived:z.boolean().optional()
}).superRefine((v,ctx)=>{
 if(v.archived&&v.active===true)ctx.addIssue({code:"custom",path:["active"],message:"Archived products must be drafts"});
 if(v.archived&&v.scheduledPublishAt)ctx.addIssue({code:"custom",path:["scheduledPublishAt"],message:"Archived products cannot be scheduled"});
 if(v.active===true&&v.scheduledPublishAt)ctx.addIssue({code:"custom",path:["active"],message:"A scheduled product must remain a draft"});
});
export function assertFutureSchedule(value:string|null|undefined,now=new Date()){
 if(value&&new Date(value).getTime()<=now.getTime())throw new Error("Scheduled publication must be in the future");
}
