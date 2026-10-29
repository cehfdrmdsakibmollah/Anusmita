import bedsheets from './sheet-catalogue.json';
import skincare from './skincare-catalogue.json';
export type CatalogueProduct={id:string;slug:string;name:string;category:string;material:string;description:string;image:string;pricePaisa:number|null;size:string;deliveryIncluded:boolean;availability?:string};
export const sheetCatalogue:CatalogueProduct[]=[...bedsheets,...skincare];
export function selectCatalogue(category='All',q='',sort='latest'){
 const normalized=category.toLowerCase().replace(/[^a-z]/g,'');
 let rows=sheetCatalogue.filter(p=>['all',''].includes(normalized)||(['bedsheets','bedsheet','home','homelifestyle'].includes(normalized)&&p.category==='Bed Sheets')||(normalized==='skincare'&&p.category==='Skincare')||(normalized==='beauty'&&['Beauty','Skincare'].includes(p.category)));
 const term=q.trim().toLowerCase().slice(0,120);
 if(term)rows=rows.filter(p=>[p.name,p.id,p.description,p.material].join(' ').toLowerCase().includes(term));
 if(sort==='price-low'||sort==='price-high')rows.sort((a,b)=>a.pricePaisa===null?1:b.pricePaisa===null?-1:sort==='price-low'?a.pricePaisa-b.pricePaisa:b.pricePaisa-a.pricePaisa);
 else if(sort==='name')rows.sort((a,b)=>a.name.localeCompare(b.name));
 else rows.reverse();
 return rows;
}
