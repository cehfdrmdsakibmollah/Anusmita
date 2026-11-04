"use client";
import {useEffect,useRef,useState} from "react";
import {ImagePlus,Layers,Tag,Search,Save,ArrowLeft,ArrowRight,Palette,Boxes} from "lucide-react";
import ProductPhotoManager from "@/components/product-photo-manager";
import ProductDescriptionEditor from "@/components/product-description-editor";
import ProductManager from "@/components/product-manager";
type Item={_id:string;sku:string;name:string;slug:string;brand:string;category:string;subcategoryId?:string|null;size:string;color?:string;colorHex?:string;variantGroup?:string;variantLabel?:string;origin:string;description:string;pricePaisa:number;costPaisa:number;compareAtPaisa?:number;wholesalePaisa?:number;featured?:boolean;barcode?:string;reorderLevel?:number;onHand:number;reserved:number;active:boolean;archived?:boolean;availabilityMode?: "now"|"preorder";preorderEta?:string|null;discountPercent?:number;salesChannels?:string[];scheduledPublishAt?:string|null;imageUrls:string[];updatedAt:string};
type Page={products:Item[];page:number;pages:number;total:number};
type Category={id:string;name:string;slug:string;parentId:string|null;active:boolean;position:number;description:string;seoTitle:string;seoDescription:string};
const choices=["Bangladesh","Japan","Korea","China","Other"];
const blank={name:"",slug:"",sku:"",brand:"ANUSMITA",category:"",size:"",color:"",colorHex:"",variantGroup:"",description:"",price:"",cost:"",comparePrice:"",wholesalePrice:"",barcode:"",featured:false,reorderLevel:"5",stock:"0",origin:"Bangladesh",active:false,scheduledPublishAt:"",availabilityMode:"now" as "now"|"preorder",preorderEta:"",discountPercent:"0",salesChannels:["online"] as string[]};
type Draft=typeof blank;
const cash=(v:number)=>"৳"+new Intl.NumberFormat("en-BD").format(v/100);
export default function AdminProductWorkspace(){
 const [draft,setDraft]=useState<Draft>(blank),[items,setItems]=useState<Page|null>(null),[query,setQuery]=useState(""),[statusFilter,setStatusFilter]=useState("all"),[page,setPage]=useState(1),[version,setVersion]=useState(0),[selected,setSelected]=useState<Item|null>(null),[feedback,setFeedback]=useState(""),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[r2Status,setR2Status]=useState("Checking R2 storage…"),[files,setFiles]=useState<File[]>([]),[uploading,setUploading]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);
 const [pendingCover,setPendingCover]=useState<number|null>(null);
 const [pendingPreviews,setPendingPreviews]=useState<string[]>([]);
 useEffect(()=>{const urls=files.map(f=>URL.createObjectURL(f));setPendingPreviews(urls);return()=>{for(const url of urls)URL.revokeObjectURL(url);};},[files]);
 const initialSelection=useRef(false);
 const [variantByColor,setVariantByColor]=useState(true);
 const [variantBySize,setVariantBySize]=useState(true);
 const [variants,setVariants]=useState<Item[]>([]);
 const [variantError,setVariantError]=useState("");
 useEffect(()=>{const group=draft.variantGroup.trim().toLowerCase();if(!group){setVariants([]);setVariantError("");return;}const controller=new AbortController();async function fetchVariants(){try{const r=await fetch("/api/admin/products?"+new URLSearchParams({variantGroup:group,perPage:"30",page:"1"}),{cache:"no-store",signal:controller.signal});const d=await r.json();if(!r.ok)throw Error(d.error||"Cannot load variants");if(!controller.signal.aborted){setVariants(d.products||[]);setVariantError(d.total>30?"Showing first 30 variants; use SKU search to locate additional records.":"");}}catch(e){if(!controller.signal.aborted)setVariantError(e instanceof Error?e.message:String(e));}}void fetchVariants();return()=>controller.abort();},[draft.variantGroup,version]);
 const [categories,setCategories]=useState<Category[]>([]);
 const [catalogCategories,setCatalogCategories]=useState<string[]>([]);
 const [categoryId,setCategoryId]=useState("");
 const [subcategoryId,setSubcategoryId]=useState("");
 const [taxMessage,setTaxMessage]=useState("");
 const [taxBusy,setTaxBusy]=useState(false);
 const [taxName,setTaxName]=useState("");
 const [taxParent,setTaxParent]=useState<string|null>(null);
 const [taxEditId,setTaxEditId]=useState<string|null>(null);
 const [taxOpen,setTaxOpen]=useState(false);

 async function refreshCategories():Promise<Category[]>{
  const response=await fetch("/api/admin/categories",{cache:"no-store"});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||"Unable to load taxonomy");
  const rows=(data.categories||[]) as Category[];
  setCategories(rows);
  return rows;
 }
 useEffect(()=>{void refreshCategories().catch(e=>setTaxMessage(String(e)));},[]);
 const parentCategories=categories.filter(c=>!c.parentId);
 const legacyCategories=catalogCategories.filter(name=>!parentCategories.some(c=>c.name.toLocaleLowerCase()===name.toLocaleLowerCase()));
 const subcategories=categories.filter(c=>c.parentId===categoryId);
 function openTax(parent:string|null,edit?:Category){setTaxParent(parent);setTaxEditId(edit?.id||null);setTaxName(edit?.name||"");setTaxOpen(true);setTaxMessage("");}
 const slugOf=(name:string)=>name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"category-"+crypto.randomUUID().slice(0,8);
 const taxonomyPayload=(name:string,parentId:string|null,row?:Category)=>({
  name,slug:row?.slug||slugOf(name),parentId,active:row?.active??true,position:row?.position??0,
  description:row?.description||"",seoTitle:row?.seoTitle||"",seoDescription:row?.seoDescription||""
 });
 async function taxRequest(method:"POST"|"PATCH"|"DELETE",body:unknown){
  const response=await fetch("/api/admin/categories",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||data.message||"Category save failed");
  return data;
 }
 async function changeTax(method:"POST"|"PATCH"|"DELETE",target?:Category){
  if(taxBusy)return;
  const row=target||categories.find(c=>c.id===taxEditId);
  const name=method==="DELETE"?row?.name:taxName.trim();
  if(!name){setTaxMessage("Please enter a category name.");return;}
  if(method!=="POST"&&!row){setTaxMessage("Select an existing category.");return;}
  if(method==="DELETE"&&!window.confirm("Delete "+name+"? Categories with products or children are protected."))return;
  setTaxBusy(true);setTaxMessage("");
  try{
   let parentId=taxParent;
   // Existing imported categories only have a name. Register the parent first,
   // without rewriting any product/category references or inventory data.
   if(method==="POST"&&parentId&&!/^[a-f0-9]{24}$/i.test(parentId)){
    const existing=categories.find(c=>!c.parentId&&c.name.toLocaleLowerCase()===parentId!.toLocaleLowerCase());
    if(existing)parentId=existing.id;
    else{
     const parentName=parentId;
     let parentResponse:{id:string};
     try{parentResponse=await taxRequest("POST",taxonomyPayload(parentName,null));}
     catch(e){
      const updated=await refreshCategories();
      const match=updated.find(c=>!c.parentId&&c.name.toLowerCase()===parentName.toLowerCase());
      if(!match)throw e;
      parentResponse={id:match.id};
     }
     parentId=parentResponse.id;
    }
    setCategoryId(parentId);
   }
   let result:{id?:string};
   if(method==="DELETE")result=await taxRequest("DELETE",{id:row!.id});
   else result=await taxRequest(method,{...taxonomyPayload(name,parentId,method==="PATCH"?row:undefined),...(method==="PATCH"?{id:row!.id}:{})});
   const updated=await refreshCategories();
   if(method==="POST"){
    const created=updated.find(c=>c.id===result.id)||updated.find(c=>c.name===name&&c.parentId===parentId);
    if(!created)throw Error("Category saved, but reload is needed to locate it.");
    if(parentId){setCategoryId(parentId);setSubcategoryId(created.id);}
    else{setCategoryId(created.id);setSubcategoryId("");setDraft(d=>({...d,category:created.name}));}
   }else if(method==="PATCH"&&row){
    if(row.id===categoryId)setDraft(d=>({...d,category:name}));
   }else if(method==="DELETE"&&row){
    if(row.id===categoryId){setCategoryId("");setSubcategoryId("");setDraft(d=>({...d,category:""}));}
    if(row.id===subcategoryId)setSubcategoryId("");
   }
   setTaxOpen(false);
   setTaxMessage((method==="POST"?"Created and selected: ":method==="PATCH"?"Updated: ":"Deleted: ")+name);
  }catch(e){setTaxMessage("Error: "+(e instanceof Error?e.message:String(e)));}
  finally{setTaxBusy(false);}
 }

 useEffect(()=>{let active=true;fetch("/api/admin/r2",{cache:"no-store"}).then(async r=>{let j=await r.json();if(active){setReady(r.ok&&j.ready);setR2Status(r.ok?"R2 storage connected":j.error||"R2 unavailable");}}).catch(()=>{if(active)setR2Status("R2 connection unavailable")});return()=>{active=false}},[]);
 useEffect(()=>{let active=true;fetch("/api/admin/products?"+new URLSearchParams({q:query,page:String(page),perPage:"10",status:statusFilter}),{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Unable to load products");return r.json()}).then(j=>{if(active){setItems(j);setCatalogCategories(j.categories||[])}}).catch(e=>{if(active)setFeedback(e.message)});return()=>{active=false}},[query,page,statusFilter,version]);
 const set=(name:keyof Draft,value:string|boolean|string[])=>setDraft(d=>({...d,[name]:value}));
 function edit(item:Item){const category=categories.find(c=>!c.parentId&&c.name===item.category)||categories.find(c=>c.name===item.category);setCategoryId(category?.parentId||category?.id||item.category);setSubcategoryId(item.subcategoryId|| (category?.parentId?category.id:""));setSelected(item);setDraft({name:item.name,slug:item.slug,sku:item.sku,brand:item.brand||"",category:item.category,size:item.size||"",color:item.color||"",colorHex:item.colorHex||"",variantGroup:item.variantGroup||"",description:item.description||"",price:(item.pricePaisa/100).toString(),cost:(item.costPaisa/100).toString(),comparePrice:((item.compareAtPaisa||0)/100).toString(),wholesalePrice:((item.wholesalePaisa||0)/100).toString(),barcode:item.barcode||"",featured:!!item.featured,reorderLevel:String(item.reorderLevel??5),stock:String(item.onHand),origin:item.origin||"Other",active:item.active,availabilityMode:item.availabilityMode||"now",preorderEta:item.preorderEta?new Date(item.preorderEta).toISOString().slice(0,16):"",discountPercent:String(item.discountPercent||0),salesChannels:item.salesChannels||["online"],scheduledPublishAt:item.scheduledPublishAt?new Date(item.scheduledPublishAt).toISOString().slice(0,16):""});setFiles([]);setPendingCover(null);setFeedback("");window.scrollTo({top:0,behavior:"smooth"});}
 useEffect(()=>{if(!initialSelection.current&&items?.products?.length){initialSelection.current=true;edit(items.products[0]);}},[items,categories]);
 function reset(){setCategoryId("");setSubcategoryId("");setSelected(null);setDraft(blank);setFiles([]);setPendingCover(null);setFeedback("");if(fileRef.current)fileRef.current.value="";}
 function cloneVariant(){if(!selected)return;const source=selected;setSelected(null);setDraft(d=>({...d,sku:"",slug:"",size:"",color:"",colorHex:"",variantGroup:source.variantGroup||source.slug,stock:"0",active:false}));setFiles([]);setPendingCover(null);setFeedback("New variant draft based on "+source.sku+". Enter a unique SKU and slug, then save. Each variant has its own price, stock and gallery.");window.scrollTo({top:0,behavior:"smooth"});}
 async function uploadGallery(product:Item,batch:File[]){
  if(!batch.length)return product;
  if(!ready)throw Error(r2Status);
  let current=product;
  const originalLength=product.imageUrls.length;
  let completed=0;
  setUploading(true);
  try{
   if(batch.length+originalLength>12)throw Error("Maximum 12 product images including the cover");
   for(const file of batch){
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>3*1024*1024||file.size<1)
     throw Error(file.name+": JPEG, PNG or WebP up to 3MB only");
    const data=new FormData();
    data.set("productId",current._id);data.set("expectedUpdatedAt",current.updatedAt);data.set("file",file);
    const response=await fetch("/api/admin/r2",{method:"POST",body:data});
    const payload=await response.json();
    if(!response.ok)throw Error(payload.error||"R2 upload failed");
    current={...current,imageUrls:payload.imageUrls,updatedAt:payload.updatedAt};
    setSelected(current);
    completed++;
   }
   // Cover is always imageUrls[0]; all other uploaded images remain in gallery.
   if(pendingCover!==null){
    const chosen=current.imageUrls[originalLength+pendingCover];
    if(chosen&&chosen!==current.imageUrls[0]){
     const response=await fetch("/api/admin/products/"+current._id+"/images",{
      method:"PATCH",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({expectedUpdatedAt:current.updatedAt,imageUrl:chosen,action:"cover"})
     });
     const payload=await response.json();
     if(!response.ok)throw Error(payload.error||"Photos uploaded but changing cover failed");
     current={...current,imageUrls:payload.imageUrls,updatedAt:payload.updatedAt};
     setSelected(current);
    }
   }
   setFiles([]);setPendingCover(null);
   if(fileRef.current)fileRef.current.value="";
   setVersion(v=>v+1);
   return current;
  }catch(error){
   // Keep any not-yet-uploaded files for retry; never delete successfully attached files.
   if(completed>0){
    setFiles(batch.slice(completed));
    setPendingCover(old=>old===null||old<completed?null:old-completed);
   }
   throw error;
  }finally{setUploading(false);}
 }
 async function uploadSelectedPhotos(){
  if(!selected||!files.length||uploading||busy)return;
  setFeedback("");
  try{
   const updated=await uploadGallery(selected,files);
   setFeedback("Uploaded "+updated.imageUrls.length+" total photos. First image is cover; remaining "+Math.max(0,updated.imageUrls.length-1)+" are gallery photos.");
  }catch(error){setFeedback("Error: "+(error instanceof Error?error.message:String(error)));}
 }

 async function save(e:React.FormEvent){e.preventDefault();if(busy||uploading)return;
  if(files.length&&!ready){setFeedback("Error: "+r2Status+". Images were not uploaded.");return;}
  const cost=Math.round(Number(draft.cost)*100),price=Math.round(Number(draft.price)*100),compareAt=Math.round(Number(draft.comparePrice||"0")*100),wholesale=Math.round(Number(draft.wholesalePrice||"0")*100);
  if(!Number.isSafeInteger(cost)||!Number.isSafeInteger(price)||price<=0||cost<0||!Number.isSafeInteger(compareAt)||compareAt<0||!Number.isSafeInteger(wholesale)||wholesale<0){setFeedback("Error: Invalid price or cost");return;}
  if(!Number.isSafeInteger(Number(draft.reorderLevel))||Number(draft.reorderLevel)<0){setFeedback("Error: Reorder level must be a non-negative whole number");return;}
  if(draft.scheduledPublishAt&&(!Number.isFinite(Date.parse(draft.scheduledPublishAt))||Date.parse(draft.scheduledPublishAt)<=Date.now())){setFeedback("Error: Scheduled publication must be a valid future date and time.");return;}
  if(!Number.isFinite(Number(draft.discountPercent))||Number(draft.discountPercent)<0||Number(draft.discountPercent)>100){setFeedback("Error: Discount must be 0–100 percent");return;}
  if(draft.availabilityMode==="preorder"&&(!draft.preorderEta||Date.parse(draft.preorderEta)<=Date.now())){setFeedback("Error: Pre-order needs a future ETA");return;}
  const payload={name:draft.name.trim(),slug:draft.slug.trim(),sku:draft.sku.trim(),brand:draft.brand.trim(),category:draft.category.trim(),subcategoryId:subcategoryId||null,size:draft.size.trim(),color:draft.color.trim(),colorHex:draft.colorHex.trim(),variantGroup:draft.variantGroup.trim().toLowerCase(),description:draft.description.trim(),origin:draft.origin,pricePaisa:price,costPaisa:cost,compareAtPaisa:compareAt,wholesalePaisa:wholesale,barcode:draft.barcode.trim(),featured:draft.featured,reorderLevel:Number(draft.reorderLevel),availabilityMode:draft.availabilityMode,preorderEta:draft.availabilityMode==="preorder"?new Date(draft.preorderEta).toISOString():null,discountPercent:Number(draft.discountPercent),salesChannels:draft.salesChannels,active:draft.scheduledPublishAt?false:draft.active,scheduledPublishAt:draft.scheduledPublishAt?new Date(draft.scheduledPublishAt).toISOString():null};
  setBusy(true);setFeedback("");
  try{let product:Item;
   if(selected){const {sku,...changes}=payload;const r=await fetch("/api/admin/products/"+selected._id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({expectedUpdatedAt:selected.updatedAt,changes})});const j=await r.json();if(!r.ok)throw Error(j.error||"Update failed");product={...selected,...changes,updatedAt:j.updatedAt};}
   else{const stock=Number(draft.stock);if(!Number.isSafeInteger(stock)||stock<0)throw Error("Opening stock must be a non-negative whole number");const r=await fetch("/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,onHand:stock,imageUrls:[],variantLabel:draft.size||draft.color||"Standard"})});const j=await r.json();if(!r.ok)throw Error(j.error||"Create failed");const refresh=await fetch("/api/admin/products?q="+encodeURIComponent(payload.sku));const found=await refresh.json();product=found.products.find((p:Item)=>p._id===j.id);if(!product)throw Error("Product created, but reload is needed to attach images");}
   setSelected(product);setVersion(v=>v+1);
   if(files.length){try{product=await uploadGallery(product,files);}catch(err){setFeedback("Product saved. Image upload stopped: "+(err instanceof Error?err.message:"unknown error")+". Previously uploaded images remain linked.");return;}}
   setFeedback("Saved "+product.sku+". Cover: "+(product.imageUrls.length?1:0)+"; gallery: "+Math.max(0,product.imageUrls.length-1)+". "+(product.active?"Published.":"Draft."));setVersion(v=>v+1);
  }catch(err){setFeedback("Error: "+(err instanceof Error?err.message:"Save failed"));}finally{setBusy(false);}
 }
 const field=(name:keyof Draft,label:string,props:React.InputHTMLAttributes<HTMLInputElement>={})=><label className="apField" key={name}><span>{label}</span><input {...props} value={String(draft[name])} onChange={e=>set(name,e.target.value)}/></label>;

 async function toggleArchive(){if(!selected||busy)return;const archived=!selected.archived;if(!window.confirm(archived?"Archive this product? It will become unpublished and its scheduled publication will be cancelled.":"Restore product to Draft? It will remain unpublished until you save and publish."))return;setBusy(true);setFeedback("");try{const r=await fetch("/api/admin/products/"+selected._id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({expectedUpdatedAt:selected.updatedAt,changes:{archived,active:false,scheduledPublishAt:null}})});const j=await r.json();if(!r.ok)throw Error(j.error||"Archive action failed");setSelected({...selected,archived,active:false,scheduledPublishAt:null,updatedAt:j.updatedAt});setDraft(d=>({...d,active:false,scheduledPublishAt:""}));setVersion(v=>v+1);setFeedback(archived?"Product archived and unpublished.":"Product restored as Draft.");}catch(e){setFeedback("Error: "+(e instanceof Error?e.message:String(e)));}finally{setBusy(false);}}
 const available=selected?Math.max(0,selected.onHand-selected.reserved):Math.max(0,Number(draft.stock)||0);
 const reorderThreshold=Number(draft.reorderLevel)||0;
 const stockLabel=available<=0?"Out of Stock":available<=reorderThreshold?"Low Stock":"In Stock";
 return <div className="apWorkspace">
 <header className="apHeading"><div><p className="apCrumb">Admin / Products / {selected?"Edit "+selected.sku:"Add product"}</p><h2>Products</h2><p>Manage your real product catalog, pricing, inventory, SEO and publishing status.</p></div><span className="apStatus">{ready?"● R2 Connected":"○ "+r2Status}</span></header>
 <div className="apToolbarActions"><button type="button" className="apTopNewProduct" onClick={reset}>＋ Add New Product</button><a className="apToolbarButton" href={selected?"/products/"+selected.slug:"#ap-basic"} target={selected?"_blank":undefined} rel="noopener noreferrer">◉ Preview Product</a><button type="button" disabled={!selected} onClick={cloneVariant}>▣ Duplicate</button><button type="button" disabled={!selected||busy} onClick={()=>void toggleArchive()}>{selected?.archived?"↺ Restore":"▤ Archive"}</button><button type="submit" form="apEditorForm" disabled={busy||uploading}>✎ {selected?"Update Product":"Create Product"}</button></div>
 <div className="apReferenceGrid"><aside className="apReferenceProducts"> <section className="apCard apSearch"><h3><Search size={19}/> Search & edit products</h3><div className="apCardBody"><label className="apField"><span>Search by product name, SKU or brand</span><input value={query} placeholder="Search 121+ real products…" onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label><div className="apCatalogFilters" role="group" aria-label="Filter product publication status">{[["all","All"],["published","Published"],["draft","Draft"],["archived","Archived"]].map(([value,label])=><button type="button" key={value} aria-pressed={statusFilter===value} className={statusFilter===value?"selected":""} onClick={()=>{setStatusFilter(value);setPage(1);}}>{label}</button>)}</div><div className="apTableScroll"><table><thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Available</th><th>Status</th><th>Action</th></tr></thead><tbody>{items?.products.map(p=><tr key={p._id} role="button" tabIndex={0} aria-label={"Edit "+p.name} onClick={()=>edit(p)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();edit(p);}}}><td><div className="apProductCell">{p.imageUrls?.[0]?<img src={p.imageUrls[0]} alt=""/>:<span className="apNoImage">No image</span>}<span className="apProductText"><strong>{p.name}</strong><small>SKU: {p.sku}</small><span className="apProductBadges"><em className={p.active?"apPublished":"apDraft"}>{p.archived?"Archived":p.active?"Active":"Draft"}</em><em className={p.onHand-p.reserved<=0?"apDraft":"apPublished"}>Stock: {Math.max(0,p.onHand-p.reserved)}</em></span></span></div></td><td>{p.sku}</td><td>{cash(p.pricePaisa)}</td><td>{p.onHand-p.reserved}</td><td><span className={p.active?"apPublished":"apDraft"}>{p.active?"Published":"Draft"}</span></td><td><button type="button" className="apEdit" onClick={()=>edit(p)}>Edit</button></td></tr>)}</tbody></table></div><div className="apPager"><button type="button" disabled={page<=1} onClick={()=>setPage(v=>v-1)}><ArrowLeft size={16}/> Previous</button><span>Page {page}/{items?.pages||1} · {items?.total||0} SKUs</span><button type="button" disabled={page>=(items?.pages||1)} onClick={()=>setPage(v=>v+1)}>Next <ArrowRight size={16}/></button></div></div></section>
</aside><div className="apReferenceEditor">
 <div className="apReferenceSelected"><div>{selected?.imageUrls[0]?<img src={selected.imageUrls[0]} alt="" width={72} height={75}/>:null}<div><strong>{selected?selected.name:"Add a new product"}</strong><p>{selected?`SKU: ${selected.sku} · ${selected.category} · ${selected.active?"Published":"Draft"}`:"Fill the form below to create a product."}</p></div></div><div className="apSelectedActions">{selected&&<><a href={"/products/"+selected.slug} target="_blank" rel="noopener noreferrer">Preview Product ↗</a><button type="button" onClick={cloneVariant}>Duplicate Variant</button></>}<button type="button" onClick={reset}>+ New Product</button></div></div>
 <nav className="apReferenceTabs" aria-label="Product editor sections"><a href="#ap-basic">Basic Info</a><a href={selected?"/admin/inventory?sku="+encodeURIComponent(selected.sku):"/admin/inventory"}>Inventory ↗</a><a href="#ap-variants">Variants</a><a href="#ap-media">Media</a><a href="#ap-pricing">Pricing</a><a href="#ap-details">Details</a><a href="#ap-publishing">Publishing</a><a href="/admin/products/manage?view=seo">Product SEO ↗</a></nav>
 <form id="apEditorForm" onSubmit={save}>
 <div className="apEditorColumns"><div className="apEditorColumn"><section className="apCard apBasic" id="ap-basic"><h3><Tag size={19}/> Basic information</h3><div className="apCardBody">{field("name","Product name *",{required:true,maxLength:150,placeholder:"e.g. Ivory Jamdani Saree"})}{field("slug","Unique SEO slug *",{required:true,pattern:"[a-z0-9]+(-[a-z0-9]+)*",placeholder:"e.g. ivory-jamdani-saree"})}<div className="apTwo">{field("sku","Unique SKU *",{required:true,disabled:!!selected,placeholder:"ANUS-2026-121"})}{field("brand","Brand",{maxLength:100})}</div><div className="apTaxonomyFields"><label className="apField"><span>Category *</span><select value={categoryId} onChange={e=>{const id=e.target.value;const category=categories.find(c=>c.id===id);setCategoryId(id);setSubcategoryId("");set("category",category?.name||id);}}><option value="">Choose category</option>{parentCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}{legacyCategories.map(name=><option key={name} value={name}>{name} (catalog)</option>)}</select></label><div className="apTaxButtons"><button type="button" onClick={()=>openTax(null)}>+ Create</button><button type="button" disabled={!categories.some(c=>c.id===categoryId)} onClick={()=>openTax(null,categories.find(c=>c.id===categoryId))}>Edit</button><button type="button" disabled={!categories.some(c=>c.id===categoryId)} onClick={()=>void changeTax("DELETE",categories.find(c=>c.id===categoryId))}>Delete</button></div><label className="apField"><span>Subcategory</span><select value={subcategoryId} disabled={!categoryId} onChange={e=>setSubcategoryId(e.target.value)}><option value="">No subcategory</option>{subcategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="apTaxButtons"><button type="button" disabled={!categoryId} onClick={()=>openTax(categoryId)}>+ Create</button><button type="button" disabled={!subcategoryId} onClick={()=>openTax(categoryId,categories.find(c=>c.id===subcategoryId))}>Edit</button><button type="button" disabled={!subcategoryId} onClick={()=>void changeTax("DELETE",categories.find(c=>c.id===subcategoryId))}>Delete</button></div></div><p className="apHint">Legacy products retain their existing category text. Subcategories are managed in the taxonomy registry until storefront mapping is enabled.</p>{field("variantGroup","Variant group key",{placeholder:"e.g. ivory-jamdani"})}<div className="apTwo">{field("color","Colour / shade",{placeholder:"Ivory / Burgundy"})}{field("colorHex","Swatch hex",{placeholder:"#F8F4EB",pattern:"#[0-9a-fA-F]{6}"})}</div>{field("size","Size / capacity",{placeholder:"M, XL, 50ml, 100g…"})}</div></section>
<section className="apCard" id="ap-variants"><h3><Palette size={19}/> Variants / Options</h3><div className="apCardBody"><div className="apVariantToolbar"><span>Variant type: <label><input type="checkbox" checked={variantByColor} onChange={e=>setVariantByColor(e.target.checked)}/> Colour</label> <label><input type="checkbox" checked={variantBySize} onChange={e=>setVariantBySize(e.target.checked)}/> Size</label></span><button type="button" disabled={!selected||(!variantByColor&&!variantBySize)} onClick={()=>{cloneVariant();if(!variantByColor)setDraft(d=>({...d,color:"",colorHex:""}));if(!variantBySize)setDraft(d=>({...d,size:""}));}}>+ Add Variant</button></div><p className="apHint">Use the same variant group for different colours or sizes. Each combination needs a unique SKU and its own photos.</p>{variantError&&<p role="status" className="apHint">{variantError}</p>}{variants.length===0&&<p className="apHint" role="status">No saved variants found for this group. Add a variant to create a separately stocked SKU and gallery.</p>}<div className="apVariantPills">{variants.map(p=><button key={p._id} type="button" className={selected?._id===p._id?"chosen":""} onClick={()=>edit(p)}>{p.color||"Colour default"} · {p.size||"Standard"}</button>)}</div>{variants.length>0&&<div className="apVariantRows"><div className="apVariantRow apVariantHead"><span>Image</span><span>Colour × Size</span><span>SKU</span><span>Stock</span><span>Action</span></div>{variants.map(v=><button className="apVariantRow" type="button" key={v._id} onClick={()=>edit(v)}><span>{v.imageUrls[0]?<img alt="" src={v.imageUrls[0]}/>:<Palette size={18}/>}</span><strong>{v.color||"Default"} × {v.size||"Standard"}</strong><small>{v.sku}</small><small>{Math.max(0,v.onHand-v.reserved)}</small><small>Edit ↗</small></button>)}</div>}</div></section>
<section className="apCard apPriceDetail" id="ap-pricing"><h3><Tag size={18}/> Pricing</h3><div className="apCardBody"><div className="apTwo">{field("price","Selling price (BDT) *",{required:true,type:"number",min:0.01,step:0.01})}{field("comparePrice","Compare-at price (BDT)",{type:"number",min:0,step:0.01})}{field("cost","Cost price (BDT) *",{required:true,type:"number",min:0,step:0.01})}{field("wholesalePrice","Wholesale reference (BDT)",{type:"number",min:0,step:0.01})}</div>{field("discountPercent","Discount percentage (editorial)",{type:"number",min:0,max:100,step:0.01})}<p className="apHint">Discount and wholesale reference are saved as merchandising metadata only. No checkout pricing change.</p></div></section></div><div className="apEditorColumn"><section className="apCard apPricing" id="ap-inventory"><h3><Boxes size={19}/> Inventory & availability</h3><div className="apCardBody"><div className="apInventoryRow">{selected?<label className="apField"><span>Quantity in stock</span><input value={selected.onHand} readOnly aria-label="Audited physical stock, change through inventory adjustment"/><a className="apStockManageLink" href={selected?"/admin/inventory?sku="+encodeURIComponent(selected.sku):"/admin/inventory"}>Adjust stock in Inventory ↗</a></label>:field("stock","Opening physical stock",{required:true,type:"number",min:0,step:1})}<div><strong>Stock status</strong><div className="apStockPills" role="status" aria-label={"Calculated stock status: "+stockLabel}><span className={stockLabel==="In Stock"?"selected":""}>In Stock</span><span className={stockLabel==="Low Stock"?"selected":""}>Low Stock</span><span className={stockLabel==="Out of Stock"?"selected":""}>Out of Stock</span></div></div></div><div className="apAvailabilityRow"><strong>Availability mode</strong><label><input type="radio" checked={draft.availabilityMode==="now"} onChange={()=>{set("availabilityMode","now");set("preorderEta","");}}/> Available Now</label><label><input type="radio" checked={draft.availabilityMode==="preorder"} onChange={()=>set("availabilityMode","preorder")}/> Pre-order</label></div>{draft.availabilityMode==="preorder"&&<label className="apField"><span>Expected availability date</span><input type="datetime-local" value={draft.preorderEta} onChange={e=>set("preorderEta",e.target.value)}/></label>}<div className="apInventoryFields">{field("reorderLevel","Reorder level",{type:"number",min:0,step:1,required:true})}<label className="apField"><span>Reserved quantity</span><input value={selected?.reserved??0} disabled/></label><label className="apField"><span>Warehouse / location</span><a className="apStockManageLink" href={selected?"/admin/inventory?sku="+encodeURIComponent(selected.sku):"/admin/inventory"}>Open Inventory Command Center ↗</a></label></div><div className="apStockIndicator" role="status"><strong>{stockLabel}</strong><span>Available to sell: {available} pcs</span></div><p className="apHint">Pre-order is product metadata only. Checkout and fulfillment remain disabled until operational integration is verified.</p></div></section>
<section className="apCard apMedia" id="ap-media"><h3><ImagePlus size={19}/> Product Photos <small>Cloudflare R2</small></h3>
 <div className="apCardBody">
  <p className="apUploadHelp"><strong>One cover + additional gallery images.</strong> First saved photo becomes cover unless you choose another. Max 12 JPEG/PNG/WebP (3 MB each).</p>
  <div className="apUploadDrop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!ready||busy||uploading)return;const batch=Array.from(e.dataTransfer.files);setFiles(old=>[...old,...batch].slice(0,Math.max(0,12-(selected?.imageUrls.length||0))));}}>
   <ImagePlus size={22}/><strong>Drop product photos here</strong><span>or choose one / multiple images</span>
   <button type="button" disabled={!ready||busy||uploading} onClick={()=>fileRef.current?.click()}>Choose Images</button>
  </div>
  <input ref={fileRef} className="apHiddenPhotoInput" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={!ready||busy||uploading} onChange={e=>{const batch=Array.from(e.target.files||[]);setFiles(old=>[...old,...batch].slice(0,Math.max(0,12-(selected?.imageUrls.length||0))));setFeedback(batch.length+" photo(s) selected. Choose cover then upload.");e.currentTarget.value="";}}/>
  {!!files.length&&<div className="apPendingPhotos">
   <strong>New photos ({files.length}) — choose a cover before upload</strong>
   <div className="apPendingPhotoGrid">{files.map((file,i)=><div className="apPendingPhotoCard" key={file.name+"-"+i}>
    {pendingPreviews[i]?<img src={pendingPreviews[i]} alt={file.name}/>:<ImagePlus size={24}/>}
    <small title={file.name}>{file.name}</small>
    <button type="button" className={pendingCover===i?"selected":""} onClick={()=>setPendingCover(p=>p===i?null:i)}>
      {pendingCover===i||(pendingCover===null&&!selected?.imageUrls.length&&i===0)?"Cover ✓":"Make cover"}
    </button>
   </div>)}</div>
  </div>}
  <div className="apUploadFooter">
   <span>{selected?.imageUrls.length?1:files.length?1:0} cover · {Math.max(0,(selected?.imageUrls.length||0)-1)+Math.max(0,files.length-(selected?.imageUrls.length?0:1))} gallery / pending · {12-(selected?.imageUrls.length||0)-files.length} slots left</span>
   {selected?<button type="button" disabled={!files.length||busy||uploading||!ready} onClick={()=>void uploadSelectedPhotos()}>{uploading?"Uploading…":"Upload selected photos to R2"}</button>:<span>New product: save product to upload photos</span>}
  </div>
  {selected&&<ProductPhotoManager product={selected} compact onSaved={data=>{setSelected(old=>old?{...old,...data}:old);setVersion(v=>v+1);}}/>}
 </div></section>
<section className="apCard apDetails" id="ap-details"><h3>Product Details</h3><div className="apDetailsBody"><label className="apField"><span>Product description</span></label><ProductDescriptionEditor value={draft.description} onChange={value=>set("description",value)}/><div className="apSaveBox" id="ap-publishing"><div className="apPublishQuick"><button type="button" className={!draft.active&&!draft.scheduledPublishAt?"chosen":""} onClick={()=>{set("active",false);set("scheduledPublishAt","");}}>Save as Draft</button><button type="button" className={draft.active?"chosen":""} onClick={()=>{set("active",true);set("scheduledPublishAt","");}}>Publish Now</button><button type="button" className={draft.scheduledPublishAt?"chosen":""} onClick={()=>{set("active",false);if(!draft.scheduledPublishAt){const date=new Date(Date.now()+86400000);const local=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);set("scheduledPublishAt",local);}}}>Schedule</button></div><div className="apScheduleField"><label className="apField"><span>Schedule publication (local time)</span><input type="datetime-local" value={draft.scheduledPublishAt} onChange={e=>{set("scheduledPublishAt",e.target.value);if(e.target.value)set("active",false);}} /></label><p className="apHint">Scheduling keeps the product as Draft until the scheduled publisher runs. Clear the date to publish immediately.</p></div><label className="apPublish"><input type="checkbox" checked={draft.active} disabled={!!draft.scheduledPublishAt} onChange={e=>set("active",e.target.checked)}/><span>Publish product immediately</span></label><label className="apPublish"><input type="checkbox" checked={draft.featured} onChange={e=>set("featured",e.target.checked)}/><span>Featured product (merchandising)</span></label>{field("barcode","Barcode / label",{maxLength:80,placeholder:"Optional barcode"})}<p className="apHint">Published means visible in catalogue; it does not guarantee physical stock.</p><button className="apPrimary" disabled={busy||uploading} type="submit"><Save size={18}/>{busy||uploading?"Saving and uploading…":selected?"Save product changes":"Save product & photos"}</button>{selected&&<button type="button" className="apSecondary" onClick={reset}>New product</button>}</div></div></section>
<section className="apCard"><h3><Layers size={19}/> Origin</h3><div className="apCardBody apCountries">{choices.map(v=><button type="button" key={v} className={draft.origin===v?"chosen":""} onClick={()=>set("origin",v)}>{v}</button>)}</div></section>
<section className="apCard apPublishing"><h3>Publishing & Merchandising</h3><div className="apPublishingInfo"><span>Visibility: {draft.scheduledPublishAt?"Scheduled Draft":draft.active?"Published":"Draft"}</span><span>Featured: {draft.featured?"Yes":"No"}</span><span>Channels: {draft.salesChannels.join(", ")||"None"}</span>{(["online","app","marketplace"] as const).map(ch=><label key={ch}><input type="checkbox" checked={draft.salesChannels.includes(ch)} onChange={e=>set("salesChannels",e.target.checked?[...draft.salesChannels,ch]:draft.salesChannels.filter(x=>x!==ch))}/> {ch}</label>) }<span>Pre-order: {draft.availabilityMode==="preorder"?"Metadata enabled":"No"}; external channel sync not configured</span></div></section></div></div>
 </form>
 {feedback&&<p className={feedback.startsWith("Error")?"apFeedback apError":"apFeedback"} role="status">{feedback}</p>}
 
 </div><aside className="apReferenceActions"><section><h3>Product Status</h3><p>{selected?(selected.active?"● Published":"○ Draft"):"New product"}</p><p>{selected?`SKU: ${selected.sku}`:"Select a product to edit."}</p><p>{selected?`Available units: ${available}`:""}</p><p>Stock: {stockLabel}</p><p>Featured: {draft.featured?"Yes":"No"}</p><p>Lifecycle: {selected?.archived?"Archived":draft.scheduledPublishAt?"Scheduled":draft.active?"Published":"Draft"}</p>{draft.scheduledPublishAt&&<p>Scheduled for: {new Date(draft.scheduledPublishAt).toLocaleString()}</p>}</section><section><h3>Inventory Summary</h3><p>Total stock: {selected?.onHand??(Number(draft.stock)||0)}</p><p>Reserved: {selected?.reserved??0}</p><p>Available to sell: {available}</p><p>Reorder threshold: {draft.reorderLevel}</p><a href="/admin?tab=Inventory">View audited stock movements ↗</a></section><section><h3>Category management</h3><p>{categories.find(c=>c.id===categoryId)?.name||draft.category||"No category selected"}</p><p>{categories.find(c=>c.id===subcategoryId)?.name||"No subcategory selected"}</p><button type="button" onClick={()=>openTax(null)}>+ Create category</button><button type="button" disabled={!categoryId} onClick={()=>openTax(categoryId)}>+ Create subcategory</button></section><section><h3>Quick Actions</h3>{selected&&<button type="button" disabled={busy} onClick={()=>void toggleArchive()}>{selected.archived?"Restore to Draft":"Archive Product"}</button>}<button type="button" onClick={reset}>＋ Add new product</button><a href="/admin/products/seo">Edit product SEO ↗</a><a href="/admin?tab=Inventory">Inventory & stock ↗</a><a href="/admin?tab=Bulk%20Import">Bulk import ↗</a><a href="/admin?tab=Activity%20Logs">Activity logs ↗</a></section><section><h3>Audit / Last Updated</h3><p>{selected?.updatedAt?new Date(selected.updatedAt).toLocaleString("en-BD",{dateStyle:"medium",timeStyle:"short"}):"New unsaved product"}</p><p>Product changes are recorded in Activity Logs.</p><p>Existing Add/Edit, photo uploads and variant workflows are reused. Stock adjustments stay in Inventory. Product deletion is not introduced.</p></section></aside></div>
 {taxOpen&&<div className="apTaxDialog" role="dialog" aria-modal="true" aria-label="Manage category"><form onSubmit={e=>{e.preventDefault();void changeTax(taxEditId?"PATCH":"POST");}}><h3>{taxEditId?"Edit":"Create"} {taxParent?"subcategory":"category"}</h3><label>Category name<input autoFocus required minLength={2} maxLength={90} value={taxName} onChange={e=>setTaxName(e.target.value)}/></label><p className="apHint">Name and slug changes do not automatically migrate existing product categories.</p>{taxMessage&&<p className="apTaxFormError" role="alert">{taxMessage}</p>}<div><button type="button" onClick={()=>setTaxOpen(false)}>Cancel</button><button type="submit" disabled={taxBusy}>{taxBusy?"Saving…":"Save category"}</button></div></form></div>}{taxMessage&&<p role="status" className="apFeedback">{taxMessage}</p>}
 <details className="apAdvanced"><summary>Advanced product fields · ingredients, care, materials, notes and SEO details</summary><p className="apHint">The full legacy editor remains available for all product specifications. Product galleries remain in the new R2 workspace above.</p><ProductManager/></details>
 </div>;
}
