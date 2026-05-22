import { styles } from "@/shared/ui";

import { useThemeStore } from "./store";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const isLight = theme === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Dark mode" : "Light mode"}
      style={{ ...styles.buttonGhost, padding: "0.4rem 0.6rem" }}
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  );
}
