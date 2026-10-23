
export type StoreMode="catalog"|"live";
export function storeMode(value?:string):StoreMode{return value==="live"?"live":"catalog";}
export function isProductionUrl(raw?:string):boolean{
 if(!raw)return false;
 try{
  const u=new URL(raw);
  return u.protocol==="https:"&&Boolean(u.hostname)&&u.hostname!=="localhost"&&!u.hostname.endsWith(".localhost")&&!u.username&&!u.password&&!u.search&&!u.hash;
 }catch{return false;}
}
export function dedicatedDb(uri?:string):boolean{
 if(!uri)return false;
 try{
  const u=new URL(uri);
  if(!["mongodb:","mongodb+srv:"].includes(u.protocol))return false;
  const db=decodeURIComponent(u.pathname.slice(1));
  return db==="anusmita";
 }catch{return false;}
}
export type LaunchEnvironment={
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
