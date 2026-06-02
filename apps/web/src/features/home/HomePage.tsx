import { useEffect, useState } from "react";

import { useLangStore } from "@/store/langStore";

import { FinalCTASection } from "./components/FinalCTASection";
import { HomeFooter } from "./components/HomeFooter";
import { HomeNavbar } from "./components/HomeNavbar";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { HeroSection } from "./components/HeroSection";
import { ProblemSection } from "./components/ProblemSection";

type ScrollSectionId = "how-it-works" | "problem";

export function HomePage() {
  const lang = useLangStore((s) => s.lang);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  function scrollTo(id: ScrollSectionId) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="dvHome">
      <style>
        {`
          .dvHome { background: #0A0A0A; color: var(--c-text); }
          .dvWrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
          .dvWrapWide { max-width: 1240px; margin: 0 auto; padding: 0 24px; }

          .dvBtnPrimary { background: var(--c-accent); color: var(--c-button-fg); border: none; border-radius: 12px; padding: 14px 28px; font-weight: 900; font-size: 15px; text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 10px; transition: opacity 150ms; }
          .dvBtnPrimary:hover { opacity: 0.88; }
          .dvBtnGhost { background: transparent; border: 1px solid var(--c-card-border); color: var(--c-text); border-radius: 12px; padding: 14px 28px; font-weight: 800; font-size: 15px; text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 10px; transition: border-color 150ms; }
          .dvBtnGhost:hover { border-color: var(--c-muted); }
          .dvBtnSoft { background: rgba(45,212,191,0.10); border: 1px solid rgba(45,212,191,0.30); color: #2DD4BF; border-radius: 999px; padding: 8px 14px; font-weight: 900; font-size: 12px; text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: background 150ms; }
          .dvBtnSoft:hover { background: rgba(45,212,191,0.16); }

          .dvPill { background: rgba(45,212,191,0.08); border: 1px solid rgba(45,212,191,0.30); color: #2DD4BF; border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 900; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 8px; }
          .dvH1 { margin: 0; font-weight: 950; line-height: 1.05; font-size: clamp(40px, 5.5vw, 72px); letter-spacing: -1.2px; }
          .dvH2 { margin: 0; font-weight: 950; line-height: 1.12; font-size: clamp(26px, 3.6vw, 42px); letter-spacing: -0.8px; }
          .dvLead { color: var(--c-muted); font-size: 17px; line-height: 1.7; max-width: 580px; }
          .dvKicker { color: #2DD4BF; font-size: 11px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }

          .dvSection { padding: 96px 0; }
          .dvSectionAlt { background: #111111; }
          .dvCard { background: var(--c-card); border: 1px solid var(--c-card-border); border-radius: 18px; }
          .dvCardSoft { background: rgba(24,24,27,0.85); border: 1px solid rgba(63,63,70,0.9); border-radius: 18px; }

          .dvGrid2 { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; }
          .dvGrid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }

          .dvDivider { height: 1px; background: rgba(63,63,70,0.6); margin: 20px 0; }
          .dvToast { position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%); background: var(--c-card); border: 1px solid var(--c-card-border); color: var(--c-text); padding: 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 900; z-index: 200; box-shadow: 0 18px 80px rgba(0,0,0,0.55); }

          @media (max-width: 980px) { .dvGrid2 { grid-template-columns: 1fr; gap: 32px; } }
          @media (max-width: 820px) { .dvGrid3 { grid-template-columns: 1fr; } }
          @media (max-width: 560px) { .dvSection { padding: 72px 0; } .dvBtnPrimary, .dvBtnGhost { padding: 12px 20px; font-size: 14px; } }
        `}
      </style>

      <HomeNavbar lang={lang} scrollTo={scrollTo} />
      <HeroSection lang={lang} scrollTo={scrollTo} />
      <ProblemSection lang={lang} />
      <HowItWorksSection lang={lang} />
      <FinalCTASection lang={lang} />
      <HomeFooter lang={lang} scrollTo={scrollTo} />

      {toast && <div className="dvToast">{toast}</div>}
    </div>
  );
}

