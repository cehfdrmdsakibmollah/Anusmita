import "server-only";
import {db} from "./db";
import {StoreSettings} from "./models";
import {storeSettings,defaultStoreSettings} from "./store-settings";
export async function currentStoreSettings(){
 await db();
 const row=await StoreSettings.findOne({key:"main"}).lean<any>();
 return row?storeSettings.parse({...row.content,revision:row.revision}):defaultStoreSettings(process.env);
}
