import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useProfileStore } from "@/features/survey/store";
import { api } from "@/shared/api";
import type { CatalogProduct } from "@/shared/types";
import { styles } from "@/shared/ui";

import { useSceneStore } from "../store/sceneStore";

const STYLES = ["cozy", "minimal", "study", "social"] as const;
type StyleId = (typeof STYLES)[number];

export function SidePanel() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedId);
  const dispatch = useSceneStore((s) => s.dispatch);
  const recompose = useSceneStore((s) => s.recompose);
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);
  const past = useSceneStore((s) => s.past.length);
  const future = useSceneStore((s) => s.future.length);
  const saving = useSceneStore((s) => s.saving);
  const err = useSceneStore((s) => s.lastError);

  const profileId = useProfileStore((s) => s.profileId);
  const [style, setStyle] = useState<StyleId>("cozy");
  // Default: use profile if present.
  const [useProfile, setUseProfile] = useState<boolean>(true);
  const personalizing = !!profileId && useProfile;

  // Full catalog drives the swap dropdown.
  const { data: catalog } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api.catalog.list(),
  });

  // Ranked catalog — keyed on the active query so we don't stale-cache across modes.
  const recommendKey = personalizing
    ? ["catalog", "recommend", "profile", profileId]
    : ["catalog", "recommend", "style", style];
  const { data: ranked } = useQuery({
    queryKey: recommendKey,
    queryFn: () =>
      api.catalog.recommend(
        personalizing ? { profileId } : { style },
      ),
  });

  const selected = scene?.items.find((i) => i.id === selectedId);
  const allProducts = catalog?.items ?? [];
  const rankedProducts = ranked?.items ?? [];
  const maxDist = rankedProducts.reduce((m, p) => Math.max(m, p.distance), 0) || 1;

  async function add(product: CatalogProduct) {
    await dispatch({
      op: "ADD_ITEM",
      item: {
        id: `it-${Math.random().toString(36).slice(2, 10)}`,
        catalogId: product.id,
        name: product.name,
        position: { x: 0, y: 0, z: 0 },
        rotationYRad: 0,
        scale: 1,
        locked: false,
      },
    });
  }

  const HALF_PI = Math.PI / 2;
  async function rotateBy(d: number) {
    if (!selected || selected.locked) return;
    await dispatch({
      op: "ROTATE_ITEM",
      itemId: selected.id,
      rotationYRad: selected.rotationYRad + d,
    });
  }
  async function toggleLock() {
    if (!selected) return;
    await dispatch({ op: "LOCK_ITEM", itemId: selected.id, locked: !selected.locked });
  }
  async function del() {
    if (!selected || selected.locked) return;
    await dispatch({ op: "DELETE_ITEM", itemId: selected.id });
  }
  async function swap(newCatalogId: string) {
    if (!selected) return;
    await dispatch({ op: "SWAP_ITEM", itemId: selected.id, newCatalogId });
  }

  return (
    <aside
      style={{
        width: 300,
        borderLeft: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.25)",
        overflowY: "auto",
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button style={styles.buttonGhost} onClick={undo} disabled={!past || saving}>
          ↶ Undo
        </button>
        <button style={styles.buttonGhost} onClick={redo} disabled={!future || saving}>
          ↷ Redo
        </button>
        <span style={{ ...styles.muted, fontSize: 11, marginLeft: "auto", alignSelf: "center" }}>
          v{scene?.version ?? "—"}
          {saving ? " · saving…" : ""}
        </span>
      </div>
      {err && <p style={{ ...styles.err, fontSize: 12 }}>{err}</p>}

      <h3 style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>Generate</h3>
      <div style={{ ...styles.card, padding: 12 }}>
        {profileId ? (
          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            <input
              type="checkbox"
              checked={useProfile}
              onChange={(e) => setUseProfile(e.target.checked)}
            />
            Personalize using my style profile
          </label>
        ) : (
          <p style={{ ...styles.muted, fontSize: 11, margin: "0 0 6px" }}>
            <a href="/survey" style={{ color: "#c4b5fd" }}>Take the 5-step survey</a> for personalized picks.
          </p>
        )}
        {!personalizing && (
          <>
            <label style={styles.label}>Style</label>
            <select
              style={styles.input}
              value={style}
              onChange={(e) => setStyle(e.target.value as StyleId)}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        )}
        <button
          style={{ ...styles.button, marginTop: 10, width: "100%" }}
          onClick={() =>
            recompose(personalizing ? { profileId } : { style })
          }
          disabled={saving}
        >
          ✨ Generate scene
        </button>
        <p style={{ ...styles.muted, fontSize: 11, marginTop: 6, marginBottom: 0 }}>
          Locked items are preserved.
        </p>
      </div>

      <h3 style={{ marginTop: 24, fontSize: 14, opacity: 0.9 }}>Selected</h3>
      {selected ? (
        <div style={{ ...styles.card, padding: 12, fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>{selected.name || selected.catalogId}</div>
          <div style={{ ...styles.muted, fontSize: 11, marginTop: 2 }}>
            {selected.position.x.toFixed(2)}, {selected.position.z.toFixed(2)} ·{" "}
            {Math.round((selected.rotationYRad * 180) / Math.PI)}°
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
            <button style={styles.buttonGhost} onClick={() => rotateBy(-HALF_PI)}>⟲ 90°</button>
            <button style={styles.buttonGhost} onClick={() => rotateBy(HALF_PI)}>⟳ 90°</button>
            <button style={styles.buttonGhost} onClick={toggleLock}>
              {selected.locked ? "🔓 Unlock" : "🔒 Lock"}
            </button>
            <button style={styles.buttonGhost} onClick={del} disabled={selected.locked}>
              🗑 Delete
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={styles.label}>Swap to…</label>
            <select
              style={styles.input}
              value={selected.catalogId}
              onChange={(e) => swap(e.target.value)}
            >
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <p style={{ ...styles.muted, fontSize: 13 }}>Click an item to select it.</p>
      )}

      <h3 style={{ marginTop: 24, fontSize: 14, opacity: 0.9 }}>
        Recommended{" "}
        {personalizing ? (
          <em style={{ fontStyle: "normal", color: "#c4b5fd" }}>for you</em>
        ) : (
          <em style={{ fontStyle: "normal", color: "#c4b5fd" }}>for {style}</em>
        )}
      </h3>
      <p style={{ ...styles.muted, fontSize: 11, marginTop: 0, marginBottom: 8 }}>
        Ranked by vector similarity. Bar = match strength.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {rankedProducts.map((p) => {
          const score = Math.max(0, 1 - p.distance / maxDist);
          return (
            <li key={p.id}>
              <button
                onClick={() => add(p)}
                style={{
                  ...styles.buttonGhost,
                  width: "100%",
                  textAlign: "left",
                  display: "block",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      background: p.color,
                      borderRadius: 3,
                    }}
                  />
                  {p.name}
                  <span style={{ ...styles.muted, marginLeft: "auto", fontSize: 11 }}>
                    + Add
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    marginTop: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${score * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #7c5cd6, #c4b5fd)",
                    }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
