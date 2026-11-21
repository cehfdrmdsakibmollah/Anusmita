
export const ATLAS_HOST="portfolio.tis5sjm.mongodb.net";
export const ATLAS_DB="anusmita";
export const ATLAS_APP_USER="anusmita_app";
export const STAGING_ATLAS_HOST="anusmita.jvvjo1k.mongodb.net";
export type StoreMode="catalog"|"live";
export function storeMode(value?:string):StoreMode{return value==="live"?"live":"catalog";}
export function isProductionUrl(raw?:string):boolean{
 if(!raw)return false;
 try{const u=new URL(raw);return u.protocol==="https:"&&Boolean(u.hostname)&&u.hostname!=="localhost"&&!u.hostname.endsWith(".localhost")&&!u.username&&!u.password&&!u.search&&!u.hash;}
 catch{return false;}
}
/** Requires the actual ANUSMITA cluster, database, and scoped application user. */
export function dedicatedDb(uri?:string):boolean{
 if(!uri)return false;
 try{
  const u=new URL(uri);
  return u.protocol==="mongodb+srv:"&&u.hostname.toLowerCase()===ATLAS_HOST&&
   decodeURIComponent(u.pathname.slice(1))===ATLAS_DB&&
   decodeURIComponent(u.username)===ATLAS_APP_USER&&
   Boolean(u.password)&&!u.password.toLowerCase().includes("replace")&&!u.password.startsWith("%3C");
 }catch{return false;}
}
/** Staging-only safe classification. Never return URI components or credentials. */
export function dedicatedDbIssue(uri?:string):string{
 if(!uri)return "DB_URI_MISSING";
 try{
  const u=new URL(uri);
  if(u.protocol!=="mongodb+srv:")return "DB_URI_SCHEME_MISMATCH";
  if(u.hostname.toLowerCase()!==ATLAS_HOST)return "DB_URI_HOST_MISMATCH";
  if(decodeURIComponent(u.username)!==ATLAS_APP_USER)return "DB_URI_USERNAME_MISMATCH";
  if(decodeURIComponent(u.pathname.slice(1))!==ATLAS_DB)return "DB_URI_DATABASE_MISMATCH";
  if(!u.password||u.password.toLowerCase().includes("replace")||u.password.startsWith("%3C"))return "DB_URI_PASSWORD_NOT_CONFIGURED";
  return "DB_URI_VALID";
 }catch{return "DB_URI_MALFORMED";}
}
/** Staging is strictly isolated from production, even with valid production credentials. */
export function dedicatedStagingDb(uri?:string):boolean{
 if(!uri)return false;
 try{
  const u=new URL(uri);
  return u.protocol==="mongodb+srv:"&&u.hostname.toLowerCase()===STAGING_ATLAS_HOST&&
   decodeURIComponent(u.pathname.slice(1))===ATLAS_DB&&
   decodeURIComponent(u.username)===ATLAS_APP_USER&&
   Boolean(u.password)&&!u.password.toLowerCase().includes("replace")&&!u.password.startsWith("%3C");
 }catch{return false;}
}
export function stagingDbIssue(uri?:string):string{
 if(!uri)return "DB_URI_MISSING";
 try{
  const u=new URL(uri);
  if(u.protocol!=="mongodb+srv:")return "DB_URI_SCHEME_MISMATCH";
  if(u.hostname.toLowerCase()!==STAGING_ATLAS_HOST)return "STAGING_DB_HOST_MISMATCH";
  if(decodeURIComponent(u.username)!==ATLAS_APP_USER)return "DB_URI_USERNAME_MISMATCH";
  if(decodeURIComponent(u.pathname.slice(1))!==ATLAS_DB)return "DB_URI_DATABASE_MISMATCH";
  if(!u.password||u.password.toLowerCase().includes("replace")||u.password.startsWith("%3C"))return "DB_URI_PASSWORD_NOT_CONFIGURED";
  return "DB_URI_VALID";
 }catch{return "DB_URI_MALFORMED";}
}
export type LaunchEnvironment={
 [key:string]:string|undefined;
 STORE_MODE?:string;MONGODB_URI?:string;SESSION_SECRET?:string;
 NEXT_PUBLIC_SITE_URL?:string;CLOUDINARY_API_KEY?:string;CLOUDINARY_API_SECRET?:string;
 CLOUDINARY_CLOUD_NAME?:string;
};
export function launchFlags(env:LaunchEnvironment){
 return {
  mode:storeMode(env.STORE_MODE),
  dedicatedDatabase:dedicatedDb(env.MONGODB_URI),
  sessionSecret:Boolean(env.SESSION_SECRET&&env.SESSION_SECRET.length>=32&&!env.SESSION_SECRET.startsWith("replace-")),
  productionUrl:isProductionUrl(env.NEXT_PUBLIC_SITE_URL),
  cloudinaryConfigured:Boolean(env.CLOUDINARY_API_KEY&&env.CLOUDINARY_API_SECRET&&
    !env.CLOUDINARY_API_KEY.startsWith("replace-")&&!env.CLOUDINARY_API_SECRET.startsWith("replace-")),
 };
}
export function checkoutEnabled(env:LaunchEnvironment):boolean{
 const x=launchFlags(env);
 return x.mode==="live"&&x.dedicatedDatabase&&x.sessionSecret&&x.productionUrl;
}
