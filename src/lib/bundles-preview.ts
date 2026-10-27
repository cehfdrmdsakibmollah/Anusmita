export const bundleCategories = ['All Bundles','Skincare','Beauty','Perfume','Lifestyle'] as const;
export type BundleCategory = typeof bundleCategories[number];
export type BundleSort = 'recommended'|'price-low'|'price-high'|'savings';
export type Bundle = {id:string;name:string;category:BundleCategory;items:string[];summary:string;price:number;original:number;art:readonly number[]};
export const routineBundle:Bundle={id:'routine',name:'Your complete Korean skincare routine',category:'Skincare',items:['Gentle Cleanser','Hydrating Toner','Daily Serum','Everyday Sunscreen'],summary:'Cleanser + Toner + Serum + Sunscreen',price:3600,original:4500,art:[51,453,369,353]};
export const comboBundles:Bundle[]=[
 {id:'duo',name:'Cleanse & Hydrate Duo',category:'Skincare',items:['Gentle Cleanser','Hydrating Toner'],summary:'Cleanser + Toner',price:1800,original:2000,art:[52,929,215,153]},
 {id:'beauty',name:'Everyday Beauty Trio',category:'Beauty',items:['Lip Colour','Mascara','Blush'],summary:'Lip colour + Mascara + Blush',price:2400,original:3000,art:[286,929,208,153]},
 {id:'fragrance',name:'The Fragrance Pair',category:'Perfume',items:['Fragrance Mini One','Fragrance Mini Two'],summary:'Two fragrance minis',price:1700,original:2000,art:[511,929,204,153]},
];
export const bundleSavings=(b:Bundle)=>({amount:Math.max(0,b.original-b.price),percent:b.original>0?Math.max(0,Math.round((1-b.price/b.original)*100)):0});
export function filterBundles(category:string,sort:BundleSort,query=''){
 const q=query.trim().toLowerCase();
 const rows=comboBundles.filter(b=>(category==='All Bundles'||b.category===category)&&`${b.name} ${b.summary} ${b.items.join(' ')}`.toLowerCase().includes(q));
 if(sort==='price-low')rows.sort((a,b)=>a.price-b.price);
 if(sort==='price-high')rows.sort((a,b)=>b.price-a.price);
 if(sort==='savings')rows.sort((a,b)=>bundleSavings(b).amount-bundleSavings(a).amount);
 return rows;
}
