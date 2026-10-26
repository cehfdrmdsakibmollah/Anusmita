import {z} from 'zod';
import {contact} from './information-preview';
export type Language='bn'|'en';
export type ChatProduct={id:string;name:string;slug:string;category:string;size:string;pricePaisa:number;available:number;description:string;usage:string;imageUrl?:string;color?:string;facts?:{label:string;value:string}[]};
export type ChatReply={reply:string;products?:ChatProduct[];suggestions?:string[];links?:{label:string;href:string}[];context?:string};
export const chatSchema=z.object({message:z.string().trim().min(1).max(600),language:z.enum(['bn','en']).default('bn'),context:z.string().max(100).default(''),productSlug:z.string().max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()}).strict();
export const answerSchema=z.object({id:z.uuid(),keywords:z.array(z.string().trim().min(2).max(60)).min(1).max(12),bn:z.string().trim().min(1).max(1200),en:z.string().trim().min(1).max(1200),enabled:z.boolean()}).strict();
export const answersSchema=z.array(answerSchema).max(60).refine(a=>new Set(a.map(x=>x.id)).size===a.length,'Duplicate IDs');
export type CustomAnswer=z.infer<typeof answerSchema>;
export const normalise=(s:string)=>s.normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');
export function keywordMatch(text:string,word:string){return new RegExp('(?:^|[^\\p{L}\\p{N}])'+escapeRegex(normalise(word))+'(?=$|[^\\p{L}\\p{N}])','u').test(normalise(text));}
export const escapeRegex=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const supportLinks=(language:Language)=>[{label:language==='bn'?'WhatsApp-এ কথা বলুন':'Talk on WhatsApp',href:contact.whatsapp},{label:'Messenger',href:contact.messenger},{label:'Email',href:'mailto:'+contact.email}];
export function builtinReply(message:string,language:Language):ChatReply|null{
 const q=normalise(message),bn=language==='bn',has=(a:string[])=>a.some(w=>keywordMatch(q,w));
 const say=(b:string,e:string,extra:Partial<ChatReply>={}):ChatReply=>({reply:bn?b:e,...extra});
 if(has(['tracking','track','status','অর্ডার কোথায়','ট্র্যাকিং','স্ট্যাটাস','order status','parcel','পার্সেল']))return say('আপনার অর্ডারের অবস্থা জানতে আমাদের টিমকে order reference দিন। এই assistant ব্যক্তিগত অর্ডারের তথ্য দেখতে পারে না। নিচের লিংক থেকে সরাসরি যোগাযোগ করুন।','For an order update, share your order reference with our team. This assistant cannot access private order records. Choose a contact option below.',{links:supportLinks(language)});
 if(has(['confirm','checkout','অর্ডার','নিতে চাই','order','preorder','pre-order','প্রি-অর্ডার','restock','রিস্টক','স্টক অ্যালার্ট']))return say('পছন্দের পণ্য খুঁজে “তালিকায় যোগ করুন” চাপুন। তারপর enquiry list দেখে WhatsApp-এ পাঠাতে পারবেন। আমাদের টিম দাম, স্টক ও ডেলিভারি নিশ্চিত করবে। এখানে অর্ডার বা প্রি-অর্ডার স্বয়ংক্রিয়ভাবে কনফার্ম হয় না।','Find a product and choose “Add to enquiry”. Review your list, then send it on WhatsApp. Our team will confirm price, availability and delivery. This chat does not automatically place orders or pre-orders.',{links:supportLinks(language)});
 if(has(['delivery','shipping','ডেলিভারি','চার্জ','charge','location','ঠিকানা','লোকেশন']))return say('আপনার এলাকা ও পণ্যের ভিত্তিতে delivery charge ও সময় আমাদের টিম নিশ্চিত করবে। ঢাকা বা বাংলাদেশের অন্য জেলার নাম জানিয়ে জিজ্ঞেস করুন।','Our team will confirm delivery cost and timing for your location and products. Tell them your area in Dhaka or elsewhere in Bangladesh.',{links:supportLinks(language)});
 if(has(['payment','pay','bkash','nagad','cod','পেমেন্ট','বিকাশ','নগদ']))return say('অর্ডারের জন্য উপলব্ধ payment method আমাদের টিমের সঙ্গে নিশ্চিত করুন। এই chat-এ payment নেওয়া হয় না। PIN, OTP বা card details লিখবেন না।','Confirm available payment methods with our team before placing an order. Payments are not collected in this chat. Do not share PINs, OTPs or card details.',{links:supportLinks(language)});
 if(has(['coupon','discount','offer','offers','কুপন','ডিসকাউন্ট','অফার']))return say('বর্তমান অফার আমাদের টিমের কাছে নিশ্চিত করুন। এই assistant কোনো নতুন coupon তৈরি বা discount apply করে না।','Ask our team about current offers. This assistant does not generate coupons or apply discounts.',{links:supportLinks(language)});
 if(has(['refund','return','exchange','রিটার্ন','রিফান্ড','বদল']))return say('Return বা exchange বিষয়ে order reference ও সমস্যার বিবরণ দিয়ে আমাদের টিমের সঙ্গে কথা বলুন। তারা প্রযোজ্য শর্ত জানাবে।','Contact our team with your order reference and the issue for return or exchange guidance. They will confirm applicable terms.',{links:supportLinks(language)});
 if(has(['skin quiz','skin type','স্কিন টেস্ট','স্কিন টাইপ','routine','রুটিন','সাজেশন','recommend']))return say('আপনি যে skin type-এর জন্য পণ্য খুঁজছেন তা বেছে নিন। প্রকাশিত catalogue description অনুযায়ী মিল দেখাব—এটি skin diagnosis নয়।','Choose the skin type you are shopping for. I will look for matches in published catalogue descriptions; this is not a skin diagnosis.',{suggestions:['Oily skin','Dry skin','Combination skin','Sensitive skin']});
 if(has(['rash','burn','allergy','eczema','pregnant','র‍্যাশ','এলার্জি','অ্যালার্জি','জ্বালা','চিকিৎসা']))return say('ত্বকের প্রতিক্রিয়া বা চিকিৎসার বিষয়ে এই shopping assistant পরামর্শ দিতে পারে না। যোগ্য চিকিৎসকের সঙ্গে কথা বলুন। নির্দিষ্ট পণ্যের প্রকাশিত উপাদান বা ব্যবহারবিধি খুঁজতে নাম লিখতে পারেন।','This shopping assistant cannot advise on skin reactions or medical treatment. Please consult a qualified clinician. You can ask for a product’s published ingredients or usage information by name.');
 if(has(['human','agent','support','whatsapp','messenger','email','মানুষ','সাপোর্ট','অভিযোগ','খারাপ','fraud','faltu','baje']))return say('আমাদের টিম আপনাকে সাহায্য করবে। নিচের লিংক দিয়ে যোগাযোগ করুন—কোনো message নিজে থেকে পাঠানো হয়নি।','Our team can help. Choose a link below to contact them; no message has been sent automatically.',{links:supportLinks(language)});
 if(has(['hi','hello','হ্যালো','সালাম','assalamu alaikum']))return say('ANUSMITA-তে স্বাগতম। পণ্যের নাম লিখুন, অথবা quick question বেছে নিন। Skincare, perfume, fashion, bags, watches ও bed sheets খুঁজতে সাহায্য করতে পারি।','Welcome to ANUSMITA. Type a product name or choose a quick question. I can help you explore skincare, perfumes, fashion, bags, watches and bed sheets.',{suggestions:['Skincare','Perfumes','Fashion','Bags']});
 return null;
}
export function searchTerms(message:string,context=''){
 const q=normalise(message); if(/^(price|stock|দাম|স্টক|এটার দাম|how much|usage|ব্যবহার)$/.test(q)&&context)return [context];
 const aliases:Record<string,string>={'স্কিনকেয়ার':'skincare','পারফিউম':'perfume','ব্যাগ':'bag','ঘড়ি':'watch','বেডশিট':'bed','সানস্ক্রিন':'sunscreen','অয়েলি':'oily','শুষ্ক':'dry','সেনসিটিভ':'sensitive','ফ্যাশন':'fashion'};
 return q.split(/[^\p{L}\p{N}-]+/u).map(t=>aliases[t]||t).filter(t=>t.length>=2&&!['show','me','please','price','stock','skin','দাম','কত','আছে','দেখাও','জন্য','the','for','product','products','want','need'].includes(t)).slice(0,6);
}
export function matchCustom(message:string,rows:CustomAnswer[],language:Language){return rows.find(r=>r.enabled&&r.keywords.some(k=>keywordMatch(message,k)))?.[language];}
export function enquiryLink(items:{product:ChatProduct;quantity:number}[]){
 const text='Hello ANUSMITA, please confirm availability, current price and delivery for:\n'+items.map(({product:p,quantity:q})=>`${p.name}${p.color?' · '+p.color:''}${p.size?' ('+p.size+')':''} × ${q}`).join('\n')+'\nThis is an enquiry, not a confirmed order.';
 return contact.whatsapp+'?text='+encodeURIComponent(text);
}
