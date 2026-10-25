import {describe,it,expect} from 'vitest';
import {demoProducts,emptyFilters,filterProducts} from './shop-preview';
describe('isolated shop preview filtering',()=>{
 it('preserves reference first-page order and supports six pages',()=>{expect(filterProducts(emptyFilters,'','Newest')).toEqual(demoProducts);expect(demoProducts).toHaveLength(48);});
 it('combines filter groups and ORs selections within a group',()=>{const found=filterProducts({...emptyFilters,categories:['Skincare','Makeup'],countries:['Japan'],concerns:['Brightening']},'','Newest');expect(found.length).toBeGreaterThan(0);expect(found.every(p=>p.category==='Skincare'&&p.origin==='Japan'&&p.concerns.includes('Brightening'))).toBe(true);});
 it('enforces both price bounds and sorts numerically',()=>{const found=filterProducts({...emptyFilters,min:1800,max:3000},'','Price: Low to High');expect(found.every(p=>p.price>=1800&&p.price<=3000)).toBe(true);expect(found.map(p=>p.price)).toEqual(found.map(p=>p.price).sort((a,b)=>a-b));});
 it('searches case-insensitively and restricts wishlist',()=>{expect(filterProducts(emptyFilters,'SERUM','Newest',[3])).toEqual([demoProducts[3]]);expect(filterProducts(emptyFilters,'','Newest',[])).toEqual([]);});
 it('returns no matches for unrelated concerns and fashion',()=>{expect(filterProducts({...emptyFilters,categories:['Fashion'],concerns:['Acne']},'','Newest')).toEqual([]);});
});
