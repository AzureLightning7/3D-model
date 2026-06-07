import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProjectMetaStore } from "./projectMetaStore";
import { api } from "@/shared/api";
import { useLangStore } from "@/store/langStore";
import { ShoppingCart, Box, ArrowRight, Sparkles } from "lucide-react";

export function ProjectOverviewPage() {
  const nav = useNavigate();
  const { id = "" } = useParams<{ id: string }>();
  const lang = useLangStore((s) => s.lang);
  const meta = useProjectMetaStore((s) => (id ? s.byId[id] : undefined));

  const { data: project, isLoading } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => api.projects.get(id),
    enabled: !!id,
  });

  // Find the AI-generated image from assets
  const generatedAsset = meta?.assets?.find((a) => a.kind === "generated_image");
  const generatedImageUrl = generatedAsset?.url
    ? generatedAsset.url.startsWith("/generated")
      ? `http://localhost:8000${generatedAsset.url}`
      : generatedAsset.url
    : null;

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--c-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--c-muted)",
          fontSize: 14,
        }}
      >
        {lang === "zh" ? "加载中…" : "Loading…"}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--c-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px 80px",
      }}
    >
      {/* Back link */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          marginBottom: 24,
        }}
      >
        <Link
          to="/projects"
          style={{
            color: "var(--c-muted)",
            fontSize: 13,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 700,
          }}
        >
          <ArrowRight size={14} strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
          {lang === "zh" ? "返回我的设计" : "Back to My Designs"}
        </Link>
      </div>

      {/* Project name */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          marginBottom: 28,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(45,212,191,0.08)",
            border: "1px solid rgba(45,212,191,0.25)",
            borderRadius: 999,
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 900,
            color: "#2DD4BF",
            letterSpacing: 1,
            marginBottom: 16,
          }}
        >
          <Sparkles size={12} />
          {lang === "zh" ? "AI 生成完成" : "AI Generation Complete"}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 950,
            color: "var(--c-text)",
            letterSpacing: -0.5,
          }}
        >
          {project?.name ?? (lang === "zh" ? "我的房间" : "My Room")}
        </h1>
        <div
          style={{
            marginTop: 8,
            color: "var(--c-muted)",
            fontSize: 14,
          }}
        >
          {lang === "zh"
            ? "这是你的 AI 设计方案。选择下一步："
            : "Here is your AI-designed room. Choose what to do next:"}
        </div>
      </div>

      {/* Generated image */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 20,
          overflow: "hidden",
          border: "2px solid rgba(45,212,191,0.3)",
          boxShadow: "0 0 60px rgba(45,212,191,0.12)",
          background: "#18181B",
          marginBottom: 32,
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {generatedImageUrl ? (
          <img
            src={generatedImageUrl}
            alt={lang === "zh" ? "AI 生成的房间" : "AI generated room"}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              maxHeight: 480,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--c-muted)",
            }}
          >
            <Box
              size={48}
              color="var(--c-muted)"
              strokeWidth={1}
              style={{ marginBottom: 12 }}
            />
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {lang === "zh" ? "图片加载中或未生成" : "Image loading or not generated yet"}
            </div>
          </div>
        )}
      </div>

      {/* Two action buttons */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Shop button */}
        <button
          type="button"
          onClick={() => nav(`/projects/${id}/shopping-list`)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "28px 20px",
            background: "rgba(45,212,191,0.08)",
            border: "2px solid rgba(45,212,191,0.35)",
            borderRadius: 20,
            cursor: "pointer",
            transition: "all 150ms",
            color: "var(--c-text)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(45,212,191,0.15)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2DD4BF";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(45,212,191,0.08)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(45,212,191,0.35)";
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "rgba(45,212,191,0.12)",
              border: "1px solid rgba(45,212,191,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCart size={24} color="#2DD4BF" strokeWidth={1.8} />
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 950,
                color: "var(--c-text)",
                marginBottom: 4,
              }}
            >
              {lang === "zh" ? "购买家具" : "Shop Items"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--c-muted)",
                lineHeight: 1.5,
              }}
            >
              {lang === "zh"
                ? "查看推荐家具并直接购买"
                : "Browse recommended furniture and buy directly"}
            </div>
          </div>
        </button>

        {/* 3D Editor button */}
        <button
          type="button"
          onClick={() => nav(`/projects/${id}/editor`)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "28px 20px",
            background: "rgba(168,85,247,0.08)",
            border: "2px solid rgba(168,85,247,0.35)",
            borderRadius: 20,
            cursor: "pointer",
            transition: "all 150ms",
            color: "var(--c-text)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(168,85,247,0.15)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#A855F7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(168,85,247,0.08)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(168,85,247,0.35)";
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box size={24} color="#A855F7" strokeWidth={1.8} />
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 950,
                color: "var(--c-text)",
                marginBottom: 4,
              }}
            >
              {lang === "zh" ? "3D 编辑器" : "Edit in 3D"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--c-muted)",
                lineHeight: 1.5,
              }}
            >
              {lang === "zh"
                ? "在 3D 编辑器中自定义你的房间"
                : "Customise your room layout in the 3D editor"}
            </div>
          </div>
        </button>
      </div>

      {/* Regenerate link */}
      <div style={{ marginTop: 24 }}>
        <Link
          to="/upload"
          style={{
            color: "var(--c-muted)",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {lang === "zh" ? "重新生成 →" : "Generate a new design →"}
        </Link>
      </div>
    </div>
  );
}

