import {describe,it,expect} from 'vitest';
import {normalizeTrackingPhone,validateTrackingInput,matchesExampleOrder,examplePhone,exampleOrderId} from './tracking-preview';
describe('tracking preview form',()=>{
 it('accepts local, international and Bangla phone formats',()=>{
  for(const phone of ['01700000192','+880 1700-000192','008801700000192','8801700000192','০১৭০০০০০১৯২'])expect(normalizeTrackingPhone(phone)).toBe(examplePhone);
 });
 it('rejects missing, malformed and oversized input',()=>{
  expect(validateTrackingInput('','')).toHaveProperty('order');
  expect(validateTrackingInput('ANU-123','01200000192')).toHaveProperty('phone');
  expect(validateTrackingInput('A'.repeat(51),examplePhone)).toHaveProperty('order');
  expect(validateTrackingInput('<script>',examplePhone)).toHaveProperty('order');
  expect(validateTrackingInput(exampleOrderId,'01700000192abc')).toHaveProperty('phone');
 });
 it('requires both exact demo values, never matches an arbitrary customer',()=>{
  expect(matchesExampleOrder(' anu-10248 ','+8801700000192')).toBe(true);
  expect(matchesExampleOrder(exampleOrderId,'01700000193')).toBe(false);
  expect(matchesExampleOrder('ANU-10249',examplePhone)).toBe(false);
  expect(validateTrackingInput(exampleOrderId,examplePhone)).toEqual({});
 });
});
