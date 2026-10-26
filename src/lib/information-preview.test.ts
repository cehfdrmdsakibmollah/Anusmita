import {describe,it,expect} from 'vitest';
import {contact,enquirySchema,whatsappDraft,filterArticles} from './information-preview';
const enquiry={name:'Sample Customer',email:'sample@example.com',phone:'',subject:'Product enquiry' as const,message:'Perfume & skincare?'};
describe('information page interactions',()=>{
 it('uses the supplied WhatsApp and Messenger destinations',()=>{expect(contact.whatsapp).toBe('https://wa.me/8801310339192');expect(contact.messenger).toBe('https://m.me/AnusmitaBD');});
 it('encodes the complete draft without adding a second query parameter',()=>{const u=new URL(whatsappDraft(enquiry));expect([...u.searchParams.keys()]).toEqual(['text']);expect(u.searchParams.get('text')).toContain('Perfume & skincare?');expect(u.searchParams.get('text')).not.toContain('Phone:');});
 it('rejects blank or invalid contact submissions',()=>{expect(enquirySchema.safeParse({...enquiry,name:'  '}).success).toBe(false);expect(enquirySchema.safeParse({...enquiry,email:'wrong'}).success).toBe(false);expect(enquirySchema.safeParse({...enquiry,message:'x'.repeat(1501)}).success).toBe(false);});
 it('filters guides by category and skin type together',()=>{expect(filterArticles('','Skin Types','Dry').map(a=>a.id)).toEqual(['dry-skin']);expect(filterArticles('','Ingredients','Dry')).toEqual([]);});
 it('searches case-insensitively and supports no results',()=>{expect(filterArticles('  GENTLE ROUTINE  ','All','').map(a=>a.id)).toEqual(['evening']);expect(filterArticles('zzzz','All','')).toEqual([]);});
});
