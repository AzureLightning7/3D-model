import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Fingerprint, LayoutDashboard, LogOut, RefreshCw, Settings } from "lucide-react";

import { useAuthStore } from "@/features/auth/store";
import { useProfileStore } from "@/features/survey/store";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

export function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clear);
  const clearProfile = useProfileStore((s) => s.setProfileId);
  const lang = useLangStore((s) => s.lang);
  const toggleLang = useLangStore((s) => s.toggle);
  const hideNav =
    loc.pathname.startsWith("/login") ||
    loc.pathname.startsWith("/register") ||
    loc.pathname === "/";
  const isEditor = loc.pathname.includes("/editor");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      const el = menuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const active = useMemo(() => {
    const p = loc.pathname;
    return {
      dashboard: p.startsWith("/dashboard"),
      roomDna: p.startsWith("/room-dna"),
      design: p.startsWith("/projects"),
      quiz: p.startsWith("/survey"),
    };
  }, [loc.pathname]);

  const avatarLetter = (user?.email?.[0] ?? "U").toUpperCase();

  function logout() {
    clearAuth();
    clearProfile(null);
    nav("/", { replace: true });
  }

  const navLinkBase = {
    color: "var(--c-muted)",
    fontSize: 14,
    padding: "4px 12px",
    borderRadius: 6,
    textDecoration: "none",
    fontWeight: 600,
  } as const;

  function navLinkStyle(isActive: boolean) {
    return {
      ...navLinkBase,
      color: isActive ? "var(--c-text)" : navLinkBase.color,
      background: isActive ? "#27272A" : "transparent",
    };
  }

  return (
    <div style={{ ...styles.shell, background: "#0A0A0A" }}>
      {!hideNav && !isEditor && (
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(10,10,10,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #27272A",
            padding: "0 32px",
            height: 60,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              to={user ? "/dashboard" : "/"}
              style={{ color: "#2DD4BF", textDecoration: "none", fontSize: 18, fontWeight: 900 }}
            >
              DormVibe
            </Link>
            {user && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Link to="/dashboard" style={navLinkStyle(active.dashboard)}>
                  Dashboard
                </Link>
                <Link to="/room-dna" style={navLinkStyle(active.roomDna)}>
                  Room DNA
                </Link>
                <Link to="/projects" style={navLinkStyle(active.design)}>
                  {lang === "zh" ? "我的设计" : "My Designs"}
                </Link>
                <Link to="/survey" style={navLinkStyle(active.quiz)}>
                  {lang === "zh" ? "风格测试" : "Quiz"}
                </Link>
              </div>
            )}
          </div>

          {!user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                style={{
                  background: "transparent",
                  color: "var(--c-text)",
                  border: "1px solid var(--c-card-border)",
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                style={{
                  background: "var(--c-accent)",
                  color: "var(--c-button-fg)",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    background: "linear-gradient(90deg, #2DD4BF, #A855F7)",
                    color: "var(--c-button-fg)",
                    fontWeight: 900,
                  }}
                  aria-label="Open user menu"
                >
                  {avatarLetter}
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 44,
                      background: "var(--c-card)",
                      border: "1px solid var(--c-card-border)",
                      borderRadius: 10,
                      padding: 6,
                      minWidth: 180,
                      boxShadow: "0 20px 80px rgba(0,0,0,0.55)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setToast("Coming Soon");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        color: "var(--c-text)",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#27272A")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                    >
                      <Settings size={14} strokeWidth={1.8} style={{ marginRight: 8 }} /> {lang === "zh" ? "设置" : "Settings"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        nav("/projects");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        color: "var(--c-text)",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#27272A")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                    >
                      <LayoutDashboard size={14} strokeWidth={1.8} style={{ marginRight: 8 }} /> {lang === "zh" ? "我的设计" : "My Designs"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        nav("/room-dna");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        color: "var(--c-text)",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#27272A")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                    >
                      <Fingerprint size={14} strokeWidth={1.8} style={{ marginRight: 8 }} /> Room DNA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        nav("/survey");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        color: "var(--c-text)",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#27272A")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                    >
                      <RefreshCw size={14} strokeWidth={1.8} style={{ marginRight: 8 }} /> {lang === "zh" ? "重新测试" : "Retake Quiz"}
                    </button>

                    <div style={{ height: 1, background: "var(--c-card-border)", margin: "6px 6px" }} />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        color: "var(--c-text)",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#27272A")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                    >
                      <LogOut size={14} strokeWidth={1.8} style={{ marginRight: 8 }} /> {lang === "zh" ? "退出登录" : "Log out"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {toast && (
            <div
              style={{
                position: "fixed",
                left: "50%",
                bottom: 26,
                transform: "translateX(-50%)",
                background: "var(--c-card)",
                border: "1px solid var(--c-card-border)",
                color: "var(--c-text)",
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                zIndex: 60,
                boxShadow: "0 18px 80px rgba(0,0,0,0.55)",
              }}
            >
              {toast}
            </div>
          )}
        </nav>
      )}
      <Outlet />
    </div>
  );
}
