import {publishedCmsNativeHero} from "@/lib/cms-native-hero";
import CmsPublicSlots from "@/components/cms-public-slots";
import type {Metadata} from 'next';
import BundlesPreview from '@/components/bundles-preview';
import '@/components/deals-preview.css';
import '@/components/bundles-preview.css';
export const dynamic="force-dynamic";
export const metadata:Metadata={title:'Bundle & Combo Offers',description:'Explore ANUSMITA’s skincare routines and thoughtfully paired beauty combinations.',robots:{index:false,follow:false},alternates:{canonical:'/bundles'}};
export default async function Page(){const hero=await publishedCmsNativeHero("bundles");return <><CmsPublicSlots page="bundles" placement="before"/><BundlesPreview hero={hero}/><CmsPublicSlots page="bundles" placement="after"/></>;}
