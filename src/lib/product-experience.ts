import {contact} from './information-preview';
export const detailFields=[['color','Colour / shade'],['colorHex','Swatch hex colour'],['material','Material / fabric'],['dimensions','Dimensions / capacity'],['compatibility','Compatible devices'],['careInstructions','Care instructions'],['warranty','Warranty terms'],['sizeGuide','Size guide / measurements'],['skinType','Labelled skin types'],['benefits','Published benefits']] as const;
export type ProductDetails=Partial<Record<typeof detailFields[number][0],string>>;
export function categoryLabels(category:string){
 const c=category.toLowerCase();
 if(/perfume|fragrance|attar|decant/.test(c))return {size:'Volume',story:'Your signature scent.',kind:'fragrance'};
 if(/skin|beauty|makeup|cosmetic|body|hair/.test(c))return {size:'Size / volume',story:'A little care, every day.',kind:'beauty'};
 if(/shoe|footwear/.test(c))return {size:'Shoe size',story:'Beautiful steps, every day.',kind:'fashion'};
 if(/fashion|cloth|dress|wear/.test(c))return {size:'Clothing size',story:'Style that feels like you.',kind:'fashion'};
 if(/jewel|ring|bangle/.test(c))return {size:'Size / finish',story:'The details make it yours.',kind:'accessory'};
 if(/bed|home|decor/.test(c))return {size:'Bed size / dimensions',story:'A softer place to unwind.',kind:'home'};
 if(/mobile|accessor|electronic/.test(c))return {size:'Model / option',story:'Made for your everyday.',kind:'accessory'};
 return {size:'Size / option',story:'Everyday, beautifully considered.',kind:'accessory'};
}
export function unitPrice(pricePaisa:number,size:string){const m=size.trim().match(/^(\d+(?:\.\d+)?)\s*(ml|g|gm)(?:\s+spray)?$/i);if(!m||Number(m[1])<=0)return null;return {paisa:pricePaisa/Number(m[1]),unit:m[2].toLowerCase()==='ml'?'ml':'g'};}
export function assistantHref(name:string,slug?:string){const query=new URLSearchParams({product:name.slice(0,150)});if(slug&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug!=='design-preview')query.set('productSlug',slug);return '/contact/design-preview?'+query+'#assistant-title';}
export function productEnquiry(name:string,slug:string,size:string,color:string,quantity=1,note=''){
 const text=`Hello ANUSMITA, please confirm availability and details for ${name}${color?' · '+color:''}${size?' · '+size:''} × ${quantity}.\nhttps://anusmita.netlify.app/products/${encodeURIComponent(slug)}${note?'\nAdditional enquiry (please confirm details): '+note:''}`;
 return contact.whatsapp+'?text='+encodeURIComponent(text);
}
export function productFacts(p:ProductDetails){return detailFields.filter(([key])=>key!=='colorHex'&&Boolean(p[key]?.trim())).map(([key,label])=>({label,value:p[key]!}));}
