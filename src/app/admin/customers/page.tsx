import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import CustomerCommandCenter from "@/components/customer-command-center";
import "@/components/customer-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Customer command center | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect("/admin/login");if(!["owner","admin","sales","support","analyst"].includes(user.role)||user.permissions?.["customers.view"]===false)redirect("/admin/dashboard");return <CustomerCommandCenter/>}
