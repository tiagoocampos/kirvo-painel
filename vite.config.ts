import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Manifest estático: diferente do storefront, o painel é sempre o mesmo
    // app (identidade do KirvoAgenda), não personalizado por tenant. Mas,
    // diferente do que a primeira versão deste setup assumia, push notification
    // exige listeners de "push"/"notificationclick" num service worker próprio
    // — o generateSW automático do plugin não permite injetar isso, por isso
    // injectManifest com src/sw.ts (mesmo padrão do storefront).
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      // Por padrão o plugin só registra o service worker em build de produção
      // (vite build/preview) — sem isso, `npm run dev` nunca tem SW ativo, e
      // toda a parte de push (que depende de `navigator.serviceWorker.ready`)
      // falha silenciosamente/trava em dev.
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "Painel KirvoAgenda",
        short_name: "KirvoAgenda",
        description: "Painel administrativo do KirvoAgenda — agenda, serviços e clientes da sua barbearia.",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
