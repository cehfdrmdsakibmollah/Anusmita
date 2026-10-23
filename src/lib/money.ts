
export function paisa(value: unknown, label = "amount"): number {
 if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(label + " must be nonnegative integer paisa");
 return value;
}
export function taka(value: number) { return new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(value/100); }
export function cartTotals(lines: {quantity:number;unitPricePaisa:number}[], shippingPaisa: number) {
 const subtotalPaisa = lines.reduce((sum,l) => sum + l.quantity*l.unitPricePaisa,0);
 if (!Number.isSafeInteger(subtotalPaisa) || subtotalPaisa<0) throw new Error("Invalid total");
 return {subtotalPaisa,shippingPaisa,totalPaisa:subtotalPaisa+shippingPaisa};
}
export function balanceDue(total:number,collected:number) { return Math.max(0,total-collected); }
export function paymentStatus(total:number,collected:number): "unpaid"|"partial"|"paid" {
 return collected<=0?"unpaid":collected>=total?"paid":"partial";
}
