import { Link } from "wouter";
import type { ReactNode } from "react";

const APP_URL = "https://app.mtgmaster.de";
const LOGO = `${import.meta.env.BASE_URL}images/mtg-logo.png`;

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0d0a] text-[#f3e9d2] font-sans">
      <header className="border-b border-[#c8a96e]/20 bg-[#0a0806]/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src={LOGO} alt="MtG Master Logo" className="w-8 h-8 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="font-cinzel text-[#c8a96e] tracking-widest text-sm uppercase">
              MtG Master
            </span>
          </Link>
          <a
            href={APP_URL}
            className="font-cinzel text-xs tracking-widest text-[#c8a96e]/60 hover:text-[#e8c989] uppercase"
          >
            App öffnen
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-cinzel text-3xl md:text-4xl text-[#e8c989] tracking-wide mb-2">
          {title}
        </h1>
        <div className="h-px bg-gradient-to-r from-[#c8a96e]/40 to-transparent mb-10" />
        <div className="prose prose-invert max-w-none text-[#f3e9d2]/85 leading-relaxed text-[15px]
          [&_h2]:font-cinzel [&_h2]:text-[#e8c989] [&_h2]:text-xl [&_h2]:tracking-wide [&_h2]:mt-10 [&_h2]:mb-3
          [&_h3]:font-cinzel [&_h3]:text-[#c8a96e] [&_h3]:text-base [&_h3]:tracking-wide [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:my-3
          [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6
          [&_li]:my-1
          [&_a]:text-[#e8c989] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#f3e9d2]
          [&_strong]:text-[#e8c989]
        ">
          {children}
        </div>
      </main>

      <footer className="border-t border-[#c8a96e]/10 bg-[#0a0806] py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap gap-4 justify-between text-xs font-cinzel text-[#c8a96e]/40 tracking-widest uppercase">
          <span>© 2026 MtG Master</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:text-[#e8c989]">Impressum</Link>
            <span className="text-[#c8a96e]/20">|</span>
            <Link href="/datenschutz" className="hover:text-[#e8c989]">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
