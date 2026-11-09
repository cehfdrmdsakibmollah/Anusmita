import {redirect} from "next/navigation";
import Link from "next/link";
import {currentUser} from "@/lib/auth";
import FunnelBuilder from "@/components/funnel-builder";
export const dynamic="force-dynamic";
export const metadata={title:"Funnel Campaign Studio | ANUSMITA",robots:{index:false,follow:false}};
export default async function FunnelAdmin(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin"].includes(user.role)||user.permissions?.["settings.view"]===false)redirect("/admin/dashboard");
 return <main><div style={{background:"#fff",padding:"10px 20px",borderBottom:"1px solid #eed4df",fontSize:12,display:"flex",gap:14,alignItems:"center"}}><Link href="/admin/dashboard">Admin Dashboard</Link><span>/</span><Link href="/admin/custom-pages?tab=Custom%20Pages">Custom Pages</Link><span>/</span><strong>Funnel Campaign Builder</strong></div><FunnelBuilder/></main>;
}
