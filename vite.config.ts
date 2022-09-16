import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "AudioMetadata",
      formats: ["es", "cjs", "umd", "iife"],
    },
    outDir: "min"
  },
});
