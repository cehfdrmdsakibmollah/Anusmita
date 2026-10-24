
import {db} from "@/lib/db";
import {HomePage} from "@/lib/models";
import {homeStarterBlocks,homeStarterSections,publicBlocks} from "@/lib/home-content";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 let blocks=homeStarterBlocks,sections=homeStarterSections;
 if(process.env.MONGODB_URI)try{
  await db();
  const config=await HomePage.findOne({key:"main"}).lean<any>();
  if(config){blocks=config.blocks;sections=config.sections;}
 }catch{/* Public storefront can still show non-transactional curated layout. */}
 return Response.json({blocks:publicBlocks(blocks),sections:sections.filter(s=>s.enabled).sort((a,b)=>a.position-b.position)},
  {headers:{"Cache-Control":"public, max-age=0, s-maxage=60, stale-while-revalidate=120"}});
}
