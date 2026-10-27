import type {Metadata} from 'next';
import DealsPreview from '@/components/deals-preview';
import '@/components/deals-preview.css';
export const metadata:Metadata={title:'Flash Deals & Daily Offers',description:'Explore the ANUSMITA daily offers design — beauty, fashion and lifestyle.',robots:{index:false,follow:false},alternates:{canonical:'/deals'}};
export default function Page(){return <DealsPreview/>;}
