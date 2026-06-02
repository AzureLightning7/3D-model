import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { useLangStore } from "@/store/langStore";

type Props = {
  lang: "zh" | "en";
  scrollTo: (id: "how-it-works" | "problem") => void;
};

export function HomeNavbar({ lang, scrollTo }: Props) {
  const [open, setOpen] = useState(false);
  const toggleLang = useLangStore((s) => s.toggle);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navItems: Array<{ id: "how-it-works" | "problem"; label: string }> = [
    { id: "problem", label: lang === "zh" ? "为什么选择我们" : "Why DormVibe" },
    { id: "how-it-works", label: lang === "zh" ? "如何使用" : "How It Works" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "rgba(10,10,10,0.86)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(39,39,42,0.9)",
      }}
    >
      <div className="dvWrapWide" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ color: "#2DD4BF", textDecoration: "none", fontSize: 18, fontWeight: 950, letterSpacing: "-0.3px" }}>
          DormVibe
        </Link>

        <nav aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="dvHomeNavDesktop" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {navItems.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => scrollTo(it.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--c-muted)",
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "8px 10px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--c-text)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--c-muted)")}
              >
                {it.label}
              </button>
            ))}
          </div>

          <div className="dvHomeNavDesktop" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={toggleLang}
              style={{
                background: "transparent",
                border: "1px solid var(--c-card-border)",
                color: "var(--c-muted)",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {lang === "zh" ? "EN" : "中文"}
            </button>
            <Link
              to="/login"
              className="dvBtnGhost"
              style={{ padding: "10px 14px", borderRadius: 999, fontSize: 13, fontWeight: 900 }}
            >
              {lang === "zh" ? "登录" : "Login"}
            </Link>
            <Link
              to="/register"
              className="dvBtnPrimary"
              style={{ padding: "10px 14px", borderRadius: 999, fontSize: 13, fontWeight: 950 }}
            >
              {lang === "zh" ? "开始设计" : "Start Designing"}
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="dvHomeNavMobileBtn"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid var(--c-card-border)",
              background: "rgba(24,24,27,0.6)",
              color: "var(--c-text)",
              cursor: "pointer",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {open ? <X size={18} strokeWidth={2.5} /> : <Menu size={18} strokeWidth={2} />}
          </button>
        </nav>
      </div>

      <style>
        {`
          @media (max-width: 860px) { .dvHomeNavDesktop { display: none !important; } .dvHomeNavMobileBtn { display: inline-flex !important; } }
        `}
      </style>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(10px)",
            zIndex: 80,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="dvWrapWide"
            style={{
              paddingTop: 18,
              paddingBottom: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dvCard" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 950, color: "var(--c-text)" }}>{lang === "zh" ? "导航" : "Menu"}</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    border: "1px solid var(--c-card-border)",
                    background: "transparent",
                    color: "var(--c-text)",
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <button
                  type="button"
                  onClick={toggleLang}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--c-card-border)",
                    color: "var(--c-muted)",
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {lang === "zh" ? "EN" : "中文"}
                </button>
                {navItems.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      scrollTo(it.id);
                    }}
                    style={{
                      textAlign: "left",
                      border: "1px solid rgba(63,63,70,0.8)",
                      background: "rgba(24,24,27,0.5)",
                      borderRadius: 14,
                      padding: "12px 12px",
                      color: "var(--c-text)",
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {it.label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <Link to="/register" className="dvBtnPrimary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setOpen(false)}>
                  {lang === "zh" ? "开始设计（免费）" : "Start Designing Free"}
                </Link>
                <Link to="/login" className="dvBtnGhost" style={{ width: "100%", justifyContent: "center" }} onClick={() => setOpen(false)}>
                  {lang === "zh" ? "登录" : "Login"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

