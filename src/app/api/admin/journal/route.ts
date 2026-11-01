import {z} from "zod";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {JournalEntry,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const ACCOUNTS=["cash","bank","accounts_receivable","inventory","accounts_payable","sales_revenue","cogs","shipping_expense","marketing_expense","other_expense","owner_equity","other_income"] as const;
const line=z.object({account:z.enum(ACCOUNTS),debitPaisa:z.number().int().min(0).max(1_000_000_000),creditPaisa:z.number().int().min(0).max(1_000_000_000)}).strict().refine(x=>(x.debitPaisa>0)!==(x.creditPaisa>0),{message:"Exactly one of debit or credit must be positive"});
const input=z.object({entryKey:z.string().uuid(),transactionDate:z.iso.datetime({offset:true}),reference:z.string().trim().min(3).max(100),note:z.string().trim().min(8).max(500),lines:z.array(line).min(2).max(20)}).strict();
export async function GET(){
 try{await authorize(["owner","admin","finance","analyst"],"finance.view");await db();const entries=await JournalEntry.find({}).sort({transactionDate:-1,createdAt:-1}).limit(100).select("transactionDate reference note lines totalPaisa createdAt createdBy").lean<any[]>();return Response.json({entries:entries.map(e=>({id:String(e._id),transactionDate:e.transactionDate,reference:e.reference,note:e.note,lines:e.lines,totalPaisa:e.totalPaisa})),manualOnly:true,note:"Manually posted journal entries only; not an automated reconciliation or comprehensive general ledger."},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{assertOrigin(request);const user=await authorize(["owner","admin","finance"],"finance.edit");const data=input.parse(await request.json());const debit=data.lines.reduce((n,l)=>n+l.debitPaisa,0),credit=data.lines.reduce((n,l)=>n+l.creditPaisa,0);
 if(debit!==credit||debit<1)throw new HttpError(400,"Journal must have equal positive total debits and credits");
 const date=new Date(data.transactionDate);if(Number.isNaN(date.valueOf()))throw new HttpError(400,"Invalid transaction date");
 await db();const session=await mongoose.startSession();let id="";
 try{await session.withTransaction(async()=>{
  const existing=await JournalEntry.findOne({entryKey:data.entryKey}).session(session);
  if(existing)throw new HttpError(409,"Entry key already posted; refresh the journal");
  const [entry]=await JournalEntry.create([{...data,transactionDate:date,totalPaisa:debit,createdBy:user.id,status:"posted"}],{session});id=String(entry._id);
  await Audit.create([{actorId:user.id,action:"journal.posted",entity:"JournalEntry",entityId:id,details:{reference:data.reference,totalPaisa:debit}}],{session});
 });}finally{await session.endSession();}
 return Response.json({id,posted:true},{status:201});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Journal already recorded"},{status:409});return apiError(e);}
}
