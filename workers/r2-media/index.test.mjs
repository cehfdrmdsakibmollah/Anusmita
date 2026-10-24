import {describe,it,expect,vi} from 'vitest';
import worker,{MAX_BYTES,imageType} from './index.mjs';
const path='/public/products/000000000000000000000000/11111111-1111-4111-8111-111111111111.png';
const secret='a'.repeat(64);
const bytes=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const request=(method,body,headers={})=>new Request('https://media.example'+path,{method,body,headers});
describe('R2 media boundary',()=>{
 it('rejects unauthenticated writes before accessing storage',async()=>{const put=vi.fn();const r=await worker.fetch(request('PUT',bytes),{MEDIA:{put},UPLOAD_SECRET:secret});expect(r.status).toBe(403);expect(put).not.toHaveBeenCalled();});
 it('never serves private or arbitrary object paths',async()=>{const get=vi.fn();expect((await worker.fetch(new Request('https://media.example/private/invoice.pdf'),{MEDIA:{get}})).status).toBe(404);expect(get).not.toHaveBeenCalled();});
 it('rejects HTML disguised as PNG',async()=>{const put=vi.fn();const b=new TextEncoder().encode('<html>not an image</html>');const r=await worker.fetch(request('PUT',b,{authorization:'Bearer '+secret,'content-type':'image/png','content-length':String(b.length)}),{MEDIA:{put},UPLOAD_SECRET:secret});expect(r.status).toBe(415);expect(put).not.toHaveBeenCalled();});
 it('rejects excessive uploads',async()=>{const r=await worker.fetch(request('PUT',bytes,{authorization:'Bearer '+secret,'content-length':String(MAX_BYTES+1)}),{UPLOAD_SECRET:secret});expect(r.status).toBe(413);});
 it('writes only once, with verified MIME metadata',async()=>{const put=vi.fn().mockResolvedValue({});const r=await worker.fetch(request('PUT',bytes,{authorization:'Bearer '+secret,'content-type':'image/png','content-length':String(bytes.length)}),{MEDIA:{put},UPLOAD_SECRET:secret});expect(r.status).toBe(201);expect(put.mock.calls[0][2].onlyIf.get('If-None-Match')).toBe('*');expect(put.mock.calls[0][2].httpMetadata.contentType).toBe('image/png');});
 it('returns conflict when immutable object already exists',async()=>{const r=await worker.fetch(request('PUT',bytes,{authorization:'Bearer '+secret,'content-type':'image/png','content-length':String(bytes.length)}),{MEDIA:{put:vi.fn().mockResolvedValue(null)},UPLOAD_SECRET:secret});expect(r.status).toBe(409);});
 it('serves cached images with nosniff and supports ETag',async()=>{const object={body:bytes,httpEtag:'"abc"',writeHttpMetadata:h=>h.set('Content-Type','image/png')};const env={MEDIA:{get:vi.fn().mockResolvedValue(object)}};const r=await worker.fetch(request('GET'),env);expect(r.status).toBe(200);expect(r.headers.get('X-Content-Type-Options')).toBe('nosniff');expect((await worker.fetch(request('GET',undefined,{'if-none-match':'"abc"'}),env)).status).toBe(304);});
 it('requires authorization for health and removal',async()=>{expect((await worker.fetch(new Request('https://media.example/health'),{})).status).toBe(403);expect((await worker.fetch(request('DELETE'),{})).status).toBe(403);});
});
