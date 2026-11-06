import CmsPublicSlots from "@/components/cms-public-slots";
import {publishedCmsNativeHero} from "@/lib/cms-native-hero";
import type {Metadata} from 'next';
import PreOrders from '@/components/pre-orders';
import '@/components/routine-quiz.css';
import '@/components/pre-orders.css';
export const dynamic="force-dynamic";
export const metadata:Metadata={title:'Pre-orders',description:'Explore the ANUSMITA overseas arrivals design preview.',robots:{index:false,follow:false},alternates:{canonical:'/pre-orders'}};
export default async function Page(){const nativeHero=await publishedCmsNativeHero("pre-orders");return <><CmsPublicSlots page="pre-orders" placement="before"/><PreOrders nativeHero={nativeHero}/><CmsPublicSlots page="pre-orders" placement="after"/></>;}
