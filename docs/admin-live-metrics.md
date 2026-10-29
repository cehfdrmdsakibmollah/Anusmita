# Admin dashboard data integration

The approved overview layout is preserved. `/admin/dashboard` reads the protected `/api/admin/dashboard?days=7|14` endpoint alongside existing financial totals and recent orders. The public design preview remains isolated sample data.

## Metric definitions

- Today: Asia/Dhaka midnight through request time; excludes test, cancelled and returned orders.
- Ordered sales: valid orders grouped by creation date. This is order value, not collected revenue.
- Net collected: verified receipts minus verified refunds, grouped by verification date. Reversed entries and payments associated with test or missing orders are excluded. Real refunds remain represented even if the order was cancelled or returned.
- Available stock: active product on-hand units minus reserved units, floored at zero per SKU.
- Reserved stock: all product reservations.
- Incoming stock: remaining quantities on submitted or partially received purchase orders, never draft or cancelled purchases.
- Payment queue: non-COD orders marked unpaid or partial. This is a balance-due queue, not evidence of a submitted payment receipt or pending provider verification.
- Supplier queue: open purchase invoices with remaining balances. No overdue claim is made because the model has no invoice due-date field.

The historical selector controls only the chart. Financial cards retain their explicit all-time scope, while Today's orders is always today's count. Refresh runs every 60 seconds while the tab is visible and can be requested manually. Query failures show unavailable data rather than invented zero balances. CSV export is disabled until the required responses load.

## Boundaries

Owner, admin, finance and analyst roles may access this API; all other requests fail before database access. Responses contain aggregate figures only, use private/no-store caching, and have bounded chart ranges and database timeouts. No database writes, schema migrations, gateway configuration, checkout enabling or credential changes are included.

Existing profit is an estimate, not reconciled net profit. COD courier settlement remains unavailable because the application has no courier settlement ledger. Other all-time overview totals retain their pre-existing implementation; this change does not resolve all of its accounting or scalability limitations.

## Verification and launch

Tests cover Bangladesh date/year boundaries, missing days, refund chart scaling, authorization denial, range validation, no-store responses, empty databases, aggregate result mapping and database failures. CI additionally runs the aggregation pipeline against an isolated MongoDB 8 service with verified/reversed/refunded payments, cancelled/test/returned orders, stock reservations and partial purchase receipts. The integration suite rejects any URI except its dedicated loopback endpoint, creates a unique temporary database, and cleans up only that database. It is skipped locally unless DASHBOARD_TEST_MONGODB_URI is explicitly set.

Before relying on production reporting, configure MONGODB_URI and SESSION_SECRET securely, initialize the owner account using the existing owner:create workflow, and reconcile fixtures including partial payments, refunds, reversals, test orders and partial purchase receipts against an authorized database. Keep STORE_MODE=catalog until the checkout launch checklist passes. Never commit credentials or share them in chat.
