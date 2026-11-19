import {redirect} from "next/navigation";
import Link from "next/link";
import {currentUser} from "@/lib/auth";
import ReviewModerationWorkspace from "@/components/review-moderation-workspace";
export const dynamic="force-dynamic";
export const metadata={title:"Verified Reviews | ANUSMITA Admin",robots:{index:false,follow:false}};
export default async function Page(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin"].includes(user.role)||user.permissions?.["products.view"]===false)redirect("/admin");
 return <div style={{minHeight:"100vh",background:"#faf3f3"}}>
  <header style={{padding:"18px clamp(20px,4vw,60px)",borderBottom:"1px solid #eadbdd",background:"#fff",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
   <Link href="/admin/dashboard" style={{fontFamily:"Georgia,serif",fontSize:22,color:"#611b37"}}>ANUSMITA</Link>
   <nav style={{display:"flex",gap:22,flexWrap:"wrap",fontSize:14}} aria-label="Admin navigation">
    <Link href="/admin/dashboard">Dashboard</Link>
    <Link href="/admin/products/manage">Products</Link>
    <Link href="/admin?tab=Orders">Orders</Link>
    <strong>Product Reviews</strong>
   </nav>
  </header>
  <ReviewModerationWorkspace canApprove={user.role==="owner"||user.permissions?.["products.edit"]!==false}/>
 </div>;
}
