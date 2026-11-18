import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "anusmita-compat-test",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-18",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // This is an isolated compatibility target, never the production store.
      STORE_MODE: bindings.text("catalog"),
      NEXT_PUBLIC_SITE_URL: bindings.text("https://anusmita-compat-test.mdsakibmolla545.workers.dev"),
    },
  }),
});
