/** Restrict image fetching for server-rendered social cards to our owned R2 media endpoint. */
export const trustedOgProductImage=(raw:unknown):string|null=>{
 if(typeof raw!=="string")return null;
 try{
  const url=new URL(raw);
  if(url.protocol!=="https:"||url.hostname!=="anusmita-media.mdsakibmolla545.workers.dev"||url.port||url.username||url.password||url.hash)return null;
  if(!url.pathname.startsWith("/")||url.pathname.includes(".."))return null;
  return url.toString();
 }catch{return null;}
};
