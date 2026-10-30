import dns from "node:dns";
dns.setServers(["1.1.1.1"]);

import "dotenv/config";
import mongoose from "mongoose";
import {dedicatedDb,launchFlags,ATLAS_HOST,ATLAS_DB,ATLAS_APP_USER} from "../src/lib/launch-config";

async function doctor(){
 const flags=launchFlags(process.env);
 console.log("ANUSMITA Atlas diagnostics (no secrets printed)");
 console.log("Cluster:",ATLAS_HOST," Database:",ATLAS_DB," User:",ATLAS_APP_USER);
 console.log("Connection URI matches approved Atlas resource:",dedicatedDb(process.env.MONGODB_URI)?"YES":"NO");
 console.log("Session secret configured:",flags.sessionSecret?"YES":"NO");
 console.log("Store mode:",flags.mode);
 if(!flags.dedicatedDatabase){
  process.exitCode=1;console.error("Set MONGODB_URI privately in .env. If necessary reset the user password in Atlas Database Access.");
  return;
 }
 let conn:mongoose.Connection|undefined;
 try{
  conn=await mongoose.createConnection(process.env.MONGODB_URI!,{
   maxPoolSize:2,serverSelectionTimeoutMS:10000,autoIndex:false,autoCreate:false
  }).asPromise();
  await conn.db!.admin().ping();
  const [owners,products]=await Promise.all([
   conn.db!.collection("users").countDocuments({role:"owner",active:true}),
   conn.db!.collection("products").countDocuments({active:true})
  ]);
  console.log("Atlas connectivity: OK");
  console.log("Active owner account:",owners>0?"YES":"NO");
  console.log("Published products:",products);
  console.log("Diagnostic was read-only.");
 }catch(error){
  process.exitCode=1;
  console.error("Atlas connectivity: FAILED."); console.error("Error:", error instanceof Error ? error.message : "Unknown error");
 }finally{if(conn)await conn.close();}
}
doctor().catch(()=>{process.exitCode=1;console.error("Diagnostic failed without database writes.");});
