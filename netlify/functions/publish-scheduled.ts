import mongoose from "mongoose";
import {db} from "../../src/lib/db";
import {Product,Audit} from "../../src/lib/models";

// Netlify Scheduled Function: deployed production only; never publish via a browser action.
// A product must be explicitly scheduled, inactive, and already due.
export default async function handler(){
  const now=new Date();
  let processed=0;
  try{
    await db();
    const due=await Product.find({active:false,scheduledPublishAt:{$ne:null,$lte:now}})
      .select("_id scheduledPublishAt").sort({scheduledPublishAt:1}).limit(50).lean();
    for(const p of due){
      const session=await mongoose.startSession();
      try{
        await session.withTransaction(async()=>{
          const updated=await Product.findOneAndUpdate(
            {_id:p._id,active:false,scheduledPublishAt:{$ne:null,$lte:now}},
            {$set:{active:true},$unset:{scheduledPublishAt:""}},
            {new:true,session});
          if(!updated)return;
          await Audit.create([{actorId:null,action:"product.scheduled_published",entity:"Product",
            entityId:String(updated._id),details:{scheduledAt:p.scheduledPublishAt,executedAt:now.toISOString(),actor:"system"}}],{session});
          processed++;
        });
      }finally{await session.endSession();}
    }
    return {statusCode:200,body:JSON.stringify({processed})};
  }catch(e){
    console.error("Scheduled publication failed",e);
    return {statusCode:500,body:"Scheduled publication failed"};
  }
}
