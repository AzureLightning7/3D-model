import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, ApiError } from "@/shared/api";
import type { SurveyAnswer } from "@/shared/types";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";
import { Check, Download, Share2 } from "lucide-react";

import { useProfileStore } from "./store";

type PersonalityOption = {
  id: string;
  label: string;
  emoji: string;
  subtitle: string;
};

type PersonalityQuestion = {
  id: keyof QuizAnswers;
  title: string;
  a: PersonalityOption;
  b: PersonalityOption;
};

type PaletteId = "warm" | "cool" | "bold";
type BudgetId = "low" | "mid" | "high" | "luxury";

type QuizAnswers = Partial<{
  energy: "solo" | "social";
  space_feel: "detail" | "vibe";
  organisation: "ordered" | "flowing";
  change: "stable" | "refresh";
  social_battery: "recharge_alone" | "recharge_social";
  decision_style: "logical" | "emotional";
  planning: "planned" | "spontaneous";
  info_style: "concrete" | "abstract";
  workspace: "separate" | "blended";
  nature: "nature_lover" | "urban";
  display: "display_collections" | "hide_clutter";
  lighting_pref: "ambient" | "bright";
  palette: PaletteId;
  budget: BudgetId;
  origin: string;
}>;

function sectionLabels(lang: "zh" | "en") {
  return [
    lang === "zh" ? "你的性格" : "Your Personality",
    lang === "zh" ? "你的兴趣" : "Your Interests",
    lang === "zh" ? "你的实际需求" : "Your Practical Needs",
  ] as const;
}

function basePersonalityQuestions(lang: "zh" | "en"): PersonalityQuestion[] {
  return [
    {
      id: "energy",
      title: lang === "zh" ? "你如何补充能量？" : "How do you recharge?",
      a: {
        id: "solo",
        label: lang === "zh" ? "独处充电" : "I recharge alone",
        emoji: "🌙",
        subtitle: lang === "zh" ? "安静的夜晚，属于自己的空间" : "quiet evenings, my own space",
      },
      b: {
        id: "social",
        label: lang === "zh" ? "与人相处充电" : "I recharge with people",
        emoji: "☀️",
        subtitle: lang === "zh" ? "开着音乐，总有事情发生" : "music on, always something happening",
      },
    },
    {
      id: "space_feel",
      title: lang === "zh" ? "你更关注空间的什么？" : "What do you notice most in a space?",
      a: {
        id: "detail",
        label: lang === "zh" ? "我会注意每个细节" : "I notice every detail",
        emoji: "🔍",
        subtitle: lang === "zh" ? "材质、摆放、对称与秩序" : "textures, arrangement, symmetry",
      },
      b: {
        id: "vibe",
        label: lang === "zh" ? "更在意整体感觉" : "I care about the overall feeling",
        emoji: "🌊",
        subtitle: lang === "zh" ? "感觉对了，比看起来完美更重要" : "does it feel right, not does it look perfect",
      },
    },
    {
      id: "organisation",
      title: lang === "zh" ? "你更偏好的收纳/秩序是？" : "How do you like things organized?",
      a: {
        id: "ordered",
        label: lang === "zh" ? "一切都有归处" : "Everything has a place",
        emoji: "📦",
        subtitle: lang === "zh" ? "我喜欢系统和一致性" : "I like systems and consistency",
      },
      b: {
        id: "flowing",
        label: lang === "zh" ? "跟着感觉走" : "I go with what feels right",
        emoji: "🎨",
        subtitle: lang === "zh" ? "想重新布置就重新布置" : "I rearrange when I feel like it",
      },
    },
    {
      id: "change",
      title: lang === "zh" ? "你对变化的态度是？" : "How do you feel about changing your setup?",
      a: {
        id: "stable",
        label: lang === "zh" ? "布置一次，长期保持" : "Set it up once, keep it",
        emoji: "🏡",
        subtitle: lang === "zh" ? "稳定感让我安心" : "consistency feels safe and calm",
      },
      b: {
        id: "refresh",
        label: lang === "zh" ? "喜欢经常更新" : "I love refreshing things",
        emoji: "🔄",
        subtitle: lang === "zh" ? "新布局，新能量" : "new arrangement, new energy",
      },
    },
  ];
}

function detailedPersonalityQuestions(lang: "zh" | "en"): PersonalityQuestion[] {
  return [
    {
      id: "lighting_pref",
      title: lang === "zh" ? "你更喜欢哪种灯光？" : "Which lighting feels best?",
      a: {
        id: "ambient",
        label: lang === "zh" ? "温暖氛围灯光" : "Warm ambient lighting",
        emoji: "🕯️",
        subtitle: lang === "zh" ? "柔和暖光，安静舒适" : "soft glow, calm, cozy",
      },
      b: {
        id: "bright",
        label: lang === "zh" ? "明亮自然光" : "Bright daylight lighting",
        emoji: "💡",
        subtitle: lang === "zh" ? "清晰提神，适合专注" : "clear, energizing, task-ready",
      },
    },
    {
      id: "social_battery",
      title: lang === "zh" ? "社交对你的能量影响？" : "How does socializing affect your energy?",
      a: {
        id: "recharge_alone",
        label: lang === "zh" ? "需要独处恢复能量" : "Need alone time to recharge",
        emoji: "🔋",
        subtitle: lang === "zh" ? "社交会让我消耗" : "Social events drain me",
      },
      b: {
        id: "recharge_social",
        label: lang === "zh" ? "与人相处更有能量" : "Get energy from people",
        emoji: "⚡",
        subtitle: lang === "zh" ? "越热闹越开心" : "The more the merrier",
      },
    },
    {
      id: "decision_style",
      title: lang === "zh" ? "你如何做决定？" : "How do you make decisions?",
      a: {
        id: "logical",
        label: lang === "zh" ? "我用理性做决定" : "I make decisions with my head",
        emoji: "🧮",
        subtitle: lang === "zh" ? "先分析，再判断" : "Logic and analysis first",
      },
      b: {
        id: "emotional",
        label: lang === "zh" ? "我用感受做决定" : "I make decisions with my heart",
        emoji: "💗",
        subtitle: lang === "zh" ? "感受对了最重要" : "How it feels matters most",
      },
    },
    {
      id: "planning",
      title: lang === "zh" ? "你更偏向计划还是随性？" : "Do you prefer planning or spontaneity?",
      a: {
        id: "planned",
        label: lang === "zh" ? "我喜欢提前规划" : "I plan everything in advance",
        emoji: "📅",
        subtitle: lang === "zh" ? "清单、日程、结构" : "Lists, schedules, structure",
      },
      b: {
        id: "spontaneous",
        label: lang === "zh" ? "我更随性灵活" : "I prefer to go with the flow",
        emoji: "🌊",
        subtitle: lang === "zh" ? "灵活比计划更重要" : "Flexibility over fixed plans",
      },
    },
    {
      id: "info_style",
      title: lang === "zh" ? "你更关注细节还是可能性？" : "Do you focus on details or possibilities?",
      a: {
        id: "concrete",
        label: lang === "zh" ? "我关注事实与细节" : "I focus on facts and details",
        emoji: "🔎",
        subtitle: lang === "zh" ? "看见当下，而不是想象" : "What is, not what could be",
      },
      b: {
        id: "abstract",
        label: lang === "zh" ? "我喜欢可能性与灵感" : "I love patterns and possibilities",
        emoji: "🔮",
        subtitle: lang === "zh" ? "更在意整体与趋势" : "Big picture thinking",
      },
    },
    {
      id: "workspace",
      title: lang === "zh" ? "你喜欢怎样的空间分区？" : "How do you like to use zones in your space?",
      a: {
        id: "separate",
        label: lang === "zh" ? "工作与放松分区" : "Work and relax in different zones",
        emoji: "🗂️",
        subtitle: lang === "zh" ? "活动边界清晰" : "Clear separation of activities",
      },
      b: {
        id: "blended",
        label: lang === "zh" ? "随时随地都能发生" : "Everything can happen anywhere",
        emoji: "🌀",
        subtitle: lang === "zh" ? "床也可以是办公位" : "My bed is also my office",
      },
    },
    {
      id: "nature",
      title: lang === "zh" ? "你更喜欢自然还是城市感？" : "Do you prefer nature or urban style?",
      a: {
        id: "nature_lover",
        label: lang === "zh" ? "喜欢植物与自然元素" : "I love plants and natural elements",
        emoji: "🌿",
        subtitle: lang === "zh" ? "自然感设计让我舒服" : "Biophilic design speaks to me",
      },
      b: {
        id: "urban",
        label: lang === "zh" ? "更爱干净工业风" : "I prefer clean and industrial",
        emoji: "🏙️",
        subtitle: lang === "zh" ? "极简、现代、城市感" : "Minimal, modern, urban",
      },
    },
    {
      id: "display",
      title: lang === "zh" ? "你更偏好展示还是隐藏？" : "Do you like to display or hide your things?",
      a: {
        id: "display_collections",
        label: lang === "zh" ? "喜欢展示我的收藏" : "I love displaying my things",
        emoji: "🖼️",
        subtitle: lang === "zh" ? "书籍、艺术、收藏要看得见" : "Books, art, collections on show",
      },
      b: {
        id: "hide_clutter",
        label: lang === "zh" ? "更偏爱隐藏收纳" : "I prefer hidden storage",
        emoji: "📦",
        subtitle: lang === "zh" ? "台面干净，杂物藏起来" : "Clean surfaces, hidden mess",
      },
    },
  ];
}

function interestChips(lang: "zh" | "en"): { id: string; label: string }[] {
  return [
    { id: "reading", label: `📚 ${lang === "zh" ? "阅读" : "Reading"}` },
    { id: "music", label: `🎵 ${lang === "zh" ? "音乐" : "Music"}` },
    { id: "gaming", label: `🎮 ${lang === "zh" ? "游戏" : "Gaming"}` },
    { id: "art", label: `🎨 ${lang === "zh" ? "艺术" : "Art & Drawing"}` },
    { id: "plants", label: `🌱 ${lang === "zh" ? "植物" : "Plants & Nature"}` },
    { id: "cafe", label: `☕ ${lang === "zh" ? "咖啡馆" : "Café Culture"}` },
    { id: "wellness", label: `🧘 ${lang === "zh" ? "健康生活" : "Wellness"}` },
    { id: "film", label: `🎬 ${lang === "zh" ? "影视" : "Film & TV"}` },
    { id: "travel", label: `✈️ ${lang === "zh" ? "旅行" : "Travel"}` },
    { id: "cooking", label: `🍳 ${lang === "zh" ? "烹饪" : "Cooking"}` },
    { id: "tech", label: `💻 ${lang === "zh" ? "科技" : "Tech"}` },
    { id: "fitness", label: `🏃 ${lang === "zh" ? "健身" : "Fitness"}` },
    { id: "photography", label: `📸 ${lang === "zh" ? "摄影" : "Photography"}` },
    { id: "collecting", label: `🧸 ${lang === "zh" ? "收藏" : "Collecting"}` },
  ];
}

const ORIGIN_VALUES = [
  "China",
  "International Student",
  "UK",
  "USA",
  "South Korea",
  "Japan",
  "Singapore",
  "Malaysia",
  "Other",
] as const;

type OriginValue = (typeof ORIGIN_VALUES)[number];

function originLabel(o: OriginValue, lang: "zh" | "en") {
  if (lang === "en") return o;
  if (o === "China") return "中国";
  if (o === "International Student") return "国际学生";
  if (o === "UK") return "英国";
  if (o === "USA") return "美国";
  if (o === "South Korea") return "韩国";
  if (o === "Japan") return "日本";
  if (o === "Singapore") return "新加坡";
  if (o === "Malaysia") return "马来西亚";
  return "其他";
}

const MBTI_CHARACTERS = {
  CO: {
    emoji: "🦉",
    characterEn: "The Scholar",
    characterZh: "学者型",
    taglineEn: "Wise, ordered, quietly powerful",
    taglineZh: "睿智有序，安静却有力量",
    color: "#2DD4BF",
  },
  CF: {
    emoji: "🌙",
    characterEn: "The Dreamer",
    characterZh: "梦想家型",
    taglineEn: "Intuitive, soft, deeply creative",
    taglineZh: "直觉细腻，温柔且富有创造力",
    color: "#A855F7",
  },
  SO: {
    emoji: "🦁",
    characterEn: "The Host",
    characterZh: "社交型",
    taglineEn: "Bold, welcoming, always ready",
    taglineZh: "热情大方，随时欢迎朋友到来",
    color: "#F97316",
  },
  SF: {
    emoji: "🦋",
    characterEn: "The Curator",
    characterZh: "策展人型",
    taglineEn: "Expressive, dynamic, surprising",
    taglineZh: "表达自我，灵动有趣，充满惊喜",
    color: "#EC4899",
  },
} as const satisfies Record<
  string,
  {
    emoji: string;
    characterEn: string;
    characterZh: string;
    taglineEn: string;
    taglineZh: string;
    color: string;
  }
>;

export function SurveyPage() {
  const nav = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const setProfileId = useProfileStore((s) => s.setProfileId);
  const setRoomDNA = useProfileStore((s) => s.setRoomDNA);
  const setRawAnswers = useProfileStore((s) => s.setRawAnswers);

  const [mode, setMode] = useState<"simple" | "detailed" | null>(null);
  const [step, setStep] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [section, setSection] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setError(null);
  }, [section, step]);

  const personalityQuestions = useMemo(
    () => (mode === "detailed" ? [...basePersonalityQuestions(lang), ...detailedPersonalityQuestions(lang)] : basePersonalityQuestions(lang)),
    [lang, mode],
  );

  const sectionText = useMemo(() => sectionLabels(lang), [lang]);
  const interestOptions = useMemo(() => interestChips(lang), [lang]);
  const originOptions = useMemo(() => ORIGIN_VALUES.map((o) => ({ value: o, label: originLabel(o, lang) })), [lang]);

  const personalityComplete = personalityQuestions.every((q) => !!answers[q.id]);
  const interestsComplete = interests.length > 0 && interests.length <= 3;
  const practicalComplete = !!answers.palette && !!answers.budget && !!answers.origin;

  const roomDNA = useMemo(() => {
    const l1 = answers.energy === "social" ? "S" : "C";
    const l2 = answers.organisation === "flowing" ? "F" : "O";
    const l3 = answers.palette === "cool" ? "C" : answers.palette === "bold" ? "B" : "W";
    const l4 =
      answers.budget === "luxury"
        ? "L"
        : answers.budget === "high"
          ? "P"
          : answers.budget === "mid"
            ? "M"
            : "E";
    return `${l1}${l2}${l3}${l4}`;
  }, [answers.budget, answers.energy, answers.organisation, answers.palette]);

  const roomTypeName = useMemo(() => {
    const a = roomDNA[0];
    const b = roomDNA[1];
    if (lang === "zh") {
      if (a === "C" && b === "O") return "舒适学者";
      if (a === "C" && b === "F") return "平静创作者";
      if (a === "S" && b === "O") return "社交主人";
      return "大胆策展人";
    }
    if (a === "C" && b === "O") return "The Cozy Scholar";
    if (a === "C" && b === "F") return "The Calm Creator";
    if (a === "S" && b === "O") return "The Social Host";
    return "The Bold Curator";
  }, [lang, roomDNA]);

  const keywords = useMemo(() => {
    const out: string[] = [];
    if (answers.palette === "warm") out.push(lang === "zh" ? "暖色系" : "Warm");
    if (answers.palette === "cool") out.push(lang === "zh" ? "冷色系" : "Cool");
    if (answers.palette === "bold") out.push(lang === "zh" ? "大胆" : "Bold");
    if (answers.organisation === "ordered") out.push(lang === "zh" ? "有秩序" : "Organised");
    if (answers.organisation === "flowing") out.push(lang === "zh" ? "随性创意" : "Creative Flow");
    if (interests.includes("plants") || answers.nature === "nature_lover") out.push(lang === "zh" ? "自然灵感" : "Nature-Inspired");
    if (interests.includes("wellness") || interests.includes("fitness")) out.push(lang === "zh" ? "健康生活" : "Wellness");
    if (interests.includes("art")) out.push(lang === "zh" ? "艺术感" : "Artistic");
    if (interests.includes("gaming")) out.push(lang === "zh" ? "玩乐" : "Playful");
    if (interests.includes("reading") || interests.includes("tech")) out.push(lang === "zh" ? "学习友好" : "Study-Friendly");
    if (out.length < 3) out.push(lang === "zh" ? "个性化" : "Personalized");
    return [...new Set(out)].slice(0, 3);
  }, [answers.nature, answers.organisation, answers.palette, interests, lang]);

  const personalitySummary = useMemo(() => {
    const energy = roomDNA[0] === "S" ? "social" : "calm";
    const structure = roomDNA[1] === "O" ? "structured" : "free-flowing";
    const palette = roomDNA[2] === "W" ? "warm" : roomDNA[2] === "C" ? "cool" : "bold";
    const budget = roomDNA[3] === "L" ? "luxury" : roomDNA[3] === "P" ? "premium" : roomDNA[3] === "M" ? "mid-range" : "essential";
    if (lang === "zh") {
      const energyZh = energy === "social" ? "偏社交" : "偏安静";
      const structureZh = structure === "structured" ? "更有秩序" : "更随性";
      const paletteZh = palette === "warm" ? "暖色系" : palette === "cool" ? "冷色系" : "大胆混搭";
      const budgetZh = budget === "luxury" ? "高端" : budget === "premium" ? "品质" : budget === "mid-range" ? "中等" : "入门";
      return `你更${energyZh}、${structureZh}，偏好${paletteZh}，预算风格偏${budgetZh}。推荐会围绕这个身份为你优化。`;
    }
    return `You lean ${energy} and ${structure}, with a ${palette} palette and a ${budget} budget vibe. Your recommendations are tuned to match that identity.`;
  }, [lang, roomDNA]);

  const mbtiCharacter = useMemo(() => {
    const charKey = roomDNA.slice(0, 2) as keyof typeof MBTI_CHARACTERS;
    return MBTI_CHARACTERS[charKey] ?? MBTI_CHARACTERS.CO;
  }, [roomDNA]);

  const characterGlow = useMemo(() => {
    const c = mbtiCharacter.color;
    if (c === "#A855F7") return { bg10: "rgba(168,85,247,0.1)", bg30: "rgba(168,85,247,0.3)" };
    if (c === "#F97316") return { bg10: "rgba(249,115,22,0.1)", bg30: "rgba(249,115,22,0.3)" };
    if (c === "#EC4899") return { bg10: "rgba(236,72,153,0.1)", bg30: "rgba(236,72,153,0.3)" };
    return { bg10: "rgba(45,212,191,0.1)", bg30: "rgba(45,212,191,0.3)" };
  }, [mbtiCharacter.color]);

  const confettiDots = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random(),
        color: ["#2DD4BF", "#A855F7", "#F97316", "#FFFFFF"][i % 4],
        size: 6,
      })),
    [showResult],
  );

  function pickPersonality(questionId: keyof QuizAnswers, optionId: string) {
    setAnswers((a) => ({ ...a, [questionId]: optionId } as QuizAnswers));
  }

  function toggleInterest(id: string) {
    setInterests((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function pickPalette(id: PaletteId) {
    setAnswers((a) => ({ ...a, palette: id }));
  }

  function pickBudget(id: BudgetId) {
    setAnswers((a) => ({ ...a, budget: id }));
  }

  function goNextSection() {
    if (section === 0) setSection(1);
    if (section === 1) setSection(2);
  }

  function resetQuiz() {
    setSection(0);
    setAnswers({});
    setInterests([]);
    setSubmitting(false);
    setError(null);
    setShowResult(false);
    setShowConfetti(false);
  }

  function resetAll() {
    resetQuiz();
    setMode(null);
    setStep(-1);
  }

  function start(selected: "simple" | "detailed") {
    resetQuiz();
    setMode(selected);
    setStep(0);
  }

  function openResult() {
    if (!practicalComplete) return;
    setShowResult(true);
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 2000);
  }

  async function handleShare() {
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
    const code = roomDNA;
    const name = roomTypeName;
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
    ctx.fillText(code, x + 40, y + 200);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = '900 44px system-ui, -apple-system, "Segoe UI", Roboto, Arial';
    ctx.fillText(name, x + 40, y + 270);

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
      a.download = `dormvibe-room-dna-${code}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 500);
    }, "image/png");
  }

  const mbtiType = useMemo(() => {
    if (mode !== "detailed") return null;
    const ie = answers.social_battery === "recharge_alone" ? "I" : "E";
    const sn = answers.info_style === "abstract" ? "N" : "S";
    const tf = answers.decision_style === "emotional" ? "F" : "T";
    const jp = answers.planning === "spontaneous" ? "P" : "J";
    return `${ie}${sn}${tf}${jp}`;
  }, [answers.decision_style, answers.info_style, answers.planning, answers.social_battery, mode]);

  const mbtiDescription = useMemo(() => {
    if (!mbtiType) return null;
    const parts: string[] = [];
    if (lang === "zh") {
      if (mbtiType[0] === "I") parts.push("安静专注与个人舒适最重要。");
      else parts.push("空间在连接与能量中更有活力。");
      if (mbtiType[1] === "N") parts.push("你偏爱表达性主题与整体氛围。");
      else parts.push("你更看重实用细节与功能布局。");
      if (mbtiType[3] === "J") parts.push("结构感让你更安心、可控。");
      else parts.push("灵活性让空间更轻松、更有生命力。");
    } else {
      if (mbtiType[0] === "I") parts.push("Quiet focus and personal comfort matter most.");
      else parts.push("Your space thrives when it supports connection and energy.");
      if (mbtiType[1] === "N") parts.push("You like expressive themes and big-picture vibe.");
      else parts.push("You value practical details and functional layout.");
      if (mbtiType[3] === "J") parts.push("Structure helps you feel calm and in control.");
      else parts.push("Flexibility keeps your space feeling alive and easy.");
    }
    return parts.join(" ");
  }, [lang, mbtiType]);

  const personalityInsights = useMemo(() => {
    if (mode !== "detailed") return null;
    const out: string[] = [];
    if (lang === "zh") {
      if (answers.workspace === "separate") out.push("分区布局：为工作与休息建立清晰边界。");
      if (answers.workspace === "blended") out.push("混合布局：选择可灵活变换的家具适配多种活动。");
      if (answers.display === "hide_clutter") out.push("隐藏收纳：优先封闭柜体、收纳篮与干净台面。");
      if (answers.display === "display_collections") out.push("展示型空间：开放置物与墙面装饰成为视觉焦点。");
      if (answers.lighting_pref === "ambient") out.push("氛围灯光：暖色台灯与间接光营造舒适感。");
      if (answers.lighting_pref === "bright") out.push("明亮灯光：清晰任务灯与更通透的配色。");
    } else {
      if (answers.workspace === "separate") out.push("Zoned layouts: create distinct areas for work and rest.");
      if (answers.workspace === "blended") out.push("Hybrid layouts: use flexible furniture that adapts across activities.");
      if (answers.display === "hide_clutter") out.push("Hidden storage: prioritize closed cabinets, baskets, and clean surfaces.");
      if (answers.display === "display_collections") out.push("Curated display: open shelving and wall art become focal points.");
      if (answers.lighting_pref === "ambient") out.push("Mood lighting: warm lamps and indirect light for a cozy atmosphere.");
      if (answers.lighting_pref === "bright") out.push("Bright lighting: clear task light and daylight-friendly palettes.");
    }
    return out.slice(0, 3);
  }, [answers.display, answers.lighting_pref, answers.workspace, lang, mode]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const mappedAnswers: SurveyAnswer[] = [
        {
          questionId: "vibe",
          optionId:
            answers.energy === "solo" && answers.organisation === "ordered"
              ? "cozy"
              : answers.energy === "social"
                ? "social"
                : "minimal",
        },
        {
          questionId: "activity",
          optionId:
            interests.includes("gaming") || interests.includes("film") || interests.includes("music")
              ? "hangout"
              : interests.includes("reading") || interests.includes("tech") || interests.includes("art")
                ? "study"
                : "rest",
        },
        { questionId: "palette", optionId: answers.palette! },
        {
          questionId: "density",
          optionId: answers.organisation === "ordered" ? "sparse" : "full",
        },
        {
          questionId: "lighting",
          optionId: answers.palette === "bold" || interests.includes("gaming") ? "ambient" : "bright",
        },
      ];

      const profile = await api.styleProfiles.create(mappedAnswers);
      setProfileId(profile.id);
      setRoomDNA(roomDNA, roomTypeName);
      setRawAnswers({ answers, interests });
      nav("/projects", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? String(e.detail) : (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        ...styles.page,
        maxWidth: 980,
        background: "var(--c-bg)",
        color: "var(--c-text)",
        minHeight: "100vh",
        overflowY: "auto",
        paddingBottom: 80,
      }}
    >
      <style>
        {`
          @keyframes dvResultPop { 0% { transform: scale(0.5) rotateX(-15deg); opacity: 0; } 100% { transform: scale(1) rotateX(0deg); opacity: 1; } }
          @keyframes dvShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
          @keyframes dvConfettiFall { 0% { transform: translateY(-20px); opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        `}
      </style>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {step === -1 ? (
          <div style={{ paddingTop: 18 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "var(--c-text)" }}>
                {lang === "zh" ? "选择测试模式" : "Choose Your Quiz Style"}
              </div>
              <div style={{ color: "var(--c-muted)", marginTop: 10 }}>
                {lang === "zh" ? "两种模式都会得到你的专属房间基因代码。" : "Both paths end with your personal Room DNA code."}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "row", gap: 20, alignItems: "stretch", marginTop: 26, flexWrap: "wrap" }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--c-card)",
                  border: "1px solid #2DD4BF",
                  borderRadius: 16,
                  padding: 20,
                  cursor: "pointer",
                  transition: "transform 150ms ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "scale(1)")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 40, lineHeight: 1 }}>⚡</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "var(--c-text)" }}>
                        {lang === "zh" ? "快速风格测试" : "Quick Vibe Check"}
                      </div>
                      <div style={{ color: "var(--c-muted)", fontSize: 13, marginTop: 4 }}>
                        {lang === "zh" ? "5 个视觉题。快速、有趣，得到你的风格画像。" : "5 visual questions. Fast, fun, gets your style profile."}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "rgba(45,212,191,0.1)",
                      border: "1px solid #2DD4BF",
                      color: "#2DD4BF",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ~2 min
                  </div>
                </div>

                <div style={{ marginTop: 14, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.8 }}>
                  {[
                    lang === "zh" ? "✓ 5 个问题" : "✓ 5 questions",
                    lang === "zh" ? "✓ 视觉化 A/B 选择" : "✓ Visual A vs B cards",
                    lang === "zh" ? "✓ 即刻生成房间基因" : "✓ Instant Room DNA result",
                  ].map((t) => (
                    <div key={t} style={{ fontSize: 13, padding: "3px 0", color: "var(--c-muted)" }}>
                      {t}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "auto" }}>
                  <button
                    type="button"
                    onClick={() => start("simple")}
                    style={{
                      marginTop: 16,
                      width: "100%",
                      background: "#2DD4BF",
                      border: "none",
                      color: "var(--c-button-fg)",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {lang === "zh" ? "开始快速测试 →" : "Start Quick Quiz →"}
                  </button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--c-card)",
                  border: "1px solid #A855F7",
                  borderRadius: 16,
                  padding: 20,
                  cursor: "pointer",
                  transition: "transform 150ms ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "scale(1)")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 40, lineHeight: 1 }}>🔬</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "var(--c-text)" }}>
                        {lang === "zh" ? "完整 MBTI 分析" : "Full MBTI Analysis"}
                      </div>
                      <div style={{ color: "var(--c-muted)", fontSize: 13, marginTop: 4 }}>
                        {lang === "zh"
                          ? "12 个更深入的问题，基于真实 MBTI 维度，更准确地个性化你的房间。"
                          : "12 deeper questions based on real MBTI dimensions. More accurate room personalisation."}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "rgba(168,85,247,0.15)",
                      border: "1px solid #A855F7",
                      color: "#A855F7",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ~8 min
                  </div>
                </div>

                <div style={{ marginTop: 14, color: "var(--c-muted)", fontSize: 13, lineHeight: 1.8 }}>
                  {[
                    lang === "zh" ? "✓ 12 个问题覆盖 4 个 MBTI 维度" : "✓ 12 questions across 4 MBTI dimensions",
                    lang === "zh"
                      ? "✓ 性格维度拆解（I/E, S/N, T/F, J/P）"
                      : "✓ Personality type breakdown (I/E, S/N, T/F, J/P)",
                    lang === "zh" ? "✓ 更详细的房间基因与性格洞察" : "✓ Detailed Room DNA with personality insights",
                    lang === "zh" ? "✓ 更精准的 AI 房间生成" : "✓ More precise AI room generation",
                  ].map((t) => (
                    <div key={t} style={{ fontSize: 13, padding: "3px 0", color: "var(--c-muted)" }}>
                      {t}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "auto" }}>
                  <button
                    type="button"
                    onClick={() => start("detailed")}
                    style={{
                      marginTop: 16,
                      width: "100%",
                      background: "transparent",
                      border: "1px solid #A855F7",
                      color: "#A855F7",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {lang === "zh" ? "开始完整分析 →" : "Start Full Analysis →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
              {[0, 1, 2].map((i) => {
                const filled =
                  (i === 0 && personalityComplete) ||
                  (i === 1 && interestsComplete) ||
                  (i === 2 && practicalComplete);
                return (
                  <div
                    key={i}
                    style={{
                      height: 6,
                      borderRadius: 999,
                      background: filled ? "var(--c-accent)" : "var(--c-input-bg)",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>
                {lang === "zh" ? `第 ${section + 1}/3 部分 — ${sectionText[section] ?? ""}` : `Section ${section + 1} of 3 — ${sectionText[section] ?? ""}`}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
          {section === 0 && (
            <>
              <h1 style={{ margin: "8px 0 12px", color: "var(--c-text)", fontWeight: 950 }}>
                {lang === "zh" ? "你的性格" : "Your Personality"}
              </h1>
              {personalityQuestions.map((q, idx) => {
                const picked = answers[q.id];
                const cardStyle = (selected: boolean) => ({
                  background: "var(--c-card)",
                  borderRadius: 16,
                  border: selected ? "2px solid #2DD4BF" : "1px solid var(--c-card-border)",
                  color: "var(--c-text)",
                  padding: 22,
                  textAlign: "left" as const,
                  cursor: "pointer",
                  transition: "transform 150ms ease, box-shadow 150ms ease",
                  transform: selected ? "scale(1.01)" : "scale(1)",
                  boxShadow: selected ? "0 0 0 2px rgba(45,212,191,0.25)" : "none",
                });
                return (
                  <div key={String(q.id)} style={{ marginBottom: 28 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--c-muted)",
                        marginBottom: 12,
                        letterSpacing: 0.3,
                      }}
                    >
                      {idx + 1}. {q.title}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <button type="button" onClick={() => pickPersonality(q.id, q.a.id)} style={cardStyle(picked === q.a.id)}>
                        <div style={{ fontSize: 40, lineHeight: 1 }}>{q.a.emoji}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 10, color: "var(--c-text)" }}>{q.a.label}</div>
                        <div style={{ color: "var(--c-muted)", fontSize: 13, marginTop: 6 }}>{q.a.subtitle}</div>
                      </button>
                      <button type="button" onClick={() => pickPersonality(q.id, q.b.id)} style={cardStyle(picked === q.b.id)}>
                        <div style={{ fontSize: 40, lineHeight: 1 }}>{q.b.emoji}</div>
                        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 10, color: "var(--c-text)" }}>{q.b.label}</div>
                        <div style={{ color: "var(--c-muted)", fontSize: 13, marginTop: 6 }}>{q.b.subtitle}</div>
                      </button>
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="button"
                  onClick={goNextSection}
                  disabled={!personalityComplete}
                  style={{
                    ...styles.button,
                    color: "var(--c-button-fg)",
                    opacity: personalityComplete ? 1 : 0.4,
                    cursor: personalityComplete ? "pointer" : "not-allowed",
                  }}
                >
                  {lang === "zh" ? "下一步 →" : "Next Section →"}
                </button>
              </div>
            </>
          )}

          {section === 1 && (
            <>
              <h1 style={{ margin: "8px 0 12px", color: "var(--c-text)", fontWeight: 950 }}>
                {lang === "zh" ? "你的兴趣" : "Your Interests"}
              </h1>
              <div style={{ color: "var(--c-muted)", marginBottom: 14, fontSize: 14 }}>
                {lang === "zh" ? "你喜欢什么？最多选 3 个。" : "What are you into? Pick up to 3."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                {interestOptions.map((c) => {
                  const selected = interests.includes(c.id);
                  const chipColor = selected ? "#2DD4BF" : "var(--c-text)";
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleInterest(c.id)}
                      style={{
                        background: selected ? "rgba(45,212,191,0.1)" : "var(--c-card)",
                        border: selected ? "2px solid #2DD4BF" : "1px solid var(--c-card-border)",
                        color: chipColor,
                        padding: "12px 14px",
                        borderRadius: 999,
                        cursor: "pointer",
                        textAlign: "left",
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ color: chipColor }}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
                <button
                  type="button"
                  style={{ ...styles.buttonGhost, color: "var(--c-muted)" }}
                  onClick={() => setSection(0)}
                  disabled={submitting}
                >
                  {lang === "zh" ? "← 返回" : "← Back"}
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, color: "var(--c-button-fg)" }}
                  onClick={goNextSection}
                  disabled={!interestsComplete || submitting}
                >
                  {lang === "zh" ? "下一步 →" : "Next Section →"}
                </button>
              </div>
            </>
          )}

          {section === 2 && (
            <>
              <h1 style={{ margin: "8px 0 12px", color: "var(--c-text)", fontWeight: 950 }}>
                {lang === "zh" ? "你的实际需求" : "Your Practical Needs"}
              </h1>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-muted)", marginBottom: 12, letterSpacing: 0.3 }}>
                  1. {lang === "zh" ? "配色偏好" : "Color palette"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {(
                    [
                      {
                        id: "warm" as const,
                        label: lang === "zh" ? "暖色系" : "Warm",
                        subtitle: lang === "zh" ? "琥珀、陶土、奶油色" : "amber, terracotta, cream",
                        gradient: "linear-gradient(135deg, #fb923c, #fde68a)",
                      },
                      {
                        id: "cool" as const,
                        label: lang === "zh" ? "冷色系" : "Cool",
                        subtitle: lang === "zh" ? "青绿、灰、白" : "teal, grey, white",
                        gradient: "linear-gradient(135deg, #5eead4, #1e3a8a)",
                      },
                      {
                        id: "bold" as const,
                        label: lang === "zh" ? "大胆混搭" : "Bold & Mixed",
                        subtitle: lang === "zh" ? "表达自我、偏极繁" : "expressive, maximalist",
                        gradient: "linear-gradient(135deg, #a855f7, #ec4899)",
                      },
                    ] as const
                  ).map((o) => {
                    const selected = answers.palette === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => pickPalette(o.id)}
                        style={{
                          background: "var(--c-card)",
                          borderRadius: 16,
                          border: selected ? "2px solid #2DD4BF" : "1px solid var(--c-card-border)",
                          padding: 14,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "transform 150ms ease",
                          transform: selected ? "scale(1.01)" : "scale(1)",
                        }}
                      >
                        <div style={{ height: 90, borderRadius: 12, background: o.gradient }} />
                        <div style={{ fontWeight: 800, marginTop: 10, color: "var(--c-text)" }}>{o.label}</div>
                        <div style={{ color: "var(--c-muted)", fontSize: 12, marginTop: 4 }}>{o.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-muted)", marginBottom: 12, letterSpacing: 0.3 }}>
                  2. {lang === "zh" ? "预算范围" : "Budget range"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {(
                    [
                      { id: "low" as const, label: "¥1,000 – 3,000" },
                      { id: "mid" as const, label: "¥3,000 – 8,000" },
                      { id: "high" as const, label: "¥8,000 – 20,000" },
                      { id: "luxury" as const, label: "¥20,000+" },
                    ] as const
                  ).map((o) => {
                    const selected = answers.budget === o.id;
                    const budgetColor = selected ? "#2DD4BF" : "var(--c-text)";
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => pickBudget(o.id)}
                        style={{
                          background: "var(--c-card)",
                          borderRadius: 16,
                          border: selected ? "2px solid #2DD4BF" : "1px solid var(--c-card-border)",
                          padding: 18,
                          cursor: "pointer",
                          textAlign: "left",
                          fontWeight: 800,
                          color: budgetColor,
                          transition: "transform 150ms ease",
                          transform: selected ? "scale(1.01)" : "scale(1)",
                        }}
                      >
                        <span style={{ color: budgetColor }}>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-muted)", marginBottom: 12, letterSpacing: 0.3 }}>
                  3. {lang === "zh" ? "你来自哪里？" : "Where are you from?"}
                </div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: "var(--c-text)" }}>
                  {lang === "zh" ? "你来自哪里？（帮助我们更好地个性化你的设计）" : "Where are you from? (helps personalise your design)"}
                </label>
                <select
                  value={answers.origin ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, origin: e.target.value }))}
                  style={{
                    color: "var(--c-text)",
                    background: "var(--c-input-bg)",
                    border: "1px solid var(--c-card-border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 14,
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <option value="">{lang === "zh" ? "请选择地区" : "Select your origin"}</option>
                  {originOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
                <button
                  type="button"
                  style={{ ...styles.buttonGhost, color: "var(--c-muted)" }}
                  onClick={() => setSection(1)}
                  disabled={submitting}
                >
                  {lang === "zh" ? "← 返回" : "← Back"}
                </button>
                <button
                  type="button"
                  onClick={openResult}
                  disabled={!practicalComplete || submitting}
                  style={{
                    ...styles.button,
                    color: "var(--c-button-fg)",
                    opacity: practicalComplete && !submitting ? 1 : 0.4,
                    cursor: practicalComplete && !submitting ? "pointer" : "not-allowed",
                  }}
                >
                  {lang === "zh" ? "生成我的房间 →" : "Generate My Room →"}
                </button>
              </div>
            </>
          )}

          {error && <p style={styles.err}>{error}</p>}
            </div>
          </>
        )}
      </div>

      {showResult && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          {showConfetti && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
              {confettiDots.map((d) => (
                <div
                  key={d.id}
                  style={{
                    position: "absolute",
                    top: -20,
                    left: `${d.left}%`,
                    width: d.size,
                    height: d.size,
                    borderRadius: "50%",
                    background: d.color,
                    animation: `dvConfettiFall 2s ease-in forwards`,
                    animationDelay: `${d.delay}s`,
                    opacity: 0,
                  }}
                />
              ))}
            </div>
          )}

          <div style={{ perspective: 1000 }}>
            <div
                ref={resultCardRef}
              style={{
                background: "#18181B",
                borderRadius: 24,
                padding: 48,
                maxWidth: 480,
                width: "100%",
                textAlign: "center",
                border: "2px solid #2DD4BF",
                boxShadow: "0 0 60px rgba(45,212,191,0.3)",
                transformStyle: "preserve-3d",
                animation: "dvResultPop 650ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
              }}
            >
              <div style={{ color: "var(--c-muted)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 800 }}>
                {lang === "zh" ? "你的房间基因" : "Your Room DNA"}
              </div>

              <div style={{ textAlign: "center", marginBottom: 20, marginTop: 18 }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    background: characterGlow.bg10,
                    border: `2px solid ${mbtiCharacter.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 52,
                    margin: "0 auto 12px",
                    boxShadow: `0 0 30px ${characterGlow.bg30}`,
                    animation: "float 3s ease-in-out infinite",
                  }}
                >
                  {mbtiCharacter.emoji}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: mbtiCharacter.color, letterSpacing: 1 }}>
                  {lang === "zh" ? mbtiCharacter.characterZh : mbtiCharacter.characterEn}
                </div>
                <div style={{ fontSize: 13, color: "var(--c-muted)", fontStyle: "italic", textAlign: "center", marginTop: 4 }}>
                  {lang === "zh" ? mbtiCharacter.taglineZh : mbtiCharacter.taglineEn}
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontSize: 72,
                  fontWeight: 900,
                  letterSpacing: 12,
                  background: "linear-gradient(90deg, #2DD4BF, #A855F7, #2DD4BF)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  color: "#2DD4BF",
                  animation: "dvShimmer 2.2s linear infinite",
                }}
              >
                {roomDNA}
              </div>

              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--c-text)", marginTop: 8 }}>{roomTypeName}</div>

              <div
                style={{
                  color: "var(--c-muted)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginTop: 12,
                  maxWidth: 340,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                {personalitySummary}
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
                {keywords.map((k) => (
                  <span
                    key={k}
                    style={{
                      background: "rgba(45,212,191,0.1)",
                      border: "1px solid #2DD4BF",
                      color: "#2DD4BF",
                      borderRadius: 999,
                      padding: "4px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {k}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  marginTop: 20,
                  marginBottom: 4,
                }}
              >
                <button
                  type="button"
                  onClick={handleShare}
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
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                >
                  {copied ? <Check size={14} strokeWidth={2.5} /> : <Share2 size={14} strokeWidth={2} />}
                  {copied ? (lang === "zh" ? "已复制！" : "Copied!") : lang === "zh" ? "分享基因" : "Share DNA"}
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <button
                  type="button"
                  onClick={handleDownload}
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
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                >
                  <Download size={14} strokeWidth={2} />
                  {lang === "zh" ? "下载图片" : "Download Image"}
                </button>
              </div>

              <hr style={{ margin: "28px 0", borderColor: "#3F3F46" }} />

              <button
                type="button"
                onClick={async () => {
                  setShowResult(false);
                  await submit();
                }}
                disabled={submitting}
                style={{
                  background: "#2DD4BF",
                  color: "var(--c-button-fg)",
                  padding: "14px 32px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 16,
                  width: "100%",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transform: "scale(1)",
                  transition: "transform 120ms ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
                onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)")}
                onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)")}
              >
                {submitting ? (lang === "zh" ? "生成中…" : "Generating…") : lang === "zh" ? "✨ 生成我的房间" : "✨ Generate My Room"}
              </button>

              <button
                type="button"
                onClick={resetAll}
                disabled={submitting}
                style={{
                  background: "transparent",
                  border: "1px solid #3F3F46",
                  color: "var(--c-muted)",
                  padding: "12px 32px",
                  borderRadius: 10,
                  fontSize: 14,
                  width: "100%",
                  marginTop: 8,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                {lang === "zh" ? "← 重新测试" : "← Retake Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

