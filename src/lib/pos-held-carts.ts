import {z} from "zod";
/** Local-only, nonfinancial held carts. Never store customer PII, cash tender or payment credentials. */
export type HeldPosLine={
 productId:string;name:string;sku:string;barcode:string;category:string;
 image:string;unitPricePaisa:number;quantity:number
};
export type HeldPosCart={id:string;ownerBranch:string;createdAt:string;lines:HeldPosLine[]};
const DATABASE="anusmita-pos-held-drafts-v1",STORE="held-carts";
function openDb():Promise<IDBDatabase>{
 if(typeof indexedDB==="undefined")return Promise.reject(new Error("IndexedDB not available in this browser"));
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DATABASE,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(STORE)){
    const store=db.createObjectStore(STORE,{keyPath:"id"});
    store.createIndex("ownerBranch","ownerBranch",{unique:false});
   }
  };
  req.onerror=()=>reject(req.error||new Error("Unable to open held cart storage"));
  req.onsuccess=()=>resolve(req.result);
 });
}
async function operation<T>(mode:IDBTransactionMode,perform:(store:IDBObjectStore,resolve:(value:T)=>void,reject:(error:Error)=>void)=>void):Promise<T>{
 const db=await openDb();
 return new Promise<T>((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
  let value:T,wasSet=false;
  const good=(next:T)=>{value=next;wasSet=true};
  perform(store,good,err=>{reject(err)});
  tx.oncomplete=()=>{db.close();if(wasSet)resolve(value);else reject(new Error("Local cart storage did not return a result"))};
  tx.onerror=()=>{db.close();reject(tx.error||new Error("Local cart storage failed"))};
  tx.onabort=()=>{db.close();reject(tx.error||new Error("Local cart storage aborted"))};
 });
}
export function holdOwnerBranch(userId:string,branchId:string){
 if(!/^[0-9a-f]{24}$/i.test(userId)||!/^[0-9a-f]{24}$/i.test(branchId))throw new Error("Invalid cashier or branch");
 return userId.toLowerCase()+":"+branchId.toLowerCase();
}
export async function listHeldCarts(ownerBranch:string):Promise<HeldPosCart[]>{
 const list=await operation<HeldPosCart[]>("readonly",(store,done,fail)=>{
  const req=store.index("ownerBranch").getAll(ownerBranch);
  req.onsuccess=()=>done(req.result as HeldPosCart[]);
  req.onerror=()=>fail(req.error||new Error("Cannot read held carts"));
 });
 return list.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,25);
}
export async function saveHeldCart(cart:HeldPosCart):Promise<void>{
 if(!cart.lines.length||cart.lines.length>40||cart.lines.some(l=>l.quantity<1||!Number.isInteger(l.quantity)||!Number.isSafeInteger(l.unitPricePaisa)))throw new Error("Invalid held cart");
 const previous=await listHeldCarts(cart.ownerBranch);
 if(previous.length>=25&&!previous.some(x=>x.id===cart.id))throw new Error("25 held carts per cashier and branch is the maximum");
 return operation<void>("readwrite",(store,done,fail)=>{
  const request=store.put(cart);
  request.onsuccess=()=>done(undefined);
  request.onerror=()=>fail(request.error||new Error("Unable to hold sale"));
 });
}
export async function deleteHeldCart(id:string):Promise<void>{
 return operation<void>("readwrite",(store,done,fail)=>{
  const request=store.delete(id);
  request.onsuccess=()=>done(undefined);
  request.onerror=()=>fail(request.error||new Error("Unable to delete held cart"));
 });
}

/** Portable draft backups contain product display snapshots only, never payment, customer or authorization data. */
const hex=z.string().regex(/^[a-f0-9]{24}$/i);
const safeText=z.string().max(180);
const heldLineSchema=z.object({
 productId:hex,name:safeText,sku:z.string().min(1).max(80),
 barcode:z.string().max(80),category:z.string().max(100),image:z.string().max(2048),
 unitPricePaisa:z.number().int().positive().max(1000000000),quantity:z.number().int().min(1).max(100)
}).strict();
const heldDraftSchema=z.object({
 id:z.string().uuid(),ownerBranch:z.string().regex(/^[a-f0-9]{24}:[a-f0-9]{24}$/i),
 createdAt:z.string().datetime({offset:true}),
 lines:z.array(heldLineSchema).min(1).max(40)
}).strict().refine(c=>new Set(c.lines.map(l=>l.productId)).size===c.lines.length,{message:"Duplicate item in held cart"});
const backupSchema=z.object({
 kind:z.literal("anusmita-pos-draft-backup"),version:z.literal(1),ownerBranch:z.string(),
 carts:z.array(heldDraftSchema).max(25)
}).strict();
export function encodeHeldCartBackup(ownerBranch:string,carts:HeldPosCart[]):string{
 const parsed=backupSchema.parse({kind:"anusmita-pos-draft-backup",version:1,ownerBranch,carts});
 if(parsed.carts.some(c=>c.ownerBranch!==ownerBranch))throw Error("Backup includes another cashier or branch");
 return JSON.stringify(parsed,null,2);
}
export function parseHeldCartBackup(raw:string,ownerBranch:string):HeldPosCart[]{
 if(raw.length>1024*1024)throw Error("Backup exceeds 1 MB");
 let decoded:unknown;
 try{decoded=JSON.parse(raw);}catch{throw Error("Backup is not valid JSON");}
 const data=backupSchema.parse(decoded);
 if(data.ownerBranch!==ownerBranch||data.carts.some(c=>c.ownerBranch!==ownerBranch))
  throw Error("Backup belongs to another cashier or branch");
 return data.carts;
}
