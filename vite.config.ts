import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // The archived E1 dist can remain open in an Owner browser on Windows.
    // V0 owns a separate disposable build output instead of mutating that specimen.
    outDir: "dist-v0",
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
});
