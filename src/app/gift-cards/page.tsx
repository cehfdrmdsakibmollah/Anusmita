import type {Metadata} from 'next';
import GiftCards from '@/components/gift-cards';
import '@/components/routine-quiz.css';
import '@/components/gift-cards.css';
export const metadata:Metadata={title:'Gift Cards',description:'Make a thoughtful ANUSMITA gift card preview.',robots:{index:false,follow:false},alternates:{canonical:'/gift-cards'}};
export default function Page(){return <GiftCards/>;}
