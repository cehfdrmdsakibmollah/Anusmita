import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import HomepageVisualStudio from "@/components/homepage-visual-studio";
import "@/components/erp-admin-sidebar.css";
import "@/components/homepage-visual-studio.css";
export const dynamic="force-dynamic";
export const metadata={title:"Homepage Studio & Visual Builder | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect("/admin/login");if(!["owner","admin"].includes(user.role)||user.permissions?.["settings.view"]===false)redirect("/admin");return <HomepageVisualStudio adminName={user.name}/>}