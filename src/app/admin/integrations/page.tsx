import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import IntegrationCommandCenter from "@/components/integration-command-center";
import "@/components/integration-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Integration Hub | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect("/admin/login");if(!["owner","admin"].includes(user.role)||user.permissions?.["settings.view"]===false)redirect("/admin/dashboard");return <IntegrationCommandCenter/>}
