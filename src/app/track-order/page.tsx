import type {Metadata} from 'next';
import TrackOrder from '@/components/track-order';
import '@/components/routine-quiz.css';
import '@/components/track-order.css';
export const metadata:Metadata={title:'Track Your Order',description:'Track your ANUSMITA order and find delivery assistance.',robots:{index:false,follow:false},alternates:{canonical:'/track-order'}};
export default function Page(){return <TrackOrder/>;}
