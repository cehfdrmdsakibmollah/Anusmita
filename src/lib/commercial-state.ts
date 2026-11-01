import {z} from "zod";
export const commercialState=z.object({
 availabilityMode:z.enum(["now","preorder"]).optional(),
 preorderEta:z.iso.datetime({offset:true}).nullable().optional(),
 discountPercent:z.number().min(0).max(100).optional(),
 salesChannels:z.array(z.enum(["online","app","marketplace"])).max(3).optional()
});
export function validateCommercialState(input:z.infer<typeof commercialState>,now=new Date()){
 const data=commercialState.parse(input);
 if(data.availabilityMode==="preorder"&&(!data.preorderEta||Date.parse(data.preorderEta)<=now.getTime()))
   throw new Error("Pre-order requires a future availability ETA");
 if(data.availabilityMode==="now"&&data.preorderEta)
   throw new Error("Available-now products cannot have a pre-order ETA");
 if(data.salesChannels&&new Set(data.salesChannels).size!==data.salesChannels.length)
   throw new Error("Duplicate publishing channels are not allowed");
 return data;
}
