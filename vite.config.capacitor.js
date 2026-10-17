import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: false,
  build: {
    outDir: "www",
    emptyOutDir: true,
    rollupOptions: {
      input: "index.html"
    }
  }
});
