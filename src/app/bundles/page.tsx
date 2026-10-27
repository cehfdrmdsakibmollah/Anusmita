import type {Metadata} from 'next';
import BundlesPreview from '@/components/bundles-preview';
import '@/components/deals-preview.css';
import '@/components/bundles-preview.css';
export const metadata:Metadata={title:'Bundle & Combo Offers',description:'Explore ANUSMITA’s skincare routines and thoughtfully paired beauty combinations.',robots:{index:false,follow:false},alternates:{canonical:'/bundles'}};
export default function Page(){return <BundlesPreview/>;}
