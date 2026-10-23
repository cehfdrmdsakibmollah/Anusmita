
import source from "../data/canva-catalog.json";
import {csvSerialize} from "./catalog-csv";

/** Immutable marketing-source snapshot, not the MongoDB product collection. */
export const canvaSource=source;
export const CANVA_REVIEW_HEADERS=[
 "source_page","position_on_page","brand_printed","product_name_printed",
 "pack_size_printed","matched_sku","verified_price_bdt","verified_cost_bdt",
 "verified_opening_stock","reviewed","review_note"
] as const;
export function canvaReviewCsv(){
 const rows=source.products.map(item=>[
  item.sourcePage,item.positionOnPage,item.brandPrinted,item.sourceName,item.packSizePrinted,
  "","","","","false",item.reviewNote||""
 ]);
 return csvSerialize([Array.from(CANVA_REVIEW_HEADERS),...rows]);
}
