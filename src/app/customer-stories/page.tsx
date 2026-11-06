import CmsPublicSlots from "@/components/cms-public-slots";
import {publishedCmsNativeHero} from "@/lib/cms-native-hero";
import type {Metadata} from 'next';
import CustomerStories from '@/components/customer-stories';
import '@/components/routine-quiz.css';
import '@/components/customer-stories.css';
export const dynamic="force-dynamic";
export const metadata:Metadata={title:'Customer Stories',description:'Explore the ANUSMITA community gallery design.',robots:{index:false,follow:false},alternates:{canonical:'/customer-stories'}};
export default async function Page(){const nativeHero=await publishedCmsNativeHero("customer-stories");return <><CmsPublicSlots page="customer-stories" placement="before"/><CustomerStories nativeHero={nativeHero}/><CmsPublicSlots page="customer-stories" placement="after"/></>;}
