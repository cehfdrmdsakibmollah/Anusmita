import {z} from "zod";
export const publicationState=z.object({
 active:z.boolean().optional(),
 scheduledPublishAt:z.iso.datetime({offset:true}).nullable().optional()
}).superRefine((v,ctx)=>{
 if(v.active===true&&v.scheduledPublishAt)ctx.addIssue({code:"custom",path:["active"],message:"A scheduled product must remain a draft"});
});
export function assertFutureSchedule(value:string|null|undefined,now=new Date()){
 if(value&&new Date(value).getTime()<=now.getTime())throw new Error("Scheduled publication must be in the future");
}
