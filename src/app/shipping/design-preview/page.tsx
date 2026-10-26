import type {Metadata} from "next";
import PolicyPages from "@/components/policy-pages";
import "@/components/policy-pages.css";
export const metadata:Metadata={title:"Shipping & Delivery",description:"ANUSMITA customer care — Shipping & Delivery.",robots:{index:false,follow:false},alternates:{canonical:"/shipping/design-preview"}};
export default function Page(){return <PolicyPages view="shipping"/>}
