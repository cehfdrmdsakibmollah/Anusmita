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

The provided draft contained placeholder orders, shared guest IDs, simulated visual recognition/tracking, invented offers and third-party search text relabelled as brand advice. Those mechanisms are not used. Private order tracking needs authenticated customer ownership or a verified guest token flow. Order placement must use the existing transactional checkout and launch guards. Real restock subscriptions, loyalty points, courier shipment feeds and generative shopping advice are not implemented. An opt-in photo-to-catalogue matching path is implemented in the Cloudflare code branch, subject to the AI binding, model terms, resource limits and hosted verification. The current UI directs enquiries to staff for confirmation. It does not claim a diagnosis, a paid order, an escalation or a subscription was created.

Protected operational responses take priority over custom FAQ answers. Admin FAQs are for verified product/store information; no arbitrary HTML or executable URLs are rendered. API input does not accept user IDs, raw database queries, prices or instructions to mutate commerce records.

## Product photos and reply audio
Customers can select up to three JPG/PNG/WebP photos (5 MB each). Photos are decoded, resized to 1400 px, re-encoded without original metadata, and displayed locally in the conversation. Clicking Send now runs a **zero-API-fee browser-side catalogue photo similarity search** for the first photo. It loads bounded public product image references from the published sheet/skincare catalogue and compares image structure and colours using Canvas. The customer photo is not uploaded to Cloudflare AI, Google, or ANUSMITA servers in this mode. A close visual match is **not verified product identity**; different camera angles, packaging revisions, and cropped photos may not match. The browser may download reference photos and process them locally; it does not guarantee free CDN bandwidth or hosting costs. This code change requires staging deployment and browser acceptance before claiming it is live. An older optional Workers AI route remains in the branch but is not called by this chatbot UI. Customers can share the actual files using the native share menu, or download and manually attach them to WhatsApp where file sharing is unavailable. Opening a WhatsApp URL alone cannot attach a file. Clearing chat, changing language or leaving the page releases photo previews; no image history is persisted. SVG and documents are not accepted.

Published catalogue replies can include approved ANUSMITA Cloudinary product photos. Reply sound has an explicit enable/mute control and plays a two-note test when enabled; the AudioContext is unlocked by that user gesture before asynchronous replies. Sound remains opt-in per page visit.


## Vision model access and release gate
- The account reports an unaccepted Meta Llama 3.2 Vision community license (403, code 5016). Do not accept on a customer's behalf. The Worker now defaults to `@cf/moondream/moondream3.1-9B-A2B`, using its documented `task=query`, data-URI image, `question`, and `answer` fields. The account accepted a non-customer inference API request but returned no readable answer; real-image acceptance is still unverified.
- `VISION_MODEL=llama-3.2-vision` opts into the Llama backend **only after** the account holder accepts the model agreement. Never silently submit the `agree` prompt.
- Shipping/checkout, credentials, staff roles, product data and R2 media stay untouched. A successful GitHub CI build is not a hosted Cloudflare application deployment.


## API-free photo similarity release status
- No Google Lens API is integrated: Google does not expose an official public Lens endpoint for this use case. Gemini free tiers are quota-limited and not guaranteed perpetually free.
- The client-side Canvas matcher compares visible image properties against the existing 90-item catalogue references. It does not perform OCR, object recognition or semantic packaging classification. Uncertain results are rejected rather than making SKU claims.
- It requires public same-origin catalogue thumbnails, browser Canvas support and first-load image downloads. Customer uploads are not sent to third-party AI services. Product links are shown without fabricated prices, stock or checkout claims.
- The existing Cloudflare AI endpoint is retained for future explicitly approved experiments, and remains a separate gated feature; new UI does not send photos to it.


## Lens-like API-free semantic search (experimental; staging only)
- Browser photo search first uses local Canvas similarity, and when no match is found attempts semantic image embeddings using Transformers.js CLIP (`Xenova/clip-vit-base-patch32`). Customer photo stays on the device. No Google Lens scraping and no paid per-query inference API.
- A pinned public Transformers.js ESM bundle and CLIP model weights are downloaded at first use from external public hosting. These requests expose normal web request metadata but **do not include customer photos**. To remove CDN dependency entirely, self-host the licensed model weights and JS runtime with correct asset/CORS/CSP configuration after validation.
- Index embeddings for public catalogue photos are cached in the browser IndexedDB. Initial indexing may take minutes and consume bandwidth, CPU, battery and storage. Some devices, browsers, network policies, CSP rules or model hosts may not support it. A Cancel button and 180-second search deadline provide a bounded experience; results are only *possible matches*, never authenticated SKU identification.
- The conservative CLIP similarity threshold and angle robustness require real multi-angle benchmark testing. Exact catalogue-photo hosted Chromium acceptance is a separate check and **does not prove CLIP fallback works**.
- There can never be an unconditional lifetime/unlimited service guarantee: CDN/hosting quotas, device capabilities, model licensing, storage/bandwidth and vendor policies can change. The architecture removes per-search external AI inference fees, not all infrastructure costs.
- Existing Cloudflare Workers AI inference endpoint remains separate; chatbot uploads do not call it. Production environment and COD remain unchanged.
