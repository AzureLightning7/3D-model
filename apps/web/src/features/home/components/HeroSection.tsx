import { Link } from "react-router-dom";

type Props = {
  lang: "zh" | "en";
  scrollTo: (id: "how-it-works" | "problem") => void;
};

export function HeroSection({ lang, scrollTo }: Props) {
  return (
    <section style={{ padding: "80px 0 54px", position: "relative", overflow: "hidden" }}>
      <style>
        {`
          @keyframes dvGlowPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.55; } 50% { transform: translate(-50%,-50%) scale(1.18); opacity: 0.95; } }
          @keyframes dvFloatSlow { 0%,100% { transform: translateY(-10px); } 50% { transform: translateY(10px); } }
        `}
      </style>

      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "46%",
            left: "58%",
            width: 820,
            height: 820,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,212,191,0.14) 0%, transparent 68%)",
            filter: "blur(0px)",
            transform: "translate(-50%, -50%)",
            animation: "dvGlowPulse 7s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 60,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#2DD4BF",
            opacity: 0.35,
            animation: "dvFloatSlow 6.2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 120,
            right: 90,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#2DD4BF",
            opacity: 0.25,
            animation: "dvFloatSlow 7.1s ease-in-out infinite",
          }}
        />
      </div>

      <div className="dvWrapWide">
        <div className="dvGrid2" style={{ alignItems: "stretch" }}>
          <div>
            <div className="dvPill">
              <span aria-hidden>✦</span>
              {lang === "zh" ? "属于你的房间，从理解你开始" : "Belonging starts with being understood"}
            </div>

            <h1 className="dvH1" style={{ marginTop: 18 }}>
              {lang === "zh" ? "打造一个真正像你的空间" : "Create a Space That Feels Like You"}
            </h1>

            <p className="dvLead" style={{ marginTop: 14 }}>
              {lang === "zh"
                ? "DormVibe 用 AI 房间生成与沉浸式 3D 可视化，把你的习惯、个性、情绪和生活方式，变成你每天都会喜欢的空间。"
                : "Design a room that reflects your habits, personality, emotions, and lifestyle using AI-powered room generation and immersive 3D visualization."}
            </p>

            <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/register" className="dvBtnPrimary">
                {lang === "zh" ? "免费开始设计" : "Start Designing Free"} <span aria-hidden>→</span>
              </Link>
              <button type="button" className="dvBtnGhost" onClick={() => scrollTo("how-it-works")}>
                {lang === "zh" ? "看看怎么用" : "See How It Works"}
              </button>
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", color: "var(--c-muted)", fontSize: 13 }}>
              <div className="dvCardSoft" style={{ padding: "10px 12px" }}>
                <span style={{ color: "#2DD4BF", fontWeight: 950 }}>Room DNA</span> · {lang === "zh" ? "16种个性组合" : "16 personality types"}
              </div>
              <div className="dvCardSoft" style={{ padding: "10px 12px" }}>
                <span style={{ color: "#2DD4BF", fontWeight: 950 }}>360°</span> · {lang === "zh" ? "沉浸式预览" : "immersive preview"}
              </div>
              <div className="dvCardSoft" style={{ padding: "10px 12px" }}>
                <span style={{ color: "#2DD4BF", fontWeight: 950 }}>3D</span> · {lang === "zh" ? "真实比例家具" : "real-scale furniture"}
              </div>
            </div>
          </div>

          <div>
            <div style={{ position: "relative" }}>
              <div
                className="dvCard"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  boxShadow: "0 40px 140px rgba(0,0,0,0.6)",
                  borderColor: "rgba(63,63,70,0.8)",
                }}
              >
                <div
                  style={{
                    background: "#18181B",
                    borderBottom: "1px solid #27272A",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", opacity: 0.7 }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", opacity: 0.7 }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E", opacity: 0.7 }} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: "#27272A",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                      color: "var(--c-muted)",
                      fontWeight: 700,
                    }}
                  >
                    dormvibe.com/projects
                  </div>
                </div>

                <div style={{ padding: 16, background: "#0A0A0A" }}>
                  <div
                    style={{
                      background: "#18181B",
                      border: "1px solid #2DD4BF",
                      borderRadius: 14,
                      padding: "12px 16px",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: "var(--c-muted)",
                          letterSpacing: 2,
                          textTransform: "uppercase",
                        }}
                      >
                        {lang === "zh" ? "房间基因" : "Room DNA"}
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 950,
                          color: "#2DD4BF",
                          letterSpacing: 6,
                          lineHeight: 1.2,
                          marginTop: 2,
                        }}
                      >
                        COCW
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)" }}>
                        {lang === "zh" ? "学者型" : "The Scholar"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>
                        {lang === "zh" ? "温暖 · 有序 · 专注" : "Warm · Ordered · Focused"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#111118",
                      border: "1px solid #27272A",
                      borderRadius: 14,
                      height: 180,
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, transparent 30%, rgba(45,212,191,0.04) 100%)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 32,
                          background: "rgba(45,212,191,0.15)",
                          border: "1px solid rgba(45,212,191,0.3)",
                          borderRadius: 6,
                        }}
                      />
                      <div
                        style={{
                          width: 44,
                          height: 24,
                          background: "rgba(168,85,247,0.15)",
                          border: "1px solid rgba(168,85,247,0.3)",
                          borderRadius: 6,
                        }}
                      />
                      <div
                        style={{
                          width: 10,
                          height: 40,
                          background: "rgba(249,115,22,0.15)",
                          border: "1px solid rgba(249,115,22,0.3)",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 14,
                        fontSize: 11,
                        fontWeight: 900,
                        color: "var(--c-muted)",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      {lang === "zh" ? "3D 编辑器" : "3D Editor"}
                    </div>
                    <div style={{ position: "absolute", top: 12, right: 14, display: "flex", gap: 6, alignItems: "center" }}>
                      <div className="dvPill" style={{ padding: "3px 8px", fontSize: 10 }}>
                        {lang === "zh" ? "实时" : "Live"}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: lang === "zh" ? "家具" : "Furniture", value: "6" },
                      { label: lang === "zh" ? "总价" : "Total", value: "¥4,200" },
                      { label: lang === "zh" ? "完成度" : "Done", value: "80%" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: "#18181B",
                          border: "1px solid #27272A",
                          borderRadius: 10,
                          padding: "8px 10px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 950, color: "#2DD4BF" }}>{stat.value}</div>
                        <div style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 700, marginTop: 2 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: -14,
                  right: -14,
                  background: "#2DD4BF",
                  color: "#0A0A0A",
                  borderRadius: 12,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 950,
                  boxShadow: "0 8px 32px rgba(45,212,191,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                {lang === "zh" ? "✦ AI 驱动" : "✦ AI Powered"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 28, color: "var(--c-muted)", fontSize: 13, textAlign: "center" }}>
          {lang === "zh" ? "🎓 适合学生、租房族、换新空间的人" : "🎓 Built for students, renters, and anyone starting over in a new space"}
        </div>
      </div>
    </section>
  );
}

