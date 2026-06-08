type Props = { lang: "zh" | "en" };

export function TransformationSection({ lang }: Props) {
  return (
    <section id="transformations" className="dvSection">
      <div className="dvWrapWide">
        <div className="dvKicker">{lang === "zh" ? "BEFORE & AFTER" : "BEFORE & AFTER"}</div>
        <h2 className="dvH2" style={{ marginTop: 14 }}>
          {lang === "zh" ? "从空房间到“属于你”的空间" : "From an empty room to a space that feels like you"}
        </h2>
        <p className="dvLead" style={{ marginTop: 12 }}>
          {lang === "zh"
            ? "你不需要先有灵感。DormVibe 会把“感觉”变成方向，让你一步步落地。"
            : "You don’t need to start with inspiration. DormVibe turns feelings into direction—and direction into a real plan."}
        </p>

        <div className="dvGrid2" style={{ marginTop: 18, alignItems: "stretch" }}>
          <div className="dvCard" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, fontWeight: 950, color: "var(--c-text)" }}>{lang === "zh" ? "Before" : "Before"}</div>
              <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? "空白 / 临时" : "Blank / temporary"}</div>
            </div>
            <div style={{ marginTop: 12, height: 260, borderRadius: 18, background: "linear-gradient(135deg, #18181B, #111111)", border: "1px solid rgba(63,63,70,0.8)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 18, borderRadius: 14, border: "1px dashed rgba(161,161,170,0.35)" }} />
              <div style={{ position: "absolute", left: 22, top: 22, color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
                EMPTY ROOM
              </div>
            </div>
            <div style={{ marginTop: 12, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>
              {lang === "zh"
                ? "不确定该选什么、怎么摆、会不会太拥挤。"
                : "Unsure what to buy, where to place it, or whether it will feel cramped."}
            </div>
          </div>

          <div className="dvCard" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, fontWeight: 950, color: "var(--c-text)" }}>{lang === "zh" ? "After" : "After"}</div>
              <div style={{ color: "#2DD4BF", fontSize: 12, fontWeight: 950 }}>{lang === "zh" ? "个性化 / 真实尺度" : "Personalized / real scale"}</div>
            </div>
            <div
              style={{
                marginTop: 12,
                height: 260,
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(45,212,191,0.18), rgba(168,85,247,0.10), rgba(24,24,27,0.9))",
                border: "1px solid rgba(45,212,191,0.35)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", inset: 16, borderRadius: 14, background: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <div style={{ position: "absolute", left: 22, top: 22, color: "#2DD4BF", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
                YOUR SPACE
              </div>
              <div style={{ position: "absolute", left: 22, bottom: 20, right: 22, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Room DNA", "360°", "3D", "Shopping list"].map((t) => (
                  <div key={t} style={{ background: "rgba(0,0,0,0.38)", border: "1px solid rgba(45,212,191,0.28)", color: "#2DD4BF", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 900 }}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>
              {lang === "zh"
                ? "你能看到氛围、确认尺寸，并得到与你口味一致的推荐。"
                : "See the vibe, confirm the fit, and get recommendations aligned with your taste."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

