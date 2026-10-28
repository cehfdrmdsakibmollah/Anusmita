import {describe,it,expect} from 'vitest';
import {validateGift,dhakaDate,type GiftDraft} from './gift-cards';
const draft:GiftDraft={amount:2000,recipient:'A',email:'a@example.com',sender:'B',message:'',delivery:'now',date:''};
describe('gift preview validation',()=>{
 it('accepts a complete immediate gift',()=>expect(validateGift(draft)).toEqual({}));
 it('rejects blank names, invalid email and unsupported amounts',()=>expect(Object.keys(validateGift({...draft,amount:1,recipient:' ',sender:'',email:'a'}))).toEqual(['amount','recipient','email','sender']));
 it('requires a real future date only for scheduled gifts',()=>{for(const date of ['','2026-02-30','2026-10-27','2026-10-26']) expect(validateGift({...draft,delivery:'later',date},'2026-10-27').date).toBeTruthy();expect(validateGift({...draft,delivery:'later',date:'2026-10-28'},'2026-10-27')).toEqual({});});
 it('uses the Bangladesh calendar across UTC midnight',()=>expect(dhakaDate(new Date('2026-10-27T20:00:00Z'))).toBe('2026-10-28'));
 it('limits the personal message',()=>expect(validateGift({...draft,message:'a'.repeat(501)}).message).toBeTruthy());
});
