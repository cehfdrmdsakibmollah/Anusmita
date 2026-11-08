import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import PosReturnsWorkspace from "@/components/pos-returns-workspace";
import "@/components/pos-returns-workspace.css";
export const dynamic="force-dynamic";
export const metadata={title:"Cash Refunds & Returns | ANUSMITA POS",robots:{index:false,follow:false}};
export default async function ReturnsPage(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin"].includes(user.role)||user.permissions?.["orders.view"]===false)redirect("/admin/dashboard");
 return <PosReturnsWorkspace canRefund={user.role==="owner"||user.permissions?.["orders.edit"]!==false}/>;
}
