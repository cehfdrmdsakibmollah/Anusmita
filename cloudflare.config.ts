import { bindings, defineConfig, defineWorker } from "cf/config";

// Explicit staging opt-in. Never change the production Worker through staging jobs.
const staging = process.env.ANUSMITA_STAGING === "true";
const workerName = staging ? "anusmita-store-staging" : "anusmita-store";
const siteUrl = staging
  ? "https://anusmita-store-staging.mdsakibmolla545.workers.dev"
  : "https://anusmita-store.mdsakibmolla545.workers.dev";

export default defineConfig({
  worker: defineWorker({
    name: workerName,
    entrypoint: "./workers/app/index.ts",
    compatibilityDate: "2026-11-18",
    env: {
      ASSETS: bindings.worker({worker:"anusmita-store-assets"}),
      AI: bindings.ai(),
      // The staging build exercises real application routes but cannot take COD orders.
      STORE_MODE: bindings.text("catalog"),
      RECOVERY_CATALOG_ONLY: bindings.text(staging ? "false" : "true"),
      ANUSMITA_STAGING_RUNTIME: bindings.text(staging ? "true" : "false"),
      NEXT_PUBLIC_SITE_URL: bindings.text(siteUrl),
    },
  }),
});
