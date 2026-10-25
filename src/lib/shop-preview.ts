// Isolated demonstration data, never catalogue inventory or real product claims.
export type Region=readonly [number,number,number,number];
export type DemoProduct={id:number;name:string;category:string;origin:string;concerns:string[];price:number;popularity:number;region:Region};
const names=['Radiance Eau De Parfum','Glow Moisture Cream','Matte Velvet Lipstick','Vitamin C Face Serum','Premium Handbag',"Elegant Women’s Watch",'Cotton Bed Sheet Set','Satin Everyday Shirt','Daily UV Sunscreen'];
const categories=['Perfume','Skincare','Makeup','Skincare','Bags','Watches','Bedsheets','Fashion','Skincare'];
const prices=[2950,1850,950,1650,2850,3200,2650,2400,1450];
const regions:Region[]=[[274,408,220,171],[510,408,213,171],[738,408,256,171],[274,682,220,169],[510,682,213,169],[738,682,256,169],[274,955,220,157],[510,955,213,157],[738,955,256,157]];
export const demoProducts:DemoProduct[]=Array.from({length:48},(_,id)=>{const i=id%9;return {id,name:names[i]+(id>=9?` · Edition ${Math.floor(id/9)+1}`:''),category:categories[i],origin:['Japan','Korea','China'][i%3],concerns:categories[i]==='Skincare'?[['Sensitive','Dry Skin'],['Brightening','Acne','Oily Skin']][i%2]:[],price:prices[i]+Math.floor(id/9)*100,popularity:(id*17)%49,region:regions[i]};});
export type Filters={countries:string[];categories:string[];concerns:string[];min:number;max:number};
export const emptyFilters:Filters={countries:[],categories:[],concerns:[],min:0,max:20000};
export const sortOptions=['Newest','Price: Low to High','Price: High to Low','Popularity'] as const;
export type Sort=typeof sortOptions[number];
export function filterProducts(filters:Filters,query:string,sort:Sort,saved?:number[]){
 const result=demoProducts.filter(p=>(!filters.countries.length||filters.countries.includes(p.origin))&&(!filters.categories.length||filters.categories.includes(p.category))&&(!filters.concerns.length||filters.concerns.some(c=>p.concerns.includes(c)))&&p.price>=filters.min&&p.price<=filters.max&&p.name.toLowerCase().includes(query.trim().toLowerCase())&&(!saved||saved.includes(p.id)));
 return result.sort((a,b)=>sort==='Price: Low to High'?a.price-b.price:sort==='Price: High to Low'?b.price-a.price:sort==='Popularity'?b.popularity-a.popularity:a.id-b.id);
}
