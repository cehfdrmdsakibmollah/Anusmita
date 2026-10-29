import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import mongoose from 'mongoose';
import {randomUUID} from 'node:crypto';
vi.mock('@/lib/auth',()=>({authorize:async()=>({role:'owner'}),apiError:(e:Error)=>Response.json({error:e.message},{status:500}),HttpError:class extends Error{constructor(public status:number,message:string){super(message)}}}));
vi.mock('@/lib/db',()=>({db:async()=>mongoose}));
import {GET} from './route';
import {Order,Payment,Product,PurchaseOrder} from '@/lib/models';
import {dashboardWindow} from '@/lib/dashboard-metrics';
const uri=process.env.DASHBOARD_TEST_MONGODB_URI;
// This suite must never use application credentials or a production database.
const allowed='mongodb://127.0.0.1:27017/anusmita_dashboard_test';
const testDb='anusmita_dashboard_test_'+randomUUID().replaceAll('-','');
describe.skipIf(!uri)('dashboard aggregation against isolated MongoDB',()=>{
 beforeAll(async()=>{
  if(uri!==allowed)throw new Error('Integration tests require the dedicated loopback MongoDB URI');
  await mongoose.connect(uri,{dbName:testDb,serverSelectionTimeoutMS:5000,autoIndex:false});
 });
 afterAll(async()=>{
  if(mongoose.connection.name===testDb){await mongoose.connection.dropDatabase();await mongoose.disconnect();}
 });
 it('reconciles valid sales, verified net cash, reservations and unreceived purchases',async()=>{
  const now=new Date();const {today}=dashboardWindow(now,7);
  const yesterday=new Date(today.getTime()-3600000);
  const ids=Array.from({length:5},()=>new mongoose.Types.ObjectId());
  await Order.collection.insertMany([
   {_id:ids[0],isTest:false,orderStatus:'placed',paymentMethod:'bank_transfer',paymentStatus:'partial',totalPaisa:100000,createdAt:today},
   {_id:ids[1],isTest:false,orderStatus:'delivered',paymentMethod:'cod',paymentStatus:'paid',totalPaisa:200000,createdAt:yesterday},
   {_id:ids[2],isTest:true,orderStatus:'placed',paymentMethod:'bank_transfer',paymentStatus:'unpaid',totalPaisa:900000,createdAt:today},
   {_id:ids[3],isTest:false,orderStatus:'cancelled',paymentMethod:'bank_transfer',paymentStatus:'refunded',totalPaisa:300000,createdAt:today},
   {_id:ids[4],isTest:false,orderStatus:'returned',paymentMethod:'cod',paymentStatus:'refunded',totalPaisa:400000,createdAt:today}
  ]);
  await Payment.collection.insertMany([
   {orderId:ids[0],status:'verified',direction:'collection',amountPaisa:50000,verifiedAt:today},
   {orderId:ids[1],status:'verified',direction:'collection',amountPaisa:200000,verifiedAt:yesterday},
   {orderId:ids[3],status:'verified',direction:'collection',amountPaisa:30000,verifiedAt:yesterday},
   {orderId:ids[3],status:'verified',direction:'refund',amountPaisa:30000,verifiedAt:today},
   {orderId:ids[4],status:'verified',direction:'refund',amountPaisa:40000,verifiedAt:today},
   {orderId:ids[2],status:'verified',direction:'collection',amountPaisa:900000,verifiedAt:today},
   {orderId:ids[0],status:'reversed',direction:'collection',amountPaisa:700000,verifiedAt:today},
   {orderId:new mongoose.Types.ObjectId(),status:'verified',direction:'collection',amountPaisa:800000,verifiedAt:today}
  ]);
  await Product.collection.insertMany([
   {active:true,onHand:10,reserved:3,reorderLevel:2},
   {active:true,onHand:2,reserved:2,reorderLevel:1},
   {active:false,onHand:100,reserved:1,reorderLevel:200}
  ]);
  await PurchaseOrder.collection.insertMany([
   {status:'partially_received',invoiceTotalPaisa:10000,paidPaisa:5000,items:[{quantity:10,received:4}]},
   {status:'submitted',invoiceTotalPaisa:20000,paidPaisa:20000,items:[{quantity:3,received:0}]},
   {status:'draft',invoiceTotalPaisa:90000,paidPaisa:0,items:[{quantity:99,received:0}]},
   {status:'cancelled',invoiceTotalPaisa:90000,paidPaisa:0,items:[{quantity:99,received:0}]},
   {status:'received',invoiceTotalPaisa:12000,paidPaisa:0,items:[{quantity:8,received:8}]}
  ]);
  const response=await GET(new Request('https://example.com/api/admin/dashboard?days=7'));
  expect(response.status).toBe(200);const data=await response.json();
  expect(data).toMatchObject({todayOrders:1,awaitingConfirmation:1,unpaidTransferOrders:1,netCollectionsPaisa:210000,availableUnits:7,reservedUnits:6,incomingUnits:9,lowStockSkus:1,supplierInvoicesOutstanding:2});
  expect(data.series.at(-1)).toMatchObject({orderedPaisa:100000,collectedPaisa:-20000});
  expect(data.series.at(-2)).toMatchObject({orderedPaisa:200000,collectedPaisa:230000});
  expect(JSON.stringify(data)).not.toContain('bank_transfer');
 });
});
