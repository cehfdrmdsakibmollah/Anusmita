import {describe,it,expect} from 'vitest';
import {existsSync} from 'node:fs';
import {sheetCatalogue,selectCatalogue} from './sheet-catalogue';
describe('published sheet catalogue',()=>{
 it('publishes all 60 unique products with actual local images and no private costs or invented stock',()=>{
  expect(sheetCatalogue).toHaveLength(60);expect(new Set(sheetCatalogue.map(p=>p.id)).size).toBe(60);
  for(const p of sheetCatalogue){expect(existsSync('public'+p.image)).toBe(true);expect(p.pricePaisa).toBe(250000);expect(p).not.toHaveProperty('onHand');expect(p).not.toHaveProperty('buyingPrice');}
 });
 it('filters category without showing unrelated bedsheets',()=>{expect(selectCatalogue('Bed Sheets')).toHaveLength(60);expect(selectCatalogue('Skincare')).toHaveLength(0);expect(selectCatalogue('Bags')).toHaveLength(0)});
 it('searches across the entire catalogue by SKU and design',()=>{expect(selectCatalogue('All','ANUS-2026-001').map(p=>p.id)).toEqual(['ANUS-2026-001']);expect(selectCatalogue('All','no-such-product')).toHaveLength(0);});
 it('sorts without mutating source data',()=>{const before=sheetCatalogue.map(p=>p.id);expect(selectCatalogue()[0].id).toBe('ANUS-2026-060');selectCatalogue('All','','name');expect(sheetCatalogue.map(p=>p.id)).toEqual(before)});
});
