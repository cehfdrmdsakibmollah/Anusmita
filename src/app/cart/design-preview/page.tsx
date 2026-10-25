import type {Metadata} from 'next';
import CheckoutPreview from '@/components/checkout-preview';
import '@/components/checkout-preview.css';
export const metadata:Metadata={title:'Shopping Bag design preview',description:'ANUSMITA interactive shopping design preview. No real order or payment is created.',robots:{index:false,follow:false},alternates:{canonical:'/cart/design-preview'}};
export default function Page(){return <CheckoutPreview view="cart"/>;}
