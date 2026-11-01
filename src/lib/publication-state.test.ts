import {describe,it,expect} from "vitest";
import {publicationState,assertFutureSchedule} from "./publication-state";
describe("product publication state",()=>{
 it("rejects archived products being published",()=>{expect(publicationState.safeParse({archived:true,active:true,scheduledPublishAt:null}).success).toBe(false)});
 it("rejects archived products with a schedule",()=>{expect(publicationState.safeParse({archived:true,active:false,scheduledPublishAt:"2030-01-01T00:00:00.000Z"}).success).toBe(false)});
 it("allows restoring an archived item as draft",()=>{expect(publicationState.safeParse({archived:false,active:false,scheduledPublishAt:null}).success).toBe(true)});
 it("accepts a draft with a scheduled publication",()=>{
  expect(publicationState.safeParse({active:false,scheduledPublishAt:"2030-06-01T11:00:00.000Z"}).success).toBe(true);
 });
 it("rejects published products with active schedule",()=>{
  expect(publicationState.safeParse({active:true,scheduledPublishAt:"2030-06-01T11:00:00.000Z"}).success).toBe(false);
 });
 it("accepts manual publication without schedule",()=>{
  expect(publicationState.safeParse({active:true,scheduledPublishAt:null}).success).toBe(true);
 });
 it("rejects a past date",()=>{
  expect(()=>assertFutureSchedule("2020-01-01T00:00:00.000Z",new Date("2026-11-02T00:00:00.000Z"))).toThrow();
 });
 it("accepts future date",()=>{
  expect(()=>assertFutureSchedule("2030-01-01T00:00:00.000Z",new Date("2026-11-02T00:00:00.000Z"))).not.toThrow();
 });
});
