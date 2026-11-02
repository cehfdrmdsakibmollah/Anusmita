import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import SocialInboxCenter from "@/components/social-inbox-command-center";
import "@/components/social-inbox-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Social Inbox | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect("/admin/login");if(!["owner","admin","support"].includes(user.role)||user.permissions?.["support.view"]===false)redirect("/admin/dashboard");return <SocialInboxCenter/>}
