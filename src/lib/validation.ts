
import { z } from "zod";
const humanText = (max:number) => z.string().trim().min(1).max(max);
export const checkoutSchema = z.object({
 items:z.array(z.object({productId:z.string().regex(/^[0-9a-f]{24}$/i),quantity:z.number().int().min(1).max(20)})).min(1).max(30),
 customer:z.object({name:humanText(100),phone:z.string().regex(/^01[3-9][0-9]{8}$/),district:humanText(80),area:humanText(100),address:humanText(400),notes:z.string().trim().max(400).default("")}),
 paymentMethod:z.enum(["cod","bank_transfer","bkash_manual","nagad_manual"]),
 depositPaisa:z.number().int().min(0).default(0),
}).strict();
export const productSchema = z.object({
 name:humanText(150),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),sku:z.string().regex(/^[A-Za-z0-9_-]{3,60}$/),
 brand:z.string().max(100).default(""),category:humanText(60),
 origin:z.enum(["Bangladesh","China","Japan","Korea","Other"]).default("Other"),
 description:z.string().max(3000).default(""),size:z.string().max(50).default(""),
 variantLabel:z.string().max(60).default("Standard"),
 variantGroup:z.string().trim().toLowerCase().regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/).max(100).default(""),
 ingredients:z.string().trim().max(2000).default(""),usageInstructions:z.string().trim().max(1500).default(""),
 topNotes:z.string().trim().max(400).default(""),heartNotes:z.string().trim().max(400).default(""),baseNotes:z.string().trim().max(400).default(""),
 imageUrls:z.array(z.string().url().startsWith("https://")).max(12).default([]),
 pricePaisa:z.number().int().min(1),costPaisa:z.number().int().min(0),
 onHand:z.number().int().min(0).default(0),reorderLevel:z.number().int().min(0).default(5),
 active:z.boolean().default(false),
}).strict();
export const paymentSchema = z.object({
 orderId:z.string().regex(/^[0-9a-f]{24}$/i),method:z.enum(["cash","cod","bank_transfer","bkash_manual","nagad_manual"]),
 reference:humanText(100),amountPaisa:z.number().int().positive(),note:z.string().max(500).default("")
}).strict();
