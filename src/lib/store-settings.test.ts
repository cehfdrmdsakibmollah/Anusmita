import {describe,it,expect} from "vitest";
import {defaultStoreSettings,storeSettings} from "./store-settings";
describe("store policies",()=>{
 it("uses existing shipping defaults and accepts only bounded monetary values",()=>{
  const settings=defaultStoreSettings({});
  expect(settings.dhakaShippingPaisa).toBe(7000);
  expect(settings.outsideShippingPaisa).toBe(12000);
  expect(storeSettings.safeParse({...settings,minimumOrderPaisa:-1}).success).toBe(false);
  expect(storeSettings.safeParse({...settings,minimumOrderPaisa:50000,maximumCodPaisa:30000}).success).toBe(false);
  expect(storeSettings.safeParse({...settings,timezone:"UTC"}).success).toBe(false);
 });
});
