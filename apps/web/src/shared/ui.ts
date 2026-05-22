import type { CSSProperties } from "react";

// All color tokens reference CSS variables defined in index.css. Toggling
// the `data-theme` attribute on <html> swaps every consumer in one frame.
export const colors = {
  bg: "var(--c-bg)",
  bg2: "var(--c-bg2)",
  card: "var(--c-card)",
  cardBorder: "var(--c-card-border)",
  text: "var(--c-text)",
  muted: "var(--c-muted)",
  accent: "var(--c-accent)",
  accentHover: "var(--c-accent-hover)",
  err: "var(--c-err)",
  inputBg: "var(--c-input-bg)",
  buttonFg: "var(--c-button-fg)",
};

export const styles = {
  shell: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg2} 100%)`,
    color: colors.text,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  } as CSSProperties,
  page: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "2rem 1.5rem",
  } as CSSProperties,
  card: {
    background: colors.card,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: 12,
    padding: "1.5rem",
  } as CSSProperties,
  input: {
    width: "100%",
    padding: "0.6rem 0.8rem",
    borderRadius: 8,
    border: `1px solid ${colors.cardBorder}`,
    background: colors.inputBg,
    color: colors.text,
    fontSize: 14,
    outline: "none",
  } as CSSProperties,
  label: {
    display: "block",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
    marginTop: 12,
  } as CSSProperties,
  button: {
    background: colors.accent,
    color: colors.buttonFg,
    border: "none",
    padding: "0.6rem 1rem",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  } as CSSProperties,
  buttonGhost: {
    background: "transparent",
    color: colors.text,
    border: `1px solid ${colors.cardBorder}`,
    padding: "0.4rem 0.8rem",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  } as CSSProperties,
  err: { color: colors.err, fontSize: 13, marginTop: 8 } as CSSProperties,
  muted: { color: colors.muted } as CSSProperties,
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    borderBottom: `1px solid ${colors.cardBorder}`,
  } as CSSProperties,
};
