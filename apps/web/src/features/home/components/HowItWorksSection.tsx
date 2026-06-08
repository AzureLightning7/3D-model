import { Link } from "react-router-dom";
import { Brain, Camera, Globe, ShoppingCart, Sparkles } from "lucide-react";

type Props = { lang: "zh" | "en" };

export function HowItWorksSection({ lang }: Props) {
  const steps = [
    {
      n: "01",
      title: lang === "zh" ? "上传你的房间" : "Upload Your Room",
      icon: <Camera size={20} color="#2DD4BF" strokeWidth={1.8} />,
      body: lang === "zh" ? "拍一张空房间的照片，或者手动输入你的房间尺寸。" : "Take a photo of your empty room or enter your room dimensions manually.",
    },
    {
      n: "02",
      title: lang === "zh" ? "告诉我们你是谁" : "Tell Us About Yourself",
      icon: <Brain size={20} color="#2DD4BF" strokeWidth={1.8} />,
      body: lang === "zh" ? "完成 Room DNA 测试——分享你的习惯、兴趣和风格偏好。" : "Complete the Room DNA quiz — share your habits, interests, and style preferences.",
    },
    {
      n: "03",
      title: lang === "zh" ? "生成个性化方案" : "Generate Personalized Concepts",
      icon: <Sparkles size={20} color="#2DD4BF" strokeWidth={1.8} />,
      body: lang === "zh" ? "AI 根据你的个性生成完整的房间设计方案，包括配色、家具和布局。" : "AI generates a complete room design based on your personality — colors, furniture, and layout.",
    },
    {
      n: "04",
      title: lang === "zh" ? "在 360° 与 3D 中探索" : "Explore in 360° and 3D",
      icon: <Globe size={20} color="#2DD4BF" strokeWidth={1.8} />,
      body: lang === "zh" ? "在沉浸式 3D 编辑器中查看和调整你的房间，直到它感觉完全正确。" : "View and adjust your room in the immersive 3D editor until it feels exactly right.",
    },
    {
      n: "05",
      title: lang === "zh" ? "把空间变成现实" : "Bring Your Space to Life",
      icon: <ShoppingCart size={20} color="#2DD4BF" strokeWidth={1.8} />,
      body: lang === "zh" ? "获得完整的购物清单，包含淘宝和京东的直达链接。" : "Get a complete shopping list with direct links to Taobao and JD.com.",
    },
  ];

  return (
    <section id="how-it-works" className="dvSection">
      <div className="dvWrapWide">
        <div className="dvKicker">{lang === "zh" ? "HOW IT WORKS" : "HOW IT WORKS"}</div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "end", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <h2 className="dvH2">{lang === "zh" ? "五步，把“想要的感觉”变成真实空间" : "Five steps from feeling to a real space"}</h2>
          <Link to="/register" className="dvBtnSoft">
            {lang === "zh" ? "开始设计" : "Start Designing"} <span aria-hidden>→</span>
          </Link>
        </div>

        <div style={{ marginTop: 22 }} className="dvCard" aria-label="How it works steps">
          <div style={{ padding: 18 }}>
            <div style={{ display: "grid", gap: 12 }}>
              {steps.map((s, idx) => (
                <div
                  key={s.n}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 0",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(63,63,70,0.6)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 16,
                        background: "rgba(45,212,191,0.10)",
                        border: "1px solid rgba(45,212,191,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                    </div>
                    <div style={{ color: "#2DD4BF", fontWeight: 950, fontSize: 12, letterSpacing: 2 }}>{s.n}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 950, color: "var(--c-text)" }}>{s.title}</div>
                    <div style={{ marginTop: 4, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.6 }}>
          {lang === "zh"
            ? "从个性出发，而不是从模板出发。DormVibe 会把你的偏好映射到可视化方案与推荐。"
            : "Start from identity—not templates. DormVibe maps your preferences into visuals and recommendations."}
        </div>
      </div>
    </section>
  );
}

