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
  { id: 'friends-chat', label: 'Speaker Chat', hint: '1 nhân vật đối thoại & bóng suy nghĩ 5s' },
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
  hintKind?: 'caution' | 'tip' | 'recall' | 'example';
  prevTargetText?: string;
  promptPreviewText?: string;
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

const GENERIC_SPEAKER_LABEL_RE =
  /^(?:host|challenge|summary|practice|prompt|your\s*turn|reply|speaker|candidate|interviewer|speaker\s*1|speaker\s*2|lesson\s*topic|today(?:'s)?\s*topic|topic|key\s*point|main\s*point|intro|outro|recap|note|tip|focus|narrator|teacher|student|assistant|guide)$/i;

export function isGenericSpeakerLabel(label?: string): boolean {
  const clean = (label ?? '').trim();
  if (!clean) return true;
  return GENERIC_SPEAKER_LABEL_RE.test(clean);
}

function defaultLabelsForLine(
  variant: Studio2411ComponentVariant,
  hasPause: boolean,
  isSecondarySlot: boolean,
  _isQaInterview: boolean,
  _layoutKind?: Studio2411CardLayoutKind
): string[] {
  if (variant === 'friends-chat' || variant === 'avatar-speech') {
    return [];
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
}): { text: string; hintKind: 'caution' | 'tip' | 'recall' | 'example' } {
  const { cleanText, roleKind, layoutKind, highlightWord } = params;
  const lower = cleanText.toLowerCase();

  // Intro and Outro already state the instructions in speech/subtitles; never clutter with EX strip
  if (roleKind === 'title' || roleKind === 'outro') {
    return { text: '', hintKind: 'tip' };
  }

  // On prompt / quiz scenes, NEVER spoil upcoming target words. Keep hints to 1-2 words + semantic icon.
  if (layoutKind === 'quiz_prompt') {
    if (/watch out|careful|気をつけて|cẩn thận/i.test(cleanText)) {
      return { text: 'Hint: Short warning', hintKind: 'caution' };
    }
    if (/take it easy|push yourself|無理しないで|quá sức/i.test(cleanText)) {
      return { text: 'Hint: Gentle advice', hintKind: 'tip' };
    }
    if (/take your time|no rush|ゆっくり|từ từ/i.test(cleanText)) {
      return { text: 'Hint: No rush', hintKind: 'tip' };
    }
    if (/strength|proactive|長所|điểm mạnh/i.test(cleanText)) {
      return { text: 'Hint: Key strength', hintKind: 'tip' };
    }
    if (/weakness|短所|điểm yếu/i.test(cleanText)) {
      return { text: 'Hint: Honest balance', hintKind: 'caution' };
    }
    if (/latte|coffee|order|カフェ|コーヒー|cà phê/i.test(cleanText)) {
      return { text: 'Hint: Polite order', hintKind: 'tip' };
    }
    if (/thank|appreciate|cảm ơn|ありがとう/i.test(cleanText)) {
      return { text: 'Hint: Warm thanks', hintKind: 'tip' };
    }
    return { text: 'Hint: 5s recall', hintKind: 'tip' };
  }

  if (/watch out/i.test(lower) || /気をつけて/i.test(cleanText)) {
    return { text: 'Ex: Watch out for the deadline on Friday.', hintKind: 'caution' };
  }
  if (/take it easy|don['’]t push/i.test(lower) || /無理しないで/i.test(cleanText)) {
    return { text: 'Ex: Take it easy tonight after work.', hintKind: 'example' };
  }
  if (/take your time|no rush/i.test(lower)) {
    return { text: 'Ex: Take your time checking the details.', hintKind: 'example' };
  }
  if (/strength|proactive|長所/i.test(lower)) {
    return { text: 'Ex: I stay proactive when solving team issues.', hintKind: 'example' };
  }
  if (/weakness|短所/i.test(lower)) {
    return { text: 'Ex: I double-check work, so I set timeboxes.', hintKind: 'caution' };
  }
  if (/latte|coffee|order|カフェ|コーヒー/i.test(lower)) {
    return { text: 'Ex: Could I get a hot oat latte, please?', hintKind: 'example' };
  }
  if (/thank|appreciate|cảm ơn|ありがとう/i.test(lower)) {
    return { text: 'Ex: I really appreciate your help today!', hintKind: 'example' };
  }
  if (layoutKind === 'answer_reveal') {
    return { text: '', hintKind: 'example' };
  }
  return { text: `Key focus: ${highlightWord}`, hintKind: 'tip' };
}

function pickAutoVariant(params: {
  roleKind: string;
  hasPause: boolean;
  isSecondarySlot: boolean;
  isDialogue: boolean;
  isUpgradeCue: boolean;
  dualVoiceEnabled?: boolean;
  iconKey: PresentationIconKey;
  lineIndex: number;
  prevVariant?: Studio2411ComponentVariant;
}): Studio2411ComponentVariant {
  const { dualVoiceEnabled = false } = params;

  // Keep Component 2411 on one consistent continuous stage across the entire video:
  // - 2-voice / Q&A mode uses stationary 2-speaker 'friends-chat' bubbles.
  // - 1-voice narration uses stationary 1-speaker 'avatar-speech' so characters/cards never swap mid-video.
  return dualVoiceEnabled ? 'friends-chat' : 'avatar-speech';
}

export function build2411CardSpecForLine(params: {
  rawLine: string;
  lineIndex: number;
  totalLines: number;
  isSecondarySlot?: boolean;
  isIntroOrOutro?: boolean;
  dualVoiceEnabled?: boolean;
  scriptStyle?: ScriptStyle;
  themeId?: Studio2411ThemeId;
  defaultPauseSec?: number;
  override?: Studio2411SceneComponentOverride;
  prevVariant?: Studio2411ComponentVariant;
  prevTargetText?: string;
  promptPreviewText?: string;
  animationSeed?: number;
}): Studio2411CardSpec {
  const {
    rawLine,
    lineIndex,
    totalLines,
    isSecondarySlot = false,
    isIntroOrOutro = false,
    dualVoiceEnabled = false,
    scriptStyle,
    themeId,
    defaultPauseSec = 5,
    override,
    prevVariant,
    prevTargetText,
    promptPreviewText,
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
      dualVoiceEnabled,
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

  const rawLabels =
    override?.labels && override.labels.length > 0
      ? override.labels.slice(0, 3)
      : defaultLabelsForLine(variant, pres.hasPause, isSecondarySlot, isQaInterview, layoutKind);
  const labels =
    variant === 'friends-chat' || variant === 'avatar-speech'
      ? rawLabels.map((lb) => (isGenericSpeakerLabel(lb) ? '' : lb))
      : rawLabels;

  const rawOverrideHw = override?.highlightWord?.trim();
  const cleanHasCjk = hasCjkChars(cleanText);
  const isHwTargetLeak =
    layoutKind === 'quiz_prompt' &&
    Boolean(
      rawOverrideHw &&
        cleanHasCjk &&
        /^[A-Za-z0-9\s'".,!?’\-]+$/.test(rawOverrideHw) &&
        !cleanText.toLowerCase().includes(rawOverrideHw.toLowerCase())
    );
  const highlightWord = (!isHwTargetLeak && rawOverrideHw) || extractHighlightToken(cleanText);
  const rawOverrideFormula = override?.formula?.trim();
  const isFormulaTargetLeak =
    layoutKind === 'quiz_prompt' &&
    Boolean(
      rawOverrideFormula &&
        cleanHasCjk &&
        !/[\u3000-\u9FFF]/.test(rawOverrideFormula) &&
        /[A-Za-z]{3,}/.test(rawOverrideFormula.replace(/Prompt|Your Turn|Input|Context|Recall|Listen/gi, ''))
    );
  const formula =
    (!isFormulaTargetLeak && rawOverrideFormula) ||
    (labels.length >= 2 ? `${labels[0]} + ${labels[1]} = ${highlightWord}` : `Input + Context = ${highlightWord}`);

  const rawOverrideSpeech = override?.speechText?.trim();
  const isQuizAsciiLeakOverCjk =
    layoutKind === 'quiz_prompt' &&
    pres.roleKind === 'question' &&
    !/^\s*A\s*[:：]/i.test(rawLine) &&
    Boolean(
      rawOverrideSpeech &&
        cleanHasCjk &&
        /^[A-Za-z0-9\s'".,!?’\-]+$/.test(rawOverrideSpeech) &&
        !cleanText.toLowerCase().includes(rawOverrideSpeech.toLowerCase())
    );
  const speechText = (!isQuizAsciiLeakOverCjk && rawOverrideSpeech) || cleanText || title;

  const reactionText =
    override?.reactionText?.trim() ||
    defaultReactionForLine(layoutKind, pres.hasPause, isSecondarySlot);

  const rawOverrideExample = override?.exampleText?.trim();
  const hasQuotedTargetLeak =
    layoutKind === 'quiz_prompt' &&
    pres.roleKind === 'question' &&
    !/^\s*A\s*[:：]/i.test(rawLine) &&
    Boolean(
      rawOverrideExample &&
        (/["“][^"”]{1,24}\.\.\.["”]|\.{3}|^(?:Ex|Example|Use in context):/i.test(rawOverrideExample) ||
          rawOverrideExample.replace(/^Hint:\s*/i, '').trim().split(/\s+/).length > 4)
    );

  const isTwoSpeakerFriendsChat = variant === 'friends-chat' || Boolean(dualVoiceEnabled);
  const autoContextual = buildContextualExampleForLine({
    cleanText,
    roleKind: pres.roleKind,
    layoutKind,
    highlightWord,
    isDialogue,
    pauseSec,
  });
  const resolvedEx = (!hasQuotedTargetLeak && rawOverrideExample) || autoContextual.text;
  const exampleText = isTwoSpeakerFriendsChat ? undefined : resolvedEx ? resolvedEx : undefined;
  const hintKind = prevTargetText
    ? 'recall'
    : autoContextual.hintKind;

  const resolvedPrevTarget = isTwoSpeakerFriendsChat
    ? undefined
    : override?.prevTargetText?.trim() || prevTargetText?.trim() || undefined;
  const resolvedPromptPreview =
    override?.promptPreviewText?.trim() || promptPreviewText?.trim() || undefined;

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
    hintKind,
    prevTargetText: resolvedPrevTarget,
    promptPreviewText: resolvedPromptPreview,
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
 * Generates a full 1-to-1 context-aware array of Studio 2411 component overrides.
 * When dualVoiceEnabled is true, locks auto-planned variants consistently to 'friends-chat' speaker bubbles
 * across slides instead of randomizing layouts between slides.
 */
export function buildContextualSceneComponentsForScript(params: {
  script: string;
  scriptStyle?: ScriptStyle;
  dualVoiceEnabled?: boolean;
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
  let lastPromptText: string | undefined;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const pres = analyzeScriptLinePresentation(rawLine, {
      scriptStyle: params.scriptStyle,
    });
    const hasExplicitNonViTargetTag =
      /^\s*(?:English|Japanese|Tiếng\s*Anh|Tiếng\s*Nhật|\[EN\]|\[JA\]|\[V2\])\s*[:：]?/i.test(rawLine);
    const hasExplicitViTargetTag =
      /^\s*(?:Vietnamese|Tiếng\s*Việt|\[VI\])\s*[:：]?/i.test(rawLine) &&
      !pres.hasPause &&
      pres.roleKind !== 'question' &&
      idx > 0 &&
      /^\s*(?:English|Japanese|Tiếng\s*Anh|Tiếng\s*Nhật|\[EN\]|\[JA\]|\[V1\]|Q|Question)\s*[:：]?/i.test(
        lines[idx - 1]
      );
    const isSecondary =
      !pres.hasPause &&
      pres.roleKind !== 'question' &&
      (hasExplicitNonViTargetTag || hasExplicitViTargetTag || pres.roleKind === 'answer');
    const rawExisting = params.existingOverrides?.[idx];
    const existing =
      params.dualVoiceEnabled && rawExisting && rawExisting.variant !== 'friends-chat'
        ? { ...rawExisting, variant: 'friends-chat' as Studio2411ComponentVariant, labels: undefined }
        : rawExisting;
    const showRecall =
      !params.dualVoiceEnabled && !isSecondary && pres.roleKind !== 'title'
        ? lastTargetText
        : undefined;
    const showPromptCtx = isSecondary && pres.roleKind !== 'outro' ? lastPromptText : undefined;

    const spec = build2411CardSpecForLine({
      rawLine,
      lineIndex: idx,
      totalLines: lines.length,
      isSecondarySlot: isSecondary,
      isIntroOrOutro: pres.roleKind === 'title' || pres.roleKind === 'outro',
      dualVoiceEnabled: params.dualVoiceEnabled,
      scriptStyle: params.scriptStyle,
      defaultPauseSec: params.pauseBetweenLinesSec ?? 5,
      override: existing,
      prevVariant,
      prevTargetText: showRecall,
      promptPreviewText: showPromptCtx,
    });
    prevVariant = spec.variant;

    if (!isSecondary && pres.roleKind !== 'title' && pres.roleKind !== 'outro' && pres.cleanText) {
      lastPromptText = pres.cleanText;
    }
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
      ...(spec.promptPreviewText ? { promptPreviewText: spec.promptPreviewText } : {}),
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
  if (/[\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(ch)) return 1.06;
  if (/[MW@#%&QGOD]/.test(ch)) return 0.90;
  if (/[A-Z]/.test(ch)) return 0.76;
  if (/[mw]/.test(ch)) return 0.86;
  if (/[ilIjtfr1.,:;!|'"()（）「」\- ]/.test(ch)) return 0.38;
  return 0.60;
}

/**
 * Wraps text strictly inside `maxUnitsPerLine` across as many lines as needed,
 * never appending "..." truncation and never overflowing a line's horizontal budget.
 */
function segmentMixedWordUnits(word: string): string[] {
  const segments: string[] = [];
  const asciiRunRe = /[A-Za-z0-9_]+(?:[.'’-][A-Za-z0-9_]+)*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = asciiRunRe.exec(word)) !== null) {
    if (match.index > lastIdx) {
      for (const ch of Array.from(word.slice(lastIdx, match.index))) {
        segments.push(ch);
      }
    }
    segments.push(match[0]);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < word.length) {
    for (const ch of Array.from(word.slice(lastIdx))) {
      segments.push(ch);
    }
  }
  return segments.length > 0 ? segments : Array.from(word);
}

function measureVisualUnits(str: string): number {
  let sum = 0;
  for (const ch of Array.from(str)) {
    sum += charVisualUnits(ch);
  }
  return sum;
}

export function measureSvgLinePx(
  str: string,
  fontSize: number,
  fontWeight: number | string = 600
): number {
  const clean = str.trim();
  if (!clean) return 0;
  const weightNum = Number(fontWeight);
  const weightMult = weightNum >= 700 ? 1.08 : weightNum >= 600 ? 1.05 : 1.0;
  const letterSpacingExtra = Math.max(0, Array.from(clean).length - 1) * fontSize * 0.02;
  return Math.ceil(measureVisualUnits(clean) * fontSize * weightMult + letterSpacingExtra);
}

function wrapAllSvgLines(text: string, maxUnitsPerLine: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  const budget = Math.max(6, maxUnitsPerLine);

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
    const wordUnits = measureVisualUnits(word);

    if (wordUnits > budget) {
      if (current) flushLine();
      let chunk = '';
      let chunkUnits = 0;
      const pieces = segmentMixedWordUnits(word);
      for (const piece of pieces) {
        const u = measureVisualUnits(piece);
        if (chunk && chunkUnits + u > budget) {
          lines.push(chunk);
          if (u > budget) {
            let sub = '';
            let subUnits = 0;
            for (const ch of Array.from(piece)) {
              const cu = charVisualUnits(ch);
              if (sub && subUnits + cu > budget) {
                lines.push(sub);
                sub = ch;
                subUnits = cu;
              } else {
                sub += ch;
                subUnits += cu;
              }
            }
            chunk = sub;
            chunkUnits = subUnits;
          } else {
            chunk = piece;
            chunkUnits = u;
          }
        } else {
          chunk += piece;
          chunkUnits += u;
        }
      }
      if (chunk) {
        current = chunk;
        currentUnits = chunkUnits;
      }
      continue;
    }

    const spaceCost = current ? 0.38 : 0;
    if (current && currentUnits + spaceCost + wordUnits > budget) {
      flushLine();
      current = word;
      currentUnits = wordUnits;
    } else {
      current = current ? `${current} ${word}` : word;
      currentUnits += spaceCost + wordUnits;
    }
  }
  if (current.trim()) {
    lines.push(current.trim());
  }
  return lines.length > 0 ? lines : [''];
}

/**
 * Wraps card copy cleanly across multiple lines without appending "..." truncation
 * and without dumping unbounded overflow onto the final line.
 */
export function wrapSvgCardLines(
  text: string,
  maxUnitsPerLine: number,
  maxLines = 6
): string[] {
  const safeMax = Math.max(1, maxLines);
  const rawWrapped = wrapAllSvgLines(text, maxUnitsPerLine);
  if (rawWrapped.length <= safeMax) {
    return rawWrapped;
  }
  // Spread across safeMax lines only by modest budget relaxation, otherwise keep all wrapped lines cleanly bounded
  const totalUnits = Array.from(text.replace(/\s+/g, ' ').trim()).reduce(
    (s, ch) => s + charVisualUnits(ch),
    0
  );
  const balancedBudget = Math.max(maxUnitsPerLine, Math.ceil((totalUnits / safeMax) * 1.08));
  return wrapAllSvgLines(text, balancedBudget);
}

interface FittedSvgTextBlock {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  totalHeight: number;
}

/**
 * Fits text inside a bounded SVG box (boxW x boxH) by stepping down fontSize cleanly
 * until both line widths and vertical block height stay strictly inside bounds — zero truncation, zero overflow.
 */
function fitTextToBox(opts: {
  text: string;
  boxW: number;
  boxH: number;
  baseFontSize: number;
  minFontSize?: number;
  maxLines?: number;
  lineHeightRatio?: number;
  fontWeight?: number | string;
}): FittedSvgTextBlock {
  const {
    text,
    boxW,
    boxH,
    baseFontSize,
    minFontSize = 11,
    maxLines = 5,
    lineHeightRatio = 1.24,
    fontWeight = 600,
  } = opts;
  const clean = text.replace(/\s+/g, ' ').trim() || '';
  const safeW = Math.max(48, boxW);
  const safeH = Math.max(20, boxH);
  const weightNum = Number(fontWeight);
  const weightMult = weightNum >= 700 ? 1.08 : weightNum >= 600 ? 1.05 : 1.0;

  for (let fs = Math.round(baseFontSize); fs >= minFontSize; fs--) {
    const unitsBudget = Math.max(5.5, (safeW * 0.91) / (fs * weightMult + fs * 0.028));
    const lines = wrapAllSvgLines(clean, unitsBudget);
    const lh = Math.max(fs + 2, Math.round(fs * lineHeightRatio));
    const totalH = lines.length * lh;
    const widestPx = lines.reduce(
      (mx, ln) => Math.max(mx, measureSvgLinePx(ln, fs, fontWeight)),
      0
    );
    if (lines.length <= maxLines && totalH <= safeH && widestPx <= safeW) {
      return { lines, fontSize: fs, lineHeight: lh, totalHeight: totalH };
    }
  }

  const finalFs = minFontSize;
  const unitsBudget = Math.max(5.5, (safeW * 0.91) / (finalFs * weightMult + finalFs * 0.028));
  const finalLines = wrapAllSvgLines(clean, unitsBudget);
  const finalLh = Math.max(finalFs + 2, Math.round(finalFs * lineHeightRatio));
  return {
    lines: finalLines,
    fontSize: finalFs,
    lineHeight: finalLh,
    totalHeight: finalLines.length * finalLh,
  };
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
        `<text x="${x}" y="${Math.round(startY + idx * lineHeight)}"${anchorAttr} font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" letter-spacing="0.015em" fill="${fill}">${escapeXml(ln)}</text>`
    )
    .join('');
}

function centeredBlockStartY(boxY: number, boxH: number, fitted: FittedSvgTextBlock): number {
  const topOffset = Math.max(4, Math.round((boxH - fitted.totalHeight) / 2));
  return boxY + topOffset + Math.round(fitted.fontSize * 0.85);
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
  pose?: 'talking' | 'thinking' | 'idle';
  animFrame?: 0 | 1 | 2 | 3;
  side?: 'left' | 'right';
  timeSec?: number;
}): string {
  const {
    cx,
    cy,
    scale,
    shirtHex,
    hairHex,
    hairStyle,
    tagText,
    tagHex,
    fontFamily,
    smallSize,
    pose = 'idle',
    animFrame = 0,
    side = 'left',
    timeSec,
  } = opts;

  const t = typeof timeSec === 'number' ? timeSec : animFrame * 0.18;
  const phaseOffset = side === 'right' ? 1.35 : 0;
  const breathY = typeof timeSec === 'number' ? Math.sin(t * 2.5 + phaseOffset) * 1.45 : 0;
  const headTiltDeg =
    typeof timeSec === 'number'
      ? pose === 'talking'
        ? Math.sin(t * 3.8 + phaseOffset) * 2.4
        : pose === 'thinking'
        ? (side === 'right' ? -4.5 : 4.5) + Math.sin(t * 1.8) * 1.2
        : Math.sin(t * 1.9 + phaseOffset) * 1.1
      : 0;
  const blinkCycle = (t + phaseOffset * 0.7) % 3.9;
  const isBlinking = typeof timeSec === 'number' && blinkCycle > 3.74;

  const hairSvg =
    hairStyle === 'bob'
      ? `<path d="M-24 -6 C-26 -28 26 -28 24 -6 L24 11 C18 7 14 -6 0 -8 C-14 -6 -18 7 -24 11 Z" fill="${hairHex}"/>`
      : `<path d="M-21 -8 C-20 -26 20 -26 21 -8 C12 -14 -12 -14 -21 -8 Z" fill="${hairHex}"/>`;
  const rawTagText = (tagText ?? '').trim();
  const pillText = rawTagText && !isGenericSpeakerLabel(rawTagText) ? rawTagText : '';
  const pillFont = Math.max(11, Math.round(smallSize * 0.78));
  const pillW = Math.max(90, Math.min(136, Math.round(pillText.length * pillFont * 0.7 + 24)));
  const pillH = Math.max(22, Math.round(pillFont * 1.65));
  const namePill = pillText
    ? `<rect x="${-Math.round(pillW / 2)}" y="34" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${tagHex ?? shirtHex}"/>
       <text x="0" y="${34 + Math.round(pillH * 0.70)}" text-anchor="middle" font-family="${fontFamily}" font-size="${pillFont}" font-weight="700" fill="#FFFFFF">${escapeXml(pillText)}</text>`
    : '';

  const phase = animFrame % 4;
  let mouthSvg = `<path d="M-5.5 6.8 Q0 11 5.5 6.8" fill="none" stroke="#1E293B" stroke-width="2.1" stroke-linecap="round"/>`;
  let handSvg = '';

  if (pose === 'talking') {
    if (typeof timeSec === 'number') {
      const syllable =
        0.22 +
        0.78 *
          Math.abs(
            Math.sin(t * 11.4 + phaseOffset) * 0.65 +
              Math.sin(t * 6.8 + 0.8) * 0.35
          );
      const rx = (3.4 + syllable * 1.8).toFixed(2);
      const ry = (1.3 + syllable * 3.1).toFixed(2);
      mouthSvg = `<ellipse cx="0" cy="8.1" rx="${rx}" ry="${ry}" fill="#991B1B" stroke="#1E293B" stroke-width="1.45"/>
        ${syllable > 0.48 ? `<path d="M-2.5 6.3 Q0 7.4 2.5 6.3" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>` : ''}`;
      const dir = side === 'right' ? -1 : 1;
      const swing = Math.sin(t * 4.4 + phaseOffset);
      const armOffset = -2.4 + swing * 2.8;
      const wx = dir * (24 + swing * 1.8);
      const wy = 11 + armOffset;
      handSvg = `<line x1="${dir * 14}" y1="22" x2="${wx.toFixed(2)}" y2="${wy.toFixed(2)}" stroke="${shirtHex}" stroke-width="4.6" stroke-linecap="round"/>
        <circle cx="${wx.toFixed(2)}" cy="${(wy - 1).toFixed(2)}" r="4.0" fill="#FDE68A" stroke="#1E293B" stroke-width="1.1"/>`;
    } else {
      if (phase === 0) {
        mouthSvg = `<ellipse cx="0" cy="8.1" rx="4.4" ry="3.3" fill="#991B1B" stroke="#1E293B" stroke-width="1.5"/>
          <path d="M-2.8 6.4 Q0 7.6 2.8 6.4" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round"/>`;
      } else if (phase === 1) {
        mouthSvg = `<ellipse cx="0" cy="7.8" rx="5.3" ry="2.1" fill="#991B1B" stroke="#1E293B" stroke-width="1.5"/>`;
      } else if (phase === 2) {
        mouthSvg = `<ellipse cx="0" cy="8.2" rx="3.1" ry="3.5" fill="#991B1B" stroke="#1E293B" stroke-width="1.5"/>`;
      } else {
        mouthSvg = `<path d="M-5.2 6.8 Q0 10.6 5.2 6.8" fill="none" stroke="#1E293B" stroke-width="2.1" stroke-linecap="round"/>`;
      }
      const dir = side === 'right' ? -1 : 1;
      const armOffset = [0, -2.6, -4.0, -1.6][phase];
      const wx = dir * 24;
      const wy = 11 + armOffset;
      handSvg = `<line x1="${dir * 14}" y1="22" x2="${wx}" y2="${wy}" stroke="${shirtHex}" stroke-width="4.6" stroke-linecap="round"/>
        <circle cx="${wx}" cy="${wy - 1}" r="4.0" fill="#FDE68A" stroke="#1E293B" stroke-width="1.1"/>`;
    }
  } else if (pose === 'thinking') {
    const dir = side === 'right' ? -1 : 1;
    mouthSvg = `<path d="M-4 8.4 Q1 7 5 9.2" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>`;
    const bob =
      typeof timeSec === 'number'
        ? Math.sin(t * 2.8) * 1.4
        : phase % 2 === 0
        ? -1.4
        : 0.6;
    const dot1Op =
      typeof timeSec === 'number'
        ? (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 4.5))).toFixed(2)
        : phase % 3 === 0
        ? '0.95'
        : '0.45';
    const dot2Op =
      typeof timeSec === 'number'
        ? (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 4.5 - 1.2))).toFixed(2)
        : phase % 3 === 1
        ? '0.95'
        : '0.45';
    handSvg = `<line x1="${dir * -14}" y1="23" x2="${dir * -5.5}" y2="${(14 + bob).toFixed(2)}" stroke="${shirtHex}" stroke-width="4.2" stroke-linecap="round"/>
      <circle cx="${dir * -5}" cy="${(13 + bob).toFixed(2)}" r="3.8" fill="#FDE68A" stroke="#1E293B" stroke-width="1.1"/>
      <circle cx="${dir * 22}" cy="${(-14 + bob * 0.8).toFixed(2)}" r="2.2" fill="${tagHex ?? shirtHex}" fill-opacity="${dot1Op}"/>
      <circle cx="${dir * 26}" cy="${(-21 + bob * 0.8).toFixed(2)}" r="3.2" fill="${tagHex ?? shirtHex}" fill-opacity="${dot2Op}"/>`;
  }

  const eyesSvg = isBlinking
    ? `<path d="M-9 -2 Q-6 -0.2 -3 -2" fill="none" stroke="#1E293B" stroke-width="2.0" stroke-linecap="round"/>
       <path d="M3 -2 Q6 -0.2 9 -2" fill="none" stroke="#1E293B" stroke-width="2.0" stroke-linecap="round"/>`
    : `<circle cx="-6" cy="-2" r="2.5" fill="#1E293B"/>
       <circle cx="6" cy="-2" r="2.5" fill="#1E293B"/>
       <circle cx="-6.8" cy="-2.9" r="0.85" fill="#FFFFFF"/>
       <circle cx="5.2" cy="-2.9" r="0.85" fill="#FFFFFF"/>`;

  return `<g transform="translate(${cx},${(cy + breathY).toFixed(2)}) scale(${scale})">
    <path d="M-26 32 C-24 14 24 14 26 32 Z" fill="${shirtHex}"/>
    <g transform="rotate(${headTiltDeg.toFixed(2)} 0 4)">
      <circle cx="0" cy="-2" r="19" fill="#FDE68A"/>
      ${hairSvg}
      ${eyesSvg}
      ${mouthSvg}
    </g>
    ${handSvg}
    ${namePill}
  </g>`;
}

/**
 * Generates high-DPI SVG cards for ALL 14 lequyenktpm/2411 variants with multi-line wrapping
 * (zero "..." truncation, zero box overflow), balanced readable typography across 9:16, 16:9, and 1:1,
 * plus optional non-spoiling hint/example and previous-target recall footer.
 */
export function build2411CardSvg(params: {
  spec: Studio2411CardSpec;
  width: number;
  height: number;
  fontFilePath?: string;
  fontName?: string;
  animFrame?: 0 | 1 | 2 | 3;
  speakerAPose?: 'talking' | 'thinking' | 'idle';
  speakerBPose?: 'talking' | 'thinking' | 'idle';
  countdownActive?: boolean;
  timeSec?: number;
  beatProgress?: number;
  isPlayingSpeech?: boolean;
}): string {
  const {
    spec,
    width,
    height,
    fontFilePath,
    fontName,
    animFrame = 0,
    speakerAPose: overridePoseA,
    speakerBPose: overridePoseB,
    countdownActive = false,
    timeSec,
    beatProgress,
  } = params;
  const { theme } = spec;
  const isLandscape = width > height;
  const isSquare = width === height;

  const fontFaceCss = fontFilePath
    ? `@font-face { font-family: 'Studio2411Font'; src: url('file://${fontFilePath.replace(/\\/g, '/')}'); font-weight: 700; }`
    : '';
  const fontFamily =
    fontName === 'BIZ UDPGothic'
      ? `'BIZ UDPGothic', 'M PLUS 1p', 'Noto Sans', sans-serif`
      : fontName === 'JetBrains Mono'
      ? `'JetBrains Mono', 'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif`
      : `'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif`;

  const cardW = isLandscape
    ? Math.round(width * 0.72)
    : isSquare
    ? Math.round(width * 0.86)
    : Math.round(width * 0.90);
  const cardH = isLandscape
    ? Math.round(height * 0.43)
    : isSquare
    ? Math.round(height * 0.40)
    : Math.round(height * 0.35);
  const cardX = Math.round((width - cardW) / 2);
  const cardY = isLandscape
    ? Math.round(height * 0.045)
    : isSquare
    ? Math.round(height * 0.05)
    : Math.round(height * 0.052);
  const cardR = Math.max(16, Math.round(Math.min(width, height) * 0.028));

  const gridStep = Math.max(28, Math.round(Math.min(width, height) * 0.055));
  const dotLines: string[] = [];
  for (let gx = gridStep; gx < width; gx += gridStep) {
    dotLines.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${height}" stroke="${theme.gridColorRgba}" stroke-width="1"/>`);
  }
  for (let gy = gridStep; gy < height; gy += gridStep) {
    dotLines.push(`<line x1="0" y1="${gy}" x2="${width}" y2="${gy}" stroke="${theme.gridColorRgba}" stroke-width="1"/>`);
  }

  const padX = Math.max(18, Math.round(cardW * 0.044));
  const cardScaleDim = Math.min(cardW * 0.85, cardH * 1.65);
  const titleSize = Math.max(21, Math.round(cardScaleDim * 0.050));
  const smallSize = Math.max(15, Math.round(titleSize * 0.70));
  const bigSize = Math.max(25, Math.round(titleSize * 1.22));

  // Keep Speaker A / primary color and Speaker B / secondary color 100% consistent across all turns
  const modePrimaryHex = spec.accentOverrideHex ?? theme.accentHex;
  const modeSecondaryHex = theme.secondaryAccentHex;

  const innerW = cardW - padX * 2;
  const hasFooterContext = Boolean(spec.prevTargetText || spec.exampleText);
  const stripText =
    spec.prevTargetText && spec.exampleText
      ? `RECALL PREV: ${spec.prevTargetText} · ${spec.exampleText}`
      : spec.prevTargetText
      ? `RECALL PREV: ${spec.prevTargetText}`
      : spec.exampleText ?? '';
  const fittedStrip = hasFooterContext
    ? fitTextToBox({
        text: stripText,
        boxW: innerW - 28,
        boxH: Math.round(cardH * 0.165),
        baseFontSize: Math.max(15, Math.round(smallSize * 0.94)),
        minFontSize: 13,
        maxLines: 2,
        lineHeightRatio: 1.2,
      })
    : null;
  const stripH = fittedStrip ? Math.max(30, fittedStrip.totalHeight + 12) : 0;
  const bottomBarReserve = 22;
  const bodyTop = cardY + Math.round(cardH * 0.075);
  const bodyBottom = cardY + cardH - bottomBarReserve - (hasFooterContext ? stripH + 8 : 4);
  const bodyH = Math.max(108, bodyBottom - bodyTop);
  let effectiveBodyH = bodyH;
  const iconScale = Math.max(0.62, Math.min(1.16, Math.min(cardW, cardH) / 290));

  let variantBodySvg = '';

  switch (spec.variant) {
    case 'css-compare': {
      const gap = 26;
      const colW = Math.round((innerW - gap) / 2);
      const colH = bodyH;
      const leftLabel = spec.labels[0] ?? 'Source Prompt';
      const rightLabel = spec.labels[1] ?? 'Target Phrase';
      const labelH = Math.round(smallSize * 1.5);
      const leftFit = fitTextToBox({
        text: spec.contextLabel || spec.subtitle,
        boxW: colW - 24,
        boxH: colH - labelH - 14,
        baseFontSize: bigSize,
        minFontSize: 13,
        maxLines: 5,
      });
      const rightFit = fitTextToBox({
        text: spec.speechText || spec.highlightWord,
        boxW: colW - 24,
        boxH: colH - labelH - 14,
        baseFontSize: bigSize,
        minFontSize: 13,
        maxLines: 5,
      });
      const leftLabelFit = fitTextToBox({
        text: leftLabel,
        boxW: colW - 20,
        boxH: labelH,
        baseFontSize: Math.max(14, Math.round(smallSize * 0.92)),
        minFontSize: 12,
        maxLines: 1,
      });
      const rightLabelFit = fitTextToBox({
        text: rightLabel,
        boxW: colW - 20,
        boxH: labelH,
        baseFontSize: Math.max(14, Math.round(smallSize * 0.92)),
        minFontSize: 12,
        maxLines: 1,
      });
      variantBodySvg = `
        <rect x="${cardX + padX}" y="${bodyTop}" width="${colW}" height="${colH}" rx="12" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        <rect x="${cardX + padX + colW + gap}" y="${bodyTop}" width="${colW}" height="${colH}" rx="12" fill="${modePrimaryHex}" fill-opacity="0.11" stroke="${modePrimaryHex}" stroke-width="2"/>
        <circle cx="${cardX + padX + colW + Math.round(gap / 2)}" cy="${bodyTop + Math.round(colH / 2)}" r="15" fill="${modeSecondaryHex}"/>
        <text x="${cardX + padX + colW + Math.round(gap / 2)}" y="${bodyTop + Math.round(colH / 2) + 5}" text-anchor="middle" font-family="${fontFamily}" font-size="${Math.max(12, Math.round(smallSize * 0.78))}" font-weight="700" fill="#FFFFFF">VS</text>
        <text x="${cardX + padX + Math.round(colW / 2)}" y="${bodyTop + Math.round(leftLabelFit.fontSize * 1.45)}" text-anchor="middle" font-family="${fontFamily}" font-size="${leftLabelFit.fontSize}" font-weight="700" fill="${theme.mutedTextHex}">${escapeXml(leftLabelFit.lines[0] ?? leftLabel)}</text>
        ${renderSvgTextLines({
          lines: leftFit.lines,
          x: cardX + padX + Math.round(colW / 2),
          startY: centeredBlockStartY(bodyTop + labelH, colH - labelH - 8, leftFit),
          lineHeight: leftFit.lineHeight,
          fontFamily,
          fontSize: leftFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        <text x="${cardX + padX + colW + gap + Math.round(colW / 2)}" y="${bodyTop + Math.round(rightLabelFit.fontSize * 1.45)}" text-anchor="middle" font-family="${fontFamily}" font-size="${rightLabelFit.fontSize}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(rightLabelFit.lines[0] ?? rightLabel)}</text>
        ${renderSvgTextLines({
          lines: rightFit.lines,
          x: cardX + padX + colW + gap + Math.round(colW / 2),
          startY: centeredBlockStartY(bodyTop + labelH, colH - labelH - 8, rightFit),
          lineHeight: rightFit.lineHeight,
          fontFamily,
          fontSize: rightFit.fontSize,
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
      const lineY = bodyTop + Math.round(bodyH * 0.24);
      const startX = cardX + padX + Math.round(innerW * 0.14);
      const endX = cardX + padX + Math.round(innerW * 0.86);
      const stepDx = Math.round((endX - startX) / 2);
      const titleBoxY = lineY + 46;
      const titleBoxH = Math.max(40, bodyTop + bodyH - titleBoxY);
      const titleFit = fitTextToBox({
        text: spec.title,
        boxW: innerW - 20,
        boxH: titleBoxH,
        baseFontSize: bigSize,
        minFontSize: 14,
        maxLines: 3,
      });
      variantBodySvg = `
        <line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="${theme.cardBorderHex}" stroke-width="4" stroke-linecap="round"/>
        <line x1="${startX}" y1="${lineY}" x2="${startX + activeNode * stepDx}" y2="${lineY}" stroke="${modePrimaryHex}" stroke-width="5" stroke-linecap="round"/>
        ${nodes
          .map((lbl, ni) => {
            const nx = startX + ni * stepDx;
            const active = ni <= activeNode;
            const lblFit = fitTextToBox({
              text: lbl,
              boxW: Math.max(82, Math.round(innerW * 0.28)),
              boxH: 26,
              baseFontSize: Math.max(14, Math.round(smallSize * 0.92)),
              minFontSize: 12,
              maxLines: 1,
            });
            return `<circle cx="${nx}" cy="${lineY}" r="18" fill="${active ? modePrimaryHex : theme.cardBgHex}" stroke="${active ? modePrimaryHex : theme.cardBorderHex}" stroke-width="3"/>
              <text x="${nx}" y="${lineY + 5}" text-anchor="middle" font-family="${fontFamily}" font-size="${Math.max(13, Math.round(smallSize * 0.85))}" font-weight="700" fill="${active ? '#FFFFFF' : theme.mutedTextHex}">0${ni + 1}</text>
              <text x="${nx}" y="${lineY + 40}" text-anchor="middle" font-family="${fontFamily}" font-size="${lblFit.fontSize}" font-weight="700" fill="${active ? theme.textHex : theme.mutedTextHex}">${escapeXml(lblFit.lines[0] ?? lbl)}</text>`;
          })
          .join('')}
        ${renderSvgTextLines({
          lines: titleFit.lines,
          x: cardX + Math.round(cardW / 2),
          startY: centeredBlockStartY(titleBoxY, titleBoxH, titleFit),
          lineHeight: titleFit.lineHeight,
          fontFamily,
          fontSize: titleFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
      `;
      break;
    }

    case 'css-glass-quote': {
      const contentX = cardX + padX + 46;
      const contentW = innerW - 54;
      const qBoxH = Math.round(bodyH * 0.48);
      const subBoxH = Math.round(bodyH * 0.26);
      const pillBoxH = Math.max(28, Math.round(bodyH * 0.22));
      const qFit = fitTextToBox({
        text: spec.speechText || spec.title,
        boxW: contentW,
        boxH: qBoxH,
        baseFontSize: bigSize,
        minFontSize: 14,
        maxLines: 3,
      });
      const subFit = fitTextToBox({
        text: spec.subtitle,
        boxW: contentW,
        boxH: subBoxH,
        baseFontSize: smallSize,
        minFontSize: 13,
        maxLines: 2,
      });
      const hwFit = fitTextToBox({
        text: spec.highlightWord,
        boxW: contentW - 24,
        boxH: pillBoxH,
        baseFontSize: Math.max(15, Math.round(smallSize * 0.94)),
        minFontSize: 13,
        maxLines: 1,
      });
      const pillText = hwFit.lines[0] ?? spec.highlightWord;
      const pillW = Math.min(contentW, Math.max(110, Math.round(pillText.length * hwFit.fontSize * 0.64 + 28)));
      const pillH = Math.max(28, Math.round(hwFit.fontSize * 1.75));
      const pillY = bodyTop + qBoxH + subBoxH + 2;
      variantBodySvg = `
        <rect x="${cardX + padX}" y="${bodyTop}" width="6" height="${bodyH}" rx="3" fill="${modePrimaryHex}"/>
        <text x="${cardX + padX + 16}" y="${bodyTop + Math.round(bigSize * 0.88)}" font-family="${fontFamily}" font-size="${Math.round(bigSize * 1.28)}" font-weight="700" fill="${modeSecondaryHex}" fill-opacity="0.55">“</text>
        ${renderSvgTextLines({
          lines: qFit.lines,
          x: contentX,
          startY: centeredBlockStartY(bodyTop, qBoxH, qFit),
          lineHeight: qFit.lineHeight,
          fontFamily,
          fontSize: qFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        ${renderSvgTextLines({
          lines: subFit.lines,
          x: contentX,
          startY: centeredBlockStartY(bodyTop + qBoxH, subBoxH, subFit),
          lineHeight: subFit.lineHeight,
          fontFamily,
          fontSize: subFit.fontSize,
          fontWeight: 600,
          fill: theme.mutedTextHex,
        })}
        <rect x="${contentX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="8" fill="${modePrimaryHex}" fill-opacity="0.14"/>
        <text x="${contentX + 14}" y="${pillY + Math.round(pillH * 0.68)}" font-family="${fontFamily}" font-size="${hwFit.fontSize}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(pillText)}</text>
      `;
      break;
    }

    case 'css-equation': {
      const partA = spec.labels[0] ?? 'Pattern A';
      const partB = spec.labels[1] ?? 'Context B';
      const resC = spec.highlightWord;
      const opGap = 28;
      const boxW = Math.round((innerW - opGap * 2) / 3);
      const topH = Math.round(smallSize * 1.7);
      const boxY = bodyTop + topH + 4;
      const boxH = Math.max(60, bodyH - topH - 6);
      const fFit = fitTextToBox({
        text: spec.formula,
        boxW: innerW,
        boxH: topH,
        baseFontSize: smallSize,
        minFontSize: 13,
        maxLines: 1,
      });
      const aFit = fitTextToBox({
        text: partA,
        boxW: boxW - 18,
        boxH: boxH - 12,
        baseFontSize: titleSize,
        minFontSize: 13,
        maxLines: 4,
      });
      const bFit = fitTextToBox({
        text: partB,
        boxW: boxW - 18,
        boxH: boxH - 12,
        baseFontSize: titleSize,
        minFontSize: 13,
        maxLines: 4,
      });
      const cFit = fitTextToBox({
        text: resC,
        boxW: boxW - 18,
        boxH: boxH - 12,
        baseFontSize: titleSize,
        minFontSize: 13,
        maxLines: 4,
      });
      variantBodySvg = `
        <text x="${cardX + padX}" y="${bodyTop + Math.round(fFit.fontSize * 1.15)}" font-family="${fontFamily}" font-size="${fFit.fontSize}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(fFit.lines[0] ?? spec.formula)}</text>
        <rect x="${cardX + padX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="10" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        ${renderSvgTextLines({
          lines: aFit.lines,
          x: cardX + padX + Math.round(boxW / 2),
          startY: centeredBlockStartY(boxY, boxH, aFit),
          lineHeight: aFit.lineHeight,
          fontFamily,
          fontSize: aFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        <text x="${cardX + padX + boxW + Math.round(opGap / 2)}" y="${boxY + Math.round(boxH * 0.56)}" text-anchor="middle" font-family="${fontFamily}" font-size="${bigSize}" font-weight="700" fill="${modeSecondaryHex}">+</text>
        <rect x="${cardX + padX + boxW + opGap}" y="${boxY}" width="${boxW}" height="${boxH}" rx="10" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        ${renderSvgTextLines({
          lines: bFit.lines,
          x: cardX + padX + boxW + opGap + Math.round(boxW / 2),
          startY: centeredBlockStartY(boxY, boxH, bFit),
          lineHeight: bFit.lineHeight,
          fontFamily,
          fontSize: bFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        <text x="${cardX + padX + boxW * 2 + opGap + Math.round(opGap / 2)}" y="${boxY + Math.round(boxH * 0.56)}" text-anchor="middle" font-family="${fontFamily}" font-size="${bigSize}" font-weight="700" fill="${modePrimaryHex}">=</text>
        <rect x="${cardX + padX + boxW * 2 + opGap * 2}" y="${boxY}" width="${boxW}" height="${boxH}" rx="10" fill="${modePrimaryHex}" fill-opacity="0.16" stroke="${modePrimaryHex}" stroke-width="2"/>
        ${renderSvgTextLines({
          lines: cFit.lines,
          x: cardX + padX + boxW * 2 + opGap * 2 + Math.round(boxW / 2),
          startY: centeredBlockStartY(boxY, boxH, cFit),
          lineHeight: cFit.lineHeight,
          fontFamily,
          fontSize: cFit.fontSize,
          fontWeight: 700,
          fill: modePrimaryHex,
          anchor: 'middle',
        })}
      `;
      break;
    }

    case 'css-flashcard': {
      const boxH = bodyH;
      const topLabelH = Math.round(smallSize * 1.5);
      const mainBoxH = Math.round((boxH - topLabelH) * 0.64);
      const subBoxH = Math.max(26, boxH - topLabelH - mainBoxH - 6);
      const hwFit = fitTextToBox({
        text: spec.highlightWord,
        boxW: innerW - 36,
        boxH: mainBoxH,
        baseFontSize: Math.round(bigSize * 1.08),
        minFontSize: 15,
        maxLines: 3,
      });
      const subFit = fitTextToBox({
        text: spec.subtitle,
        boxW: innerW - 36,
        boxH: subBoxH,
        baseFontSize: smallSize,
        minFontSize: 13,
        maxLines: 2,
      });
      variantBodySvg = `
        <rect x="${cardX + padX + 6}" y="${bodyTop + 5}" width="${innerW - 6}" height="${boxH - 5}" rx="14" fill="${modeSecondaryHex}" fill-opacity="0.12" stroke="${theme.cardBorderHex}" stroke-width="1"/>
        <rect x="${cardX + padX}" y="${bodyTop}" width="${innerW - 6}" height="${boxH - 5}" rx="14" fill="${theme.surfaceTintHex}" stroke="${modePrimaryHex}" stroke-width="2"/>
        <text x="${cardX + padX + 18}" y="${bodyTop + Math.round(smallSize * 1.25)}" font-family="${fontFamily}" font-size="${Math.max(14, Math.round(smallSize * 0.92))}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(spec.labels[0] ?? 'FLASHCARD')}</text>
        ${renderSvgTextLines({
          lines: hwFit.lines,
          x: cardX + Math.round(cardW / 2),
          startY: centeredBlockStartY(bodyTop + topLabelH, mainBoxH, hwFit),
          lineHeight: hwFit.lineHeight,
          fontFamily,
          fontSize: hwFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
          anchor: 'middle',
        })}
        ${renderSvgTextLines({
          lines: subFit.lines,
          x: cardX + Math.round(cardW / 2),
          startY: centeredBlockStartY(bodyTop + topLabelH + mainBoxH, subBoxH, subFit),
          lineHeight: subFit.lineHeight,
          fontFamily,
          fontSize: subFit.fontSize,
          fontWeight: 600,
          fill: theme.mutedTextHex,
          anchor: 'middle',
        })}
      `;
      break;
    }

    case 'bs-progress-meter': {
      const meterW = innerW;
      const meterH = Math.max(18, Math.round(bodyH * 0.16));
      const titleBoxH = Math.round(bodyH * 0.46);
      const meterY = bodyTop + titleBoxH + 8;
      const fillW = Math.max(20, Math.round((spec.progressPct / 100) * meterW));
      const tFit = fitTextToBox({
        text: spec.title,
        boxW: innerW - 96,
        boxH: titleBoxH,
        baseFontSize: bigSize,
        minFontSize: 15,
        maxLines: 3,
      });
      const lblFit = fitTextToBox({
        text: spec.labels.join(' · '),
        boxW: innerW,
        boxH: Math.max(26, bodyTop + bodyH - (meterY + meterH + 6)),
        baseFontSize: smallSize,
        minFontSize: 13,
        maxLines: 2,
      });
      variantBodySvg = `
        ${renderSvgTextLines({
          lines: tFit.lines,
          x: cardX + padX,
          startY: centeredBlockStartY(bodyTop, titleBoxH, tFit),
          lineHeight: tFit.lineHeight,
          fontFamily,
          fontSize: tFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        <text x="${cardX + cardW - padX}" y="${bodyTop + Math.round(bigSize * 1.15)}" text-anchor="end" font-family="${fontFamily}" font-size="${bigSize}" font-weight="700" fill="${modePrimaryHex}">${spec.progressPct}%</text>
        <rect x="${cardX + padX}" y="${meterY}" width="${meterW}" height="${meterH}" rx="${Math.round(meterH / 2)}" fill="${theme.cardBorderHex}" fill-opacity="0.55"/>
        <rect x="${cardX + padX}" y="${meterY}" width="${fillW}" height="${meterH}" rx="${Math.round(meterH / 2)}" fill="url(#accentBar)"/>
        ${renderSvgTextLines({
          lines: lblFit.lines,
          x: cardX + padX,
          startY: meterY + meterH + Math.round(lblFit.fontSize * 1.4),
          lineHeight: lblFit.lineHeight,
          fontFamily,
          fontSize: lblFit.fontSize,
          fontWeight: 600,
          fill: theme.mutedTextHex,
        })}
      `;
      break;
    }

    case 'bs-alert-callout': {
      const iconCx = cardX + padX + Math.round(cardW * 0.11);
      const iconCy = bodyTop + Math.round(bodyH * 0.48);
      const textX = cardX + padX + Math.round(cardW * 0.23);
      const textW = innerW - Math.round(cardW * 0.24) - 10;
      const tBoxH = Math.round(bodyH * 0.58);
      const sBoxH = Math.max(28, bodyH - tBoxH - 10);
      const tFit = fitTextToBox({
        text: spec.speechText || spec.title,
        boxW: textW,
        boxH: tBoxH,
        baseFontSize: bigSize,
        minFontSize: 15,
        maxLines: 3,
      });
      const sFit = fitTextToBox({
        text: spec.subtitle,
        boxW: textW,
        boxH: sBoxH,
        baseFontSize: smallSize,
        minFontSize: 13,
        maxLines: 2,
      });
      variantBodySvg = `
        <rect x="${cardX + padX}" y="${bodyTop}" width="${innerW}" height="${bodyH}" rx="12" fill="${modeSecondaryHex}" fill-opacity="0.10" stroke="${modeSecondaryHex}" stroke-width="1.5"/>
        <rect x="${cardX + padX}" y="${bodyTop}" width="9" height="${bodyH}" rx="4" fill="${modeSecondaryHex}"/>
        ${getSvgVectorIllustration('alert_triangle', iconCx, iconCy, iconScale * 0.85, modeSecondaryHex, modePrimaryHex, theme.cardBgHex)}
        ${renderSvgTextLines({
          lines: tFit.lines,
          x: textX,
          startY: centeredBlockStartY(bodyTop + 4, tBoxH, tFit),
          lineHeight: tFit.lineHeight,
          fontFamily,
          fontSize: tFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        ${renderSvgTextLines({
          lines: sFit.lines,
          x: textX,
          startY: centeredBlockStartY(bodyTop + tBoxH + 2, sBoxH, sFit),
          lineHeight: sFit.lineHeight,
          fontFamily,
          fontSize: sFit.fontSize,
          fontWeight: 600,
          fill: theme.mutedTextHex,
        })}
      `;
      break;
    }

    case 'gauge-tone': {
      const gcx = cardX + Math.round(cardW * 0.22);
      const gcy = bodyTop + Math.round(bodyH * 0.64);
      const r = Math.max(32, Math.round(Math.min(cardW * 0.145, bodyH * 0.48)));
      const rightX = cardX + Math.round(cardW * 0.42);
      const rightW = cardX + cardW - padX - rightX;
      const tBoxH = Math.round(bodyH * 0.44);
      const hwBoxH = Math.round(bodyH * 0.30);
      const subBoxH = Math.max(22, bodyH - tBoxH - hwBoxH);
      const tFit = fitTextToBox({
        text: spec.title,
        boxW: rightW,
        boxH: tBoxH,
        baseFontSize: bigSize,
        minFontSize: 14,
        maxLines: 3,
      });
      const hwFit = fitTextToBox({
        text: spec.highlightWord,
        boxW: rightW,
        boxH: hwBoxH,
        baseFontSize: titleSize,
        minFontSize: 13,
        maxLines: 2,
      });
      const subFit = fitTextToBox({
        text: spec.subtitle,
        boxW: rightW,
        boxH: subBoxH,
        baseFontSize: smallSize,
        minFontSize: 13,
        maxLines: 1,
      });
      variantBodySvg = `
        <path d="M ${gcx - r} ${gcy} A ${r} ${r} 0 0 1 ${gcx + r} ${gcy}" fill="none" stroke="${theme.cardBorderHex}" stroke-width="10" stroke-linecap="round"/>
        <path d="M ${gcx - r} ${gcy} A ${r} ${r} 0 0 1 ${gcx + Math.round(r * 0.45)} ${gcy - Math.round(r * 0.88)}" fill="none" stroke="url(#accentBar)" stroke-width="10" stroke-linecap="round"/>
        <circle cx="${gcx}" cy="${gcy}" r="6" fill="${modePrimaryHex}"/>
        <line x1="${gcx}" y1="${gcy}" x2="${gcx + Math.round(r * 0.35)}" y2="${gcy - Math.round(r * 0.62)}" stroke="${theme.textHex}" stroke-width="4" stroke-linecap="round"/>
        <text x="${gcx}" y="${gcy + 24}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="${modePrimaryHex}">${spec.progressPct}%</text>
        ${renderSvgTextLines({
          lines: tFit.lines,
          x: rightX,
          startY: centeredBlockStartY(bodyTop, tBoxH, tFit),
          lineHeight: tFit.lineHeight,
          fontFamily,
          fontSize: tFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        ${renderSvgTextLines({
          lines: hwFit.lines,
          x: rightX,
          startY: centeredBlockStartY(bodyTop + tBoxH, hwBoxH, hwFit),
          lineHeight: hwFit.lineHeight,
          fontFamily,
          fontSize: hwFit.fontSize,
          fontWeight: 600,
          fill: modeSecondaryHex,
        })}
        <text x="${rightX}" y="${bodyTop + tBoxH + hwBoxH + Math.round(subFit.fontSize * 1.1)}" font-family="${fontFamily}" font-size="${subFit.fontSize}" font-weight="600" fill="${theme.mutedTextHex}">${escapeXml(subFit.lines[0] ?? spec.subtitle)}</text>
      `;
      break;
    }

    case 'staircase-3d': {
      const stepW = Math.round((innerW - 24) / 3);
      const baseBottom = bodyTop + Math.round(bodyH * 0.94);
      const heights = [0.42, 0.64, 0.88];
      variantBodySvg = heights
        .map((hr, si) => {
          const sh = Math.round(bodyH * hr);
          const sx = cardX + padX + si * (stepW + 12);
          const sy = baseBottom - sh;
          const lbl = spec.labels[si] ?? `Step ${si + 1}`;
          const lblFit = fitTextToBox({
            text: lbl,
            boxW: stepW - 16,
            boxH: sh - 12,
            baseFontSize: titleSize,
            minFontSize: 13,
            maxLines: 3,
          });
          return `<rect x="${sx + 4}" y="${sy + 4}" width="${stepW}" height="${sh}" rx="8" fill="${modeSecondaryHex}" fill-opacity="0.18"/>
            <rect x="${sx}" y="${sy}" width="${stepW}" height="${sh}" rx="8" fill="${si === 2 ? modePrimaryHex : theme.surfaceTintHex}" stroke="${si === 2 ? modePrimaryHex : theme.cardBorderHex}" stroke-width="2"/>
            ${renderSvgTextLines({
              lines: lblFit.lines,
              x: sx + Math.round(stepW / 2),
              startY: centeredBlockStartY(sy, sh, lblFit),
              lineHeight: lblFit.lineHeight,
              fontFamily,
              fontSize: lblFit.fontSize,
              fontWeight: 700,
              fill: si === 2 ? '#FFFFFF' : theme.textHex,
              anchor: 'middle',
            })}`;
        })
        .join('');
      break;
    }

    case 'friends-chat': {
      const isIntro = spec.layoutKind === 'intro_hero';
      const isOutro = spec.layoutKind === 'outro_recap';
      const isQuizPrompt = spec.layoutKind === 'quiz_prompt';
      const isAnswerReveal = !isIntro && !isOutro && spec.layoutKind === 'answer_reveal';
      const rawLabelA = spec.labels[0]?.trim() ?? '';
      const rawLabelB = spec.labels[1]?.trim() ?? '';
      const spkLabel = isAnswerReveal
        ? rawLabelB && !isGenericSpeakerLabel(rawLabelB)
          ? rawLabelB
          : rawLabelA && !isGenericSpeakerLabel(rawLabelA)
          ? rawLabelA
          : ''
        : rawLabelA && !isGenericSpeakerLabel(rawLabelA)
        ? rawLabelA
        : '';
      const avColW = Math.round(innerW * 0.16);
      const bubblePadX = 20;
      const maxLinePx = (fitted: FittedSvgTextBlock, weight = 600) =>
        fitted.lines.reduce(
          (mx, ln) => Math.max(mx, measureSvgLinePx(ln, fitted.fontSize, weight)),
          0
        );

      const avScale = Math.max(0.76, Math.min(1.02, width / 740));
      const maxB1W = innerW - avColW - 14;
      const spokenText = spec.speechText;
      const maxFlexBubbleH = isLandscape ? Math.round(height * 0.40) : Math.round(height * 0.36);
      const b1Fit = fitTextToBox({
        text: spokenText,
        boxW: maxB1W - bubblePadX * 2,
        boxH: maxFlexBubbleH,
        baseFontSize: Math.round(titleSize * 1.16),
        minFontSize: 16,
        maxLines: 6,
        lineHeightRatio: 1.28,
        fontWeight: 600,
      });
      const b1W = Math.min(
        maxB1W,
        Math.max(Math.round(maxB1W * 0.38), maxLinePx(b1Fit, 600) + bubblePadX * 2)
      );
      const padY1 = Math.max(13, Math.round(b1Fit.fontSize * 0.58));
      const row1H = Math.max(56, b1Fit.totalHeight + padY1 * 2);
      const row1Y = bodyTop;
      const leftAvCx = cardX + padX + Math.round(avColW * 0.5);
      const leftAvCy = row1Y + Math.round(row1H * 0.48);
      const b1X = cardX + padX + avColW + 12;

      const bubbleStrokeHex = isAnswerReveal ? modeSecondaryHex : modePrimaryHex;
      const bubbleFillOpacity = isAnswerReveal ? '0.14' : '1';
      const bubbleFillHex = isAnswerReveal ? modeSecondaryHex : theme.surfaceTintHex;

      const singleSpeakerPose: 'talking' | 'thinking' | 'idle' = countdownActive
        ? 'thinking'
        : overridePoseB === 'talking' || overridePoseA === 'talking'
        ? 'talking'
        : overridePoseA ?? 'talking';

      const showThinkingDots = isQuizPrompt && countdownActive;
      const rowGap = 12;
      const thinkBubbleH = Math.max(46, Math.round(smallSize * 2.8));
      const thinkBubbleW = Math.min(maxB1W, Math.max(246, Math.round(maxB1W * 0.64)));
      const thinkBubbleY = row1Y + row1H + rowGap;

      effectiveBodyH = showThinkingDots ? row1H + rowGap + thinkBubbleH : row1H;

      const thinkingBubbleSvg = (() => {
        if (!showThinkingDots) return '';
        const dotCenterY = thinkBubbleY + Math.round(thinkBubbleH * 0.5);
        const chipW = Math.min(thinkBubbleW - 96, 128);
        const chipH = Math.max(26, Math.round(smallSize * 1.6));
        const chipX = b1X + 14;
        const chipY = dotCenterY - Math.round(chipH / 2);
        const thinkLabel = `Think ${Math.max(1, spec.pauseSec || 5)}s`;
        const iconCx = chipX + 16;
        const iconCy = chipY + Math.round(chipH / 2);
        const dotStep = 18;
        const dotStartX = b1X + thinkBubbleW - 22 - dotStep * 2;
        const activeDot = animFrame % 3;
        const dotsSvg = [0, 1, 2]
          .map((di) => {
            let cyOffset: number;
            let r: number;
            let op: string;
            if (typeof timeSec === 'number') {
              const wave = Math.sin(timeSec * 5.4 - di * 1.15);
              cyOffset = wave * -4.0;
              r = 4.6 + Math.max(0, wave) * 1.4;
              op = (0.45 + 0.55 * Math.max(0, wave)).toFixed(2);
            } else {
              const isActive = di === activeDot;
              cyOffset = isActive ? -4.5 : 1;
              r = isActive ? 5.8 : 4.5;
              op = isActive ? '1' : '0.45';
            }
            return `<circle cx="${dotStartX + di * dotStep}" cy="${(dotCenterY + cyOffset).toFixed(2)}" r="${r.toFixed(2)}" fill="${modeSecondaryHex}" fill-opacity="${op}"/>`;
          })
          .join('');
        return `<rect x="${b1X}" y="${thinkBubbleY}" width="${thinkBubbleW}" height="${thinkBubbleH}" rx="15" fill="${modeSecondaryHex}" fill-opacity="0.14" stroke="${modeSecondaryHex}" stroke-width="2" stroke-dasharray="6 4"/>
          <rect x="${chipX}" y="${chipY}" width="${chipW}" height="${chipH}" rx="${Math.round(chipH / 2)}" fill="${modeSecondaryHex}" fill-opacity="0.16" stroke="${modeSecondaryHex}" stroke-width="1.2"/>
          ${getSvgVectorIllustration('clock', iconCx, iconCy, 0.20, modeSecondaryHex, modeSecondaryHex, theme.cardBgHex)}
          <text x="${chipX + Math.round(chipW * 0.58)}" y="${chipY + Math.round(chipH * 0.69)}" text-anchor="middle" font-family="${fontFamily}" font-size="${Math.max(12, Math.round(smallSize * 0.86))}" font-weight="700" fill="${modeSecondaryHex}">${escapeXml(thinkLabel)}</text>
          ${dotsSvg}`;
      })();

      variantBodySvg = `
        ${buildSvgCharacterAvatar({
          cx: leftAvCx,
          cy: leftAvCy,
          scale: avScale,
          shirtHex: modePrimaryHex,
          hairHex: '#1E293B',
          hairStyle: 'short',
          tagText: spkLabel,
          tagHex: bubbleStrokeHex,
          fontFamily,
          smallSize,
          pose: singleSpeakerPose,
          animFrame,
          side: 'left',
          timeSec,
        })}
        <polygon points="${b1X},${row1Y + Math.round(row1H * 0.34)} ${b1X - 10},${row1Y + Math.round(row1H * 0.48)} ${b1X},${row1Y + Math.round(row1H * 0.62)}" fill="${bubbleFillHex}" fill-opacity="${bubbleFillOpacity}" stroke="${bubbleStrokeHex}" stroke-width="2.2"/>
        <rect x="${b1X}" y="${row1Y}" width="${b1W}" height="${row1H}" rx="15" fill="${bubbleFillHex}" fill-opacity="${bubbleFillOpacity}" stroke="${bubbleStrokeHex}" stroke-width="2.2"/>
        ${renderSvgTextLines({
          lines: b1Fit.lines,
          x: b1X + bubblePadX,
          startY: centeredBlockStartY(row1Y, row1H, b1Fit),
          lineHeight: b1Fit.lineHeight,
          fontFamily,
          fontSize: b1Fit.fontSize,
          fontWeight: 600,
          fill: theme.textHex,
        })}
        ${thinkingBubbleSvg}
      `;
      break;
    }

    case 'avatar-speech': {
      const avX = cardX + padX + Math.round(innerW * 0.13);
      const avScale = Math.max(0.76, Math.min(1.06, width / 740));
      const bX = cardX + padX + Math.round(innerW * 0.27);
      const bY = bodyTop + 2;
      const maxBW = Math.round(innerW * 0.73);
      const bubblePadX = 20;
      const pillFont = Math.max(12, Math.round(smallSize * 0.82));
      const pillH = Math.max(24, Math.round(pillFont * 1.68));
      const pillW = Math.min(maxBW - 24, Math.max(96, Math.round(spec.reactionText.length * pillFont * 0.72 + 28)));
      const metaRowH = pillH + 12;
      const spFit = fitTextToBox({
        text: spec.speechText,
        boxW: maxBW - bubblePadX * 2,
        boxH: Math.round(height * 0.34),
        baseFontSize: bigSize,
        minFontSize: 15,
        maxLines: 5,
        lineHeightRatio: 1.26,
        fontWeight: 700,
      });
      const spMaxPx = spFit.lines.reduce(
        (mx, ln) => Math.max(mx, measureSvgLinePx(ln, spFit.fontSize, 700)),
        0
      );
      const bW = Math.min(maxBW, Math.max(Math.max(pillW + 132, Math.round(maxBW * 0.46)), spMaxPx + bubblePadX * 2));
      const speechH = Math.max(46, spFit.totalHeight + 22);
      const bH = speechH + metaRowH + 8;
      effectiveBodyH = bH + 6;
      const avY = bY + Math.round(bH * 0.5);
      const subFit = fitTextToBox({
        text: spec.subtitle,
        boxW: Math.max(84, bW - pillW - bubblePadX * 2),
        boxH: metaRowH,
        baseFontSize: Math.max(14, Math.round(smallSize * 0.90)),
        minFontSize: 12,
        maxLines: 1,
        fontWeight: 700,
      });
      const pillX = bX + bW - pillW - 14;
      const pillY = bY + bH - pillH - 10;
      const subY = pillY + Math.round(pillH * 0.68);
      variantBodySvg = `
        <circle cx="${avX}" cy="${avY - 4}" r="${Math.round(32 * avScale)}" fill="${modePrimaryHex}" fill-opacity="0.14"/>
        ${buildSvgCharacterAvatar({
          cx: avX,
          cy: avY,
          scale: avScale,
          shirtHex: modePrimaryHex,
          hairHex: '#1E293B',
          hairStyle: 'short',
          tagText: spec.labels[0] && !isGenericSpeakerLabel(spec.labels[0]) ? spec.labels[0] : '',
          tagHex: modePrimaryHex,
          fontFamily,
          smallSize,
          pose: overridePoseA ?? 'talking',
          animFrame,
          side: 'left',
          timeSec,
        })}
        <polygon points="${bX},${bY + Math.round(bH * 0.38)} ${bX - 14},${bY + Math.round(bH * 0.50)} ${bX},${bY + Math.round(bH * 0.62)}" fill="${theme.surfaceTintHex}" stroke="${modePrimaryHex}" stroke-width="2"/>
        <rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" rx="14" fill="${theme.surfaceTintHex}" stroke="${modePrimaryHex}" stroke-width="2"/>
        ${renderSvgTextLines({
          lines: spFit.lines,
          x: bX + bubblePadX,
          startY: centeredBlockStartY(bY + 6, speechH, spFit),
          lineHeight: spFit.lineHeight,
          fontFamily,
          fontSize: spFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        <text x="${bX + bubblePadX}" y="${subY}" font-family="${fontFamily}" font-size="${subFit.fontSize}" font-weight="700" fill="${theme.mutedTextHex}">${escapeXml(subFit.lines[0] ?? spec.subtitle)}</text>
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${modeSecondaryHex}"/>
        <text x="${pillX + Math.round(pillW / 2)}" y="${subY}" text-anchor="middle" font-family="${fontFamily}" font-size="${pillFont}" font-weight="700" fill="#FFFFFF">${escapeXml(spec.reactionText)}</text>
      `;
      break;
    }

    case 'dialogue-upgrade': {
      const gap = 34;
      const boxW = Math.round((innerW - gap) / 2);
      const boxH = bodyH;
      const boxY = bodyTop;
      const leftX = cardX + padX;
      const rightX = cardX + padX + boxW + gap;
      const midX = cardX + padX + boxW + Math.round(gap / 2);
      const labelH = Math.round(smallSize * 1.5);
      const spFit = fitTextToBox({
        text: spec.speechText,
        boxW: boxW - 24,
        boxH: boxH - labelH - 12,
        baseFontSize: titleSize,
        minFontSize: 13,
        maxLines: 5,
      });
      const hwFit = fitTextToBox({
        text: spec.highlightWord,
        boxW: boxW - 24,
        boxH: boxH - labelH - 12,
        baseFontSize: bigSize,
        minFontSize: 13,
        maxLines: 5,
      });
      variantBodySvg = `
        <rect x="${leftX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="12" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        <text x="${leftX + 14}" y="${boxY + Math.round(smallSize * 1.3)}" font-family="${fontFamily}" font-size="${Math.max(13, Math.round(smallSize * 0.90))}" font-weight="700" fill="${theme.mutedTextHex}">${escapeXml(spec.labels[0] ?? 'Basic Form')}</text>
        ${renderSvgTextLines({
          lines: spFit.lines,
          x: leftX + 14,
          startY: centeredBlockStartY(boxY + labelH, boxH - labelH - 8, spFit),
          lineHeight: spFit.lineHeight,
          fontFamily,
          fontSize: spFit.fontSize,
          fontWeight: 600,
          fill: theme.textHex,
        })}
        <circle cx="${midX}" cy="${boxY + Math.round(boxH / 2)}" r="14" fill="${modePrimaryHex}"/>
        <text x="${midX}" y="${boxY + Math.round(boxH / 2) + 5}" text-anchor="middle" font-family="${fontFamily}" font-size="${smallSize}" font-weight="700" fill="#FFFFFF">→</text>
        <rect x="${rightX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="12" fill="${modePrimaryHex}" fill-opacity="0.14" stroke="${modePrimaryHex}" stroke-width="2"/>
        <text x="${rightX + 14}" y="${boxY + Math.round(smallSize * 1.3)}" font-family="${fontFamily}" font-size="${Math.max(13, Math.round(smallSize * 0.90))}" font-weight="700" fill="${modePrimaryHex}">✓ ${escapeXml(spec.labels[1] ?? 'Natural Form')}</text>
        ${renderSvgTextLines({
          lines: hwFit.lines,
          x: rightX + 14,
          startY: centeredBlockStartY(boxY + labelH, boxH - labelH - 8, hwFit),
          lineHeight: hwFit.lineHeight,
          fontFamily,
          fontSize: hwFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
        })}
      `;
      break;
    }

    case 'css-browser-mockup':
    case 'bs-card-header':
    default: {
      const leftBoxW = Math.round(innerW * 0.25);
      const iconCx = cardX + padX + Math.round(leftBoxW / 2);
      const iconCy = bodyTop + Math.round(bodyH * 0.50);
      const rightColX = cardX + padX + leftBoxW + 20;
      const rightColW = innerW - leftBoxW - 20;
      const waveHeights = [0.34, 0.68, 0.95, 0.52, 0.82, 0.44, 0.72, 0.38];
      const waveMaxH = Math.max(18, Math.round(bodyH * 0.14));

      const mainHeadline =
        spec.speechText && spec.speechText.length > spec.title.length
          ? spec.speechText
          : spec.title;
      const tBoxH = Math.round(bodyH * 0.54);
      const subBoxH = Math.max(24, Math.round(bodyH * 0.22));
      const tFit = fitTextToBox({
        text: mainHeadline,
        boxW: rightColW,
        boxH: tBoxH,
        baseFontSize: bigSize,
        minFontSize: 15,
        maxLines: 3,
      });
      const subFit = fitTextToBox({
        text: spec.subtitle,
        boxW: rightColW - 24,
        boxH: subBoxH,
        baseFontSize: Math.max(15, Math.round(smallSize * 0.94)),
        minFontSize: 13,
        maxLines: 1,
      });

      const groupGap = 10;
      const pillH = Math.max(26, Math.round(subFit.fontSize * 1.65));
      const totalGroupH = tFit.totalHeight + groupGap + pillH + groupGap + waveMaxH;
      const groupTopY = bodyTop + Math.max(4, Math.round((bodyH - totalGroupH) / 2));
      const titleStartY = groupTopY + Math.round(tFit.fontSize * 0.85);
      const pillY = groupTopY + tFit.totalHeight + groupGap;
      const pillText = subFit.lines[0] ?? spec.subtitle;
      const pillW = Math.min(rightColW, Math.max(112, Math.round(pillText.length * subFit.fontSize * 0.66 + 26)));
      const waveBaseY = pillY + pillH + groupGap + waveMaxH;
      const waveSvg = waveHeights
        .map((ratio, idx) => {
          const bw = Math.max(6, Math.min(10, Math.round(rightColW * 0.025)));
          const gap = Math.max(5, Math.min(8, Math.round(bw * 0.65)));
          const bh = Math.max(8, Math.round(waveMaxH * ratio));
          const bx = rightColX + idx * (bw + gap);
          const by = waveBaseY - bh;
          const fill = idx % 2 === 0 ? modePrimaryHex : modeSecondaryHex;
          return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${Math.round(bw / 2)}" fill="${fill}" fill-opacity="${(0.55 + ratio * 0.4).toFixed(2)}"/>`;
        })
        .join('');

      variantBodySvg = `
        <rect x="${cardX + padX}" y="${bodyTop}" width="${leftBoxW}" height="${bodyH}" rx="${Math.round(cardR * 0.6)}" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
        ${getSvgVectorIllustration(spec.iconKey, iconCx, iconCy, iconScale, modePrimaryHex, modeSecondaryHex, theme.cardBgHex)}
        ${renderSvgTextLines({
          lines: tFit.lines,
          x: rightColX,
          startY: titleStartY,
          lineHeight: tFit.lineHeight,
          fontFamily,
          fontSize: tFit.fontSize,
          fontWeight: 700,
          fill: theme.textHex,
        })}
        <rect x="${rightColX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="8" fill="${modePrimaryHex}" fill-opacity="0.12"/>
        <text x="${rightColX + 12}" y="${pillY + Math.round(pillH * 0.68)}" font-family="${fontFamily}" font-size="${subFit.fontSize}" font-weight="700" fill="${modePrimaryHex}">${escapeXml(pillText)}</text>
        ${waveSvg}
      `;
      break;
    }
  }

  // Optional Hint / Example / Previous Target Recall Strip cleanly placed below body and above progress bar
  let footerContextSvg = '';
  if (hasFooterContext && fittedStrip) {
    const stripY = bodyTop + effectiveBodyH + 8;
    const iconKeyForStrip: PresentationIconKey =
      spec.hintKind === 'caution' ? 'alert_triangle' : 'lightbulb';
    const stripIconCx = cardX + padX + 18;
    const stripIconCy = stripY + Math.round(stripH / 2);
    const stripIconColor =
      spec.hintKind === 'caution' ? '#D97706' : spec.prevTargetText ? modePrimaryHex : modeSecondaryHex;
    footerContextSvg = `
      <rect x="${cardX + padX}" y="${stripY}" width="${innerW}" height="${stripH}" rx="8" fill="${modePrimaryHex}" fill-opacity="0.08" stroke="${theme.cardBorderHex}" stroke-width="1"/>
      ${getSvgVectorIllustration(iconKeyForStrip, stripIconCx, stripIconCy, 0.24, stripIconColor, modePrimaryHex, theme.cardBgHex)}
      ${renderSvgTextLines({
        lines: fittedStrip.lines,
        x: cardX + padX + 34,
        startY: centeredBlockStartY(stripY, stripH, fittedStrip),
        lineHeight: fittedStrip.lineHeight,
        fontFamily,
        fontSize: fittedStrip.fontSize,
        fontWeight: 600,
        fill: spec.prevTargetText ? modePrimaryHex : theme.mutedTextHex,
      })}
    `;
  }

  const computedCardH =
    (bodyTop - cardY) + effectiveBodyH + (hasFooterContext ? stripH + 16 : 8) + bottomBarReserve;
  const effectiveCardH =
    spec.variant === 'friends-chat' || spec.variant === 'avatar-speech'
      ? Math.max(116, computedCardH)
      : cardH;

  const barY = cardY + effectiveCardH - 15;
  const barW = innerW;
  const animatedPct =
    typeof beatProgress === 'number'
      ? Math.min(100, Math.max(5, spec.progressPct - 4 + beatProgress * 4))
      : spec.progressPct;
  const barFillW = Math.max(18, Math.round((animatedPct / 100) * barW));
  const glowShiftX = typeof timeSec === 'number' ? Math.sin(timeSec * 0.7) * 14 : 0;
  const glowShiftY = typeof timeSec === 'number' ? Math.cos(timeSec * 0.55) * 10 : 0;

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
  <circle cx="${(width * 0.2 + glowShiftX).toFixed(1)}" cy="${(height * 0.22 + glowShiftY).toFixed(1)}" r="${Math.round(Math.min(width, height) * 0.38)}" fill="${theme.bgAccentHex}" fill-opacity="0.55"/>
  <circle cx="${(width * 0.84 - glowShiftX).toFixed(1)}" cy="${(height * 0.76 - glowShiftY).toFixed(1)}" r="${Math.round(Math.min(width, height) * 0.34)}" fill="${modeSecondaryHex}" fill-opacity="0.08"/>
  <g>${dotLines.join('')}</g>

  <rect x="${cardX + 4}" y="${cardY + 10}" width="${cardW}" height="${effectiveCardH}" rx="${cardR}" fill="#000000" fill-opacity="${theme.isLight ? '0.07' : '0.36'}"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${effectiveCardH}" rx="${cardR}" fill="${theme.cardBgHex}" stroke="${theme.cardBorderHex}" stroke-width="2.5"/>
  ${spec.variant === 'bs-card-header' ? `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="6" rx="3" fill="url(#accentBar)"/>` : ''}

  ${variantBodySvg}
  ${footerContextSvg}

  <rect x="${cardX + padX}" y="${barY}" width="${barW}" height="7" rx="3.5" fill="${theme.cardBorderHex}" fill-opacity="0.55"/>
  <rect x="${cardX + padX}" y="${barY}" width="${barFillW}" height="7" rx="3.5" fill="url(#accentBar)"/>
</svg>`;
}
