import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PROJECT_STAGES, stageIndex } from "@/features/projects/projectLifecycle";
import { ensureProjectMeta, useProjectMetaStore } from "@/features/projects/projectMetaStore";
import { useProfileStore } from "@/features/survey/store";
import { api, ApiError } from "@/shared/api";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

export function ProjectsPage() {
  const qc = useQueryClient();
  const lang = useLangStore((s) => s.lang);
  const profileId = useProfileStore((s) => s.profileId);
  const setProfileId = useProfileStore((s) => s.setProfileId);
  const metaById = useProjectMetaStore((s) => s.byId);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Hydrate the local profile id from the server on mount (e.g. after relogin
  // on a different device the latest profile follows you).
  useEffect(() => {
    if (profileId) return;
    void api.styleProfiles
      .latest()
      .then((p) => setProfileId(p.id))
      .catch((e) => {
        if (!(e instanceof ApiError) || e.status !== 404) {
          // Network or other — leave profileId null silently.
        }
      });
  }, [profileId, setProfileId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.projects.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const duplicate = useMutation({
    mutationFn: (p: { id: string; name: string; roomWidthM: number; roomDepthM: number; roomHeightM: number }) =>
      api.projects.create({
        name: lang === "zh" ? `${p.name}（副本）` : `${p.name} (Copy)`,
        roomWidthM: p.roomWidthM,
        roomDepthM: p.roomDepthM,
        roomHeightM: p.roomHeightM,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  useEffect(() => {
    if (!data?.items?.length) return;
    data.items.forEach((p) => ensureProjectMeta(p.id));
  }, [data?.items]);

  useEffect(() => {
    function onDocClick() {
      setOpenMenuId(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  function stageLabel(stageId: string) {
    const s = PROJECT_STAGES.find((x) => x.id === stageId);
    return s?.label ?? stageId;
  }

  function progressFor(stageId: string) {
    const denom = Math.max(1, PROJECT_STAGES.length - 1);
    return Math.round((stageIndex(stageId as any) / denom) * 100);
  }

  function nextStepHint(stageId: string) {
    const map: Record<string, { en: string; zh: string }> = {
      room_uploaded: { en: "Next: Generate concepts", zh: "下一步：生成方案" },
      room_dna_generated: { en: "Next: Generate concepts", zh: "下一步：生成方案" },
      concepts_generated: { en: "Next: Choose a concept", zh: "下一步：选择方案" },
      design_selected: { en: "Next: Continue editing", zh: "下一步：继续编辑" },
      editing: { en: "Next: Continue editing", zh: "下一步：继续编辑" },
      visualized_3d: { en: "Next: Generate 3D model", zh: "下一步：生成 3D 模型" },
      completed: { en: "Completed", zh: "已完成" },
    };
    const v = map[stageId] ?? { en: "Next: Continue", zh: "下一步：继续" };
    return lang === "zh" ? v.zh : v.en;
  }

  const projects = (data?.items ?? []).slice().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const continueProject = projects[0];

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
            {lang === "zh" ? "空间库" : "LIBRARY"}
          </div>
          <h1 style={{ marginTop: 10, marginBottom: 0 }}>{lang === "zh" ? "我的空间" : "My Spaces"}</h1>
          <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 14, maxWidth: 700, lineHeight: 1.7 }}>
            {lang === "zh" ? "继续打造能反映真实自我的空间。" : "Continue building spaces that reflect who you are."}
          </div>
        </div>

        <Link
          to="/upload"
          style={{
            ...styles.button,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
          }}
        >
          {lang === "zh" ? "创建新空间" : "Create New Space"}
        </Link>
      </div>

      <section style={{ marginTop: 24 }}>
        {isLoading ? (
          <p style={styles.muted}>{lang === "zh" ? "加载中…" : "Loading…"}</p>
        ) : error ? (
          <p style={styles.err}>
            {lang === "zh" ? "错误：" : "Error: "} {(error as Error).message}
          </p>
        ) : projects.length === 0 ? (
          <div style={{ ...styles.card, borderRadius: 18, padding: 22 }}>
            <div style={{ fontWeight: 950, color: "var(--c-text)", fontSize: 18 }}>{lang === "zh" ? "还没有空间" : "No spaces yet"}</div>
            <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 14, lineHeight: 1.7, maxWidth: 720 }}>
              {lang === "zh"
                ? "从上传房间照片开始，生成你的第一个个性化方案。"
                : "Start by uploading your room and generating your first personalized concept."}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link to="/upload" style={{ ...styles.button, textDecoration: "none", display: "inline-flex", fontWeight: 900 }}>
                {lang === "zh" ? "开始设计" : "Start Designing"}
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {continueProject && (
              <div style={{ ...styles.card, borderRadius: 18, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 950, color: "var(--c-text)" }}>{lang === "zh" ? "继续上次的空间" : "Continue Where You Left Off"}</div>
                  <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>
                    {lang === "zh" ? "最近更新：" : "Updated:"} {new Date(continueProject.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {(() => {
                  const stage = metaById[continueProject.id]?.stage ?? "room_uploaded";
                  const pct = progressFor(stage);
                  return (
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 950, color: "var(--c-text)", fontSize: 14 }}>{continueProject.name}</div>
                        <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ color: "#2DD4BF", fontWeight: 900, fontSize: 12 }}>{stageLabel(stage)}</div>
                          <div style={{ color: "var(--c-muted)", fontSize: 12 }}>{nextStepHint(stage)}</div>
                        </div>
                        <div style={{ marginTop: 10, height: 10, borderRadius: 999, background: "#27272A", border: "1px solid rgba(63,63,70,0.8)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #2DD4BF, #A855F7)" }} />
                        </div>
                      </div>
                      <Link
                        to={`/projects/${continueProject.id}`}
                        style={{
                          ...styles.button,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lang === "zh" ? "继续" : "Continue"}
                      </Link>
                    </div>
                  );
                })()}
              </div>
            )}

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {projects.map((p) => {
                const stage = metaById[p.id]?.stage ?? "room_uploaded";
                const pct = progressFor(stage);
                return (
                  <div key={p.id} style={{ position: "relative" }}>
                    <Link
                      to={`/projects/${p.id}`}
                      style={{
                        display: "block",
                        background: "var(--c-card)",
                        border: "1px solid var(--c-card-border)",
                        borderRadius: 18,
                        overflow: "hidden",
                        textDecoration: "none",
                        transition: "border-color 150ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(45,212,191,0.55)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--c-card-border)")}
                    >
                      <div
                        style={{
                          height: 160,
                          background: p.thumbnailUrl ? `url(${p.thumbnailUrl}) center/cover` : "linear-gradient(135deg, #18181B, #27272A)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {!p.thumbnailUrl && <div style={{ fontSize: 36, opacity: 0.3 }}>🛋️</div>}
                      </div>

                      <div style={{ padding: "16px 18px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                          <div style={{ fontWeight: 900, color: "var(--c-text)", fontSize: 15 }}>{p.name}</div>
                          <div style={{ color: "var(--c-muted)", fontSize: 12 }}>{new Date(p.updatedAt).toLocaleDateString()}</div>
                        </div>

                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ color: "#2DD4BF", fontWeight: 900, fontSize: 12 }}>{stageLabel(stage)}</div>
                          <div style={{ color: "var(--c-muted)", fontSize: 12 }}>{nextStepHint(stage)}</div>
                        </div>

                        <div style={{ marginTop: 10, height: 9, borderRadius: 999, background: "#27272A", border: "1px solid rgba(63,63,70,0.8)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #2DD4BF, #A855F7)" }} />
                        </div>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId((cur) => (cur === p.id ? null : p.id));
                      }}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(10,10,10,0.6)",
                        border: "1px solid rgba(63,63,70,0.8)",
                        color: "var(--c-text)",
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(10px)",
                      }}
                      aria-label={lang === "zh" ? "更多操作" : "More actions"}
                    >
                      ⋯
                    </button>

                    {openMenuId === p.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: 48,
                          right: 10,
                          width: 170,
                          background: "var(--c-card)",
                          border: "1px solid var(--c-card-border)",
                          borderRadius: 14,
                          padding: 6,
                          boxShadow: "0 18px 80px rgba(0,0,0,0.55)",
                          zIndex: 50,
                        }}
                      >
                        {[
                          {
                            id: "rename",
                            label: lang === "zh" ? "重命名" : "Rename",
                            onClick: () => {
                              setOpenMenuId(null);
                              setToast(lang === "zh" ? "即将上线" : "Coming soon");
                            },
                          },
                          {
                            id: "duplicate",
                            label: lang === "zh" ? "复制" : "Duplicate",
                            onClick: () => {
                              setOpenMenuId(null);
                              duplicate.mutate({
                                id: p.id,
                                name: p.name,
                                roomWidthM: p.roomWidthM,
                                roomDepthM: p.roomDepthM,
                                roomHeightM: p.roomHeightM,
                              });
                            },
                          },
                          {
                            id: "delete",
                            label: lang === "zh" ? "删除" : "Delete",
                            onClick: () => {
                              setOpenMenuId(null);
                              if (confirm(lang === "zh" ? `删除「${p.name}」？` : `Delete "${p.name}"?`)) remove.mutate(p.id);
                            },
                            danger: true,
                          },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={item.onClick}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              background: "transparent",
                              border: "none",
                              borderRadius: 10,
                              padding: "10px 10px",
                              cursor: "pointer",
                              color: item.danger ? "#FCA5A5" : "var(--c-text)",
                              fontWeight: 900,
                              fontSize: 13,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(63,63,70,0.35)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {toast && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 26,
            transform: "translateX(-50%)",
            background: "var(--c-card)",
            border: "1px solid var(--c-card-border)",
            color: "var(--c-text)",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 900,
            zIndex: 200,
            boxShadow: "0 18px 80px rgba(0,0,0,0.55)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
