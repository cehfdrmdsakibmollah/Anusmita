export function maintenanceExemptPath(path:string){
 return ["/admin","/api","/_next","/order-success"].some(prefix=>path===prefix||path.startsWith(prefix+"/"))||
  ["/robots.txt","/sitemap.xml","/favicon.ico"].includes(path);
}
export function maintenanceHtml(message:string){
 const escaped=message.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]!));
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Store maintenance | ANUSMITA</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fff6f8;color:#781334;font:18px Arial"><main style="max-width:560px;padding:32px"><h1>ANUSMITA</h1><p>'+escaped+'</p></main></body></html>';
}
