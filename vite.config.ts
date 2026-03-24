import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  server: {
    port: 3000,
    open: true,
    strictPort: false,
  },

  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'three';
            if (id.includes('@react-three')) return 'react-three';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor';
            return 'vendor-other';
          }
        },
      },
    },
  },
});
