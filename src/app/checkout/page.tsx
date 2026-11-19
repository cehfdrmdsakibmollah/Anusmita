import {currentStoreSettings} from "@/lib/store-settings-server";
import CmsPublicSlots from "@/components/cms-public-slots";
import {publishedCmsNativeHero} from "@/lib/cms-native-hero";
import ShoppingPage from '@/components/catalogue-shopping';
import {checkoutEnabled} from '@/lib/launch-config';
export const dynamic='force-dynamic';
export const metadata={title:'Secure checkout | ANUSMITA',robots:{index:false,follow:false}};
export default async function Page(){const nativeHero=await publishedCmsNativeHero("checkout");let codReady=checkoutEnabled(process.env);let shippingRates:null|{dhaka:number;outside:number;revision:number}=null;if(codReady){try{const settings=await currentStoreSettings();codReady=!settings.maintenanceEnabled;shippingRates={dhaka:settings.dhakaShippingPaisa,outside:settings.outsideShippingPaisa,revision:settings.revision};}catch{codReady=false;}}return <><CmsPublicSlots page="checkout" placement="before"/><ShoppingPage mode="checkout" codEnabled={codReady} shippingRates={codReady?shippingRates:null}/><CmsPublicSlots page="checkout" placement="after"/></>;}
