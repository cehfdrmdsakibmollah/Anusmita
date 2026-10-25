import type {Metadata} from 'next';
import AccountPreview from '@/components/account-preview';
import '@/components/account-preview.css';
export const metadata:Metadata={title:'Orders account design preview',robots:{index:false,follow:false}};
export default function Page(){return <AccountPreview view="orders"/>;}
