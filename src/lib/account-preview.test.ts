import {describe,it,expect} from 'vitest';
import {initialAddresses,saveAddress,deleteAddress,stateSchema,initialAccount,validPhone} from './account-preview';
describe('account preview state',()=>{
 it('replaces default when a new address is saved as default',()=>{const a=saveAddress(initialAddresses,{...initialAddresses[0],id:'third'});expect(a.filter(x=>x.isDefault).map(x=>x.id)).toEqual(['third']);});
 it('promotes remaining address after default deletion',()=>{expect(deleteAddress(initialAddresses,'home')[0].isDefault).toBe(true);});
 it('allows deletion of all addresses',()=>{expect(deleteAddress([initialAddresses[0]],'home')).toEqual([]);});
 it('updates rather than duplicates an address',()=>{const a=saveAddress(initialAddresses,{...initialAddresses[0],street:'New sample road'});expect(a.length).toBe(2);expect(a[0].street).toBe('New sample road');});
 it('ensures first address is default',()=>{expect(saveAddress([],{...initialAddresses[1]})[0].isDefault).toBe(true);});
 it('rejects corrupt stored selections and duplicate defaults',()=>{expect(stateSchema.safeParse({...initialAccount,wishlist:['other']}).success).toBe(false);expect(stateSchema.safeParse({...initialAccount,addresses:initialAddresses.map(x=>({...x,isDefault:true}))}).success).toBe(false);});
 it('accepts BD phone formats and rejects placeholders',()=>{expect(validPhone('+8801700000000')).toBe(true);expect(validPhone('01700000000')).toBe(true);expect(validPhone('01XXXXXXXXX')).toBe(false);});
});
