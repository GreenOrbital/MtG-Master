import { Router, type IRouter } from "express";

const router: IRouter = Router();

const DACH_COUNTRIES = new Set(["DE", "AT", "CH", "LI"]);

function pickCountry(req: import("express").Request): string | null {
  const headerNames = [
    "cf-ipcountry",
    "x-vercel-ip-country",
    "x-country-code",
    "x-geo-country",
    "x-replit-user-country",
    "x-replit-country",
  ];
  for (const h of headerNames) {
    const v = req.headers[h];
    if (typeof v === "string" && v.trim().length === 2) {
      return v.trim().toUpperCase();
    }
  }
  return null;
}

function acceptLanguageIsGerman(req: import("express").Request): boolean {
  const al = (req.headers["accept-language"] ?? "").toString().toLowerCase();
  if (!al) return false;
  return /(^|[,\s])de(\b|[-_])/.test(al);
}

router.get("/geo-language", (req, res) => {
  const country = pickCountry(req);
  let language: "de" | "en";
  let source: "country" | "accept-language" | "default";

  if (country) {
    language = DACH_COUNTRIES.has(country) ? "de" : "en";
    source = "country";
  } else if (acceptLanguageIsGerman(req)) {
    language = "de";
    source = "accept-language";
  } else {
    language = "en";
    source = "default";
  }

  res.set("Cache-Control", "no-store");
  res.json({ language, country, source });
});

export default router;
