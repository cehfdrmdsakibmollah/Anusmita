import {describe,it,expect} from 'vitest';
import {calculatePreview,initialState,sessionSchema,validateDelivery,blankCustomer} from './checkout-preview';
describe('shopping design preview',()=>{
 it('matches reference total in integer paisa',()=>{expect(calculatePreview(initialState)).toEqual({subtotal:480000,discount:0,delivery:8000,total:488000,quantity:2});});
 it('recalculates quantities, coupon and outside delivery',()=>{expect(calculatePreview({...initialState,lines:[{id:'perfume',qty:2},{id:'cream',qty:1}],coupon:'DEMO10',shipping:'outside'})).toEqual({subtotal:775000,discount:77500,delivery:15000,total:712500,quantity:3});});
 it('does not imply a free international delivery quote',()=>{expect(calculatePreview({...initialState,shipping:'international'}).total).toBeNull();});
 it('charges nothing for an empty bag',()=>{expect(calculatePreview({...initialState,lines:[]}).total).toBe(0);});
 it('rejects corrupt quantities and duplicate or unknown products',()=>{for(const lines of [[{id:'perfume',qty:-1}],[{id:'perfume',qty:1.5}],[{id:'perfume',qty:21}],[{id:'unknown',qty:1}],[{id:'perfume',qty:1},{id:'perfume',qty:1}]])expect(sessionSchema.safeParse({...initialState,lines}).success).toBe(false);});
 it('rejects corrupted session choices and order dates',()=>{expect(sessionSchema.safeParse({...initialState,payment:'paid'}).success).toBe(false);expect(sessionSchema.safeParse({...initialState,order:{...initialState,id:'real-order',date:'invalid'}}).success).toBe(false);});
 it('requires delivery details and valid BD phone',()=>{expect(validateDelivery(blankCustomer)).not.toBe('');const c={...blankCustomer,name:'Sample Customer',address:'Sample Road',area:'Sample Area',district:'Dhaka',phone:'+8801700000000'};expect(validateDelivery(c)).toBe('');expect(validateDelivery({...c,phone:'123'})).not.toBe('');expect(validateDelivery({...c,email:'invalid'})).not.toBe('');});
});
