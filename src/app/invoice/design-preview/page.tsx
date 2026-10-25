import type {Metadata} from 'next';
import CheckoutPreview from '@/components/checkout-preview';
import '@/components/checkout-preview.css';
export const metadata:Metadata={title:'Printable Invoice design preview',description:'ANUSMITA interactive shopping design preview. No real order or payment is created.',robots:{index:false,follow:false},alternates:{canonical:'/invoice/design-preview'}};
export default function Page(){return <CheckoutPreview view="invoice"/>;}
