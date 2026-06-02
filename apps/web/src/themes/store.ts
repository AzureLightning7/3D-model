import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "dormvibe-default" | "dormvibe-light";

const DEFAULT_THEME: ThemeId =
  (import.meta.env.VITE_DEFAULT_THEME as ThemeId | undefined) ?? "dormvibe-default";

type ThemeState = {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,
      setTheme: (t) => set({ theme: t }),
      toggle: () =>
        set({ theme: get().theme === "dormvibe-light" ? "dormvibe-default" : "dormvibe-light" }),
    }),
    { name: "dormvibe.theme" },
  ),
);

// Subscribe to theme changes and reflect onto <html data-theme="…">.
// Runs once at module import.
if (typeof document !== "undefined") {
  const apply = (t: ThemeId) => {
    document.documentElement.dataset.theme = t;
  };
  apply(useThemeStore.getState().theme);
  useThemeStore.subscribe((s) => apply(s.theme));
}
