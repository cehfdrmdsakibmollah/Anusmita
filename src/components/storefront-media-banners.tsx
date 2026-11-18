import Link from "next/link";
import {BannerMedia} from "@/lib/models";
import {bannerMedia} from "@/lib/banner-media";
export default async function StorefrontMediaBanners(){
 const now=new Date().toISOString();
 const rows=await BannerMedia.find({status:"published",slot:{$in:["HOME_HERO","PROMO_STRIP"]},
  $and:[{$or:[{start:""},{start:{$lte:now}}]},{$or:[{end:""},{end:{$gt:now}}]}]}).sort({updatedAt:-1}).limit(10).lean();
 const banners=rows.map(row=>bannerMedia.safeParse({id:row.id,revision:row.revision,title:row.title,desktopUrl:row.desktopUrl,mobileUrl:row.mobileUrl,alt:row.alt,target:row.target,cta:row.cta,slot:row.slot,start:row.start,end:row.end,focalX:row.focalX,focalY:row.focalY,scrim:row.scrim,status:row.status})).filter(result=>result.success).map(result=>result.data!);
 return <>{banners.map(banner=>{
  const content=<div style={{position:"relative",overflow:"hidden",borderRadius:12}}>
   <picture>{banner.mobileUrl&&<source media="(max-width: 700px)" srcSet={banner.mobileUrl}/>}<img src={banner.desktopUrl} alt={banner.alt} style={{display:"block",width:"100%",height:banner.slot==="PROMO_STRIP"?120:"auto",objectFit:"cover",objectPosition:banner.focalX+"% "+banner.focalY+"%"}}/></picture>
   <div style={{position:"absolute",inset:0,background:"linear-gradient(transparent,rgba(0,0,0,"+banner.scrim/100+"))",pointerEvents:"none"}}/>
   {banner.cta&&<span style={{position:"absolute",bottom:20,left:24,background:"#851138",color:"white",padding:"10px 18px",borderRadius:6}}>{banner.cta}</span>}
  </div>;
  return <section key={banner.id} style={{maxWidth:1180,margin:"16px auto"}}>{banner.target?<Link href={banner.target}>{content}</Link>:content}</section>;
 })}</>;
}
