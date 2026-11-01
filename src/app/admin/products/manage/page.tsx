import "../seo/product-seo-page.css";
import "./product-editor.css";
import "./seo-reference.css";
import Link from "next/link";
import {Search, Bell, UserRound, LayoutDashboard, ShoppingCart, Package, Boxes, Users, Truck, CreditCard, Store, MessageCircle, ShieldCheck, BookOpen, History, PanelTop, Menu, FileText, Sparkles, Layers, Upload} from "lucide-react";
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import AdminProductWorkspace from "@/components/admin-product-workspace";
import ProductSeoManager from "@/components/product-seo-manager";
export const dynamic="force-dynamic";
export const metadata={title:"Product Management | ANUSMITA",robots:{index:false,follow:false}};
const icons=[LayoutDashboard,ShoppingCart,Package,Boxes,Users,Truck,CreditCard,Truck,Store,MessageCircle,Users,BookOpen,History,PanelTop];
const menu=[["Overview","/admin/dashboard"],["Orders","/admin?tab=Orders"],["Products","/admin?tab=Products"],["Inventory","/admin?tab=Inventory"],["Customers","/admin?tab=Customers"],["Suppliers","/admin?tab=Suppliers"],["Payments","/admin?tab=Payments"],["Couriers","/admin?tab=Courier%20Setup"],["Homepage Studio","/admin?tab=Homepage%20Studio"],["Social Inbox","/admin?tab=Social%20Inbox"],["Staff Management","/admin?tab=Staff%20Management"],["Finance Audit","/admin?tab=Finance%20Audit"],["Activity Logs","/admin?tab=Activity%20Logs"],["Header & Footer","/admin?tab=Header%20%26%20Footer"]] as const;
export default async function ProductManagementPage({searchParams}:{searchParams:Promise<{view?:string}>}){
 const user=await currentUser();if(!user)redirect("/admin/login");
 const {view}=await searchParams;
 const seoMode=view==="seo";
 if(!["owner","admin","inventory","purchasing"].includes(user.role)||user.permissions?.["products.view"]===false)redirect("/admin");
 return <div className="seoDashboard">
  <aside className="seoDashboardSidebar"><Link href="/admin/dashboard" className="seoBrand">ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></Link>
   <p className="seoMenuLabel">Business Operations</p>{menu.slice(0,8).map(([label,href],i)=>{const Icon=icons[i];return <Link key={label} className={label==="Products"?"seoMenuActive":""} href={href}><Icon size={17}/>{label}</Link>})}
   <p className="seoMenuLabel">Store & Marketing</p>{menu.slice(8,10).map(([label,href],i)=>{const Icon=icons[i+8];return <Link key={label} href={href}><Icon size={17}/>{label}</Link>})}
   <p className="seoMenuLabel">Reports & Control</p>{menu.slice(10).map(([label,href],i)=>{const Icon=icons[i+10];return <Link key={label} href={href}><Icon size={17}/>{label}</Link>})}
   <p className="seoSidebarIdentity">{user.name} · {user.role}</p>
  </aside>
  <main className="seoDashboardMain">{seoMode&&<header className="seoTopbar"><div className="seoTopbarTrail"><Menu size={18}/><Link href="/admin/dashboard">⌂ Admin</Link><span>/</span><strong>Products</strong></div><form action="/admin/products/manage" method="get"><input type="hidden" name="view" value="seo"/><Search size={17}/><input name="q" aria-label="Search products" placeholder="Search orders, products, customers..."/><button type="submit">Search</button></form><div className="seoTopbarUser"><Bell size={19}/><span className="seoAvatar"><UserRound size={15}/></span><strong>{user.name}</strong></div></header>}<nav className="seoBreadcrumb" aria-label="Breadcrumb"><Link href="/admin/dashboard">Admin</Link><span>/</span><Link href="/admin/products/manage">Products</Link><span>/</span><strong>Products</strong></nav><div className="apModeNavigation" aria-label="Product management workspaces"><div><span className="apModeEyebrow">ANUSMITA · PRODUCT MANAGEMENT</span><h1>{seoMode?"Product SEO Manager":"Products"}</h1><p>{seoMode?"Optimize product metadata, search previews and image accessibility.":"Manage your real product catalogue, pricing, images, inventory and publishing."}</p></div><div className="apModeButtons">{seoMode&&<><a href="#seo-tools-section"><Layers size={15}/> SEO Tools</a><a href="#seo-editor-form"><Sparkles size={15}/> Edit SEO</a></>}<Link className={!seoMode?"active":""} aria-current={!seoMode?"page":undefined} href="/admin/products/manage">Product Editor</Link><Link className={seoMode?"active":""} aria-current={seoMode?"page":undefined} href="/admin/products/manage?view=seo">SEO Manager</Link><Link href="/admin?tab=Bulk%20Import">Bulk Import</Link></div></div>{seoMode?<ProductSeoManager/>:<AdminProductWorkspace/>}</main>
 </div>;
}