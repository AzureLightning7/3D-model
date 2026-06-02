type Props = { lang: "zh" | "en" };

export function TestimonialsSection({ lang }: Props) {
  const items = [
    {
      quote:
        lang === "zh"
          ? "第一次觉得房间不是临时的。它开始像我自己。"
          : "For the first time, my room stopped feeling temporary. It started feeling like me.",
      name: "Jia · Dorm move-in",
    },
    {
      quote:
        lang === "zh"
          ? "Room DNA 真的很准。我不再纠结“买什么”，而是知道“为什么”。"
          : "Room DNA was surprisingly accurate. I stopped debating what to buy—and understood why.",
      name: "Mina · Renter",
    },
    {
      quote:
        lang === "zh"
          ? "3D 尺度让我放心很多。终于不怕买到不合适的家具。"
          : "The 3D scale made everything feel safer. No more guessing if furniture will fit.",
      name: "Alex · First apartment",
    },
  ];

  return (
    <section id="testimonials" className="dvSection dvSectionAlt">
      <div className="dvWrapWide">
        <div className="dvKicker">{lang === "zh" ? "TESTIMONIALS" : "TESTIMONIALS"}</div>
        <h2 className="dvH2" style={{ marginTop: 14 }}>
          {lang === "zh" ? "更像“家”的感觉" : "The confidence of feeling at home"}
        </h2>
        <p className="dvLead" style={{ marginTop: 12 }}>
          {lang === "zh"
            ? "人们不是在追求“更好看”，而是在追求“更像自己”。"
            : "People aren’t just chasing aesthetics—they’re chasing self-expression and belonging."}
        </p>

        <div className="dvGrid3" style={{ marginTop: 18 }}>
          {items.map((t) => (
            <div key={t.name} className="dvCard" style={{ padding: 18 }}>
              <div style={{ color: "#2DD4BF", fontSize: 12, fontWeight: 950, letterSpacing: 2 }}>{lang === "zh" ? "REAL STORY" : "REAL STORY"}</div>
              <div style={{ marginTop: 10, fontSize: 15, fontWeight: 900, color: "var(--c-text)", lineHeight: 1.6 }}>
                “{t.quote}”
              </div>
              <div style={{ marginTop: 14, color: "var(--c-muted)", fontSize: 13, fontWeight: 800 }}>{t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

