export const origins=['All origins','Korea','Japan','China'] as const;
export type Origin=typeof origins[number];
export type PreOrder={id:string;title:string;origin:Origin;city:string;batch:string;status:'In transit'|'Preparing'|'Confirmed';arrival:string;arrivalStart:string;price:number;art:number[];step:number};
export const incoming:PreOrder[]=[
 {id:'serum',title:'Hydrating Serum',origin:'Korea',city:'Seoul',batch:'KR-1101',status:'In transit',arrival:'12–16 Nov 2026',arrivalStart:'2026-11-12',price:1800,art:[43,760,217,228],step:1},
 {id:'sunscreen',title:'Daily UV Sunscreen',origin:'Japan',city:'Tokyo',batch:'JP-1102',status:'Preparing',arrival:'18–22 Nov 2026',arrivalStart:'2026-11-18',price:1600,art:[273,760,215,228],step:0},
 {id:'bedsheet',title:'Soft Stripe Bedsheet',origin:'China',city:'Guangzhou',batch:'CN-1103',status:'Confirmed',arrival:'24–28 Nov 2026',arrivalStart:'2026-11-24',price:2400,art:[501,760,216,228],step:0},
];
export function filterPreOrders(origin:Origin,sort:string){const rows=incoming.filter(p=>origin==='All origins'||p.origin===origin);return rows.sort((a,b)=>sort==='price-asc'?a.price-b.price:sort==='price-desc'?b.price-a.price:a.arrivalStart.localeCompare(b.arrivalStart));}
export function clampQuantity(value:number){return Number.isFinite(value)?Math.max(1,Math.min(10,Math.trunc(value))):1;}
export function preOrderTotal(product:PreOrder,quantity:number){return product.price*clampQuantity(quantity);}
export const preOrderMoney=(value:number)=>`৳${value.toLocaleString('en-BD')}`;
