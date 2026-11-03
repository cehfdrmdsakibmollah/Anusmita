import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import AssistantRepliesCommandCenter from "@/components/assistant-replies-command-center";
import "@/components/assistant-replies-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"AI Assistant Replies | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect("/admin/login");if(!["owner","admin"].includes(user.role)||user.permissions?.["support.view"]===false)redirect("/admin/dashboard");return <AssistantRepliesCommandCenter/>}
