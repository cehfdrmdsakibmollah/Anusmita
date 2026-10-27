export const exampleOrderId='ANU-10248';
export const examplePhone='01700000192';
export const trackingSteps=['Confirmed','Processing','Packed','Out for delivery','Delivered'] as const;
export function normalizeTrackingPhone(value:string):string {
 const ascii=value.replace(/[০-৯]/g,c=>String('০১২৩৪৫৬৭৮৯'.indexOf(c))).replace(/[\s()-]/g,'');
 return ascii.replace(/^(?:\+880|00880|880)/,'0');
}
export function validateTrackingInput(order:string,phone:string):{order?:string;phone?:string} {
 const errors:{order?:string;phone?:string}={};
 if(!/^[A-Z0-9][A-Z0-9-]{2,49}$/.test(order.trim().toUpperCase()))errors.order='Enter a valid order ID using letters, numbers and hyphens.';
 if(!/^01[3-9]\d{8}$/.test(normalizeTrackingPhone(phone)))errors.phone='Enter the 11-digit Bangladesh phone number used at checkout.';
 return errors;
}
export function matchesExampleOrder(order:string,phone:string):boolean {
 return order.trim().toUpperCase()===exampleOrderId&&normalizeTrackingPhone(phone)===examplePhone;
}
export const exampleHistory=[
 {status:'Out for delivery',time:'Today, 9:30 AM',description:'The example parcel is with the delivery courier.'},
 {status:'Packed',time:'Yesterday, 4:15 PM',description:'The example parcel was packed and prepared for dispatch.'},
 {status:'Processing',time:'Yesterday, 11:00 AM',description:'The example order was being prepared.'},
 {status:'Confirmed',time:'Yesterday, 10:20 AM',description:'The example order was confirmed.'},
];
