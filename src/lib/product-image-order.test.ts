import {it,describe,expect} from "vitest";
import {editGallery} from "./product-image-order";
describe("Product photo arrangement",()=>{
 const images=["one","two","three"];
 it("makes selected photo storefront cover",()=>expect(editGallery(images,"three","cover")).toEqual(["three","one","two"]));
 it("moves left and right without losing photos",()=>{
  expect(editGallery(images,"two","move-left")).toEqual(["two","one","three"]);
  expect(editGallery(images,"two","move-right")).toEqual(["one","three","two"]);
 });
 it("preserves gallery photos after promoting an uploaded image to cover",()=>{const uploaded=["original-cover","gallery-1","gallery-2"];expect(editGallery(uploaded,"gallery-2","cover")).toEqual(["gallery-2","original-cover","gallery-1"]);});
 it("does not wrap photos at either edge",()=>{
  expect(editGallery(images,"one","move-left")).toEqual(images);
  expect(editGallery(images,"three","move-right")).toEqual(images);
 });
 it("unlinks only one chosen reference",()=>expect(editGallery(images,"two","unlink")).toEqual(["one","three"]));
 it("rejects stale/invalid references",()=>{
  expect(()=>editGallery(images,"missing","cover")).toThrow("no longer attached");
  expect(()=>editGallery(["one","one"],"one","cover")).toThrow("Duplicate");
 });
});
