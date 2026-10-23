
import {describe,it,expect} from "vitest";
import {driveImageUrl,driveImages,parseDriveImageId,validDriveId,findDriveMedia} from "./drive-media";
const id="1ox6P3J_wfThTQ_UuY2eAfyS0aaZNCCjY";
describe("ANUSMITA Drive image catalogue",()=>{
 it("indexes existing source media without inventing products",()=>{
  expect(driveImages.length).toBe(655);
  expect(findDriveMedia(id)?.origin).toBe("Korea");
  expect(driveImages.some(x=>x.mimeType==="image/heic")).toBe(true);
 });
 it("generates only fixed Google Drive HTTPS image URLs",()=>{
  expect(driveImageUrl(id)).toBe("https://drive.google.com/thumbnail?id="+id+"&sz=w1200");
  expect(driveImageUrl(id,320)).toContain("sz=w320");
 });
 it("rejects arbitrary domains and unsafe file identifiers",()=>{
  expect(validDriveId("../evil")).toBe(false);
  expect(()=>driveImageUrl("https://bad.example")).toThrow();
  expect(parseDriveImageId("https://evil.example/thumbnail?id="+id)).toBe(null);
  expect(parseDriveImageId("https://drive.google.com/thumbnail?id="+id+"&sz=w1200")).toBe(id);
 });
});
