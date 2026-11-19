import handler from "vinext/server/fetch-handler";
import {visualProductSearch} from "../../src/cloudflare/visual-product-search";
import {newDatabaseScope,inDatabaseScope,closeDatabaseScope} from "../../src/cloudflare/mongoose-context";
export default {
 async fetch(request:Request,env:unknown,ctx:unknown){
  const path=new URL(request.url).pathname;
  if(path.startsWith("/_next/static/")||(!path.startsWith("/api/")&&/\.(?:png|jpe?g|webp|avif|svg|ico|woff2?|wasm|css|js)$/.test(path)))return (env as {ASSETS:{fetch:(request:Request)=>Promise<Response>}}).ASSETS.fetch(request);
  const scope=newDatabaseScope();
  return inDatabaseScope(scope,async()=>{
   try{
    if(path==="/api/chat/visual-search"&&request.method==="POST"){const response=await visualProductSearch(request,env as any);await closeDatabaseScope(scope);return response;}
    const response:Response=await (handler as any).fetch(request,env,ctx);
    if(!response.body){await closeDatabaseScope(scope);return response;}
    const reader=response.body.getReader();let closed=false;
    const close=async()=>{if(!closed){closed=true;await closeDatabaseScope(scope);}};
    // Keep the scope alive through streamed SSR and close connections on cancellation too.
    const body=new ReadableStream({
     pull:controller=>inDatabaseScope(scope,async()=>{try{const item=await reader.read();if(item.done){await close();controller.close();}else controller.enqueue(item.value);}catch(e){await close().catch(()=>{});controller.error(e);}}),
     cancel:reason=>inDatabaseScope(scope,async()=>{try{await reader.cancel(reason);}finally{await close();}})
    });
    return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
   }catch(e){await closeDatabaseScope(scope).catch(()=>{});throw e;}
  });
 }
};
