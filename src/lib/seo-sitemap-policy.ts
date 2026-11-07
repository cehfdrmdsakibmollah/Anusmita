/** Public sitemap must reflect real indexability, not simply active product records. */
export type SitemapProduct={_id:unknown;slug:string;updatedAt?:Date|string|null;active:boolean;archived?:boolean};
export function indexableSitemapProducts(rows:readonly SitemapProduct[],optedOutIds:ReadonlySet<string>){
 return rows.filter(p=>
  p.active&&p.archived!==true&&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)&&
  p.slug.length<=120&&!optedOutIds.has(String(p._id))
 );
}
export const privateRobotPaths=[
 "/admin","/admin/","/api/","/checkout","/checkout/","/cart","/cart/",
 "/account","/account/","/wishlist","/wishlist/","/search"
] as const;
