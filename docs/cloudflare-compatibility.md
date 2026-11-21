# Cloudflare hosting recovery and compatibility

## Current hosted state — 19 November 2026 (Asia/Dhaka)

The catalogue is publicly reachable at https://anusmita-store.mdsakibmolla545.workers.dev/shop.
This is catalogue recovery, not a completed production migration. `STORE_MODE=catalog`
and `RECOVERY_CATALOG_ONLY=true` are enabled. No production MongoDB, session,
R2 upload or provider secrets are attached. The page displays an explicit warning.
The legacy catalogue is shown until the production database is securely configured;
its stock, availability and prices must be confirmed with the store.

The existing Netlify deployment and `anusmita-media` Worker/bucket are unchanged.
Production DNS was not changed. Netlify credentials remain inaccessible through its
masked connector response; the signed-in account session is needed to configure
credentials securely. Never commit credentials or send them in chat.

### Runtime and assets

`workers/app/index.ts` routes static requests to the `anusmita-store-assets` service
binding and wraps application requests in an isolated Mongoose context. Cloudflare-only
Vite transforms select request-owned models/connections and transaction sessions;
stream completion/cancellation closes connections. Normal Next/Netlify source keeps
its existing connection behaviour. Hosted MongoDB transaction compatibility remains
unverified, despite passing local request-scope unit tests.

Native Workers Static Assets upload returned an authorization error in this session.
The recovery asset service embeds generated JS/CSS and serves allowlisted public
files from an immutable GitHub commit with edge caching. This adds Worker requests
and an external origin for cold public assets. It is a temporary fallback, with no
claim of production traffic/CPU capacity. `scripts/package-store-assets.mjs` packages
both services after `npm run build:cloudflare`; generated transfer files are ignored.
Use `ASSET_SOURCE_REF` to select the exact 40-character source commit for public files.
Upload packaged modules through an authorized Cloudflare API/CLI; never include secrets
in the package. Keep asset versions referenced by an active app deployment available
when replacing the service. Prefer native static assets once authorization is fixed.

### Reviews

Shop cards now aggregate approved, consented, customer-submitted, purchase-verified
reviews for just the displayed product IDs. Missing review data is labelled honestly;
review lookup failures do not hide products. A read-only production check found zero
`productreviews` records. The legacy catalogue has no verified review linkage and says
so; this release does not create customer reviews or fabricated stars/counts.

### Browser observations

The deployed shop renders styling and images. JS/CSS assets return 200, and category
navigation works. No login, checkout, upload, payment, courier or webhook acceptance
is claimed. Complete the gates below before enabling live checkout or moving DNS.

---

## Earlier preparation evidence (historical; current state above supersedes it)


Target: `anusmita-compat-test` on account subdomain `mdsakibmolla545`.
Baseline: main `097887c693de9f8afcc999d18956d06b7f389750`.
No production route, DNS, database, R2 binding, or media Worker changes are included.

## Repeatable build

Use Node 22 or newer and `npm ci`.

```
npm run check:cloudflare
npm run typecheck
npm test
npm run build
npm run build:cloudflare
```

`build:cloudflare` builds the Workers runtime and runs the deployment dry-run.
It does not upload or publish. The existing Next.js/Netlify build scripts remain available.
The Workers target uses vinext 1.4.6, cf 1.0.0-rc.1, and the matching Cloudflare
Vite plugin 2.0.0-rc.1. The initializer's stable plugin was incompatible with cf;
the beta plugin was also incompatible with Build Output v1. Versions are pinned.
React/RSC are aligned at 19.3.1; Vitest 4 supports the Vite 8 toolchain.
These dependency changes need CI and preview review before merging.

## Evidence and limitations (2026-11-18)

- Compatibility scan: 70 pages, 106 route handlers, six Next imports supported;
  App Router React strict-mode handling is only partially supported by vinext.
- Unit tests: 335 passed, five database integration tests skipped without an
  isolated Mongo replica set. Skips are not evidence of database compatibility.
- Workers packaging dry-run passed: 358 static assets; initial package 7501.43 KiB
  uncompressed, 2182.78 KiB gzip. Package sizes can change after configuration edits.
- Local `cf auth whoami` reported unauthenticated. The Cloudflare connector can
  inspect the account but does not provide a CLI credential.
- Netlify returns masked secret values, not usable database/session/provider keys.
- The full application has not been remotely deployed or acceptance-tested. A separate runtime probe was subsequently deployed; see below.
- Next.js production build passed on retry. Its first run emitted a security
  upgrade warning for the existing Next 16.4.2 version; this PR does not resolve
  that warning or assert that the framework has no advisories.
- Final TypeScript check passed after the wrapped Cloudflare build. The wrapper
  restores generated Next type files overwritten by vinext to avoid target-switch
  type errors.
- Local Workers preview startup was attempted but blocked by this host's
  `os.networkInterfaces()` / `uv_interface_addresses` system error. No local HTTP
  acceptance result is claimed.

## Required isolation before functional acceptance

1. Authorize the local deployment CLI to the intended account using Cloudflare's
   login flow or a scoped CI deployment secret. Never paste credentials into chat.
2. Provision a separate test database and database user with no production write
   permissions. Current `dedicatedDb()` intentionally accepts only the production
   Portfolio/anusmita scoped connection; do not weaken it or simply reuse the
   production URI to get tests passing. A reviewed test-only connection policy is
   required before seeding fixtures or creating orders/users.
3. Replace the global Mongoose connection cache for Workers: ordinary Workers
   cannot reuse I/O across requests. Use request-scoped connections with correct
   cleanup or a reviewed Durable Object design, and test concurrent transactions.
   The existing Node/Netlify connection behaviour must remain intact.
4. Use an isolated R2 bucket/media Worker and test-only upload secret. The app's
   current media URL allowlist also requires a reviewed test endpoint change.
   Do not attach `anusmita-media` to this target.
5. Supply a new session signing secret and synthetic owner account. Use payment,
   courier and messaging sandboxes only; do not copy live outbound tokens.
6. Keep the test site out of search indexing and gate access before enabling
   fixtures or sandbox integrations. The default target remains catalog mode.

The current no-database target will fail closed at the storefront maintenance
check. A successful build or returned URL must not be called a working store.

## Remote acceptance gates

| Area | Required evidence | Current status |
| --- | --- | --- |
| MongoDB | Read/write/delete synthetic fixtures, transaction rollback, sequential and concurrent requests without cross-request I/O errors | Not tested |
| Login | Real fixture password validation, secure cookie, refresh persistence, expiry, logout, RBAC denial | Not tested |
| Checkout | Synthetic order, stock reservation, duplicate request handling, failed-payment rollback, no real charge or courier dispatch | Not tested |
| Upload | Isolated R2 upload, image signature validation, save/publish/refresh, denied unauthenticated upload | Not tested |
| Webhooks | Signed sandbox event, rejected bad signature, replay deduplication, no live notifications | Not tested |
| Middleware | Maintenance on/off, owner bypass, same-origin internal fetch, no recursion, fail-closed response | Not tested remotely |
| Free limits | Cold/warm and concurrent CPU duration, memory, subrequests, startup, errors; distinguish CPU from network wall time | Not measured |
| Scheduled jobs | Replace and verify Netlify scheduled publishing before any migration | Not implemented |

Do not migrate production until these gates pass. Keep Netlify and the existing
R2 Worker unchanged throughout testing.

References:
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/
- https://developers.cloudflare.com/workers/platform/limits/

## Separate hosted runtime probe (2026-11-19 Asia/Dhaka)

`anusmita-runtime-probe.mdsakibmolla545.workers.dev` is a diagnostic Worker,
not the application deployment. Source: `workers/compat-probe/index.mjs`.
It has no database, R2, payment, courier or messaging bindings. A fresh secret
protects POST probes; no passwords, hashes or JWTs are returned. Secrets are
not in source control. Uploaded via the connected Cloudflare API, avoiding
the unavailable local CLI login. Compatibility date uses UTC 2026-11-18.

Observed HTTP results: health 200; unauthorized probe 401; authorized Mongoose
loading 200 (8.24.10, connect function present); synthetic bcrypt cost-12
comparison and HS256 sign/verify 200 with both checks true. Worker upload
reported startup time 129 ms. CPU duration was not measured; wall-clock output
is not a CPU benchmark or proof of Free-plan suitability. No actual database
connection, user login/cookie flow, checkout, uploads or webhook was tested.
The account rejected custom CPU limits because it is on Free; no plan change
was made. Existing production media Worker was not changed.
