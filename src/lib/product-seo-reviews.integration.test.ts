import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {ProductReview} from "./models";
import {verifiedShopReviewSummaries} from "./product-seo-reviews";
const uri=process.env.FUNNEL_TEST_MONGODB_URI;
const database="anusmita_reviews_test_"+randomUUID().replaceAll("-","");
describe.skipIf(!uri)("shop verified reviews",()=>{
 beforeAll(async()=>{if(uri!=="mongodb://127.0.0.1:27018/?directConnection=true&replicaSet=funnel-test")throw Error("Dedicated loopback test replica required");await mongoose.connect(uri,{dbName:database});await ProductReview.init();});
 afterAll(async()=>{if(mongoose.connection.name===database){await mongoose.connection.dropDatabase();await mongoose.disconnect();}});
 it("aggregates only consented approved customer verified reviews for page products",async()=>{
 const product=new mongoose.Types.ObjectId(),other=new mongoose.Types.ObjectId();
 const base={productId:product,body:"Actual test fixture review",consentToPublish:true,submittedByCustomer:true,verifiedPurchase:true,moderationStatus:"approved",verifiedAt:new Date()};
 await ProductReview.collection.insertMany([{...base,rating:4},{...base,rating:5},{...base,rating:1,moderationStatus:"pending"},{...base,rating:1,consentToPublish:false},{...base,rating:1,submittedByCustomer:false},{...base,rating:1,verifiedPurchase:false},{...base,rating:1,verifiedAt:null},{...base,rating:1,productId:other}].map(r=>({...r,orderId:new mongoose.Types.ObjectId()})));
 const summary=await verifiedShopReviewSummaries([product]);expect(summary.size).toBe(1);expect(summary.get(String(product))).toEqual({count:2,average:4.5});expect(await verifiedShopReviewSummaries([])).toEqual(new Map());
 });
});
