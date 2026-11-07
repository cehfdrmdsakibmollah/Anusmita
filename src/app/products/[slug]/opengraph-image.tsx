import {ImageResponse} from "next/og";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const alt="ANUSMITA product social sharing image";
export const size={width:1200,height:630};
export const contentType="image/png";

const trustedMediaHost="anusmita-media.mdsakibmolla545.workers.dev";
export function trustedOgProductImage(raw:unknown):string|null{
 if(typeof raw!=="string")return null;
 try{
  const url=new URL(raw);
  if(url.protocol!=="https:"||url.hostname!==trustedMediaHost||url.port||url.username||url.password||url.hash)return null;
  if(!url.pathname.startsWith("/")||url.pathname.includes(".."))return null;
  return url.toString();
 }catch{return null;}
}
async function imageData(raw:unknown):Promise<string|null>{
 const url=trustedOgProductImage(raw);
 if(!url)return null;
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(2500),cache:"no-store"});
  if(!response.ok)return null;
  const type=response.headers.get("content-type")?.split(";")[0]||"";
  if(!["image/png","image/jpeg","image/webp"].includes(type))return null;
  const length=Number(response.headers.get("content-length")||0);
  if(length>3_000_000)return null;
  const data=await response.arrayBuffer();
  if(data.byteLength>3_000_000)return null;
  return "data:"+type+";base64,"+Buffer.from(data).toString("base64");
 }catch{return null;}
}
export default async function OpenGraphImage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 let product:{name:string;brand?:string;category?:string;pricePaisa?:number;imageUrls?:string[]}|null=null;
 if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug.length<=120&&process.env.MONGODB_URI){
  try{await db();product=await Product.findOne({slug,active:true,archived:{$ne:true}}).select("name brand category pricePaisa imageUrls -_id").lean<any>();}
  catch{/* Brand-only fallback when the catalogue cannot be read. */}
 }
 const photo=product?await imageData(product.imageUrls?.[0]):null;
 const name=(product?.name||"Discover ANUSMITA").slice(0,125);
 const brand=(product?.brand||"ANUSMITA").slice(0,65);
 const category=(product?.category||"FASHION · JEWELLERY · BEAUTY").slice(0,75);
 const price=product&&Number(product.pricePaisa)>0?
  new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(Number(product.pricePaisa)/100)+" BDT":null;
 return new ImageResponse(
  <div style={{width:"100%",height:"100%",display:"flex",position:"relative",overflow:"hidden",background:"#fff1f2",color:"#561433",fontFamily:"sans-serif"}}>
   <div style={{display:"flex",position:"absolute",inset:0,background:"linear-gradient(125deg,#fff8f6,#ffe5e8 58%,#eac5d1)"}}/>
   <div style={{display:"flex",flexDirection:"column",padding:"57px 64px",width:photo?"66%":"100%",height:"100%",justifyContent:"space-between",position:"relative"}}>
    <div style={{display:"flex",flexDirection:"column"}}>
     <div style={{fontSize:43,fontWeight:700,letterSpacing:2}}>ANUSMITA</div>
     <div style={{fontSize:16,letterSpacing:3,color:"#a12d58",marginTop:8}}>FASHION · JEWELLERY · BEAUTY</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:21}}>
     <div style={{fontSize:19,letterSpacing:2,color:"#9d2356"}}>{category.toUpperCase()}</div>
     <div style={{fontSize:name.length>55?36:49,fontWeight:700,letterSpacing:-1,lineHeight:1.12,overflow:"hidden",maxHeight:176}}>{name}</div>
     <div style={{fontSize:22,color:"#8d3158"}}>{brand}</div>
     {price&&<div style={{display:"flex",fontSize:29,fontWeight:700,color:"#b21653"}}>{price}</div>}
    </div>
    <div style={{fontSize:16,letterSpacing:2,color:"#8c4961"}}>ANUSMITA.NETLIFY.APP</div>
   </div>
   {photo&&<div style={{display:"flex",width:"38%",height:"100%",position:"absolute",right:0,top:0,overflow:"hidden",background:"#f7dee4"}}>
    <img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
   </div>}
  </div>,{...size}
 );
}
