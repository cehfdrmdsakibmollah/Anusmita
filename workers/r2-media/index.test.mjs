import {describe,it,expect,vi} from 'vitest';
import worker,{MAX_BYTES,imageType} from './index.mjs';
const path='/public/products/000000000000000000000000/11111111-1111-4111-8111-111111111111.png';
const secret='a'.repeat(64);
const bytes=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const request=(method,body,headers={})=>new Request('https://media.example'+path,{method,body,headers});
describe('R2 media boundary',()=>{
 it('accepts signed staff avatar images and makes them readable',async()=>{const avatar='/public/staff-avatars/000000000000000000000000/11111111-1111-4111-8111-111111111111.png';const put=vi.fn().mockResolvedValue({});const env={UPLOAD_SECRET:secret,MEDIA:{put,get:vi.fn().mockResolvedValue({body:bytes,httpEtag:'"avatar"',writeHttpMetadata:h=>h.set('Content-Type','image/png')})}};const r=await worker.fetch(new Request('https://media.example'+avatar,{method:'PUT',body:bytes,headers:{authorization:'Bearer '+secret,'content-type':'image/png','content-length':String(bytes.length)}}),env);expect(r.status).toBe(201);expect(put).toHaveBeenCalledOnce();const read=await worker.fetch(new Request('https://media.example'+avatar),env);expect(read.status).toBe(200)});
 it('accepts signed homepage and CMS image uploads while keeping old product paths',async()=>{
  const keys=[
   '/public/homepage/11111111-1111-4111-8111-111111111111.png',
   '/public/cms/deals/11111111-1111-4111-8111-111111111111.png',
   '/public/cms/track-order/11111111-1111-4111-8111-111111111111.png',
   path
  ];
  for(const key of keys){
   const put=vi.fn().mockResolvedValue({});
   const request=new Request('https://media.example'+key,{method:'PUT',body:bytes,headers:{authorization:'Bearer '+secret,'content-type':'image/png','content-length':String(bytes.length)}});
   const response=await worker.fetch(request,{UPLOAD_SECRET:secret,MEDIA:{put}});
   expect(response.status).toBe(201);expect(put).toHaveBeenCalledOnce();
  }
 });
 it('rejects unapproved CMS namespaces and unauthenticated asset listing',async()=>{
  const env={UPLOAD_SECRET:secret,MEDIA:{list:vi.fn()}};
  for(const key of ['/public/cms/not-real/11111111-1111-4111-8111-111111111111.png','/public/cms/deals/private.txt']){
   const resp=await worker.fetch(new Request('https://media.example'+key),env);expect(resp.status).toBe(404);
  }
  expect((await worker.fetch(new Request('https://media.example/assets?prefix=public/cms/deals/'),env)).status).toBe(403);
  expect((await worker.fetch(new Request('https://media.example/assets?prefix=public/products/'),{...env,MEDIA:{list:vi.fn()}})).status).toBe(403);
 });
 it('lists only authorized CMS/homepage assets and paginates without exposing product media',async()=>{
  const list=vi.fn().mockResolvedValue({objects:[{key:'public/cms/deals/11111111-1111-4111-8111-111111111111.png',size:12,uploaded:new Date('2026-11-05')},{key:'private/image.png',size:20}],truncated:false});
  const r=await worker.fetch(new Request('https://media.example/assets?prefix=public/cms/deals/&limit=20',{headers:{authorization:'Bearer '+secret}}),{UPLOAD_SECRET:secret,MEDIA:{list}});
  expect(r.status).toBe(200);
  const json=await r.json();expect(json.objects).toHaveLength(1);expect(json.objects[0].key).toContain('cms/deals');
  expect(list).toHaveBeenCalledWith({prefix:'public/cms/deals/',limit:20});
  expect((await worker.fetch(new Request('https://media.example/assets?prefix=public/products/1/',{headers:{authorization:'Bearer '+secret}}),{UPLOAD_SECRET:secret,MEDIA:{list}})).status).toBe(400);
 });
 it('rejects avatar keys outside registered staff namespace',async()=>{const put=vi.fn();const r=await worker.fetch(new Request('https://media.example/public/staff-avatars/unauthorized/avatar.png',{method:'PUT',body:bytes}),{MEDIA:{put},UPLOAD_SECRET:secret});expect(r.status).toBe(404);expect(put).not.toHaveBeenCalled()});
 it('rejects unauthenticated writes before accessing storage',async()=>{const put=vi.fn();const r=await worker.fetch(request('PUT',bytes),{MEDIA:{put},UPLOAD_SECRET:secret});expect(r.status).toBe(403);expect(put).not.toHaveBeenCalled();});
 it('never serves private or arbitrary object paths',async()=>{const get=vi.fn();expect((await worker.fetch(new Request('https://media.example/private/invoice.pdf'),{MEDIA:{get}})).status).toBe(404);expect(get).not.toHaveBeenCalled();});
 it('rejects HTML disguised as PNG',async()=>{const put=vi.fn();const b=new TextEncoder().encode('<html>not an image</html>');const r=await worker.fetch(request('PUT',b,{authorization:'Bearer '+secret,'content-type':'image/png','content-length':String(b.length)}),{MEDIA:{put},UPLOAD_SECRET:secret});expect(r.status).toBe(415);expect(put).not.toHaveBeenCalled();});
 it('rejects excessive uploads',async()=>{const r=await worker.fetch(request('PUT',bytes,{authorization:'Bearer '+secret,'content-length':String(MAX_BYTES+1)}),{UPLOAD_SECRET:secret});expect(r.status).toBe(413);});
 it('writes only once, with verified MIME metadata',async()=>{const put=vi.fn().mockResolvedValue({});const r=await worker.fetch(request('PUT',bytes,{authorization:'Bearer '+secret,'content-type':'image/png','content-length':String(bytes.length)}),{MEDIA:{put},UPLOAD_SECRET:secret});expect(r.status).toBe(201);expect(put.mock.calls[0][2].onlyIf.get('If-None-Match')).toBe('*');expect(put.mock.calls[0][2].httpMetadata.contentType).toBe('image/png');});
 it('returns conflict when immutable object already exists',async()=>{const r=await worker.fetch(request('PUT',bytes,{authorization:'Bearer '+secret,'content-type':'image/png','content-length':String(bytes.length)}),{MEDIA:{put:vi.fn().mockResolvedValue(null)},UPLOAD_SECRET:secret});expect(r.status).toBe(409);});
 it('serves cached images with nosniff and supports ETag',async()=>{const object={body:bytes,httpEtag:'"abc"',writeHttpMetadata:h=>h.set('Content-Type','image/png')};const env={MEDIA:{get:vi.fn().mockResolvedValue(object)}};const r=await worker.fetch(request('GET'),env);expect(r.status).toBe(200);expect(r.headers.get('X-Content-Type-Options')).toBe('nosniff');expect((await worker.fetch(request('GET',undefined,{'if-none-match':'"abc"'}),env)).status).toBe(304);});
 it('requires authorization for health and removal',async()=>{expect((await worker.fetch(new Request('https://media.example/health'),{})).status).toBe(403);expect((await worker.fetch(request('DELETE'),{})).status).toBe(403);});
});
