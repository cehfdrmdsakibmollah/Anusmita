import CmsPublicSlots from "@/components/cms-public-slots";
import ShoppingPage from '@/components/catalogue-shopping';
export const dynamic="force-dynamic";
export const metadata={title:'cart',robots:{index:false,follow:false}};
export default function Page(){return <><CmsPublicSlots page="cart" placement="before"/><ShoppingPage mode="cart"/><CmsPublicSlots page="cart" placement="after"/></>}
