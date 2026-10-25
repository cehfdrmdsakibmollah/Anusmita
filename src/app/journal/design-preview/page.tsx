import type {Metadata} from 'next';
import InformationPreview from '@/components/information-preview';
import '@/components/information-preview.css';
export const metadata:Metadata={title:'Beauty Journal design preview',description:'ANUSMITA — beauty, fashion and lifestyle discoveries from across Asia.',robots:{index:false,follow:false},alternates:{canonical:'/journal/design-preview'}};
export default function Page(){return <InformationPreview view="journal"/>;}
