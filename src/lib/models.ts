
import mongoose, { Schema } from "mongoose";

const opts = { timestamps: true, versionKey: false } as const;
const UserSchema = new Schema({
 email: {type:String,required:true,unique:true,lowercase:true,trim:true},
 name: {type:String,required:true}, passwordHash: {type:String,required:true,select:false},
 role:{type:String,enum:["owner","admin","sales","finance","inventory","purchasing","support","analyst"],required:true},
 active:{type:Boolean,default:true}, loginFailures:{type:Number,default:0},
 lockedUntil:{type:Date,default:null}
}, opts);

const ProductSchema = new Schema({
 name:{type:String,required:true,trim:true},slug:{type:String,required:true,unique:true,lowercase:true,trim:true},
 sku:{type:String,required:true,unique:true,uppercase:true,trim:true}, brand:{type:String,default:""},
 category:{type:String,required:true},origin:{type:String,enum:["Bangladesh","China","Japan","Korea","Other"],default:"Other"},
 description:{type:String,default:""}, imageUrls:{type:[String],default:[]},
 variantLabel:{type:String,default:"Standard"},size:{type:String,default:""},
 pricePaisa:{type:Number,required:true,min:0},costPaisa:{type:Number,required:true,min:0},
 onHand:{type:Number,default:0,min:0},reserved:{type:Number,default:0,min:0},
 reorderLevel:{type:Number,default:5,min:0},active:{type:Boolean,default:false},
 expiryAt:{type:Date,default:null},batch:{type:String,default:""},
 supplierId:{type:Schema.Types.ObjectId,ref:"Supplier",default:null}
},opts);
ProductSchema.index({active:1,category:1,createdAt:-1});
ProductSchema.index({name:"text",brand:"text",category:"text"});

const OrderLineSchema = new Schema({
 productId:{type:Schema.Types.ObjectId,ref:"Product",required:true},
 sku:{type:String,required:true},name:{type:String,required:true},
 quantity:{type:Number,required:true,min:1},unitPricePaisa:{type:Number,required:true},
 unitCostPaisa:{type:Number,required:true},lineTotalPaisa:{type:Number,required:true}
},{_id:false});
const OrderSchema = new Schema({
 orderNumber:{type:String,unique:true,required:true},
 idempotencyKey:{type:String,unique:true,required:true},
 requestHash:{type:String,required:true}, lines:{type:[OrderLineSchema],required:true},
 customer:{name:String,phone:String,district:String,area:String,address:String,notes:String},
 paymentMethod:{type:String,enum:["cod","bank_transfer","bkash_manual","nagad_manual"],required:true},
 depositPaisa:{type:Number,default:0,min:0},
 subtotalPaisa:{type:Number,required:true},shippingPaisa:{type:Number,required:true},totalPaisa:{type:Number,required:true},
 collectedPaisa:{type:Number,default:0,min:0},
 orderStatus:{type:String,enum:["placed","confirmed","packed","shipped","delivered","cancelled","returned"],default:"placed"},
 paymentStatus:{type:String,enum:["unpaid","partial","paid","refunded"],default:"unpaid"},
 deliveredAt:{type:Date,default:null},confirmedAt:{type:Date,default:null},
 shippedAt:{type:Date,default:null},cancelledAt:{type:Date,default:null},
 financeNote:{type:String,default:""},source:{type:String,default:"website"},isTest:{type:Boolean,default:false}
},opts);
OrderSchema.index({createdAt:-1,orderStatus:1});
OrderSchema.index({ "customer.phone":1 });

const PaymentSchema = new Schema({
 orderId:{type:Schema.Types.ObjectId,ref:"Order",required:true},
 method:{type:String,required:true},reference:{type:String,required:true},
 amountPaisa:{type:Number,required:true,min:1},direction:{type:String,enum:["collection","refund"],default:"collection"},
 status:{type:String,enum:["verified","reversed"],default:"verified"},
 verifiedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 verifiedAt:{type:Date,required:true},note:{type:String,default:""}
},opts);
PaymentSchema.index({method:1,reference:1},{unique:true});
PaymentSchema.index({orderId:1,verifiedAt:-1});

const StockMovementSchema = new Schema({
 productId:{type:Schema.Types.ObjectId,ref:"Product",required:true},
 type:{type:String,enum:["receive","reserve","release","fulfil","damage","adjust"],required:true},
 deltaOnHand:{type:Number,default:0},deltaReserved:{type:Number,default:0},
 orderId:{type:Schema.Types.ObjectId,ref:"Order",default:null},
 purchaseOrderId:{type:Schema.Types.ObjectId,ref:"PurchaseOrder",default:null},
 note:{type:String,default:""},actorId:{type:Schema.Types.ObjectId,ref:"User",default:null}
},opts);
StockMovementSchema.index({productId:1,createdAt:-1});

const SupplierSchema = new Schema({
 name:{type:String,required:true,trim:true},contact:{type:String,default:""},phone:{type:String,default:""},
 email:{type:String,default:""},country:{type:String,default:""},paymentTerms:{type:String,default:""},
 notes:{type:String,default:""},active:{type:Boolean,default:true}
},opts);

const PurchaseLineSchema = new Schema({
 productId:{type:Schema.Types.ObjectId,ref:"Product",required:true},
 sku:{type:String,required:true},
 name:{type:String,required:true},
 quantity:{type:Number,required:true,min:1},
 received:{type:Number,default:0,min:0},
 unitCostPaisa:{type:Number,required:true,min:0}
},{_id:false});
const PurchaseOrderSchema = new Schema({
 supplierId:{type:Schema.Types.ObjectId,ref:"Supplier",required:true},
 items:{type:[PurchaseLineSchema],required:true},
 status:{type:String,enum:["draft","submitted","partially_received","received","cancelled"],default:"draft"},
 invoiceTotalPaisa:{type:Number,default:0,min:0},paidPaisa:{type:Number,default:0,min:0},
 note:{type:String,default:""},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 submittedAt:{type:Date,default:null},receivedAt:{type:Date,default:null}
},opts);
PurchaseOrderSchema.index({status:1,createdAt:-1});
const PurchaseReceiptLineSchema=new Schema({
 productId:{type:Schema.Types.ObjectId,ref:"Product",required:true},
 quantity:{type:Number,required:true,min:1}
},{_id:false});
const PurchaseReceiptSchema=new Schema({
 purchaseOrderId:{type:Schema.Types.ObjectId,ref:"PurchaseOrder",required:true},
 receiptKey:{type:String,required:true,unique:true},
 requestHash:{type:String,required:true},
 receivedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 lines:{type:[PurchaseReceiptLineSchema],required:true},
 receivedUnits:{type:Number,required:true,min:1},
 poStatus:{type:String,enum:["partially_received","received"],required:true},
 note:{type:String,required:true}
},opts);
PurchaseReceiptSchema.index({purchaseOrderId:1,createdAt:-1});
const ExpenseSchema = new Schema({
 kind:{type:String,required:true},note:{type:String,default:""},amountPaisa:{type:Number,required:true,min:0},
 recordedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},occurredAt:{type:Date,required:true}
},opts);
const AuditSchema = new Schema({
 actorId:{type:Schema.Types.ObjectId,ref:"User",default:null},
 action:{type:String,required:true},entity:{type:String,required:true},entityId:{type:String,required:true},
 details:{type:Schema.Types.Mixed,default:{}}
},opts);
AuditSchema.index({createdAt:-1,entity:1});
const CounterSchema = new Schema({key:{type:String,unique:true},value:{type:Number,default:0}}, {versionKey:false});

export const User = mongoose.models.User || mongoose.model("User",UserSchema);
export const Product = mongoose.models.Product || mongoose.model("Product",ProductSchema);
export const Order = mongoose.models.Order || mongoose.model("Order",OrderSchema);
export const Payment = mongoose.models.Payment || mongoose.model("Payment",PaymentSchema);
export const StockMovement = mongoose.models.StockMovement || mongoose.model("StockMovement",StockMovementSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model("Supplier",SupplierSchema);
export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder",PurchaseOrderSchema);
export const PurchaseReceipt = mongoose.models.PurchaseReceipt || mongoose.model("PurchaseReceipt",PurchaseReceiptSchema);
export const Expense = mongoose.models.Expense || mongoose.model("Expense",ExpenseSchema);
export const Audit = mongoose.models.Audit || mongoose.model("Audit",AuditSchema);
export const Counter = mongoose.models.Counter || mongoose.model("Counter",CounterSchema);

const CatalogImportSchema = new Schema({
 importKey:{type:String,required:true,unique:true},
 actorId:{type:Schema.Types.ObjectId,ref:"User",required:true},
 fileHash:{type:String,required:true},
 inserted:{type:Number,default:0},updated:{type:Number,default:0},skipped:{type:Number,default:0},
 affectedSkus:{type:[String],default:[]},completedAt:{type:Date,required:true}
},opts);
export const CatalogImport = mongoose.models.CatalogImport || mongoose.model("CatalogImport",CatalogImportSchema);
