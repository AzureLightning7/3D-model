import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProfileStore } from "@/features/survey/store";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

type Lifestyle = "student" | "professional" | "creator" | "other";
type RoomUsage = "study" | "relaxation" | "gaming" | "work" | "socializing";
type DesignPref = "minimalist" | "cozy" | "modern" | "luxury" | "scandinavian" | "industrial";
type Mood = "calm" | "productive" | "energetic" | "creative";

function roomTypeNameFromCode(code: string, lang: "zh" | "en") {
  const key = code.slice(0, 2);
  if (lang === "zh") {
    if (key === "CO") return "舒适学者";
    if (key === "CF") return "平静创作者";
    if (key === "SO") return "社交主人";
    if (key === "SF") return "大胆策展人";
    return "你的房间类型";
  }
  if (key === "CO") return "The Cozy Scholar";
  if (key === "CF") return "The Calm Creator";
  if (key === "SO") return "The Social Host";
  if (key === "SF") return "The Bold Curator";
  return "Your Room Type";
}

function buildDNA(lifestyle: Lifestyle, usage: RoomUsage[], design: DesignPref, mood: Mood, lang: "zh" | "en") {
  const energy = usage.includes("socializing") || usage.includes("gaming") ? "S" : "C";
  const organisation = design === "minimalist" || design === "modern" || design === "scandinavian" ? "O" : "F";

  const palette =
    design === "cozy"
      ? "W"
      : design === "luxury"
        ? "B"
        : design === "industrial"
          ? "C"
          : design === "minimalist" || design === "scandinavian"
            ? "C"
            : "C";

  const budget =
    design === "luxury"
      ? "L"
      : lifestyle === "professional"
        ? "P"
        : lifestyle === "student" || lifestyle === "creator"
          ? "M"
          : "E";

  const code = `${energy}${organisation}${palette}${budget}`;
  const roomTypeName = roomTypeNameFromCode(code, lang);

  const answers = {
    energy: energy === "S" ? ("social" as const) : ("solo" as const),
    organisation: organisation === "O" ? ("ordered" as const) : ("flowing" as const),
    palette: palette === "W" ? ("warm" as const) : palette === "B" ? ("bold" as const) : ("cool" as const),
    budget: budget === "L" ? ("luxury" as const) : budget === "P" ? ("high" as const) : budget === "M" ? ("mid" as const) : ("low" as const),
    planning: mood === "productive" ? ("planned" as const) : ("spontaneous" as const),
    decision_style: mood === "calm" ? ("logical" as const) : ("emotional" as const),
    social_battery: energy === "S" ? ("recharge_social" as const) : ("recharge_alone" as const),
  };

  const interests: string[] = [];
  if (usage.includes("study")) interests.push("reading", "tech");
  if (usage.includes("gaming")) interests.push("gaming");
  if (usage.includes("relaxation")) interests.push("wellness", "film");
  if (usage.includes("work")) interests.push("tech");
  if (usage.includes("socializing")) interests.push("music", "cafe");

  const uniqueInterests = Array.from(new Set(interests)).slice(0, 3);

  return { code, roomTypeName, rawAnswers: { answers, interests: uniqueInterests, onboarding: { lifestyle, usage, design, mood } } };
}

export function OnboardingPage() {
  const nav = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const setRoomDNA = useProfileStore((s) => s.setRoomDNA);
  const setRawAnswers = useProfileStore((s) => s.setRawAnswers);

  const [step, setStep] = useState(0);
  const [lifestyle, setLifestyle] = useState<Lifestyle | null>(null);
  const [usage, setUsage] = useState<RoomUsage[]>([]);
  const [design, setDesign] = useState<DesignPref | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);

  const total = 5;
  const progress = useMemo(() => Math.round(((step + 1) / total) * 100), [step]);

  const canNext =
    (step === 0 && lifestyle) ||
    (step === 1 && usage.length > 0) ||
    (step === 2 && design) ||
    (step === 3 && mood) ||
    step === 4;

  const title = useMemo(() => {
    if (step === 0) return lang === "zh" ? "生活方式" : "Lifestyle";
    if (step === 1) return lang === "zh" ? "房间用途" : "Room Usage";
    if (step === 2) return lang === "zh" ? "设计偏好" : "Design Preferences";
    if (step === 3) return lang === "zh" ? "情绪偏好" : "Mood Preferences";
    return lang === "zh" ? "生成房间基因" : "Generate Room DNA";
  }, [lang, step]);

  function toggleUsage(u: RoomUsage) {
    setUsage((cur) => (cur.includes(u) ? cur.filter((x) => x !== u) : [...cur, u]));
  }

  function next() {
    setStep((s) => Math.min(total - 1, s + 1));
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function finish() {
    if (!lifestyle || !design || !mood || usage.length === 0) return;
    const out = buildDNA(lifestyle, usage, design, mood, lang);
    setRoomDNA(out.code, out.roomTypeName);
    setRawAnswers(out.rawAnswers);
    nav("/dashboard", { replace: true });
  }

  const optionBtn = (selected: boolean) =>
    ({
      width: "100%",
      textAlign: "left",
      background: selected ? "rgba(45,212,191,0.10)" : "var(--c-card)",
      border: selected ? "1px solid rgba(45,212,191,0.35)" : "1px solid var(--c-card-border)",
      color: "var(--c-text)",
      borderRadius: 14,
      padding: "14px 14px",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 14,
    }) as const;

  const labels = useMemo(() => {
    const lifestyle = {
      student: lang === "zh" ? "学生" : "Student",
      professional: lang === "zh" ? "职场" : "Professional",
      creator: lang === "zh" ? "创作者" : "Creator",
      other: lang === "zh" ? "其他" : "Other",
    } as const;
    const usage = {
      study: lang === "zh" ? "学习" : "Study",
      relaxation: lang === "zh" ? "放松" : "Relaxation",
      gaming: lang === "zh" ? "游戏" : "Gaming",
      work: lang === "zh" ? "工作" : "Work",
      socializing: lang === "zh" ? "社交" : "Socializing",
    } as const;
    const design = {
      minimalist: lang === "zh" ? "极简" : "Minimalist",
      cozy: lang === "zh" ? "温馨" : "Cozy",
      modern: lang === "zh" ? "现代" : "Modern",
      luxury: lang === "zh" ? "奢华" : "Luxury",
      scandinavian: lang === "zh" ? "北欧" : "Scandinavian",
      industrial: lang === "zh" ? "工业风" : "Industrial",
    } as const;
    const mood = {
      calm: lang === "zh" ? "平静" : "Calm",
      productive: lang === "zh" ? "高效" : "Productive",
      energetic: lang === "zh" ? "有活力" : "Energetic",
      creative: lang === "zh" ? "有创造力" : "Creative",
    } as const;
    return { lifestyle, usage, design, mood };
  }, [lang]);

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>ONBOARDING</div>
          <h1 style={{ margin: "8px 0 0" }}>{lang === "zh" ? "设置你的房间基因" : "Set up your Room DNA"}</h1>
          <div style={{ marginTop: 8, color: "var(--c-muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>
            {lang === "zh"
              ? "回答几个快速问题，让 DormVibe 为你个性化仪表盘与推荐。"
              : "Answer a few quick questions so DormVibe can personalize your dashboard and recommendations."}
          </div>
        </div>
        <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{progress}%</div>
      </div>

      <div style={{ height: 10, borderRadius: 999, background: "#27272A", border: "1px solid rgba(63,63,70,0.8)", marginTop: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #2DD4BF, #A855F7)" }} />
      </div>

      <div style={{ ...styles.card, borderRadius: 16, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>{title}</div>
          <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>
            {lang === "zh" ? `第 ${step + 1}/${total} 步` : `Step ${step + 1} of ${total}`}
          </div>
        </div>

        {step === 0 && (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {([
              {
                id: "student",
                label: lang === "zh" ? "学生" : "Student",
                sub: lang === "zh" ? "宿舍生活、学习节奏、预算更灵活" : "Dorm life, study routines, flexible budgets",
              },
              {
                id: "professional",
                label: lang === "zh" ? "职场" : "Professional",
                sub: lang === "zh" ? "工作优先、更安静专注、更有结构" : "Work-first flow, calm focus, structure",
              },
              {
                id: "creator",
                label: lang === "zh" ? "创作者" : "Creator",
                sub: lang === "zh" ? "情绪与灵感驱动、需要表达的角落" : "Mood + inspiration, expressive corners",
              },
              { id: "other", label: lang === "zh" ? "其他" : "Other", sub: lang === "zh" ? "混合的作息与需求" : "A mix of routines and needs" },
            ] as const).map((o) => (
              <button key={o.id} type="button" onClick={() => setLifestyle(o.id)} style={optionBtn(lifestyle === o.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div>{o.label}</div>
                  {lifestyle === o.id && <div style={{ color: "#2DD4BF", fontWeight: 950 }}>{lang === "zh" ? "已选择" : "Selected"}</div>}
                </div>
                <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.6, fontWeight: 700 }}>{o.sub}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {([
              { id: "study", label: lang === "zh" ? "学习" : "Study" },
              { id: "relaxation", label: lang === "zh" ? "放松" : "Relaxation" },
              { id: "gaming", label: lang === "zh" ? "游戏" : "Gaming" },
              { id: "work", label: lang === "zh" ? "工作" : "Work" },
              { id: "socializing", label: lang === "zh" ? "社交" : "Socializing" },
            ] as const).map((o) => {
              const selected = usage.includes(o.id);
              return (
                <button key={o.id} type="button" onClick={() => toggleUsage(o.id)} style={optionBtn(selected)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div>{o.label}</div>
                    {selected && <div style={{ color: "#2DD4BF", fontWeight: 950 }}>{lang === "zh" ? "已选择" : "Selected"}</div>}
                  </div>
                </button>
              );
            })}
            <div style={{ color: "var(--c-muted)", fontSize: 12, marginTop: 4 }}>
              {lang === "zh" ? "可多选。" : "Select all that apply."}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {([
              { id: "minimalist", label: lang === "zh" ? "极简" : "Minimalist" },
              { id: "cozy", label: lang === "zh" ? "温馨" : "Cozy" },
              { id: "modern", label: lang === "zh" ? "现代" : "Modern" },
              { id: "luxury", label: lang === "zh" ? "奢华" : "Luxury" },
              { id: "scandinavian", label: lang === "zh" ? "北欧" : "Scandinavian" },
              { id: "industrial", label: lang === "zh" ? "工业风" : "Industrial" },
            ] as const).map((o) => (
              <button key={o.id} type="button" onClick={() => setDesign(o.id)} style={optionBtn(design === o.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div>{o.label}</div>
                  {design === o.id && <div style={{ color: "#2DD4BF", fontWeight: 950 }}>{lang === "zh" ? "已选择" : "Selected"}</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {([
              { id: "calm", label: lang === "zh" ? "平静" : "Calm" },
              { id: "productive", label: lang === "zh" ? "高效" : "Productive" },
              { id: "energetic", label: lang === "zh" ? "有活力" : "Energetic" },
              { id: "creative", label: lang === "zh" ? "有创造力" : "Creative" },
            ] as const).map((o) => (
              <button key={o.id} type="button" onClick={() => setMood(o.id)} style={optionBtn(mood === o.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div>{o.label}</div>
                  {mood === o.id && <div style={{ color: "#2DD4BF", fontWeight: 950 }}>{lang === "zh" ? "已选择" : "Selected"}</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ color: "var(--c-muted)", fontSize: 13, lineHeight: 1.7 }}>
              {lang === "zh"
                ? "准备好了。我们将生成一个初始房间基因档案，你之后可以通过完整测试进一步完善。"
                : "You’re ready. We’ll generate an initial Room DNA profile you can refine later with the full quiz."}
            </div>
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              {[
                { label: lang === "zh" ? "生活方式" : "Lifestyle", value: lifestyle ? labels.lifestyle[lifestyle] : "—" },
                { label: lang === "zh" ? "房间用途" : "Room Usage", value: usage.length ? usage.map((u) => labels.usage[u]).join(", ") : "—" },
                { label: lang === "zh" ? "设计" : "Design", value: design ? labels.design[design] : "—" },
                { label: lang === "zh" ? "情绪" : "Mood", value: mood ? labels.mood[mood] : "—" },
              ].map((x) => (
                <div key={x.label} style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)", borderRadius: 14, padding: 12 }}>
                  <div style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 900 }}>{x.label}</div>
                  <div style={{ marginTop: 6, color: "var(--c-text)", fontSize: 13, fontWeight: 900 }}>{x.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={styles.buttonGhost} onClick={back} disabled={step === 0}>
            {lang === "zh" ? "← 返回" : "← Back"}
          </button>
          {step < total - 1 ? (
            <button type="button" style={styles.button} onClick={next} disabled={!canNext}>
              {lang === "zh" ? "下一步 →" : "Next →"}
            </button>
          ) : (
            <button type="button" style={styles.button} onClick={finish} disabled={!lifestyle || !design || !mood || usage.length === 0}>
              {lang === "zh" ? "开始使用 →" : "Get Started →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

