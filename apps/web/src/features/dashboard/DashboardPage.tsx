import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/features/auth/store";
import { buildRoomDnaProfile } from "@/features/room-dna/model";
import { useProfileStore } from "@/features/survey/store";
import { api } from "@/shared/api";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

export function DashboardPage() {
  const nav = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);
  const roomDNA = useProfileStore((s) => s.roomDNA);
  const roomTypeName = useProfileStore((s) => s.roomTypeName);
  const rawAnswers = useProfileStore((s) => s.rawAnswers);

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  const projects = (data?.items ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recent = projects.slice(0, 4);
  const continueProject = projects[0] ?? null;

  const greetingName = user?.displayName?.trim() || user?.email?.split("@")[0] || (lang === "zh" ? "你" : "there");
  const profile = buildRoomDnaProfile(rawAnswers, roomDNA, roomTypeName, lang);

  const viewerHref = continueProject ? `/projects/${continueProject.id}` : "/projects";
  const builderHref = continueProject ? `/projects/${continueProject.id}/editor` : "/projects";

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>
            {lang === "zh" ? "主页" : "DASHBOARD"}
          </div>
          <h1 style={{ marginTop: 8, marginBottom: 0 }}>
            {lang === "zh" ? `欢迎回来，${greetingName}` : `Welcome back, ${greetingName}`}
          </h1>
          <div style={{ marginTop: 10, color: "var(--c-text)", fontSize: 18, fontWeight: 950 }}>
            {lang === "zh" ? "今天想做什么？" : "What would you like to do today?"}
          </div>
          {roomDNA && (
            <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.6 }}>
              {lang === "zh" ? "你的房间基因：" : "Your Room DNA:"}{" "}
              <span style={{ color: "var(--c-accent)", fontWeight: 950, letterSpacing: 4 }}>{roomDNA}</span>{" "}
              <span style={{ color: "var(--c-text)", fontWeight: 900 }}>· {profile.personalityTitle}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link
            to="/room-dna"
            style={{
              ...styles.buttonGhost,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
            }}
          >
            {lang === "zh" ? "房间基因" : "Room DNA"}
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div
            style={{
              background: "var(--c-card)",
              border: "1px solid var(--c-card-border)",
              borderRadius: 18,
              padding: 20,
            }}
          >
            <div style={{ color: "var(--c-muted)", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
              {lang === "zh" ? "上传房间" : "Upload Your Room"}
            </div>
            <div style={{ marginTop: 10, color: "var(--c-text)", fontSize: 18, fontWeight: 950 }}>
              {lang === "zh" ? "生成 AI 方案" : "Generate AI concepts"}
            </div>
            <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>
              {lang === "zh" ? "生成个性化房间方案与购买清单。" : "Generate personalized AI room concepts."}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link to="/upload" style={{ ...styles.button, textDecoration: "none", fontWeight: 900, display: "inline-flex" }}>
                {lang === "zh" ? "开始设计" : "Start Designing"}
              </Link>
            </div>
          </div>

          <div
            style={{
              background: "var(--c-card)",
              border: "1px solid var(--c-card-border)",
              borderRadius: 18,
              padding: 20,
            }}
          >
            <div style={{ color: "var(--c-muted)", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
              {lang === "zh" ? "360° 预览" : "Explore in 360°"}
            </div>
            <div style={{ marginTop: 10, color: "var(--c-text)", fontSize: 18, fontWeight: 950 }}>
              {lang === "zh" ? "沉浸式查看" : "Immersive viewing"}
            </div>
            <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>
              {lang === "zh" ? "在空间中走一圈，确认氛围与布局。" : "View and explore your room in immersive mode."}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link to={viewerHref} style={{ ...styles.button, textDecoration: "none", fontWeight: 900, display: "inline-flex" }}>
                {lang === "zh" ? "打开预览" : "Open Viewer"}
              </Link>
            </div>
          </div>

          <div
            style={{
              background: "var(--c-card)",
              border: "1px solid var(--c-card-border)",
              borderRadius: 18,
              padding: 20,
            }}
          >
            <div style={{ color: "var(--c-muted)", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
              {lang === "zh" ? "3D 编辑器" : "3D Builder"}
            </div>
            <div style={{ marginTop: 10, color: "var(--c-text)", fontSize: 18, fontWeight: 950 }}>
              {lang === "zh" ? "搭建你的布局" : "Build your layout"}
            </div>
            <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.65 }}>
              {lang === "zh" ? "用真实比例家具调整位置与动线。" : "Customize and build your room in 3D."}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link to={builderHref} style={{ ...styles.button, textDecoration: "none", fontWeight: 900, display: "inline-flex" }}>
                {lang === "zh" ? "打开搭建器" : "Open Builder"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <section style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: "var(--c-text)" }}>{lang === "zh" ? "最近的项目" : "Recent Projects"}</div>
            <Link to="/projects" style={{ color: "var(--c-accent)", fontSize: 12, fontWeight: 900, textDecoration: "none" }}>
              {lang === "zh" ? "查看全部 →" : "View All →"}
            </Link>
          </div>

          {isLoading ? (
            <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13 }}>{lang === "zh" ? "加载中…" : "Loading…"}</div>
          ) : recent.length ? (
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {recent.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  style={{
                    display: "block",
                    background: "var(--c-card)",
                    border: "1px solid var(--c-card-border)",
                    borderRadius: 16,
                    overflow: "hidden",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      height: 120,
                      background: p.thumbnailUrl ? `url(${p.thumbnailUrl}) center/cover` : "linear-gradient(135deg, #18181B, #27272A)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!p.thumbnailUrl && <div style={{ fontSize: 26, opacity: 0.3 }}>🛋️</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ color: "var(--c-text)", fontWeight: 900, fontSize: 13 }}>{p.name}</div>
                    <div style={{ marginTop: 4, color: "var(--c-muted)", fontSize: 12 }}>
                      {p.roomWidthM}m × {p.roomDepthM}m
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13 }}>
              {lang === "zh" ? "还没有项目。创建你的第一个设计开始使用。" : "No projects yet. Create your first design to get started."}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

