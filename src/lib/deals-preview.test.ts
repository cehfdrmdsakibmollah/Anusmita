import {describe,it,expect} from 'vitest';
import {previewDeadline,previewDuration,remainingSeconds,selectDeals,previewDeals,discountPercent} from './deals-preview';
describe('deal preview behavior',()=>{
 it('keeps an expired timer expired on reload',()=>{expect(previewDeadline('1000',2000)).toBe(1000);expect(remainingSeconds(1000,2000)).toBe(0);});
 it('rejects corrupted and excessive future deadlines',()=>{expect(previewDeadline('bad',2000)).toBe(2000+previewDuration);expect(previewDeadline(String(2000+previewDuration+5000),2000)).toBe(2000+previewDuration);});
 it('retains a valid deadline instead of restarting it',()=>{expect(previewDeadline('10000',2000)).toBe(10000);expect(remainingSeconds(10000,2500)).toBe(8);});
 it('combines search/category and sorts without mutating original order',()=>{expect(selectDeals('Skincare','price-low','gentle').map(d=>d.id)).toEqual(['cleanser']);expect(selectDeals('All Offers','price-low')[0].id).toBe('lipstick');expect(previewDeals[0].id).toBe('serum');expect(selectDeals('Fashion','recommended','serum')).toEqual([]);});
 it('calculates the displayed tote discount from matching prices',()=>{const tote=previewDeals.find(d=>d.id==='tote')!;expect(tote.original).toBe(2000);expect(discountPercent(tote)).toBe(15);});
});
