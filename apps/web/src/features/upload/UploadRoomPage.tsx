import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, ApiError } from "@/shared/api";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

import { useProjectMetaStore } from "@/features/projects/projectMetaStore";

type StepId = "photo" | "analysis" | "details" | "profile" | "save";

type RoomType = "dorm" | "bedroom" | "studio" | "living";

type Analysis = {
  suggestedRoomType: RoomType;
  confidence: number;
  lighting: "bright" | "mixed" | "soft";
  clutter: "low" | "medium" | "high";
  note: string;
};

type RoomDetails = {
  name: string;
  roomType: RoomType;
  widthM: number;
  depthM: number;
  heightM: number;
  existingFurniture: string[];
};

function getSteps(lang: "zh" | "en"): Array<{ id: StepId; title: string; sub: string }> {
  return [
    {
      id: "photo",
      title: lang === "zh" ? "展示你的空间" : "Show Us Your Space",
      sub: lang === "zh" ? "这是你蜕变的起点" : "This is the start of your transformation.",
    },
    {
      id: "analysis",
      title: lang === "zh" ? "我们注意到" : "What We Noticed",
      sub: lang === "zh" ? "让空间更像你" : "A few signals from your space.",
    },
    {
      id: "details",
      title: lang === "zh" ? "开始设计" : "Begin Designing",
      sub: lang === "zh" ? "进入你的项目工作区" : "Enter your workspace and keep building.",
    },
    {
      id: "profile",
      title: lang === "zh" ? "开始设计" : "Begin Designing",
      sub: lang === "zh" ? "进入你的项目工作区" : "Enter your workspace and keep building.",
    },
    {
      id: "save",
      title: lang === "zh" ? "开始设计" : "Begin Designing",
      sub: lang === "zh" ? "进入你的项目工作区" : "Enter your workspace and keep building.",
    },
  ];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roomTypeLabel(t: RoomType, lang: "zh" | "en") {
  if (lang === "zh") {
    if (t === "dorm") return "宿舍";
    if (t === "bedroom") return "卧室";
    if (t === "studio") return "工作室";
    return "客厅";
  }
  if (t === "dorm") return "Dorm Room";
  if (t === "bedroom") return "Bedroom";
  if (t === "studio") return "Studio";
  return "Living Room";
}

function simulateAnalysis(file: File, lang: "zh" | "en"): Promise<Analysis> {
  const seed = file.size % 100;
  const confidence = clamp(0.65 + (seed / 100) * 0.25, 0.65, 0.9);
  const suggestedRoomType: RoomType = seed < 25 ? "dorm" : seed < 50 ? "bedroom" : seed < 75 ? "studio" : "living";
  const lighting: Analysis["lighting"] = seed < 33 ? "bright" : seed < 66 ? "mixed" : "soft";
  const clutter: Analysis["clutter"] = seed < 33 ? "low" : seed < 66 ? "medium" : "high";
  const note =
    lang === "zh"
      ? lighting === "bright"
        ? "检测到强自然光，非常适合安静高效的氛围。"
        : lighting === "soft"
          ? "检测到柔和光线，我们会为你营造温暖的氛围。"
          : "检测到混合光线，我们会平衡任务照明与氛围灯光。"
      : lighting === "bright"
        ? "Strong natural light detected. Great for a calm + productive vibe."
        : lighting === "soft"
          ? "Softer lighting detected. We'll lean into warmth and ambient layers."
          : "Mixed lighting detected. We'll balance task and ambient lighting.";
  return new Promise((resolve) => window.setTimeout(() => resolve({ suggestedRoomType, confidence, lighting, clutter, note }), 1400));
}

export function UploadRoomPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const lang = useLangStore((s) => s.lang);
  const initMeta = useProjectMetaStore((s) => s.init);
  const addAsset = useProjectMetaStore((s) => s.addAsset);
  const addActivity = useProjectMetaStore((s) => s.addActivity);
  const setStage = useProjectMetaStore((s) => s.setStage);

  const STEPS = getSteps(lang);
  const defaultRoomName = lang === "zh" ? "我的房间" : "My Room";

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex]!;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisPhase, setAnalysisPhase] = useState(0);

  const [details, setDetails] = useState<RoomDetails>({
    name: defaultRoomName,
    roomType: "dorm",
    widthM: 3.2,
    depthM: 4.0,
    heightM: 2.6,
    existingFurniture: [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storyStep: 1 | 2 | 3 = step.id === "photo" ? 1 : step.id === "analysis" ? 2 : 3;

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (step.id !== "analysis") return;
    if (!file) return;
    let alive = true;
    setError(null);
    setAnalysis(null);
    setAnalysisPhase(0);

    const phases = [0, 1, 2, 3];
    let i = 0;
    const t = window.setInterval(() => {
      if (!alive) return;
      i += 1;
      setAnalysisPhase(phases[Math.min(i, phases.length - 1)]!);
      if (i >= phases.length - 1) window.clearInterval(t);
    }, 600);

    void simulateAnalysis(file, lang).then((res) => {
      if (!alive) return;
      setAnalysis(res);
      setDetails((d) => ({
        ...d,
        roomType: res.suggestedRoomType,
        name: d.name === defaultRoomName ? roomTypeLabel(res.suggestedRoomType, lang) : d.name,
      }));
    });

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [file, step.id]);

  const insights = useMemo(() => {
    if (!analysis) return [];
    return [
      analysis.lighting === "bright"
        ? lang === "zh"
          ? "明亮自然光很适合专注与学习。"
          : "Bright natural light supports focused work."
        : analysis.lighting === "soft"
          ? lang === "zh"
            ? "柔和光线很适合营造温暖放松的氛围。"
            : "Softer lighting is perfect for warmth and calm."
          : lang === "zh"
            ? "混合光线适合打造层次丰富的氛围。"
            : "Mixed lighting gives you room for layered ambience.",
      lang === "zh" ? "这个布局很有潜力，我们会为你保留清晰动线。" : "Your layout has strong design potential with a clear flow.",
      analysis.clutter === "high"
        ? lang === "zh"
          ? "我们会让空间更“呼吸感”——更开阔、更轻松。"
          : "We can make it feel more open and breathable."
        : lang === "zh"
          ? "我们会强化秩序感，让空间更稳定、更舒服。"
          : "We'll reinforce structure so it feels grounded and comfortable.",
    ].slice(0, 3);
  }, [analysis, lang]);

  const profile = useMemo(() => {
    const tags: string[] = [];
    if (analysis) {
      tags.push(
        analysis.lighting === "bright"
          ? lang === "zh"
            ? "明亮光线"
            : "Bright light"
          : analysis.lighting === "soft"
            ? lang === "zh"
              ? "柔和光线"
              : "Soft light"
            : lang === "zh"
              ? "混合光线"
              : "Mixed light",
      );
      tags.push(
        analysis.clutter === "low"
          ? lang === "zh"
            ? "低杂乱"
            : "Low clutter"
          : analysis.clutter === "high"
            ? lang === "zh"
              ? "高杂乱"
              : "High clutter"
            : lang === "zh"
              ? "中等杂乱"
              : "Medium clutter",
      );
      tags.push(lang === "zh" ? `${Math.round(analysis.confidence * 100)}% 置信度` : `${Math.round(analysis.confidence * 100)}% confidence`);
    }
    if (details.existingFurniture.length)
      tags.push(lang === "zh" ? `${details.existingFurniture.length} 件现有家具` : `${details.existingFurniture.length} existing items`);
    return {
      title: details.name.trim() || defaultRoomName,
      subtitle: `${roomTypeLabel(details.roomType, lang)} · ${details.widthM}m × ${details.depthM}m × ${details.heightM}m`,
      tags,
    };
  }, [analysis, defaultRoomName, details.depthM, details.existingFurniture.length, details.heightM, details.name, details.roomType, details.widthM, lang]);

  const save = useMutation({
    mutationFn: () =>
      api.projects.create({
        name: profile.title,
        roomWidthM: details.widthM,
        roomDepthM: details.depthM,
        roomHeightM: details.heightM,
      }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      initMeta(p.id);
      if (file) {
        addAsset(p.id, { kind: "photo", name: file.name, sizeBytes: file.size, mime: file.type || "image/*" });
      }
      addActivity(p.id, "Room uploaded");
      setStage(p.id, "room_uploaded");
      nav(`/projects/${p.id}`, { replace: true });
    },
    onError: (e) => setError(e instanceof ApiError ? String(e.detail) : (e as Error).message),
  });

  const canNext = useMemo(() => {
    if (step.id === "photo") return !!file;
    if (step.id === "analysis") return !!analysis;
    if (step.id === "details") return details.widthM > 0 && details.depthM > 0 && details.heightM > 0;
    if (step.id === "profile") return true;
    return false;
  }, [analysis, details.depthM, details.heightM, details.name, details.widthM, file, step.id]);

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setError(null);
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>{lang === "zh" ? "设计旅程" : "DESIGN JOURNEY"}</div>
          <h1 style={{ margin: "10px 0 0" }}>{step.title}</h1>
          <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>
            {step.sub}
          </div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
            <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>
              {lang === "zh" ? `第 ${storyStep}/3 步` : `Step ${storyStep} of 3`}
            </div>
            <div style={{ color: "var(--c-accent)", fontSize: 12, fontWeight: 950 }}>
              {storyStep === 1 ? (lang === "zh" ? "上传" : "Upload") : storyStep === 2 ? (lang === "zh" ? "洞察" : "Insights") : lang === "zh" ? "进入" : "Enter"}
            </div>
          </div>
          <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: "#27272A", border: "1px solid rgba(63,63,70,0.8)", overflow: "hidden" }}>
            <div
              style={{
                width: `${storyStep === 1 ? 34 : storyStep === 2 ? 67 : 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #2DD4BF, #A855F7)",
                transition: "width 200ms ease",
              }}
            />
          </div>
        </div>
      </div>

      {error && <div style={{ ...styles.err, marginTop: 12 }}>{error}</div>}

      <div style={{ ...styles.card, borderRadius: 16, marginTop: 14 }}>
        {step.id === "photo" && (
          <div>
            <div
              style={{
                marginTop: 2,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
                alignItems: "stretch",
              }}
            >
              <label
                style={{
                  display: "grid",
                  placeItems: "center",
                  height: 220,
                  borderRadius: 16,
                  border: "1px dashed var(--c-card-border)",
                  background: "rgba(24,24,27,0.35)",
                  cursor: "pointer",
                  padding: 16,
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 10 * 1024 * 1024) {
                      setError(lang === "zh" ? "文件太大" : "File too large");
                      setFile(null);
                      return;
                    }
                    setFile(f);
                  }}
                />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 34, opacity: 0.6 }}>📷</div>
                  <div style={{ marginTop: 10, fontWeight: 950 }}>{lang === "zh" ? "拖拽图片到这里，或点击选择" : "Drag and drop your photo here, or click to select"}</div>
                  <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.5 }}>
                    {lang === "zh" ? "最大 10MB，仅支持图片" : "Max 10MB, images only"}
                  </div>
                </div>
              </label>

              <div
                style={{
                  height: 220,
                  borderRadius: 16,
                  border: "1px solid var(--c-card-border)",
                  overflow: "hidden",
                  background: previewUrl ? `url(${previewUrl}) center/cover` : "linear-gradient(135deg, #18181B, #27272A)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!previewUrl && <div style={{ fontSize: 34, opacity: 0.25 }}>🛋️</div>}
              </div>
            </div>
          </div>
        )}

        {step.id === "analysis" && (
          <div>
            <div style={{ fontWeight: 950, fontSize: 15 }}>{lang === "zh" ? "2. 我们注意到" : "2. What We Noticed"}</div>
            <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.6 }}>
              {analysis ? (lang === "zh" ? "高置信度" : "High Confidence") : lang === "zh" ? "正在理解你的空间…" : "Understanding your space…"}
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <div
                style={{
                  height: 220,
                  borderRadius: 16,
                  border: "1px solid var(--c-card-border)",
                  overflow: "hidden",
                  background: previewUrl ? `url(${previewUrl}) center/cover` : "linear-gradient(135deg, #18181B, #27272A)",
                }}
              />
              <div style={{ display: "grid", gap: 10 }}>
                {(analysis ? insights : [0, 1, 2]).map((x, idx) => {
                  const done = analysis ? true : analysisPhase >= idx + 1;
                  const label = analysis ? x : "…";
                  return (
                    <div key={`${idx}-${analysis ? x : "pending"}`} style={{ padding: 12, borderRadius: 14, background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                        <div style={{ color: done ? "var(--c-text)" : "var(--c-muted)", fontSize: 13, fontWeight: 900, lineHeight: 1.6 }}>
                          {label}
                        </div>
                        <div style={{ color: done ? "#2DD4BF" : "var(--c-muted)", fontSize: 12, fontWeight: 950 }}>{done ? "✓" : "…"}</div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ height: 10, borderRadius: 999, background: "#27272A", border: "1px solid rgba(63,63,70,0.8)", marginTop: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${analysis ? 100 : clamp((analysisPhase / 3) * 100, 8, 88)}%`,
                      background: "linear-gradient(90deg, #2DD4BF, #A855F7)",
                      transition: "width 250ms ease",
                    }}
                  />
                </div>

                {analysis && (
                  <div style={{ marginTop: 8, padding: 12, borderRadius: 14, background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
                    <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>{lang === "zh" ? "空间类型" : "ROOM TYPE"}</div>
                    <div style={{ marginTop: 8, color: "var(--c-text)", fontSize: 14, fontWeight: 950 }}>
                      {roomTypeLabel(analysis.suggestedRoomType, lang)}
                    </div>
                    <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.6 }}>{analysis.note}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(step.id === "details" || step.id === "profile" || step.id === "save") && (
          <div>
            <div style={{ fontWeight: 950, fontSize: 15 }}>{lang === "zh" ? "3. 开始设计" : "3. Begin Designing"}</div>
            <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.7 }}>
              {lang === "zh" ? "你的房间潜力：" : "Your Room's Potential:"}{" "}
              <span style={{ color: "var(--c-text)", fontWeight: 900 }}>
                {analysis ? analysis.note : lang === "zh" ? "我们将把它变成更像你的空间。" : "We'll turn it into a space that feels more like you."}
              </span>
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "start" }}>
              <div style={{ ...styles.card, borderRadius: 16, padding: 14 }}>
                <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? "项目名称（可选）" : "Project name (optional)"}</div>
                <input
                  style={{ ...styles.input, marginTop: 6, borderRadius: 12 }}
                  value={details.name}
                  onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                  placeholder={defaultRoomName}
                />

                <div style={{ marginTop: 12, color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? "房间类型" : "Room type"}</div>
                <select
                  style={{ ...styles.input, marginTop: 6, borderRadius: 12 }}
                  value={details.roomType}
                  onChange={(e) => setDetails((d) => ({ ...d, roomType: e.target.value as RoomType }))}
                >
                  <option value="dorm">{lang === "zh" ? "宿舍" : "Dorm Room"}</option>
                  <option value="bedroom">{lang === "zh" ? "卧室" : "Bedroom"}</option>
                  <option value="studio">{lang === "zh" ? "工作室" : "Studio"}</option>
                  <option value="living">{lang === "zh" ? "客厅" : "Living Room"}</option>
                </select>
              </div>

              <div style={{ ...styles.card, borderRadius: 16, padding: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  style={{
                    ...styles.buttonGhost,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 14,
                    fontWeight: 950,
                  }}
                >
                  <span>{lang === "zh" ? "高级精度设置" : "Advanced Accuracy Settings"}</span>
                  <span style={{ color: "var(--c-muted)", fontWeight: 950 }}>{showAdvanced ? "–" : "+"}</span>
                </button>

                {showAdvanced && (
                  <div style={{ marginTop: 12, display: "grid", gap: 14 }}>
                    <div>
                      <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? "现有家具" : "Existing furniture"}</div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[
                          { key: "Bed", label: lang === "zh" ? "床" : "Bed" },
                          { key: "Desk", label: lang === "zh" ? "书桌" : "Desk" },
                          { key: "Chair", label: lang === "zh" ? "椅子" : "Chair" },
                          { key: "Sofa", label: lang === "zh" ? "沙发" : "Sofa" },
                          { key: "Wardrobe", label: lang === "zh" ? "衣柜" : "Wardrobe" },
                          { key: "Shelves", label: lang === "zh" ? "书架" : "Shelves" },
                          { key: "Lamp", label: lang === "zh" ? "台灯" : "Lamp" },
                        ].map((x) => {
                          const selected = details.existingFurniture.includes(x.key);
                          return (
                            <button
                              key={x.key}
                              type="button"
                              onClick={() =>
                                setDetails((d) => ({
                                  ...d,
                                  existingFurniture: selected ? d.existingFurniture.filter((i) => i !== x.key) : [...d.existingFurniture, x.key],
                                }))
                              }
                              style={{
                                borderRadius: 999,
                                padding: "8px 10px",
                                fontSize: 12,
                                fontWeight: 900,
                                cursor: "pointer",
                                border: selected ? "1px solid rgba(45,212,191,0.35)" : "1px solid var(--c-card-border)",
                                background: selected ? "rgba(45,212,191,0.10)" : "var(--c-card)",
                                color: selected ? "#2DD4BF" : "var(--c-text)",
                              }}
                            >
                              {x.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? "尺寸（米）" : "Size (meters)"}</div>
                      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                        <div>
                          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 800 }}>{lang === "zh" ? "宽度" : "Width"}</div>
                          <input
                            type="number"
                            step="0.1"
                            min={1}
                            style={{ ...styles.input, marginTop: 6, borderRadius: 12 }}
                            value={details.widthM}
                            onChange={(e) => setDetails((d) => ({ ...d, widthM: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 800 }}>{lang === "zh" ? "深度" : "Depth"}</div>
                          <input
                            type="number"
                            step="0.1"
                            min={1}
                            style={{ ...styles.input, marginTop: 6, borderRadius: 12 }}
                            value={details.depthM}
                            onChange={(e) => setDetails((d) => ({ ...d, depthM: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 800 }}>{lang === "zh" ? "高度" : "Height"}</div>
                          <input
                            type="number"
                            step="0.1"
                            min={2}
                            style={{ ...styles.input, marginTop: 6, borderRadius: 12 }}
                            value={details.heightM}
                            onChange={(e) => setDetails((d) => ({ ...d, heightM: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 10, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.6 }}>
                        {lang === "zh" ? "更精确的尺寸会让编辑体验更顺畅。" : "More accurate dimensions make editing feel smoother."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 14, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.7 }}>
              {lang === "zh"
                ? "下一步：你将进入项目工作区，继续在 3D 编辑器中设计你的空间。"
                : "Next you'll enter your project workspace and continue designing your space."}
            </div>
          </div>
        )}

      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <button type="button" style={styles.buttonGhost} onClick={goBack} disabled={stepIndex === 0 || save.isPending}>
          {lang === "zh" ? "← 返回" : "← Back"}
        </button>
        {step.id === "photo" ? (
          <button type="button" style={styles.button} onClick={goNext} disabled={!canNext || save.isPending}>
            {lang === "zh" ? "开始蜕变" : "Start the Transformation"}
          </button>
        ) : step.id === "analysis" ? (
          <button type="button" style={styles.button} onClick={goNext} disabled={!canNext || save.isPending}>
            {lang === "zh" ? "继续" : "Continue"}
          </button>
        ) : (
          <button type="button" style={styles.button} onClick={() => save.mutate()} disabled={!canNext || save.isPending}>
            {save.isPending ? (lang === "zh" ? "进入中…" : "Entering…") : lang === "zh" ? "开始设计" : "Begin Designing"}
          </button>
        )}
      </div>
    </div>
  );
}

