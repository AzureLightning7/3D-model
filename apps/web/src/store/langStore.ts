import { create } from "zustand";
import { persist } from "zustand/middleware";

type Lang = "zh" | "en";

// Source of truth for the initial language is VITE_DEFAULT_LOCALE (e.g. "zh-CN").
// Falls back to "en" when unset so non-docker local dev keeps English. Once a
// user toggles, their choice is persisted and this default no longer applies.
const DEFAULT_LANG: Lang = ((import.meta.env.VITE_DEFAULT_LOCALE as string | undefined) ?? "")
  .toLowerCase()
  .startsWith("zh")
  ? "zh"
  : "en";

type LangStore = {
  lang: Lang;
  toggle: () => void;
  setLang: (l: Lang) => void;
};

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: DEFAULT_LANG,
      toggle: () => set((s) => ({ lang: s.lang === "en" ? "zh" : "en" })),
      setLang: (lang) => set({ lang }),
    }),
    { name: "dormvibe-lang" },
  ),
);

