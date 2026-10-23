
export const CLOUD_NAME="oseohmxd";
export function cloudinaryPublicId(url:string):string|null{
 try{
  const u=new URL(url);
  if(u.protocol!=="https:"||u.hostname!=="res.cloudinary.com"||u.username||u.password||u.search||u.hash)return null;
  const prefix="/"+CLOUD_NAME+"/image/upload/";
  if(!u.pathname.startsWith(prefix))return null;
  const path=u.pathname.slice(prefix.length);
  const match=path.match(/^v\d+\/(anusmita\/(?:products|drive)\/[\w/-]+)\.(?:jpg|jpeg|png|webp|avif)$/i);
  return match?match[1]:null;
 }catch{return null;}
}
export function validCloudinaryUrl(url:string){return cloudinaryPublicId(url)!==null;}
