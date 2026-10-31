import {describe,it,expect} from "vitest";
import {districtLocations,areaOptions,locationPairValid} from "./bd-locations";
describe("Bangladesh dependent checkout address selectors",()=>{
 it("covers all 64 districts with nonempty upazila lists",()=>{
  expect(districtLocations).toHaveLength(64);
  expect(new Set(districtLocations.map(x=>x.district)).size).toBe(64);
  expect(districtLocations.every(x=>x.areas.length>0)).toBe(true);
 });
 it("provides Dhaka urban thanas and normal upazilas",()=>{
  expect(areaOptions("Dhaka")).toContain("Gulshan");
  expect(areaOptions("Dhaka")).toContain("Mirpur");
  expect(areaOptions("Dhaka")).toContain("Savar");
 });
 it("rejects mismatched or absent district and area pairs",()=>{
  expect(locationPairValid("Dhaka","Gulshan")).toBe(true);
  expect(locationPairValid("Dhaka","No Such Thana")).toBe(false);
  expect(locationPairValid("Khulna","Gulshan")).toBe(false);
  expect(locationPairValid("","")).toBe(false);
 });
});