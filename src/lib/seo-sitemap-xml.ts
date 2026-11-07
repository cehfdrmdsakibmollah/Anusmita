/** XML serializer shared by static and product sitemaps. Only canonical trusted URLs. */
export const SITEMAP_SEGMENT_SIZE=2000;
export function sitemapSegments(count:number,size=SITEMAP_SEGMENT_SIZE):number[]{
 const n=Math.max(0,Math.ceil(Math.max(0,count)/size));
 return Array.from({length:Math.min(n,100000)},(_,i)=>i);
}
export function sitemapBaseUrl(raw:string|undefined):string{
 try{
  const url=new URL(raw||"https://anusmita.netlify.app");
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||url.pathname!=="/")throw Error("Bad sitemap origin");
  return url.origin;
 }catch{return "https://anusmita.netlify.app";}
}
export const escapeSitemapXml=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export function sitemapDocument(rows:readonly {url:string;lastModified?:Date|string|null}[]):string{
 return '<?xml version="1.0" encoding="UTF-8"?>'+
 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+rows.map(row=>{
  const date=row.lastModified?new Date(row.lastModified):null;
  const last=date&&Number.isFinite(date.getTime())?'<lastmod>'+escapeSitemapXml(date.toISOString())+'</lastmod>':"";
  return '<url><loc>'+escapeSitemapXml(row.url)+'</loc>'+last+'</url>';
 }).join("")+'</urlset>';
}
export function sitemapIndexDocument(urls:readonly string[]):string{
 return '<?xml version="1.0" encoding="UTF-8"?>'+
 '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
 urls.map(url=>'<sitemap><loc>'+escapeSitemapXml(url)+'</loc></sitemap>').join("")+
 '</sitemapindex>';
}
export const sitemapHeaders={"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=60, stale-while-revalidate=300"};
export function sitemapSegmentFromPath(path:string):number|null{
 if(!/^(0|[1-9][0-9]{0,4})\.xml$/.test(path))return null;
 const index=Number(path.slice(0,-4));
 return index<100000?index:null;
}
