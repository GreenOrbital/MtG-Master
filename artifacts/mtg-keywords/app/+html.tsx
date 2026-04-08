import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover fixes iOS Safari safe-area; interactive-widget prevents resize on keyboard */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        {/* PWA fullscreen on iOS – prevents address-bar bounce */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style>{`
          html, body {
            height: 100%;
            height: 100dvh;
            overflow: hidden;
            /* Prevent iOS Safari overscroll bounce shifting the layout */
            overscroll-behavior: none;
            -webkit-overflow-scrolling: auto;
            position: fixed;
            width: 100%;
          }
          #root {
            display: flex;
            height: 100%;
            height: 100dvh;
            flex: 1;
            overflow: hidden;
          }
        `}</style>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JN3SH0Y1VB" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JN3SH0Y1VB');`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
