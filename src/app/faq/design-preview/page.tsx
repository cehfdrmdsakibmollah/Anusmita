import type {Metadata} from "next";
import PolicyPages from "@/components/policy-pages";
import "@/components/policy-pages.css";
export const metadata:Metadata={title:"Frequently Asked Questions",description:"ANUSMITA customer care — Frequently Asked Questions.",robots:{index:false,follow:false},alternates:{canonical:"/faq/design-preview"}};
export default function Page(){return <PolicyPages view="faq"/>}
