import {describe,it,expect} from 'vitest';
import {bundleSavings,comboBundles,filterBundles,routineBundle} from './bundles-preview';
describe('bundle preview',()=>{
 it('computes consistent routine and combo savings',()=>{expect(bundleSavings(routineBundle)).toEqual({amount:900,percent:20});expect(comboBundles.map(bundleSavings)).toEqual([{amount:200,percent:10},{amount:600,percent:20},{amount:300,percent:15}]);});
 it('searches included items and combines category constraints',()=>{expect(filterBundles('Beauty','recommended','mascara').map(b=>b.id)).toEqual(['beauty']);expect(filterBundles('Skincare','recommended','mascara')).toEqual([]);expect(filterBundles('Lifestyle','recommended')).toEqual([]);});
 it('sorts by actual savings and leaves the source order intact',()=>{expect(filterBundles('All Bundles','savings')[0].id).toBe('beauty');expect(filterBundles('All Bundles','price-low')[0].id).toBe('fragrance');expect(comboBundles[0].id).toBe('duo');});
});
