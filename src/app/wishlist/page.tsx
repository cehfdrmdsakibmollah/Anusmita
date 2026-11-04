import CmsPublicSlots from "@/components/cms-public-slots";
import ShoppingPage from '@/components/catalogue-shopping';
export const metadata={title:'wishlist',robots:{index:false,follow:false}};
export default function Page(){return <><CmsPublicSlots page="wishlist" placement="before"/><ShoppingPage mode="wishlist"/><CmsPublicSlots page="wishlist" placement="after"/></>}
