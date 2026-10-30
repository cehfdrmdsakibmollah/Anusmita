import {sheetCatalogue} from './sheet-catalogue';
export type ShoppingState={cart:{id:string;quantity:number}[];wishlist:string[]};
export const shoppingKey='anusmita-shopping-v1';
export const emptyShopping:ShoppingState={cart:[],wishlist:[]};
export function sanitizeShopping(value:unknown):ShoppingState{
 const v=value as Partial<ShoppingState>|null;const known=new Set(sheetCatalogue.map(p=>p.id));
 const validId=(id:unknown):id is string=>typeof id==='string'&&(known.has(id)||/^[0-9a-f]{24}$/i.test(id));
 const cart=new Map<string,number>();
 if(Array.isArray(v?.cart))for(const line of v.cart){if(line&&validId(line.id)&&Number.isSafeInteger(line.quantity)&&line.quantity>0)cart.set(line.id,Math.min(20,line.quantity));}
 return {cart:[...cart].map(([id,quantity])=>({id,quantity})),wishlist:Array.isArray(v?.wishlist)?[...new Set(v.wishlist.filter(id=>typeof id==='string'&&validId(id)))]:[]};
}
export function shoppingSubtotal(state:ShoppingState){return state.cart.reduce((n,l)=>n+(sheetCatalogue.find(p=>p.id===l.id)?.pricePaisa||0)*l.quantity,0)}
