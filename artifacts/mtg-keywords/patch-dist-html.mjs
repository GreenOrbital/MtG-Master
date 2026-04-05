/**
 * Post-build script: patches dist/index.html to fix iOS Safari viewport shifting.
 * Replaces the default Expo viewport meta and injects PWA/iOS meta tags + CSS.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, "dist/index.html");

let html = readFileSync(htmlPath, "utf8");

// 1. Replace viewport to add viewport-fit=cover + interactive-widget
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />`
);

// 2. Inject iOS PWA meta + CSS fix right before </head>
const iosMeta = `
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <style id="viewport-fix">
    html {
      height: 100%;
      height: 100dvh;
    }
    body {
      /* Lock body so iOS Safari toolbar can't shift content */
      position: fixed;
      width: 100%;
      height: 100%;
      height: 100dvh;
      overflow: hidden;
      overscroll-behavior: none;
    }
    #root {
      display: flex;
      height: 100%;
      height: 100dvh;
      flex: 1;
      overflow: hidden;
    }
  </style>`;

html = html.replace("</head>", `${iosMeta}\n</head>`);

// 3. Remove duplicate expo-reset height/overflow rules that conflict
html = html.replace(
  /<style id="expo-reset">[\s\S]*?<\/style>/,
  `<style id="expo-reset">/* overridden by viewport-fix */</style>`
);

writeFileSync(htmlPath, html, "utf8");
console.log("✓ dist/index.html patched for iOS viewport fix");
