import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { api, ApiError } from "@/shared/api";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

import { useAuthStore } from "./store";

export function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const lang = useLangStore((s) => s.lang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const t = useMemo(
    () => ({
      welcome: lang === "zh" ? "欢迎回来" : "Welcome back",
      welcomeSub: lang === "zh" ? "登录 DormVibe 继续设计你的房间。" : "Sign in to continue designing with DormVibe.",
      socialWechat: lang === "zh" ? "WeChat 微信登录" : "WeChat login",
      socialGoogle: lang === "zh" ? "Google 继续" : "Continue with Google",
      divider: lang === "zh" ? "─── 或使用邮箱登录 ───" : "─── Or sign in with email ───",
      email: lang === "zh" ? "邮箱 / Email" : "Email",
      password: lang === "zh" ? "密码 / Password" : "Password",
      forgot: lang === "zh" ? "忘记密码？" : "Forgot password?",
      submit: lang === "zh" ? "登录 / Sign in" : "Sign in",
      noAccount: lang === "zh" ? "还没有账号？" : "Don't have an account?",
      register: lang === "zh" ? "立即注册 / Register" : "Register",
      comingSoon: lang === "zh" ? "敬请期待" : "Coming Soon",
      tryGuest: lang === "zh" ? "免注册直接体验" : "Try it — no sign-up needed",
    }),
    [lang],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api.auth.login(email, password);
      setSession(r.user, r.tokens);
      const from = (location.state as { from?: string })?.from ?? "/dashboard";
      nav(from, { replace: true });
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
      const from = (location.state as { from?: string })?.from ?? "/dashboard";
      nav(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    const from = (location.state as { from?: string })?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", color: "var(--c-text)" }}>
      <style>
        {`
          .dvAuthGrid { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--c-bg); padding: 24px; }
          .dvAuthFormWrap { width: 100%; max-width: 420px; }
          .dvAuthForm { width: 100%; background: var(--c-card); border: 1px solid var(--c-card-border); border-radius: 20px; padding: 36px 32px; position: relative; }
          .dvAuthLang { border: 1px solid var(--c-card-border); background: var(--c-card); color: var(--c-text); border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .dvAuthTitle { margin: 0; font-size: 32px; font-weight: 900; margin-bottom: 4px; }
          .dvAuthSub { margin-top: 4px; color: var(--c-muted); font-size: 14px; }
          .dvAuthSocialRow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 28px; }
          .dvAuthBtn { width: 100%; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
          .dvAuthDivider { margin: 20px 0; text-align: center; color: var(--c-muted); font-size: 12px; }
          .dvField { margin-top: 12px; }
          .dvLabelRow { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
          .dvLabel { color: var(--c-muted); font-size: 12px; font-weight: 700; }
          .dvLink { color: var(--c-accent); text-decoration: none; font-size: 12px; font-weight: 800; cursor: pointer; background: transparent; border: none; padding: 0; }
          .dvInput { width: 100%; border: 1px solid var(--c-card-border); background: var(--c-input-bg); color: var(--c-text); border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; }
          .dvInput:focus { border-color: var(--c-accent-hover); box-shadow: 0 0 0 3px rgba(45,212,191,0.15); }
          .dvPassWrap { position: relative; }
          .dvEye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--c-muted); cursor: pointer; font-size: 14px; padding: 6px; }
          .dvSubmit { margin-top: 16px; width: 100%; border: none; border-radius: 10px; background: var(--c-accent); color: var(--c-button-fg); padding: 12px 14px; font-size: 15px; font-weight: 900; cursor: pointer; }
          .dvSubmit:disabled { opacity: 0.7; cursor: not-allowed; }
          .dvBottom { margin-top: 14px; color: var(--c-muted); font-size: 13px; }
          .dvToast { position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%); background: var(--c-card); border: 1px solid var(--c-card-border); color: var(--c-text); padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 800; z-index: 200; box-shadow: 0 18px 80px rgba(0,0,0,0.55); }
        `}
      </style>

      <div className="dvAuthGrid">
        <div className="dvAuthFormWrap">
          <div style={{ position: "relative", width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <Link
                to="/"
                style={{ color: "#2DD4BF", fontSize: 24, fontWeight: 900, textDecoration: "none", letterSpacing: "-0.5px" }}
              >
                DormVibe
              </Link>
            </div>

            <div className="dvAuthForm">
              <h1 className="dvAuthTitle">{t.welcome}</h1>
              <div className="dvAuthSub" style={{ marginTop: 6 }}>
                {t.welcomeSub}
              </div>

              <div style={{ marginTop: 24, marginBottom: 8 }}>
                <div
                  style={{
                    border: "1px dashed var(--c-card-border)",
                    borderRadius: 12,
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: "var(--c-muted)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 1,
                      marginBottom: 10,
                    }}
                  >
                    {lang === "zh" ? "社交登录（即将推出）" : "SOCIAL LOGIN (COMING SOON)"}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <div
                      style={{
                        border: "1px solid #07C160",
                        color: "#07C160",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 13,
                        opacity: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      💬 WeChat
                    </div>
                    <div
                      style={{
                        border: "1px solid var(--c-card-border)",
                        color: "var(--c-muted)",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 13,
                        opacity: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      G Google
                    </div>
                  </div>
                </div>
              </div>

              <div className="dvAuthDivider">{t.divider}</div>

              <form onSubmit={onSubmit} style={{ ...styles.card, background: "transparent", border: "none", padding: 0 }}>
                <div className="dvField">
                  <div className="dvLabelRow">
                    <div className="dvLabel">{t.email}</div>
                  </div>
                  <input
                    className="dvInput"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="dvField">
                  <div className="dvLabelRow">
                    <div className="dvLabel">{t.password}</div>
                    <button
                      type="button"
                      className="dvLink"
                      onClick={() => setToast(t.comingSoon)}
                      style={{ color: "var(--c-accent)", background: "transparent", border: "none" }}
                    >
                      {t.forgot}
                    </button>
                  </div>
                  <div className="dvPassWrap">
                    <input
                      className="dvInput"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                {t.noAccount}{" "}
                <Link to="/register" style={{ color: "var(--c-accent)", textDecoration: "none", fontWeight: 900 }}>
                  {t.register}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="dvToast">{toast}</div>}
    </div>
  );
}
