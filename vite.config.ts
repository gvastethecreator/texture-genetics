import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],

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
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three")) return "three";
            if (id.includes("@react-three")) return "react-three";
            if (id.includes("react") || id.includes("react-dom")) return "vendor";
            return "vendor-other";
          }
        },
      },
    },
  },
});
