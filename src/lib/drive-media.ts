
import mediaIndex from "../data/drive-media.json";

export type DriveMediaItem = (typeof mediaIndex.images)[number];
export const driveImages: ReadonlyArray<DriveMediaItem> = mediaIndex.images;
const validId=/^[A-Za-z0-9_-]{12,120}$/;

export function validDriveId(id:string):boolean { return validId.test(id); }
export function driveImageUrl(id:string,size:320|1200=1200):string {
 if(!validDriveId(id))throw new Error("Invalid Google Drive image identifier");
 return "https://drive.google.com/thumbnail?id="+encodeURIComponent(id)+"&sz=w"+size;
}
export function driveViewUrl(id:string):string {
 if(!validDriveId(id))throw new Error("Invalid Google Drive image identifier");
 return "https://drive.google.com/file/d/"+encodeURIComponent(id)+"/view";
}
export function parseDriveImageId(url:string):string|null {
 try{
  const value=new URL(url);
  if(value.protocol!=="https:"||value.hostname!=="drive.google.com")return null;
  if(value.pathname==="/thumbnail"){
   const id=value.searchParams.get("id")||"";
   return validDriveId(id)?id:null;
  }
  const found=value.pathname.match(/^\/file\/d\/([\w-]+)\/(?:view|preview)?\/?$/);
  return found&&validDriveId(found[1])?found[1]:null;
 }catch{return null;}
}
export function findDriveMedia(id:string):DriveMediaItem|undefined{
 return driveImages.find(item=>item.id===id);
}
