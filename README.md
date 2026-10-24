
# ANUSMITA Commerce + ERP

A mobile-first e-commerce and business operations foundation for **ANUSMITA — Fashion · Jewellery · Beauty**, Bangladesh (BDT).

## What works in this foundation
- Responsive storefront with search/filter, product cards, persistent browser cart and guest checkout.
- Product/SKU catalogue, cost snapshots and physical/reserved/available stock.
- MongoDB ACID stock reservation and idempotent order placement (Atlas replica set required).
- Owner/admin login with bcrypt hashing, signed HttpOnly session cookie and RBAC.
- Status-aware order workflow: placed → confirmed → packed → shipped → delivered; authorized cancellations release reservations.
- Manual bank/bKash/Nagad/cash payment **ledger**, independent owner verification and partial balances. **Not live merchant APIs**.
- Sales versus collected funds versus estimated gross/operating profit (unreconciled clearly identified).
- Low-stock counters, supplier records, stock adjustments with audit trail.
- Print-friendly A4, 80mm, 58mm **order receipts** (tax invoice numbering not yet implemented).
- Search engine metadata, robots and sitemap; no fake reviews, products, or payment statuses.

## Setup
1. Install Node.js 22+ and run: npm install
2. Copy .env.example into .env (never commit .env).
3. Configure MongoDB Atlas replica-set connection using MONGODB_URI.
4. Generate a secure SESSION_SECRET (at least 32 random characters).
5. Set OWNER_EMAIL and OWNER_PASSWORD (minimum 14 characters).
6. Run: npm run owner:create (one-time; refuses additional owner accounts).
7. Run: npm run dev and open http://localhost:3000
8. Enter /admin/login with the owner credentials, create product SKUs and optionally publish them.
9. Run npm test, npm run typecheck, npm run build before deployment.

### Vercel
- Connect this repository to Vercel as a Next.js project, Node.js runtime.
- Configure MONGODB_URI, SESSION_SECRET, NEXT_PUBLIC_SITE_URL and shipping fees in Vercel Environment Variables.
- Initialize owner locally or from a trusted private setup environment before using /admin/login.
- Avoid running owner initialization or placing real orders from CI.
- Confirm domain, database access and restore strategy before accepting orders.

## Operations / financial rules
- All amounts stored in integer **BDT paisa**. 100 paisa = ৳1.
- Checkout never trusts posted product price or stock quantities; current product price, cost and availability are recalculated in the transaction.
- On checkout reserved increases; on fulfilment both reserved and physical on-hand decrease. Cancellation releases reservations.
- A placed order is not collected revenue. Only independently verified funds appear in the payment ledger.
- Manual payment receipt cannot be inferred from bKash/Nagad screenshots.
- Courier adapter, approved live gateways, refunds/returns, formal issued invoices, supplier receiving workflows, abandoned carts, marketing reminders, and compliant notifications remain separate future implementation stages.
- Financial net profit must not be represented as reconciled until all real costs, courier COD settlements, tax, fees and refunds are accounted for.

## Drive inventory sourcing
The supplied Drive catalogue contains Korean, Japanese and Chinese product media. **The files are NOT imported automatically.** Product images and details must be validated, categorized and approved by the owner. Never auto-publish WhatsApp-exported pictures or infer price/stock/authenticity from a filename.

## Security
- No database passwords or merchant keys belong in public files or NEXT_PUBLIC environment variables.
- Protect access to supplier and customer records. Run an external security assessment before live production.
- Requires rate limiting at deployment edge and a backup/restore procedure before launch.
- Set correct HTTPS site domain for origin validation.
- Individual features are staged in a PR; do not merge without build/test verification.

## CI
GitHub Actions runs Node 22 install, unit tests, TypeScript typecheck and production build. A passing workflow is not proof of gateway, mobile printer, courier or real device readiness.

## Card-free Google Drive product image linking (October 2026)
- Connected Google Drive inventory snapshot: `src/data/drive-media.json` with 655 image IDs across Korea (268), Japan (176), China (211). Two PDFs were excluded.
- Owner dashboard → **Drive Images**: search/filter the reviewed media index, select a Drive image, search an existing SKU, then attach/remove images with audit history and optimistic locking.
- Does **not** create products, set prices, publish listings, change stock, or transfer/delete Drive media. Drive folder filenames are not trustworthy SKUs.
- **Important:** Google Drive is not a dedicated image CDN. Its thumbnails can be unstable, denied, rate limited, or require sign-in. Public folder access does not guarantee universal thumbnail access. Test each image via private/incognito browser and real devices before publishing.
- 129 Japanese originals are HEIC: Google may generate previews, but convert the originals to JPEG/WebP when practical before production. The app references Drive thumbnail URLs, not raw HEIC file data.
- Existing files reviewed in the connected Drive sample exposed "anyone with the link (reader)" access; no sharing permissions were changed by this implementation.
- Media inventory is committed to a public GitHub repository; it contains file IDs, file names, origin, MIME and sizes. Only use this workflow for intentionally public marketing images; do not put private documents in these folders.
- This is a **snapshot**, not live folder synchronization. To refresh the snapshot, regenerate the index through a trusted authenticated workflow.
- Photo ownership and permission to use assets commercially must be verified by ANUSMITA.
- Product media remains subject to the 12-image limit per SKU; removal does not delete files in Drive.

## Cloudinary: direct admin upload & controlled Google Drive migration
The connected Cloudinary account uses the cloud name **oseohmxd**, but the ChatGPT connector's credentials **do not automatically exist inside the deployed web app**.

1. In the Cloudinary Console, copy your **API Key** and **API Secret** to private server environment variables. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your hosting control panel. Keep these out of git, browser code and NEXT_PUBLIC variables.
2. Start the website with MongoDB Atlas and admin authentication configured. Open /admin → **Cloudinary**.
3. Find an existing SKU, choose a JPEG/PNG/WebP (max 10 MB), and press **Upload & link selected image**. A restricted server-signed upload sends the file directly from the browser to Cloudinary. A separate server-side Admin API check verifies the actual asset before attaching it to MongoDB.
4. To migrate a Google Drive image, go to **Drive Images**, choose a known SKU + one image, then click **Migrate 1 image to Cloudinary**. This uploads only that image and replaces its existing Drive thumbnail reference if present; it keeps the original Drive file untouched.
5. HEIC originals (129 in this snapshot) are intentionally excluded from automatic migration. Convert to JPEG/WebP before uploading.
6. Default safety cap is 10 signed uploads/imports per admin per UTC day (MEDIA_DAILY_UPLOAD_LIMIT, clamped to 20). This is not a total credit guarantee: the operator must review Cloudinary usage and image rights.
7. The plugin-based import can also be used independently; the **Cloudinary** tab can validate and attach previously uploaded managed ANUSMITA assets.

**Cautions:** No automatic 655-image migration or product assignment. Product matching is manual to avoid wrong SKU association. Images from the static public Drive index are not automatically verified as saleable products. External live media tests, billing and CORS checks must be performed before production launch. Cloudinary signed uploads can be valid up to one hour; each signature is restricted to a unique asset path but needs owner/admin/inventory access to obtain. Keep rate limiting and account-level usage alerts in place.

## Product gallery controls (next media operations release)
- In Admin → Cloudinary, search/select a SKU to see its current photo gallery; designate the primary cover photo, change order, or unlink a mistaken association without deleting the original asset.
- All edits validate the product's updatedAt field and are written with actor audit logs; stale concurrent edits return HTTP 409. No automatic destructive Cloudinary or Google Drive file deletion.
- Admin → Cloudinary → Browse Cloudinary assets lists only files within the managed `anusmita/` prefix. It requires Cloudinary **server-side** API credentials and uses a paginated private Admin API request. Selecting an existing image fills the linking field; it does not publish or mutate product data by itself.
- Product gallery order is persisted as `Product.imageUrls`. The first URL is used as the storefront card/SEO image.
- These are **code changes** until actual hosting, MongoDB, Cloudinary server settings, staff login and live end-to-end testing are configured.

## Launch readiness / safe catalog mode

**Default: no public orders.** STORE_MODE=catalog is the safe default; the storefront displays a preview and disables checkout. The server POST /api/checkout returns HTTP 503 and does not reserve stock unless *all* of these are true:
- STORE_MODE=live (explicit opt-in).
- MONGODB_URI points to database **/anusmita**, not the existing Portfolio database (separate database/user strongly recommended).
- SESSION_SECRET is a strong random secret, at least 32 characters.
- NEXT_PUBLIC_SITE_URL is a production HTTPS address (localhost/http rejected).

Owners can open /admin → **Launch Readiness** after the MongoDB owner account is configured to see private configuration checks, active owner and published-product counts. The panel never exposes credentials or claims that a payment gateway, courier, taxes, backups or mobile-device tests are validated.

Search engine indexing is blocked through robots metadata and robots.txt until checkout is explicitly live with valid configuration. This prevents accidentally promoting a preview as a functioning store.

**Deployment reminder:** The connected Vercel account currently has other projects but no ANUSMITA project. Do not upload a commercial storefront to a plan that forbids commercial use. Choosing a compliant deployment platform, provisioning the ANUSMITA MongoDB database/user, configuring encrypted environment variables, backup restoration and real end-to-end tests are still required. GitHub builds alone are not launch approval.

### ANUSMITA Atlas cluster created
The dedicated MongoDB Atlas project **ANUSMITA Commerce** contains a **FREE cluster named ANUSMITA** in AP_SOUTH_1, with connection host `anusmita.jvvjo1k.mongodb.net`.

A scoped database user **anusmita_app** has been created with readWrite access **only** to the `anusmita` database on the ANUSMITA cluster. No network access-list entry has been added, and its password was not committed. For safe local setup, read [docs/ATLAS_SETUP.md](docs/ATLAS_SETUP.md), reset the generated password in Atlas if needed, and run `npm run db:doctor` before `npm run owner:create`. The Portfolio database was not modified.


## Supplier purchase orders and goods receipts
The Admin **Purchasing** tab supports real purchase draft creation, supplier selection, SKU-level quantities and expected integer-paisa unit costs, explicit submission, and cancellation before stock receipt. Role-scoped staff can receive part of an order or the remainder. Each goods receipt executes in one MongoDB replica-set transaction and writes a stock-movement ledger, a unique idempotency receipt record, updated purchase state, and an audit event. Retrying a receipt using the same UUID is designed to return its prior result rather than duplicating stock.

**Important boundaries:** Planned PO value is not proof of a supplier's verified invoice or payment; the overview labels this an estimated supplier commitment. A goods receipt requires checking physical quantities before submitting. Received inventory does **not** modify the product selling price or its cost automatically. Supplier payment recording, invoice matching, returns to supplier, exchange-rate landed cost allocations and courier integrations are not implemented. No live goods or financial transactions have been tested in a connected website yet; an actual authenticated Atlas end-to-end test and backup process are prerequisites for live operations.


## Supplier Payment Ledger (manual reconciliation; NOT a payment gateway)
Admin → Purchasing → select submitted/partially received/received purchase → **Supplier payments and reconciliation**.
- Only owner/admin/finance roles can record funds actually paid. Staff must independently verify the payment against their bank/mobile wallet or signed cash voucher.
- Input a globally unique reference per payment method, the verified amount in BDT and an evidence note; a checkbox and second confirmation are required.
- Updates the PO paid amount, append-only SupplierPayment ledger, and Audit entry together using an Atlas transaction. Duplicate reference and same-UUID retries are handled to avoid paying the same invoice twice in bookkeeping; no money is transferred.
- A submitted purchase with supplier payments cannot be cancelled using the normal purchase cancellation path.
- Admin financial overview separates estimated outstanding supplier purchase commitments and supplier funds independently marked as verified. **A draft/submitted PO is not necessarily an invoice or expense**, so don't interpret estimated commitments as audited accounts payable.
- Supplier repayments/refunds, write-offs, partial vendor invoice allocation across multiple POs, tax/VAT, foreign exchange and true bank feeds are NOT implemented. Do not invent real bank confirmations.
- No real user/customer business records were modified during this GitHub development phase. Authenticated MongoDB and finance e2e tests are required before accepting actual operational transactions.


## Canva-backed ANUSMITA Korean skincare source — 30 product names
The Canva share link https://canva.link/qt78rkxrqw8fzpz resolves to Canva design DAHYeGxRdho, a 6-page ANUSMITA Korean skincare catalogue. Its five product pages contain 30 identifiable printed product names/sizes.

- A **read-only source snapshot** lives in src/data/canva-catalog.json. Admin → **Canva Catalogue** displays 30 names with page numbers, pack sizes and review flags.
- Staff can download a **verification CSV** with BLANK matched SKU, purchase cost, selling price, inventory and image columns. The exported CSV is **not** a ready-to-import product inventory; review values against packaging, invoices and stock counts first.
- No products are auto-created, priced or published. No existing stock, photos or prices are overwritten, and nothing is inferred from broad marketing claims like "200+ items" or "100% authentic."
- The Canva source may change: this is a dated snapshot, not real-time synchronization. One irregular Centellian packaging-size string is explicitly flagged for human confirmation.
- Link verified product records to approved Google Drive / Cloudinary marketing photographs only after checking the actual identity and rights. Catalogue copy includes skincare efficacy claims that have NOT been medically or independently verified.


## HR Wholesale Cosmetics supplier reference / 400-row quote staging

The user supplied https://www.hrwholesalecosmetics.com/ as a **possible** Korean product wholesaler for ANUSMITA. The public website advertises 250+ products, including different categories and some non-Korean products; **wholesale prices are gated behind login**. Public product names and supplier claims are not proof of stock, sourcing rights, authenticity or prices.

- A dated **32-public-product-name review snapshot** lives at src/data/hr-wholesale-public.json. No vendor images, product descriptions, protected wholesale costs or website code are copied.
- Admin **HR Wholesale** tab displays known public names and links, exports a source review CSV with empty supplier SKU/cost/stock fields, and provides the exact six-column official supplier quote template.
- Staff with owner/admin/purchasing role can upload an authorized supplier CSV for **up to 400 rows per file**, supporting a future complete 250+ supplier catalogue. Each row is validated and previewed before confirmation.
- The import uses an independent **HrSupplierCandidate** staging collection: its records are **not** Product SKUs and never publish, price or stock ANUSMITA products. Quoted costs in supplier files stay **supplier-provided/unverified** until original supplier quotation/invoices are checked.
- Product URLs can reference only the exact HR Wholesale HTTPS domain. Per-file supplier references are unique; when missing, a deterministic **NAME-...** reference based on printed name and size is generated. Repeated references upsert review rows instead of producing duplicate storefront listings.
- Image/media licensing, seller terms, brand/origin verification, minimum order quantity, batch and expiry are manual sign-off steps before sourcing. No automated checkout, bot login or unauthorized bulk scraping occurs.
- The connected ANUSMITA Atlas cluster still requires private site credentials and live end-to-end testing. No real supplier catalog was modified during code authoring.


## ANUSMITA premium homepage and visual merchandising — editable from admin
- Live storefront includes a two-slide accessible carousel, eight curated shopping categories, an original editorial layout, mobile-friendly navigation, real product rails, collection filters, and optional scheduled promotional countdowns.
- Admin → Homepage Studio (owner/admin only) is a database-backed CMS for creating, editing, publishing/unpublishing, reordering and deleting hero slides, categories, editorial banners, announcements and promotional offers. Featured sections (New Arrivals, Best Sellers, Trending, Popular, Recommended) have editable title, description, position, visibility and assigned product SKUs.
- No invented catalogue products, prices, customer reviews, discount percentages, shipping promotions or fake sales counters. An offer with a valid expiry disappears after its end time. New Arrivals are published products sorted by creation time. Best Sellers use delivered non-test order quantities when not curated; all other labelled sections need manually selected published product SKUs.
- Image URLs require HTTPS Cloudinary under oseohmxd or Unsplash; use approved/licensed actual brand photography for customer-facing advertisements. Starter editorial imagery is for layout only; not verified ANUSMITA inventory. Replace in Homepage Studio when authorized.
- Product, inventory, payments and supplier ledgers cannot be mutated through homepage CMS. Changes require an authenticated owner/admin and are audit logged. Versioned writes prevent accidental lost edits.
- IMPORTANT: MONGODB_URI and an initial owner must be configured before the Homepage Studio can persist changes in live Netlify. Before then the public homepage uses design fallback assets and an honest prelaunch empty-catalogue state.
- Netlify auto deploys main; keep STORE_MODE=catalog until checkout, payment, Atlas IP access and real DB integration tests pass.
