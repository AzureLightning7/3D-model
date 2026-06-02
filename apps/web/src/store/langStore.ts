import { create } from "zustand";
import { persist } from "zustand/middleware";

type Lang = "zh" | "en";

type LangStore = {
  lang: Lang;
  toggle: () => void;
  setLang: (l: Lang) => void;
};

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: "en",
      toggle: () => set((s) => ({ lang: s.lang === "en" ? "zh" : "en" })),
      setLang: (lang) => set({ lang }),
    }),
    { name: "dormvibe-lang" },
  ),
);

