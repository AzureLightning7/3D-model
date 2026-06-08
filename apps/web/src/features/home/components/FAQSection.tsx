import { useMemo, useState } from "react";

type Props = { lang: "zh" | "en" };

export function FAQSection({ lang }: Props) {
  const faqs = useMemo(
    () => [
      {
        q: lang === "zh" ? "DormVibe 是什么？" : "What is DormVibe?",
        a:
          lang === "zh"
            ? "DormVibe 是一个以“归属感”为目标的空间设计产品。它通过 Room DNA、AI 方案与 3D/360° 预览，帮助你把房间变成更像你的空间。"
            : "DormVibe is a belonging-first room design product. Using Room DNA, AI concepts, and 3D/360° previews, it helps you build a space that feels like you.",
      },
      {
        q: lang === "zh" ? "Room DNA 会收集哪些信息？" : "What does Room DNA measure?",
        a:
          lang === "zh"
            ? "Room DNA 关注你的习惯、生活方式与情绪偏好，用于生成更贴近你的设计方向与推荐。"
            : "Room DNA focuses on habits, lifestyle, and emotional preferences to create a more personal design direction and recommendations.",
      },
      {
        q: lang === "zh" ? "3D / 360° 有什么用？" : "Why 3D and 360°?",
        a:
          lang === "zh"
            ? "因为“看得到”才能放心购买。3D 帮你确认尺寸与动线，360° 帮你提前感受氛围。"
            : "Because seeing builds confidence. 3D confirms scale and layout; 360° lets you feel the atmosphere before buying.",
      },
      {
        q: lang === "zh" ? "需要设计经验吗？" : "Do I need design experience?",
        a:
          lang === "zh"
            ? "不需要。DormVibe 从你的身份与空间条件出发，把复杂选择变成清晰方向。"
            : "No. DormVibe starts from identity and constraints, turning overwhelming choices into a clear direction.",
      },
      {
        q: lang === "zh" ? "我可以随时取消吗？" : "Can I cancel anytime?",
        a:
          lang === "zh"
            ? "可以。你可以从免费开始，准备好时再升级。"
            : "Yes. Start free and upgrade when you’re ready.",
      },
    ],
    [lang],
  );

  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="dvSection dvSectionAlt">
      <div className="dvWrapWide">
        <div className="dvKicker">{lang === "zh" ? "FAQ" : "FAQ"}</div>
        <h2 className="dvH2" style={{ marginTop: 14 }}>
          {lang === "zh" ? "常见问题" : "Frequently asked questions"}
        </h2>
        <p className="dvLead" style={{ marginTop: 12 }}>
          {lang === "zh" ? "快速了解 DormVibe 如何帮助你打造归属感。" : "Quick answers on how DormVibe helps you build belonging."}
        </p>

        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
          {faqs.map((f, idx) => {
            const isOpen = open === idx;
            return (
              <div key={f.q} className="dvCard" style={{ padding: 16 }}>
                <button
                  type="button"
                  onClick={() => setOpen((cur) => (cur === idx ? null : idx))}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    color: "var(--c-text)",
                    fontSize: 14,
                    fontWeight: 950,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 0,
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{f.q}</span>
                  <span style={{ color: "var(--c-muted)", fontSize: 16, fontWeight: 900 }}>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.75 }}>{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

