import {describe,it,expect} from 'vitest';
import {categoryLabels,unitPrice,assistantHref,productEnquiry,productFacts} from './product-experience';
import {colourChoices,sizeChoices,type ProductVariant} from './product-variants';
import {productSchema} from './validation';
const base:ProductVariant={id:'1',slug:'navy-m',size:'M',pricePaisa:100000,available:3,sku:'N-M',color:'Navy',colorHex:'#112233'};
describe('category-aware product experience',()=>{
 it('keeps perfume volume and category-specific size labels',()=>{expect(categoryLabels('Perfumes').size).toBe('Volume');expect(categoryLabels('Bed Sheets').kind).toBe('home');expect(categoryLabels('Shoes').size).toBe('Shoe size');expect(categoryLabels('Jewellery').size).toBe('Size / finish');});
 it('does not invent a volume from an apparel size or multipack',()=>{expect(unitPrice(100000,'50ml')).toEqual({paisa:2000,unit:'ml'});expect(unitPrice(100000,'XL')).toBeNull();expect(unitPrice(100000,'0ml')).toBeNull();expect(unitPrice(100000,'2 x 50ml')).toBeNull();});
 it('keeps stock and prices attached to an actual colour-size SKU',()=>{const siblings=[{...base,id:'2',slug:'navy-l',size:'L',available:0},{...base,id:'3',slug:'rose-l',size:'L',color:'Rose',pricePaisa:120000}];expect(sizeChoices(siblings,base).map(v=>v.slug)).toEqual(['navy-m','navy-l']);expect(colourChoices(siblings,base).find(c=>c.color==='Rose')?.slug).toBe('rose-l');expect(siblings[0].available).toBe(0);});
 it('encodes product context without accepting a redirect',()=>{const href=assistantHref('Rose & Gold','rose-gold');expect(href).toContain('product=Rose+%26+Gold');expect(href).toContain('productSlug=rose-gold');expect(assistantHref('Test','https://evil.example')).not.toContain('productSlug');});
 it('builds an enquiry draft using the official contact and selected option',()=>{const url=new URL(productEnquiry('Bag','bag','Small','Black',2,'Happy birthday'));expect(url.pathname).toBe('/8801310339192');expect(url.searchParams.get('text')).toContain('Black · Small × 2');expect(url.searchParams.get('text')).toContain('Additional enquiry (please confirm details): Happy birthday');});
 it('only displays populated published facts',()=>{expect(productFacts({material:'Cotton',warranty:'',colorHex:'#ffffff'})).toEqual([{label:'Material / fabric',value:'Cotton'}]);});
 it('validates swatches and bounds specifications on admin writes',()=>{const schema=productSchema.pick({colorHex:true,material:true,sizeGuide:true});expect(schema.safeParse({colorHex:'red;background:url(x)',material:'Cotton'}).success).toBe(false);expect(schema.safeParse({colorHex:'#aabbcc',material:'Cotton',sizeGuide:'M: 90 cm'}).success).toBe(true);expect(schema.safeParse({material:'x'.repeat(301)}).success).toBe(false);});
});
