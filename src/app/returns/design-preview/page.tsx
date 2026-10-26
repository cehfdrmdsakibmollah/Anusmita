import type {Metadata} from "next";
import PolicyPages from "@/components/policy-pages";
import "@/components/policy-pages.css";
export const metadata:Metadata={title:"Return & Refund",description:"ANUSMITA customer care — Return & Refund.",robots:{index:false,follow:false},alternates:{canonical:"/returns/design-preview"}};
export default function Page(){return <PolicyPages view="returns"/>}
