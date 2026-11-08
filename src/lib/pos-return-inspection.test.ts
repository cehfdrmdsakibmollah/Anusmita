import {describe,it,expect} from "vitest";
import {inspectPosReturnInput,validatePosInspection} from "./pos-return-inspection";
describe("POS inspected return to stock policy",()=>{
 it("allows resale only for a physically quarantined return approved by staff",()=>{
  expect(validatePosInspection("quarantine","restocked")).toBe("restocked");
  expect(validatePosInspection("quarantine","disposed")).toBe("disposed");
 });
 it("never restocks items originally classified as damaged",()=>{
  expect(()=>validatePosInspection("damaged","restocked")).toThrow("Damaged returns");
  expect(validatePosInspection("damaged","disposed")).toBe("disposed");
 });
 it("requires a strict return ID, approved outcome and inspection reasoning",()=>{
  const input={returnId:"aaaaaaaaaaaaaaaaaaaaaaaa",outcome:"restocked",note:"Sealed and inspected for resale"};
  expect(inspectPosReturnInput.safeParse(input).success).toBe(true);
  expect(inspectPosReturnInput.safeParse({...input,returnId:"../../../admin"}).success).toBe(false);
  expect(inspectPosReturnInput.safeParse({...input,outcome:"recycled-without-approval"}).success).toBe(false);
  expect(inspectPosReturnInput.safeParse({...input,note:"ok"}).success).toBe(false);
  expect(inspectPosReturnInput.safeParse({...input,actorId:"forged"}).success).toBe(false);
 });
});
