import {checkoutEnabled,isProductionUrl,type LaunchEnvironment} from "./launch-config";

export function searchReadiness(env:LaunchEnvironment){
 const indexable=checkoutEnabled(env);
 return {
  indexable,
  checks:[
   {name:"Public indexing",passed:indexable,detail:indexable?"Launch settings allow public crawling.":"Current launch settings block crawling and indexing. Review Launch Readiness before enabling the store."},
   {name:"Canonical origin",passed:isProductionUrl(env.NEXT_PUBLIC_SITE_URL),detail:"Set the production HTTPS origin in NEXT_PUBLIC_SITE_URL."},
   {name:"Google verification",passed:!!env.GOOGLE_SITE_VERIFICATION,detail:"Add the Search Console HTML verification token to GOOGLE_SITE_VERIFICATION."},
   {name:"Bing verification",passed:!!env.BING_SITE_VERIFICATION,detail:"Add the Bing Webmaster verification token to BING_SITE_VERIFICATION."}
  ],
  crawlers:["Googlebot","Bingbot","OAI-SearchBot","Claude-SearchBot"]
 };
}

export function siteEntityGraph(base:string){
 const origin=new URL(base).origin;
 return {"@context":"https://schema.org","@graph":[
  {"@type":"Organization","@id":origin+"/#organization",name:"ANUSMITA",url:origin},
  {"@type":"WebSite","@id":origin+"/#website",url:origin,name:"ANUSMITA",inLanguage:"en",publisher:{"@id":origin+"/#organization"}}
 ]};
}
