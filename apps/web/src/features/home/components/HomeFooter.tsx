import { Link } from "react-router-dom";

type Props = {
  lang: "zh" | "en";
  scrollTo: (id: "how-it-works" | "problem") => void;
};

export function HomeFooter({ lang, scrollTo }: Props) {
  const colTitleStyle = { color: "var(--c-text)", fontSize: 12, fontWeight: 950, letterSpacing: 2 } as const;
  const itemStyle = {
    border: "none",
    background: "transparent",
    color: "var(--c-muted)",
    padding: 0,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "left",
  } as const;

  return (
    <footer style={{ borderTop: "1px solid rgba(39,39,42,0.9)", padding: "54px 0", background: "#0A0A0A" }}>
      <div className="dvWrapWide">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ color: "#2DD4BF", fontWeight: 950, fontSize: 16, letterSpacing: "-0.2px" }}>DormVibe</div>
            <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.7, maxWidth: 320 }}>
              {lang === "zh"
                ? "让每个人都拥有归属感。把“像你”的感觉，变成每天都想回去的空间。"
                : "Everyone deserves belonging. Turn “feels like you” into a space you want to come back to."}
            </div>
            <div style={{ marginTop: 14, color: "var(--c-muted)", fontSize: 12 }}>© 2026 DormVibe</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: 18, flex: "1 1 520px" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={colTitleStyle}>{lang === "zh" ? "产品" : "Product"}</div>
              <button type="button" style={itemStyle} onClick={() => scrollTo("problem")}>
                {lang === "zh" ? "为什么选择我们" : "Why DormVibe"}
              </button>
              <button type="button" style={itemStyle} onClick={() => scrollTo("how-it-works")}>
                {lang === "zh" ? "如何使用" : "How it works"}
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={colTitleStyle}>{lang === "zh" ? "资源" : "Resources"}</div>
              <button type="button" style={{ ...itemStyle, cursor: "default", opacity: 0.7 }}>
                {lang === "zh" ? "指南" : "Guides"}
              </button>
              <button type="button" style={{ ...itemStyle, cursor: "default", opacity: 0.7 }}>
                {lang === "zh" ? "帮助中心" : "Help Center"}
              </button>
              <button type="button" style={{ ...itemStyle, cursor: "default", opacity: 0.7 }}>
                {lang === "zh" ? "博客" : "Blog"}
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={colTitleStyle}>{lang === "zh" ? "公司" : "Company"}</div>
              <button type="button" style={{ ...itemStyle, cursor: "default", opacity: 0.7 }}>
                {lang === "zh" ? "隐私" : "Privacy"}
              </button>
              <button type="button" style={{ ...itemStyle, cursor: "default", opacity: 0.7 }}>
                {lang === "zh" ? "条款" : "Terms"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, minWidth: 220 }}>
            <div style={colTitleStyle}>{lang === "zh" ? "开始" : "Get started"}</div>
            <Link to="/register" className="dvBtnPrimary" style={{ justifyContent: "center", width: "100%" }}>
              {lang === "zh" ? "免费开始设计" : "Start Designing Free"}
            </Link>
            <Link to="/login" className="dvBtnGhost" style={{ justifyContent: "center", width: "100%" }}>
              {lang === "zh" ? "登录" : "Login"}
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 26, color: "var(--c-muted)", fontSize: 12, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>{lang === "zh" ? "让空间更像你。" : "Make space feel like you."}</div>
          <div>www.dormvibe.com</div>
        </div>
      </div>
    </footer>
  );
}

