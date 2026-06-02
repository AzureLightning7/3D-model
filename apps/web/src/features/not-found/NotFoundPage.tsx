import { useNavigate } from "react-router-dom";

import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

export function NotFoundPage() {
  const nav = useNavigate();
  const lang = useLangStore((s) => s.lang);
  return (
    <div
      style={{
        ...styles.page,
        minHeight: "100vh",
        maxWidth: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0A",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: 80, lineHeight: 1 }}>🛋️</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "var(--c-text)", marginTop: 14 }}>
          {lang === "zh" ? "页面未找到" : "Room Not Found"}
        </div>
        <div style={{ color: "var(--c-muted)", marginTop: 10 }}>
          {lang === "zh" ? "这个页面不存在——但属于你的完美房间在等着你。" : "This page doesn't exist — but your perfect room does."}
        </div>
        <button type="button" style={{ ...styles.button, marginTop: 20 }} onClick={() => nav("/")}>
          {lang === "zh" ? "返回首页" : "Back to Home"}
        </button>
      </div>
    </div>
  );
}

