import type {Plugin} from "vite";
/** Cloudflare-only transforms: the normal Next/Netlify source remains unchanged. */
export function cloudflareRuntime():Plugin{return {name:"anusmita-workers-runtime",enforce:"pre",transform(code,id){
 const file=id.split("?")[0].replaceAll("\\","/");if(!file.includes("/src/"))return;
 if(file.endsWith("/src/lib/db.ts"))return 'export {cloudflareDb as db} from "@/cloudflare/mongoose-context";';
 if(file.endsWith("/src/middleware.ts"))return `import {NextResponse} from "next/server";import {GET} from "@/app/api/store-maintenance/route";import {maintenanceExemptPath} from "@/lib/maintenance-access";export async function middleware(request){if(maintenanceExemptPath(request.nextUrl.pathname))return NextResponse.next();const response=await GET(request);return response.status===204?NextResponse.next({headers:{"Cache-Control":"private, no-store"}}):response;}export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:png|jpg|jpeg|webp|svg|woff2?|css|js)$).*)"]};`;
 if(file.endsWith("/src/lib/models.ts"))return 'import {scopedModel} from "@/cloudflare/mongoose-context";\n'+code.replace(/mongoose\.models\.(\w+)\s*\|\|\s*mongoose\.model\("\1",\s*(\w+)\)/g,'scopedModel("$1",$2)');
 if(/mongoose\.(startSession|connection)\b/.test(code)&&!file.includes("/cloudflare/")&&!file.endsWith(".test.ts"))return 'import {activeMongoose} from "@/cloudflare/mongoose-context";\n'+code.replace(/mongoose\.(startSession|connection)\b/g,'activeMongoose().$1');
}};}
