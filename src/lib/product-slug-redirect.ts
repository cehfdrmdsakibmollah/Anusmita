/** Permanent product redirect paths must stay on the local product route. */
const validSlug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function historicalProductRedirectPath(sourceSlug:string,targetSlug:string):string|null{
 if(!sourceSlug||!targetSlug||sourceSlug===targetSlug)return null;
 if(sourceSlug.length>120||targetSlug.length>120||!validSlug.test(sourceSlug)||!validSlug.test(targetSlug))return null;
 return "/products/"+encodeURIComponent(targetSlug);
}
