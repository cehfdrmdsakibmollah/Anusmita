import {validCloudinaryUrl} from '@/lib/cloudinary-media';
import {apiError,HttpError} from '@/lib/auth';
import {db} from '@/lib/db';
import {Product} from '@/lib/models';
import {dedicatedDb} from '@/lib/launch-config';
import {ChatbotSettings} from '@/lib/chatbot-model';
import {chatSchema,answersSchema,builtinReply,searchTerms,escapeRegex,matchCustom,supportLinks,type ChatProduct} from '@/lib/chatbot';
import {allowChat,boundedJson,assertChatOrigin} from '@/lib/chatbot-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(req:Request){
 try{
  assertChatOrigin(req);
  if(!allowChat(req.headers.get('x-nf-client-connection-ip')||'unknown'))return Response.json({error:'Please wait a minute before sending another message.'},{status:429,headers:{...headers,'Retry-After':'60'}});
  const {message,language,context}=chatSchema.parse(await boundedJson(req));
  const builtin=builtinReply(message,language);if(builtin)return Response.json(builtin,{headers});
  const bn=language==='bn';
  if(!dedicatedDb(process.env.MONGODB_URI))return Response.json({reply:bn?'Live catalogue এখন পাওয়া যাচ্ছে না, তাই দাম বা stock নিশ্চিত করতে পারছি না। পণ্যের নাম দিয়ে আমাদের টিমকে জিজ্ঞেস করুন।':'The live catalogue is unavailable, so I cannot confirm prices or stock. Ask our team about the product you want.',links:supportLinks(language)},{headers});
  try{
   await db();
   const config=await ChatbotSettings.findOne({key:'main'}).lean<any>();
   const parsed=answersSchema.safeParse(config?.answers||[]);
   const custom=parsed.success?matchCustom(message,parsed.data,language):undefined;
   if(custom)return Response.json({reply:custom},{headers});
   const terms=searchTerms(message,context);
   if(!terms.length)return Response.json({reply:bn?'পণ্যের নাম, brand বা category লিখুন।':'Please type a product name, brand or category.'},{headers});
   const rows=await Product.find({active:true,$and:terms.map(term=>({$or:['name','brand','category','description','size'].map(field=>({[field]:{$regex:escapeRegex(term),$options:'i'}}))}))}).select('name slug category size variantLabel pricePaisa onHand reserved description usageInstructions imageUrls').sort({createdAt:-1}).limit(4).maxTimeMS(1500).lean<any[]>();
   const products:ChatProduct[]=rows.map(p=>({id:String(p._id),name:p.name,slug:p.slug,category:p.category,size:p.size||p.variantLabel||'',pricePaisa:p.pricePaisa,available:Math.max(0,p.onHand-p.reserved),description:String(p.description||'').slice(0,500),usage:String(p.usageInstructions||'').slice(0,500),imageUrl:Array.isArray(p.imageUrls)?p.imageUrls.find((url:unknown)=>typeof url==='string'&&validCloudinaryUrl(url)):undefined}));
   return Response.json({reply:products.length?(bn?'প্রকাশিত catalogue-এ এই পণ্যগুলো পাওয়া গেছে। Details দেখুন বা enquiry list-এ যোগ করুন।':'These products match the published catalogue. View details or add them to your enquiry list.'):(bn?'এই নামে প্রকাশিত পণ্য পাওয়া যায়নি। অন্য নাম দিয়ে খুঁজুন অথবা আমাদের টিমকে জিজ্ঞেস করুন।':'No published products matched. Try another name or ask our team.'),products,context:products.length===1?products[0].name:context,...(!products.length?{links:supportLinks(language)}:{})},{headers});
  }catch{return Response.json({reply:bn?'Catalogue-এ সংযোগ হচ্ছে না। একটু পরে চেষ্টা করুন বা আমাদের টিমের সঙ্গে কথা বলুন।':'The catalogue connection is unavailable. Please retry shortly or contact our team.',links:supportLinks(language)},{headers});}
 }catch(e){if(e instanceof HttpError)return apiError(e);return Response.json({error:'Please enter a valid message (up to 600 characters).'},{status:400,headers});}
}
