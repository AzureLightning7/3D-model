import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { api, ApiError } from "@/shared/api";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

import { useAuthStore } from "./store";

export function RegisterPage() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const lang = useLangStore((s) => s.lang);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const t = {
    title: lang === "zh" ? "创建账号" : "Create your account",
    subtitle: lang === "zh" ? "免费开始，无需信用卡" : "Start free, no credit card needed",
    name: lang === "zh" ? "姓名" : "Name",
    namePh: lang === "zh" ? "你的名字" : "Your name",
    email: lang === "zh" ? "邮箱" : "Email",
    password: lang === "zh" ? "密码" : "Password",
    passwordPh: lang === "zh" ? "至少 8 位" : "At least 8 characters",
    submit: lang === "zh" ? "注册" : "Create Account",
    hasAccount: lang === "zh" ? "已有账号？" : "Already have an account?",
    signIn: lang === "zh" ? "登录" : "Sign in",
    tryGuest: lang === "zh" ? "免注册直接体验" : "Try it — no sign-up needed",
  };

  const confirmLabel = lang === "zh" ? "确认密码" : "Confirm password";
  const mismatch = lang === "zh" ? "两次密码不一致" : "Passwords do not match";

  const strength = useMemo(() => {
    const rules = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];
    return rules.reduce((s, ok) => s + (ok ? 1 : 0), 0);
  }, [password]);

  const strengthColor = useMemo(() => {
    if (strength <= 1) return "#EF4444";
    if (strength === 2) return "#FBBF24";
    if (strength === 3) return "#F97316";
    return "#22C55E";
  }, [strength]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (confirmPassword !== password) {
      setError(mismatch);
      return;
    }
    setBusy(true);
    try {
      const r = await api.auth.register(email, password, displayName);
      setSession(r.user, r.tokens);
      nav("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onGuest() {
    setError(null);
    setBusy(true);
    try {
      const r = await api.auth.guest();
      setSession(r.user, r.tokens);
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", color: "var(--c-text)" }}>
      <style>
        {`
          .dvAuthGrid { min-height: 100vh; display: grid; grid-template-columns: 1.05fr 1fr; }
          .dvAuthBrand { padding: 48px 44px; background: linear-gradient(135deg, #0D9488, #0A0A0A); display: flex; flex-direction: column; justify-content: space-between; }
          .dvAuthBrandTitle { font-size: 36px; font-weight: 900; color: var(--c-text); letter-spacing: 0.2px; }
          .dvAuthBrandTag { margin-top: 8px; font-size: 16px; color: #2DD4BF; font-weight: 700; }
          .dvAuthBrandList { margin-top: 26px; display: grid; gap: 10px; color: var(--c-text); opacity: 0.8; font-size: 14px; }
          .dvAuthFormWrap { display: flex; align-items: center; justify-content: center; padding: 48px 40px; }
          .dvAuthForm { width: 100%; max-width: 380px; position: relative; }
          .dvAuthLang { position: absolute; right: 0; top: 0; border: 1px solid var(--c-card-border); background: var(--c-card); color: var(--c-text); border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .dvAuthTitle { margin: 0; padding-top: 6px; font-size: 28px; font-weight: 900; }
          .dvAuthSub { margin-top: 4px; color: var(--c-muted); font-size: 14px; }
          .dvField { margin-top: 12px; }
          .dvLabelRow { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
          .dvLabel { color: var(--c-muted); font-size: 12px; font-weight: 700; }
          .dvInput { width: 100%; border: 1px solid var(--c-card-border); background: var(--c-input-bg); color: var(--c-text); border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; }
          .dvInput:focus { border-color: var(--c-accent-hover); box-shadow: 0 0 0 3px rgba(45,212,191,0.15); }
          .dvPassWrap { position: relative; }
          .dvEye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--c-muted); cursor: pointer; font-size: 14px; padding: 6px; }
          .dvStrength { margin-top: 10px; display: grid; gap: 8px; }
          .dvStrengthBar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
          .dvStrengthSeg { height: 6px; border-radius: 999px; background: #27272A; border: 1px solid rgba(63,63,70,0.6); }
          .dvSubmit { margin-top: 16px; width: 100%; border: none; border-radius: 10px; background: var(--c-accent); color: var(--c-button-fg); padding: 12px 14px; font-size: 15px; font-weight: 900; cursor: pointer; }
          .dvSubmit:disabled { opacity: 0.7; cursor: not-allowed; }
          .dvBottom { margin-top: 14px; color: var(--c-muted); font-size: 13px; }
          .dvToast { position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%); background: var(--c-card); border: 1px solid var(--c-card-border); color: var(--c-text); padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 800; z-index: 200; box-shadow: 0 18px 80px rgba(0,0,0,0.55); }
          @media (max-width: 860px) { .dvAuthGrid { grid-template-columns: 1fr; } .dvAuthBrand { display: none; } .dvAuthFormWrap { padding: 36px 20px; } }
        `}
      </style>

      <div className="dvAuthGrid">
        <div className="dvAuthBrand">
          <div>
            <div className="dvAuthBrandTitle">DormVibe</div>
            <div className="dvAuthBrandTag">{lang === "zh" ? "让每个房间都属于你" : "Let every room belong to you"}</div>
            <div className="dvAuthBrandList">
              <div>✓ {lang === "zh" ? "AI生成个性化房间设计" : "AI-generated personalised room design"}</div>
              <div>✓ {lang === "zh" ? "360°全景预览" : "360° panoramic preview"}</div>
              <div>✓ {lang === "zh" ? "一键购买所有家具" : "One-click purchase all furniture"}</div>
            </div>
          </div>
          <div style={{ color: "var(--c-text)", opacity: 0.4, fontSize: 12 }}>DormVibe © 2026</div>
        </div>

        <div className="dvAuthFormWrap">
          <div className="dvAuthForm">
            <h1 className="dvAuthTitle">{t.title}</h1>
            <div className="dvAuthSub">{t.subtitle}</div>

            <form onSubmit={onSubmit} style={{ ...styles.card, background: "transparent", border: "none", padding: 0, marginTop: 16 }}>
              <div className="dvField">
                <div className="dvLabelRow">
                  <div className="dvLabel">{t.name}</div>
                </div>
                <input
                  className="dvInput"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                  placeholder={t.namePh}
                />
              </div>

              <div className="dvField">
                <div className="dvLabelRow">
                  <div className="dvLabel">{t.email}</div>
                </div>
                <input className="dvInput" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="dvField">
                <div className="dvLabelRow">
                  <div className="dvLabel">{t.password}</div>
                </div>
                <div className="dvPassWrap">
                  <input
                    className="dvInput"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    placeholder={t.passwordPh}
                  />
                  <button type="button" className="dvEye" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <div className="dvStrength">
                  <div className="dvStrengthBar" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="dvStrengthSeg"
                        style={{
                          background: strength >= i + 1 ? strengthColor : "#27272A",
                          borderColor: strength >= i + 1 ? strengthColor : "rgba(63,63,70,0.6)",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 700 }}>
                    {lang === "zh" ? "密码强度" : "Password strength"}:{" "}
                    <span style={{ color: strengthColor, fontWeight: 900 }}>
                      {strength <= 1 ? (lang === "zh" ? "弱" : "Weak") : strength === 2 ? (lang === "zh" ? "一般" : "Fair") : strength === 3 ? (lang === "zh" ? "良好" : "Good") : (lang === "zh" ? "强" : "Strong")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dvField">
                <div className="dvLabelRow">
                  <div className="dvLabel">{confirmLabel}</div>
                </div>
                <div className="dvPassWrap">
                  <input
                    className="dvInput"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="dvEye" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && <p style={{ ...styles.err, marginTop: 12 }}>{error}</p>}

              <button type="submit" className="dvSubmit" disabled={busy}>
                {busy ? "…" : t.submit}
              </button>
            </form>

            <button
              type="button"
              className="dvSubmit"
              onClick={onGuest}
              disabled={busy}
              style={{
                marginTop: 10,
                background: "transparent",
                color: "var(--c-accent)",
                border: "1px solid var(--c-accent)",
              }}
            >
              {busy ? "…" : t.tryGuest}
            </button>

            <div className="dvBottom">
              {t.hasAccount}{" "}
              <Link to="/login" style={{ color: "var(--c-accent)", textDecoration: "none", fontWeight: 900 }}>
                {t.signIn}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="dvToast">{toast}</div>}
    </div>
  );
}
