import { Home, Lightbulb, ShoppingBag } from "lucide-react";

type Props = { lang: "zh" | "en" };

export function ProblemSection({ lang }: Props) {
  const cards = [
    {
      icon: <Home size={20} color="#2DD4BF" strokeWidth={1.8} />,
      title: lang === "zh" ? "空间很像「临时落脚」" : "Spaces feel temporary",
      body:
        lang === "zh"
          ? "搬进一个新房间时，你会努力适应它，而不是让它表达你。"
          : "We move into a room and adapt to it—rather than letting it express who we are.",
    },
    {
      icon: <Lightbulb size={20} color="#2DD4BF" strokeWidth={1.8} />,
      title: lang === "zh" ? "知道感觉但难以可视化" : "You know the feeling, not the layout",
      body:
        lang === "zh"
          ? "你可能知道想要温暖、安静、充满能量或更有秩序，但很难把它变成可执行的设计。"
          : "You can name the vibe—warm, calm, energized, organized—but turning it into a real design is hard.",
    },
    {
      icon: <ShoppingBag size={20} color="#2DD4BF" strokeWidth={1.8} />,
      title: lang === "zh" ? "选购和搭配很耗精力" : "Shopping and styling are exhausting",
      body:
        lang === "zh"
          ? "选择太多，预算有限，房间尺度不确定，最后只好“先凑合”。"
          : "Too many choices, limited budgets, unclear scale—so we settle for “good enough.”",
    },
  ];

  return (
    <section id="problem" className="dvSection">
      <div className="dvWrapWide">
        <div className="dvKicker">{lang === "zh" ? "THE PROBLEM" : "THE PROBLEM"}</div>
        <div className="dvGrid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div>
            <h2 className="dvH2">{lang === "zh" ? "房间不只是住的地方" : "A room isn’t just where you sleep"}</h2>
            <p className="dvLead" style={{ marginTop: 12 }}>
              {lang === "zh"
                ? "它是你思考、恢复、学习、创作、做梦的地方。它应该让你感觉被理解、被支持、被接住。"
                : "It’s where you think, recover, study, create, dream. It should make you feel understood—and at home."}
            </p>
          </div>
          <div className="dvCardSoft" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--c-text)" }}>
              {lang === "zh" ? "DormVibe 解决的是“归属感”" : "DormVibe solves for belonging"}
            </div>
            <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>
              {lang === "zh"
                ? "技术只是工具。真正的目标，是让你的空间开始“像你”。"
                : "The technology is just the tool. The goal is a space that finally feels like you."}
            </div>
            <div className="dvDivider" />
            <div style={{ display: "grid", gap: 8 }}>
              {[
                lang === "zh" ? "更快地从空房间开始" : "Start from an empty room faster",
                lang === "zh" ? "在真实尺度下做决定" : "Decide with real scale",
                lang === "zh" ? "在情绪与功能间找到平衡" : "Balance emotion + function",
              ].map((t) => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: "rgba(45,212,191,0.6)", marginTop: 7 }} />
                  <div style={{ color: "var(--c-muted)", fontSize: 13, lineHeight: 1.6 }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dvGrid3" style={{ marginTop: 18 }}>
          {cards.map((c) => (
            <div key={c.title} className="dvCard" style={{ padding: 18 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background: "rgba(45,212,191,0.08)",
                  border: "1px solid rgba(45,212,191,0.20)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                {c.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 950, color: "var(--c-text)" }}>{c.title}</div>
              <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.7 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

