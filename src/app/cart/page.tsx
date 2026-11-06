import CmsPublicSlots from "@/components/cms-public-slots";
import {publishedCmsNativeHero} from "@/lib/cms-native-hero";
import ShoppingPage from '@/components/catalogue-shopping';
export const dynamic="force-dynamic";
export const metadata={title:'cart',robots:{index:false,follow:false}};
export default async function Page(){const nativeHero=await publishedCmsNativeHero("cart");return <><CmsPublicSlots page="cart" placement="before"/><ShoppingPage mode="cart" nativeHero={nativeHero}/><CmsPublicSlots page="cart" placement="after"/></>}
