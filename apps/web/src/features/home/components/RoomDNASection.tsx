import { Link } from "react-router-dom";

type Props = {
  lang: "zh" | "en";
  scrollTo: (id: "how-it-works") => void;
};

export function RoomDNASection({ lang, scrollTo }: Props) {
  const bullets = [
    {
      title: lang === "zh" ? "习惯与节奏" : "Habits and routines",
      body: lang === "zh" ? "你如何学习、休息、收纳、恢复。" : "How you study, rest, store, and recover.",
    },
    {
      title: lang === "zh" ? "情绪偏好" : "Emotional preferences",
      body: lang === "zh" ? "你需要更安静、更有能量或更有秩序。" : "Whether you need calm, energy, or clarity.",
    },
    {
      title: lang === "zh" ? "审美取向" : "Aesthetic taste",
      body: lang === "zh" ? "温暖、冷静、极简或更大胆。" : "Warm, cool, minimal, or bold.",
    },
    {
      title: lang === "zh" ? "生活方式" : "Lifestyle",
      body: lang === "zh" ? "你喜欢社交、独处、健身、咖啡文化等。" : "Social, solo, fitness, café culture, and more.",
    },
  ];

  return (
    <section id="room-dna" className="dvSection">
      <div className="dvWrapWide">
        <div className="dvGrid2" style={{ alignItems: "stretch" }}>
          <div>
            <div className="dvKicker">{lang === "zh" ? "FLAGSHIP" : "FLAGSHIP"}</div>
            <h2 className="dvH2" style={{ marginTop: 14 }}>
              {lang === "zh" ? "Room DNA：让房间学会“像你”" : "Room DNA: a room that learns to feel like you"}
            </h2>
            <p className="dvLead" style={{ marginTop: 12 }}>
              {lang === "zh"
                ? "Room DNA 是 DormVibe 的个性化引擎。它不是“风格测试”，而是把你的身份感、生活方式与空间需求，变成可视化方案与推荐。"
                : "Room DNA is DormVibe’s personalization engine. Not a generic style quiz—an identity-driven profile that becomes a visual design and recommendations."}
            </p>

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/survey" className="dvBtnPrimary">
                {lang === "zh" ? "获取我的 Room DNA" : "Get My Room DNA"} <span aria-hidden>→</span>
              </Link>
              <button type="button" className="dvBtnGhost" onClick={() => scrollTo("how-it-works")}>
                {lang === "zh" ? "了解如何生成" : "See how it works"}
              </button>
            </div>
          </div>

          <div className="dvCard" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, color: "var(--c-muted)" }}>
                {lang === "zh" ? "EXAMPLE" : "EXAMPLE"}
              </div>
              <div className="dvPill" style={{ fontSize: 11, padding: "6px 10px" }}>
                {lang === "zh" ? "可分享" : "Shareable"}
              </div>
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              <div className="dvCardSoft" style={{ padding: 16 }}>
                <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>ROOM DNA</div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 12 }}>
                  <div style={{ fontSize: 44, fontWeight: 950, color: "#2DD4BF", letterSpacing: 10 }}>SOBP</div>
                  <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>
                    {lang === "zh" ? "社交主理人" : "Social Host"}
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    lang === "zh" ? "明亮" : "Bright",
                    lang === "zh" ? "好客" : "Host-ready",
                    lang === "zh" ? "更有条理" : "Organized",
                  ].map((t) => (
                    <div
                      key={t}
                      style={{
                        background: "rgba(45,212,191,0.10)",
                        border: "1px solid rgba(45,212,191,0.30)",
                        color: "#2DD4BF",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="dvGrid2" style={{ gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "stretch" }}>
                {bullets.map((b) => (
                  <div key={b.title} className="dvCardSoft" style={{ padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 950, color: "var(--c-text)" }}>{b.title}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "var(--c-muted)", lineHeight: 1.6 }}>{b.body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: -80,
                background: "radial-gradient(circle at 30% 20%, rgba(45,212,191,0.10), transparent 45%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

