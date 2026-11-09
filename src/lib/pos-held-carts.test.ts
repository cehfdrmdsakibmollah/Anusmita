import {describe,it,expect} from "vitest";
import {encodeHeldCartBackup,parseHeldCartBackup,holdOwnerBranch,type HeldPosCart} from "./pos-held-carts";
const owner=holdOwnerBranch("aaaaaaaaaaaaaaaaaaaaaaaa","bbbbbbbbbbbbbbbbbbbbbbbb");
const cart:HeldPosCart={
 id:"11111111-1111-4111-8111-111111111111",ownerBranch:owner,createdAt:"2026-11-09T09:00:00.000Z",
 lines:[{productId:"cccccccccccccccccccccccc",sku:"SKU-123",name:"Rose Serum",barcode:"123",category:"Beauty",image:"",unitPricePaisa:145000,quantity:2}]
};
describe("POS held draft recovery security",()=>{
 it("roundtrips cashier and branch scoped non-financial backup",()=>{
  const raw=encodeHeldCartBackup(owner,[cart]);
  expect(parseHeldCartBackup(raw,owner)).toEqual([cart]);
  expect(raw).not.toContain("customerPhone");
  expect(raw).not.toContain("tenderedPaisa");
 });
 it("rejects backups belonging to other cashiers/branches",()=>{
  expect(()=>parseHeldCartBackup(encodeHeldCartBackup(owner,[cart]),holdOwnerBranch("dddddddddddddddddddddddd","bbbbbbbbbbbbbbbbbbbbbbbb"))).toThrow();
  expect(()=>encodeHeldCartBackup(owner,[{...cart,ownerBranch:"other"}])).toThrow();
 });
 it("rejects payment fields, bad quantities and duplicate products",()=>{
  const raw=JSON.parse(encodeHeldCartBackup(owner,[cart]));
  raw.carts[0].customerPhone="01812345678";
  expect(()=>parseHeldCartBackup(JSON.stringify(raw),owner)).toThrow();
  delete raw.carts[0].customerPhone;
  raw.carts[0].lines[0].quantity=0;
  expect(()=>parseHeldCartBackup(JSON.stringify(raw),owner)).toThrow();
  raw.carts[0].lines[0].quantity=2;
  raw.carts[0].lines.push(raw.carts[0].lines[0]);
  expect(()=>parseHeldCartBackup(JSON.stringify(raw),owner)).toThrow();
 });
 it("rejects malformed files and oversized backups",()=>{
  expect(()=>parseHeldCartBackup("not JSON",owner)).toThrow();
  expect(()=>parseHeldCartBackup("a".repeat(1024*1024+1),owner)).toThrow();
 });
});
