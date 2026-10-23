
import "dotenv/config";
import mongoose from "mongoose";
import {dedicatedDb,launchFlags,ATLAS_HOST,ATLAS_DB,ATLAS_APP_USER} from "../src/lib/launch-config";
import {db} from "../src/lib/db";
import {User,Product} from "../src/lib/models";
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
 try{
  const conn=await db();await conn.connection.db!.admin().ping();
  const [owners,products]=await Promise.all([
   User.countDocuments({role:"owner",active:true}),Product.countDocuments({active:true})
  ]);
  console.log("Atlas connectivity: OK");
  console.log("Active owner account:",owners>0?"YES":"NO");
  console.log("Published products:",products);
  console.log("Diagnostic was read-only.");
 }catch{
  process.exitCode=1;
  console.error("Atlas connectivity: FAILED. Check local IP allowlist, password, DNS and TLS settings.");
 }finally{await mongoose.disconnect();}
}
doctor().catch(()=>{process.exitCode=1;console.error("Diagnostic failed without database writes.");});
