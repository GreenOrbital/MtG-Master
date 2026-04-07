/**
 * Post-build script: patches dist/index.html for iOS Safari viewport stability.
 * Tested against iPhone 17 Pro (iOS 18+) dynamic toolbar behavior.
 */
import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, "dist/index.html");

let html = readFileSync(htmlPath, "utf8");

// 1. Replace viewport meta — viewport-fit=cover for notch/Dynamic Island,
//    interactive-widget=resizes-content keeps layout stable when keyboard opens
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />`
);

// 2. Replace or remove Expo's expo-reset style block (we provide our own below)
html = html.replace(
  /<style id="expo-reset">[\s\S]*?<\/style>/,
  `<style id="expo-reset">/* replaced by viewport-fix */</style>`
);

// 3. Inject iOS PWA meta + stable-height CSS just before </head>
const inject = `
  <!-- iOS PWA: hide browser chrome when added to home screen -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <style id="viewport-fix">
    /*
     * -webkit-fill-available fills the visible viewport (excluding Safari toolbars)
     * on iOS without causing reflows when the toolbar shows/hides.
     * Using 100% (inherited) is the safest fallback; dvh would shift on toolbar animation.
     */
    html {
      height: 100%;
      /* iOS 15+ small viewport — never taller than visible area with toolbar shown */
      height: -webkit-fill-available;
    }
    body {
      margin: 0;
      height: 100%;
      height: -webkit-fill-available;
      overflow: hidden;
      /* Prevent iOS rubber-band bounce from shifting the layout */
      overscroll-behavior: none;
      -webkit-overflow-scrolling: auto;
    }
    #root {
      display: flex;
      flex: 1;
      height: 100%;
      height: -webkit-fill-available;
      overflow: hidden;
    }
  </style>`;

html = html.replace("</head>", `${inject}\n</head>`);

writeFileSync(htmlPath, html, "utf8");
console.log("✓ dist/index.html patched (iOS Safari viewport fix)");

// SPA routing fix: copy index.html as 404.html so static servers
// fall back to the SPA entry point for all unmatched routes.
const notFoundPath = resolve(__dirname, "dist/404.html");
copyFileSync(htmlPath, notFoundPath);
console.log("✓ dist/404.html created (SPA routing fallback)");
