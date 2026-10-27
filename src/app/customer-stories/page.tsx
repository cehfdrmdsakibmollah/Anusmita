import type {Metadata} from 'next';
import CustomerStories from '@/components/customer-stories';
import '@/components/routine-quiz.css';
import '@/components/customer-stories.css';
export const metadata:Metadata={title:'Customer Stories',description:'Explore the ANUSMITA community gallery design.',robots:{index:false,follow:false},alternates:{canonical:'/customer-stories'}};
export default function Page(){return <CustomerStories/>;}
