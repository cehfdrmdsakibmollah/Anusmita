
import {createHash} from "node:crypto";
import source from "../data/hr-wholesale-public.json";
import {parseCells, CsvError,toPaisa,csvSerialize} from "./catalog-csv";
export const hrWholesalePublic=source;
export const HR_CSV_HEADERS=["supplier_ref","product_name","brand","pack_size","product_url","quoted_cost_bdt"] as const;
export type HrSupplierRow={sourceRef:string;name:string;brand:string;size:string;sourceUrl:string;quotedCostPaisa:number|null};
const MAX_ROWS=400;
function clean(value:string,label:string,max:number){
 const text=value.trim();
 if(text.length>max||/[\x00-\x1f\x7f]/.test(text))throw new CsvError(label+" has invalid characters or is too long");
 return text;
}
export function isHrWebsite(url:string):boolean{
 try{
  const parsed=new URL(url);
  return parsed.protocol==="https:"&&["www.hrwholesalecosmetics.com","hrwholesalecosmetics.com"].includes(parsed.hostname)&&
   !parsed.username&&!parsed.password&&!parsed.search&&!parsed.hash&&
   (parsed.pathname==="/"||/^\/product\/[a-z0-9-]+\/?$/.test(parsed.pathname));
 }catch{return false;}
}
export function parseHrSupplierCsv(csv:string):HrSupplierRow[]{
 const rows=parseCells(csv,MAX_ROWS,260_000);
 if(rows.length<2)throw new CsvError("Supplier CSV must have headers and at least one product");
 const headers=rows.shift()!.map(x=>x.trim().toLowerCase());
 if(headers.length!==HR_CSV_HEADERS.length||HR_CSV_HEADERS.some((h,i)=>h!==headers[i]))
  throw new CsvError("Expected header: "+HR_CSV_HEADERS.join(","));
 const seen=new Set<string>();
 return rows.map((line,i)=>{
  if(line.length!==headers.length)throw new CsvError("Line "+(i+2)+" must have exactly 6 columns");
  const [external,nameRaw,brandRaw,sizeRaw,urlRaw,priceRaw]=line.map((s,j)=>clean(s,"Line "+(i+2)+" "+headers[j],j===1?150:j===4?400:100));
  if(nameRaw.length<4||brandRaw.length<2)throw new CsvError("Line "+(i+2)+": name and brand are required");
  const sourceUrl=urlRaw||source.sourceUrl;
  if(!isHrWebsite(sourceUrl))throw new CsvError("Line "+(i+2)+": unsupported supplier URL");
  const sourceRef=external||"NAME-"+createHash("sha256").update((nameRaw+"|"+sizeRaw).toLowerCase().normalize("NFKC")).digest("hex").slice(0,24).toUpperCase();
  if(!/^[a-zA-Z0-9_-]{3,70}$/.test(sourceRef))throw new CsvError("Line "+(i+2)+": invalid supplier reference");
  const dedupeKey=sourceRef.toUpperCase();
  if(seen.has(dedupeKey))throw new CsvError("Line "+(i+2)+": duplicate supplier reference "+sourceRef);
  seen.add(dedupeKey);
  const quotedCostPaisa=priceRaw===""?null:toPaisa(priceRaw,"Line "+(i+2)+" vendor quote");
  return {sourceRef:dedupeKey,name:nameRaw,brand:brandRaw,size:sizeRaw,sourceUrl,quotedCostPaisa};
 });
}
export function hrWholesaleSourceCsv(){
 return csvSerialize([
  ["reference","product_name","brand","pack_size","source_section","source_url","supplier_cost_bdt","supplier_sku","stock_verified"],
  ...source.candidateItems.map(item=>[
   item.reference,item.printedName,item.brand,item.size,item.sourceSection,item.sourceUrl,"","",""
  ])
 ]);
}
export function hrSupplierTemplate(){
 return csvSerialize([Array.from(HR_CSV_HEADERS),["","Sample only - replace this row","Example Brand","30ml","",""]]);
}
