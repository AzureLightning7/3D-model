import { Bot, Box, Fingerprint, Folder, Globe, ShoppingCart } from "lucide-react";

type Props = { lang: "zh" | "en" };

export function ShowcaseSection({ lang }: Props) {
  const items = [
    {
      title: lang === "zh" ? "AI 房间生成" : "AI Room Generation",
      body:
        lang === "zh"
          ? "从照片或 Room DNA 出发，生成可落地的设计概念。"
          : "Generate real, buildable concepts from your room and Room DNA.",
      icon: <Bot size={20} color="#2DD4BF" strokeWidth={1.8} />,
    },
    {
      title: lang === "zh" ? "3D 房间建模" : "3D Room Builder",
      body: lang === "zh" ? "在真实尺度里摆放家具，避免不合尺寸。" : "Place furniture at real scale so it fits.",
      icon: <Box size={20} color="#2DD4BF" strokeWidth={1.8} />,
    },
    {
      title: lang === "zh" ? "360° 沉浸式预览" : "360° Room Viewer",
      body: lang === "zh" ? "走进你的设计，提前感受氛围。" : "Step into your design before buying anything.",
      icon: <Globe size={20} color="#2DD4BF" strokeWidth={1.8} />,
    },
    {
      title: lang === "zh" ? "Room DNA 分析" : "Room DNA Analysis",
      body: lang === "zh" ? "把个性、习惯与情绪偏好变成设计方向。" : "Turn identity into a design direction.",
      icon: <Fingerprint size={20} color="#2DD4BF" strokeWidth={1.8} />,
    },
    {
      title: lang === "zh" ? "家具推荐" : "Furniture Recommendations",
      body: lang === "zh" ? "推荐与你的口味相符的清单，少踩坑。" : "A ranked catalog that matches your taste.",
      icon: <ShoppingCart size={20} color="#2DD4BF" strokeWidth={1.8} />,
    },
    {
      title: lang === "zh" ? "项目管理" : "Project Management",
      body: lang === "zh" ? "保存多个方案，随时回到你的灵感。" : "Save multiple designs and iterate confidently.",
      icon: <Folder size={20} color="#2DD4BF" strokeWidth={1.8} />,
    },
  ];

  return (
    <section id="showcase" className="dvSection dvSectionAlt">
      <div className="dvWrapWide">
        <div className="dvKicker">{lang === "zh" ? "PRODUCT" : "PRODUCT"}</div>
        <h2 className="dvH2" style={{ marginTop: 14 }}>
          {lang === "zh" ? "把灵感变成可视化、可执行的设计" : "Premium tools that turn inspiration into decisions"}
        </h2>
        <p className="dvLead" style={{ marginTop: 12 }}>
          {lang === "zh"
            ? "每个功能都围绕一个目标：让空间更像你，并且更容易实现。"
            : "Every feature supports one goal: a space that feels like you—and is easier to bring to life."}
        </p>

        <div className="dvGrid6" style={{ marginTop: 18 }}>
          {items.map((it) => (
            <div key={it.title} className="dvCard" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{it.icon}</div>
                <div className="dvPill" style={{ padding: "6px 10px", fontSize: 11 }}>
                  {lang === "zh" ? "预览" : "Preview"}
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 15, fontWeight: 950, color: "var(--c-text)" }}>{it.title}</div>
              <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>{it.body}</div>
              <div style={{ marginTop: 14, height: 86, borderRadius: 14, background: "linear-gradient(135deg, #18181B, #0F172A)", border: "1px solid rgba(63,63,70,0.8)" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

