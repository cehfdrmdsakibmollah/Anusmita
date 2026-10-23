
/**
 * Deterministic CSV parser for human-reviewed catalogue imports.
 * No HTML, formulas, customer data or stock updates are inferred from imports.
 */
export const CSV_HEADERS = [
 "sku","name","slug","brand","category","origin","description",
 "size","variant_label","price_bdt","cost_bdt","image_urls",
 "active","opening_stock","reorder_level"
] as const;
type Field=typeof CSV_HEADERS[number];
export type CatalogRow={line:number;sku:string;changes:Record<string,string|number|boolean|string[]>;openingStock?:number};
export class CsvError extends Error { constructor(message:string){super(message);this.name="CsvError";} }
export const CSV_TEMPLATE=CSV_HEADERS.join(",")+"\r\n"+
 "AN-KR-001,Sample Serum 30ml,sample-serum-30ml,Example Brand,Beauty,Korea,Example only,30ml,Standard,950.00,600.00,,false,0,5\r\n";

export function parseCells(csv:string):string[][] {
 if(csv.length>120_000)throw new CsvError("CSV is larger than 120 KB");
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false,closed=false;
 const text=csv.replace(/^\uFEFF/,"");
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){
   if(ch==='"' && text[i+1]==='"'){cell+='"';i++;}
   else if(ch==='"') {quoted=false;closed=true;}
   else cell+=ch;
  }else if(ch==='"'){
   if(cell.length || closed)throw new CsvError("Quote in an unquoted field");
   quoted=true;
  }else if(ch===',' || ch==='\r'||ch==='\n'){
   row.push(cell);cell="";closed=false;
   if(ch===',')continue;
   if(ch==='\r'&&text[i+1]==='\n')i++;
   if(row.some(x=>x.trim()!==""))rows.push(row);
   row=[];if(rows.length>101)throw new CsvError("Maximum 100 product rows per import");
  }else{
   if(closed && !/\s/.test(ch))throw new CsvError("Text after a closing quote");
   cell+=ch;
  }
 }
 if(quoted)throw new CsvError("Unterminated quoted field");
 row.push(cell);
 if(row.some(x=>x.trim()!==""))rows.push(row);
 if(rows.length>101)throw new CsvError("Maximum 100 product rows per import");
 return rows;
}
function integer(input:string,key:string,max=1000000){
 if(!/^\d+$/.test(input))throw new CsvError(key+" must be a whole nonnegative number");
 const n=Number(input);if(!Number.isSafeInteger(n)||n>max)throw new CsvError(key+" is too large");return n;
}
export function toPaisa(input:string,label:string) {
 if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(input))throw new CsvError(label+" must be nonnegative BDT with up to two decimal places");
 const [whole,fraction=""]=input.split(".");
 const amount=Number(whole)*100+Number(fraction.padEnd(2,"0"));
 if(!Number.isSafeInteger(amount))throw new CsvError(label+" exceeds safe precision");
 return amount;
}
function boolean(input:string,key:string){
 if(input==="true"||input==="1")return true;
 if(input==="false"||input==="0")return false;
 throw new CsvError(key+" must be true or false");
}
export function safeSlug(value:string){
 return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100);
}
function safeText(s:string,label:string,max:number){
 if(s.length>max)throw new CsvError(label+" exceeds "+max+" characters");
 if(/[\u0000-\u0008\u000b-\u001f]/.test(s))throw new CsvError(label+" contains control characters");
 return s;
}
export function csvRows(csv:string):CatalogRow[]{
 const cells=parseCells(csv);
 if(cells.length<2)throw new CsvError("CSV must contain a header and at least one product");
 const headers=cells.shift()!.map(s=>s.trim().toLowerCase());
 if(new Set(headers).size!==headers.length)throw new CsvError("Duplicate column header");
 if(!headers.includes("sku"))throw new CsvError("SKU column is required");
 if(headers.some(x=>!CSV_HEADERS.includes(x as Field)))throw new CsvError("Unsupported CSV column");
 const seen=new Set<string>();
 return cells.map((parts,i)=>{
  if(parts.length!==headers.length)throw new CsvError("Row "+(i+2)+": column count does not match header");
  const raw=Object.fromEntries(headers.map((k,n)=>[k,parts[n].trim()])) as Record<string,string>;
  const sku=raw.sku?.toUpperCase();
  if(!sku || !/^[A-Z0-9_-]{3,60}$/.test(sku))throw new CsvError("Row "+(i+2)+": invalid SKU");
  if(seen.has(sku))throw new CsvError("Row "+(i+2)+": duplicate SKU "+sku);
  seen.add(sku);
  const changes:CatalogRow["changes"]={};
  for(const [key,v] of Object.entries(raw)){
   if(key==="sku"||key==="opening_stock"||v==="")continue; // Never clear an existing value by accident.
   const label="Row "+(i+2)+" "+key;
   if(key==="price_bdt"||key==="cost_bdt"){
    const n=toPaisa(v,label);
    if(key==="price_bdt"&&n<1)throw new CsvError(label+" must be above zero");
    changes[key==="price_bdt"?"pricePaisa":"costPaisa"]=n;
   }else if(key==="active")changes.active=boolean(v.toLowerCase(),label);
   else if(key==="reorder_level")changes.reorderLevel=integer(v,label,100000);
   else if(key==="image_urls"){
    const urls=v.split("|").map(x=>x.trim()).filter(Boolean);
    if(urls.length>12 || urls.some(x=>{try{return new URL(x).protocol!=="https:";}catch{return true;}}))
      throw new CsvError(label+" needs up to 12 HTTPS URLs separated by |");
    changes.imageUrls=urls;
   }else if(key==="origin"){
    if(!["Bangladesh","China","Japan","Korea","Other"].includes(v))throw new CsvError(label+" invalid origin");
    changes.origin=v;
   }else if(key==="slug"){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) || v.length>120)throw new CsvError(label+" must be a valid lowercase slug");
    changes.slug=v;
   }else {
    const mapping:Record<string,string>={name:"name",brand:"brand",category:"category",description:"description",size:"size",variant_label:"variantLabel"};
    const maxima:Record<string,number>={name:150,brand:100,category:60,description:3000,size:50,variant_label:60};
    if(!mapping[key])throw new CsvError("Unsupported field: "+key);
    changes[mapping[key]]=safeText(v,label,maxima[key]);
   }
  }
  const openingStock=raw.opening_stock===""||raw.opening_stock===undefined?undefined:integer(raw.opening_stock,"Row "+(i+2)+" opening stock",100000);
  return {line:i+2,sku,changes,openingStock};
 });
}
export function csvCell(v:unknown):string{
 const str=String(v??"");
 // Protect CSV users against spreadsheet formula injection.
 const safe=/^[\s]*[=+\-@]/.test(str)?"'"+str:str;
 return /[",\r\n]/.test(safe)?'"'+safe.replace(/"/g,'""')+'"':safe;
}
export function csvSerialize(rows:unknown[][]):string{
 return "\uFEFF"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
