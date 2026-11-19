import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "anusmita-store",
    entrypoint: "./workers/app/index.ts",
    compatibilityDate: "2026-11-18",
    env: {
      ASSETS: bindings.worker({worker:"anusmita-store-assets"}),
      // Recovery remains catalogue-only until production secrets and acceptance tests pass.
      STORE_MODE: bindings.text("catalog"),
      RECOVERY_CATALOG_ONLY: bindings.text("true"),
      NEXT_PUBLIC_SITE_URL: bindings.text("https://anusmita-store.mdsakibmolla545.workers.dev"),
    },
  }),
});
