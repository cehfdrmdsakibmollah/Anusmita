import {z} from "zod";
export const inspectPosReturnInput=z.object({
 returnId:z.string().regex(/^[a-f0-9]{24}$/i),
 outcome:z.enum(["restocked","disposed"]),
 note:z.string().trim().min(8).max(500)
}).strict();
export function validatePosInspection(disposition:"damaged"|"quarantine",outcome:"restocked"|"disposed"){
 if(disposition==="damaged"&&outcome==="restocked")
  throw new Error("Damaged returns must not be restored to sellable stock");
 return outcome;
}
