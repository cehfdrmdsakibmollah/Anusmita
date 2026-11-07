/** Only real category registry slugs qualify for indexed collection pages. */
export const isCategorySeoSlug=(value:string)=>value.length>0&&value.length<=120&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const categorySeoPath=(slug:string)=>isCategorySeoSlug(slug)?"/collections/"+encodeURIComponent(slug):null;
export function categorySeoMetadata(category:{name:string;slug:string;seoTitle?:string;seoDescription?:string;description?:string}){
 return {
  title:category.seoTitle?.trim()||(category.name+" Collection | ANUSMITA").slice(0,70),
  description:(category.seoDescription?.trim()||category.description?.trim()||("Discover "+category.name+" products at ANUSMITA Bangladesh.")).slice(0,160),
  canonical:categorySeoPath(category.slug)
 };
}
export function categoriesWithPublishedProducts<T extends {name:string;slug:string;active:boolean}>(categories:readonly T[],publishedCategoryNames:ReadonlySet<string>){
 return categories.filter(x=>x.active&&isCategorySeoSlug(x.slug)&&publishedCategoryNames.has(x.name));
}
