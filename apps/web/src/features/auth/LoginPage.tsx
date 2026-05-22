import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, ApiError } from "@/shared/api";
import { styles } from "@/shared/ui";

import { useAuthStore } from "./store";

export function LoginPage() {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api.auth.login(email, password);
      setSession(r.user, r.tokens);
      nav("/projects", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ ...styles.page, maxWidth: 420 }}>
      <h1 style={{ marginTop: 32 }}>Welcome back</h1>
      <p style={styles.muted}>Log in to DormVibe.</p>
      <form onSubmit={onSubmit} style={{ ...styles.card, marginTop: 16 }}>
        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={styles.err}>{error}</p>}
        <button style={{ ...styles.button, marginTop: 16 }} disabled={busy}>
          {busy ? "…" : "Log in"}
        </button>
      </form>
      <p style={{ ...styles.muted, marginTop: 12, fontSize: 13 }}>
        No account? <Link to="/register" style={{ color: "#c4b5fd" }}>Register</Link>
      </p>
    </div>
  );
}
