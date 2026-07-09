import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

// Plugin para versionar o Service Worker
function vitePluginServiceWorkerVersioning(): Plugin {
  return {
    name: "vite-plugin-sw-versioning",
    apply: "build",
    async generateBundle(_, bundle) {
      const buildTimestamp = Date.now();

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (fileName === "sw.js" && asset.type === "asset") {
          let code = asset.source.toString();
          code = code.replace(
            "{{BUILD_TIMESTAMP}}",
            buildTimestamp.toString()
          );
          asset.source = code;
        }
      }
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginServiceWorkerVersioning(),
];

export default defineConfig({
  base: "/osbrothersapp/",
  plugins,

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    host: "0.0.0.0",

    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
    },

    allowedHosts: [
      "localhost",
      "127.0.0.1",
    ],

    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
