/** Fail-closed verification gate: never show unapproved or unconsented reviews. */
export type ReviewVisibility={consentToPublish?:boolean;submittedByCustomer?:boolean;verifiedPurchase?:boolean;moderationStatus?:string;verifiedAt?:Date|null};
export function canPublishReview(review:ReviewVisibility){return review.consentToPublish===true&&review.submittedByCustomer===true&&review.verifiedPurchase===true&&review.moderationStatus==="approved"&&review.verifiedAt instanceof Date&&!Number.isNaN(review.verifiedAt.getTime());}
export function complementaryCategories(category:string):string[]{
 const c=category.toLowerCase();
 if(/dress|cloth|fashion|wear|shoe/.test(c))return ["Bags","Jewellery","Accessories","Makeup"];
 if(/skin|serum|sunscreen|beauty|makeup/.test(c))return ["Skincare","Beauty","Perfumes"];
 if(/perfume|fragrance/.test(c))return ["Beauty","Skincare","Jewellery"];
 if(/bag|accessor|watch|jewel/.test(c))return ["Fashion","Bags","Jewellery","Accessories"];
 if(/bed|home|decor/.test(c))return ["Bed Sheets","Home Decor","Accessories"];
 return [];
}
export function reviewEmptyLabel(count:number){return count===0?"No verified customer reviews have been published for this product yet.":"Verified customer reviews";}
