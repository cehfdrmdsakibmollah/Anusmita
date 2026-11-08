import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import PosReturnInspections from "@/components/pos-return-inspections";
import "@/components/pos-return-inspections.css";
export const dynamic="force-dynamic";
export const metadata={title:"Returned Stock Inspection | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){
 const actor=await currentUser();if(!actor)redirect("/admin/login");
 if(!["owner","admin","inventory"].includes(actor.role)||actor.permissions?.["inventory.view"]===false)redirect("/admin/dashboard");
 return <PosReturnInspections canEdit={actor.role==="owner"||actor.permissions?.["inventory.edit"]!==false}/>;
}
