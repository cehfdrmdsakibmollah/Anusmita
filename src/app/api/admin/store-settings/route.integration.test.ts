import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {beforeAll,afterAll,describe,it,expect,vi} from "vitest";
const session=vi.hoisted(()=>({token:""}));
vi.mock("server-only",()=>({}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>session.token?{value:session.token}:undefined})}));
vi.mock("@/lib/db",()=>({db:async()=>mongoose}));
import {signSession} from "@/lib/auth";
import {Audit,StoreSettings,StoreSettingsRevision,User} from "@/lib/models";
import {defaultStoreSettings} from "@/lib/store-settings";
import {GET,POST} from "./route";
import {POST as restore} from "./rollback/route";

const uri=process.env.FUNNEL_TEST_MONGODB_URI;
const database="anusmita_settings_test_"+randomUUID().replaceAll("-","");
describe.skipIf(!uri)("authenticated settings revision transactions",()=>{
 beforeAll(async()=>{
  if(uri!=="mongodb://127.0.0.1:27018/?directConnection=true&replicaSet=funnel-test")
   throw Error("Dedicated loopback replica set required");
  await mongoose.connect(uri,{dbName:database,serverSelectionTimeoutMS:5000});
  await Promise.all([Audit,StoreSettings,StoreSettingsRevision,User].map(model=>model.init()));
 });
 afterAll(async()=>{
  if(mongoose.connection.name===database){await mongoose.connection.dropDatabase();await mongoose.disconnect();}
 });
 it("requires owner writes, detects stale revisions and restores historical content with audit",async()=>{
  vi.stubEnv("SESSION_SECRET",randomUUID()+randomUUID());
  const origin="https://deploy-preview-229--anusmita.netlify.app";
  const request=(body:unknown)=>new Request(origin+"/api/admin/store-settings",{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(body)});
  try{
   const defaults=defaultStoreSettings({});
   expect((await POST(request(defaults))).status).toBe(403);
   const owner=new mongoose.Types.ObjectId(),admin=new mongoose.Types.ObjectId();
   await User.collection.insertMany([
    {_id:owner,name:"Owner",email:"owner@example.test",active:true,role:"owner"},
    {_id:admin,name:"Admin",email:"admin@example.test",active:true,role:"admin"}
   ]);
   session.token=await signSession(String(admin));
   expect((await POST(request(defaults))).status).toBe(403);
   session.token=await signSession(String(owner));
   expect((await POST(request({...defaults,storeName:"Original Store"}))).status).toBe(200);
   const second={...defaults,revision:1,storeName:"Updated Store",maintenanceEnabled:true};
   expect((await POST(request(second))).status).toBe(200);
   expect((await POST(request(second))).status).toBe(409);
   session.token=await signSession(String(admin));
   expect((await restore(request({revision:2,sourceRevision:1}))).status).toBe(403);
   session.token=await signSession(String(owner));
   const restored=await restore(request({revision:2,sourceRevision:1}));
   expect(restored.status).toBe(200);
   expect(await restored.json()).toMatchObject({revision:3,storeName:"Original Store",maintenanceEnabled:false});
   expect((await restore(request({revision:2,sourceRevision:1}))).status).toBe(409);
   expect((await restore(request({revision:3,sourceRevision:999}))).status).toBe(404);
   expect(await (await GET()).json()).toMatchObject({settings:{revision:3,storeName:"Original Store"}});
   expect(await StoreSettingsRevision.countDocuments()).toBe(3);
   expect(await Audit.countDocuments({action:"store.settings.restored"})).toBe(1);
  }finally{session.token="";vi.unstubAllEnvs();}
 });
});
