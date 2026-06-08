import { Link } from "react-router-dom";

type Props = { lang: "zh" | "en" };

export function PricingSection({ lang }: Props) {
  const plans = [
    {
      name: lang === "zh" ? "Free" : "Free",
      price: lang === "zh" ? "¥0" : "$0",
      note: lang === "zh" ? "适合体验与探索" : "Try it out",
      features: [
        lang === "zh" ? "2 次 AI 生成" : "2 AI generations",
        lang === "zh" ? "基础 3D 编辑" : "Basic 3D builder",
        lang === "zh" ? "Room DNA 测试" : "Room DNA quiz",
        lang === "zh" ? "基础推荐清单" : "Basic recommendations",
      ],
      cta: lang === "zh" ? "开始免费使用" : "Start Free",
      highlight: false,
    },
    {
      name: lang === "zh" ? "Pro" : "Pro",
      price: lang === "zh" ? "¥49" : "$9",
      note: lang === "zh" ? "推荐 · 最受欢迎" : "Recommended · Most popular",
      features: [
        lang === "zh" ? "更多生成额度" : "More generation credits",
        lang === "zh" ? "360° 预览" : "360° viewer",
        lang === "zh" ? "完整 3D 设计体验" : "Full 3D experience",
        lang === "zh" ? "更精准推荐" : "More precise recommendations",
      ],
      cta: lang === "zh" ? "开始 Pro" : "Start Pro",
      highlight: true,
    },
    {
      name: lang === "zh" ? "Premium" : "Premium",
      price: lang === "zh" ? "¥99" : "$19",
      note: lang === "zh" ? "更深度个性化" : "Deep personalization",
      features: [
        lang === "zh" ? "最高额度" : "Highest credits",
        lang === "zh" ? "高级导出" : "Advanced exports",
        lang === "zh" ? "项目管理增强" : "Enhanced project management",
        lang === "zh" ? "优先体验新功能" : "Early access",
      ],
      cta: lang === "zh" ? "开始 Premium" : "Start Premium",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="dvSection">
      <div className="dvWrapWide">
        <div className="dvKicker">{lang === "zh" ? "PRICING" : "PRICING"}</div>
        <h2 className="dvH2" style={{ marginTop: 14 }}>
          {lang === "zh" ? "简单、清晰的价格" : "Simple, honest pricing"}
        </h2>
        <p className="dvLead" style={{ marginTop: 12 }}>
          {lang === "zh"
            ? "从免费开始。准备好时再升级。"
            : "Start free. Upgrade when you want deeper personalization and more projects."}
        </p>

        <div className="dvGrid3" style={{ marginTop: 18, alignItems: "stretch" }}>
          {plans.map((p) => (
            <div
              key={p.name}
              className="dvCard"
              style={{
                padding: 18,
                borderRadius: 20,
                border: p.highlight ? "2px solid #2DD4BF" : "1px solid var(--c-card-border)",
                background: p.highlight ? "linear-gradient(135deg, rgba(13,42,39,0.75), rgba(24,24,27,0.92))" : "var(--c-card)",
                position: "relative",
              }}
            >
              {p.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    background: "#2DD4BF",
                    color: "#0A0A0A",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 950,
                    letterSpacing: 1,
                  }}
                >
                  {lang === "zh" ? "推荐" : "Recommended"}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 950, color: p.highlight ? "#2DD4BF" : "var(--c-text)" }}>{p.name}</div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 40, fontWeight: 950, color: "var(--c-text)", letterSpacing: -0.6 }}>{p.price}</div>
                <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? " / 月" : " / mo"}</div>
              </div>
              <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 13, fontWeight: 800 }}>{p.note}</div>

              <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: p.highlight ? "rgba(45,212,191,0.7)" : "rgba(161,161,170,0.55)", marginTop: 7 }} />
                    <div style={{ color: "var(--c-muted)", fontSize: 13, lineHeight: 1.6 }}>{f}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <Link to="/register" className={p.highlight ? "dvBtnPrimary" : "dvBtnGhost"} style={{ width: "100%", justifyContent: "center" }}>
                  {p.cta}
                </Link>
              </div>
              <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 12 }}>
                {lang === "zh" ? "无需信用卡 · 随时取消" : "No credit card · Cancel anytime"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

