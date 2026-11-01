import {describe,it,expect} from "vitest";
import {validateCommercialState} from "./commercial-state";
const now=new Date("2026-11-02T00:00:00.000Z");
describe("commercial product metadata",()=>{
 it("accepts a pre-order with a future ETA",()=>{expect(validateCommercialState({availabilityMode:"preorder",preorderEta:"2030-01-01T00:00:00.000Z"},now).availabilityMode).toBe("preorder")});
 it("rejects pre-orders without ETA",()=>{expect(()=>validateCommercialState({availabilityMode:"preorder",preorderEta:null},now)).toThrow()});
 it("rejects ETA in the past",()=>{expect(()=>validateCommercialState({availabilityMode:"preorder",preorderEta:"2020-01-01T00:00:00.000Z"},now)).toThrow()});
 it("rejects ETA for available-now product",()=>{expect(()=>validateCommercialState({availabilityMode:"now",preorderEta:"2030-01-01T00:00:00.000Z"},now)).toThrow()});
 it("rejects duplicate channels",()=>{expect(()=>validateCommercialState({salesChannels:["online","online"]},now)).toThrow()});
 it("accepts valid channels and discount",()=>{expect(validateCommercialState({salesChannels:["online","app"],discountPercent:12},now).discountPercent).toBe(12)});
});
