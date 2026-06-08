type QuizAnswers = Partial<{
  energy: "solo" | "social";
  organisation: "ordered" | "flowing";
  social_battery: "recharge_alone" | "recharge_social";
  decision_style: "logical" | "emotional";
  planning: "planned" | "spontaneous";
  info_style: "concrete" | "abstract";
  workspace: "separate" | "blended";
  nature: "nature_lover" | "urban";
  display: "display_collections" | "hide_clutter";
  palette: "warm" | "cool" | "bold";
  budget: "low" | "mid" | "high" | "luxury";
  origin: string;
}>;

type StoredRawAnswers = {
  answers?: QuizAnswers | undefined;
  interests?: string[] | undefined;
};

export type RoomDnaProfile = {
  code: string | null;
  roomTypeName: string | null;
  summary: string;
  personalityTitle: string;
  identityCards: Array<{ label: string; value: string; subtext?: string }>;
  personalityTraits: string[];
  designPreferences: Array<{ label: string; value: string }>;
  lifestyleInsights: string[];
  styleBreakdown: Array<{ label: string; value: string; accent?: string }>;
  moodAnalysis: Array<{ label: string; value: string }>;
  recommendations: string[];
  widgets: Array<{ title: string; value: string; subtext: string }>;
};

function parseRawAnswers(rawAnswers: unknown): StoredRawAnswers {
  if (!rawAnswers || typeof rawAnswers !== "object") return {};
  const data = rawAnswers as Record<string, unknown>;
  const answers = data.answers && typeof data.answers === "object" ? (data.answers as QuizAnswers) : undefined;
  const interests = Array.isArray(data.interests)
    ? data.interests.filter((x): x is string => typeof x === "string")
    : undefined;
  return { answers, interests };
}

function titleFromCode(roomDNA: string | null, roomTypeName: string | null, lang: "zh" | "en") {
  if (roomTypeName) return roomTypeName;
  const key = roomDNA?.slice(0, 2);
  if (lang === "zh") {
    if (key === "CO") return "舒适学者";
    if (key === "CF") return "平静创作者";
    if (key === "SO") return "社交主人";
    if (key === "SF") return "大胆策展人";
    return "你的房间基因";
  }
  if (key === "CO") return "The Cozy Scholar";
  if (key === "CF") return "The Calm Creator";
  if (key === "SO") return "The Social Host";
  if (key === "SF") return "The Bold Curator";
  return "Your Room DNA";
}

function budgetLabel(budget: QuizAnswers["budget"], lang: "zh" | "en") {
  if (lang === "zh") {
    if (budget === "luxury") return "奢华";
    if (budget === "high") return "高端";
    if (budget === "mid") return "中档";
    if (budget === "low") return "基础";
    return "灵活";
  }
  if (budget === "luxury") return "Luxury";
  if (budget === "high") return "Premium";
  if (budget === "mid") return "Mid-range";
  if (budget === "low") return "Essential";
  return "Flexible";
}

function paletteLabel(palette: QuizAnswers["palette"], lang: "zh" | "en") {
  if (lang === "zh") {
    if (palette === "warm") return "暖色系";
    if (palette === "cool") return "冷色系";
    if (palette === "bold") return "大胆";
    return "平衡";
  }
  if (palette === "warm") return "Warm";
  if (palette === "cool") return "Cool";
  if (palette === "bold") return "Bold";
  return "Balanced";
}

function originLabel(origin: string | undefined, lang: "zh" | "en") {
  if (!origin) return lang === "zh" ? "未设置" : "Not set";
  return origin;
}

function personalityTraits(answers: QuizAnswers, interests: string[], lang: "zh" | "en") {
  const traits: string[] = [];
  if (lang === "zh") {
    traits.push(answers.energy === "social" ? "社交充电" : "平静");
    traits.push(answers.organisation === "flowing" ? "随性创意" : "有秩序");
    traits.push(answers.planning === "spontaneous" ? "灵活" : "结构感");
    if (answers.nature === "nature_lover" || interests.includes("plants")) traits.push("自然灵感");
    if (answers.display === "display_collections") traits.push("表达自我");
    if (answers.workspace === "separate") traits.push("专注");
  } else {
    traits.push(answers.energy === "social" ? "Socially energised" : "Calm-minded");
    traits.push(answers.organisation === "flowing" ? "Creative flow" : "Organised");
    traits.push(answers.planning === "spontaneous" ? "Flexible" : "Structured");
    if (answers.nature === "nature_lover" || interests.includes("plants")) traits.push("Nature-inspired");
    if (answers.display === "display_collections") traits.push("Expressive");
    if (answers.workspace === "separate") traits.push("Focused");
  }
  return [...new Set(traits)].slice(0, 5);
}

export function buildRoomDnaProfile(
  rawAnswers: unknown,
  roomDNA: string | null,
  roomTypeName: string | null,
  lang: "zh" | "en" = "en",
): RoomDnaProfile {
  const { answers = {}, interests = [] } = parseRawAnswers(rawAnswers);

  const title = titleFromCode(roomDNA, roomTypeName, lang);
  const energy = lang === "zh" ? (answers.energy === "social" ? "社交" : "平静") : answers.energy === "social" ? "Social" : "Calm";
  const structure =
    lang === "zh" ? (answers.organisation === "flowing" ? "随性" : "有序") : answers.organisation === "flowing" ? "Flowing" : "Organised";
  const palette = paletteLabel(answers.palette, lang);
  const budget = budgetLabel(answers.budget, lang);
  const mood =
    answers.palette === "warm"
      ? lang === "zh"
        ? "踏实温暖"
        : "Grounded and welcoming"
      : answers.palette === "cool"
        ? lang === "zh"
          ? "清爽专注"
          : "Fresh and focused"
        : answers.palette === "bold"
          ? lang === "zh"
            ? "大胆有活力"
            : "Expressive and high-energy"
          : lang === "zh"
            ? "平衡易适应"
            : "Balanced and adaptable";

  const summary = roomDNA
    ? lang === "zh"
      ? `${title} 将「${energy}」的能量与「${structure}」的风格结合在一起。你的理想房间应当感觉${mood}，并支持你的日常节奏。`
      : `${title} combines a ${energy.toLowerCase()} energy with a ${structure.toLowerCase()} style. Your ideal room should feel ${mood.toLowerCase()} and support your daily routines.`
    : lang === "zh"
      ? "房间基因会将你的习惯、偏好与生活方式转化为清晰的设计方向。"
      : "Room DNA turns your habits, preferences, and lifestyle into a clear design direction.";

  const designPreferences = [
    { label: lang === "zh" ? "配色" : "Palette", value: palette },
    { label: lang === "zh" ? "预算" : "Budget", value: budget },
    { label: lang === "zh" ? "地区" : "Origin", value: originLabel(answers.origin, lang) },
    {
      label: lang === "zh" ? "兴趣" : "Interests",
      value: interests.length ? interests.slice(0, 3).join(", ") : lang === "zh" ? "完成测试以解锁" : "Complete the quiz to unlock",
    },
  ];

  const functionLabel =
    answers.workspace === "separate"
      ? lang === "zh"
        ? "专注学习"
        : "Focused study"
      : lang === "zh"
        ? "灵活多用"
        : "Flexible multi-use";
  const functionSubtext =
    answers.workspace === "separate"
      ? lang === "zh"
        ? "分区布局让你更稳定高效"
        : "Zoned layout helps you feel steady and productive"
      : lang === "zh"
        ? "一套家具适配多种节奏"
        : "One setup adapts across your day";

  const identityCards = [
    {
      label: lang === "zh" ? "情绪" : "Mood",
      value: mood,
      subtext: lang === "zh" ? "你希望房间的感觉" : "How you want the room to feel",
    },
    {
      label: lang === "zh" ? "风格" : "Style",
      value: lang === "zh" ? `${palette} · ${structure}` : `${palette} · ${structure}`,
      subtext: lang === "zh" ? "配色与秩序感" : "Palette and structure",
    },
    {
      label: lang === "zh" ? "能量" : "Energy",
      value: energy,
      subtext: lang === "zh" ? "你如何充电" : "How you recharge",
    },
    {
      label: lang === "zh" ? "功能" : "Function",
      value: functionLabel,
      subtext: functionSubtext,
    },
  ];

  const lifestyleInsights = [
    answers.workspace === "separate"
      ? lang === "zh"
        ? "分区布局对你更友好：将工作与休息明确分开。"
        : "You benefit from zoning work and rest into distinct areas."
      : lang === "zh"
        ? "灵活布局更适合你：可变家具能适配多种活动。"
        : "Flexible layouts suit you best, with furniture that adapts across activities.",
    answers.display === "hide_clutter"
      ? lang === "zh"
        ? "隐藏收纳能让房间更安定、也更容易保持整洁。"
        : "Hidden storage will help your room feel calmer and easier to maintain."
      : lang === "zh"
        ? "适度开放展示能让空间更有个人风格与表达感。"
        : "Open display moments can make your room feel more personal and expressive.",
    answers.nature === "nature_lover" || interests.includes("plants")
      ? lang === "zh"
        ? "自然材质与绿植能强化你的归属感与舒适度。"
        : "Natural materials and greenery will reinforce your sense of belonging."
      : lang === "zh"
        ? "干净线条与城市感细节能让空间更利落、更有主张。"
        : "Clean lines and urban details can keep the room feeling sharp and intentional.",
  ];

  const styleBreakdown = [
    { label: lang === "zh" ? "能量" : "Energy", value: energy, accent: roomDNA?.[0] === "S" ? "#F97316" : "#2DD4BF" },
    { label: lang === "zh" ? "结构" : "Structure", value: structure, accent: roomDNA?.[1] === "F" ? "#A855F7" : "#2DD4BF" },
    { label: lang === "zh" ? "配色方向" : "Palette Direction", value: palette, accent: roomDNA?.[2] === "B" ? "#EC4899" : "#2DD4BF" },
    { label: lang === "zh" ? "预算模式" : "Budget Mode", value: budget, accent: "#2DD4BF" },
  ];

  const moodAnalysis = [
    { label: lang === "zh" ? "空间氛围" : "Room mood", value: mood },
    {
      label: lang === "zh" ? "日常节奏" : "Daily rhythm",
      value:
        answers.social_battery === "recharge_social"
          ? lang === "zh"
            ? "当空间支持连接与活动时，你会表现更好。"
            : "Best when the space supports connection and movement."
          : lang === "zh"
            ? "当空间保护安静恢复时间时，你会更舒适。"
            : "Best when the space protects quiet recovery time.",
    },
    {
      label: lang === "zh" ? "决策方式" : "Decision style",
      value:
        answers.decision_style === "emotional"
          ? lang === "zh"
            ? "先选择能营造正确感觉的物品。"
            : "Choose pieces that create the right feeling first."
          : lang === "zh"
            ? "先选择能解决功能需求的物品。"
            : "Choose pieces that solve functional needs first.",
    },
  ];

  const recommendations = [
    answers.palette === "warm"
      ? lang === "zh"
        ? "先从柔和暖光与自然质感入手，建立温暖基调。"
        : "Start with soft amber lighting and natural textures to build warmth."
      : answers.palette === "cool"
        ? lang === "zh"
          ? "用冷静的基础配色搭配清晰光线与更干净的台面。"
          : "Use a calm base palette with crisp light and uncluttered surfaces."
        : answers.palette === "bold"
          ? lang === "zh"
            ? "用一个主视觉单品作为锚点，然后逐步叠加大胆点缀。"
            : "Anchor the room with one statement piece, then layer expressive accents."
          : lang === "zh"
            ? "先确定一个核心区域，再逐步向外扩展。"
            : "Begin with one anchor zone and build around it gradually.",
    answers.organisation === "ordered"
      ? lang === "zh"
        ? "优先考虑收纳与功能明确的家具，让一切都有归处。"
        : "Prioritise storage and furniture with clear purpose so everything has a place."
      : lang === "zh"
        ? "使用模块化/可组合家具，让空间随心情与节奏变化。"
        : "Use modular pieces that let the room evolve with your mood and routine.",
    interests.includes("reading") || interests.includes("tech")
      ? lang === "zh"
        ? "打造专注学习角：任务灯 + 明确的工作台面。"
        : "Create a focused study corner with task lighting and a defined work surface."
      : interests.includes("music") || interests.includes("film") || interests.includes("gaming")
        ? lang === "zh"
          ? "设计一个沉浸娱乐区，适配放松与休闲。"
          : "Design one immersive zone for entertainment and downtime."
        : lang === "zh"
          ? "设置一个“日常仪式角”，支持你每天的充电方式。"
          : "Use one anchor ritual corner that supports how you recharge each day.",
  ];

  const widgets = [
    {
      title: lang === "zh" ? "基因" : "Identity",
      value: roomDNA ?? "—",
      subtext: title,
    },
    {
      title: lang === "zh" ? "氛围" : "Primary Mood",
      value: mood,
      subtext: `${energy} × ${structure}`,
    },
    {
      title: lang === "zh" ? "设计焦点" : "Design Lens",
      value: palette,
      subtext: lang === "zh" ? `${budget} 预算画像` : `${budget} budget profile`,
    },
  ];

  return {
    code: roomDNA,
    roomTypeName,
    summary,
    personalityTitle: title,
    identityCards,
    personalityTraits: personalityTraits(answers, interests, lang),
    designPreferences,
    lifestyleInsights,
    styleBreakdown,
    moodAnalysis,
    recommendations,
    widgets,
  };
}

