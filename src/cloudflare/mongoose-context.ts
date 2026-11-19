import mongoose from "mongoose";
import {AsyncLocalStorage} from "node:async_hooks";
import {dedicatedDb} from "../lib/launch-config";
export type DatabaseScope={instance:typeof mongoose;connection?:Promise<typeof mongoose>};
const context=new AsyncLocalStorage<DatabaseScope>();
export function activeMongoose(){return context.getStore()?.instance||mongoose;}
export function newDatabaseScope():DatabaseScope{return {instance:new mongoose.Mongoose() as typeof mongoose};}
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
 const uri=process.env.MONGODB_URI;
 if(!dedicatedDb(uri))throw new Error("Refusing MongoDB connection: expected ANUSMITA Atlas cluster, database and scoped user");
 if(!scope.connection){
  // Populate/ref resolution must use the same connection as the referring model.
  for(const [name,model] of Object.entries(mongoose.models))if(!scope.instance.models[name])scope.instance.model(name,model.schema);
  scope.connection=scope.instance.connect(uri!,{maxPoolSize:2,minPoolSize:0,serverSelectionTimeoutMS:10000,autoIndex:false});
 }
 return scope.connection;
}
