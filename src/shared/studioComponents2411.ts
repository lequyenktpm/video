import {
  ScriptStyle,
  Studio2411AnimationIn,
  Studio2411ComponentVariant,
  Studio2411SceneComponentOverride,
  Studio2411ThemeId,
} from './types';
import {
  analyzeScriptLinePresentation,
  getLocalizedRoleLabel,
  hasCjkChars,
  PresentationIconKey,
  PresentationRoleTone,
  stripNarrationTags,
} from './mptEngine';

export interface Studio2411ThemeMeta {
  id: Studio2411ThemeId;
  label: string;
  subtitle: string;
  isLight: boolean;
  bgTopHex: string;
  bgBottomHex: string;
  bgAccentHex: string;
  cardBgHex: string;
  cardBorderHex: string;
  textHex: string;
  mutedTextHex: string;
  accentHex: string;
  secondaryAccentHex: string;
  surfaceTintHex: string;
  gridColorRgba: string;
}

export const STUDIO_2411_THEMES: Studio2411ThemeMeta[] = [
  {
    id: 'cards_pastel',
    label: 'Pastel Cards',
    subtitle: 'Sáng tối giản · 2411',
    isLight: true,
    bgTopHex: '#F5F3FF',
    bgBottomHex: '#E0F2FE',
    bgAccentHex: '#EDE9FE',
    cardBgHex: '#FFFFFF',
    cardBorderHex: '#DDD6FE',
    textHex: '#0F172A',
    mutedTextHex: '#475569',
    accentHex: '#6D28D9',
    secondaryAccentHex: '#0284C7',
    surfaceTintHex: '#F8FAFC',
    gridColorRgba: 'rgba(109, 40, 217, 0.06)',
  },
  {
    id: 'word_reveal_dark',
    label: 'Dark Reveal',
    subtitle: 'Nền tối tương phản',
    isLight: false,
    bgTopHex: '#0F172A',
    bgBottomHex: '#090D16',
    bgAccentHex: '#1E293B',
    cardBgHex: '#151E31',
    cardBorderHex: '#334155',
    textHex: '#F8FAFC',
    mutedTextHex: '#94A3B8',
    accentHex: '#2DD4BF',
    secondaryAccentHex: '#FACC15',
    surfaceTintHex: '#1E293B',
    gridColorRgba: 'rgba(148, 163, 184, 0.08)',
  },
  {
    id: 'clean_sky',
    label: 'Clean Sky',
    subtitle: 'Xanh trời dịu mắt',
    isLight: true,
    bgTopHex: '#EFF6FF',
    bgBottomHex: '#DBEAFE',
    bgAccentHex: '#E0F2FE',
    cardBgHex: '#FFFFFF',
    cardBorderHex: '#BFDBFE',
    textHex: '#0F172A',
    mutedTextHex: '#475569',
    accentHex: '#2563EB',
    secondaryAccentHex: '#0EA5E9',
    surfaceTintHex: '#F0F9FF',
    gridColorRgba: 'rgba(37, 99, 235, 0.06)',
  },
  {
    id: 'mint_fresh',
    label: 'Mint Fresh',
    subtitle: 'Bạc hà tươi mát',
    isLight: true,
    bgTopHex: '#ECFDF5',
    bgBottomHex: '#D1FAE5',
    bgAccentHex: '#CCFBF1',
    cardBgHex: '#FFFFFF',
    cardBorderHex: '#A7F3D0',
    textHex: '#064E3B',
    mutedTextHex: '#475569',
    accentHex: '#059669',
    secondaryAccentHex: '#0D9488',
    surfaceTintHex: '#F0FDF4',
    gridColorRgba: 'rgba(5, 150, 105, 0.06)',
  },
  {
    id: 'warm_editorial',
    label: 'Warm Paper',
    subtitle: 'Giấy kem ấm áp',
    isLight: true,
    bgTopHex: '#FAF6EE',
    bgBottomHex: '#EDE4D3',
    bgAccentHex: '#FEF3C7',
    cardBgHex: '#FFFDF8',
    cardBorderHex: '#E7DCC8',
    textHex: '#1C1917',
    mutedTextHex: '#57534E',
    accentHex: '#D97706',
    secondaryAccentHex: '#0F766E',
    surfaceTintHex: '#FEF9EE',
    gridColorRgba: 'rgba(120, 113, 108, 0.07)',
  },
];

export const STUDIO_2411_VARIANT_OPTIONS: Array<{
  id: Studio2411ComponentVariant;
  label: string;
  hint: string;
}> = [
  { id: 'friends-chat', label: '2-Speaker Chat', hint: 'Hai nhân vật đối thoại bóng thoại' },
  { id: 'avatar-speech', label: 'Avatar Speech', hint: 'Nhân vật nói & bóng thoại phản hồi' },
  { id: 'dialogue-upgrade', label: 'Dialogue Upgrade', hint: 'Nâng cấp câu thô → tự nhiên' },
  { id: 'bs-card-header', label: 'Header Banner', hint: 'Thẻ tiêu đề chuẩn' },
  { id: 'css-browser-mockup', label: 'Browser Mockup', hint: 'Khung trình duyệt học tập' },
  { id: 'css-flashcard', label: 'Flashcard', hint: 'Thẻ ghi nhớ từ khóa / Q&A' },
  { id: 'css-compare', label: 'Compare Split', hint: 'So sánh 2 vế đối chiếu' },
  { id: 'css-equation', label: 'Equation / Syntax', hint: 'Công thức mẫu câu A + B' },
  { id: 'css-roadmap', label: 'Roadmap Steps', hint: 'Lộ trình 3 bước liên kết' },
  { id: 'staircase-3d', label: '3D Staircase', hint: 'Bậc thang thăng tiến' },
  { id: 'bs-progress-meter', label: 'Progress Meter', hint: 'Thanh tiến độ / Mức độ' },
  { id: 'gauge-tone', label: 'Tone Gauge', hint: 'Đồng hồ đo sắc thái / nhịp' },
  { id: 'bs-alert-callout', label: 'Alert Callout', hint: 'Khối lưu ý trọng tâm' },
  { id: 'css-glass-quote', label: 'Glass Quote', hint: 'Trích dẫn / Tổng kết kính mờ' },
];

export const STUDIO_2411_ANIMATION_OPTIONS: Array<{
  id: Studio2411AnimationIn;
  label: string;
}> = [
  { id: 'random', label: 'Random (Ngẫu nhiên đa dạng)' },
  { id: 'pop-up', label: 'Pop Up' },
  { id: 'slide-up', label: 'Slide Up' },
  { id: 'drop-in', label: 'Drop In' },
  { id: 'fade-scale', label: 'Fade Scale' },
];

export function getStudio2411ThemeMeta(themeId?: Studio2411ThemeId): Studio2411ThemeMeta {
  return STUDIO_2411_THEMES.find((t) => t.id === themeId) ?? STUDIO_2411_THEMES[0];
}

export type Studio2411CardLayoutKind =
  | 'intro_hero'
  | 'quiz_prompt'
  | 'answer_reveal'
  | 'tip_callout'
  | 'progress_stat'
  | 'outro_recap';

export type ConcreteStudio2411Animation = Exclude<Studio2411AnimationIn, 'random'>;

export interface Studio2411CardSpec {
  variant: Studio2411ComponentVariant;
  animationIn: Studio2411AnimationIn;
  resolvedAnimationIn: ConcreteStudio2411Animation;
  layoutKind: Studio2411CardLayoutKind;
  kickerLabel: string;
  title: string;
  subtitle: string;
  labels: string[];
  highlightWord: string;
  formula: string;
  speechText: string;
  reactionText: string;
  exampleText?: string;
  prevTargetText?: string;
  accentOverrideHex?: string;
  contextLabel: string;
  roleLabel: string;
  roleTone: PresentationRoleTone;
  iconKey: PresentationIconKey;
  stepIndex: number;
  totalSteps: number;
  progressPct: number;
  hasPause: boolean;
  pauseSec: number;
  theme: Studio2411ThemeMeta;
}

const CONCRETE_ANIMATIONS: ConcreteStudio2411Animation[] = [
  'pop-up',
  'slide-up',
  'drop-in',
  'fade-scale',
];

export function resolveStudio2411AnimationIn(
  animationIn: Studio2411AnimationIn | undefined,
  lineIndex: number,
  seed = 0
): ConcreteStudio2411Animation {
  if (animationIn && animationIn !== 'random') {
    return animationIn;
  }
  const idx = Math.abs(lineIndex * 3 + seed) % CONCRETE_ANIMATIONS.length;
  return CONCRETE_ANIMATIONS[idx];
}

function extractHighlightToken(cleanText: string): string {
  const quoted = cleanText.match(/[「『"“]([^」』"”]{2,42})[」』"”]/);
  if (quoted?.[1]) return quoted[1].trim();
  const numMatch = cleanText.match(/\d+(?:[.,]\d+)?%?/);
  if (numMatch) return numMatch[0];
  const words = cleanText
    .replace(/[.,!?;:。！？]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  if (words.length >= 2) {
    return `${words[words.length - 2]} ${words[words.length - 1]}`.trim();
  }
  if (words.length === 1) return words[0];
  return cleanText.trim() || 'Key Phrase';
}

function isConversationalLine(rawLine: string, scriptStyle?: ScriptStyle): boolean {
  if (scriptStyle === 'bilingual_dialogue' || scriptStyle === 'language_challenge') return true;
  if (/^\s*(?:Q|A|Question|Answer|\[V1\]|\[V2\]|\[VI\]|\[EN\]|\[JA\]|English|Japanese|Vietnamese)\s*[:：]?/i.test(rawLine)) {
    return true;
  }
  return /[「『"“][^」』"”]{2,}[」』"”]/.test(rawLine);
}

function defaultLabelsForLine(
  variant: Studio2411ComponentVariant,
  hasPause: boolean,
  isSecondarySlot: boolean,
  isQaInterview: boolean
): string[] {
  if (variant === 'friends-chat') {
    return isQaInterview ? ['Interviewer', 'Candidate'] : ['Speaker A', 'Speaker B'];
  }
  if (variant === 'avatar-speech') {
    return isSecondarySlot ? ['Candidate', 'Natural'] : ['Speaker', 'Context'];
  }
  if (variant === 'dialogue-upgrade') return ['Basic Form', 'Natural Form'];
  if (variant === 'css-compare') return ['Prompt', 'Target Phrase'];
  if (variant === 'css-roadmap' || variant === 'staircase-3d') return ['Listen', 'Recall', 'Speak'];
  if (variant === 'bs-alert-callout') return ['Key Insight', 'Pro Tip'];
  if (hasPause) return ['Listen', '5s Recall'];
  return isSecondarySlot ? ['Target Phrase', 'Speak Out'] : ['Core Concept', 'Focus'];
}

function defaultReactionForLine(
  layoutKind: Studio2411CardLayoutKind,
  hasPause: boolean,
  isSecondarySlot: boolean
): string {
  if (hasPause) return 'Think 5s!';
  if (layoutKind === 'answer_reveal' || isSecondarySlot) return 'Natural!';
  if (layoutKind === 'outro_recap') return 'Great Job!';
  return 'Key Tip!';
}

function buildContextualExampleForLine(params: {
  cleanText: string;
  roleKind: string;
  layoutKind: Studio2411CardLayoutKind;
  highlightWord: string;
  isDialogue: boolean;
  pauseSec: number;
}): string {
  const { cleanText, roleKind, layoutKind, highlightWord, isDialogue, pauseSec } = params;
  const lower = cleanText.toLowerCase();

  if (roleKind === 'title') {
    return `Listen closely and respond naturally within ${pauseSec} seconds.`;
  }
  if (roleKind === 'outro') {
    return 'Save this drill and repeat out loud daily for instant recall.';
  }
  if (/watch out/i.test(lower) || /気をつけて/i.test(cleanText)) {
    return 'Ex: Watch out for the deadline on Friday morning.';
  }
  if (/take it easy|don['’]t push/i.test(lower) || /無理しないで/i.test(cleanText)) {
    return 'Ex: Take it easy tonight — you already finished the hard part.';
  }
  if (/take your time|no rush/i.test(lower)) {
    return 'Ex: Take your time checking the details, there is no rush.';
  }
  if (/strength|proactive|長所/i.test(lower)) {
    return 'Ex: I am proactive when spotting issues early in team projects.';
  }
  if (/weakness|短所/i.test(lower)) {
    return 'Ex: I sometimes double-check details, so I set clear timeboxes.';
  }
  if (/latte|coffee|order|カフェ|コーヒー/i.test(lower)) {
    return 'Ex: Could I get a medium oat latte to go, please?';
  }
  if (/thank|appreciate|cảm ơn|ありがとう/i.test(lower)) {
    return 'Ex: I really appreciate your help with the presentation!';
  }
  if (layoutKind === 'answer_reveal') {
    return `Try in context: "${cleanText}"`;
  }
  if (layoutKind === 'quiz_prompt') {
    return isDialogue
      ? `Think how a native speaker responds using "${highlightWord}".`
      : `Say the target phrase out loud before the ${pauseSec}s timer ends.`;
  }
  return `Key focus: ${highlightWord}`;
}

function pickAutoVariant(params: {
  roleKind: string;
  hasPause: boolean;
  isSecondarySlot: boolean;
  isDialogue: boolean;
  isUpgradeCue: boolean;
  iconKey: PresentationIconKey;
  lineIndex: number;
  prevVariant?: Studio2411ComponentVariant;
}): Studio2411ComponentVariant {
  const {
    roleKind,
    hasPause,
    isSecondarySlot,
    isDialogue,
    isUpgradeCue,
    iconKey,
    lineIndex,
    prevVariant,
  } = params;
  let candidates: Studio2411ComponentVariant[];
  if (roleKind === 'title') {
    candidates = ['css-browser-mockup', 'bs-card-header'];
  } else if (roleKind === 'outro') {
    candidates = ['css-glass-quote', 'staircase-3d'];
  } else if (isUpgradeCue) {
    candidates = ['dialogue-upgrade', 'css-compare', 'avatar-speech'];
  } else if (roleKind === 'question' || hasPause) {
    candidates = isDialogue
      ? ['friends-chat', 'css-flashcard', 'avatar-speech', 'gauge-tone']
      : ['css-flashcard', 'gauge-tone', 'bs-alert-callout'];
  } else if (roleKind === 'answer' || isSecondarySlot) {
    candidates = isDialogue
      ? ['avatar-speech', 'dialogue-upgrade', 'friends-chat', 'css-compare', 'css-equation']
      : ['css-compare', 'css-equation', 'bs-progress-meter', 'staircase-3d'];
  } else if (isDialogue) {
    candidates = ['friends-chat', 'avatar-speech', 'dialogue-upgrade', 'css-compare', 'css-roadmap'];
  } else if (iconKey === 'bar_chart') {
    candidates = ['bs-progress-meter', 'staircase-3d', 'css-roadmap'];
  } else if (iconKey === 'alert_triangle') {
    candidates = ['bs-alert-callout', 'gauge-tone', 'css-compare'];
  } else {
    candidates = [
      'css-roadmap',
      'bs-card-header',
      'css-glass-quote',
      'staircase-3d',
      'css-equation',
      'bs-progress-meter',
    ];
  }
  const picked = candidates[lineIndex % candidates.length];
  if (prevVariant && picked === prevVariant && candidates.length > 1) {
    return candidates[(lineIndex + 1) % candidates.length];
  }
  return picked;
}

export function build2411CardSpecForLine(params: {
  rawLine: string;
  lineIndex: number;
  totalLines: number;
  isSecondarySlot?: boolean;
  isIntroOrOutro?: boolean;
  scriptStyle?: ScriptStyle;
  themeId?: Studio2411ThemeId;
  defaultPauseSec?: number;
  override?: Studio2411SceneComponentOverride;
  prevVariant?: Studio2411ComponentVariant;
  prevTargetText?: string;
  animationSeed?: number;
}): Studio2411CardSpec {
  const {
    rawLine,
    lineIndex,
    totalLines,
    isSecondarySlot = false,
    isIntroOrOutro = false,
    scriptStyle,
    themeId,
    defaultPauseSec = 5,
    override,
    prevVariant,
    prevTargetText,
    animationSeed = 0,
  } = params;

  const theme = getStudio2411ThemeMeta(themeId);
  const pres = analyzeScriptLinePresentation(rawLine, {
    isSecondarySlot,
    isIntroOrOutro,
    scriptStyle,
  });

  const safeTotal = Math.max(1, totalLines);
  const stepIndex = Math.max(1, Math.min(safeTotal, lineIndex + 1));
  const autoProgressPct = Math.round((stepIndex / safeTotal) * 100);
  const progressPct =
    typeof override?.progressPct === 'number'
      ? Math.max(5, Math.min(100, Math.round(override.progressPct)))
      : autoProgressPct;

  let layoutKind: Studio2411CardLayoutKind = 'tip_callout';
  let kickerLabel = 'STUDY INSIGHT';

  if (pres.roleKind === 'title') {
    layoutKind = 'intro_hero';
    kickerLabel =
      scriptStyle === 'language_challenge' || scriptStyle === 'quiz_riddle'
        ? '5S TRANSLATION DRILL'
        : 'TODAY TOPIC';
  } else if (pres.roleKind === 'outro') {
    layoutKind = 'outro_recap';
    kickerLabel = 'SESSION WRAP-UP';
  } else if (pres.roleKind === 'question' || pres.hasPause) {
    layoutKind = 'quiz_prompt';
    kickerLabel = 'LISTEN & TRANSLATE';
  } else if (pres.roleKind === 'answer' || isSecondarySlot) {
    layoutKind = 'answer_reveal';
    kickerLabel = 'NATURAL ANSWER';
  } else if (pres.contextIconKey === 'bar_chart') {
    layoutKind = 'progress_stat';
    kickerLabel = 'KEY DATA POINT';
  }

  const cleanText = stripNarrationTags(rawLine);
  const isDialogue = isConversationalLine(rawLine, scriptStyle);
  const isQaInterview =
    /^\s*(?:Q|A|Question|Answer)\s*[:：]/i.test(rawLine) ||
    /(interview|phỏng vấn|面接|長所|短所|strength|weakness)/i.test(cleanText);
  const isUpgradeCue =
    /(instead of|don't say|natural|polite|thay vì|tự nhiên|lịch sự|丁寧|自然)/i.test(cleanText);

  const variant: Studio2411ComponentVariant =
    override?.variant ??
    pickAutoVariant({
      roleKind: pres.roleKind,
      hasPause: pres.hasPause,
      isSecondarySlot,
      isDialogue,
      isUpgradeCue,
      iconKey: pres.contextIconKey,
      lineIndex,
      prevVariant,
    });

  const animationIn: Studio2411AnimationIn = override?.animationIn ?? 'random';
  const resolvedAnimationIn = resolveStudio2411AnimationIn(
    animationIn,
    lineIndex,
    animationSeed
  );

  const pauseSec = pres.pauseSec ?? Math.max(1, Math.round(defaultPauseSec || 5));

  const englishRole = getLocalizedRoleLabel(pres.roleKind, 'en');
  const title =
    override?.title?.trim() ||
    `${englishRole} · ${pres.contextLabel}`;
  const subtitle =
    override?.subtitle?.trim() ||
    (pres.hasPause
      ? `THINK TIME · ${pauseSec}S`
      : layoutKind === 'answer_reveal'
      ? 'TARGET PHRASE'
      : layoutKind === 'outro_recap'
      ? 'KEY RECAP'
      : 'FOCUS MODE');

  const labels =
    override?.labels && override.labels.length > 0
      ? override.labels.slice(0, 3)
      : defaultLabelsForLine(variant, pres.hasPause, isSecondarySlot, isQaInterview);

  const highlightWord = override?.highlightWord?.trim() || extractHighlightToken(cleanText);
  const formula =
    override?.formula?.trim() ||
    (labels.length >= 2 ? `${labels[0]} + ${labels[1]} = ${highlightWord}` : `Input + Context = ${highlightWord}`);
  const speechText = override?.speechText?.trim() || cleanText || title;
  const reactionText =
    override?.reactionText?.trim() ||
    defaultReactionForLine(layoutKind, pres.hasPause, isSecondarySlot);

  const exampleText =
    override?.exampleText?.trim() ||
    buildContextualExampleForLine({
      cleanText,
      roleKind: pres.roleKind,
      layoutKind,
      highlightWord,
      isDialogue,
      pauseSec,
    });

  const resolvedPrevTarget =
    override?.prevTargetText?.trim() || prevTargetText?.trim() || undefined;

  return {
    variant,
    animationIn,
    resolvedAnimationIn,
    layoutKind,
    kickerLabel,
    title,
    subtitle,
    labels,
    highlightWord,
    formula,
    speechText,
    reactionText,
    exampleText,
    prevTargetText: resolvedPrevTarget,
    accentOverrideHex: override?.accentColor,
    contextLabel: pres.contextLabel,
    roleLabel: pres.roleLabel,
    roleTone: pres.roleTone,
    iconKey: pres.contextIconKey,
    stepIndex,
    totalSteps: safeTotal,
    progressPct,
    hasPause: pres.hasPause,
    pauseSec,
    theme,
  };
}

/**
 * Generates a full 1-to-1 context-aware array of Studio 2411 component overrides
 * (selecting dialogue/chat components for Q&A or two-speaker lines, comparison/equation for answers,
 * roadmap/progress for steps, non-repeating variants, useful examples, and previous-target recall).
 */
export function buildContextualSceneComponentsForScript(params: {
  script: string;
  scriptStyle?: ScriptStyle;
  pauseBetweenLinesSec?: number;
  existingOverrides?: Studio2411SceneComponentOverride[];
}): Studio2411SceneComponentOverride[] {
  const lines = params.script
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const result: Studio2411SceneComponentOverride[] = [];
  let prevVariant: Studio2411ComponentVariant | undefined;
  let lastTargetText: string | undefined;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const pres = analyzeScriptLinePresentation(rawLine, {
      scriptStyle: params.scriptStyle,
    });
    const hasExplicitTargetTag =
      /^\s*(?:English|Japanese|Vietnamese|\[EN\]|\[JA\]|\[VI\]|\[V2\])\s*[:：]?/i.test(rawLine);
    const isSecondary =
      hasExplicitTargetTag || (pres.roleKind === 'answer' && !pres.hasPause);
    const existing = params.existingOverrides?.[idx];
    const showRecall = !isSecondary && pres.roleKind !== 'title' ? lastTargetText : undefined;

    const spec = build2411CardSpecForLine({
      rawLine,
      lineIndex: idx,
      totalLines: lines.length,
      isSecondarySlot: isSecondary,
      isIntroOrOutro: pres.roleKind === 'title' || pres.roleKind === 'outro',
      scriptStyle: params.scriptStyle,
      defaultPauseSec: params.pauseBetweenLinesSec ?? 5,
      override: existing,
      prevVariant,
      prevTargetText: showRecall,
    });
    prevVariant = spec.variant;

    if (isSecondary && pres.cleanText) {
      lastTargetText = pres.cleanText;
    }

    result.push({
      variant: spec.variant,
      animationIn: spec.animationIn,
      title: spec.title,
      subtitle: spec.subtitle,
      labels: spec.labels,
      highlightWord: spec.highlightWord,
      formula: spec.formula,
      speechText: spec.speechText,
      reactionText: spec.reactionText,
      ...(spec.exampleText ? { exampleText: spec.exampleText } : {}),
      ...(spec.prevTargetText ? { prevTargetText: spec.prevTargetText } : {}),
      progressPct: spec.progressPct,
      ...(spec.accentOverrideHex ? { accentColor: spec.accentOverrideHex } : {}),
    });
  }
  return result;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function charVisualUnits(ch: string): number {
  if (/[\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(ch)) return 1.85;
  if (/[A-ZMW@]/.test(ch)) return 1.18;
  if (/[ilIjtfr.,:;!|'\s]/.test(ch)) return 0.56;
  return 0.96;
}

/**
 * Wraps card copy across multiple clean lines without appending "..." truncation,
 * keeping Latin words intact and breaking CJK runs smoothly.
 */
export function wrapSvgCardLines(
  text: string,
  maxUnitsPerLine: number,
  maxLines = 4
): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  const budget = Math.max(8, maxUnitsPerLine);

  const tokens = clean.split(' ');
  const lines: string[] = [];
  let current = '';
  let currentUnits = 0;

  const flushLine = () => {
    if (current.trim()) {
      lines.push(current.trim());
    }
    current = '';
    currentUnits = 0;
  };

  for (let ti = 0; ti < tokens.length; ti++) {
    const word = tokens[ti];
    const wordUnits = Array.from(word).reduce((sum, ch) => sum + charVisualUnits(ch), 0);

    // Handle long unspaced runs (like Japanese sentences) character-by-character
    if (wordUnits > budget) {
      if (current) flushLine();
      let chunk = '';
      let chunkUnits = 0;
      for (const ch of Array.from(word)) {
        const u = charVisualUnits(ch);
        if (chunk && chunkUnits + u > budget && lines.length < maxLines - 1) {
          lines.push(chunk);
          chunk = ch;
          chunkUnits = u;
        } else {
          chunk += ch;
          chunkUnits += u;
        }
      }
      if (chunk) {
        current = chunk;
        currentUnits = chunkUnits;
      }
      continue;
    }

    const spaceCost = current ? 0.55 : 0;
    if (current && currentUnits + spaceCost + wordUnits > budget) {
      if (lines.length < maxLines - 1) {
        flushLine();
        current = word;
        currentUnits = wordUnits;
      } else {
        // On last allowed line: append rather than dropping words with "..."
        current = `${current} ${word}`;
        currentUnits += spaceCost + wordUnits;
      }
    } else {
      current = current ? `${current} ${word}` : word;
      currentUnits += spaceCost + wordUnits;
    }
  }
  if (current.trim()) {
    lines.push(current.trim());
  }
  return lines.slice(0, maxLines);
}

function renderSvgTextLines(opts: {
  lines: string[];
  x: number;
  startY: number;
  lineHeight: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fill: string;
  anchor?: 'start' | 'middle' | 'end';
}): string {
  const { lines, x, startY, lineHeight, fontFamily, fontSize, fontWeight, fill, anchor = 'start' } =
    opts;
  const anchorAttr = anchor !== 'start' ? ` text-anchor="${anchor}"` : '';
  return lines
    .map(
      (ln, idx) =>
        `<text x="${x}" y="${Math.round(startY + idx * lineHeight)}"${anchorAttr} font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeXml(ln)}</text>`
    )
    .join('');
}

function adaptiveLineFontSize(baseSize: number, lines: string[], maxUnits: number): number {
  const longestUnits = Math.max(
    1,
    ...lines.map((l) => Array.from(l).reduce((s, ch) => s + charVisualUnits(ch), 0))
  );
  let factor = 1;
  if (lines.length >= 3) factor *= 0.84;
  else if (lines.length === 2) factor *= 0.92;
  if (longestUnits > maxUnits * 1.05) {
    factor *= Math.max(0.68, maxUnits / longestUnits);
  }
  return Math.max(10, Math.round(baseSize * factor));
}

function getSvgVectorIllustration(
  iconKey: PresentationIconKey,
  cx: number,
  cy: number,
  scale: number,
  primaryHex: string,
  secondaryHex: string,
  cardBgHex: string
): string {
  const s = scale;
  switch (iconKey) {
    case 'alert_triangle':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <path d="M0 -34 L32 24 C34 28 31 32 27 32 L-27 32 C-31 32 -34 28 -32 24 Z" fill="${secondaryHex}" fill-opacity="0.16" stroke="${primaryHex}" stroke-width="4" stroke-linejoin="round"/>
        <line x1="0" y1="-12" x2="0" y2="8" stroke="${primaryHex}" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="0" cy="20" r="3" fill="${primaryHex}"/>
      </g>`;
    case 'briefcase':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <rect x="-34" y="-18" width="68" height="46" rx="10" fill="${primaryHex}" fill-opacity="0.14" stroke="${primaryHex}" stroke-width="3.6"/>
        <path d="M-14 -18 L-14 -27 C-14 -30 -11 -32 -8 -32 L8 -32 C11 -32 14 -30 14 -27 L14 -18" fill="none" stroke="${primaryHex}" stroke-width="3.6"/>
        <path d="M-34 2 L34 2" stroke="${secondaryHex}" stroke-width="3" stroke-opacity="0.75"/>
        <rect x="-6" y="-2" width="12" height="8" rx="3" fill="${secondaryHex}"/>
      </g>`;
    case 'coffee':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <path d="M-24 -12 L20 -12 L16 24 C15 30 9 34 0 34 L-4 34 C-13 34 -19 30 -20 24 Z" fill="${primaryHex}" fill-opacity="0.16" stroke="${primaryHex}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M20 -4 C32 -4 34 14 18 16" fill="none" stroke="${primaryHex}" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M-10 -24 C-10 -31 -4 -33 -4 -39 M4 -24 C4 -31 10 -33 10 -39" fill="none" stroke="${secondaryHex}" stroke-width="3" stroke-linecap="round"/>
      </g>`;
    case 'waves':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <circle cx="0" cy="0" r="36" fill="${secondaryHex}" fill-opacity="0.12" stroke="${primaryHex}" stroke-width="3"/>
        <path d="M-28 -4 Q-14 -18 0 -4 T28 -4" fill="none" stroke="${primaryHex}" stroke-width="4" stroke-linecap="round"/>
        <path d="M-24 12 Q-10 0 4 12 T26 12" fill="none" stroke="${secondaryHex}" stroke-width="3.6" stroke-linecap="round"/>
      </g>`;
    case 'clock':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <circle cx="0" cy="2" r="32" fill="${primaryHex}" fill-opacity="0.13" stroke="${primaryHex}" stroke-width="3.8"/>
        <line x1="-10" y1="-36" x2="10" y2="-36" stroke="${secondaryHex}" stroke-width="4" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="0" y2="-16" stroke="${primaryHex}" stroke-width="4" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="15" y2="11" stroke="${secondaryHex}" stroke-width="3.8" stroke-linecap="round"/>
        <circle cx="0" cy="2" r="3.5" fill="${primaryHex}"/>
      </g>`;
    case 'heart':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <path d="M0 28 C-26 12 -36 -6 -28 -22 C-21 -34 -6 -32 0 -18 C6 -32 21 -34 28 -22 C36 -6 26 12 0 28 Z" fill="${secondaryHex}" fill-opacity="0.2" stroke="${primaryHex}" stroke-width="3.8" stroke-linejoin="round"/>
      </g>`;
    case 'lightbulb':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <path d="M-16 10 C-28 -2 -26 -24 -8 -32 C10 -40 28 -24 22 -4 C20 4 14 8 12 16 L-12 16 C-13 13 -14 11 -16 10 Z" fill="${secondaryHex}" fill-opacity="0.22" stroke="${primaryHex}" stroke-width="3.6" stroke-linejoin="round"/>
        <line x1="-9" y1="24" x2="9" y2="24" stroke="${primaryHex}" stroke-width="3.6" stroke-linecap="round"/>
        <line x1="-6" y1="32" x2="6" y2="32" stroke="${primaryHex}" stroke-width="3.6" stroke-linecap="round"/>
      </g>`;
    case 'globe':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <circle cx="0" cy="0" r="32" fill="${primaryHex}" fill-opacity="0.12" stroke="${primaryHex}" stroke-width="3.5"/>
        <ellipse cx="0" cy="0" rx="14" ry="32" fill="none" stroke="${secondaryHex}" stroke-width="3"/>
        <line x1="-31" y1="-10" x2="31" y2="-10" stroke="${primaryHex}" stroke-width="2.5" stroke-opacity="0.65"/>
        <line x1="-31" y1="10" x2="31" y2="10" stroke="${primaryHex}" stroke-width="2.5" stroke-opacity="0.65"/>
      </g>`;
    case 'bar_chart':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <rect x="-30" y="2" width="14" height="28" rx="4" fill="${secondaryHex}" fill-opacity="0.5"/>
        <rect x="-7" y="-14" width="14" height="44" rx="4" fill="${primaryHex}" fill-opacity="0.8"/>
        <rect x="16" y="-28" width="14" height="58" rx="4" fill="${secondaryHex}"/>
      </g>`;
    case 'sparkles':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <path d="M0 -34 L7 -9 L32 -2 L7 5 L0 30 L-7 5 L-32 -2 L-7 -9 Z" fill="${secondaryHex}" fill-opacity="0.22" stroke="${primaryHex}" stroke-width="3.2" stroke-linejoin="round"/>
        <circle cx="24" cy="-24" r="5" fill="${secondaryHex}"/>
        <circle cx="-24" cy="22" r="4" fill="${primaryHex}"/>
      </g>`;
    case 'megaphone':
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <path d="M-28 -8 L16 -24 L16 20 L-28 4 Z" fill="${primaryHex}" fill-opacity="0.18" stroke="${primaryHex}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M24 -10 C32 -4 32 4 24 10" fill="none" stroke="${secondaryHex}" stroke-width="3.6" stroke-linecap="round"/>
        <line x1="-18" y1="7" x2="-12" y2="26" stroke="${primaryHex}" stroke-width="4" stroke-linecap="round"/>
      </g>`;
    default:
      return `<g transform="translate(${cx},${cy}) scale(${s})">
        <rect x="-34" y="-22" width="44" height="30" rx="10" fill="${primaryHex}" fill-opacity="0.16" stroke="${primaryHex}" stroke-width="3.4"/>
        <rect x="-4" y="-2" width="38" height="28" rx="9" fill="${cardBgHex}" stroke="${secondaryHex}" stroke-width="3.4"/>
        <line x1="6" y1="9" x2="24" y2="9" stroke="${secondaryHex}" stroke-width="3.2" stroke-linecap="round"/>
        <line x1="6" y1="18" x2="18" y2="18" stroke="${primaryHex}" stroke-width="3.2" stroke-linecap="round"/>
      </g>`;
  }
}

function buildSvgCharacterAvatar(opts: {
  cx: number;
  cy: number;
  scale: number;
  shirtHex: string;
  hairHex: string;
  hairStyle: 'short' | 'bob';
  tagText?: string;
  tagHex?: string;
  fontFamily: string;
  smallSize: number;
}): string {
  const { cx, cy, scale, shirtHex, hairHex, hairStyle, tagText, tagHex, fontFamily, smallSize } = opts;
  const hairSvg =
    hairStyle === 'bob'
      ? `<path d="M-24 -6 C-26 -28 26 -28 24 -6 L24 10 C18 6 14 -6 0 -8 C-14 -6 -18 6 -24 10 Z" fill="${hairHex}"/>`
      : `<path d="M-21 -8 C-20 -26 20 -26 21 -8 C12 -14 -12 -14 -21 -8 Z" fill="${hairHex}"/>`;
  const pillText = (tagText ?? '').trim();
  const pillW = Math.max(92, Math.min(130, pillText.length * 8 + 22));
  const pillFont = Math.max(9, Math.round(smallSize * 0.72));
  const namePill = pillText
    ? `<rect x="${-Math.round(pillW / 2)}" y="34" width="${pillW}" height="22" rx="11" fill="${tagHex ?? shirtHex}"/>
       <text x="0" y="49" text-anchor="middle" font-family="${fontFamily}" font-size="${pillFont}" font-weight="700" fill="#FFFFFF">${escapeXml(pillText)}</text>`
    : '';

  return `<g transform="translate(${cx},${cy}) scale(${scale})">
    <path d="M-26 32 C-24 14 24 14 26 32 Z" fill="${shirtHex}"/>
    <circle cx="0" cy="-2" r="19" fill="#FDE68A"/>
    ${hairSvg}
    <circle cx="-6" cy="-2" r="2.2" fill="#1E293B"/>
    <circle cx="6" cy="-2" r="2.2" fill="#1E293B"/>
    <path d="M-6 6 Q0 12 6 6" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/>
    ${namePill}
  </g>`;
}

/**
 * Generates high-DPI SVG cards for ALL 14 lequyenktpm/2411 variants with multi-line wrapping
 * (zero "..." truncation, zero box overflow) + optional example and recall memory footer.
 */
export function build2411CardSvg(params: {
  spec: Studio2411CardSpec;
  width: number;
  height: number;
  fontFilePath?: string;
}): string {
  const { spec, width, height, fontFilePath } = params;
  const { theme } = spec;
  const isLandscape = width > height;

  const fontFaceCss = fontFilePath
    ? `@font-face { font-family: 'Studio2411Font'; src: url('file://${fontFilePath.replace(/\\/g, '/')}'); font-weight: 700; }`
    : '';
  const fontFamily = fontFilePath
    ? `'Studio2411Font', 'M PLUS 1p', 'Noto Sans', sans-serif`
    : `'M PLUS 1p', 'Noto Sans', sans-serif`;

  const cardW = isLandscape ? Math.round(width * 0.76) : Math.round(width * 0.88);
  const cardH = isLandscape ? Math.round(height * 0.44) : Math.round(height * 0.31);
  const cardX = Math.round((width - cardW) / 2);
  const cardY = isLandscape ? Math.round(height * 0.055) : Math.round(height * 0.072);
  const cardR = Math.max(18, Math.round(Math.min(width, height) * 0.03));

  const gridStep = Math.max(28, Math.round(Math.min(width, height) * 0.055));
  const dotLines: string[] = [];
  for (let gx = gridStep; gx < width; gx += gridStep) {
    dotLines.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${height}" stroke="${theme.gridColorRgba}" stroke-width="1"/>`);
  }
  for (let gy = gridStep; gy < height; gy += gridStep) {
    dotLines.push(`<line x1="0" y1="${gy}" x2="${width}" y2="${gy}" stroke="${theme.gridColorRgba}" stroke-width="1"/>`);
  }

  const headerH = Math.round(cardH * 0.17);
  const padX = Math.round(cardW * 0.048);
  const stepText = `${String(spec.stepIndex).padStart(2, '0')} / ${String(spec.totalSteps).padStart(2, '0')}`;
  const titleSize = Math.max(14, Math.round(Math.min(width, height) * 0.023));
  const smallSize = Math.max(11, Math.round(titleSize * 0.78));
  const bigSize = Math.max(17, Math.round(titleSize * 1.18));

  const modePrimaryHex =
    spec.accentOverrideHex ??
    (spec.layoutKind === 'answer_reveal' ? theme.secondaryAccentHex : theme.accentHex);
  const modeSecondaryHex =
    spec.layoutKind === 'answer_reveal' ? theme.accentHex : theme.secondaryAccentHex;

  const hasFooterContext = Boolean(spec.prevTargetText || spec.exampleText);
  const footerReserve = hasFooterContext ? Math.round(cardH * 0.18) : Math.round(cardH * 0.06);
  const bodyTop = cardY + headerH + Math.round(cardH * 0.05);
  const bodyH = cardH - headerH - footerReserve - Math.round(cardH * 0.08);
  const innerW = cardW - padX * 2;
  const iconScale = Math.max(0.65, Math.min(1.25, Math.min(cardW, cardH) / 280));

  let variantBodySvg = '';

  switch (spec.variant) {
    case 'css-compare': {
      const colW = Math.round((innerW - 28) / 2);
      const colH = Math.round(bodyH * 0.90);
      const leftLabel = spec.labels[0] ?? 'Prompt';
      const rightLabel = spec.labels[1] ?? 'Target Phrase';
      const leftBudget = Math.max(10, Math.floor((colW - 24) / (smallSize * 0.62)));
      const leftLines = wrapSvgCardLines(spec.contextLabel || spec.subtitle, leftBudget, 3);
      const rightLines = wrapSvgCardLines(spec.speechText || spec.highlightWord, leftBudget, 3);
      const leftFont = adaptiveLineFontSize(titleSize, leftLines, leftBudget);
      const rightFont = adaptiveLineFontSize(titleSize, rightLines, leftBudget);
      variantBodySvg = `
        <rect x="${cardX + padX}" y="${bodyTop}" width="${colW}" height="${colH}" rx="12" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        <rect x="${cardX + padX + colW + 28}" y="${bodyTop}" width="${colW}" height="${colH}" rx="12" fill="${modePrimaryHex}" fill-opacity="0.11" stroke="${modePrimaryHex}" stroke-width="2"/>
        <circle cx="${cardX + padX + colW + 14}" cy="${bodyTop + Math.round(colH / 2)}" r="14" fill="${modeSecondaryHex}"/>
        <text x="${cardX + padX + colW + 14}" y="${bodyTop + Math.round(colH / 2) + 4}" text-anchor="middle" font-family="${fontFamily}" font-size="${Math.max(10, Math.round(smallSize * 0.85))}" font-weight="700" fill="#FFFFFF">VS</text>
        <text x="${cardX + padX + Math.round(colW / 2)}" y="${bodyTop + Math.round(smallSize * 1.4)}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${theme.mutedTextHex}">${escapeXml(leftLabel)}</text>
        ${renderSvgTextLines({
          lines: leftLines,
          x: cardX + padX + Math.round(colW / 2),
          startY: bodyTop + Math.round(colH * 0.48),
          lineHeight: Math.round(leftFont * 1.24),
          fontFamily,
          fontSize: leftFont,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        <text x="${cardX + padX + colW + 28 + Math.round(colW / 2)}" y="${bodyTop + Math.round(smallSize * 1.4)}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(rightLabel)}</text>
        ${renderSvgTextLines({
          lines: rightLines,
          x: cardX + padX + colW + 28 + Math.round(colW / 2),
          startY: bodyTop + Math.round(colH * 0.48),
          lineHeight: Math.round(rightFont * 1.24),
          fontFamily,
          fontSize: rightFont,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
      `;
      break;
    }

    case 'css-roadmap': {
      const nodes = [
        spec.labels[0] ?? 'Listen',
        spec.labels[1] ?? 'Recall',
        spec.labels[2] ?? 'Speak',
      ];
      const activeNode = spec.stepIndex % 3;
      const lineY = bodyTop + Math.round(bodyH * 0.28);
      const startX = cardX + padX + Math.round(innerW * 0.14);
      const endX = cardX + padX + Math.round(innerW * 0.86);
      const stepDx = Math.round((endX - startX) / 2);
      const titleBudget = Math.max(16, Math.floor(innerW / (smallSize * 0.6)));
      const titleLines = wrapSvgCardLines(spec.title, titleBudget, 2);
      variantBodySvg = `
        <line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="${theme.cardBorderHex}" stroke-width="4" stroke-linecap="round"/>
        <line x1="${startX}" y1="${lineY}" x2="${startX + activeNode * stepDx}" y2="${lineY}" stroke="${modePrimaryHex}" stroke-width="5" stroke-linecap="round"/>
        ${nodes
          .map((lbl, ni) => {
            const nx = startX + ni * stepDx;
            const active = ni <= activeNode;
            return `<circle cx="${nx}" cy="${lineY}" r="15" fill="${active ? modePrimaryHex : theme.cardBgHex}" stroke="${active ? modePrimaryHex : theme.cardBorderHex}" stroke-width="3"/>
              <text x="${nx}" y="${lineY + 5}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${active ? '#FFFFFF' : theme.mutedTextHex}">0${ni + 1}</text>
              <text x="${nx}" y="${lineY + 34}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${active ? theme.textHex : theme.mutedTextHex}">${escapeXml(lbl)}</text>`;
          })
          .join('')}
        ${renderSvgTextLines({
          lines: titleLines,
          x: cardX + Math.round(cardW / 2),
          startY: bodyTop + Math.round(bodyH * 0.74),
          lineHeight: Math.round(smallSize * 1.24),
          fontFamily,
          fontSize: smallSize,
          fontWeight: 600,
          fill: theme.mutedTextHex,
          anchor: 'middle',
        })}
      `;
      break;
    }

    case 'css-glass-quote': {
      const qBudget = Math.max(14, Math.floor((innerW - 72) / (titleSize * 0.6)));
      const qLines = wrapSvgCardLines(spec.title, qBudget, 2);
      const subLines = wrapSvgCardLines(spec.subtitle, qBudget + 4, 2);
      const qFont = adaptiveLineFontSize(titleSize, qLines, qBudget);
      const pillW = Math.min(innerW - 70, Math.max(110, spec.highlightWord.length * 9 + 34));
      variantBodySvg = `
        <rect x="${cardX + padX}" y="${bodyTop}" width="6" height="${Math.round(bodyH * 0.88)}" rx="3" fill="${modePrimaryHex}"/>
        <text x="${cardX + padX + 18}" y="${bodyTop + Math.round(bigSize * 0.88)}" font-family="${fontFamily}" font-size="${Math.round(bigSize * 1.35)}" font-weight="700" fill="${modeSecondaryHex}" fill-opacity="0.55">“</text>
        ${renderSvgTextLines({
          lines: qLines,
          x: cardX + padX + 50,
          startY: bodyTop + Math.round(qFont * 1.2),
          lineHeight: Math.round(qFont * 1.25),
          fontFamily,
          fontSize: qFont,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        ${renderSvgTextLines({
          lines: subLines,
          x: cardX + padX + 50,
          startY: bodyTop + Math.round(bodyH * 0.56),
          lineHeight: Math.round(smallSize * 1.2),
          fontFamily,
          fontSize: smallSize,
          fontWeight: 500,
          fill: theme.mutedTextHex,
        })}
        <rect x="${cardX + padX + 50}" y="${bodyTop + Math.round(bodyH * 0.72)}" width="${pillW}" height="${Math.round(smallSize * 1.65)}" rx="8" fill="${modePrimaryHex}" fill-opacity="0.14"/>
        <text x="${cardX + padX + 62}" y="${bodyTop + Math.round(bodyH * 0.72) + Math.round(smallSize * 1.15)}" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(spec.highlightWord)}</text>
      `;
      break;
    }

    case 'css-equation': {
      const partA = spec.labels[0] ?? 'Pattern A';
      const partB = spec.labels[1] ?? 'Context B';
      const resC = spec.highlightWord;
      const boxW = Math.round((innerW - 56) / 3);
      const boxH = Math.round(bodyH * 0.62);
      const boxY = bodyTop + Math.round(bodyH * 0.25);
      const fBudget = Math.max(16, Math.floor(innerW / (smallSize * 0.6)));
      const fLines = wrapSvgCardLines(spec.formula, fBudget, 1);
      const boxBudget = Math.max(8, Math.floor((boxW - 14) / (smallSize * 0.62)));
      const aLines = wrapSvgCardLines(partA, boxBudget, 2);
      const bLines = wrapSvgCardLines(partB, boxBudget, 2);
      const cLines = wrapSvgCardLines(resC, boxBudget, 2);
      const boxFontA = adaptiveLineFontSize(smallSize, aLines, boxBudget);
      const boxFontB = adaptiveLineFontSize(smallSize, bLines, boxBudget);
      const boxFontC = adaptiveLineFontSize(smallSize, cLines, boxBudget);
      variantBodySvg = `
        ${renderSvgTextLines({
          lines: fLines,
          x: cardX + padX,
          startY: bodyTop + Math.round(smallSize * 1.15),
          lineHeight: Math.round(smallSize * 1.2),
          fontFamily,
          fontSize: smallSize,
          fontWeight: 700,
          fill: modePrimaryHex,
        })}
        <rect x="${cardX + padX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="10" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        ${renderSvgTextLines({
          lines: aLines,
          x: cardX + padX + Math.round(boxW / 2),
          startY: boxY + Math.round(boxH * 0.46),
          lineHeight: Math.round(boxFontA * 1.2),
          fontFamily,
          fontSize: boxFontA,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        <text x="${cardX + padX + boxW + 14}" y="${boxY + Math.round(boxH * 0.56)}" text-anchor="middle" font-family="${fontFamily}" font-size="${bigSize}" font-weight="700" fill="${modeSecondaryHex}">+</text>
        <rect x="${cardX + padX + boxW + 28}" y="${boxY}" width="${boxW}" height="${boxH}" rx="10" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        ${renderSvgTextLines({
          lines: bLines,
          x: cardX + padX + boxW + 28 + Math.round(boxW / 2),
          startY: boxY + Math.round(boxH * 0.46),
          lineHeight: Math.round(boxFontB * 1.2),
          fontFamily,
          fontSize: boxFontB,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        <text x="${cardX + padX + boxW * 2 + 42}" y="${boxY + Math.round(boxH * 0.56)}" text-anchor="middle" font-family="${fontFamily}" font-size="${bigSize}" font-weight="700" fill="${modePrimaryHex}">=</text>
        <rect x="${cardX + padX + boxW * 2 + 56}" y="${boxY}" width="${boxW}" height="${boxH}" rx="10" fill="${modePrimaryHex}" fill-opacity="0.16" stroke="${modePrimaryHex}" stroke-width="2"/>
        ${renderSvgTextLines({
          lines: cLines,
          x: cardX + padX + boxW * 2 + 56 + Math.round(boxW / 2),
          startY: boxY + Math.round(boxH * 0.46),
          lineHeight: Math.round(boxFontC * 1.2),
          fontFamily,
          fontSize: boxFontC,
          fontWeight: 700,
          fill: modePrimaryHex,
          anchor: 'middle',
        })}
      `;
      break;
    }

    case 'css-flashcard': {
      const boxH = Math.round(bodyH * 0.90);
      const fcBudget = Math.max(14, Math.floor((innerW - 36) / (bigSize * 0.58)));
      const hwLines = wrapSvgCardLines(spec.highlightWord, fcBudget, 2);
      const hwFont = adaptiveLineFontSize(bigSize, hwLines, fcBudget);
      const subBudget = Math.max(16, Math.floor((innerW - 36) / (smallSize * 0.58)));
      const subLines = wrapSvgCardLines(spec.subtitle, subBudget, 2);
      variantBodySvg = `
        <rect x="${cardX + padX + 6}" y="${bodyTop + 5}" width="${innerW - 6}" height="${boxH}" rx="14" fill="${modeSecondaryHex}" fill-opacity="0.12" stroke="${theme.cardBorderHex}" stroke-width="1"/>
        <rect x="${cardX + padX}" y="${bodyTop}" width="${innerW - 6}" height="${boxH}" rx="14" fill="${theme.surfaceTintHex}" stroke="${modePrimaryHex}" stroke-width="2"/>
        <text x="${cardX + padX + 18}" y="${bodyTop + Math.round(smallSize * 1.5)}" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(spec.labels[0] ?? 'FLASHCARD')}</text>
        ${renderSvgTextLines({
          lines: hwLines,
          x: cardX + Math.round(cardW / 2),
          startY: bodyTop + Math.round(boxH * 0.48),
          lineHeight: Math.round(hwFont * 1.22),
          fontFamily,
          fontSize: hwFont,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        ${renderSvgTextLines({
          lines: subLines,
          x: cardX + Math.round(cardW / 2),
          startY: bodyTop + Math.round(boxH * 0.80),
          lineHeight: Math.round(smallSize * 1.2),
          fontFamily,
          fontSize: smallSize,
          fontWeight: 600,
          fill: theme.mutedTextHex,
          anchor: 'middle',
        })}
      `;
      break;
    }

    case 'bs-progress-meter': {
      const meterW = innerW;
      const meterH = Math.max(16, Math.round(bodyH * 0.20));
      const meterY = bodyTop + Math.round(bodyH * 0.46);
      const fillW = Math.max(20, Math.round((spec.progressPct / 100) * meterW));
      const tBudget = Math.max(14, Math.floor((innerW - 80) / (titleSize * 0.6)));
      const tLines = wrapSvgCardLines(spec.title, tBudget, 2);
      const tFont = adaptiveLineFontSize(titleSize, tLines, tBudget);
      variantBodySvg = `
        ${renderSvgTextLines({
          lines: tLines,
          x: cardX + padX,
          startY: bodyTop + Math.round(tFont * 1.1),
          lineHeight: Math.round(tFont * 1.2),
          fontFamily,
          fontSize: tFont,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        <text x="${cardX + cardW - padX}" y="${bodyTop + Math.round(bigSize * 1.05)}" text-anchor="end" font-family="${fontFamily}" font-size="${bigSize}" font-weight="700" fill="${modePrimaryHex}">${spec.progressPct}%</text>
        <rect x="${cardX + padX}" y="${meterY}" width="${meterW}" height="${meterH}" rx="${Math.round(meterH / 2)}" fill="${theme.cardBorderHex}" fill-opacity="0.55"/>
        <rect x="${cardX + padX}" y="${meterY}" width="${fillW}" height="${meterH}" rx="${Math.round(meterH / 2)}" fill="url(#accentBar)"/>
        <text x="${cardX + padX}" y="${meterY + meterH + Math.round(smallSize * 1.45)}" font-family="${fontFamily}" font-size="${smallSize}" font-weight="600" fill="${theme.mutedTextHex}">${escapeXml(spec.labels.join(' · '))}</text>
      `;
      break;
    }

    case 'bs-alert-callout': {
      const iconCx = cardX + padX + Math.round(cardW * 0.12);
      const iconCy = bodyTop + Math.round(bodyH * 0.44);
      const textX = cardX + padX + Math.round(cardW * 0.24);
      const textBudget = Math.max(14, Math.floor((innerW - cardW * 0.25) / (titleSize * 0.6)));
      const tLines = wrapSvgCardLines(spec.title, textBudget, 2);
      const sLines = wrapSvgCardLines(spec.subtitle, textBudget + 4, 2);
      const tFont = adaptiveLineFontSize(titleSize, tLines, textBudget);
      variantBodySvg = `
        <rect x="${cardX + padX}" y="${bodyTop}" width="${innerW}" height="${Math.round(bodyH * 0.90)}" rx="12" fill="${modeSecondaryHex}" fill-opacity="0.10" stroke="${modeSecondaryHex}" stroke-width="1.5"/>
        <rect x="${cardX + padX}" y="${bodyTop}" width="9" height="${Math.round(bodyH * 0.90)}" rx="4" fill="${modeSecondaryHex}"/>
        ${getSvgVectorIllustration('alert_triangle', iconCx, iconCy, iconScale * 0.85, modeSecondaryHex, modePrimaryHex, theme.cardBgHex)}
        ${renderSvgTextLines({
          lines: tLines,
          x: textX,
          startY: bodyTop + Math.round(bodyH * 0.30),
          lineHeight: Math.round(tFont * 1.22),
          fontFamily,
          fontSize: tFont,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        ${renderSvgTextLines({
          lines: sLines,
          x: textX,
          startY: bodyTop + Math.round(bodyH * 0.64),
          lineHeight: Math.round(smallSize * 1.2),
          fontFamily,
          fontSize: smallSize,
          fontWeight: 500,
          fill: theme.mutedTextHex,
        })}
      `;
      break;
    }

    case 'gauge-tone': {
      const gcx = cardX + Math.round(cardW * 0.25);
      const gcy = bodyTop + Math.round(bodyH * 0.66);
      const r = Math.max(32, Math.round(Math.min(cardW * 0.16, bodyH * 0.52)));
      const rightX = cardX + Math.round(cardW * 0.48);
      const rightBudget = Math.max(12, Math.floor((cardW * 0.44) / (titleSize * 0.6)));
      const tLines = wrapSvgCardLines(spec.title, rightBudget, 2);
      const tFont = adaptiveLineFontSize(titleSize, tLines, rightBudget);
      const hwLines = wrapSvgCardLines(spec.highlightWord, rightBudget + 3, 2);
      variantBodySvg = `
        <path d="M ${gcx - r} ${gcy} A ${r} ${r} 0 0 1 ${gcx + r} ${gcy}" fill="none" stroke="${theme.cardBorderHex}" stroke-width="10" stroke-linecap="round"/>
        <path d="M ${gcx - r} ${gcy} A ${r} ${r} 0 0 1 ${gcx + Math.round(r * 0.45)} ${gcy - Math.round(r * 0.88)}" fill="none" stroke="url(#accentBar)" stroke-width="10" stroke-linecap="round"/>
        <circle cx="${gcx}" cy="${gcy}" r="6" fill="${modePrimaryHex}"/>
        <line x1="${gcx}" y1="${gcy}" x2="${gcx + Math.round(r * 0.35)}" y2="${gcy - Math.round(r * 0.62)}" stroke="${theme.textHex}" stroke-width="4" stroke-linecap="round"/>
        <text x="${gcx}" y="${gcy + 20}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${modePrimaryHex}">${spec.progressPct}%</text>
        ${renderSvgTextLines({
          lines: tLines,
          x: rightX,
          startY: bodyTop + Math.round(bodyH * 0.24),
          lineHeight: Math.round(tFont * 1.2),
          fontFamily,
          fontSize: tFont,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        ${renderSvgTextLines({
          lines: hwLines,
          x: rightX,
          startY: bodyTop + Math.round(bodyH * 0.56),
          lineHeight: Math.round(smallSize * 1.18),
          fontFamily,
          fontSize: smallSize,
          fontWeight: 600,
          fill: modeSecondaryHex,
        })}
        <text x="${rightX}" y="${bodyTop + Math.round(bodyH * 0.84)}" font-family="${fontFamily}" font-size="${smallSize}" font-weight="500" fill="${theme.mutedTextHex}">${escapeXml(spec.subtitle)}</text>
      `;
      break;
    }

    case 'staircase-3d': {
      const stepW = Math.round((innerW - 24) / 3);
      const baseBottom = bodyTop + Math.round(bodyH * 0.90);
      const heights = [0.36, 0.58, 0.82];
      variantBodySvg = heights
        .map((hr, si) => {
          const sh = Math.round(bodyH * hr);
          const sx = cardX + padX + si * (stepW + 12);
          const sy = baseBottom - sh;
          const lbl = spec.labels[si] ?? `Step ${si + 1}`;
          return `<rect x="${sx + 4}" y="${sy + 4}" width="${stepW}" height="${sh}" rx="8" fill="${modeSecondaryHex}" fill-opacity="0.18"/>
            <rect x="${sx}" y="${sy}" width="${stepW}" height="${sh}" rx="8" fill="${si === 2 ? modePrimaryHex : theme.surfaceTintHex}" stroke="${si === 2 ? modePrimaryHex : theme.cardBorderHex}" stroke-width="2"/>
            <text x="${sx + Math.round(stepW / 2)}" y="${sy + Math.round(sh * 0.56)}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${si === 2 ? '#FFFFFF' : theme.textHex}">${escapeXml(lbl)}</text>`;
        })
        .join('');
      break;
    }

    case 'friends-chat': {
      const spkA = spec.labels[0] ?? 'Speaker A';
      const spkB = spec.labels[1] ?? 'Speaker B';
      const avScale = Math.max(0.76, Math.min(1.12, bodyH / 160));
      const leftCx = cardX + padX + Math.round(innerW * 0.11);
      const rightCx = cardX + padX + Math.round(innerW * 0.89);
      const avCy = bodyTop + Math.round(bodyH * 0.44);
      const bubbleX = cardX + padX + Math.round(innerW * 0.24);
      const bubbleW = Math.round(innerW * 0.52);
      const bubbleH = Math.round(bodyH * 0.90);
      const bubbleY = bodyTop + Math.round(bodyH * 0.04);
      const bubbleBudget = Math.max(12, Math.floor((bubbleW - 24) / (smallSize * 0.6)));
      const speechLines = wrapSvgCardLines(spec.speechText, bubbleBudget, 3);
      const speechFont = adaptiveLineFontSize(smallSize, speechLines, bubbleBudget);

      variantBodySvg = `
        ${buildSvgCharacterAvatar({
          cx: leftCx,
          cy: avCy,
          scale: avScale,
          shirtHex: modePrimaryHex,
          hairHex: '#1E293B',
          hairStyle: 'short',
          tagText: spkA,
          tagHex: modePrimaryHex,
          fontFamily,
          smallSize,
        })}
        ${buildSvgCharacterAvatar({
          cx: rightCx,
          cy: avCy,
          scale: avScale,
          shirtHex: modeSecondaryHex,
          hairHex: '#78350F',
          hairStyle: 'bob',
          tagText: spkB,
          tagHex: modeSecondaryHex,
          fontFamily,
          smallSize,
        })}
        <rect x="${bubbleX}" y="${bubbleY}" width="${bubbleW}" height="${bubbleH}" rx="16" fill="${theme.surfaceTintHex}" stroke="${modePrimaryHex}" stroke-width="2"/>
        <circle cx="${bubbleX + Math.round(bubbleW / 2) - 14}" cy="${bubbleY + 12}" r="3.5" fill="${modePrimaryHex}"/>
        <circle cx="${bubbleX + Math.round(bubbleW / 2)}" cy="${bubbleY + 12}" r="3.5" fill="${modeSecondaryHex}"/>
        <circle cx="${bubbleX + Math.round(bubbleW / 2) + 14}" cy="${bubbleY + 12}" r="3.5" fill="${modePrimaryHex}"/>
        ${renderSvgTextLines({
          lines: speechLines,
          x: bubbleX + Math.round(bubbleW / 2),
          startY: bubbleY + Math.round(bubbleH * 0.40),
          lineHeight: Math.round(speechFont * 1.24),
          fontFamily,
          fontSize: speechFont,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        <text x="${bubbleX + Math.round(bubbleW / 2)}" y="${bubbleY + bubbleH - 12}" text-anchor="middle" font-family="${fontFamily}" font-size="${Math.max(10, Math.round(smallSize * 0.85))}" font-weight="700" fill="${modeSecondaryHex}">${escapeXml(spec.reactionText)}</text>
      `;
      break;
    }

    case 'avatar-speech': {
      const avX = cardX + padX + Math.round(innerW * 0.14);
      const avY = bodyTop + Math.round(bodyH * 0.44);
      const avScale = Math.max(0.78, Math.min(1.20, bodyH / 155));
      const bX = cardX + padX + Math.round(innerW * 0.28);
      const bY = bodyTop + Math.round(bodyH * 0.04);
      const bW = Math.round(innerW * 0.72);
      const bH = Math.round(bodyH * 0.82);
      const pillW = Math.min(bW - 12, Math.max(96, spec.reactionText.length * 9 + 26));
      const speechBudget = Math.max(14, Math.floor((bW - 32) / (titleSize * 0.58)));
      const speechLines = wrapSvgCardLines(spec.speechText, speechBudget, 3);
      const speechFont = adaptiveLineFontSize(titleSize, speechLines, speechBudget);
      variantBodySvg = `
        <circle cx="${avX}" cy="${avY - 4}" r="${Math.round(32 * avScale)}" fill="${modePrimaryHex}" fill-opacity="0.14"/>
        ${buildSvgCharacterAvatar({
          cx: avX,
          cy: avY,
          scale: avScale,
          shirtHex: modePrimaryHex,
          hairHex: '#1E293B',
          hairStyle: 'short',
          tagText: spec.labels[0] ?? 'Speaker',
          tagHex: modePrimaryHex,
          fontFamily,
          smallSize,
        })}
        <polygon points="${bX},${bY + Math.round(bH * 0.42)} ${bX - 16},${bY + Math.round(bH * 0.54)} ${bX},${bY + Math.round(bH * 0.66)}" fill="${theme.surfaceTintHex}" stroke="${modePrimaryHex}" stroke-width="2"/>
        <rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" rx="14" fill="${theme.surfaceTintHex}" stroke="${modePrimaryHex}" stroke-width="2"/>
        ${renderSvgTextLines({
          lines: speechLines,
          x: bX + 16,
          startY: bY + Math.round(speechFont * 1.4),
          lineHeight: Math.round(speechFont * 1.24),
          fontFamily,
          fontSize: speechFont,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        <text x="${bX + 16}" y="${bY + bH - 12}" font-family="${fontFamily}" font-size="${smallSize}" font-weight="600" fill="${theme.mutedTextHex}">${escapeXml(spec.subtitle)}</text>
        <rect x="${bX + bW - pillW}" y="${bY + bH - 12}" width="${pillW}" height="${Math.round(smallSize * 1.65)}" rx="12" fill="${modeSecondaryHex}"/>
        <text x="${bX + bW - Math.round(pillW / 2)}" y="${bY + bH - 12 + Math.round(smallSize * 1.12)}" text-anchor="middle" font-family="${fontFamily}" font-size="${Math.max(10, Math.round(smallSize * 0.85))}" font-weight="700" fill="#FFFFFF">${escapeXml(spec.reactionText)}</text>
      `;
      break;
    }

    case 'dialogue-upgrade': {
      const boxW = Math.round((innerW - 38) / 2);
      const boxH = Math.round(bodyH * 0.88);
      const boxY = bodyTop + Math.round(bodyH * 0.04);
      const leftX = cardX + padX;
      const rightX = cardX + padX + boxW + 38;
      const midX = cardX + padX + boxW + 19;
      const colBudget = Math.max(10, Math.floor((boxW - 24) / (smallSize * 0.6)));
      const speechLines = wrapSvgCardLines(spec.speechText, colBudget, 3);
      const hwLines = wrapSvgCardLines(spec.highlightWord, colBudget, 3);
      const spFont = adaptiveLineFontSize(smallSize, speechLines, colBudget);
      const hwFont = adaptiveLineFontSize(titleSize, hwLines, colBudget);
      variantBodySvg = `
        <rect x="${leftX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="12" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        <text x="${leftX + 14}" y="${boxY + Math.round(smallSize * 1.4)}" font-family="${fontFamily}" font-size="${Math.max(10, Math.round(smallSize * 0.85))}" font-weight="700" fill="${theme.mutedTextHex}">${escapeXml(spec.labels[0] ?? 'Basic Form')}</text>
        ${renderSvgTextLines({
          lines: speechLines,
          x: leftX + 14,
          startY: boxY + Math.round(boxH * 0.48),
          lineHeight: Math.round(spFont * 1.22),
          fontFamily,
          fontSize: spFont,
          fontWeight: 600,
          fill: theme.textHex,
        })}
        <circle cx="${midX}" cy="${boxY + Math.round(boxH / 2)}" r="13" fill="${modePrimaryHex}"/>
        <text x="${midX}" y="${boxY + Math.round(boxH / 2) + 5}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="#FFFFFF">→</text>
        <rect x="${rightX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="12" fill="${modePrimaryHex}" fill-opacity="0.14" stroke="${modePrimaryHex}" stroke-width="2"/>
        <text x="${rightX + 14}" y="${boxY + Math.round(smallSize * 1.4)}" font-family="${fontFamily}" font-size="${Math.max(10, Math.round(smallSize * 0.85))}" font-weight="700" fill="${modePrimaryHex}">✓ ${escapeXml(spec.labels[1] ?? 'Natural Form')}</text>
        ${renderSvgTextLines({
          lines: hwLines,
          x: rightX + 14,
          startY: boxY + Math.round(boxH * 0.48),
          lineHeight: Math.round(hwFont * 1.22),
          fontFamily,
          fontSize: hwFont,
          fontWeight: 700,
          fill: theme.textHex,
        })}
      `;
      break;
    }

    case 'css-browser-mockup':
    case 'bs-card-header':
    default: {
      const iconCx = cardX + Math.round(cardW * 0.18);
      const iconCy = bodyTop + Math.round(bodyH * 0.46);
      const rightColX = cardX + Math.round(cardW * 0.35);
      const rightColW = Math.round(cardW * 0.59);
      const waveHeights = [0.34, 0.68, 0.95, 0.52, 0.82, 0.44, 0.72, 0.38];
      const waveBaseY = bodyTop + Math.round(bodyH * 0.88);
      const waveMaxH = Math.round(bodyH * 0.22);
      const waveSvg = waveHeights
        .map((ratio, idx) => {
          const bw = Math.max(5, Math.round(rightColW * 0.05));
          const gap = Math.max(4, Math.round(rightColW * 0.03));
          const bh = Math.max(8, Math.round(waveMaxH * ratio));
          const bx = rightColX + idx * (bw + gap);
          const by = waveBaseY - bh;
          const fill = idx % 2 === 0 ? modePrimaryHex : modeSecondaryHex;
          return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${Math.round(bw / 2)}" fill="${fill}" fill-opacity="${(0.55 + ratio * 0.4).toFixed(2)}"/>`;
        })
        .join('');

      const tBudget = Math.max(14, Math.floor(rightColW / (titleSize * 0.58)));
      const tLines = wrapSvgCardLines(spec.title, tBudget, 2);
      const tFont = adaptiveLineFontSize(titleSize, tLines, tBudget);
      const subLines = wrapSvgCardLines(spec.subtitle, tBudget + 4, 1);

      variantBodySvg = `
        <rect x="${cardX + padX}" y="${bodyTop}" width="${Math.round(cardW * 0.25)}" height="${Math.round(bodyH * 0.84)}" rx="${Math.round(cardR * 0.6)}" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        ${getSvgVectorIllustration(spec.iconKey, iconCx, iconCy, iconScale, modePrimaryHex, modeSecondaryHex, theme.cardBgHex)}
        ${renderSvgTextLines({
          lines: tLines,
          x: rightColX,
          startY: bodyTop + Math.round(bodyH * 0.22),
          lineHeight: Math.round(tFont * 1.22),
          fontFamily,
          fontSize: tFont,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        ${renderSvgTextLines({
          lines: subLines,
          x: rightColX,
          startY: bodyTop + Math.round(bodyH * 0.56),
          lineHeight: Math.round(smallSize * 1.2),
          fontFamily,
          fontSize: smallSize,
          fontWeight: 600,
          fill: theme.mutedTextHex,
        })}
        ${waveSvg}
      `;
      break;
    }
  }

  // Optional Example / Previous Target Recall Strip cleanly placed below body and above progress bar
  let footerContextSvg = '';
  if (hasFooterContext) {
    const stripY = bodyTop + bodyH + 4;
    const stripH = Math.max(24, Math.round(cardH * 0.145));
    const stripText =
      spec.prevTargetText && spec.exampleText
        ? `RECALL PREV: ${spec.prevTargetText} · ${spec.exampleText}`
        : spec.prevTargetText
        ? `RECALL PREV: ${spec.prevTargetText}`
        : spec.exampleText ?? '';
    const stripBudget = Math.max(24, Math.floor((innerW - 24) / (smallSize * 0.54)));
    const stripLines = wrapSvgCardLines(stripText, stripBudget, 2);
    const stripFont = Math.max(9, Math.round(smallSize * (stripLines.length > 1 ? 0.74 : 0.85)));
    footerContextSvg = `
      <rect x="${cardX + padX}" y="${stripY}" width="${innerW}" height="${stripH}" rx="8" fill="${modePrimaryHex}" fill-opacity="0.08" stroke="${theme.cardBorderHex}" stroke-width="1"/>
      ${renderSvgTextLines({
        lines: stripLines,
        x: cardX + padX + 10,
        startY: stripY + Math.round(stripFont * (stripLines.length > 1 ? 1.15 : 1.48)),
        lineHeight: Math.round(stripFont * 1.15),
        fontFamily,
        fontSize: stripFont,
        fontWeight: 600,
        fill: spec.prevTargetText ? modePrimaryHex : theme.mutedTextHex,
      })}
    `;
  }

  const barY = cardY + cardH - 16;
  const barW = innerW;
  const barFillW = Math.max(18, Math.round((spec.progressPct / 100) * barW));
  const headerLabel =
    spec.variant === 'css-browser-mockup'
      ? `studio://2411/${spec.layoutKind}`
      : `${spec.kickerLabel} · ${spec.variant}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>${fontFaceCss}</style>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.bgTopHex}"/>
      <stop offset="100%" stop-color="${theme.bgBottomHex}"/>
    </linearGradient>
    <linearGradient id="accentBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${modePrimaryHex}"/>
      <stop offset="100%" stop-color="${modeSecondaryHex}"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <circle cx="${Math.round(width * 0.2)}" cy="${Math.round(height * 0.22)}" r="${Math.round(Math.min(width, height) * 0.38)}" fill="${theme.bgAccentHex}" fill-opacity="0.55"/>
  <circle cx="${Math.round(width * 0.84)}" cy="${Math.round(height * 0.76)}" r="${Math.round(Math.min(width, height) * 0.34)}" fill="${modeSecondaryHex}" fill-opacity="0.08"/>
  <g>${dotLines.join('')}</g>

  <rect x="${cardX + 4}" y="${cardY + 10}" width="${cardW}" height="${cardH}" rx="${cardR}" fill="#000000" fill-opacity="${theme.isLight ? '0.07' : '0.36'}"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${cardR}" fill="${theme.cardBgHex}" stroke="${theme.cardBorderHex}" stroke-width="2.5"/>

  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${headerH}" rx="${cardR}" fill="${theme.surfaceTintHex}"/>
  <rect x="${cardX}" y="${cardY + Math.round(headerH / 2)}" width="${cardW}" height="${Math.round(headerH / 2)}" fill="${theme.surfaceTintHex}"/>
  ${spec.variant === 'bs-card-header' ? `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="6" rx="3" fill="url(#accentBar)"/>` : ''}
  <line x1="${cardX}" y1="${cardY + headerH}" x2="${cardX + cardW}" y2="${cardY + headerH}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>

  <circle cx="${cardX + padX}" cy="${cardY + Math.round(headerH / 2)}" r="5" fill="${modePrimaryHex}"/>
  <circle cx="${cardX + padX + 16}" cy="${cardY + Math.round(headerH / 2)}" r="5" fill="${modeSecondaryHex}"/>
  ${spec.variant === 'css-browser-mockup' ? `<circle cx="${cardX + padX + 32}" cy="${cardY + Math.round(headerH / 2)}" r="5" fill="#10B981"/>` : ''}
  <text x="${cardX + padX + (spec.variant === 'css-browser-mockup' ? 48 : 34)}" y="${cardY + Math.round(headerH / 2) + Math.round(smallSize * 0.35)}" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(headerLabel)}</text>
  <text x="${cardX + cardW - padX}" y="${cardY + Math.round(headerH / 2) + Math.round(smallSize * 0.35)}" text-anchor="end" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${theme.mutedTextHex}">${escapeXml(stepText)}</text>

  ${variantBodySvg}
  ${footerContextSvg}

  <rect x="${cardX + padX}" y="${barY}" width="${barW}" height="7" rx="3.5" fill="${theme.cardBorderHex}" fill-opacity="0.55"/>
  <rect x="${cardX + padX}" y="${barY}" width="${barFillW}" height="7" rx="3.5" fill="url(#accentBar)"/>
</svg>`;
}
