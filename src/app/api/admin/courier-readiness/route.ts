import {authorize,apiError} from "@/lib/auth";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.view");
  const definitions=[
   {id:"steadfast",name:"Steadfast",keys:["STEADFAST_API_KEY","STEADFAST_SECRET_KEY"]},
   {id:"pathao",name:"Pathao",keys:["PATHAO_CLIENT_ID","PATHAO_CLIENT_SECRET","PATHAO_USERNAME","PATHAO_PASSWORD","PATHAO_STORE_ID"]},
   {id:"redx",name:"REDX",keys:["REDX_API_TOKEN"]}
  ];
  const providers=definitions.map(p=>({id:p.id,name:p.name,configured:p.keys.every(k=>!!process.env[k]?.trim()),missing:p.keys.filter(k=>!process.env[k]?.trim())}));
  return Response.json({providers,bookingEnabled:false,webhooksEnabled:false,note:"Credential presence only. No provider validation, shipment booking or webhook processing is enabled by this endpoint."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}
}
