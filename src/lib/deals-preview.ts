export const dealCategories = ['All Offers', 'Skincare', 'Makeup', 'Perfume', 'Fashion', 'Lifestyle'] as const;
export type DealCategory = typeof dealCategories[number];
export type DealSort = 'recommended' | 'price-low' | 'price-high' | 'discount';
export type PreviewDeal = { id: string; name: string; category: DealCategory; price: number; original: number; art: readonly number[] };
export const previewDeals: PreviewDeal[] = [
  {id:'serum',name:'Hydrating Serum',category:'Skincare',price:1200,original:1500,art:[94,458,161,152]},
  {id:'cleanser',name:'Gentle Cleanser',category:'Skincare',price:850,original:1000,art:[286,458,161,152]},
  {id:'perfume',name:'Rose Eau de Parfum',category:'Perfume',price:2400,original:3000,art:[476,458,161,152]},
  {id:'tote',name:'Everyday Tote',category:'Fashion',price:1700,original:2000,art:[667,458,161,152]},
  {id:'lipstick',name:'Velvet Lip Colour',category:'Makeup',price:680,original:800,art:[94,716,161,152]},
  {id:'watch',name:'Classic Watch',category:'Lifestyle',price:2000,original:2500,art:[286,716,161,152]},
  {id:'bedding',name:'Cotton Bed Set',category:'Lifestyle',price:2400,original:3000,art:[476,716,161,152]},
  {id:'dress',name:'Summer Dress',category:'Fashion',price:1600,original:2000,art:[667,716,161,152]},
];
export const previewDuration = (8 * 3600 + 24 * 60 + 36) * 1000;
export function discountPercent(deal: Pick<PreviewDeal,'price'|'original'>) {
  return deal.original > 0 ? Math.max(0, Math.round((1 - deal.price / deal.original) * 100)) : 0;
}
export function remainingSeconds(deadline: number, now: number) {
  return Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
}
export function previewDeadline(stored: string | null, now: number) {
  const deadline = stored === null ? NaN : Number(stored);
  // Keep expired deadlines expired; never silently restart urgency on refresh.
  return Number.isFinite(deadline) && deadline > 0 && deadline <= now + previewDuration ? deadline : now + previewDuration;
}
export function selectDeals(category: string, sort: DealSort, query = '') {
  const search = query.trim().toLocaleLowerCase();
  const rows = previewDeals.filter(d => (category === 'All Offers' || d.category === category) && `${d.name} ${d.category}`.toLocaleLowerCase().includes(search));
  if (sort === 'price-low') rows.sort((a,b) => a.price-b.price);
  if (sort === 'price-high') rows.sort((a,b) => b.price-a.price);
  if (sort === 'discount') rows.sort((a,b) => discountPercent(b)-discountPercent(a));
  return rows;
}
