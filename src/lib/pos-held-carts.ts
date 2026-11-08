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
