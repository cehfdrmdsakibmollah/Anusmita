
import {describe,expect,it} from "vitest";
import {isPerfumeProduct,perfumeFamily,perfumeMl,perfumeVariantOptions} from "./product-variants";
const base={name:"Gucci Flora Gorgeous Gardenia EDP",brand:"Gucci",category:"Perfumes",
 slug:"gucci-flora-100",size:"100ml",variantLabel:"100ml",pricePaisa:1200000,onHand:4,reserved:1};
describe("real perfume SKU size cards",()=>{
 it("renders exactly the six requested options in order",()=>{
  const extra={...base,name:base.name+" (2ml Spray)",slug:"gucci-flora-2",size:"2 ml",variantLabel:"2ml spray",pricePaisa:19900,onHand:2,reserved:2};
  const sizes=perfumeVariantOptions(base,[extra]);
  expect(sizes.map(x=>x.label)).toEqual(["2ml Spray","5ml","10ml","15ml","50ml","100ml"]);
  expect(sizes[0]).toMatchObject({slug:"gucci-flora-2",pricePaisa:19900,available:0});
  expect(sizes[1]).toMatchObject({slug:null,pricePaisa:null,available:null});
  expect(sizes[5]).toMatchObject({selected:true,pricePaisa:1200000,available:3});
 });
 it("never joins similar-sounding or different-brand fragrances",()=>{
  const a={...base,name:base.name+" Bloom (5ml)",slug:"bloom",size:"5ml"};
  const b={...base,brand:"Other",name:base.name+" (5ml)",slug:"other",size:"5ml"};
  const c={...base,category:"Beauty",name:base.name+" (5ml)",slug:"wrong-category",size:"5ml"};
  expect(perfumeVariantOptions(base,[a,b,c])[1].slug).toBeNull();
 });
 it("accepts a name suffix or recorded size and validates fragrance detection",()=>{
  expect(perfumeFamily("Gucci Flora Gorgeous Gardenia EDP (2ml Spray)")).toBe(perfumeFamily(base.name));
  expect(perfumeMl({...base,size:"",variantLabel:"",name:"Gucci Flora EDP - 15 ml spray"})).toBe(15);
  expect(isPerfumeProduct(base)).toBe(true);
  expect(isPerfumeProduct({...base,name:"Cotton bedsheet",category:"Home"})).toBe(false);
 });
});
