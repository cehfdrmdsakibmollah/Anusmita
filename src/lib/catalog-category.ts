// Fixed expressions preserve the storefront's category families without accepting user regex.
const families:Record<string,string>={skincare:'skin|cleanser|serum|sunscreen|toner|cream',beauty:'beauty|cosmetic|makeup|skin|hair',watches:'watch|timepiece','mobile accessories':'mobile|phone|tech|electronics|earbud','bed sheets':'bed|home|linen|sheet',perfumes:'perfume|fragrance|scent',bags:'bag|purse|handbag',jewellery:'jewel|jewelr|necklace|ring|bracelet|earring',fashion:'fashion|cloth|apparel|dress|wear',accessories:'accessor|bag|watch'};
export function categoryFilter(value:string){
 const key=value.toLowerCase();
 if(!value||key==='all')return undefined;
 return families[key]?{$regex:families[key],$options:'i'}:value.slice(0,80);
}
