import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { useProfileStore } from "@/features/survey/store";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";
import { Check, Download, Share2 } from "lucide-react";

import { buildRoomDnaProfile } from "./model";

function SectionCard(props: { title: string; children: ReactNode }) {
  return (
    <section style={{ ...styles.card, borderRadius: 16 }}>
      <div style={{ fontWeight: 950, fontSize: 15, color: "var(--c-text)" }}>{props.title}</div>
      <div style={{ marginTop: 12 }}>{props.children}</div>
    </section>
  );
}

export function RoomDnaPage() {
  const lang = useLangStore((s) => s.lang);
  const roomDNA = useProfileStore((s) => s.roomDNA);
  const roomTypeName = useProfileStore((s) => s.roomTypeName);
  const rawAnswers = useProfileStore((s) => s.rawAnswers);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const profile = buildRoomDnaProfile(rawAnswers, roomDNA, roomTypeName, lang);

  async function handleShare() {
    if (!roomDNA || !roomTypeName) return;
    const shareText = `My Room DNA is ${roomDNA} — ${roomTypeName} 🏠 | DormVibe`;
    const shareUrl = window.location.origin + "/survey";
    try {
      await navigator.clipboard.writeText(shareText + "\n" + shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(shareText + "\n" + shareUrl);
    }
  }

  function handleDownload() {
    if (!roomDNA || !roomTypeName) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#18181B";
    ctx.strokeStyle = "#2DD4BF";
    ctx.lineWidth = 4;
    ctx.beginPath();
    const pad = 56;
    const r = 28;
    const x = pad;
    const y = pad;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#A1A1AA";
    ctx.font = '900 22px system-ui, -apple-system, "Segoe UI", Roboto, Arial';
    ctx.fillText("DORMVIBE ROOM DNA", x + 40, y + 70);

    ctx.fillStyle = "#2DD4BF";
    ctx.font = '900 110px system-ui, -apple-system, "Segoe UI", Roboto, Arial';
    ctx.fillText(roomDNA, x + 40, y + 200);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '900 44px system-ui, -apple-system, "Segoe UI", Roboto, Arial';
    ctx.fillText(roomTypeName, x + 40, y + 270);

    ctx.fillStyle = "#A1A1AA";
    ctx.font = '800 24px system-ui, -apple-system, "Segoe UI", Roboto, Arial';
    ctx.fillText("My room, my identity.", x + 40, y + 330);

    ctx.fillStyle = "#A1A1AA";
    ctx.font = '800 22px system-ui, -apple-system, "Segoe UI", Roboto, Arial';
    ctx.fillText("dormvibe.com", x + 40, y + h - 30);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dormvibe-room-dna-${roomDNA}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 500);
    }, "image/png");
  }

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
            {lang === "zh" ? "房间基因" : "ROOM DNA"}
          </div>
          <h1 style={{ margin: "8px 0 0" }}>
            {profile.code ? (lang === "zh" ? "你的风格档案" : "Your Style Profile") : lang === "zh" ? "还没有风格档案" : "No profile yet"}
          </h1>
          <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 14, maxWidth: 720, lineHeight: 1.7 }}>{profile.summary}</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/dashboard" style={{ ...styles.buttonGhost, textDecoration: "none", fontWeight: 900 }}>
            {lang === "zh" ? "返回主页" : "Back to Dashboard"}
          </Link>
          <Link to="/survey" style={{ ...styles.button, textDecoration: "none", fontWeight: 900 }}>
            {profile.code ? (lang === "zh" ? "重新测试" : "Retake Quiz") : lang === "zh" ? "开始测试" : "Start Quiz →"}
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          background: "#18181B",
          border: "1px solid var(--c-card-border)",
          borderLeft: "4px solid var(--c-accent)",
          borderRadius: 18,
          padding: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ color: "var(--c-muted)", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
              {lang === "zh" ? "房间基因" : "Room DNA"}
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <div style={{ color: "var(--c-accent)", fontSize: 56, fontWeight: 950, letterSpacing: 12 }}>{profile.code ?? "—"}</div>
              <div style={{ color: "var(--c-text)", fontSize: 22, fontWeight: 950 }}>{profile.personalityTitle}</div>
            </div>
            <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.7, maxWidth: 520 }}>{profile.summary}</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleShare}
              disabled={!roomDNA || !roomTypeName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: "1px solid var(--c-card-border)",
                color: copied ? "#2DD4BF" : "var(--c-muted)",
                borderRadius: 10,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 800,
                cursor: roomDNA && roomTypeName ? "pointer" : "not-allowed",
                transition: "all 150ms",
                opacity: roomDNA && roomTypeName ? 1 : 0.5,
              }}
            >
              {copied ? <Check size={14} strokeWidth={2.5} /> : <Share2 size={14} strokeWidth={2} />}
              {copied ? (lang === "zh" ? "已复制！" : "Copied!") : lang === "zh" ? "分享基因" : "Share DNA"}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!roomDNA || !roomTypeName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: "1px solid var(--c-card-border)",
                color: "var(--c-muted)",
                borderRadius: 10,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 800,
                cursor: roomDNA && roomTypeName ? "pointer" : "not-allowed",
                transition: "all 150ms",
                opacity: roomDNA && roomTypeName ? 1 : 0.5,
              }}
            >
              <Download size={14} strokeWidth={2} />
              {lang === "zh" ? "下载图片" : "Download Image"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {profile.identityCards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "var(--c-card)",
              border: "1px solid var(--c-card-border)",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ color: "var(--c-muted)", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>{c.label}</div>
            <div style={{ marginTop: 10, color: "var(--c-text)", fontSize: 18, fontWeight: 950, lineHeight: 1.2 }}>{c.value}</div>
            {c.subtext && <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.6 }}>{c.subtext}</div>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, ...styles.card, borderRadius: 16 }}>
        <div style={{ fontWeight: 950, fontSize: 15, color: "var(--c-text)" }}>{lang === "zh" ? "为什么适合你" : "Why this fits you"}</div>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {profile.lifestyleInsights.slice(0, 3).map((item) => (
            <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: "rgba(45,212,191,0.7)", marginTop: 7 }} />
              <div style={{ color: "var(--c-muted)", fontSize: 13, lineHeight: 1.7 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          style={{
            ...styles.buttonGhost,
            borderRadius: 999,
            padding: "10px 16px",
            fontWeight: 900,
          }}
        >
          {showDetails ? (lang === "zh" ? "收起详细信息" : "Hide details") : lang === "zh" ? "查看详细信息" : "See details"}
        </button>
      </div>

      {showDetails && (
        <>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>
            <SectionCard title={lang === "zh" ? "风格偏好" : "Style Preferences"}>
              <div style={{ display: "grid", gap: 10 }}>
                {profile.designPreferences.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "var(--c-card)",
                      border: "1px solid var(--c-card-border)",
                    }}
                  >
                    <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{item.label}</div>
                    <div style={{ color: "var(--c-text)", fontSize: 13, fontWeight: 900, textAlign: "right" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title={lang === "zh" ? "情绪分析" : "Mood Analysis"}>
              <div style={{ display: "grid", gap: 10 }}>
                {profile.moodAnalysis.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "var(--c-card)",
                      border: "1px solid var(--c-card-border)",
                    }}
                  >
                    <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{item.label}</div>
                    <div style={{ marginTop: 6, color: "var(--c-text)", fontSize: 13, lineHeight: 1.65 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>
            <SectionCard title={lang === "zh" ? "风格拆解" : "Room Style Breakdown"}>
              <div style={{ display: "grid", gap: 10 }}>
                {profile.styleBreakdown.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "12px 12px",
                      borderRadius: 12,
                      background: "var(--c-card)",
                      border: "1px solid var(--c-card-border)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{item.label}</div>
                      <div style={{ marginTop: 6, color: "var(--c-text)", fontSize: 14, fontWeight: 900 }}>{item.value}</div>
                    </div>
                    <div style={{ width: 12, height: 12, borderRadius: 99, background: item.accent ?? "#2DD4BF" }} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title={lang === "zh" ? "设计建议" : "Design Recommendations"}>
              <div style={{ display: "grid", gap: 12 }}>
                {profile.recommendations.map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, rgba(45,212,191,0.08), rgba(24,24,27,0.9))",
                      border: "1px solid rgba(45,212,191,0.18)",
                      color: "var(--c-text)",
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

