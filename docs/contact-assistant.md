# Contact assistant

Embedded only on `/contact/design-preview`; the two lower floating social icons have been removed. The existing contact cards, email and form remain. Palette inherits the approved pink, ivory and charcoal design.

This is a deterministic shopping assistant, not a generative model. It has no paid AI dependency or external search service. Chat text is sent only to the same-origin API, is not logged or stored by application code, and clears on reload. Hosting infrastructure may retain ordinary request metadata. Sound is opt-in. No microphone or image upload is requested.

## Working features
- Bengali and English replies, quick questions, context for single-product price/stock follow-ups, clear chat, optional locally synthesised chime.
- Published catalogue products only, SKU prices in paisa, availability computed as onHand minus reserved, bounded literal search terms and result projection excluding cost/supplier/internal fields.
- Multi-item enquiry list (12 SKUs, quantities 1–10), estimated subtotal and explicit review before opening a WhatsApp draft. No order, payment or stock mutation.
- Owner/admin FAQ editor in Assistant Replies: add/edit/remove, bilingual replies, publish toggle, revision conflict protection, transactional audit entry.
- Request byte limit, strict Zod validation, no-store responses, same-origin browser check, query time/row bounds and a capped per-instance rate limiter. Rate limiting is best-effort per Netlify instance; use an edge/shared limiter for cross-instance abuse control.

## Live dependencies and limits
Catalogue and FAQ persistence require the existing dedicated MongoDB connection. FAQ management requires owner/admin authentication. When these are unavailable, the assistant still answers supported store questions and provides human-contact links without inventing prices or stock.

The provided draft contained placeholder orders, shared guest IDs, simulated visual recognition/tracking, invented offers and third-party search text relabelled as brand advice. Those mechanisms are not used. Private order tracking needs authenticated customer ownership or a verified guest token flow. Order placement must use the existing transactional checkout and launch guards. Real restock subscriptions, reviews, loyalty points, courier shipment feeds, image matching, currency conversion and generative answers are not implemented or advertised. The current UI directs enquiries to staff for confirmation. It does not claim a diagnosis, a paid order, an escalation or a subscription was created.

Protected operational responses take priority over custom FAQ answers. Admin FAQs are for verified product/store information; no arbitrary HTML or executable URLs are rendered. API input does not accept user IDs, raw database queries, prices or instructions to mutate commerce records.

## Product photos and reply audio
Customers can select up to three JPG/PNG/WebP photos (5 MB each). Photos are decoded, resized to 1400 px, re-encoded without original metadata, and displayed locally in the conversation. They are not uploaded to the chat API or interpreted by a vision model. Every photo message explains this boundary. Customers can share the actual files using the native share menu, or download and manually attach them to WhatsApp where file sharing is unavailable. Opening a WhatsApp URL alone cannot attach a file. Clearing chat, changing language or leaving the page releases photo previews; no image history is persisted. SVG and documents are not accepted.

Published catalogue replies can include approved ANUSMITA Cloudinary product photos. Reply sound has an explicit enable/mute control and plays a two-note test when enabled; the AudioContext is unlocked by that user gesture before asynchronous replies. Sound remains opt-in per page visit.
