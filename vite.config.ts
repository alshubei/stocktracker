import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pkgPath = fileURLToPath(new URL("./package.json", import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
const appVersion =
  typeof pkg.version === "string" && pkg.version.length > 0
    ? pkg.version
    : "0.0.0";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});

