# ANUSMITA — Netlify catalogue preview

## Created project
- Netlify team: `mdsakibmollah`
- Netlify site: `anusmita`
- Dashboard: https://app.netlify.com/projects/anusmita
- GitHub source: https://github.com/cehfdrmdsakibmollah/Anusmita (`main`, repository root).
- `netlify.toml` uses the built-in current Next.js runtime, Node 22 and `.next` publish output.

## Release discipline
1. Connect this site to the ANUSMITA GitHub repository from Netlify UI (**Netlify project → Link repository**, or site's import flow as applicable). Merely creating an empty site does NOT link GitHub or publish a deploy.
2. The site has been initialized with `STORE_MODE=catalog` and `NEXT_PUBLIC_SITE_URL=https://anusmita.netlify.app` in Netlify site variables; keep checkout disabled.
3. The homepage intentionally displays a catalogue configuration notice if `MONGODB_URI` is not configured. Database credentials must never be committed. Do not invent MongoDB passwords, Cloudinary secrets or customer stock.
4. Later, reset the scoped `anusmita_app` Atlas DB user's password privately and configure Netlify site `MONGODB_URI` (builds+functions scope) after reviewing Atlas Network Access. Use only the dedicated `anusmita.jvvjo1k.mongodb.net/anusmita` cluster. Never modify unrelated portfolio databases.
5. Generate a random 32+ byte `SESSION_SECRET` privately in Netlify site runtime env. A valid session secret alone does not enable checkout.
6. Run the one-time owner initialization securely in an authorized private execution environment, not public CI or anonymous routes. Validate admin login/role, purchase transactions and order rollback with a test dataset. Ensure Atlas connectivity and IP/network posture is approved; don't silently open `0.0.0.0/0`.
7. Keep `STORE_MODE=catalog` until legal/commercial, backups, authenticated Atlas integration tests and payment/courier flows are verified. Do not switch to `live` based solely on a green build.
8. Set DNS via Cloudflare only after Netlify deploy succeeds, a custom domain is owned, and DNS/cert setup is tested. Avoid an unnecessary second Workers hosting deployment.

## Secret safety
- Netlify web env vars (not `netlify.toml`) are required for sensitive runtime settings.
- Do not use `NEXT_PUBLIC_` for secrets; client-side prefix is public.
- Env changes require a new deploy.
- Avoid build hooks or paid/add-on services until required.

## Netlify build configuration
- Base directory: repository root
- Build command: `npm run build`
- Publish directory: `.next` (Next.js runtime will auto-configure)
- Node: `22`
- Product image hosting: Cloudinary (R2 not required)

## What remains unverified
Netlify GitHub repo linkage and an actual Netlify deploy, MongoDB network access + password, initial owner, and full app SSR/API integration tests. These require separate verification. No customer checkout is allowed during preview.
