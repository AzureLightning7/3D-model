import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type Props = { lang: "zh" | "en" };

export function FinalCTASection({ lang }: Props) {
  return (
    <section className="dvSection" style={{ paddingTop: 82, paddingBottom: 82 }}>
      <div className="dvWrapWide">
        <div
          className="dvCard"
          style={{
            padding: 26,
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(45,212,191,0.12), rgba(24,24,27,0.92))",
            border: "1px solid rgba(45,212,191,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div className="dvPill">
              <span aria-hidden>✦</span>
              {lang === "zh" ? "你的房间，也应该像家" : "Your room should feel like home"}
            </div>
            <h2 className="dvH2" style={{ marginTop: 14 }}>
              {lang === "zh" ? "开始设计一个真正像你的空间" : "Start designing a space that reflects who you are"}
            </h2>
            <p className="dvLead" style={{ marginTop: 10 }}>
              {lang === "zh"
                ? "从 Room DNA 开始，快速得到方向、方案与推荐。"
                : "Begin with Room DNA and get a clear direction, visuals, and recommendations—fast."}
            </p>
            <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/register" className="dvBtnPrimary">
                {lang === "zh" ? "免费开始设计" : "Start Designing Free"}{" "}
                <span aria-hidden style={{ display: "flex", alignItems: "center" }}>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </span>
              </Link>
              <Link to="/login" className="dvBtnGhost">
                {lang === "zh" ? "登录" : "Login"}
              </Link>
            </div>
            <div style={{ marginTop: 12, color: "var(--c-muted)", fontSize: 13 }}>
              {lang === "zh" ? "无需信用卡 · 随时取消" : "No credit card · Cancel anytime"}
            </div>
          </div>

          <div
            aria-hidden
            style={{
              position: "absolute",
              right: -140,
              top: -140,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(45,212,191,0.22) 0%, transparent 70%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

