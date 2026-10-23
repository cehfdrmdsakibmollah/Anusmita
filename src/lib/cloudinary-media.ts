export const CLOUD_NAME="oseohmxd";
export function validCloudinaryUrl(url:string){
 try{const u=new URL(url);return u.protocol==="https:"&&u.hostname==="res.cloudinary.com"&&u.pathname.startsWith("/"+CLOUD_NAME+"/image/upload/")&&!u.username&&!u.password;}catch{return false;}
}
