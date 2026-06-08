import { Link } from "react-router-dom";
import { Brain, Camera, Globe, ShoppingCart } from "lucide-react";

type Props = { lang: "zh" | "en" };

export function SolutionSection({ lang }: Props) {
  const steps = [
    {
      title: lang === "zh" ? "上传房间 / 选择尺寸" : "Upload a room / set dimensions",
      body: lang === "zh" ? "从真实的空间开始，而不是从空白画布猜测。" : "Start from your real space—not a blank guess.",
      icon: <Camera size={18} color="#2DD4BF" strokeWidth={1.8} />,
    },
    {
      title: lang === "zh" ? "描述你自己" : "Describe yourself",
      body: lang === "zh" ? "习惯、兴趣、情绪偏好 —— 让空间更像你。" : "Habits, interests, emotional preferences—so it feels like you.",
      icon: <Brain size={18} color="#2DD4BF" strokeWidth={1.8} />,
    },
    {
      title: lang === "zh" ? "生成方案并沉浸式预览" : "Generate concepts + explore in 360°/3D",
      body: lang === "zh" ? "从“看得到”开始做决定，避免后悔。" : "Make decisions with confidence—because you can see it.",
      icon: <Globe size={18} color="#2DD4BF" strokeWidth={1.8} />,
    },
    {
      title: lang === "zh" ? "获得推荐与购物清单" : "Get recommendations + a shopping list",
      body: lang === "zh" ? "把灵感变成可购买的清单，少走弯路。" : "Turn inspiration into a buyable plan with less stress.",
      icon: <ShoppingCart size={18} color="#2DD4BF" strokeWidth={1.8} />,
    },
  ];

  return (
    <section id="solution" className="dvSection dvSectionAlt">
      <div className="dvWrapWide">
        <div className="dvKicker">{lang === "zh" ? "THE SOLUTION" : "THE SOLUTION"}</div>

        <div className="dvGrid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div>
            <h2 className="dvH2">{lang === "zh" ? "用一条更直观的路径，找到属于你的房间" : "A clearer path to a room that feels like you"}</h2>
            <p className="dvLead" style={{ marginTop: 12 }}>
              {lang === "zh"
                ? "DormVibe 把“感觉”变成“可以设计、可以预览、可以实现”的空间方案。"
                : "DormVibe turns a feeling into a design you can build, preview, and bring to life."}
            </p>
            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/register" className="dvBtnPrimary">
                {lang === "zh" ? "开始设计（免费）" : "Start Designing Free"} <span aria-hidden>→</span>
              </Link>
              <Link to="/login" className="dvBtnGhost">
                {lang === "zh" ? "我已有账号" : "I already have an account"}
              </Link>
            </div>
          </div>

          <div className="dvCard" style={{ padding: 18 }}>
            <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>
              {lang === "zh" ? "你会得到" : "WHAT YOU GET"}
            </div>
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {steps.map((s) => (
                <div key={s.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      background: "rgba(45,212,191,0.10)",
                      border: "1px solid rgba(45,212,191,0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 auto",
                      marginTop: 2,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 950, color: "var(--c-text)" }}>{s.title}</div>
                    <div style={{ marginTop: 4, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

