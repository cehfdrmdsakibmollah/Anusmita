import {publishedCmsNativeHero} from "@/lib/cms-native-hero";
import CmsPublicSlots from "@/components/cms-public-slots";
import type {Metadata} from 'next';
import InformationPreview from '@/components/information-preview';
import '@/components/information-preview.css';
export const dynamic="force-dynamic";
export const metadata:Metadata={title:'About Us design preview',description:'ANUSMITA — beauty, fashion and lifestyle discoveries from across Asia.',robots:{index:false,follow:false},alternates:{canonical:'/about/design-preview'}};
export default async function Page(){const hero=await publishedCmsNativeHero("about");return <><CmsPublicSlots page="about" placement="before"/><InformationPreview view="about" hero={hero}/><CmsPublicSlots page="about" placement="after"/></>;}
