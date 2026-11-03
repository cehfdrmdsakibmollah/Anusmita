import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import PaymentCommandCenter from "@/components/payment-command-center";
import "@/components/payment-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Payment Management & Financial Ledger | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){
 const user=await currentUser();
 if(!user)redirect("/admin/login");
 if(!["owner","admin","finance","analyst"].includes(user.role)||user.permissions?.["finance.view"]===false)redirect("/admin/dashboard");
 const canRecord=["owner","admin","finance"].includes(user.role)&&user.permissions?.["finance.edit"]!==false;
 return <PaymentCommandCenter canRecord={canRecord}/>;
}