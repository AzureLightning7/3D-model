import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useProfileStore } from "@/features/survey/store";
import { api } from "@/shared/api";
import { styles } from "@/shared/ui";

import { buildRoomDnaProfile } from "../room-dna/model";
import { PROJECT_STAGES, type ProjectStage, maxStage } from "./projectLifecycle";
import { ensureProjectMeta, useProjectMetaStore } from "./projectMetaStore";

function deriveStage(args: {
  metaStage: ProjectStage | null;
  hasRoomDna: boolean;
  sceneItemCount: number;
  lockedCount: number;
}): ProjectStage {
  let stage: ProjectStage = args.metaStage ?? "room_uploaded";
  if (args.hasRoomDna) stage = maxStage(stage, "room_dna_generated");
  if (args.sceneItemCount > 0) stage = maxStage(stage, "editing");
  if (args.lockedCount > 0) stage = maxStage(stage, "design_selected");
  return stage;
}

export function ProjectOverviewPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { id = "" } = useParams<{ id: string }>();

  const roomDNA = useProfileStore((s) => s.roomDNA);
  const roomTypeName = useProfileStore((s) => s.roomTypeName);
  const rawAnswers = useProfileStore((s) => s.rawAnswers);
  const roomProfile = buildRoomDnaProfile(rawAnswers, roomDNA, roomTypeName);

  const meta = useProjectMetaStore((s) => (id ? s.byId[id] : undefined));
  const setStage = useProjectMetaStore((s) => s.setStage);
  const addActivity = useProjectMetaStore((s) => s.addActivity);
  const selectConcept = useProjectMetaStore((s) => s.selectConcept);
  const upsertConcepts = useProjectMetaStore((s) => s.upsertConcepts);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => api.projects.get(id),
    enabled: !!id,
  });

  const genConcepts = useMutation({
    mutationFn: async () => {
      const concepts = [
        { id: "c1", title: "Calm Focus", status: "draft" as const },
        { id: "c2", title: "Warm Cozy", status: "draft" as const },
        { id: "c3", title: "Bold Energy", status: "draft" as const },
      ];
      return concepts;
    },
    onSuccess: (concepts) => {
      if (!id) return;
      ensureProjectMeta(id);
      upsertConcepts(id, concepts);
      addActivity(id, "Concepts generated");
      setStage(id, "concepts_generated");
      qc.invalidateQueries({ queryKey: ["projects", id] });
    },
  });

  if (isLoading) return <div style={styles.page}>Loading…</div>;
  if (error || !project) {
    return (
      <div style={styles.page}>
        <p style={styles.err}>Failed to load project.</p>
        <Link to="/projects" style={{ color: "var(--c-accent)" }}>
          ← Back
        </Link>
      </div>
    );
  }

  ensureProjectMeta(project.id);

  const lockedCount = project.scene.items.filter((i) => i.locked).length;
  const stage = deriveStage({
    metaStage: meta?.stage ?? null,
    hasRoomDna: !!roomDNA,
    sceneItemCount: project.scene.items.length,
    lockedCount,
  });

  const stageIdx = PROJECT_STAGES.findIndex((s) => s.id === stage);
  const progressPct = Math.max(10, Math.round(((stageIdx + 1) / PROJECT_STAGES.length) * 100));

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <Link to="/projects" style={{ color: "var(--c-accent)", fontSize: 13 }}>
            ← Projects
          </Link>
          <h1 style={{ margin: "6px 0 0" }}>{project.name}</h1>
          <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 13 }}>
            {project.roomWidthM}m × {project.roomDepthM}m × {project.roomHeightM}m · {project.scene.items.length} items
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={styles.buttonGhost}
            onClick={() => {
              ensureProjectMeta(project.id);
              addActivity(project.id, "Entered editor");
              setStage(project.id, maxStage(stage, "editing"));
              nav(`/projects/${project.id}/editor`);
            }}
          >
            Continue Editing →
          </button>
        </div>
      </div>

      <div style={{ ...styles.card, borderRadius: 16, marginTop: 16, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950, color: "var(--c-text)" }}>Project status</div>
          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{progressPct}%</div>
        </div>
        <div style={{ marginTop: 10, height: 10, borderRadius: 999, background: "#27272A", border: "1px solid rgba(63,63,70,0.8)", overflow: "hidden" }}>
          <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #2DD4BF, #A855F7)" }} />
        </div>
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {PROJECT_STAGES.map((s, idx) => {
            const done = idx <= stageIdx;
            return (
              <div
                key={s.id}
                style={{
                  background: done ? "rgba(45,212,191,0.10)" : "var(--c-card)",
                  border: done ? "1px solid rgba(45,212,191,0.25)" : "1px solid var(--c-card-border)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 950, color: "var(--c-text)" }}>{s.label}</div>
                  <div style={{ color: done ? "#2DD4BF" : "var(--c-muted)", fontWeight: 950 }}>{done ? "✓" : ""}</div>
                </div>
                <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.55 }}>{s.description}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={styles.buttonGhost}
            onClick={() => {
              ensureProjectMeta(project.id);
              setStage(project.id, "completed");
              addActivity(project.id, "Marked as completed");
            }}
          >
            Mark Completed
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
        <section style={{ ...styles.card, borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
            <div style={{ fontWeight: 950, color: "var(--c-text)" }}>Room DNA summary</div>
            <Link to="/room-dna" style={{ color: "var(--c-accent)", fontSize: 12, fontWeight: 900, textDecoration: "none" }}>
              View full profile →
            </Link>
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
            <div style={{ color: "var(--c-accent)", fontSize: 34, fontWeight: 950, letterSpacing: 8 }}>{roomProfile.code ?? "—"}</div>
            <div style={{ color: "var(--c-text)", fontSize: 14, fontWeight: 950 }}>
              {roomProfile.code ? roomProfile.personalityTitle : "Take the quiz to personalize this project."}
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {roomProfile.personalityTraits.slice(0, 4).map((t) => (
              <div
                key={t}
                style={{
                  background: "rgba(45,212,191,0.10)",
                  border: "1px solid rgba(45,212,191,0.22)",
                  color: "#2DD4BF",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...styles.card, borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
            <div style={{ fontWeight: 950, color: "var(--c-text)" }}>Generated concepts</div>
            <button type="button" style={styles.buttonGhost} onClick={() => genConcepts.mutate()} disabled={genConcepts.isPending}>
              {genConcepts.isPending ? "Generating…" : "Generate concepts"}
            </button>
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {(meta?.concepts?.length ? meta.concepts : []).length ? (
              meta!.concepts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    ensureProjectMeta(project.id);
                    selectConcept(project.id, c.id);
                    addActivity(project.id, `Concept selected: ${c.title}`);
                    setStage(project.id, maxStage(stage, "design_selected"));
                  }}
                  style={{
                    textAlign: "left",
                    borderRadius: 14,
                    padding: 12,
                    cursor: "pointer",
                    border: c.status === "selected" ? "1px solid rgba(45,212,191,0.35)" : "1px solid var(--c-card-border)",
                    background: c.status === "selected" ? "rgba(45,212,191,0.10)" : "var(--c-card)",
                    color: "var(--c-text)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 13 }}>{c.title}</div>
                    {c.status === "selected" && <div style={{ color: "#2DD4BF", fontWeight: 950, fontSize: 12 }}>Selected</div>}
                  </div>
                  <div style={{ marginTop: 8, height: 80, borderRadius: 12, background: "linear-gradient(135deg, #18181B, #27272A)", border: "1px solid rgba(63,63,70,0.8)" }} />
                </button>
              ))
            ) : (
              <div style={{ color: "var(--c-muted)", fontSize: 13 }}>
                No concepts yet. Generate concepts to explore a few directions before editing.
              </div>
            )}
          </div>
        </section>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
        <section style={{ ...styles.card, borderRadius: 16 }}>
          <div style={{ fontWeight: 950, color: "var(--c-text)" }}>Assets</div>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {meta?.assets?.length ? (
              meta.assets.map((a) => (
                <div
                  key={`${a.kind}-${a.name}-${a.sizeBytes}`}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "var(--c-card)",
                    border: "1px solid var(--c-card-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "baseline",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--c-text)", fontWeight: 950, fontSize: 13 }}>{a.name}</div>
                    <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 12 }}>
                      {a.mime} · {(a.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{a.kind}</div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--c-muted)", fontSize: 13 }}>No assets saved yet. Upload flow will attach the room photo here.</div>
            )}
          </div>
        </section>

        <section style={{ ...styles.card, borderRadius: 16 }}>
          <div style={{ fontWeight: 950, color: "var(--c-text)" }}>Activity history</div>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {(meta?.activity ?? []).length ? (
              meta!.activity.map((a) => (
                <div
                  key={`${a.at}-${a.label}`}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "var(--c-card)",
                    border: "1px solid var(--c-card-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ color: "var(--c-text)", fontWeight: 900, fontSize: 13 }}>{a.label}</div>
                  <div style={{ color: "var(--c-muted)", fontSize: 12 }}>{new Date(a.at).toLocaleString()}</div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--c-muted)", fontSize: 13 }}>No activity yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

