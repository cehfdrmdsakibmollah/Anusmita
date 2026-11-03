"use client";
import Link from "next/link";
import {useState} from "react";
import {Home,ShoppingCart,ShoppingBag,Package,UserRound,Building2,Truck,CreditCard,PanelsTopLeft,MessageCircle,ChartNoAxesColumnIncreasing,Settings,Users,ShieldCheck,Link2,Clock3,Activity,LayoutDashboard,FileText,ChevronRight,Menu,X} from "lucide-react";
const navigation=[
 ["Overview",Home,"/admin/dashboard","Administration"],
 ["Orders",ShoppingCart,"/admin?tab=Orders","Administration"],
 ["Products",ShoppingBag,"/admin/products/manage","Administration"],
 ["Inventory",Package,"/admin/inventory","Administration"],
 ["Customers",UserRound,"/admin?tab=Customers","Administration"],
 ["Suppliers",Building2,"/admin/suppliers","Administration"],
 ["Payments",CreditCard,"/admin/payments","Administration"],
 ["Couriers",Truck,"/admin?tab=Courier%20Setup","Administration"],
 ["Homepage Studio",PanelsTopLeft,"/admin?tab=Homepage%20Studio","Content & Engagement"],
 ["Social Inbox",MessageCircle,"/admin/social-inbox","Content & Engagement"],
 ["Chatbot Responses",MessageCircle,"/admin/chatbot-responses","Content & Engagement"],
 ["Reports",ChartNoAxesColumnIncreasing,"/admin/dashboard","Insights & Operations"],
 ["Settings",Settings,"/admin?tab=Launch%20Readiness","Insights & Operations"],
 ["Staff Management",Users,"/admin?tab=Staff%20Management","Enterprise / Admin"],
 ["Finance Audit",FileText,"/admin?tab=Finance%20Audit","Enterprise / Admin"],
 ["Order Quality",ShieldCheck,"/admin?tab=Order%20Quality","Enterprise / Admin"],
 ["Integration Hub",Link2,"/admin/integrations","Enterprise / Admin"],
 ["Activity Logs",Clock3,"/admin?tab=Activity%20Logs","Enterprise / Admin"],
 ["Inventory Health",Activity,"/admin?tab=Inventory%20Health","Enterprise / Admin"],
 ["Header & Footer",LayoutDashboard,"/admin?tab=Header%20%26%20Footer","Enterprise / Admin"]
] as const;
export default function ErpAdminSidebar({active,name="ANUSMITA Owner"}:{active:"Suppliers"|"Payments";name?:string}){
 const [open,setOpen]=useState(false);
 return <><button type="button" className="erpMobileNav" onClick={()=>setOpen(true)} aria-label="Open admin navigation"><Menu size={20}/></button>{open&&<button type="button" className="erpBackdrop" onClick={()=>setOpen(false)} aria-label="Close navigation"/>}<aside className={"erpSidebar"+(open?" erpOpen":"")}><Link href="/admin/dashboard" className="erpBrand">ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></Link><button type="button" className="erpClose" onClick={()=>setOpen(false)} aria-label="Close navigation"><X size={18}/></button><nav aria-label="Administration">{navigation.map(([label,Icon,url,group],i)=><div key={label}>{(i===0||navigation[i-1][3]!==group)&&<p className="erpGroup">{group}</p>}<Link href={url} onClick={()=>setOpen(false)} aria-current={label===active?"page":undefined} className={label===active?"erpSelected":""}><Icon aria-hidden="true" size={17}/><span>{label}</span></Link></div>)}</nav><Link className="erpOwner" href="/admin?tab=Overview"><span className="erpAvatar">{name.trim().charAt(0)||"A"}</span><span className="erpAccountName">{name}<small>Staff account</small></span><ChevronRight size={18}/></Link></aside></>;
}
