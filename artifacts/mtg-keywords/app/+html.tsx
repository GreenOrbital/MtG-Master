import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* Fix iOS Safari dynamic toolbar shift – use dvh instead of 100vh */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style>{`
          html, body, #root {
            height: 100%;
            height: -webkit-fill-available;
          }
          body {
            min-height: 100vh;
            min-height: -webkit-fill-available;
            min-height: 100dvh;
            overscroll-behavior: none;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
