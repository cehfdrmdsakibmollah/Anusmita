export type GalleryAction = "cover"|"move-left"|"move-right"|"unlink";

export function editGallery(images: string[],imageUrl:string,action:GalleryAction):string[]{
 if(!Array.isArray(images)||images.length>12||images.some(x=>typeof x!=="string"))throw new Error("Invalid product gallery");
 if(new Set(images).size!==images.length)throw new Error("Duplicate image references");
 const index=images.indexOf(imageUrl);
 if(index<0)throw new Error("Image no longer attached to product");
 if(action==="unlink")return images.filter(x=>x!==imageUrl);
 const copy=[...images];
 if(action==="cover"){
  copy.splice(index,1);copy.unshift(imageUrl);return copy;
 }
 const target=index+(action==="move-left"?-1:1);
 if(target<0||target>=copy.length)return copy;
 [copy[index],copy[target]]=[copy[target],copy[index]];
 return copy;
}
