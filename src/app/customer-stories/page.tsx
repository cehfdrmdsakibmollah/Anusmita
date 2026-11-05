import CmsPublicSlots from "@/components/cms-public-slots";
import type {Metadata} from 'next';
import CustomerStories from '@/components/customer-stories';
import '@/components/routine-quiz.css';
import '@/components/customer-stories.css';
export const dynamic="force-dynamic";
export const metadata:Metadata={title:'Customer Stories',description:'Explore the ANUSMITA community gallery design.',robots:{index:false,follow:false},alternates:{canonical:'/customer-stories'}};
export default function Page(){return <><CmsPublicSlots page="customer-stories" placement="before"/><CustomerStories/><CmsPublicSlots page="customer-stories" placement="after"/></>;}
