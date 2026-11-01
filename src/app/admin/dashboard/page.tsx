import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import AdminOverview from '@/components/admin-overview';
import '@/components/admin-overview.css';
export const dynamic='force-dynamic';
export const metadata={title:'Business overview',robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect('/admin/login');if(!['owner','admin','finance','analyst'].includes(user.role)||user.permissions?.['finance.view']===false)redirect('/admin?tab=Overview');return <AdminOverview name={user.name}/>;}
