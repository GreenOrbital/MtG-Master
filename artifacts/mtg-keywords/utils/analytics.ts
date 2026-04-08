import { Platform } from "react-native";

const GA_ID = "G-JN3SH0Y1VB";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function injectGAScript() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById("ga-script")) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag as (...args: unknown[]) => void;

  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    wait_for_update: 2000,
  });
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

export function grantAnalytics() {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.gtag) return;
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("config", GA_ID, { send_page_view: true });
  window.gtag("event", "page_view", { page_location: window.location.href });
}

export function denyAnalytics() {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.gtag) return;
  window.gtag("consent", "update", { analytics_storage: "denied" });
}
