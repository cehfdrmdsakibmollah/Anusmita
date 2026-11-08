import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import PosReports from "@/components/pos-profit-reports";
import "@/components/pos-profit-reports.css";
export const dynamic="force-dynamic";
export const metadata={title:"POS Financial & Cashier Reports | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){
 const user=await currentUser();if(!user)redirect("/admin/login");
 if(!["owner","admin","finance","analyst"].includes(user.role)||user.permissions?.["finance.view"]===false)redirect("/admin/dashboard");
 return <PosReports/>;
}