import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

import {cloudflareRuntime} from "./src/cloudflare/vite-runtime";
import {fileURLToPath} from "node:url";
export default defineConfig({
  resolve:{alias:[{find:/^mongoose$/,replacement:fileURLToPath(new URL("./node_modules/mongoose/index.js",import.meta.url))}]},
  plugins: [
    cloudflareRuntime(),
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
