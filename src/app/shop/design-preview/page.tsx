import type {Metadata} from 'next';
import ShopPreview from '@/components/shop-preview';
import './shop.css';
export const metadata:Metadata={title:'Shop design preview',description:'ANUSMITA reference-matched interactive shop design. Sample products and prices.',robots:{index:false,follow:false},alternates:{canonical:'/shop/design-preview'}};
export default function Page(){return <ShopPreview/>;}
