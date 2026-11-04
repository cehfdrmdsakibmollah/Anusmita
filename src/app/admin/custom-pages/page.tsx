import Link from "next/link";
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import {LayoutDashboard,ShoppingCart,Package,Boxes,Users,UserCog,Layers3,FileText,Images,BookOpen,Tag,BarChart3,ScrollText,Settings,HelpCircle,Bell,Search} from "lucide-react";
import CustomPages from "@/components/custom-pages";
import "./custom-pages-workspace.css";
export const dynamic="force-dynamic";
export const metadata={title:"Custom Pages & Policy Builder | ANUSMITA Admin",robots:{index:false,follow:false}};
const navigation=[
 {group:"Administration",items:[
  ["Overview","/admin/dashboard",LayoutDashboard],["Orders","/admin/orders",ShoppingCart],["Products","/admin/products/manage",Package],["Inventory","/admin/inventory",Boxes],["Customers","/admin/customers",Users],["Staff & Users","/admin/staff",UserCog]]},
 {group:"Content & Engagement",items:[
  ["Homepage Studio","/admin?tab=Homepage%20Studio",Layers3],["Custom Pages","/admin/custom-pages",FileText],["Banners & Media","/admin?tab=R2%20Images",Images],["Blog / Journal","/journal/design-preview",BookOpen],["Deals & Campaigns","/admin?tab=Homepage%20Studio",Tag]]},
 {group:"Insights & Operations",items:[
  ["Reports & Analytics","/admin?tab=Finance%20Audit",BarChart3],["Audit Logs","/admin?tab=Activity%20Logs",ScrollText],["System Settings","/admin/integrations",Settings]]}
] as const;
export default async function CustomPagesAdmin(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin"].includes(user.role)||user.permissions?.["settings.view"]===false)redirect("/admin/dashboard");
 return <div className="anCpWorkspace">
  <aside className="anCpAdminSidebar">
   <Link className="anCpWordmark" href="/admin/dashboard">ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></Link>
   {navigation.map(section=><nav key={section.group} aria-label={section.group}>
    <h2>{section.group}</h2>
    {section.items.map(([label,href,Icon])=><Link key={label} className={label==="Custom Pages"?"active":""} href={href}><Icon size={17}/>{label}</Link>)}
   </nav>)}
   <div className="anCpSidebarFoot"><strong>Custom Pages Studio</strong><span>Enterprise content workspace</span><Link href="/admin/dashboard"><HelpCircle size={15}/> Back to Dashboard</Link></div>
  </aside>
  <div className="anCpWorkspaceMain">
   <header className="anCpGlobalTop">
    <div className="anCpTrail"><Link href="/admin/dashboard">Admin</Link><span>/</span><strong>Content & Pages</strong><span>/</span> Custom Pages</div>
    <div className="anCpSearchTop"><Search size={17}/><span>Search pages, blocks, settings…</span><kbd>Ctrl+K</kbd></div>
    <div className="anCpAccountTop"><Bell size={17}/><span className="anCpAvatar">{(user.name||"A").slice(0,1).toUpperCase()}</span><strong>{user.name}</strong></div>
   </header>
   <CustomPages/>
  </div>
 </div>;
}
