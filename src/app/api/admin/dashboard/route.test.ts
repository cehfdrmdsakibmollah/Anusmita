import {beforeEach,describe,expect,it,vi} from 'vitest';
vi.mock('@/lib/auth',()=>({authorize:vi.fn(),apiError:(e:{status?:number;message:string})=>Response.json({error:e.message},{status:e.status??500}),HttpError:class extends Error{constructor(public status:number,message:string){super(message)}}}));
vi.mock('@/lib/db',()=>({db:vi.fn()}));
vi.mock('@/lib/models',()=>({Order:{aggregate:vi.fn(),collection:{name:'orders'}},Product:{aggregate:vi.fn()},Payment:{aggregate:vi.fn()},PurchaseOrder:{aggregate:vi.fn()}}));
import {GET} from './route';
import {authorize} from '@/lib/auth';
import {db} from '@/lib/db';
import {Order,Product,Payment,PurchaseOrder} from '@/lib/models';
const req=(query='')=>new Request('https://example.com/api/admin/dashboard'+query);
beforeEach(()=>{vi.clearAllMocks();vi.mocked(authorize).mockResolvedValue({id:'owner',name:'Owner',email:'owner@example.com',role:'owner'});for(const model of [Order,Product,Payment,PurchaseOrder])vi.mocked(model.aggregate).mockReturnValue({option:vi.fn().mockResolvedValue([])} as never);});
describe('dashboard API boundaries',()=>{
 it('denies access before touching the database',async()=>{vi.mocked(authorize).mockRejectedValue({status:403,message:'Access denied'});expect((await GET(req())).status).toBe(403);expect(db).not.toHaveBeenCalled();expect(Order.aggregate).not.toHaveBeenCalled();});
 it('rejects unbounded chart requests',async()=>{expect((await GET(req('?days=36500'))).status).toBe(400);expect(db).not.toHaveBeenCalled();});
 it('returns explicit zero data and a complete fortnight without private fields',async()=>{const response=await GET(req('?days=14'));const data=await response.json();expect(data.todayOrders).toBe(0);expect(data.incomingUnits).toBe(0);expect(data.series).toHaveLength(14);expect(response.headers.get('Cache-Control')).toBe('private, no-store');expect(data).not.toHaveProperty('customer');});
 it('excludes test orders and reversed payments from queries',async()=>{
  await GET(req());const pipeline=vi.mocked(Payment.aggregate).mock.calls[0][0];
  expect(pipeline).toContainEqual({$match:{'order.0.isTest':false}});
  expect(pipeline?.[0]).toEqual({$match:expect.objectContaining({status:'verified',direction:{$in:['collection','refund']}})});
  expect(vi.mocked(Order.aggregate).mock.calls[0][0]?.[0]).toEqual({$match:expect.objectContaining({isTest:false,orderStatus:{$nin:['cancelled','returned']}})});
 });
 it('maps aggregate results to separate stock and balance concepts',async()=>{
  vi.mocked(Product.aggregate).mockReturnValue({option:vi.fn().mockResolvedValue([{available:14,reserved:3,low:2}])} as never);
  vi.mocked(PurchaseOrder.aggregate).mockReturnValue({option:vi.fn().mockResolvedValue([{incoming:[{units:8}],balances:[{count:2}]}])} as never);
  vi.mocked(Payment.aggregate).mockReturnValue({option:vi.fn().mockResolvedValue([{total:[{total:-2500}],daily:[]}])} as never);
  const data=await (await GET(req())).json();expect(data).toMatchObject({availableUnits:14,reservedUnits:3,incomingUnits:8,lowStockSkus:2,supplierInvoicesOutstanding:2,netCollectionsPaisa:-2500});
 });
 it('fails honestly instead of returning zero when the database fails',async()=>{vi.mocked(db).mockRejectedValueOnce(Error('Unavailable'));expect((await GET(req())).status).toBe(500);expect(Order.aggregate).not.toHaveBeenCalled();});
});
