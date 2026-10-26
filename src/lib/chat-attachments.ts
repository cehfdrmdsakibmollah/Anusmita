export const MAX_PHOTOS=3;
export const MAX_PHOTO_BYTES=5*1024*1024;
export function photoError(file:{size:number;type:string}){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'Choose a JPG, PNG or WebP image.';
 if(file.size===0||file.size>MAX_PHOTO_BYTES)return 'Each image must be between 1 byte and 5 MB.';
 return null;
}
export type ChatPhoto={id:string;url:string;file:File};
// Decode locally, limit memory, remove metadata and keep only a resized raster.
export async function preparePhoto(file:File):Promise<ChatPhoto>{
 const error=photoError(file);if(error)throw new Error(error);
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>24000000)throw new Error('Please choose an image smaller than 24 megapixels.');
  const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image preview is unavailable.');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare image.')),'image/jpeg',.85));
  const id=crypto.randomUUID();return {id,url:URL.createObjectURL(blob),file:new File([blob],'anusmita-product-'+id+'.jpg',{type:'image/jpeg'})};
 }finally{bitmap.close();}
}
