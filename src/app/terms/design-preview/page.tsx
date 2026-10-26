import type {Metadata} from "next";
import PolicyPages from "@/components/policy-pages";
import "@/components/policy-pages.css";
export const metadata:Metadata={title:"Terms of Service",description:"ANUSMITA customer care — Terms of Service.",robots:{index:false,follow:false},alternates:{canonical:"/terms/design-preview"}};
export default function Page(){return <PolicyPages view="terms"/>}
