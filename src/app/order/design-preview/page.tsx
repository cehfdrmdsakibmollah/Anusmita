import type {Metadata} from 'next';
import CheckoutPreview from '@/components/checkout-preview';
import '@/components/checkout-preview.css';
export const metadata:Metadata={title:'Order Confirmation design preview',description:'ANUSMITA interactive shopping design preview. No real order or payment is created.',robots:{index:false,follow:false},alternates:{canonical:'/order/design-preview'}};
export default function Page(){return <CheckoutPreview view="confirmation"/>;}
