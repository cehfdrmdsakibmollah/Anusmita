import {describe,it,expect,vi,beforeEach} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/db',()=>({db:vi.fn()}));
vi.mock('@/lib/launch-config',()=>({dedicatedDb:vi.fn(()=>false)}));
vi.mock('@/lib/models',()=>({Product:{find:vi.fn()},User:{}}));
vi.mock('@/lib/chatbot-model',()=>({ChatbotSettings:{findOne:vi.fn()}}));
import {POST} from './route';
import {dedicatedDb} from '@/lib/launch-config';
import {Product} from '@/lib/models';
import {ChatbotSettings} from '@/lib/chatbot-model';
let n=0;
const req=(body:unknown,origin='https://shop.example')=>new Request('https://shop.example/api/chat',{method:'POST',headers:{origin,'Content-Type':'application/json','x-nf-client-connection-ip':'test-'+(++n)},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();vi.mocked(dedicatedDb).mockReturnValue(false);});
describe('chat API boundaries',()=>{
 it('rejects cross-origin submissions',async()=>{expect((await POST(req({message:'hi'},'https://evil.example'))).status).toBe(403);});
 it('rejects oversized bodies even without Content-Length',async()=>{expect((await POST(req({message:'x'.repeat(6000)}))).status).toBe(413);});
 it('rejects client-supplied customer identity',async()=>{expect((await POST(req({message:'status',userId:'victim'}))).status).toBe(400);});
 it('answers tracking safely without querying any customer database',async()=>{const r=await POST(req({message:'order status',language:'en'}));expect(r.status).toBe(200);expect((await r.json()).reply).toContain('cannot access private');expect(Product.find).not.toHaveBeenCalled();});
 it('returns an honest unavailable-catalogue fallback',async()=>{const r=await POST(req({message:'Round Lab',language:'en'}));expect((await r.json()).reply).toContain('catalogue is unavailable');expect(Product.find).not.toHaveBeenCalled();});
 it('only projects public active-product data and computes available stock',async()=>{
 vi.mocked(dedicatedDb).mockReturnValue(true);vi.mocked(ChatbotSettings.findOne).mockReturnValue({lean:async()=>null} as never);
 const chain={select:vi.fn().mockReturnThis(),sort:vi.fn().mockReturnThis(),limit:vi.fn().mockReturnThis(),maxTimeMS:vi.fn().mockReturnThis(),lean:vi.fn().mockResolvedValue([{_id:'abc',name:'Round Lab',slug:'round-lab',category:'Skincare',size:'100ml',pricePaisa:100000,onHand:5,reserved:2,costPaisa:60000,supplierId:'private',description:'Published description',usageInstructions:'Label instructions'}])};vi.mocked(Product.find).mockReturnValue(chain as never);
 const r=await POST(req({message:'Round Lab',language:'en'}));const data=await r.json();expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({active:true}));expect(chain.limit).toHaveBeenCalledWith(4);expect(data.products[0].available).toBe(3);expect(data.products[0]).not.toHaveProperty('costPaisa');expect(data.products[0]).not.toHaveProperty('supplierId');expect(r.headers.get('Cache-Control')).toBe('no-store');
 });
});
