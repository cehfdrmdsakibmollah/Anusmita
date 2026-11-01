import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order,Payment,LoyaltyWallet,LoyaltyEvent,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const id=z.string().regex(/^[a-f0-9]{24}$/i);
const earn=z.object({kind:z.literal("earn"),orderId:id,eventKey:z.string().uuid(),note:z.string().trim().min(12).max(500),identityChecked:z.literal(true)}).strict();
const redeem=z.object({kind:z.literal("redeem"),phone:z.string().min(11).max(20),points:z.number().int().min(1).max(100000),reference:z.string().trim().min(6).max(100),eventKey:z.string().uuid(),note:z.string().trim().min(12).max(500),identityChecked:z.literal(true),benefitAlreadyDelivered:z.literal(true)}).strict();
const reverse=z.object({kind:z.literal("reverse"),orderId:id,eventKey:z.string().uuid(),note:z.string().trim().min(12).max(500)}).strict();
const requestSchema=z.discriminatedUnion("kind",[earn,redeem,reverse]);
function phone(value:unknown){const d=String(value||"").replace(/\D/g,"");if(/^01[3-9]\d{8}$/.test(d))return "+88"+d;if(/^8801[3-9]\d{8}$/.test(d))return "+"+d;throw new HttpError(400,"Order customer must have a valid Bangladesh mobile number");}
export async function GET(){
 try{await authorize(["owner","admin","finance","analyst"],"customers.view");await db();
 const [wallets,events]=await Promise.all([LoyaltyWallet.find({}).sort({updatedAt:-1}).limit(50).select("customerPhone balancePoints earnedPoints redeemedPoints reversedPoints").lean<any[]>(),LoyaltyEvent.find({}).sort({createdAt:-1}).limit(50).select("kind customerPhone reference points note createdAt").lean<any[]>()]);
 return Response.json({wallets:wallets.map(w=>({customerPhone:w.customerPhone,balancePoints:w.balancePoints,earnedPoints:w.earnedPoints,redeemedPoints:w.redeemedPoints,reversedPoints:w.reversedPoints})),events:events.map(e=>({id:String(e._id),kind:e.kind,customerPhone:e.customerPhone,reference:e.reference,points:e.points,note:e.note,createdAt:e.createdAt})),policy:"One point per 100 BDT of verified, fully paid delivered order value, awarded manually. Redeem only after offline identity verification and benefit delivery. Refund reversals are manual, not automatic.",customerSelfService:false},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin"],"customers.view");const data=requestSchema.parse(await request.json());await db();const session=await mongoose.startSession();let eventId="";
 try{await session.withTransaction(async()=>{
 if(await LoyaltyEvent.exists({eventKey:data.eventKey}).session(session))throw new HttpError(409,"Event already recorded");
 let customerPhone="",points=0,reference="",orderId:mongoose.Types.ObjectId|null=null;
 if(data.kind==="earn"){
  const order=await Order.findOne({_id:data.orderId,isTest:false,orderStatus:"delivered",paymentStatus:"paid"}).session(session);
  if(!order)throw new HttpError(409,"Only verified paid and delivered orders are eligible");
  const payments=await Payment.find({orderId:order._id,status:"verified"}).select("direction amountPaisa").session(session).lean<any[]>();
  const net=payments.reduce((sum,p)=>sum+(p.direction==="refund"?-Number(p.amountPaisa):Number(p.amountPaisa)),0);
  if(net<Number(order.totalPaisa)||Number(order.collectedPaisa)<Number(order.totalPaisa))throw new HttpError(409,"Verified net collections do not cover this order");
  if(await LoyaltyEvent.exists({kind:"earned",orderId:order._id}).session(session))throw new HttpError(409,"Points for this order were already issued");
  customerPhone=phone(order.customer?.phone);points=Math.floor(Number(order.totalPaisa)/10000);if(points<1)throw new HttpError(400,"Purchase value earns fewer than one point");
  orderId=order._id;reference=order.orderNumber;
 }else if(data.kind==="reverse"){
  const order=await Order.findById(data.orderId).session(session);
  const earned=await LoyaltyEvent.findOne({kind:"earned",orderId:data.orderId}).session(session);
  if(!order||!earned)throw new HttpError(404,"Original loyalty earning not found");
  if(!["returned","cancelled"].includes(order.orderStatus)&&order.paymentStatus!=="refunded")throw new HttpError(409,"Only refunded or returned/cancelled purchases can be reversed");
  if(await LoyaltyEvent.exists({kind:"reversed",orderId:order._id}).session(session))throw new HttpError(409,"Points already reversed");
  customerPhone=earned.customerPhone;points=earned.points;reference="Reverse "+earned.reference;orderId=order._id;
 }else{
  customerPhone=phone(data.phone);points=data.points;reference=data.reference;
  if(await LoyaltyEvent.exists({kind:"redeemed",reference}).session(session))throw new HttpError(409,"Benefit reference already redeemed");
 }
 const increments=data.kind==="earn"?{balancePoints:points,earnedPoints:points}:data.kind==="reverse"?{balancePoints:-points,reversedPoints:points}:{balancePoints:-points,redeemedPoints:points};
 const query:any={customerPhone};if(data.kind==="redeem")query.balancePoints={$gte:points};
 const wallet=await LoyaltyWallet.findOneAndUpdate(query,{$inc:increments},{upsert:data.kind==="earn",new:true,session,setDefaultsOnInsert:true});
 if(!wallet)throw new HttpError(409,"Not enough verified points, or wallet does not exist");
 const [event]=await LoyaltyEvent.create([{eventKey:data.eventKey,kind:data.kind==="earn"?"earned":data.kind==="reverse"?"reversed":"redeemed",customerPhone,orderId,reference,points,note:data.note,verifiedBy:actor.id}],{session});
 eventId=String(event._id);
 await Audit.create([{actorId:actor.id,action:"loyalty."+data.kind,entity:"LoyaltyEvent",entityId:eventId,details:{points,reference,orderId:orderId?String(orderId):null}}],{session});
 },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});}finally{await session.endSession();}
 return Response.json({saved:true,eventId},{status:201});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Duplicate loyalty event or redemption reference"},{status:409});return apiError(e);}
}
