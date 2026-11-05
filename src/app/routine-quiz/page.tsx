import CmsPublicSlots from "@/components/cms-public-slots";
import type {Metadata} from 'next';
import RoutineQuiz from '@/components/routine-quiz';
import '@/components/routine-quiz.css';
export const dynamic="force-dynamic";
export const metadata:Metadata={title:'Skincare Routine Finder',description:'Explore a simple skincare routine based on your skin type and preferences.',robots:{index:false,follow:false},alternates:{canonical:'/routine-quiz'}};
export default function Page(){return <><CmsPublicSlots page="routine-quiz" placement="before"/><RoutineQuiz/><CmsPublicSlots page="routine-quiz" placement="after"/></>;}
