import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
      rollupOptions: {
        input: {
          main: resolve(__dirname, "electron/main.ts"),
        },
        external: [
          "electron",
          "electron-updater",
          "electron-store",
          "electron-log",
          "express",
          "os",
          "path",
          "fs",
          "child_process",
          "http",
          "net",
          "url",
          "uuid",
        ],
      },
    },
    resolve: {
      alias: {
        "@shared": resolve(__dirname, "packages/shared/src"),
      },
    },
  },
  preload: {
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: {
          preload: resolve(__dirname, "electron/preload.ts"),
        },
        external: ["electron"],
      },
    },
  },
  renderer: {
    root: "src",
    build: {
      outDir: "dist/renderer",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/index.html"),
        },
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@shared": resolve(__dirname, "packages/shared/src"),
        "@": resolve(__dirname, "src"),
      },
    },
  },
});
