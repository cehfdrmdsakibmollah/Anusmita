import mongoose from "mongoose";
import {describe,it,expect} from "vitest";
import {newDatabaseScope,inDatabaseScope,activeMongoose,scopedModel,closeDatabaseScope,cloudflareDb} from "./mongoose-context";
describe("Workers request database ownership",()=>{
 it("keeps concurrent model constructors and sessions on separate request connections",async()=>{
  const Model=scopedModel("WorkerOwnershipTest",new mongoose.Schema({name:String}));
  const scopes=[newDatabaseScope(),newDatabaseScope()];
  try{const results=await Promise.all(scopes.map((scope,i)=>inDatabaseScope(scope,async()=>{await Promise.resolve();const doc=new Model({name:String(i)});return {instance:activeMongoose(),connection:Model.db,documentConnection:doc.constructor.db};})));
  for(let i=0;i<scopes.length;i++){expect(results[i].instance).toBe(scopes[i].instance);expect(results[i].connection).toBe(scopes[i].instance.connection);expect(results[i].documentConnection).toBe(scopes[i].instance.connection);}
  expect(results[0].connection).not.toBe(results[1].connection);expect(activeMongoose()).toBe(mongoose);expect(Model.db).toBe(mongoose.connection);
  }finally{await Promise.all(scopes.map(closeDatabaseScope));}
 });
 it("rejects out-of-request access before attempting a Mongo connection",async()=>{await expect(cloudflareDb()).rejects.toThrow("request scope");});
});
