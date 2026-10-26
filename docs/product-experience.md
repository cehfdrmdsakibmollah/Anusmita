# Category-aware product details and connected assistance

The existing `/products/[slug]` route now supports colour and size combinations across all categories using independent published SKUs. Group products with the same `variantGroup`, brand and category. Each combination keeps its own price, inventory and photo gallery. Colour selection chooses the same size if published, otherwise a real SKU for that colour. It never creates a nonexistent combination. Perfumes retain the required 2ml Spray, 5ml, 10ml, 15ml, 50ml and 100ml cards. The catalogue launch guard and transactional checkout are unchanged.

## Dashboard and storefront
The existing product editor/API/schema support colour, hex swatch, material, dimensions, device compatibility, care, warranty, size guide, labelled skin types and published benefits. Empty fields do not become fabricated claims. Size guides are supplier measurements rather than BMI-based guesses. A comparison table shows published SKU prices and available stock. Unit pricing is calculated only from unambiguous ml/g quantities. Product enquiries include the selected SKU option, quantity and optional gift request; gift service/cost is confirmed by staff, not charged silently.

On mobile, a fixed product action bar respects checkout/catalogue mode. The design preview keeps the reference perfume layout and adds ten category layout tabs; example options and editorial images are explicitly labelled, have no live price/stock and cannot place an order. Preview imagery does not change shade when an example option is chosen because real colour-specific photographs are not available. Published colour options navigate to that SKU's actual photos.

## Chat and shared pages
Product links prepare a question on the Contact assistant, without automatically sending it. Validated product slugs scope replies to published variants from the same group/brand/category, limited to 12 results. The customer can clear context to search all products. Published specifications, colour, stock and product imagery appear in replies. Existing photo attachments and optional reply chime remain.

Shop, product, account, cart/checkout/order, About and Journal pages share a matching assistance strip before the footer. The Contact page already embeds the assistant; invoice and admin pages omit the strip. Shared focus styling, spacing, mobile layouts and print exclusions preserve their page designs. Shop/product preview footers use the text brand and tagline without logo emblems.

## Validation and dependencies
Unit/API tests cover category labels, unit prices, colour-size selection, safe enquiry/context links, specification bounds and unpublished-product isolation. Database-backed variant persistence and owner/admin editing still require the existing live MongoDB/owner setup; no production catalogue records were created for testing.

The uploaded idea list repeats simulated features. No fabricated viewer/purchase counters, reviews, stock, discounts, expiry dates, shipment status, medical compatibility scores, material guarantees or forex rates are presented as facts. Generative vision, AR/360 assets, courier tracking, restock subscriptions, loyalty/reviews and live-currency services remain separate integrations requiring real providers/data. This change does not claim those integrations are active.
