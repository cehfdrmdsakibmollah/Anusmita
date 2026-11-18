import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {afterAll,beforeAll,describe,expect,it,vi} from "vitest";
import {signSession} from "@/lib/auth";
import {initialFunnelBlock} from "@/lib/funnel-pages";
import {Audit,Counter,FunnelExposure,FunnelPage,FunnelRevision,Order,Product,StockMovement,User} from "@/lib/models";
import {GET as listFunnels,POST as writeFunnel} from "./route";
import {GET as checkMedia,POST as uploadMedia} from "./media/route";
import {POST as checkout} from "../../checkout/route";
import {POST as enableAttribution,DELETE as disableAttribution} from "../../funnel-attribution/route";
import {POST as startExperiment,GET as reportExperiment} from "./experiments/route";
import {POST as enterExperiment} from "../../funnel-experiment/route";
import {GET as readAnalytics} from "./analytics/route";
import {funnelAttributionCookie} from "@/lib/funnel-attribution";
import worker from "../../../../../workers/r2-media/index.mjs";

const session=vi.hoisted(()=>({token:"",attribution:""}));
vi.mock("server-only",()=>({}));
vi.mock("next/headers",()=>({cookies:async()=>({get:(name:string)=>{const value=name===funnelAttributionCookie?session.attribution:session.token;return value?{value}:undefined;}})}));
vi.mock("@/lib/db",()=>({db:async()=>mongoose}));
vi.mock("@/lib/launch-config",()=>({checkoutEnabled:()=>true}));

const uri=process.env.FUNNEL_TEST_MONGODB_URI;
const allowedUri="mongodb://127.0.0.1:27018/?directConnection=true&replicaSet=funnel-test";
const database="anusmita_funnel_test_"+randomUUID().replaceAll("-","");
const origin="https://deploy-preview-226--anusmita.netlify.app";
const endpoint="https://anusmita-media.mdsakibmolla545.workers.dev";
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFJkAAAAASUVORK5CYII=","base64");

describe.skipIf(!uri)("authenticated funnel upload and publishing with isolated storage",()=>{
 beforeAll(async()=>{
  if(uri!==allowedUri)throw new Error("Funnel integration tests require the dedicated loopback replica set");
  await mongoose.connect(uri,{dbName:database,serverSelectionTimeoutMS:5000});
  await Promise.all([Audit,Counter,FunnelExposure,FunnelPage,FunnelRevision,Order,Product,StockMovement,User].map(model=>model.init()));
 });
 afterAll(async()=>{
  if(mongoose.connection.name===database){
   await mongoose.connection.dropDatabase();
   await mongoose.disconnect();
  }
 });

 it("uploads independent images, publishes them, and reloads the saved campaign",async()=>{
  const secret=randomUUID()+randomUUID();
  vi.stubEnv("SESSION_SECRET",secret);
  vi.stubEnv("R2_MEDIA_URL",endpoint);
  vi.stubEnv("R2_MEDIA_SECRET",secret);
  vi.stubEnv("MEDIA_DAILY_UPLOAD_LIMIT","10");
  const images=new Map<string,Uint8Array>();
  const env={UPLOAD_SECRET:secret,MEDIA:{
   list:async()=>({objects:[],truncated:false}),
   put:async(key:string,bytes:Uint8Array)=>{images.set(key,bytes);return {};},
   get:async(key:string)=>{
    const bytes=images.get(key);
    return bytes?{body:bytes,httpEtag:'"test-image"',writeHttpMetadata:(headers:Headers)=>headers.set("Content-Type","image/png")}:null;
   }
  }};
  vi.stubGlobal("fetch",async(url:string,init?:RequestInit)=>{
   if(new URL(url).origin!==endpoint)throw new Error("Unexpected outbound destination");
   return worker.fetch(new Request(url,init),env);
  });
  const slug="test-funnel";
  function upload(){
   const body=new FormData();
   body.set("slug",slug);
   body.set("file",new File([png],"pixel.png",{type:"image/png"}));
   return uploadMedia(new Request(origin+"/api/admin/funnel-pages/media",{method:"POST",headers:{origin},body}));
  }
  try{
   expect((await upload()).status).toBe(403);
   expect(images.size).toBe(0);
   const ownerId=new mongoose.Types.ObjectId();
   await User.collection.insertOne({_id:ownerId,name:"Test Owner",email:"funnel@example.test",role:"owner",active:true});
   session.token=await signSession(String(ownerId));
   expect(await (await checkMedia()).json()).toMatchObject({ready:true});

   const bannerUpload=await upload();
   expect(bannerUpload.status).toBe(201);
   const banner=await bannerUpload.json();
   const slideUpload=await upload();
   expect(slideUpload.status).toBe(201);
   const slide=await slideUpload.json();
   expect(slide.url).not.toBe(banner.url);

   const carousel=initialFunnelBlock("carousel");
   const content={
    title:"Funnel integration test",
    blocks:[{...initialFunnelBlock("group"),style:{gridColumns:"2"},children:[
     {...initialFunnelBlock("banner"),imageUrl:banner.url,responsiveStyle:{tablet:{padding:"32px"},mobile:{padding:"12px",fontSize:"22px"}}},
     {...carousel,slides:carousel.slides.map((item,index)=>index===1?{...item,title:"Edited slide",imageUrl:slide.url}:item)}
    ]}]
   };
   function save(mode:"draft"|"publish",revision:number){
    return writeFunnel(new Request(origin+"/api/admin/funnel-pages",{method:"POST",headers:{origin,"Content-Type":"application/json"},
     body:JSON.stringify({slug,revision,mode,content})}));
   }

   const draft=await save("draft",0);
   expect(draft.status).toBe(200);
   expect(await draft.json()).toMatchObject({revision:1,published:false});
   const published=await save("publish",1);
   expect(published.status).toBe(200);
   expect(await published.json()).toMatchObject({revision:2,published:true});
   expect((await save("publish",1)).status).toBe(409);

   const reloaded=await (await listFunnels()).json();
   expect(reloaded.pages[0]).toMatchObject({slug,revision:2,published:true,blocks:content.blocks});
   const publicPage=await FunnelPage.findOne({slug,published:true,archived:{$ne:true}}).lean();
   expect(publicPage).toMatchObject({blocks:content.blocks});
   for(const media of [banner,slide]){
    const response=await fetch(media.url);
    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(png);
   }
   expect(await FunnelRevision.countDocuments({slug})).toBe(2);
   expect(await Audit.countDocuments({actorId:ownerId,action:"funnel.media.upload"})).toBe(2);
   expect(await Audit.countDocuments({actorId:ownerId,action:"funnel.page.publish"})).toBe(1);
  }finally{
   session.token="";
   vi.unstubAllGlobals();
   vi.unstubAllEnvs();
  }
 });
 it("attributes only opted-in website checkouts and reports their actual order states",async()=>{
  vi.stubEnv("SESSION_SECRET",randomUUID()+randomUUID());
  const ownerId=new mongoose.Types.ObjectId();
  const slug="attribution-campaign";
  const url=origin+"/api/funnel-attribution?slug="+slug;
  const consentRequest=(method:string)=>new Request(url,{method,headers:{origin}});
  const analyticsRequest=new Request(origin+"/api/admin/funnel-pages/analytics?slug="+slug+"&days=7");
  try{
   expect((await readAnalytics(analyticsRequest)).status).toBe(403);
   expect((await enableAttribution(consentRequest("POST"))).status).toBe(404);
   await User.collection.insertOne({_id:ownerId,name:"Analytics Owner",email:"analytics@example.test",role:"owner",active:true});
   await FunnelPage.create({slug,title:"Attribution campaign",published:true,updatedBy:ownerId});
   const product=await Product.create({name:"Sample Product",slug:"sample-product",sku:"SAMPLE-1",category:"Sample",pricePaisa:10000,costPaisa:5000,onHand:10,active:true});
   expect((await enableAttribution(new Request(url,{method:"POST",headers:{origin:"https://other.example"}}))).status).toBe(403);
   const enabled=await enableAttribution(consentRequest("POST"));
   expect(enabled.status).toBe(200);
   const cookie=enabled.headers.get("set-cookie")??"";
   expect(cookie).toContain("HttpOnly");
   expect(cookie).toContain("Max-Age=86400");
   session.attribution=cookie.split(";",1)[0].slice(funnelAttributionCookie.length+1);
   expect(session.attribution).toBeTruthy();

   const orderInput={items:[{productId:String(product._id),quantity:1}],customer:{
    name:"Sample Shopper",phone:"01700000000",district:"Dhaka",area:"Dhanmondi",address:"Sample house and road"
   },paymentMethod:"cod"};
   const place=(key:string)=>checkout(new Request(origin+"/api/checkout",{method:"POST",headers:{origin,
    "Content-Type":"application/json","Idempotency-Key":key},body:JSON.stringify(orderInput)}));
   const first=await place("funnel-test-order-001");
   expect(first.status).toBe(201);
   const {id}=await first.json();
   await Order.updateOne({_id:id},{$set:{orderStatus:"delivered"}});
   session.attribution+="invalid";
   expect((await place("funnel-test-order-002")).status).toBe(201);
   expect(await (await place("funnel-test-order-001")).json()).toMatchObject({id});
   expect((await disableAttribution(consentRequest("DELETE"))).headers.get("set-cookie")).toContain("Max-Age=0");

   session.token=await signSession(String(ownerId));
   const report=await readAnalytics(analyticsRequest);
   expect(report.status).toBe(200);
   expect(await report.json()).toEqual({orders:1,delivered:1,cancelledOrReturned:0});
  }finally{
   session.token="";
   session.attribution="";
   vi.unstubAllEnvs();
  }
 });

 it("measures consented A/B assignments and counts repeat orders once per assignment",async()=>{
  vi.stubEnv("SESSION_SECRET",randomUUID()+randomUUID());
  const ownerId=new mongoose.Types.ObjectId();
  const campaigns=["experiment-control","experiment-variant"];
  const adminUrl=origin+"/api/admin/funnel-pages/experiments";
  function begin(){
   return startExperiment(new Request(adminUrl+"?a="+campaigns[0]+"&b="+campaigns[1],{method:"POST",headers:{origin}}));
  }
  try{
   expect((await begin()).status).toBe(403);
   await User.collection.insertOne({_id:ownerId,name:"Experiment Owner",email:"experiment@example.test",role:"owner",active:true});
   session.token=await signSession(String(ownerId));
   expect((await begin()).status).toBe(409);
   await FunnelPage.create(campaigns.map(slug=>({slug,title:slug,published:true,updatedBy:ownerId})));
   const created=await begin();
   expect(created.status).toBe(201);
   const {token}=await created.json();
   const entry=(allow:string)=>enterExperiment(new Request(origin+"/api/funnel-experiment?"+new URLSearchParams({token,allow}),
    {method:"POST",headers:{origin}}));
   const untracked=await entry("no");
   expect(untracked.status).toBe(200);
   expect(await FunnelExposure.countDocuments()).toBe(0);
   const tracked=await entry("yes");
   expect(tracked.status).toBe(200);
   const {url}=await tracked.json();
   session.attribution=(tracked.headers.get("set-cookie")??"").split(";",1)[0].slice(funnelAttributionCookie.length+1);
   expect(await (await entry("yes")).json()).toEqual({url});
   expect(await FunnelExposure.countDocuments()).toBe(1);

   const product=await Product.create({name:"Experiment Product",slug:"experiment-product",sku:"AB-SKU-1",category:"Sample",pricePaisa:10000,costPaisa:5000,onHand:10,active:true});
   const body=JSON.stringify({items:[{productId:String(product._id),quantity:1}],customer:{
    name:"Sample Shopper",phone:"01700000000",district:"Dhaka",area:"Dhanmondi",address:"Sample house and road"
   },paymentMethod:"cod"});
   for(const key of ["experiment-order-001","experiment-order-002"]){
    const response=await checkout(new Request(origin+"/api/checkout",{method:"POST",headers:{origin,
     "Content-Type":"application/json","Idempotency-Key":key},body}));
    expect(response.status).toBe(201);
   }
   const result=await reportExperiment(new Request(adminUrl+"?"+new URLSearchParams({token})));
   expect(result.status).toBe(200);
   const slug=url.slice("/funnel/".length);
   expect(await result.json()).toEqual({variants:campaigns.map(item=>({slug:item,assignments:Number(item===slug),converting:Number(item===slug)}))});
  }finally{
   session.token="";
   session.attribution="";
   vi.unstubAllEnvs();
  }
 });

});
