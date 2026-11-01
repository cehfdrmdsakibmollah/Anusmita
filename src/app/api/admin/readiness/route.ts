
import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {launchFlags,checkoutEnabled} from "@/lib/launch-config";
import {db} from "@/lib/db";
import {User,Product} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Check={key:string;label:string;ready:boolean;detail:string;required:boolean};
export async function GET(){
 try{
  await authorizePermission(["owner","admin"],"settings.view");
  const flags=launchFlags(process.env);
  const checks:Check[]=[
   {key:"mode",label:"Checkout launch switch",ready:flags.mode==="live",required:true,detail:flags.mode==="live"?"Explicit live mode":"Catalog mode; public orders are intentionally disabled"},
   {key:"databaseName",label:"Separate ANUSMITA database",ready:flags.dedicatedDatabase,required:true,detail:flags.dedicatedDatabase?"Dedicated database name configured":"Use database /anusmita; never connect ANUSMITA to the Portfolio database"},
   {key:"session",label:"Owner session secret",ready:flags.sessionSecret,required:true,detail:flags.sessionSecret?"Configured (value hidden)":"Set a random 32+ character SESSION_SECRET privately"},
   {key:"domain",label:"Public HTTPS website address",ready:flags.productionUrl,required:true,detail:flags.productionUrl?"Configured (value hidden)":"Set NEXT_PUBLIC_SITE_URL to your actual HTTPS domain"},
   {key:"cloudinary",label:"Cloudinary image uploads",ready:flags.cloudinaryConfigured,required:false,detail:flags.cloudinaryConfigured?"Credentials supplied (provider not yet tested)":"Optional: add Cloudinary API credentials in server environment settings"},
  ];
  let ownerCount=0,published=0,dbOk=false;
  if(flags.dedicatedDatabase){
   try{
    const connection=await db();
    await connection.connection.db!.admin().ping();
    dbOk=true;
    [ownerCount,published]=await Promise.all([
     User.countDocuments({role:"owner",active:true}),
     Product.countDocuments({active:true})
    ]);
   }catch{dbOk=false;}
  }
  checks.push({key:"dbConnection",label:"Database reachable",ready:dbOk,required:true,
    detail:dbOk?"Dedicated Atlas database connection successful":"Database unavailable or unconfigured"});
  checks.push({key:"owner",label:"Active owner account",ready:dbOk&&ownerCount>0,required:true,
    detail:dbOk&&ownerCount>0?"An active owner account exists":"Create the first owner securely using npm run owner:create"});
  checks.push({key:"products",label:"Published, reviewed products",ready:dbOk&&published>0,required:false,
    detail:dbOk?published+" product(s) published":"Product count unavailable"});
  // No claims here about successful payment/courier tests, backup restore, or hosting suitability.
  return Response.json({
   mode:flags.mode,checkoutEnabled:checkoutEnabled(process.env)&&dbOk&&ownerCount>0,
   checks,requiredPassed:checks.filter(x=>x.required&&x.ready).length,
   requiredTotal:checks.filter(x=>x.required).length,
   note:"Operational checks only. Payment, courier, legal/hosting compliance, backup and real-device testing must be performed separately."
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
