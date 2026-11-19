import {readFile,writeFile,mkdir,readdir,stat} from "node:fs/promises";
import {relative,extname,join} from "node:path";
import {gzipSync} from "node:zlib";
import {createHash} from "node:crypto";
import {build} from "esbuild";
const root='.cloudflare/output/v1/workers/default',assets={};
const sourceRef=process.env.ASSET_SOURCE_REF||'097887c693de9f8afcc999d18956d06b7f389750';
if(!/^[a-f0-9]{40}$/.test(sourceRef))throw Error('ASSET_SOURCE_REF must be an immutable Git commit');
const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon','.txt':'text/plain','.wasm':'application/wasm'};
async function walk(dir){let files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())files.push(...await walk(path));else files.push(path);}return files;}
for(const file of await walk(root+'/assets')){
 const path=relative(root+'/assets',file).replaceAll('\\','/');
 if(path.split('/').some(p=>p.startsWith('.'))||['_headers','_redirects'].includes(path))continue;
 const bytes=await readFile(file),data=bytes.toString('base64'),extension=extname(file);
 const hash=createHash('sha256').update(data+extension.slice(1)).digest('hex').slice(0,32);
 let fromPublic=false;try{fromPublic=(await readFile('public/'+path)).equals(bytes);}catch{}
 assets['/'+path]={hash,type:mime[extension]||'application/octet-stream',...(fromPublic?{url:'https://raw.githubusercontent.com/cehfdrmdsakibmollah/Anusmita/'+sourceRef+'/public/'+path}:{data})};
}
await mkdir('.cloudflare/transfer',{recursive:true});
const result=await build({entryPoints:['workers/store-assets/index.mjs'],bundle:true,write:false,format:'esm',target:'es2022',minify:true,plugins:[{name:'asset-manifest',setup(build){build.onResolve({filter:/^\.\/manifest\.json$/},()=>({path:'manifest',namespace:'generated'}));build.onLoad({filter:/.*/,namespace:'generated'},()=>({contents:JSON.stringify(assets),loader:'json'}));}}]});
await writeFile('.cloudflare/transfer/asset-worker.b64',gzipSync(result.outputFiles[0].contents).toString('base64'));
const config=JSON.parse(await readFile(root+'/worker.config.json','utf8'));const modules=[];
for(const file of await walk(root+'/bundle')){
 if(file.endsWith('.map'))continue;
 const name=relative(root+'/bundle',file).replaceAll('\\','/'),type=config.manifest.modules?.[name]?.type,ext=extname(file);
 const bytes=await readFile(file),isWasm=type==='wasm'||ext==='.wasm';
 modules.push({name,...(isWasm?{data:bytes.toString('base64')}:{text:bytes.toString('utf8')}),type:isWasm?'application/wasm':type==='text'||ext==='.json'||ext==='.txt'?'text/plain':'application/javascript+module'});
}
await writeFile('.cloudflare/transfer/modules.b64',gzipSync(JSON.stringify(modules)).toString('base64'));
console.log(JSON.stringify({paths:Object.keys(assets).length,modules:modules.length,gzip:gzipSync(result.outputFiles[0].contents).length}));
