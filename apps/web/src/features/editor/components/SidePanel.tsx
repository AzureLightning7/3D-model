import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useProfileStore } from "@/features/survey/store";
import { api } from "@/shared/api";
import type { CatalogProduct } from "@/shared/types";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

import { useSceneStore } from "../store/sceneStore";

const STYLES = ["cozy", "minimal", "study", "social"] as const;
type StyleId = (typeof STYLES)[number];

type PanelMode = "start" | "add" | "edit";
type FilterId = "all" | "bed" | "desk" | "storage" | "lighting" | "decor";

export function SidePanel() {
  const lang = useLangStore((s) => s.lang);
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedId);
  const dispatch = useSceneStore((s) => s.dispatch);
  const recompose = useSceneStore((s) => s.recompose);
  const setItemYOffset = useSceneStore((s) => s.setItemYOffset);
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
  const [mode, setMode] = useState<PanelMode>("start");
  const [filter, setFilter] = useState<FilterId>("all");

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

  const filteredRanked = useMemo(() => {
    const bucketFor = (p: CatalogProduct): FilterId => {
      if (p.category === "bed") return "bed";
      if (p.category === "desk" || p.category === "chair") return "desk";
      if (p.category === "wardrobe" || p.category === "storage") return "storage";
      if (p.category === "lamp") return "lighting";
      if (p.category === "decor") return "decor";
      return "all";
    };
    return rankedProducts.filter((p) => {
      if (filter === "all") return true;
      return bucketFor(p) === filter;
    });
  }, [filter, rankedProducts]);

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

  const t = {
    start: lang === "zh" ? "开始" : "Start",
    add: lang === "zh" ? "添加" : "Add Items",
    edit: lang === "zh" ? "编辑" : "Edit Selected",
    startHere: lang === "zh" ? "从这里开始" : "Start Here",
    startDesc:
      lang === "zh"
        ? "根据你的 Room DNA 和房间档案生成一个起始布局。"
        : "Generate a layout based on your Room DNA and room profile.",
    startHint:
      lang === "zh"
        ? "先生成布局，再慢慢个性化。"
        : "Generate a layout first, then personalize it.",
    generate: lang === "zh" ? "生成我的布局" : "Generate My Layout",
    picked: lang === "zh" ? "为你的氛围挑选" : "Picked For Your Vibe",
    pickedDesc:
      lang === "zh"
        ? "一些更适合你的物件。"
        : "A few items that fit you best.",
    clickToEdit: lang === "zh" ? "点击一个家具开始编辑。" : "Click an item to edit it.",
    transform: lang === "zh" ? "变换" : "Transform",
    item: lang === "zh" ? "物件" : "Item",
    danger: lang === "zh" ? "谨慎操作" : "Danger Zone",
    replaceWith: lang === "zh" ? "替换为…" : "Replace With…",
    lock: lang === "zh" ? "锁定" : "Lock Item",
    unlock: lang === "zh" ? "解锁" : "Unlock Item",
    delete: lang === "zh" ? "删除" : "Delete Item",
    personalize: lang === "zh" ? "使用我的风格档案进行个性化推荐" : "Personalize using my style profile",
    quizHintA: lang === "zh" ? "完成风格测试" : "Complete the quiz",
    quizHintB: lang === "zh" ? "以获得个性化推荐" : "to get personalized picks",
    styleLabel: lang === "zh" ? "风格" : "Style",
    browse: lang === "zh" ? "去添加家具" : "Add Items",
    filters: {
      all: lang === "zh" ? "全部" : "All",
      bed: lang === "zh" ? "床" : "Bed",
      desk: lang === "zh" ? "书桌" : "Desk",
      storage: lang === "zh" ? "收纳" : "Storage",
      lighting: lang === "zh" ? "照明" : "Lighting",
      decor: lang === "zh" ? "装饰" : "Decor",
    } satisfies Record<FilterId, string>,
    place: lang === "zh" ? "放置" : "Place",
  };

  const reasonFor = (p: CatalogProduct): string => {
    if (p.category === "desk" || p.category === "chair") {
      return lang === "zh" ? "更适合专注与学习" : "Great for focus";
    }
    if (p.category === "lamp") {
      return lang === "zh" ? "增加温暖与层次" : "Adds warmth";
    }
    if (p.category === "wardrobe" || p.category === "storage") {
      return lang === "zh" ? "让空间更整洁" : "Improves storage";
    }
    if (p.category === "decor") {
      return lang === "zh" ? "增加个性与氛围" : "Adds personality";
    }
    return lang === "zh" ? "让空间更舒服" : "Improves the vibe";
  };

  return (
    <aside
      style={{
        width: 320,
        minWidth: 280,
        maxWidth: 360,
        borderLeft: "1px solid var(--c-card-border)",
        background: "rgba(10,10,10,0.35)",
        overflowY: "auto",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={styles.buttonGhost} onClick={undo} disabled={!past || saving}>
            ↶ {lang === "zh" ? "撤销" : "Undo"}
          </button>
          <button style={styles.buttonGhost} onClick={redo} disabled={!future || saving}>
            ↷ {lang === "zh" ? "重做" : "Redo"}
          </button>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {saving && (
            <div data-testid="saving-indicator" style={{ ...styles.muted, fontSize: 11, fontWeight: 800 }}>
              {lang === "zh" ? "保存中…" : "Saving…"}
            </div>
          )}
        </div>
      </div>
      {err && <p style={{ ...styles.err, fontSize: 12 }}>{err}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          padding: 6,
          borderRadius: 14,
          border: "1px solid var(--c-card-border)",
          background: "rgba(24,24,27,0.7)",
        }}
      >
        {([
          { id: "start", label: t.start },
          { id: "add", label: t.add },
          { id: "edit", label: t.edit },
        ] as Array<{ id: PanelMode; label: string }>).map((x) => {
          const active = mode === x.id;
          return (
            <button
              key={x.id}
              type="button"
              data-testid={`mode-${x.id}`}
              onClick={() => setMode(x.id)}
              style={{
                border: "1px solid " + (active ? "rgba(45,212,191,0.35)" : "transparent"),
                background: active ? "rgba(45,212,191,0.12)" : "transparent",
                color: active ? "var(--c-text)" : "var(--c-muted)",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              {x.label}
            </button>
          );
        })}
      </div>

      {mode === "start" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...styles.card, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 950, color: "var(--c-text)" }}>{t.startHere}</div>
            <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.6 }}>{t.startDesc}</div>
            <button
              type="button"
              data-testid="generate-scene"
              style={{
                ...styles.button,
                marginTop: 12,
                width: "100%",
                padding: "12px 14px",
                fontWeight: 950,
                borderRadius: 14,
              }}
              onClick={() => recompose(personalizing ? { profileId } : { style })}
              disabled={saving}
            >
              ✨ {t.generate}
            </button>
            <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.6 }}>{t.startHint}</div>

            <div style={{ marginTop: 12, borderTop: "1px solid rgba(63,63,70,0.6)", paddingTop: 12 }}>
              {profileId ? (
                <label
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 12,
                    cursor: "pointer",
                    color: "var(--c-muted)",
                    fontWeight: 800,
                  }}
                >
                  <input type="checkbox" checked={useProfile} onChange={(e) => setUseProfile(e.target.checked)} />
                  {t.personalize}
                </label>
              ) : (
                <div style={{ ...styles.muted, fontSize: 12, lineHeight: 1.5 }}>
                  <a href="/survey" style={{ color: "var(--c-accent)", textDecoration: "none", fontWeight: 900 }}>
                    {t.quizHintA}
                  </a>{" "}
                  {t.quizHintB}
                </div>
              )}

              {!personalizing && (
                <div style={{ marginTop: 10 }}>
                  <label style={{ ...styles.label, marginBottom: 6 }}>{t.styleLabel}</label>
                  <select style={styles.input} value={style} onChange={(e) => setStyle(e.target.value as StyleId)}>
                    {STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMode("add")}
                style={{ ...styles.buttonGhost, marginTop: 12, width: "100%", borderRadius: 14, fontWeight: 950 }}
              >
                + {t.browse}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "add" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...styles.card, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 950, color: "var(--c-text)" }}>{t.picked}</div>
            <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.6 }}>{t.pickedDesc}</div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(Object.keys(t.filters) as FilterId[]).map((k) => {
                const active = filter === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilter(k)}
                    style={{
                      borderRadius: 999,
                      padding: "7px 10px",
                      fontSize: 12,
                      fontWeight: 950,
                      cursor: "pointer",
                      border: active ? "1px solid rgba(45,212,191,0.35)" : "1px solid var(--c-card-border)",
                      background: active ? "rgba(45,212,191,0.10)" : "rgba(24,24,27,0.6)",
                      color: active ? "#2DD4BF" : "var(--c-muted)",
                    }}
                  >
                    {t.filters[k]}
                  </button>
                );
              })}
            </div>
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 }}>
            {filteredRanked.map((p) => {
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
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          background: p.color,
                          borderRadius: 3,
                          marginTop: 3,
                          flex: "0 0 auto",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                          <div style={{ color: "var(--c-text)", fontWeight: 950, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.name}
                          </div>
                          <div style={{ ...styles.muted, marginLeft: "auto", fontSize: 11, fontWeight: 900 }}>
                            + {t.place}
                          </div>
                        </div>
                        <div style={{ marginTop: 4, color: "var(--c-muted)", fontSize: 12 }}>{reasonFor(p)}</div>
                        <div
                          style={{
                            height: 2,
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 2,
                            marginTop: 8,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${score * 100}%`,
                              height: "100%",
                              background: "rgba(45,212,191,0.75)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {mode === "edit" && (
        <div style={{ marginTop: 12 }}>
          {!selected ? (
            <div style={{ ...styles.card, padding: 14 }}>
              <div style={{ color: "var(--c-text)", fontWeight: 950, fontSize: 13 }}>{t.clickToEdit}</div>
              <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.6 }}>
                {lang === "zh" ? "提示：先生成布局，再逐个微调。" : "Tip: Generate a layout first, then fine-tune items."}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ ...styles.card, padding: 14 }}>
                <div style={{ color: "var(--c-text)", fontWeight: 950, fontSize: 14 }}>{selected.name || selected.catalogId}</div>
                <div style={{ ...styles.muted, fontSize: 11, marginTop: 6 }}>
                  {selected.position.x.toFixed(2)}, {selected.position.z.toFixed(2)} · {Math.round((selected.rotationYRad * 180) / Math.PI)}°
                </div>
              </div>

              <div style={{ ...styles.card, padding: 14 }}>
                <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 950, letterSpacing: 1.2 }}>{t.transform}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <button style={styles.buttonGhost} onClick={() => rotateBy(-HALF_PI)} disabled={selected.locked}>
                    {lang === "zh" ? "左转 90°" : "Rotate 90°"}
                  </button>
                  <button style={styles.buttonGhost} onClick={() => rotateBy(HALF_PI)} disabled={selected.locked}>
                    {lang === "zh" ? "右转 90°" : "Rotate 90°"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemYOffset(selected.id, (selected.yOffset ?? 0) + 0.3)}
                    title={lang === "zh" ? "上移" : "Raise item"}
                    disabled={selected.locked}
                    style={{
                      background: "rgba(45,212,191,0.10)",
                      border: "1px solid rgba(45,212,191,0.25)",
                      color: "#2DD4BF",
                      borderRadius: 10,
                      padding: "8px 12px",
                      cursor: selected.locked ? "not-allowed" : "pointer",
                      fontSize: 13,
                      fontWeight: 950,
                      opacity: selected.locked ? 0.5 : 1,
                    }}
                  >
                    ↑ {lang === "zh" ? "上移" : "Raise"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemYOffset(selected.id, Math.max(0, (selected.yOffset ?? 0) - 0.3))}
                    title={lang === "zh" ? "下移" : "Lower item"}
                    disabled={selected.locked}
                    style={{
                      background: "rgba(45,212,191,0.10)",
                      border: "1px solid rgba(45,212,191,0.25)",
                      color: "#2DD4BF",
                      borderRadius: 10,
                      padding: "8px 12px",
                      cursor: selected.locked ? "not-allowed" : "pointer",
                      fontSize: 13,
                      fontWeight: 950,
                      opacity: selected.locked ? 0.5 : 1,
                    }}
                  >
                    ↓ {lang === "zh" ? "下移" : "Lower"}
                  </button>
                </div>
              </div>

              <div style={{ ...styles.card, padding: 14 }}>
                <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 950, letterSpacing: 1.2 }}>{t.item}</div>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <button data-testid="lock-toggle" style={styles.buttonGhost} onClick={toggleLock}>
                    {selected.locked ? `🔓 ${t.unlock}` : `🔒 ${t.lock}`}
                  </button>
                  <div>
                    <label style={styles.label}>{t.replaceWith}</label>
                    <select data-testid="swap-select" style={styles.input} value={selected.catalogId} onChange={(e) => swap(e.target.value)} disabled={selected.locked}>
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.card, padding: 14, borderColor: "rgba(239,68,68,0.35)" }}>
                <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 950, letterSpacing: 1.2 }}>{t.danger}</div>
                <button
                  style={{
                    ...styles.buttonGhost,
                    marginTop: 10,
                    width: "100%",
                    borderColor: "rgba(239,68,68,0.35)",
                    color: selected.locked ? "var(--c-muted)" : "var(--c-err)",
                    opacity: selected.locked ? 0.5 : 1,
                    cursor: selected.locked ? "not-allowed" : "pointer",
                  }}
                  onClick={del}
                  disabled={selected.locked}
                >
                  🗑 {t.delete}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 14, ...styles.muted, fontSize: 11, opacity: 0.65 }}>
        v{scene?.version ?? "—"}
      </div>

    </aside>
  );
}
