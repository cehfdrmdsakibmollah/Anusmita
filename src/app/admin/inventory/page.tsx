import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import InventoryCommandCenter from "@/components/inventory-command-center";
import "@/components/inventory-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Inventory command center | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{sku?:string}>}){const params=await searchParams;const initialSearch=typeof params.sku==="string"?params.sku.trim().slice(0,80):"";const user=await currentUser();if(!user)redirect("/admin/login");if(!["owner","admin","inventory","purchasing"].includes(user.role)||user.permissions?.["inventory.view"]===false)redirect("/admin/dashboard");const canEdit=["owner","admin","inventory"].includes(user.role)&&(user.role==="owner"||user.permissions?.["inventory.edit"]!==false);return <InventoryCommandCenter canEdit={canEdit} initialSearch={initialSearch}/>}