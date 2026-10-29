import {describe,it,expect} from 'vitest';
import {sanitizeShopping,shoppingSubtotal} from './shopping-storage';
import {sheetCatalogue,selectCatalogue} from './sheet-catalogue';
describe('shopping selection',()=>{
 it('rejects unknown IDs and invalid quantities; deduplicates saved products',()=>{expect(sanitizeShopping({cart:[{id:'fake',quantity:1},{id:'K01',quantity:-1},{id:'K02',quantity:1.5},{id:'K03',quantity:999}],wishlist:['K01','K01','fake']})).toEqual({cart:[{id:'K03',quantity:20}],wishlist:['K01']})});
 it('handles malformed saved content',()=>{expect(sanitizeShopping(null)).toEqual({cart:[],wishlist:[]});expect(sanitizeShopping({cart:'bad',wishlist:{}})).toEqual({cart:[],wishlist:[]})});
 it('uses catalogue prices, not prices supplied by storage',()=>{expect(shoppingSubtotal(sanitizeShopping({cart:[{id:'ANUS-2026-001',quantity:2,pricePaisa:1},{id:'K01',quantity:1}]}))).toBe(739900)});
 it('does not invent missing or confirmation-required prices',()=>{for(const id of ['K12','K18','K23','K27','K30'])expect(sheetCatalogue.find(p=>p.id===id)?.pricePaisa).toBeNull();expect(selectCatalogue('Skincare','','price-low').at(-1)?.pricePaisa).toBeNull()});
});
