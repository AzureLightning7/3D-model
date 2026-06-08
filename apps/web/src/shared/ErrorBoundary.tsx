import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = { children: ReactNode };
type State = { error: Error | null };

function getLang(): "zh" | "en" {
  try {
    const stored = localStorage.getItem("dormvibe-lang");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.lang === "zh" ? "zh" : "en";
    }
  } catch {}
  return "en";
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("DormVibe error:", error, info);
  }

  render() {
    const lang = getLang();
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0A0A0A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            color: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛋️</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>{lang === "zh" ? "出现了一些问题" : "Something went wrong"}</h2>
          <p style={{ color: "#A1A1AA", marginTop: 8, maxWidth: 400, lineHeight: 1.6 }}>
            {lang === "zh" ? "发生了意外错误，你的设计是安全的。" : "An unexpected error occurred. Your designs are safe."}
          </p>
          <details style={{ marginTop: 16, color: "#A1A1AA", fontSize: 12, maxWidth: 500, textAlign: "left" }}>
            <summary style={{ cursor: "pointer" }}>{lang === "zh" ? "错误详情" : "Error details"}</summary>
            <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{this.state.error.message}</pre>
          </details>
          <Link
            to="/"
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 24,
              background: "#2DD4BF",
              color: "#0A0A0A",
              padding: "12px 28px",
              borderRadius: 10,
              fontWeight: 800,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            {lang === "zh" ? "返回首页" : "Back to Home"}
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

