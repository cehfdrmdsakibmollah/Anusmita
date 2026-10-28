import {describe,it,expect} from 'vitest';
import {incoming,filterPreOrders,clampQuantity,preOrderTotal} from './pre-orders';
describe('pre-order preview',()=>{
 it('filters origins and sorts without changing source data',()=>{expect(filterPreOrders('Japan','arrival').map(p=>p.id)).toEqual(['sunscreen']);expect(filterPreOrders('All origins','price-asc').map(p=>p.price)).toEqual([1600,1800,2400]);expect(filterPreOrders('All origins','price-desc')[0].id).toBe('bedsheet');expect(incoming[0].id).toBe('serum');});
 it('orders sample batches by estimated arrival',()=>expect(filterPreOrders('All origins','arrival').map(p=>p.batch)).toEqual(['KR-1101','JP-1102','CN-1103']));
 it('bounds preview quantities and totals',()=>{expect(clampQuantity(-2)).toBe(1);expect(clampQuantity(20)).toBe(10);expect(clampQuantity(NaN)).toBe(1);expect(clampQuantity(2.8)).toBe(2);expect(preOrderTotal(incoming[0],3)).toBe(5400);});
});
