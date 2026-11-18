import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {beforeAll,afterAll,describe,it,expect,vi} from "vitest";
const session=vi.hoisted(()=>({token:""}));
vi.mock("server-only",()=>({}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>session.token?{value:session.token}:undefined})}));
vi.mock("@/lib/db",()=>({db:async()=>mongoose}));
import {signSession} from "@/lib/auth";
import {Audit,AuditReview,User,Product} from "@/lib/models";
import {GET} from "./route";
import {GET as details,POST as note} from "./[id]/route";
import {POST as stock} from "../stock/route";
const uri=process.env.FUNNEL_TEST_MONGODB_URI;
const database="anusmita_audit_test_"+randomUUID().replaceAll("-","");
describe.skipIf(!uri)("authenticated audit investigation",()=>{
 beforeAll(async()=>{if(uri!=="mongodb://127.0.0.1:27018/?directConnection=true&replicaSet=funnel-test")throw Error("Dedicated loopback replica required");await mongoose.connect(uri,{dbName:database,serverSelectionTimeoutMS:5000});await Promise.all([Audit,AuditReview,User,Product].map(m=>m.init()));});
 afterAll(async()=>{if(mongoose.connection.name===database){await mongoose.connection.dropDatabase();await mongoose.disconnect();}});
 it("filters real events, redacts details, denies analyst writes and preserves original events",async()=>{
 vi.stubEnv("SESSION_SECRET",randomUUID()+randomUUID());
 const origin="https://deploy-preview-231--anusmita.netlify.app";
 const req=(path:string,body?:unknown)=>new Request(origin+"/api/admin/"+path,{method:body?"POST":"GET",headers:{origin,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
 try{
 expect((await GET(req("audit-logs"))).status).toBe(403);
 const owner=new mongoose.Types.ObjectId(),analyst=new mongoose.Types.ObjectId();
 await User.collection.insertMany([{_id:owner,name:"Demo Owner",email:"owner@example.test",active:true,role:"owner"},{_id:analyst,name:"Demo Analyst",email:"analyst@example.test",active:true,role:"analyst"}]);
 const event=await Audit.create({actorId:owner,action:"stock.adjusted",entity:"Product",entityId:"synthetic-sku",details:{before:{quantity:24,apiSecret:"never-expose"},after:{quantity:20},phone:"01712345678"}});
 const original=JSON.stringify((await Audit.findById(event._id).lean()));
 const params={params:Promise.resolve({id:String(event._id)})};
 session.token=await signSession(String(analyst));
 const result=await GET(req("audit-logs?q=actor:Owner%20module:inventory%20severity:warning"));expect(result.status).toBe(200);const body=await result.json();expect(body.total).toBe(1);expect(body.logs[0]).toMatchObject({severity:"Warning",module:"Inventory",actor:{name:"Demo Owner"}});expect(JSON.stringify(body)).not.toContain("never-expose");
 expect(await (await details(req("audit-logs/x"),params)).json()).toMatchObject({details:null,canInspect:false});
 expect((await note(req("audit-logs/x",{note:"Investigated"}),params)).status).toBe(403);
 session.token=await signSession(String(owner));
 const inspected=await (await details(req("audit-logs/x"),params)).json();expect(inspected.details.before).toEqual({quantity:24,apiSecret:"[REDACTED]"});expect(JSON.stringify(inspected)).not.toContain("never-expose");
 expect((await note(req("audit-logs/x",{note:"Checked warehouse evidence"}),params)).status).toBe(201);
 expect(await AuditReview.countDocuments({eventId:event._id})).toBe(1);expect(JSON.stringify(await Audit.findById(event._id).lean())).toBe(original);
 const product=new mongoose.Types.ObjectId();await Product.collection.insertOne({_id:product,sku:"AUDIT-STOCK",onHand:24,reserved:2});
 expect((await stock(req("stock",{productId:String(product),type:"damage",quantity:-4,note:"Test warehouse damage"}))).status).toBe(200);
 const movement=await Audit.findOne({action:"stock.damage",entityId:String(product)}).lean<any>();expect(movement.details).toMatchObject({before:{onHand:24,reserved:2},after:{onHand:20,reserved:2}});
 }finally{session.token="";vi.unstubAllEnvs();}
 });
});
