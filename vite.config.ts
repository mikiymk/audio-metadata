import { resolve } from "path";

import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "pages")
    return {
      build: {
        rollupOptions: {
          input: {
            id3v1: resolve(__dirname, "pages", "id3v1.html"),
            id3v2: resolve(__dirname, "pages", "id3v2.html"),
            ogg: resolve(__dirname, "pages", "ogg.html"),
            flac: resolve(__dirname, "pages", "flac.html"),
            wma: resolve(__dirname, "pages", "wma.html"),
            mp4: resolve(__dirname, "pages", "mp4.html"),
          },
        },

        outDir: "minpages",
      },
    };

  return {
    build: {
      lib: {
        entry: "src/index.ts",
        name: "AudioMetadata",
        formats: ["es", "cjs", "umd", "iife"],
      },

      outDir: "min",
    },
  };
});
