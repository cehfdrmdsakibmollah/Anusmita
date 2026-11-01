import {z} from "zod";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,ProductSeo,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const id=z.string().regex(/^[a-f0-9]{24}$/i);
const schema=z.object({productId:id,revision:z.number().int().nonnegative(),metaTitle:z.string().trim().max(70),metaDescription:z.string().trim().max(160),focusKeyword:z.string().trim().max(80),keywords:z.array(z.string().trim().min(1).max(80)).max(15),imageAltTexts:z.array(z.string().trim().max(160)).max(30),ogTitle:z.string().trim().max(70),ogDescription:z.string().trim().max(160),robotsIndex:z.boolean(),robotsFollow:z.boolean(),schemaEnabled:z.boolean()}).strict();
export async function GET(req:Request){
 try{await authorize(["owner","admin","inventory","purchasing"],"products.view");const productId=new URL(req.url).searchParams.get("productId")||"";if(!id.safeParse(productId).success)throw new HttpError(400,"Valid product ID required");await db();
 const p=await Product.findById(productId).select("name slug sku brand category description active imageUrls").lean<any>();if(!p)throw new HttpError(404,"Product not found");
 const doc=await ProductSeo.findOne({productId}).lean<any>();
 return Response.json({product:{id:productId,name:p.name,slug:p.slug,sku:p.sku,category:p.category,brand:p.brand,description:p.description,active:p.active,imageUrls:p.imageUrls||[]},seo:{revision:doc?.revision||0,metaTitle:doc?.metaTitle||"",metaDescription:doc?.metaDescription||"",focusKeyword:doc?.focusKeyword||"",keywords:doc?.keywords||[],imageAltTexts:doc?.imageAltTexts||[],ogTitle:doc?.ogTitle||"",ogDescription:doc?.ogDescription||"",robotsIndex:doc?.robotsIndex??true,robotsFollow:doc?.robotsFollow??true,schemaEnabled:doc?.schemaEnabled??true}},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{assertOrigin(req);const actor=await authorize(["owner","admin","inventory"],"products.edit");const data=schema.parse(await req.json());await db();
 const p=await Product.findById(data.productId).select("imageUrls").lean<any>();if(!p)throw new HttpError(404,"Product not found");
 if(data.imageAltTexts.length>(p.imageUrls||[]).length)throw new HttpError(400,"Image alt text count exceeds actual product images");
 const session=await mongoose.startSession();let revision=0;
 try{await session.withTransaction(async()=>{
 const old=await ProductSeo.findOne({productId:data.productId}).session(session);
 if((old?.revision||0)!==data.revision)throw new HttpError(409,"SEO was changed by someone else; reload before saving");
 const row=await ProductSeo.findOneAndUpdate({productId:data.productId,revision:data.revision},{$set:{metaTitle:data.metaTitle,metaDescription:data.metaDescription,focusKeyword:data.focusKeyword,keywords:[...new Set(data.keywords.map(x=>x.toLowerCase()))],imageAltTexts:data.imageAltTexts,ogTitle:data.ogTitle,ogDescription:data.ogDescription,robotsIndex:data.robotsIndex,robotsFollow:data.robotsFollow,schemaEnabled:data.schemaEnabled,updatedBy:actor.id},$inc:{revision:1}},{upsert:!old,new:true,session,runValidators:true});if(!row)throw new HttpError(409,"Concurrent SEO edit");revision=row.revision;
 await Audit.create([{actorId:actor.id,action:"product.seo.updated",entity:"ProductSeo",entityId:String(row._id),details:{productId:data.productId,revision}}],{session});
 });}finally{await session.endSession();}
 return Response.json({saved:true,revision});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent SEO edit"},{status:409});return apiError(e);}
}
