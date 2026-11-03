import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import StaffCommandCenter from "@/components/staff-command-center";
import "@/components/erp-admin-sidebar.css";
import "@/components/staff-command-center.css";
export const dynamic="force-dynamic";
export const metadata={title:"Staff & User Management | ANUSMITA",robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect("/admin/login");return <StaffCommandCenter adminName={user.name} isOwner={user.role==="owner"}/>;}