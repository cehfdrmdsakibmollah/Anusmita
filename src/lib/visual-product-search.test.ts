import {describe,it,expect} from 'vitest';
import {visualSearchFilter,visualSearchTerms,rankVisualCandidates} from './visual-product-search';
describe('image recognition catalogue matching',()=>{
 it('extracts only bounded clues, dropping filler and misleading terms',()=>{
  const terms=visualSearchTerms('The bottle appears to read Gucci Flora Gorgeous Gardenia Eau de Parfum');
  expect(terms).toContain('gucci');expect(terms).toContain('flora');expect(terms).not.toContain('bottle');
  expect(terms.length).toBeLessThanOrEqual(16);
 });
 it('searches published products only with escaped literal terms',()=>{
  const filter=visualSearchFilter(['gucci','flora']);
  expect(filter.active).toBe(true);
  expect(filter.$or).toHaveLength(10);
  expect(visualSearchFilter(['a.b']).$or[0].name.$regex).toBe('a\\.b');
 });
 it('ranks plausible product label matches above generic categories, no fabricated match',()=>{
  const rows=[
   {name:'Unrelated cream',brand:'Other',category:'Skincare'},
   {name:'Gucci Flora Gorgeous Gardenia',brand:'Gucci',category:'Perfume'},
   {name:'Pink perfume',brand:'Other',category:'Perfume'}
  ];
  const results=rankVisualCandidates(rows,['gucci','flora','gardenia']);
  expect(results).toHaveLength(1);
  expect(results[0].name).toContain('Gucci Flora');
 });
 it('limits suggestions and returns empty when nothing matches',()=>{
  expect(rankVisualCandidates([{name:'Serum'}],['gucci'])).toEqual([]);
  expect(rankVisualCandidates(Array.from({length:25},(_,i)=>({name:'Gucci '+i})),['gucci'])).toHaveLength(5);
 });
});
