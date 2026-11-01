import "../seo/product-seo-page.css";
import "./product-editor.css";
import Link from "next/link";
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import AdminProductWorkspace from "@/components/admin-product-workspace";
export const dynamic="force-dynamic";
export const metadata={title:"Product Management | ANUSMITA",robots:{index:false,follow:false}};
const menu=[["Overview","/admin/dashboard"],["Orders","/admin?tab=Orders"],["Products","/admin?tab=Products"],["Inventory","/admin?tab=Inventory"],["Customers","/admin?tab=Customers"],["Suppliers","/admin?tab=Suppliers"],["Payments","/admin?tab=Payments"],["Couriers","/admin?tab=Courier%20Setup"],["Homepage Studio","/admin?tab=Homepage%20Studio"],["Social Inbox","/admin?tab=Social%20Inbox"],["Staff Management","/admin?tab=Staff%20Management"],["Finance Audit","/admin?tab=Finance%20Audit"],["Activity Logs","/admin?tab=Activity%20Logs"],["Header & Footer","/admin?tab=Header%20%26%20Footer"]] as const;
export default async function ProductSeoPage(){
 const user=await currentUser();if(!user)redirect("/admin/login");
 if(!["owner","admin","inventory","purchasing"].includes(user.role)||user.permissions?.["products.view"]===false)redirect("/admin");
 return <div className="seoDashboard">
  <aside className="seoDashboardSidebar"><Link href="/admin/dashboard" className="seoBrand">ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></Link>
   <p className="seoMenuLabel">Administration</p>{menu.slice(0,8).map(([label,href])=><Link key={label} className={label==="Products"?"seoMenuActive":""} href={href}>{label}</Link>)}
   <p className="seoMenuLabel">Content & Engagement</p>{menu.slice(8,10).map(([label,href])=><Link key={label} href={href}>{label}</Link>)}
   <p className="seoMenuLabel">Enterprise / Admin</p>{menu.slice(10).map(([label,href])=><Link key={label} href={href}>{label}</Link>)}
   <p className="seoSidebarIdentity">{user.name} · {user.role}</p>
  </aside>
  <main className="seoDashboardMain"><nav className="seoBreadcrumb" aria-label="Breadcrumb"><Link href="/admin/dashboard">Admin</Link><span>/</span><Link href="/admin/products/manage">Products</Link><span>/</span><strong>Products</strong></nav><AdminProductWorkspace/></main>
 </div>;
}