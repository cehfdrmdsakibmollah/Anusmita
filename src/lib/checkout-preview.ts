import {z} from 'zod';
// Demonstration data only. Never used by /api/checkout or the real order database.
export const previewProducts=[
 {id:'perfume',name:'Radiance Eau De Parfum',variant:'50 ml',price:295000,region:[32,319,128,110] as const},
 {id:'cream',name:'Glow Moisture Cream',variant:'50 g',price:185000,region:[32,451,128,105] as const},
];
export const shippingOptions=[{id:'inside',label:'Inside Dhaka',price:8000,note:'1–3 days'},{id:'outside',label:'Outside Dhaka',price:15000,note:'3–5 days'},{id:'international',label:'Outside Bangladesh',price:null,note:'Varies by location'}] as const;
export const paymentOptions=['bKash','Nagad','Cash on Delivery'] as const;
const customerSchema=z.object({name:z.string().max(100),phone:z.string().max(30),email:z.string().max(150),address:z.string().max(250),district:z.string().max(80),area:z.string().max(100),postal:z.string().max(20),notes:z.string().max(500)});
const linesSchema=z.array(z.object({id:z.enum(['perfume','cream']),qty:z.number().int().min(1).max(20)})).max(2).refine(lines=>new Set(lines.map(l=>l.id)).size===lines.length);
const baseSchema=z.object({lines:linesSchema,coupon:z.enum(['','DEMO10']),shipping:z.enum(['inside','outside','international']),payment:z.enum(paymentOptions),customer:customerSchema});
export const orderSchema=baseSchema.extend({id:z.string().regex(/^DEMO-[A-Z0-9-]+$/),date:z.string().datetime()});
export const sessionSchema=baseSchema.extend({order:orderSchema.nullable()});
export type PreviewState=z.infer<typeof sessionSchema>;
export type PreviewOrder=z.infer<typeof orderSchema>;
export type Customer=PreviewState['customer'];
export const blankCustomer:Customer={name:'',phone:'',email:'',address:'',district:'',area:'',postal:'',notes:''};
export const initialState:PreviewState={lines:[{id:'perfume',qty:1},{id:'cream',qty:1}],coupon:'',shipping:'inside',payment:'Cash on Delivery',customer:blankCustomer,order:null};
export const exampleOrder:PreviewOrder={...initialState,id:'DEMO-10248',date:'2026-10-25T06:00:00.000Z',customer:{...blankCustomer,name:'Customer Name',phone:'01XXXXXXXXX',address:'House / Road',area:'Area',district:'Dhaka'}};
export function calculatePreview(state:Pick<PreviewState,'lines'|'shipping'|'coupon'>){
 const lines=linesSchema.parse(state.lines);const subtotal=lines.reduce((sum,l)=>sum+previewProducts.find(p=>p.id===l.id)!.price*l.qty,0);
 const discount=state.coupon==='DEMO10'?Math.round(subtotal*.1):0;
 const delivery=lines.length?(shippingOptions.find(s=>s.id===state.shipping)?.price??null):0;
 return {subtotal,discount,delivery,total:delivery===null?null:subtotal-discount+delivery,quantity:lines.reduce((s,l)=>s+l.qty,0)};
}
export function validateDelivery(c:Customer){
 if(!c.name.trim()||!c.address.trim()||!c.district.trim()||!c.area.trim())return 'Complete your name and delivery address.';
 if(!/^(?:\+?88)?01[3-9]\d{8}$/.test(c.phone.replace(/[\s-]/g,'')))return 'Enter a valid Bangladesh mobile number.';
 if(c.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))return 'Enter a valid email address.';
 return '';
}
export const previewMoney=(p:number)=>'৳'+(p/100).toLocaleString('en-BD',{maximumFractionDigits:2});
