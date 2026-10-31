import ShoppingPage from '@/components/catalogue-shopping';
import {checkoutEnabled} from '@/lib/launch-config';
export const dynamic='force-dynamic';
export const metadata={title:'Secure checkout | ANUSMITA',robots:{index:false,follow:false}};
export default function Page(){return <ShoppingPage mode="checkout" codEnabled={checkoutEnabled(process.env)}/>;}
