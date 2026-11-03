import {authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {CourierShipment,Order} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const escapeRegex=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","sales","support","analyst"],"orders.view");
  const q=new URL(request.url).searchParams;
  const page=Math.max(1,Math.min(10000,Number(q.get("page"))||1));
  const limit=[5,10,20].includes(Number(q.get("size")))?Number(q.get("size")):10;
  const provider=q.get("provider")||"all",state=q.get("state")||"all";
  if(!["all","steadfast"].includes(provider)||!["all","processing","booked","needs_review"].includes(state))throw new HttpError(400,"Invalid courier filter");
  const keyword=(q.get("q")||"").trim().slice(0,80);
  await db();
  const filter:any={};
  if(provider!=="all")filter.provider=provider;
  if(state!=="all")filter.state=state;
  if(keyword){
   const expr=new RegExp(escapeRegex(keyword),"i");
   const found=await Order.find({$or:[{orderNumber:expr},{"customer.name":expr},{"customer.phone":expr}]}).select("_id").limit(300).lean<any[]>();
   filter.$or=[{consignmentId:expr},{trackingCode:expr},{orderId:{$in:found.map(x=>x._id)}}];
  }
  const [rows,total,stats,byStatus,monthly,latestOrders]=await Promise.all([
   CourierShipment.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).populate({path:"orderId",select:"orderNumber orderStatus customer.name customer.district totalPaisa collectedPaisa isTest"}).lean<any[]>(),
   CourierShipment.countDocuments(filter),
   CourierShipment.aggregate([{$group:{_id:{provider:"$provider",state:"$state"},count:{$sum:1},codPaisa:{$sum:"$codPaisa"}}}]),
   CourierShipment.aggregate([{$match:{deliveryStatus:{$nin:["",null]}}},{$group:{_id:"$deliveryStatus",count:{$sum:1}}}]),
   CourierShipment.aggregate([{$match:{createdAt:{$gte:new Date(new Date().getFullYear()-1,new Date().getMonth()+1,1)}}},{$group:{_id:{$dateToString:{date:"$createdAt",format:"%Y-%m",timezone:"Asia/Dhaka"}},count:{$sum:1}}},{$sort:{_id:1}}]),
   Order.countDocuments({isTest:{$ne:true},orderStatus:"packed"})
  ]);
  const providers=[
   {id:"pathao",name:"Pathao",keys:["PATHAO_CLIENT_ID","PATHAO_CLIENT_SECRET","PATHAO_USERNAME","PATHAO_PASSWORD","PATHAO_STORE_ID"]},
   {id:"steadfast",name:"Steadfast",keys:["STEADFAST_API_KEY","STEADFAST_SECRET_KEY"]},
   {id:"redx",name:"REDX",keys:["REDX_API_TOKEN"]}
  ].map(p=>({id:p.id,name:p.name,keysPresent:p.keys.every(k=>!!process.env[k]?.trim()),bookingSupported:p.id==="steadfast",liveVerified:false}));
  const get=(state:string)=>stats.filter(x=>x._id.state===state).reduce((n,x)=>n+x.count,0);
  return Response.json({
   rows:rows.map(x=>({id:String(x._id),orderId:x.orderId?._id?String(x.orderId._id):"",orderNumber:x.orderId?.orderNumber||"Order unavailable",customerName:x.orderId?.customer?.name||"",district:x.orderId?.customer?.district||"",provider:x.provider,state:x.state,deliveryStatus:x.deliveryStatus||"",statusCheckedAt:x.statusCheckedAt||null,consignmentId:x.consignmentId||"",trackingCode:x.trackingCode||"",codPaisa:x.codPaisa,createdAt:x.createdAt,errorCode:x.errorCode||""})),
   total,page,size:limit,pages:Math.max(1,Math.ceil(total/limit)),
   providers,metrics:{shipmentCount:stats.reduce((n,x)=>n+x.count,0),booked:get("booked"),processing:get("processing"),needsReview:get("needs_review"),codExpectedPaisa:stats.filter(x=>x._id.state==="booked").reduce((n,x)=>n+x.codPaisa,0),packedOrders:latestOrders,byStatus,monthly},
   sourceNotes:{cod:"Expected COD on booked shipments, NOT collected or settled",performance:"SLA and provider success rates require verified delivery event histories",integration:"Credential presence does not verify provider connectivity"}
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}
}