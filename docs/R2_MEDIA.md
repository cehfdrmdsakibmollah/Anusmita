# ANUSMITA R2 media

The `anusmita-media` R2 bucket uses Standard storage in APAC. R2 public development access is disabled. The `anusmita-media` Worker binds the bucket as `MEDIA` and publishes only validated `public/products/<product-id>/<uuid>.(jpg|png|webp)` image paths.

Production endpoint: https://anusmita-media.mdsakibmolla545.workers.dev

The Worker `UPLOAD_SECRET` and Netlify production function variable `R2_MEDIA_SECRET` must match. `R2_MEDIA_URL` is the endpoint above. Never put the secret in source code or a NEXT_PUBLIC variable. Preview deploys have no production R2 secret.

## Dashboard

Admin → R2 Images → select an existing product → upload a JPEG, PNG or WebP up to 3 MB. Images are public storefront photography. Owner, admin and inventory roles may upload. The existing daily media quota applies across Cloudinary and R2. Gallery updates require the loaded revision and an audit entry in the same MongoDB transaction. Failed attachment attempts remove the newly uploaded object. Gallery unlink preserves the source image.

R2 does not replace MongoDB or authentication. MONGODB_URI, SESSION_SECRET and a working owner account are required before the dashboard can save a product. Cloudinary remains available independently.

## Deployment

Worker source: workers/r2-media/index.mjs. Wrangler configuration: workers/r2-media/wrangler.jsonc. Configure UPLOAD_SECRET as a Worker secret before activating uploads. Changing Worker code is a separate deployment from the Netlify/GitHub deployment; preserve the secret binding on each update.

## Validation

Worker tests cover unauthenticated writes, private-path reads, MIME mismatch, oversized files, conditional writes, cache headers and health authorization. Smoke-test with a generated disposable image and remove only that exact test key afterwards. Authenticated dashboard/product CRUD validation additionally requires the database and owner account.

## Netlify production environment activation

The live Netlify function requires both `R2_MEDIA_SECRET` (secret) and `R2_MEDIA_URL=https://anusmita-media.mdsakibmolla545.workers.dev/` (production). Changes to Netlify variables require a **fresh production deploy**, not merely refreshing the admin tab. The Worker `UPLOAD_SECRET` must match the Netlify secret. Never log or commit either secret. Confirm `/api/admin/r2` readiness while signed in, and upload a legitimate product image only after readiness succeeds.

## Funnel campaign image uploads

Funnel Builder uses authenticated `/api/admin/funnel-pages/media` (GET health, POST multipart image upload) to upload public images as `public/funnel/<safe-campaign-slug>/<uuid>.(jpg|png|webp)`. The Cloudflare Worker must allow exactly this namespace in its `KEY` and, when listing images, its asset prefix validator. Only the existing server-side `R2_MEDIA_SECRET` can write, delete or list assets; public GET/HEAD is limited to validated public image keys. Media uploads remain under the 3 MB limit and authenticated daily quota.

**Preview environment:** Netlify preview deployments do not have the production `R2_MEDIA_SECRET` by design. An authenticated GET to `/api/admin/funnel-pages/media` will report a clear 503 if R2 credentials are absent. Never place production upload secrets in `NEXT_PUBLIC_*` or expose them to client-side code. Configure a separate preview-only R2 Worker/bucket and preview-scoped secret only if isolated preview uploads are required; do not connect previews to the production R2 secret casually.

**Release order:** (1) Run the Worker unit tests and deploy the updated `workers/r2-media/index.mjs` with its existing `MEDIA` R2 binding and `UPLOAD_SECRET` preserved; (2) verify an authenticated server-side health check; (3) deploy the latest `main` Netlify build with production `R2_MEDIA_URL` and matching `R2_MEDIA_SECRET`; (4) as an authorized owner/admin, upload a disposable, valid 1x1 image, verify a 201 response and public GET, then unlink only that test image and remove its exact test key. Do not use real customer/product media for smoke tests. Production Netlify account credit exhaustion can prevent (3) even when GitHub CI and deploy previews pass.
