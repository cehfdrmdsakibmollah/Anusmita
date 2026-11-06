import CmsPublicSlots from "@/components/cms-public-slots";
import {publishedCmsNativeHero} from "@/lib/cms-native-hero";
import ShoppingPage from '@/components/catalogue-shopping';
export const dynamic="force-dynamic";
export const metadata={title:'wishlist',robots:{index:false,follow:false}};
export default async function Page(){const nativeHero=await publishedCmsNativeHero("wishlist");return <><CmsPublicSlots page="wishlist" placement="before"/><ShoppingPage mode="wishlist" nativeHero={nativeHero}/><CmsPublicSlots page="wishlist" placement="after"/></>}
