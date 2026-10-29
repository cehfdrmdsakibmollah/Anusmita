import products from './sheet-catalogue.json';
export const sheetCatalogue=products;
export type CatalogueProduct=typeof products[number];
export function selectCatalogue(category='All',q='',sort='latest'){
 const normalized=category.toLowerCase().replace(/[^a-z]/g,'');
 let rows=['all','','bedsheets','bedsheet','home','homelifestyle'].includes(normalized)?[...products]:[];
 const term=q.trim().toLowerCase().slice(0,120);
 if(term)rows=rows.filter(p=>[p.name,p.id,p.description,p.material].join(' ').toLowerCase().includes(term));
 if(sort==='price-low')rows.sort((a,b)=>a.pricePaisa-b.pricePaisa);
 else if(sort==='price-high')rows.sort((a,b)=>b.pricePaisa-a.pricePaisa);
 else if(sort==='name')rows.sort((a,b)=>a.name.localeCompare(b.name));
 else rows.reverse();
 return rows;
}
