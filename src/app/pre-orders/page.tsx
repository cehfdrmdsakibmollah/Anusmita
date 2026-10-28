import type {Metadata} from 'next';
import PreOrders from '@/components/pre-orders';
import '@/components/routine-quiz.css';
import '@/components/pre-orders.css';
export const metadata:Metadata={title:'Pre-orders',description:'Explore the ANUSMITA overseas arrivals design preview.',robots:{index:false,follow:false},alternates:{canonical:'/pre-orders'}};
export default function Page(){return <PreOrders/>;}
