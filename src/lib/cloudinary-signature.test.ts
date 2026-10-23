
import {describe,it,expect} from "vitest";
import {cloudinarySignature,uploadReceiptToken,receiptMatches,supportedUpload,managedAssetId} from "./cloudinary-signature";
describe("signed image uploads",()=>{
 it("matches the documented Cloudinary SHA-1 example",()=>expect(cloudinarySignature({timestamp:1315060510},"abcd")).toBe("a21ad0f63beb4de2e5575204b79ab90bffb02c10"));
 it("sorts and signs all caller-controlled fields",()=>expect(cloudinarySignature({timestamp:1315060510,public_id:"sample_image",eager:"w_400,h_300,c_pad|w_260,h_200,c_crop"},"abcd")).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e"));
 it("rejects unsupported files or oversized uploads",()=>{
  expect(supportedUpload("image/jpeg",120000)).toBe(true);
  expect(supportedUpload("image/heic",1000)).toBe(false);
  expect(supportedUpload("image/png",11000000)).toBe(false);
 });
 it("binds completion proof to actor, product and timestamp",()=>{
  const secret="a-very-long-secret",x=uploadReceiptToken(secret,"user1","product1","id1",100,"at1");
  expect(receiptMatches(x,x)).toBe(true);
  expect(receiptMatches(x,uploadReceiptToken(secret,"user2","product1","id1",100,"at1"))).toBe(false);
  expect(receiptMatches("bad",x)).toBe(false);
 });
 it("only allows managed ANUSMITA IDs",()=>{
  expect(managedAssetId("anusmita/products/507f1f77bcf86cd799439011/842b6b75-5d67-4753-8f35-86263f55e63c")).toBe(true);
  expect(managedAssetId("samples/sample")).toBe(false);
  expect(managedAssetId("anusmita/drive/korea/drive-1ox6P3J_wfThTQ_UuY2eAfyS0aaZNCCjY")).toBe(true);
 });
});
