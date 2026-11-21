import mongoose from "mongoose";
import {AsyncLocalStorage} from "node:async_hooks";
import {ATLAS_DB,dedicatedDb,dedicatedStagingDb,isStagingRuntime} from "../lib/launch-config";
type WorkerDbBindings={MONGODB_URI?:string;ANUSMITA_STAGING_RUNTIME?:string;NEXT_PUBLIC_SITE_URL?:string};
export type DatabaseScope={instance:typeof mongoose;connection?:Promise<typeof mongoose>;bindings:WorkerDbBindings};
const context=new AsyncLocalStorage<DatabaseScope>();
export function activeMongoose(){return context.getStore()?.instance||mongoose;}
export function newDatabaseScope(rawBindings:unknown):DatabaseScope{
 const candidate=rawBindings&&typeof rawBindings==="object"?rawBindings as Record<string,unknown>:{};
 const pick=(name:string)=>typeof candidate[name]==="string"?candidate[name] as string:undefined;
 return {instance:new mongoose.Mongoose() as typeof mongoose,bindings:{
   MONGODB_URI:pick("MONGODB_URI"),
   ANUSMITA_STAGING_RUNTIME:pick("ANUSMITA_STAGING_RUNTIME"),
   NEXT_PUBLIC_SITE_URL:pick("NEXT_PUBLIC_SITE_URL")
 }};
}
export function inDatabaseScope<T>(scope:DatabaseScope,task:()=>T):T{return context.run(scope,task);}
export async function closeDatabaseScope(scope:DatabaseScope){await scope.instance.disconnect();}
/** Preserve Node's existing models; only Workers resolve models against request-owned connections. */
export function scopedModel(name:string,schema:mongoose.Schema):any{
 const base=mongoose.models[name]||mongoose.model(name,schema);
 const current=()=>{const instance=activeMongoose();return instance===mongoose?base:instance.models[name]||instance.model(name,schema);};
 return new Proxy(base,{
  get(target,key){const descriptor=Reflect.getOwnPropertyDescriptor(target,key);if(descriptor&&!descriptor.configurable&&"writable" in descriptor&&!descriptor.writable)return Reflect.get(target,key);const model=current();const value=Reflect.get(model,key,model);return typeof value==="function"&&key!=="constructor"?value.bind(model):value;},
  construct(_target,args){return Reflect.construct(current(),args);}
 });
}
export async function cloudflareDb(){
 const scope=context.getStore();if(!scope)throw new Error("Workers database access requires request scope");
 // In Workers the entrypoint receives the *actual* request bindings. Do not rely
 // on Node process.env, which may be empty or build-time substituted by vinext.
 const uri=scope.bindings.MONGODB_URI;
 const isStaging=isStagingRuntime(scope.bindings);
 if(!(isStaging?dedicatedStagingDb(uri):dedicatedDb(uri)))
  throw new Error("Refusing MongoDB connection: expected approved environment-specific Atlas cluster, database and scoped user");
 if(!scope.connection){
  // Populate/ref resolution must use the same connection as the referring model.
  for(const [name,model] of Object.entries(mongoose.models))if(!scope.instance.models[name])scope.instance.model(name,model.schema);
  scope.connection=scope.instance.connect(uri!,{dbName:isStaging?ATLAS_DB:undefined,maxPoolSize:2,minPoolSize:0,serverSelectionTimeoutMS:10000,autoIndex:false});
 }
 return scope.connection;
}
