import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const repoBase = "/texture-genetics/";
const packageMetadata = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8")) as {
  version: string;
};

export default defineConfig({
  base: repoBase,

  plugins: [react(), tailwindcss()],

  define: {
    __APP_VERSION__: JSON.stringify(packageMetadata.version),
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  optimizeDeps: {
    entries: ["index.html"],
  },

  server: {
    port: 3000,
    open: true,
    strictPort: false,
  },

  preview: {
    port: 3000,
    strictPort: false,
  },

  build: {
    target: "es2022",
    sourcemap: false,
  },
});
