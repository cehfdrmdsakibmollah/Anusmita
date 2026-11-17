import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {afterAll,beforeAll,describe,expect,it,vi} from "vitest";
import {signSession} from "@/lib/auth";
import {initialFunnelBlock} from "@/lib/funnel-pages";
import {Audit,Counter,FunnelPage,FunnelRevision,User} from "@/lib/models";
import {GET as listFunnels,POST as writeFunnel} from "./route";
import {GET as checkMedia,POST as uploadMedia} from "./media/route";
import worker from "../../../../../workers/r2-media/index.mjs";

const session=vi.hoisted(()=>({token:""}));
vi.mock("server-only",()=>({}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>session.token?{value:session.token}:undefined})}));
vi.mock("@/lib/db",()=>({db:async()=>mongoose}));

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
  await Promise.all([Audit,Counter,FunnelPage,FunnelRevision,User].map(model=>model.init()));
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
    blocks:[
     {...initialFunnelBlock("banner"),imageUrl:banner.url},
     {...carousel,slides:carousel.slides.map((item,index)=>index===1?{...item,title:"Edited slide",imageUrl:slide.url}:item)}
    ]
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
});
