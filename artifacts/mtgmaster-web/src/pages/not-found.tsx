import { useState } from "react";

const APP_URL = "https://app.mtgmaster.de";

export default function NotFound() {
  const [lang, setLang] = useState<"DE" | "EN">("DE");
  const t = (de: string, en: string) => (lang === "DE" ? de : en);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f0d0a] text-[#f3e9d2] font-sans px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c8a96e] rounded-full blur-[200px] opacity-[0.05] pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10">
        <div className="absolute top-0 right-0 flex items-center gap-2 font-cinzel text-xs tracking-wider">
          <button
            type="button"
            onClick={() => setLang("DE")}
            aria-pressed={lang === "DE"}
            className={`${
              lang === "DE"
                ? "text-[#e8c989] border-b border-[#e8c989]"
                : "text-[#f3e9d2]/50 hover:text-[#f3e9d2]"
            } transition-colors`}
          >
            DE
          </button>
          <span className="text-[#c8a96e]/40">|</span>
          <button
            type="button"
            onClick={() => setLang("EN")}
            aria-pressed={lang === "EN"}
            className={`${
              lang === "EN"
                ? "text-[#e8c989] border-b border-[#e8c989]"
                : "text-[#f3e9d2]/50 hover:text-[#f3e9d2]"
            } transition-colors`}
          >
            EN
          </button>
        </div>

        <div className="mb-8 flex justify-center">
          <span className="text-[#c8a96e] text-3xl animate-pulse">✦</span>
        </div>

        <h1 className="font-cinzel text-7xl md:text-8xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-[#fff7e6] via-[#e8c989] to-[#c8a96e]">
          404
        </h1>

        <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent mx-auto my-6" />

        <h2 className="font-cinzel text-xl md:text-2xl text-[#e8c989] tracking-wider mb-6">
          {t("Diese Seite existiert nicht.", "This page does not exist.")}
        </h2>

        <p className="font-inter text-[#f3e9d2]/70 leading-relaxed mb-12">
          {t(
            "Vielleicht hast du dich verlaufen oder die Karte wurde verbannt. Kehr zurück zum Codex.",
            "Perhaps you took a wrong turn, or the card has been exiled. Return to the codex.",
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={import.meta.env.BASE_URL}
            className="px-8 py-4 bg-gradient-to-b from-[#c8a96e] to-[#8a6e16] text-[#0f0d0a] font-cinzel font-bold text-sm tracking-widest uppercase hover:from-[#e8c989] hover:to-[#c8a96e] transition-all shadow-[0_0_20px_rgba(200,169,110,0.3)]"
          >
            {t("Zur Startseite", "Back to home")}
          </a>
          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 border border-[#c8a96e]/50 text-[#e8c989] font-cinzel text-sm tracking-widest uppercase hover:border-[#e8c989] hover:bg-[#c8a96e]/10 transition-all"
          >
            {t("App öffnen", "Open App")}
          </a>
        </div>
      </div>
    </div>
  );
}
