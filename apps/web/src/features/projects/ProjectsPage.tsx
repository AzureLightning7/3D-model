import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useProfileStore } from "@/features/survey/store";
import { api, ApiError } from "@/shared/api";
import { styles } from "@/shared/ui";

export function ProjectsPage() {
  const qc = useQueryClient();
  const profileId = useProfileStore((s) => s.profileId);
  const setProfileId = useProfileStore((s) => s.setProfileId);

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

  const [name, setName] = useState("");
  const [width, setWidth] = useState(3.5);
  const [depth, setDepth] = useState(4.0);
  const [height, setHeight] = useState(2.6);

  const create = useMutation({
    mutationFn: () =>
      api.projects.create({
        name,
        roomWidthM: width,
        roomDepthM: depth,
        roomHeightM: height,
      }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.projects.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div style={styles.page}>
      <h1>Your projects</h1>

      <div
        style={{
          ...styles.card,
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
        }}
      >
        <div>
          <strong style={{ fontSize: 14 }}>
            {profileId ? "Your style profile is set" : "Personalize your designs"}
          </strong>
          <div style={{ ...styles.muted, fontSize: 12, marginTop: 2 }}>
            {profileId
              ? "DormVibe ranks the catalog by your taste. Retake anytime."
              : "5 quick picks. Generates a vector that ranks the catalog for you."}
          </div>
        </div>
        <Link
          to="/survey"
          style={{
            ...styles.button,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            fontSize: 13,
            padding: "0.4rem 0.8rem",
          }}
        >
          {profileId ? "Retake survey" : "Start survey"}
        </Link>
      </div>

      <section style={{ ...styles.card, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>New project</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}
        >
          <div>
            <label style={styles.label}>Name</label>
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label style={styles.label}>Width (m)</label>
            <input style={styles.input} type="number" step="0.1" value={width} onChange={(e) => setWidth(+e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Depth (m)</label>
            <input style={styles.input} type="number" step="0.1" value={depth} onChange={(e) => setDepth(+e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Height (m)</label>
            <input style={styles.input} type="number" step="0.1" value={height} onChange={(e) => setHeight(+e.target.value)} />
          </div>
          <button style={styles.button} disabled={create.isPending}>
            {create.isPending ? "…" : "Create"}
          </button>
        </form>
        {create.error && <p style={styles.err}>{(create.error as Error).message}</p>}
      </section>

      <section style={{ marginTop: 24 }}>
        {isLoading ? (
          <p style={styles.muted}>Loading…</p>
        ) : error ? (
          <p style={styles.err}>Error: {(error as Error).message}</p>
        ) : data?.items.length === 0 ? (
          <p style={styles.muted}>No projects yet. Create one above.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
            {data?.items.map((p) => (
              <li key={p.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Link to={`/projects/${p.id}/editor`} style={{ color: "#c4b5fd", fontSize: 16, fontWeight: 600 }}>
                    {p.name}
                  </Link>
                  <div style={{ ...styles.muted, fontSize: 12, marginTop: 4 }}>
                    {p.roomWidthM} × {p.roomDepthM} × {p.roomHeightM} m · {p.scene.items.length} items
                  </div>
                </div>
                <button
                  style={styles.buttonGhost}
                  onClick={() => {
                    if (confirm(`Delete "${p.name}"?`)) remove.mutate(p.id);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
