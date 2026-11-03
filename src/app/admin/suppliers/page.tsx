import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import SupplierCommandCenter from "@/components/supplier-command-center";
import "@/components/supplier-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Supplier & Vendor Management | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin","purchasing","finance"].includes(user.role)||user.permissions?.["purchasing.view"]===false)redirect("/admin/dashboard");
 return <SupplierCommandCenter canEdit={["owner","admin","purchasing"].includes(user.role)&&user.permissions?.["purchasing.edit"]!==false} isOwner={user.role==="owner"}/>;
}
