import CmsPublicSlots from "@/components/cms-public-slots";
import {publishedCmsNativeHero} from "@/lib/cms-native-hero";
import type {Metadata} from 'next';
import TrackOrder from '@/components/track-order';
import '@/components/routine-quiz.css';
import '@/components/track-order.css';
export const dynamic="force-dynamic";
export const metadata:Metadata={title:'Track Your Order',description:'Track your ANUSMITA order and find delivery assistance.',robots:{index:false,follow:false},alternates:{canonical:'/track-order'}};
export default async function Page(){const nativeHero=await publishedCmsNativeHero("track-order");return <><CmsPublicSlots page="track-order" placement="before"/><TrackOrder nativeHero={nativeHero}/><CmsPublicSlots page="track-order" placement="after"/></>;}
