import CmsPublicSlots from "@/components/cms-public-slots";
import type {Metadata} from 'next';
import InformationPreview from '@/components/information-preview';
import '@/components/information-preview.css';
export const metadata:Metadata={title:'About Us design preview',description:'ANUSMITA — beauty, fashion and lifestyle discoveries from across Asia.',robots:{index:false,follow:false},alternates:{canonical:'/about/design-preview'}};
export default function Page(){return <><CmsPublicSlots page="about" placement="before"/><InformationPreview view="about"/><CmsPublicSlots page="about" placement="after"/></>;}
