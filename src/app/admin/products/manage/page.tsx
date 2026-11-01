import "../seo/product-seo-page.css";
import "./product-editor.css";
import "./seo-reference.css";
import Link from "next/link";
import {LayoutDashboard,ShoppingCart,Package,Boxes,Users,Truck,CreditCard,Store,MessageCircle,History,BookOpen,PanelTop,Search,Bell,HelpCircle,Eye,Copy,Archive,Save} from "lucide-react";
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import AdminProductWorkspace from "@/components/admin-product-workspace";
import ProductSeoManager from "@/components/product-seo-manager";
export const dynamic="force-dynamic";
export const metadata={title:"Product Management | ANUSMITA",robots:{index:false,follow:false}};
const menuIcons=[LayoutDashboard,ShoppingCart,Package,Boxes,Users,Truck,CreditCard,Truck,Store,MessageCircle,Users,BookOpen,History,PanelTop];
const menu=[["Overview","/admin/dashboard"],["Orders","/admin?tab=Orders"],["Products","/admin?tab=Products"],["Inventory","/admin?tab=Inventory"],["Customers","/admin?tab=Customers"],["Suppliers","/admin?tab=Suppliers"],["Payments","/admin?tab=Payments"],["Couriers","/admin?tab=Courier%20Setup"],["Homepage Studio","/admin?tab=Homepage%20Studio"],["Social Inbox","/admin?tab=Social%20Inbox"],["Staff Management","/admin?tab=Staff%20Management"],["Finance Audit","/admin?tab=Finance%20Audit"],["Activity Logs","/admin?tab=Activity%20Logs"],["Header & Footer","/admin?tab=Header%20%26%20Footer"]] as const;
export default async function ProductManagementPage({searchParams}:{searchParams:Promise<{view?:string}>}){
 const user=await currentUser();if(!user)redirect("/admin/login");
 const {view}=await searchParams;
 const seoMode=view==="seo";
 if(!["owner","admin","inventory","purchasing"].includes(user.role)||user.permissions?.["products.view"]===false)redirect("/admin");
 return <div className="seoDashboard">
  <aside className="seoDashboardSidebar"><Link href="/admin/dashboard" className="seoBrand">ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></Link>
   <p className="seoMenuLabel">{seoMode?"Administration":"Business Operations"}</p>{menu.slice(0,8).map(([label,href],i)=>{const Icon=menuIcons[i];return <Link key={label} className={label==="Products"?"seoMenuActive":""} href={href}><Icon size={16}/>{label}</Link>})}
   <p className="seoMenuLabel">{seoMode?"Content & Engagement":"Store & Marketing"}</p>{menu.slice(8,10).map(([label,href],i)=>{const Icon=menuIcons[i+8];return <Link key={label} href={href}><Icon size={16}/>{label}</Link>})}
   <p className="seoMenuLabel">{seoMode?"Enterprise / Admin":"Reports & Control"}</p>{menu.slice(10).map(([label,href],i)=>{const Icon=menuIcons[i+10];return <Link key={label} href={href}><Icon size={16}/>{label}</Link>})}
   <p className="seoSidebarIdentity">{user.name} · {user.role}</p>
  </aside>
  <main className="seoDashboardMain">{!seoMode&&<header className="apTopbar"><div className="apTopbarTrail"><Link href="/admin/dashboard">Admin</Link><span>/</span><Link href="/admin/products/manage">Products</Link><span>/</span><strong>Product Editor</strong></div><div className="apTopbarSearch"><Search size={17}/><span>Search products in the catalog panel</span></div><div className="apTopbarAccount"><Bell size={17}/><HelpCircle size={17}/><span>{user.name.slice(0,1).toUpperCase()}</span><strong>{user.name}</strong></div></header>}<nav className="seoBreadcrumb" aria-label="Breadcrumb"><Link href="/admin/dashboard">Admin</Link><span>/</span><Link href="/admin/products/manage">Products</Link><span>/</span><strong>Products</strong></nav><div className="apModeNavigation" aria-label="Product management workspaces"><div><span className="apModeEyebrow">ANUSMITA · PRODUCT MANAGEMENT</span><h1>{seoMode?"Product SEO Manager":"Product Editor"}</h1><p>{seoMode?"Optimize product metadata, search previews and image accessibility.":"Create, update and manage product details, variants, inventory, pricing, media and publishing for your catalogue."}</p></div><div className="apModeButtons"><Link className={!seoMode?"active":""} aria-current={!seoMode?"page":undefined} href="/admin/products/manage">Product Editor</Link><Link className={seoMode?"active":""} aria-current={seoMode?"page":undefined} href="/admin/products/manage?view=seo">SEO Manager</Link><Link href="/admin?tab=Bulk%20Import">Bulk Import</Link></div></div>{seoMode?<ProductSeoManager/>:<AdminProductWorkspace/>}</main>
 </div>;
}