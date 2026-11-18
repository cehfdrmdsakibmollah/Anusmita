import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import ActivityAudit from "@/components/activity-audit";
export const dynamic="force-dynamic";
export const metadata={title:"Activity Logs | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect("/admin/login");if(!["owner","admin","analyst"].includes(user.role)||(user.role!=="owner"&&user.permissions?.["settings.view"]===false))redirect("/admin/dashboard");return <ActivityAudit name={user.name} userId={user.id}/>;}
