import type {Metadata} from "next";
import PolicyPages from "@/components/policy-pages";
import "@/components/policy-pages.css";
export const metadata:Metadata={title:"Privacy Policy",description:"ANUSMITA customer care — Privacy Policy.",robots:{index:false,follow:false},alternates:{canonical:"/privacy/design-preview"}};
export default function Page(){return <PolicyPages view="privacy"/>}
