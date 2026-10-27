import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import process from "node:process";
import { resolvePagesBase } from "./scripts/pages-base";

const base = resolvePagesBase(
  process.env.GITHUB_REPOSITORY,
  process.env.PAGES_BASE_PATH,
);

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-maskable.png"],
      manifest: {
        name: "이세계 낙오자의 용병단",
        short_name: "낙오자의 용병단",
        lang: "ko",
        id: base,
        orientation: "landscape",
        description: "당신이 발견한 가능성으로 시작하는 용병단 이야기",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#131b19",
        theme_color: "#131b19",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
});
