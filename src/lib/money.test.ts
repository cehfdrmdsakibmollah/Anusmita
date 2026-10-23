
import { describe,it,expect } from "vitest";
import { cartTotals,paymentStatus,balanceDue,paisa } from "./money";
describe("money accounting",()=>{
 it("does not confuse paisa with taka",()=>expect(cartTotals([{quantity:2,unitPricePaisa:15999}],7000)).toEqual({subtotalPaisa:31998,shippingPaisa:7000,totalPaisa:38998}));
 it("returns accurate partial balance",()=>{expect(balanceDue(50000,12000)).toBe(38000);expect(paymentStatus(50000,12000)).toBe("partial");});
 it("does not accept fractional integer-paisa input",()=>expect(()=>paisa(1.25)).toThrow());
 it("flags unpaid and paid",()=>{expect(paymentStatus(100,0)).toBe("unpaid");expect(paymentStatus(100,100)).toBe("paid");});
});
