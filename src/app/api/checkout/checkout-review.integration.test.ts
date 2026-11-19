import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {beforeAll,afterAll,describe,it,expect,vi} from "vitest";
const session=vi.hoisted(()=>({token:""}));
vi.mock("server-only",()=>({}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>session.token?{value:session.token}:undefined})}));
vi.mock("@/lib/db",()=>({db:async()=>mongoose}));
vi.mock("@/lib/launch-config",()=>({checkoutEnabled:()=>true}));

import {signSession} from "@/lib/auth";
import {verifyOrderReceipt} from "@/lib/order-receipt";
import {Audit,Counter,Order,Product,ProductReview,StockMovement,StoreSettings,User} from "@/lib/models";
import {verifiedShopReviewSummaries} from "@/lib/product-seo-reviews";
import {POST as checkout} from "../checkout/route";
import {POST as invite} from "../admin/review-invitations/route";
import {POST as submitReview} from "../reviews/route";
import {GET as pendingReviews,POST as moderateReview} from "../admin/product-reviews/route";

const uri=process.env.FUNNEL_TEST_MONGODB_URI;
const isolated="mongodb://127.0.0.1:27018/?directConnection=true&replicaSet=funnel-test";
const database="anusmita_cod_review_test_"+randomUUID().replaceAll("-","");
const origin="https://deploy-preview-232--anusmita.netlify.app";
const post=(path:string,body:unknown,key?:string)=>new Request(origin+path,{method:"POST",headers:{origin,"Content-Type":"application/json",...(key?{"Idempotency-Key":key}:{})},body:JSON.stringify(body)});
describe.skipIf(!uri)("isolated COD and verified-review acceptance",()=>{
 beforeAll(async()=>{
  if(uri!==isolated)throw new Error("Isolated loopback MongoDB replica set required");
  await mongoose.connect(uri,{dbName:database,serverSelectionTimeoutMS:5000});
  await Promise.all([Audit,Counter,Order,Product,ProductReview,StockMovement,StoreSettings,User].map(m=>m.init()));
  await StoreSettings.create({key:"main",revision:1,content:{maintenanceEnabled:false,maintenanceMessage:"Store is open for test orders.",revision:1,storeName:"ANUSMITA",supportEmail:"",supportPhone:"",currency:"BDT",timezone:"Asia/Dhaka",minimumOrderPaisa:0,maximumCodPaisa:0,dhakaShippingPaisa:8000,outsideShippingPaisa:12000}});
 });
 afterAll(async()=>{if(mongoose.connection.name===database){await mongoose.connection.dropDatabase();await mongoose.disconnect();}});

 it("checks saved shipping totals, COD reservation, idempotency, receipt and review moderation",async()=>{
  vi.stubEnv("SESSION_SECRET",randomUUID()+randomUUID());
  vi.stubEnv("NEXT_PUBLIC_SITE_URL",origin);
  try{
   const owner=new mongoose.Types.ObjectId();
   await User.collection.insertOne({_id:owner,name:"Test Owner",email:"cod-owner@example.test",role:"owner",active:true});
   const product=await Product.create({name:"Isolated Test Serum",slug:"isolated-serum",sku:"TEST-SERUM-232",category:"Skincare",pricePaisa:20000,costPaisa:9000,onHand:10,reserved:0,active:true});
   const input=(district:string)=>({items:[{productId:String(product._id),quantity:2}],customer:{name:"Test Customer",phone:"01700000000",district,area:district==="Dhaka"?"Dhanmondi":"Sonadanga",address:"Test house, test street"},paymentMethod:"cod",depositPaisa:0});
   const first=await checkout(post("/api/checkout",input("Dhaka"),"acceptance-cod-232-a"));
   expect(first.status).toBe(201);
   const receipt=await first.json();
   expect(receipt.totalPaisa).toBe(48000);
   expect(receipt.paymentStatus).toBe("unpaid");
   const token=new URL(receipt.receiptUrl,origin).searchParams.get("token")||"";
   expect(await verifyOrderReceipt(token)).toBe(receipt.id);
   const order=await Order.findById(receipt.id).lean<any>();
   expect(order).toMatchObject({subtotalPaisa:40000,shippingPaisa:8000,totalPaisa:48000,paymentMethod:"cod",collectedPaisa:0});
   expect((await Product.findById(product._id).lean<any>()).reserved).toBe(2);
   expect(await StockMovement.countDocuments({orderId:receipt.id,type:"reserve"})).toBe(1);

   const retry=await checkout(post("/api/checkout",input("Dhaka"),"acceptance-cod-232-a"));
   expect(retry.status).toBe(201);
   expect((await retry.json()).id).toBe(receipt.id);
   expect((await Product.findById(product._id).lean<any>()).reserved).toBe(2);
   expect((await checkout(post("/api/checkout",input("Khulna"),"acceptance-cod-232-a"))).status).toBe(409);

   const outside=await checkout(post("/api/checkout",input("Khulna"),"acceptance-cod-232-b"));
   expect(outside.status).toBe(201);
   expect((await outside.json()).totalPaisa).toBe(52000);
   expect((await Product.findById(product._id).lean<any>()).reserved).toBe(4);

   session.token=await signSession(String(owner));
   expect((await invite(post("/api/admin/review-invitations",{orderId:receipt.id,productId:String(product._id)}))).status).toBe(404);
   await Order.updateOne({_id:receipt.id},{$set:{orderStatus:"delivered",deliveredAt:new Date()}});
   const invited=await invite(post("/api/admin/review-invitations",{orderId:receipt.id,productId:String(product._id)}));
   expect(invited.status).toBe(200);
   const reviewToken=new URL((await invited.json()).reviewUrl).searchParams.get("token")||"";
   session.token="";
   const submission={token:reviewToken,rating:5,body:"Isolated verified order review, good serum.",consentToPublish:true};
   const submitted=await submitReview(post("/api/reviews",submission));
   expect(submitted.status).toBe(201);
   expect((await submitted.json()).status).toBe("pending_moderation");
   expect((await submitReview(post("/api/reviews",submission))).status).toBe(409);
   expect((await verifiedShopReviewSummaries([product._id])).size).toBe(0);
   const review=await ProductReview.findOne({orderId:receipt.id,productId:product._id}).lean<any>();
   expect(review).toMatchObject({moderationStatus:"pending",verifiedPurchase:true,submittedByCustomer:true,consentToPublish:true});
   expect((await moderateReview(post("/api/admin/product-reviews",{reviewId:String(review._id),decision:"approved"}))).status).toBe(403);
   session.token=await signSession(String(owner));
   const queue=await pendingReviews();
   expect(queue.status).toBe(200);
   expect((await queue.json()).reviews.some((r:{id:string})=>r.id===String(review._id))).toBe(true);
   const approved=await moderateReview(post("/api/admin/product-reviews",{reviewId:String(review._id),decision:"approved"}));
   expect(approved.status).toBe(200);
   expect((await moderateReview(post("/api/admin/product-reviews",{reviewId:String(review._id),decision:"approved"}))).status).toBe(409);
   expect((await verifiedShopReviewSummaries([product._id])).get(String(product._id))).toEqual({count:1,average:5});
   expect(await Audit.countDocuments({action:"product.review.moderated",entityId:String(review._id)})).toBe(1);
  }finally{session.token="";vi.unstubAllEnvs();}
 });
});
