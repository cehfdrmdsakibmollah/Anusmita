
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
