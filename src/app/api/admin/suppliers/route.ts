
import { z } from "zod";
import { assertOrigin,authorize,authorizePermission,apiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { Supplier,Audit } from "@/lib/models";
const schema=z.object({
 name:z.string().trim().min(2).max(150),contact:z.string().max(100).default(""),
 phone:z.string().max(30).default(""),email:z.union([z.email(),z.literal("")]).default(""),
 country:z.string().max(80).default(""),paymentTerms:z.string().max(200).default(""),
 notes:z.string().max(1000).default("")
}).strict();
export async function POST(req:Request) {
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","purchasing"],"purchasing.edit");
  const data=schema.parse(await req.json());await db();
  const supplier=await Supplier.create(data);
  await Audit.create({actorId:actor.id,action:"supplier.created",entity:"Supplier",entityId:String(supplier._id)});
  return Response.json({id:String(supplier._id),name:supplier.name},{status:201});
 }catch(e){return apiError(e);}
}
export async function GET() {
 try {await authorize(["owner","admin","purchasing","finance"],"purchasing.view");await db();
  return Response.json({suppliers:await Supplier.find({active:true}).sort({createdAt:-1}).limit(100).lean()});
 }catch(e){return apiError(e);}
}
