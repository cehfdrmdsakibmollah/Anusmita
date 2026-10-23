
import mongoose from "mongoose";
import {dedicatedDb} from "./launch-config";
type Cached={conn:typeof mongoose|null;promise:Promise<typeof mongoose>|null};
const state=globalThis as typeof globalThis & {__anusmitaMongoose?:Cached};
const cache=state.__anusmitaMongoose??(state.__anusmitaMongoose={conn:null,promise:null});
export async function db(){
 const uri=process.env.MONGODB_URI;
 // Guard every database connection, including owner initialization.
 if(!dedicatedDb(uri))throw new Error("Refusing MongoDB connection: expected ANUSMITA Atlas cluster, database and scoped user");
 if(cache.conn)return cache.conn;
 if(!cache.promise)cache.promise=mongoose.connect(uri!,{
  maxPoolSize:10,
  serverSelectionTimeoutMS:10000
 });
 try{cache.conn=await cache.promise;return cache.conn;}
 catch{cache.promise=null;throw new Error("ANUSMITA database connection unavailable. Check credentials and Atlas network access.");}
}
