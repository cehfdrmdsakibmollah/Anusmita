
import {describe,it,expect} from "vitest";
import {PERFUME_SIZES,canonicalPerfumeSize,perfumeSizeCards,isPerfumeCategory,shouldListGroup} from "./product-variants";
describe("ANUSMITA perfume size catalogue",()=>{
 it("matches the six requested real SKU sizes",()=>{
  expect(PERFUME_SIZES.map(x=>x.label)).toEqual(["2ml Spray","5ml","10ml","15ml","50ml","100ml"]);
  expect(canonicalPerfumeSize("2 ml spray")).toBe("2ml spray");
  expect(canonicalPerfumeSize("5ML")).toBe("5ml");
  expect(canonicalPerfumeSize("10 ml decant")).toBe("10ml");
  expect(canonicalPerfumeSize("15ml")).toBe("15ml");
  expect(canonicalPerfumeSize("50 ml")).toBe("50ml");
  expect(canonicalPerfumeSize("100 ml bottle")).toBe("100ml");
  expect(canonicalPerfumeSize("Standard")).toBeNull();
 });
 it("does not invent price or stock when a size has no linked published SKU",()=>{
  const current={id:"id-5",sku:"PERFUME-5",slug:"rose-perfume-5ml",size:"5ml",available:9,pricePaisa:125000};
  const cards=perfumeSizeCards([],current);
  expect(cards).toHaveLength(6);
  expect(cards[1]).toMatchObject({label:"5ml",pricePaisa:125000,selected:true,available:9});
  expect(cards[0]).toMatchObject({label:"2ml Spray",pricePaisa:null,slug:null,available:null,selected:false});
  expect(cards[5].pricePaisa).toBeNull();
 });
 it("uses linked SKU price and stock instead of guessed percentage/volume scaling",()=>{
  const selected={id:"a",sku:"TEST-15",slug:"test-15ml",size:"15 ml",pricePaisa:298000,available:0};
  const other={id:"b",sku:"TEST-100",slug:"test-100ml",size:"100ml",pricePaisa:1499900,available:3};
  const result=perfumeSizeCards([other],selected);
  expect(result[3]).toMatchObject({pricePaisa:298000,available:0,selected:true});
  expect(result[5]).toMatchObject({pricePaisa:1499900,available:3,selected:false,slug:"test-100ml"});
 });
 it("only groups manually linked inventory",()=>{
  expect(isPerfumeCategory("Perfumes")).toBe(true);
  expect(isPerfumeCategory("Beauty")).toBe(false);
  expect(shouldListGroup("gucci-flora-gardenia")).toBe(true);
  expect(shouldListGroup("")).toBe(false);
  expect(shouldListGroup("Other Product")).toBe(false);
 });
});
