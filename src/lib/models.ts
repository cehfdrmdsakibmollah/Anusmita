
import mongoose, { Schema } from "mongoose";

const opts = { timestamps: true, versionKey: false } as const;
const UserSchema = new Schema({
 email: {type:String,required:true,unique:true,lowercase:true,trim:true},
 name: {type:String,required:true}, phone:{type:String,default:""}, bio:{type:String,default:""}, avatarUrl:{type:String,default:""}, passwordHash: {type:String,required:true,select:false},
 role:{type:String,enum:["owner","admin","sales","finance","inventory","purchasing","support","analyst"],required:true},
 active:{type:Boolean,default:true}, permissions:{type:Map,of:Boolean,default:{}}, loginFailures:{type:Number,default:0},
 lockedUntil:{type:Date,default:null}
}, opts);

const ProductSchema = new Schema({
 name:{type:String,required:true,trim:true},slug:{type:String,required:true,unique:true,lowercase:true,trim:true},
 sku:{type:String,required:true,unique:true,uppercase:true,trim:true}, brand:{type:String,default:""},
 category:{type:String,required:true},origin:{type:String,enum:["Bangladesh","China","Japan","Korea","Other"],default:"Other"},
 description:{type:String,default:""}, imageUrls:{type:[String],default:[]},
 variantLabel:{type:String,default:"Standard"},size:{type:String,default:""},
 variantGroup:{type:String,default:"",trim:true,lowercase:true},
 color:{type:String,default:""},
 colorHex:{type:String,default:""},
 material:{type:String,default:""},
 dimensions:{type:String,default:""},
 compatibility:{type:String,default:""},
 careInstructions:{type:String,default:""},
 warranty:{type:String,default:""},
 sizeGuide:{type:String,default:""},
 skinType:{type:String,default:""},
 benefits:{type:String,default:""},
 ingredients:{type:String,default:""},usageInstructions:{type:String,default:""},
 topNotes:{type:String,default:""},heartNotes:{type:String,default:""},baseNotes:{type:String,default:""},
 compareAtPaisa:{type:Number,default:0,min:0},wholesalePaisa:{type:Number,default:0,min:0},featured:{type:Boolean,default:false},barcode:{type:String,default:""},
 pricePaisa:{type:Number,required:true,min:0},costPaisa:{type:Number,required:true,min:0},
 onHand:{type:Number,default:0,min:0},reserved:{type:Number,default:0,min:0},
 reorderLevel:{type:Number,default:5,min:0},scheduledPublishAt:{type:Date,default:null},archived:{type:Boolean,default:false},availabilityMode:{type:String,enum:["now","preorder"],default:"now"},preorderEta:{type:Date,default:null},discountPercent:{type:Number,default:0,min:0,max:100},salesChannels:{type:[String],default:["online"]},warehouseAllocationRevision:{type:Number,default:0},active:{type:Boolean,default:false},
 expiryAt:{type:Date,default:null},batch:{type:String,default:""},
 supplierId:{type:Schema.Types.ObjectId,ref:"Supplier",default:null}
},opts);
ProductSchema.index({active:1,category:1,createdAt:-1});
ProductSchema.index({variantGroup:1,active:1});
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
 notes:{type:String,default:""},active:{type:Boolean,default:true},
 category:{type:String,default:"General",maxlength:80},
 tags:{type:[String],default:[]},
 leadTimeDays:{type:Number,default:null,min:0,max:365},
 riskStatus:{type:String,enum:["normal","watchlist","blocked"],default:"normal"},
 archivedAt:{type:Date,default:null}
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

/** Independently verified manual payments to suppliers. Not a gateway integration. */
const SupplierPaymentSchema=new Schema({
 purchaseOrderId:{type:Schema.Types.ObjectId,ref:"PurchaseOrder",required:true},
 supplierId:{type:Schema.Types.ObjectId,ref:"Supplier",required:true},
 paymentKey:{type:String,required:true,unique:true},
 requestHash:{type:String,required:true},
 method:{type:String,enum:["bank_transfer","bkash_manual","nagad_manual","cash","other"],required:true},
 reference:{type:String,required:true},
 referenceKey:{type:String,required:true},
 amountPaisa:{type:Number,required:true,min:1},
 status:{type:String,enum:["verified"],default:"verified"},
 verifiedAt:{type:Date,required:true},
 verifiedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 note:{type:String,required:true}
},opts);
SupplierPaymentSchema.index({method:1,referenceKey:1},{unique:true});
SupplierPaymentSchema.index({purchaseOrderId:1,verifiedAt:-1});

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
const ReturnInspectionSchema=new Schema({
 orderId:{type:Schema.Types.ObjectId,ref:"Order",required:true,unique:true},
 condition:{type:String,enum:["pending","sellable","damaged","quarantine"],default:"pending",required:true},
 note:{type:String,required:true,maxlength:500},
 inspectedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 inspectedAt:{type:Date,required:true,default:Date.now},
 revision:{type:Number,default:1,min:1}
},opts);
ReturnInspectionSchema.index({inspectedAt:-1});
const WarehouseLocationSchema=new Schema({
 code:{type:String,required:true,unique:true,uppercase:true,trim:true,maxlength:24},
 name:{type:String,required:true,trim:true,maxlength:100},
 address:{type:String,default:"",maxlength:250},
 active:{type:Boolean,default:true},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},opts);
WarehouseLocationSchema.index({active:1,name:1});
const WarehouseBalanceSchema=new Schema({
 productId:{type:Schema.Types.ObjectId,ref:"Product",required:true},
 locationId:{type:Schema.Types.ObjectId,ref:"WarehouseLocation",required:true},
 quantity:{type:Number,required:true,min:0,default:0}
},opts);
WarehouseBalanceSchema.index({productId:1,locationId:1},{unique:true});
const WarehouseEventSchema=new Schema({
 operationKey:{type:String,required:true,unique:true},
 kind:{type:String,enum:["allocate","transfer"],required:true},
 productId:{type:Schema.Types.ObjectId,ref:"Product",required:true},
 fromLocationId:{type:Schema.Types.ObjectId,ref:"WarehouseLocation",default:null},
 toLocationId:{type:Schema.Types.ObjectId,ref:"WarehouseLocation",required:true},
 quantity:{type:Number,required:true,min:1},
 actorId:{type:Schema.Types.ObjectId,ref:"User",required:true},
 note:{type:String,required:true}
},opts);
WarehouseEventSchema.index({createdAt:-1});
const StoreChromeSchema=new Schema({
 key:{type:String,required:true,unique:true,default:"main"},
 announcement:{type:String,default:"",maxlength:180},
 footerNote:{type:String,default:"",maxlength:240},
 headerOrder:{type:[String],default:["logo","navigation","search","tools"]},
 footerOrder:{type:[String],default:["brand","shop","care"]},
 enabled:{type:Boolean,default:false},
 revision:{type:Number,default:0,min:0},
 lastEditedBy:{type:Schema.Types.ObjectId,ref:"User",default:null}
},opts);
const SocialInboundSchema=new Schema({
 provider:{type:String,enum:["messenger","instagram","whatsapp"],required:true},
 eventId:{type:String,required:true,maxlength:180},
 senderId:{type:String,required:true,maxlength:180},
 text:{type:String,required:true,maxlength:2000},
 receivedAt:{type:Date,required:true,default:Date.now},
 eventAt:{type:Date,default:null}
},{versionKey:false});
SocialInboundSchema.index({provider:1,eventId:1},{unique:true});
SocialInboundSchema.index({receivedAt:1},{expireAfterSeconds:2592000});
const CounterSchema = new Schema({key:{type:String,unique:true},value:{type:Number,default:0}}, {versionKey:false});

export const User = mongoose.models.User || mongoose.model("User",UserSchema);
export const Product = mongoose.models.Product || mongoose.model("Product",ProductSchema);
export const Order = mongoose.models.Order || mongoose.model("Order",OrderSchema);
export const Payment = mongoose.models.Payment || mongoose.model("Payment",PaymentSchema);
export const StockMovement = mongoose.models.StockMovement || mongoose.model("StockMovement",StockMovementSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model("Supplier",SupplierSchema);
export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder",PurchaseOrderSchema);
export const PurchaseReceipt = mongoose.models.PurchaseReceipt || mongoose.model("PurchaseReceipt",PurchaseReceiptSchema);
export const SupplierPayment = mongoose.models.SupplierPayment || mongoose.model("SupplierPayment",SupplierPaymentSchema);
export const Expense = mongoose.models.Expense || mongoose.model("Expense",ExpenseSchema);
export const Audit = mongoose.models.Audit || mongoose.model("Audit",AuditSchema);
export const ReturnInspection=mongoose.models.ReturnInspection||mongoose.model("ReturnInspection",ReturnInspectionSchema);
export const Counter = mongoose.models.Counter || mongoose.model("Counter",CounterSchema);
export const SocialInbound=mongoose.models.SocialInbound||mongoose.model("SocialInbound",SocialInboundSchema);
export const StoreChrome=mongoose.models.StoreChrome||mongoose.model("StoreChrome",StoreChromeSchema);
export const WarehouseBalance=mongoose.models.WarehouseBalance||mongoose.model("WarehouseBalance",WarehouseBalanceSchema);
export const WarehouseEvent=mongoose.models.WarehouseEvent||mongoose.model("WarehouseEvent",WarehouseEventSchema);
export const WarehouseLocation=mongoose.models.WarehouseLocation||mongoose.model("WarehouseLocation",WarehouseLocationSchema);

const CatalogCategorySchema=new Schema({
 name:{type:String,required:true,trim:true,maxlength:90},
 slug:{type:String,required:true,unique:true,lowercase:true,trim:true},
 parentId:{type:Schema.Types.ObjectId,ref:"CatalogCategory",default:null},
 active:{type:Boolean,default:true},position:{type:Number,default:0,min:0},
 description:{type:String,default:"",maxlength:500},
 seoTitle:{type:String,default:"",maxlength:70},
 seoDescription:{type:String,default:"",maxlength:160}
},opts);
CatalogCategorySchema.index({parentId:1,position:1});
export const CatalogCategory=mongoose.models.CatalogCategory||mongoose.model("CatalogCategory",CatalogCategorySchema);
const SiteSeoSchema=new Schema({
 key:{type:String,required:true,unique:true,default:"main"},
 title:{type:String,required:true,maxlength:70},
 description:{type:String,required:true,maxlength:160},
 revision:{type:Number,default:0,min:0},
 enabled:{type:Boolean,default:false}
},opts);
export const SiteSeo=mongoose.models.SiteSeo||mongoose.model("SiteSeo",SiteSeoSchema);
const JournalEntrySchema=new Schema({
 entryKey:{type:String,required:true,unique:true},transactionDate:{type:Date,required:true},
 reference:{type:String,required:true,maxlength:100},note:{type:String,required:true,maxlength:500},
 lines:{type:[new Schema({account:{type:String,required:true},debitPaisa:{type:Number,required:true,min:0},creditPaisa:{type:Number,required:true,min:0}},{_id:false})],required:true},
 totalPaisa:{type:Number,required:true,min:1},createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 status:{type:String,enum:["posted"],default:"posted"}
},opts);
JournalEntrySchema.index({transactionDate:-1,createdAt:-1});
export const JournalEntry=mongoose.models.JournalEntry||mongoose.model("JournalEntry",JournalEntrySchema);
const ProviderConnectionSchema=new Schema({
 provider:{type:String,enum:["steadfast","whatsapp"],required:true,unique:true},
 payloadCipher:{type:String,required:true,select:false},
 iv:{type:String,required:true,select:false},
 tag:{type:String,required:true,select:false},
 configurationVerifiedAt:{type:Date,default:null},
 enabled:{type:Boolean,default:false},
 updatedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 lastTestResult:{type:String,enum:["verified","failed","not_tested"],default:"not_tested"}
},opts);
export const ProviderConnection=mongoose.models.ProviderConnection||mongoose.model("ProviderConnection",ProviderConnectionSchema);
const ContentPageSchema=new Schema({
 slug:{type:String,required:true,unique:true,lowercase:true,trim:true},
 title:{type:String,required:true,maxlength:100},
 description:{type:String,default:"",maxlength:160},
 blocks:{type:[Schema.Types.Mixed],default:[]},
 published:{type:Boolean,default:false},revision:{type:Number,default:0,min:0},
 updatedBy:{type:Schema.Types.ObjectId,ref:"User",default:null}
},opts);
export const ContentPage=mongoose.models.ContentPage||mongoose.model("ContentPage",ContentPageSchema);
const LoyaltyWalletSchema=new Schema({
 customerPhone:{type:String,required:true,unique:true},
 balancePoints:{type:Number,default:0},
 earnedPoints:{type:Number,default:0,min:0},
 redeemedPoints:{type:Number,default:0,min:0},
 reversedPoints:{type:Number,default:0,min:0}
},opts);
const LoyaltyEventSchema=new Schema({
 eventKey:{type:String,required:true,unique:true},
 kind:{type:String,enum:["earned","redeemed","reversed"],required:true},
 customerPhone:{type:String,required:true},
 orderId:{type:Schema.Types.ObjectId,ref:"Order",default:null},
 reference:{type:String,required:true,maxlength:100},
 points:{type:Number,required:true,min:1},
 note:{type:String,required:true,maxlength:500},
 verifiedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},opts);
LoyaltyEventSchema.index({kind:1,orderId:1},{unique:true,partialFilterExpression:{kind:{$in:["earned","reversed"]}}});
LoyaltyEventSchema.index({kind:1,reference:1},{unique:true,partialFilterExpression:{kind:"redeemed"}});
LoyaltyEventSchema.index({customerPhone:1,createdAt:-1});
export const LoyaltyWallet=mongoose.models.LoyaltyWallet||mongoose.model("LoyaltyWallet",LoyaltyWalletSchema);
export const LoyaltyEvent=mongoose.models.LoyaltyEvent||mongoose.model("LoyaltyEvent",LoyaltyEventSchema);
const ProductSeoSchema=new Schema({
 schemaEnabled:{type:Boolean,default:true},
 productId:{type:Schema.Types.ObjectId,ref:"Product",required:true,unique:true},
 metaTitle:{type:String,default:"",maxlength:70},
 metaDescription:{type:String,default:"",maxlength:160},
 focusKeyword:{type:String,default:"",maxlength:80},
 keywords:{type:[String],default:[]},
 imageAltTexts:{type:[String],default:[]},
 ogTitle:{type:String,default:"",maxlength:70},
 ogDescription:{type:String,default:"",maxlength:160},
 robotsIndex:{type:Boolean,default:true},
 robotsFollow:{type:Boolean,default:true},
 revision:{type:Number,default:0,min:0},
 updatedBy:{type:Schema.Types.ObjectId,ref:"User",default:null}
},opts);
export const ProductSeo=mongoose.models.ProductSeo||mongoose.model("ProductSeo",ProductSeoSchema);
const CatalogImportSchema = new Schema({
 importKey:{type:String,required:true,unique:true},
 actorId:{type:Schema.Types.ObjectId,ref:"User",required:true},
 fileHash:{type:String,required:true},
 inserted:{type:Number,default:0},updated:{type:Number,default:0},skipped:{type:Number,default:0},
 affectedSkus:{type:[String],default:[]},completedAt:{type:Date,required:true}
},opts);
export const CatalogImport = mongoose.models.CatalogImport || mongoose.model("CatalogImport",CatalogImportSchema);


/**
 * Supplier-provided product candidates only. This collection is separate from
 * customer-visible Product SKUs and never makes stock or retail claims.
 */
const HrSupplierCandidateSchema=new Schema({
 sourceId:{type:String,required:true,default:"hr-wholesale"},
 sourceRef:{type:String,required:true},
 name:{type:String,required:true,maxlength:150},
 brand:{type:String,required:true,maxlength:100},
 size:{type:String,default:"",maxlength:100},
 sourceUrl:{type:String,required:true,maxlength:400},
 quotedCostPaisa:{type:Number,default:null,min:0},
 quoteStatus:{type:String,enum:["supplier_provided_unverified"],default:"supplier_provided_unverified"},
 reviewStatus:{type:String,enum:["needs_review"],default:"needs_review"},
 importedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},opts);
HrSupplierCandidateSchema.index({sourceId:1,sourceRef:1},{unique:true});
HrSupplierCandidateSchema.index({sourceId:1,updatedAt:-1});
export const HrSupplierCandidate=mongoose.models.HrSupplierCandidate||
 mongoose.model("HrSupplierCandidate",HrSupplierCandidateSchema);


/* Site merchandising only: never modifies Product, payment, customer or stock. */
const HomePageSchema=new Schema({
 key:{type:String,unique:true,required:true,default:"main"},
 revision:{type:Number,required:true,default:0,min:0},
 blocks:{type:[Schema.Types.Mixed],default:[]},
 sections:{type:[Schema.Types.Mixed],default:[]},
 lastEditedBy:{type:Schema.Types.ObjectId,ref:"User",default:null}
},opts);
export const HomePage=mongoose.models.HomePage||mongoose.model("HomePage",HomePageSchema);


/** Only independently verified customer-submitted reviews may become public.
 * No synthetic ratings, timestamps or authors are generated on a page visit. */
const ProductReviewSchema=new Schema({
 productId:{type:Schema.Types.ObjectId,ref:"Product",required:true,index:true},
 orderId:{type:Schema.Types.ObjectId,ref:"Order",required:true},
 rating:{type:Number,required:true,min:1,max:5},
 body:{type:String,required:true,minlength:10,maxlength:1500},
 skinType:{type:String,default:"",maxlength:60},
 photoUrls:{type:[String],default:[]},
 consentToPublish:{type:Boolean,required:true,default:false},
 submittedByCustomer:{type:Boolean,required:true,default:false},
 verifiedPurchase:{type:Boolean,required:true,default:false},
 moderationStatus:{type:String,enum:["pending","approved","rejected"],default:"pending"},
 verifiedAt:{type:Date,default:null}
},opts);
ProductReviewSchema.index({productId:1,moderationStatus:1,createdAt:-1});
ProductReviewSchema.index({orderId:1,productId:1},{unique:true});
export const ProductReview=mongoose.models.ProductReview||mongoose.model("ProductReview",ProductReviewSchema);

/** Durable idempotency barrier for external courier booking. Never silently retry
 * ambiguous provider requests or infer payment settlement from delivery status. */
const CourierShipmentSchema=new Schema({
 orderId:{type:Schema.Types.ObjectId,ref:"Order",required:true,unique:true},
 provider:{type:String,enum:["steadfast"],required:true},
 state:{type:String,enum:["processing","booked","needs_review"],required:true,default:"processing"},
 consignmentId:{type:String,default:"",maxlength:120},
 trackingCode:{type:String,default:"",maxlength:120},
 deliveryStatus:{type:String,default:"",maxlength:80},
 statusCheckedAt:{type:Date,default:null},
 codPaisa:{type:Number,required:true,min:0},
 requestedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 errorCode:{type:String,default:"",maxlength:100},
 responseAt:{type:Date,default:null}
},opts);
CourierShipmentSchema.index({state:1,createdAt:-1});
export const CourierShipment=mongoose.models.CourierShipment||mongoose.model("CourierShipment",CourierShipmentSchema);

/** Staff-entered CRM notes; order phone is an unverified contact identifier. */
const CustomerCRMNoteSchema=new Schema({
 customerPhone:{type:String,required:true,trim:true,maxlength:32},
 note:{type:String,required:true,trim:true,maxlength:1000},
 tags:{type:[String],default:[]},
 actorId:{type:Schema.Types.ObjectId,ref:"User",required:true}
},opts);
CustomerCRMNoteSchema.index({customerPhone:1,createdAt:-1});
export const CustomerCRMNote=mongoose.models.CustomerCRMNote||mongoose.model("CustomerCRMNote",CustomerCRMNoteSchema);

const SocialInternalNoteSchema=new Schema({
 provider:{type:String,enum:["messenger","instagram","whatsapp"],required:true},
 senderId:{type:String,required:true,trim:true,maxlength:180},
 text:{type:String,required:true,trim:true,maxlength:1000},
 actorId:{type:Schema.Types.ObjectId,ref:"User",required:true}
},opts);
SocialInternalNoteSchema.index({provider:1,senderId:1,createdAt:-1});
export const SocialInternalNote=mongoose.models.SocialInternalNote||mongoose.model("SocialInternalNote",SocialInternalNoteSchema);

/** Internal conversation operations, never a verified customer identity or outbound message. */
const SocialConversationStateSchema=new Schema({
 provider:{type:String,enum:["messenger","instagram"],required:true},
 senderId:{type:String,required:true,trim:true,maxlength:180},
 assignedAgentId:{type:Schema.Types.ObjectId,ref:"User",default:null},
 priority:{type:String,enum:["normal","high","urgent"],default:"normal"},
 status:{type:String,enum:["open","pending","resolved"],default:"open"},
 starred:{type:Boolean,default:false},
 updatedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},opts);
SocialConversationStateSchema.index({provider:1,senderId:1},{unique:true});
export const SocialConversationState=mongoose.models.SocialConversationState||mongoose.model("SocialConversationState",SocialConversationStateSchema);

const SocialOutboundSchema=new Schema({
 provider:{type:String,enum:["whatsapp"],required:true},
 inboundEventId:{type:String,required:true},
 requestId:{type:String,required:true},
 recipient:{type:String,required:true,maxlength:32},
 text:{type:String,required:true,maxlength:2000},
 state:{type:String,enum:["processing","sent","needs_review"],default:"processing"},
 providerMessageId:{type:String,default:""},
 actorId:{type:Schema.Types.ObjectId,ref:"User",required:true},
 error:{type:String,default:""}
},opts);
SocialOutboundSchema.index({requestId:1},{unique:true});
export const SocialOutbound=mongoose.models.SocialOutbound||mongoose.model("SocialOutbound",SocialOutboundSchema);

/** Metadata-only custom connector definitions; never executes arbitrary URLs or stores secrets. */
const IntegrationConnectorSchema=new Schema({
 name:{type:String,required:true,trim:true,maxlength:80},
 slug:{type:String,required:true,unique:true,lowercase:true,trim:true,maxlength:90},
 category:{type:String,required:true,enum:["Payment & COD","Courier & COD","Social Inbox","Customer messaging","Cloud & Storage","Marketing"]},
 mode:{type:String,enum:["sandbox","production"],default:"sandbox"},
 description:{type:String,default:"",maxlength:400},
 webhookUrl:{type:String,default:"",maxlength:300},
 enabled:{type:Boolean,default:false},
 archivedAt:{type:Date,default:null},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 updatedBy:{type:Schema.Types.ObjectId,ref:"User",required:true}
},opts);
IntegrationConnectorSchema.index({archivedAt:1,createdAt:-1});
export const IntegrationConnector=mongoose.models.IntegrationConnector||mongoose.model("IntegrationConnector",IntegrationConnectorSchema);
