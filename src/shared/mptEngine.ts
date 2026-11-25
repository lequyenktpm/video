import {
  FullAnswerRecapMode,
  LanguageCode,
  MediaTypeFilter,
  NeutralBgTheme,
  RenderJobConfig,
  ScriptRoleKind,
  ScriptStyle,
  Studio2411AnimationIn,
  Studio2411ComponentVariant,
  Studio2411SceneComponentOverride,
  SubtitleConfig,
  SubtitleCue,
  SubtitleEffect,
  VideoAspectRatio,
  VideoQuality,
  VideoTransitionMode,
  VisualMood,
  VoiceOptionId,
} from './types';

export interface NeutralBgThemeMeta {
  id: NeutralBgTheme;
  label: string;
  description: string;
  bgTopHex: string;
  bgBottomHex: string;
  gridHex: string;
  accentHex: string;
  isLight: boolean;
}

export const NEUTRAL_BG_THEMES: NeutralBgThemeMeta[] = [
  {
    id: 'slate_studio',
    label: 'Slate Trung Tính',
    description: 'Xám xanh đậm tối giản, chữ nổi bật',
    bgTopHex: '#1e293b',
    bgBottomHex: '#0f172a',
    gridHex: '#334155',
    accentHex: '#38bdf8',
    isLight: false,
  },
  {
    id: 'charcoal_pro',
    label: 'Xám Than Studio',
    description: 'Nền than trung tính sang trọng',
    bgTopHex: '#27272a',
    bgBottomHex: '#18181b',
    gridHex: '#3f3f46',
    accentHex: '#facc15',
    isLight: false,
  },
  {
    id: 'soft_indigo',
    label: 'Xám Xanh Dịu',
    description: 'Tông chàm xám dịu mắt cho học ngoại ngữ',
    bgTopHex: '#2a3347',
    bgBottomHex: '#1b2232',
    gridHex: '#3e4c69',
    accentHex: '#2dd4bf',
    isLight: false,
  },
  {
    id: 'warm_paper',
    label: 'Giấy Kem Ấm',
    description: 'Nền giấy trung tính sáng dịu mắt',
    bgTopHex: '#f5f2eb',
    bgBottomHex: '#e7e1d4',
    gridHex: '#d5cdbd',
    accentHex: '#0d6efd',
    isLight: true,
  },
  {
    id: 'clean_grid',
    label: 'Lưới Sáng Học Tập',
    description: 'Nền trắng xám chuẩn thẻ học tập',
    bgTopHex: '#f8fafc',
    bgBottomHex: '#e2e8f0',
    gridHex: '#cbd5e1',
    accentHex: '#0d6efd',
    isLight: true,
  },
];

export function getNeutralBgThemeMeta(theme?: NeutralBgTheme): NeutralBgThemeMeta {
  return NEUTRAL_BG_THEMES.find((t) => t.id === theme) ?? NEUTRAL_BG_THEMES[0];
}

export async function safeParseJsonResponse<T>(
  res: Response,
  fallbackError = 'Phản hồi từ máy chủ không hợp lệ.'
): Promise<T> {
  const rawText = await res.text();
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error(fallbackError);
  }
  if (trimmed.startsWith('<')) {
    throw new Error(
      `Máy chủ đang khởi động lại hoặc phản hồi HTML (HTTP ${res.status}). Vui lòng thử lại sau vài giây.`
    );
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`${fallbackError} (HTTP ${res.status})`);
  }
}

export function hasCjkChars(text: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9faf\uff00-\uffef]/.test(text);
}

export function hasVietnameseDiacritics(text: string): boolean {
  return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/.test(
    text
  );
}

const LANGUAGE_PRESETS: Record<LanguageCode, string[]> = {
  vi: [
    'Bí ẩn đại dương sâu thẳm chưa từng được giải mã',
    'Khoa học đằng sau tách cà phê Espresso hoàn hảo',
    '3 thói quen nhỏ buổi sáng giúp tập trung làm việc hiệu quả',
    'Vì sao thời gian trôi nhanh hơn khi chúng ta trưởng thành?',
  ],
  en: [
    'Why Time Feels Faster As We Get Older',
    'The Hidden Physics Inside A Cup Of Espresso',
    '3 Deep Sea Creatures That Glow In Total Darkness',
    'How Ancient Roman Concrete Lasts Over 2,000 Years',
  ],
  ja: [
    'なぜ年齢を重ねると時間が早く感じるのか？',
    '深海で自ら光を放つ不思議な生き物たちの秘密',
    'コーヒー1杯に隠された驚きの科学と集中力',
    '宇宙で一番静かな場所と無重力の世界の真実',
  ],
  bilingual: [
    'Phản xạ 5s: "Hãy cẩn thận với cô ấy!" nói tiếng Anh sao?',
    'Giao tiếp công sở: Cách từ chối khéo bằng tiếng Anh tự nhiên',
    'Tại sao thời gian trôi nhanh hơn? — Why Time Feels Faster',
  ],
  vi_ja: [
    'Phản xạ tiếng Nhật 5s: "Hôm nay bạn vất vả rồi!" nói sao?',
    '3 câu giao tiếp tiếng Nhật quán ăn dùng mỗi ngày',
    'Cách nói "Đừng lo lắng quá nhé" cực tự nhiên trong tiếng Nhật',
  ],
  ja_en: [
    '【瞬間英作文】「彼女には気をつけて！」を英語で言えますか？',
    '【1分英語】「ちょっと待ってね」をネイティブ英語で言うと？',
    '【瞬間英作文】「無理しないでね」を自然な英語で表現しよう',
  ],
};

export function isBilingualLanguage(language: LanguageCode): boolean {
  return language === 'bilingual' || language === 'vi_ja' || language === 'ja_en';
}

export function getPresetsForLanguage(language: LanguageCode): string[] {
  return LANGUAGE_PRESETS[language] ?? LANGUAGE_PRESETS.vi;
}

export function isKnownPresetSubject(subject: string): boolean {
  const clean = subject.trim();
  if (!clean) return true;
  return Object.values(LANGUAGE_PRESETS).some((list) => list.includes(clean));
}

export function getDefaultVoiceForLanguage(language: LanguageCode): VoiceOptionId {
  if (language === 'ja' || language === 'ja_en') return 'ja-JP-NanamiNeural';
  if (language === 'en') return 'en-US-JennyNeural';
  return 'vi-VN-HoaiMyNeural';
}

export function getDefaultSecondaryVoiceForLanguage(language: LanguageCode): VoiceOptionId {
  if (language === 'bilingual') return 'en-US-JennyNeural';
  if (language === 'vi_ja') return 'ja-JP-NanamiNeural';
  if (language === 'ja_en') return 'en-US-JennyNeural';
  if (language === 'en') return 'en-US-GuyNeural';
  if (language === 'ja') return 'ja-JP-KeitaNeural';
  return 'vi-VN-NamMinhNeural';
}

export function doesVoiceMatchLanguage(voiceId: VoiceOptionId, language: LanguageCode): boolean {
  if (isBilingualLanguage(language)) return true;
  if (language === 'ja') return voiceId.startsWith('ja-');
  if (language === 'en') return voiceId.startsWith('en-');
  return voiceId.startsWith('vi-');
}

export function getVoiceLanguagePrefix(voiceId: VoiceOptionId): 'vi' | 'en' | 'ja' {
  if (voiceId.startsWith('ja-')) return 'ja';
  if (voiceId.startsWith('en-')) return 'en';
  return 'vi';
}

export function detectLineLanguage(
  text: string,
  fallbackLang: 'vi' | 'en' | 'ja' = 'vi'
): 'vi' | 'en' | 'ja' {
  const clean = text.trim();
  if (!clean) return fallbackLang;
  if (hasCjkChars(clean)) return 'ja';
  if (hasVietnameseDiacritics(clean)) return 'vi';
  if (/[a-zA-Z]{2,}/.test(clean)) {
    // Check common unaccented Vietnamese words only when fallback is vi and no clear English words
    if (fallbackLang === 'en') return 'en';
    const likelyEnglish = /\b(the|is|are|was|were|you|your|she|he|her|him|they|we|this|that|with|for|watch|out|don't|do|how|what|why|when|can|could|would|please|thank|sorry)\b/i.test(
      clean
    );
    if (likelyEnglish || fallbackLang !== 'vi') return 'en';
  }
  return fallbackLang;
}

export function stripNarrationTags(line: string): string {
  return line
    .replace(/^\s*\[(?:V1|V2|1|2|A|B|Q|VI|EN|JA|ANSWER|QUESTION|TITLE|SUBTITLE|INTRO|OUTRO)\]\s*/i, '')
    .replace(
      /^\s*(?:Tiêu\s*đề\s*nhỏ|Tiêu\s*đề|Mở\s*đầu|Kết\s*thúc|Subheading|Subtitle|Heading|Title|Intro|Outro|Q|A|Question|Answer|Câu\s*hỏi|Trả\s*lời|Speaker\s*[12]|Người\s*[12]|English|Japanese|Vietnamese|Tiếng\s*Anh|Tiếng\s*Nhật|Tiếng\s*Việt)\s*[:：]\s*/i,
      ''
    )
    .replace(/\s*\[PAUSE(?::\d+(?:\.\d+)?)?\]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isTitleOrIntroTag(line: string): boolean {
  return /^\s*(?:\[(?:TITLE|SUBTITLE|INTRO)\]|(?:Tiêu\s*đề\s*nhỏ|Tiêu\s*đề|Subheading|Subtitle|Heading|Title|Intro|Mở\s*đầu)\s*[:：])/i.test(
    line
  );
}

export function isOutroTag(line: string): boolean {
  return /^\s*(?:\[OUTRO\]|(?:Outro|Kết\s*thúc)\s*[:：])/i.test(line);
}

export type PresentationIconKey =
  | 'megaphone'
  | 'bell'
  | 'chat_quote'
  | 'hand_raise'
  | 'card_text'
  | 'alert_triangle'
  | 'clock'
  | 'waves'
  | 'coffee'
  | 'briefcase'
  | 'sparkles'
  | 'heart'
  | 'lightbulb'
  | 'globe'
  | 'bar_chart'
  | 'message_dots';

export type PresentationRoleTone = 'indigo' | 'emerald' | 'sky' | 'slate' | 'amber';

export interface ScriptLinePresentation {
  cleanText: string;
  detectedLang: 'vi' | 'en' | 'ja';
  roleKind: ScriptRoleKind;
  roleLabel: string;
  roleIconKey: PresentationIconKey;
  roleTone: PresentationRoleTone;
  contextIconKey: PresentationIconKey;
  contextLabel: string;
  hasPause: boolean;
  pauseSec?: number;
}

export function resolvePresentationLang(
  cleanText: string,
  options?: {
    language?: LanguageCode;
    isSecondarySlot?: boolean;
  }
): 'vi' | 'en' | 'ja' {
  const trimmed = cleanText.trim();
  if (hasCjkChars(trimmed)) return 'ja';
  if (hasVietnameseDiacritics(trimmed)) return 'vi';

  const langOpt = options?.language;
  if (langOpt === 'en') return 'en';
  if (langOpt === 'ja') return 'ja';
  if (langOpt === 'ja_en') {
    return detectLineLanguage(trimmed, options?.isSecondarySlot ? 'en' : 'ja');
  }
  if (langOpt === 'bilingual') {
    return detectLineLanguage(trimmed, options?.isSecondarySlot ? 'en' : 'vi');
  }
  if (langOpt === 'vi_ja') {
    return detectLineLanguage(trimmed, options?.isSecondarySlot ? 'ja' : 'vi');
  }
  return detectLineLanguage(trimmed, hasVietnameseDiacritics(trimmed) ? 'vi' : 'en');
}

const CONTEXT_LABELS_BY_LANG: Record<
  PresentationIconKey,
  { vi: string; en: string; ja: string }
> = {
  alert_triangle: { vi: 'Lưu ý', en: 'Caution', ja: '注意' },
  clock: { vi: 'Thời gian', en: 'Timing', ja: '時間' },
  waves: { vi: 'Đại dương', en: 'Ocean', ja: '海・自然' },
  coffee: { vi: 'Ẩm thực', en: 'Cafe & Food', ja: 'カフェ' },
  briefcase: { vi: 'Công việc', en: 'Career', ja: '仕事・面接' },
  sparkles: { vi: 'Khám phá', en: 'Discovery', ja: '発見' },
  heart: { vi: 'Cảm xúc', en: 'Mindset', ja: '気持ち' },
  lightbulb: { vi: 'Mẹo & Học', en: 'Key Tip', ja: '学習ポイント' },
  globe: { vi: 'Thế giới', en: 'World', ja: '世界' },
  bar_chart: { vi: 'Số liệu', en: 'Key Stat', ja: 'データ' },
  message_dots: { vi: 'Chi tiết', en: 'Context', ja: '詳細' },
  megaphone: { vi: 'Mở đầu', en: 'Intro', ja: '導入' },
  bell: { vi: 'Kết thúc', en: 'Closing', ja: 'まとめ' },
  chat_quote: { vi: 'Đáp án', en: 'Answer', ja: '解答' },
  hand_raise: { vi: 'Câu hỏi', en: 'Question', ja: '質問' },
  card_text: { vi: 'Nội dung', en: 'Insight', ja: 'ポイント' },
};

const ROLE_LABELS_BY_LANG: Record<
  ScriptRoleKind,
  { vi: string; en: string; ja: string }
> = {
  title: { vi: 'Mở đầu', en: 'Intro', ja: '導入' },
  outro: { vi: 'Kết bài', en: 'Closing', ja: 'まとめ' },
  question: { vi: 'Người hỏi', en: 'Question', ja: '質問' },
  answer: { vi: 'Người trả lời', en: 'Answer', ja: '解答' },
  narration: { vi: 'Nội dung', en: 'Insight', ja: 'ポイント' },
};

export function getLocalizedRoleLabel(
  roleKind: ScriptRoleKind,
  lang: 'vi' | 'en' | 'ja' = 'vi'
): string {
  return ROLE_LABELS_BY_LANG[roleKind][lang] ?? ROLE_LABELS_BY_LANG[roleKind].vi;
}

export function detectLineContextVisual(
  cleanText: string,
  lang?: 'vi' | 'en' | 'ja'
): {
  contextIconKey: PresentationIconKey;
  contextLabel: string;
} {
  const resolvedLang =
    lang ?? detectLineLanguage(cleanText, hasVietnameseDiacritics(cleanText) ? 'vi' : 'en');
  const t = cleanText.toLowerCase();
  let key: PresentationIconKey = 'message_dots';

  if (/(cẩn thận|chú ý|nguy hiểm|đừng quá|cấm|rủi ro|watch out|careful|warning|気をつけて|注意)/i.test(t)) {
    key = 'alert_triangle';
  } else if (/(giây|phút|thời gian|đồng hồ|trôi|nhanh|chậm|second|minute|time|rush|1分|5秒|時間)/i.test(t)) {
    key = 'clock';
  } else if (/(đại dương|biển|sóng|san hô|sứa|mariana|nước|lặn|ocean|sea|water|coral|jellyfish|深海|海)/i.test(t)) {
    key = 'waves';
  } else if (/(cà phê|espresso|latte|quán ăn|nấu|món ăn|ẩm thực|coffee|cafe|food|latte|コーヒー|カフェ|料理)/i.test(t)) {
    key = 'coffee';
  } else if (/(phỏng vấn|công sở|công việc|làm việc|hồ sơ|khách hàng|đồng nghiệp|tuyển dụng|tập trung|interview|office|work|job|business|desk|colleague|proactive|strength|weakness|面接|仕事|会社|長所|短所)/i.test(t)) {
    key = 'briefcase';
  } else if (/(vũ trụ|hành tinh|ánh sáng|phát sáng|khoa học|công nghệ|robot|áp suất|science|physics|space|glow|light|technology|宇宙|光|科学)/i.test(t)) {
    key = 'sparkles';
  } else if (/(nghỉ ngơi|đừng lo|sức khỏe|bình tĩnh|vui|hạnh phúc|cảm ơn|cố lên|take it easy|push yourself|relax|worry|thank|appreciate|happy|無理|ありがとう|心配|頑張)/i.test(t)) {
    key = 'heart';
  } else if (/(học|luyện|nhớ|mẹo|bí quyết|lặp lại|tiếng anh|tiếng nhật|practice|learn|speak|habit|study|translate|英語|練習|瞬間英作文)/i.test(t)) {
    key = 'lightbulb';
  } else if (/(núi|rừng|thành phố|nhật bản|máy bay|du lịch|mountain|forest|city|japan|flight|tokyo|山|自然)/i.test(t)) {
    key = 'globe';
  } else if (/(\d+%|top\s*\d|số\s*[123]|nghìn|triệu|tỷ|第[123]位)/i.test(t)) {
    key = 'bar_chart';
  }

  return {
    contextIconKey: key,
    contextLabel: CONTEXT_LABELS_BY_LANG[key][resolvedLang],
  };
}

export function analyzeScriptLinePresentation(
  rawLine: string,
  options: {
    isSecondarySlot?: boolean;
    isIntroOrOutro?: boolean;
    scriptStyle?: ScriptStyle;
    language?: LanguageCode;
  } = {}
): ScriptLinePresentation {
  const pauseMatch = rawLine.match(/\[PAUSE(?::(\d+(?:\.\d+)?))?\]/i);
  const hasPause = Boolean(pauseMatch);
  const pauseSec = pauseMatch?.[1] ? parseFloat(pauseMatch[1]) : undefined;
  const cleanText = stripNarrationTags(rawLine);
  const detectedLang = resolvePresentationLang(cleanText, {
    language: options.language,
    isSecondarySlot: options.isSecondarySlot,
  });
  const ctx = detectLineContextVisual(cleanText, detectedLang);

  const isExplicitTitle = isTitleOrIntroTag(rawLine) || isLikelyIntroPhrase(cleanText);
  const isExplicitOutro = isOutroTag(rawLine) || isOutroCtaLine(cleanText);
  const isExplicitQuestion =
    /^\s*(?:\[(?:Q|V1|1)\]|(?:Q|Question|Câu\s*hỏi|Hỏi|Speaker\s*1|Người\s*1)\s*[:：])/i.test(
      rawLine
    );
  const isExplicitAnswer =
    /^\s*(?:\[(?:A|B|V2|2|EN|JA)\]|(?:A|Answer|Trả\s*lời|Đáp\s*án|Speaker\s*2|Người\s*2|English|Japanese|Tiếng\s*Anh|Tiếng\s*Nhật)\s*[:：])/i.test(
      rawLine
    );

  let roleKind: ScriptRoleKind = 'narration';
  let roleIconKey: PresentationIconKey = 'card_text';
  let roleTone: PresentationRoleTone = 'slate';

  if (isExplicitTitle || (options.isIntroOrOutro && !isExplicitOutro)) {
    roleKind = 'title';
    roleIconKey = 'megaphone';
    roleTone = 'sky';
  } else if (isExplicitOutro) {
    roleKind = 'outro';
    roleIconKey = 'bell';
    roleTone = 'slate';
  } else if (isExplicitAnswer || options.isSecondarySlot) {
    roleKind = 'answer';
    roleIconKey = 'chat_quote';
    roleTone = 'emerald';
  } else if (
    isExplicitQuestion ||
    hasPause ||
    ((options.scriptStyle === 'language_challenge' ||
      options.scriptStyle === 'quiz_riddle' ||
      options.scriptStyle === 'bilingual_dialogue') &&
      /[?？]/.test(cleanText))
  ) {
    roleKind = 'question';
    roleIconKey = 'hand_raise';
    roleTone = 'indigo';
  }

  return {
    cleanText,
    detectedLang,
    roleKind,
    roleLabel: ROLE_LABELS_BY_LANG[roleKind].vi,
    roleIconKey,
    roleTone,
    contextIconKey: ctx.contextIconKey,
    contextLabel: ctx.contextLabel,
    hasPause,
    pauseSec,
  };
}

export interface PlannedNarrationSegment {
  text: string;
  voiceId: VoiceOptionId;
  voiceSlot: 'primary' | 'secondary';
  detectedLang: 'vi' | 'en' | 'ja';
  pauseAfterSec: number;
  pauseKind?: 'thinking' | 'repeat' | 'recap';
  segmentKind?: 'speech' | 'recap' | 'summary';
  isIntroOrOutro?: boolean;
  roleKind?: ScriptRoleKind;
  roleLabel?: string;
  contextLabel?: string;
  cueGroupId?: string;
  cueGroupFullText?: string;
}

export interface MixedLanguageRun {
  text: string;
  lang: 'vi' | 'en' | 'ja';
  voiceId: VoiceOptionId;
  voiceSlot: 'primary' | 'secondary';
}

function getFallbackVoiceForLangCode(
  lang: 'vi' | 'en' | 'ja',
  primary: VoiceOptionId,
  secondary: VoiceOptionId
): { voiceId: VoiceOptionId; slot: 'primary' | 'secondary' } {
  if (getVoiceLanguagePrefix(primary) === lang) return { voiceId: primary, slot: 'primary' };
  if (getVoiceLanguagePrefix(secondary) === lang) return { voiceId: secondary, slot: 'secondary' };
  if (lang === 'ja') return { voiceId: 'ja-JP-NanamiNeural', slot: 'secondary' };
  if (lang === 'en') return { voiceId: 'en-US-JennyNeural', slot: 'secondary' };
  return { voiceId: 'vi-VN-HoaiMyNeural', slot: 'primary' };
}

/**
 * Splits a single line containing mixed languages (e.g. Japanese + English,
 * Vietnamese + English, or Vietnamese + Japanese) into ordered spoken runs
 * so free TTS speaks each language run with its matching native voice.
 */
export function splitMixedLanguageRuns(
  cleanText: string,
  options: {
    primaryLang: 'vi' | 'en' | 'ja';
    secondaryLang: 'vi' | 'en' | 'ja';
    primaryVoice: VoiceOptionId;
    secondaryVoice: VoiceOptionId;
    defaultSlot?: 'primary' | 'secondary';
    defaultLang?: 'vi' | 'en' | 'ja';
  }
): MixedLanguageRun[] {
  const trimmed = cleanText.trim();
  if (!trimmed) return [];

  const {
    primaryLang,
    secondaryLang,
    primaryVoice,
    secondaryVoice,
    defaultSlot = 'primary',
    defaultLang = primaryLang,
  } = options;

  // Tokenize CJK runs vs quoted phrases vs clause boundaries
  const cjkSpanRegex =
    /([\u3040-\u30ff\u4e00-\u9faf\u3005-\u3007ー〜・]+(?:[\s、。！？「」『』（）0-9]*[\u3040-\u30ff\u4e00-\u9faf\u3005-\u3007ー〜・]+)*[、。！？「」『』（）]*)/g;

  const coarseChunks = trimmed.split(cjkSpanRegex).filter((s) => s.length > 0);
  const finePieces: string[] = [];
  for (const part of coarseChunks) {
    if (hasCjkChars(part)) {
      finePieces.push(part);
    } else {
      // Split non-CJK span across quoted blocks or sentence-ending punctuation
      const sub = part.split(/([「『"“][^"”」』]+[」』"”]|(?<=[.!?])\s+)/).filter((s) => s.length > 0);
      finePieces.push(...sub);
    }
  }

  const classified: Array<{ text: string; lang: 'vi' | 'en' | 'ja'; hasLetters: boolean }> = [];
  for (const rawPiece of finePieces) {
    const piece = rawPiece.trim();
    if (!piece) continue;
    const hasCjk = hasCjkChars(piece);
    const hasVi = hasVietnameseDiacritics(piece);
    const hasAsciiWord = /[a-zA-Z]{2,}/.test(piece);
    const hasAnyLetters = hasCjk || hasVi || /[a-zA-ZÀ-ỹ]/.test(piece);

    if (!hasAnyLetters) {
      // Attach trailing standalone punctuation to the previous token if present
      if (classified.length > 0) {
        classified[classified.length - 1].text = `${classified[classified.length - 1].text}${
          rawPiece.startsWith(' ') ? ' ' : ''
        }${piece}`;
      }
      continue;
    }

    let pieceLang: 'vi' | 'en' | 'ja' = defaultLang;
    const isShortUppercaseAcronym = /^[A-Z0-9]{1,4}$/.test(piece);
    if (hasCjk) {
      pieceLang = 'ja';
    } else if (hasVi) {
      pieceLang = 'vi';
    } else if (hasAsciiWord) {
      if (isShortUppercaseAcronym && (defaultLang === 'ja' || defaultLang === 'vi')) {
        pieceLang = defaultLang;
      } else if (primaryLang === 'en' || secondaryLang === 'en') {
        pieceLang = 'en';
      } else {
        pieceLang = detectLineLanguage(piece, defaultLang === 'ja' ? 'en' : defaultLang);
      }
    }

    const prev = classified[classified.length - 1];
    if (prev && prev.lang === pieceLang) {
      const joiner = pieceLang === 'ja' ? '' : ' ';
      prev.text = `${prev.text}${joiner}${piece}`.trim();
    } else {
      classified.push({ text: piece, lang: pieceLang, hasLetters: true });
    }
  }

  if (classified.length <= 1) {
    const solo = classified[0];
    const soloLang = solo?.lang ?? defaultLang;
    const mapped =
      soloLang === defaultLang
        ? { voiceId: defaultSlot === 'secondary' ? secondaryVoice : primaryVoice, slot: defaultSlot }
        : getFallbackVoiceForLangCode(soloLang, primaryVoice, secondaryVoice);
    return [
      {
        text: trimmed,
        lang: soloLang,
        voiceId: mapped.voiceId,
        voiceSlot: mapped.slot,
      },
    ];
  }

  return classified.map((item) => {
    const mapped = getFallbackVoiceForLangCode(item.lang, primaryVoice, secondaryVoice);
    return {
      text: item.text,
      lang: item.lang,
      voiceId: mapped.voiceId,
      voiceSlot: mapped.slot,
    };
  });
}

function isOutroCtaLine(cleanText: string): boolean {
  return /theo dõi|đăng ký|lưu video|bình luận|chia sẻ|hẹn gặp lại|tạm biệt|cảm ơn.*xem|chúc bạn.*(?:thành công|may mắn|tốt lành)|follow|subscribe|save this|comment|see you|thanks for watching|thank you|good job|great job|well done|keep practicing|until next time|that's all for today|goodbye|bye for now|cảm ơn bạn|cảm ơn mọi người|保存|フォロー|コメント|チャンネル登録|お疲れ様|また次回|またね|ありがとうございました|ありがとうございます|今回はここまで|応援してい/i.test(
    cleanText
  );
}

function isLikelyIntroPhrase(cleanText: string): boolean {
  return /1[-\s]?minute\s+instant\s+translation|instant\s+translation\s+challenge|bây\s+giờ.*(?:đọc|nghe)|5\s*giây\s*để\s*dịch|now\s+i\s+(?:will|'ll)\s+read|you\s+have\s+\d+\s*seconds?\s+to\s+translate|今から(?:日本語|問題)を読み上げ|5秒以内|chào mừng|sẵn sàng|thử thách|welcome to|are you ready|speaking challenge|today we(?:'ll| will) practice|hôm nay chúng ta|クイズ|チャレンジ|スタート|瞬間英作文|自己PRする方法/i.test(
    cleanText
  );
}

export function buildVideoEndingSummary(params: {
  subject?: string;
  language: LanguageCode;
  scriptStyle: ScriptStyle;
  primaryLang: 'vi' | 'en' | 'ja';
  questions: string[];
  targetHighlights: string[];
  sourceHighlights: string[];
}): { text: string; voiceLang: 'vi' | 'en' | 'ja' } | null {
  const { subject = '', language, scriptStyle, primaryLang, questions, targetHighlights, sourceHighlights } =
    params;

  const isQaOrLearning =
    isBilingualLanguage(language) ||
    scriptStyle === 'language_challenge' ||
    scriptStyle === 'bilingual_dialogue' ||
    scriptStyle === 'quiz_riddle' ||
    questions.length > 0 ||
    targetHighlights.length > 0;

  const cleanSubject = subject.replace(/[?!。？！]+$/g, '').trim();

  if (isQaOrLearning) {
    const firstKey = (targetHighlights[0] ?? '').replace(/[.!?。！？]+$/g, '').trim();
    const count = Math.max(1, targetHighlights.length || sourceHighlights.length);

    if (primaryLang === 'ja' || language === 'ja_en') {
      const keyPart = firstKey ? `「${firstKey.slice(0, 34)}」など` : '';
      return {
        voiceLang: 'ja',
        text: `今日のまとめ：${keyPart}${count}つの重要表現を復習しましょう！`,
      };
    }
    if (primaryLang === 'en' && !isBilingualLanguage(language)) {
      const keyPart = firstKey ? `like "${firstKey.slice(0, 38)}"` : `on ${cleanSubject.slice(0, 36) || 'today'}`;
      return {
        voiceLang: 'en',
        text: `Quick recap: ${count} key phrases ${keyPart}.`,
      };
    }
    const keyPart = firstKey ? `như "${firstKey.slice(0, 38)}"` : cleanSubject.slice(0, 38);
    return {
      voiceLang: 'vi',
      text: `Tóm tắt nhanh: ${count} mẫu câu trọng tâm (${keyPart}).`,
    };
  }

  // Concise 1-sentence knowledge summary for longer videos
  const middleFacts = sourceHighlights.filter((s) => !isOutroCtaLine(s));
  const coreFact = (middleFacts[1] ?? middleFacts[0] ?? '').replace(/[.!?。！？]+$/g, '').trim();
  if (!coreFact && !cleanSubject) return null;

  if (primaryLang === 'ja') {
    const topicLabel = (cleanSubject || '今日のテーマ').slice(0, 26);
    return {
      voiceLang: 'ja',
      text: coreFact
        ? `まとめ：${topicLabel}の要点は「${coreFact.slice(0, 44)}」。`
        : `まとめ：${topicLabel}のポイントを振り返りました。`,
    };
  }
  if (primaryLang === 'en') {
    const topicLabel = (cleanSubject || 'this topic').slice(0, 32);
    return {
      voiceLang: 'en',
      text: coreFact
        ? `Key takeaway: ${coreFact.slice(0, 68)}.`
        : `Key takeaway: remember the main point on ${topicLabel}.`,
    };
  }
  const topicLabel = (cleanSubject || 'chủ đề hôm nay').slice(0, 36);
  return {
    voiceLang: 'vi',
    text: coreFact
      ? `Tóm tắt kiến thức hôm nay: ${coreFact.slice(0, 70)}.`
      : `Tóm tắt kiến thức hôm nay: điểm cốt lõi về ${topicLabel}.`,
  };
}

export function planNarrationSegments(
  config: Pick<
    RenderJobConfig,
    | 'script'
    | 'language'
    | 'scriptStyle'
    | 'voiceId'
    | 'dualVoiceEnabled'
    | 'secondaryVoiceId'
    | 'pauseBetweenLinesSec'
  > &
    Partial<
      Pick<
        RenderJobConfig,
        | 'subject'
        | 'targetRepeatCount'
        | 'targetRepeatPauseSec'
        | 'fullAnswerRecapMode'
        | 'summarizeAtEnd'
      >
    >
): PlannedNarrationSegment[] {
  const rawLines = config.script
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return [];

  const hasExplicitQaSyntax = rawLines.some((l) =>
    /^\s*(?:Tiêu\s*đề\s*nhỏ|Tiêu\s*đề|Title|Subtitle|Q|Question|Câu\s*hỏi|Answer|Trả\s*lời|English|Japanese|Vietnamese|Tiếng\s*Anh|Tiếng\s*Nhật|Tiếng\s*Việt)\s*[:：]/i.test(
      l
    )
  );

  let primaryVoice = config.voiceId;
  let secondaryVoice =
    config.secondaryVoiceId ?? getDefaultSecondaryVoiceForLanguage(config.language);

  // Auto-align voices when user pastes a JA+EN Q&A script on any bilingual tab
  if (hasExplicitQaSyntax) {
    const hasJaLine = rawLines.some((l) => hasCjkChars(stripNarrationTags(l)));
    const hasEnTarget = rawLines.some((l) => /^\s*(?:English|Tiếng\s*Anh)\s*[:：]/i.test(l));
    const hasViLine = rawLines.some(
      (l) => !isTitleOrIntroTag(l) && hasVietnameseDiacritics(stripNarrationTags(l))
    );
    if (hasJaLine && hasEnTarget && !hasViLine) {
      if (!primaryVoice.startsWith('ja-')) primaryVoice = 'ja-JP-NanamiNeural';
      if (!secondaryVoice.startsWith('en-')) secondaryVoice = 'en-US-JennyNeural';
    }
  }

  const primaryLang = getVoiceLanguagePrefix(primaryVoice);
  const secondaryLang = getVoiceLanguagePrefix(secondaryVoice);
  const dualEnabled =
    Boolean(config.dualVoiceEnabled) || isBilingualLanguage(config.language) || hasExplicitQaSyntax;
  const basePause = Math.max(0, Math.min(10, Number(config.pauseBetweenLinesSec ?? 0)));
  const isChallengeMode =
    config.scriptStyle === 'language_challenge' || config.scriptStyle === 'quiz_riddle';

  const targetRepeatCount = Math.max(0, Math.min(2, Math.round(config.targetRepeatCount ?? 0)));
  const targetRepeatPauseSec = Math.max(
    0.5,
    Math.min(5, Number(config.targetRepeatPauseSec ?? 2.0))
  );
  const fullAnswerRecapMode: FullAnswerRecapMode = config.fullAnswerRecapMode ?? 'off';
  const summarizeAtEnd = Boolean(config.summarizeAtEnd);

  const segments: PlannedNarrationSegment[] = [];
  const collectedQuestions: string[] = [];
  const collectedTargetHighlights: string[] = [];
  const collectedSourceHighlights: string[] = [];

  let inAnswerBlock = false;
  let answerSourceSentences: string[] = [];
  let answerTargetSentences: string[] = [];

  const flushAnswerRecap = () => {
    if (fullAnswerRecapMode === 'off') {
      answerSourceSentences = [];
      answerTargetSentences = [];
      return;
    }
    const hasMultiTarget = answerTargetSentences.length >= 2;
    const hasMultiSource = answerSourceSentences.length >= 2;
    if (!hasMultiTarget && !(fullAnswerRecapMode === 'both_full' && hasMultiSource)) {
      answerSourceSentences = [];
      answerTargetSentences = [];
      return;
    }

    if (segments.length > 0) {
      segments[segments.length - 1].pauseAfterSec = Math.max(
        segments[segments.length - 1].pauseAfterSec,
        0.9
      );
      if (!segments[segments.length - 1].pauseKind) {
        segments[segments.length - 1].pauseKind = 'recap';
      }
    }

    if (fullAnswerRecapMode === 'both_full' && hasMultiSource) {
      const joinedSource = answerSourceSentences.join(primaryLang === 'ja' ? '' : ' ');
      const srcChunks = splitScriptSentences(joinedSource, 165);
      srcChunks.forEach((chunk, ci) => {
        segments.push({
          text: chunk,
          voiceId: primaryVoice,
          voiceSlot: 'primary',
          detectedLang: primaryLang,
          pauseAfterSec: ci === srcChunks.length - 1 ? 0.6 : 0,
          pauseKind: ci === srcChunks.length - 1 ? 'recap' : undefined,
          segmentKind: 'recap',
        });
      });
    }

    if (hasMultiTarget) {
      const bridgeText =
        primaryLang === 'ja'
          ? '回答全体を通して聞いてみましょう。'
          : primaryLang === 'en'
          ? 'Now listen to the full answer together.'
          : 'Nghe lại toàn bộ câu trả lời liền mạch nhé!';
      segments.push({
        text: bridgeText,
        voiceId: primaryVoice,
        voiceSlot: 'primary',
        detectedLang: primaryLang,
        pauseAfterSec: 0.4,
        pauseKind: 'recap',
        segmentKind: 'recap',
      });

      const joinedTarget = answerTargetSentences.join(secondaryLang === 'ja' ? '' : ' ');
      const targetChunks = splitScriptSentences(joinedTarget, 165);
      targetChunks.forEach((chunk, ci) => {
        segments.push({
          text: chunk,
          voiceId: secondaryVoice,
          voiceSlot: 'secondary',
          detectedLang: secondaryLang,
          pauseAfterSec: ci === targetChunks.length - 1 ? 0.8 : 0,
          pauseKind: ci === targetChunks.length - 1 ? 'recap' : undefined,
          segmentKind: 'recap',
        });
      });
    }

    answerSourceSentences = [];
    answerTargetSentences = [];
  };

  const pendingOutroLines: string[] = [];
  const mainLines = [...rawLines];
  if (summarizeAtEnd && mainLines.length >= 2) {
    while (
      pendingOutroLines.length < 2 &&
      mainLines.length >= 2 &&
      (isOutroTag(mainLines[mainLines.length - 1]) ||
        isOutroCtaLine(stripNarrationTags(mainLines[mainLines.length - 1])))
    ) {
      pendingOutroLines.unshift(mainLines.pop()!);
    }
  }

  let inTitleOrIntroPair = false;
  let lastLineWasIntro = false;
  const seenIntroOutroTexts = new Set<string>();

  const classifyLineSlot = (
    rawLine: string,
    lineIdx: number
  ): {
    slot: 'primary' | 'secondary';
    lang: 'vi' | 'en' | 'ja';
    voiceId: VoiceOptionId;
    explicitLangTag: 'vi' | 'en' | 'ja' | null;
  } => {
    let explicitSlot: 'primary' | 'secondary' | null = null;
    let explicitLangTag: 'vi' | 'en' | 'ja' | null = null;

    if (
      /^\s*\[(?:V1|1|A)\]/i.test(rawLine) ||
      (!hasExplicitQaSyntax && /^\s*(?:A|Speaker\s*1|Người\s*1)\s*[:：]/i.test(rawLine)) ||
      (hasExplicitQaSyntax &&
        primaryLang === secondaryLang &&
        /^\s*(?:Q|Question|Câu\s*hỏi)\s*[:：]/i.test(rawLine))
    ) {
      explicitSlot = 'primary';
    } else if (
      /^\s*\[(?:V2|2|B)\]/i.test(rawLine) ||
      /^\s*(?:B|Speaker\s*2|Người\s*2)\s*[:：]/i.test(rawLine) ||
      (hasExplicitQaSyntax &&
        primaryLang === secondaryLang &&
        /^\s*(?:A|Answer|Trả\s*lời)\s*[:：]/i.test(rawLine))
    ) {
      explicitSlot = 'secondary';
    } else if (/^\s*\[VI\]/i.test(rawLine) || /^\s*(?:Vietnamese|Tiếng\s*Việt)\s*[:：]/i.test(rawLine)) {
      explicitLangTag = 'vi';
    } else if (/^\s*\[EN\]/i.test(rawLine) || /^\s*(?:English|Tiếng\s*Anh)\s*[:：]/i.test(rawLine)) {
      explicitLangTag = 'en';
    } else if (/^\s*\[JA\]/i.test(rawLine) || /^\s*(?:Japanese|Tiếng\s*Nhật)\s*[:：]/i.test(rawLine)) {
      explicitLangTag = 'ja';
    }

    const cleanText = stripNarrationTags(rawLine);
    let chosenVoice = primaryVoice;
    let chosenSlot: 'primary' | 'secondary' = 'primary';
    let detectedLang = detectLineLanguage(cleanText, primaryLang);

    if (explicitSlot === 'primary') {
      chosenVoice = primaryVoice;
      chosenSlot = 'primary';
    } else if (explicitSlot === 'secondary') {
      chosenVoice = secondaryVoice;
      chosenSlot = 'secondary';
    } else if (explicitLangTag) {
      detectedLang = explicitLangTag;
      const mapped = getFallbackVoiceForLangCode(explicitLangTag, primaryVoice, secondaryVoice);
      chosenVoice = mapped.voiceId;
      chosenSlot = mapped.slot;
    } else if (dualEnabled) {
      if (detectedLang !== primaryLang) {
        if (detectedLang === secondaryLang) {
          chosenVoice = secondaryVoice;
          chosenSlot = 'secondary';
        } else {
          const mapped = getFallbackVoiceForLangCode(detectedLang, primaryVoice, secondaryVoice);
          chosenVoice = mapped.voiceId;
          chosenSlot = mapped.slot;
        }
      } else if (
        primaryLang === secondaryLang &&
        (config.scriptStyle === 'bilingual_dialogue' ||
          config.scriptStyle === 'quiz_riddle' ||
          config.scriptStyle === 'language_challenge') &&
        lineIdx % 2 === 1
      ) {
        chosenVoice = secondaryVoice;
        chosenSlot = 'secondary';
      }
    }

    return { slot: chosenSlot, lang: detectedLang, voiceId: chosenVoice, explicitLangTag };
  };

  const processLine = (
    rawLine: string,
    lineIdx: number,
    totalCount: number,
    linesList: string[],
    batchKey = 'main'
  ) => {
    const pauseMatch = rawLine.match(/\[PAUSE(?::(\d+(?:\.\d+)?))?\]/i);
    const explicitPauseSec = pauseMatch
      ? pauseMatch[1]
        ? Math.max(0.5, Math.min(10, parseFloat(pauseMatch[1])))
        : Math.max(1.0, basePause || 5.0)
      : 0;

    const isTitleHeader = isTitleOrIntroTag(rawLine);
    const isExplicitOutro = isOutroTag(rawLine);
    const isQuestionHeader = /^\s*(?:Q|Question|Câu\s*hỏi)\s*[:：]/i.test(rawLine);
    const isAnswerHeader =
      hasExplicitQaSyntax && /^\s*(?:A|Answer|Trả\s*lời)\s*[:：]/i.test(rawLine);

    if (isTitleHeader) {
      flushAnswerRecap();
      inAnswerBlock = false;
      inTitleOrIntroPair = true;
    } else if (isQuestionHeader) {
      flushAnswerRecap();
      inAnswerBlock = false;
      inTitleOrIntroPair = false;
    } else if (isAnswerHeader) {
      flushAnswerRecap();
      inAnswerBlock = true;
      inTitleOrIntroPair = false;
    }

    const cleanText = stripNarrationTags(rawLine);
    if (!cleanText) {
      if (segments.length > 0 && explicitPauseSec > 0) {
        segments[segments.length - 1].pauseAfterSec = Math.max(
          segments[segments.length - 1].pauseAfterSec,
          explicitPauseSec
        );
        segments[segments.length - 1].pauseKind = 'thinking';
      }
      return;
    }

    const { slot: chosenSlot, lang: detectedLang, voiceId: chosenVoice, explicitLangTag } =
      classifyLineSlot(rawLine, lineIdx);

    if (chosenSlot === 'primary' && !isTitleHeader) {
      inTitleOrIntroPair = false;
    }

    if (isQuestionHeader) {
      collectedQuestions.push(cleanText);
    }

    const looksLikeIntro =
      isTitleHeader ||
      ((lineIdx === 0 || (lineIdx === 1 && lastLineWasIntro)) &&
        totalCount >= 2 &&
        isLikelyIntroPhrase(cleanText));

    if (looksLikeIntro) {
      if (chosenSlot === 'primary') {
        inTitleOrIntroPair = true;
      }
      lastLineWasIntro = true;
    } else {
      lastLineWasIntro = false;
    }

    const isIntroPairTarget = inTitleOrIntroPair && chosenSlot === 'secondary';
    const isOutroLine =
      isExplicitOutro ||
      isOutroCtaLine(cleanText) ||
      (lineIdx >= totalCount - 1 &&
        totalCount >= 3 &&
        /see you|thank|good job|great job|well done|hẹn gặp lại|cảm ơn|お疲れ様|ありがとう/i.test(
          cleanText
        ));
    const isIntroOrOutro = looksLikeIntro || isIntroPairTarget || isOutroLine;

    // Guarantee Intro and Outro lines only read and display strictly once (even if duplicated in source text)
    if (isIntroOrOutro) {
      const normalizedKey = cleanText.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seenIntroOutroTexts.has(normalizedKey)) {
        if (chosenSlot === 'secondary') inTitleOrIntroPair = false;
        return;
      }
      seenIntroOutroTexts.add(normalizedKey);
    }

    if (chosenSlot === 'secondary') {
      if (!isIntroOrOutro) {
        collectedTargetHighlights.push(cleanText);
        if (inAnswerBlock) {
          answerTargetSentences.push(cleanText);
        }
      }
      inTitleOrIntroPair = false;
    } else if (!isIntroOrOutro) {
      collectedSourceHighlights.push(cleanText);
      if (inAnswerBlock) {
        answerSourceSentences.push(cleanText);
      }
    }

    const nextLineRaw = lineIdx + 1 < linesList.length ? linesList[lineIdx + 1] : null;
    const nextIsSecondary = nextLineRaw
      ? classifyLineSlot(nextLineRaw, lineIdx + 1).slot === 'secondary'
      : false;

    const isContentPromptBeforeTarget =
      chosenSlot === 'primary' &&
      !isIntroOrOutro &&
      lineIdx < totalCount - 1 &&
      (nextIsSecondary || (isChallengeMode && (/[?？]/.test(cleanText) || isQuestionHeader)));

    const isLastLine = lineIdx === totalCount - 1 && pendingOutroLines.length === 0 && !summarizeAtEnd;
    let finalPostLinePause = 0;
    let finalPauseKind: PlannedNarrationSegment['pauseKind'] = undefined;

    if (explicitPauseSec > 0 && !isIntroOrOutro) {
      finalPostLinePause = explicitPauseSec;
      finalPauseKind = 'thinking';
    } else if (!isLastLine) {
      if (isIntroOrOutro) {
        finalPostLinePause = nextIsSecondary ? 0.35 : 0.45;
      } else if (isChallengeMode || (dualEnabled && basePause >= 1.5)) {
        if (isContentPromptBeforeTarget && basePause > 0) {
          finalPostLinePause = basePause;
          finalPauseKind = 'thinking';
        } else if (basePause > 0) {
          finalPostLinePause = 0.55;
        }
      } else {
        finalPostLinePause = basePause;
        if (basePause >= 1.5 && isContentPromptBeforeTarget) finalPauseKind = 'thinking';
      }
    }

    const isTargetForRepeat =
      chosenSlot === 'secondary' &&
      !isIntroOrOutro &&
      targetRepeatCount > 0 &&
      (detectedLang !== primaryLang ||
        Boolean(explicitLangTag) ||
        isBilingualLanguage(config.language) ||
        config.scriptStyle === 'language_challenge');

    const linePres = analyzeScriptLinePresentation(rawLine, {
      isSecondarySlot: chosenSlot === 'secondary',
      isIntroOrOutro,
      scriptStyle: config.scriptStyle,
      language: config.language,
    });

    // Check if single line contains mixed scripts/languages (e.g. "お疲れ様でした！Thank you!" or "Cảm ơn! Watch out!")
    const mixedRuns = splitMixedLanguageRuns(cleanText, {
      primaryLang,
      secondaryLang,
      primaryVoice,
      secondaryVoice,
      defaultSlot: chosenSlot,
      defaultLang: detectedLang,
    });
    const isMixedSingleLine = mixedRuns.length >= 2;
    const totalReads = isTargetForRepeat ? 1 + targetRepeatCount : 1;

    for (let readPass = 0; readPass < totalReads; readPass++) {
      const isLastPass = readPass === totalReads - 1;
      if (isMixedSingleLine) {
        const groupId = `${batchKey}_${lineIdx}_p${readPass}`;
        mixedRuns.forEach((run, runIdx) => {
          const isLastRun = runIdx === mixedRuns.length - 1;
          let pauseAfter = 0;
          let pauseKind: PlannedNarrationSegment['pauseKind'] = undefined;
          if (isLastRun) {
            if (!isLastPass) {
              pauseAfter = targetRepeatPauseSec;
              pauseKind = 'repeat';
            } else {
              pauseAfter = finalPostLinePause;
              pauseKind = finalPauseKind;
            }
          }
          segments.push({
            text: run.text,
            voiceId: run.voiceId,
            voiceSlot: run.voiceSlot,
            detectedLang: run.lang,
            pauseAfterSec: pauseAfter,
            pauseKind,
            segmentKind: 'speech',
            roleKind: linePres.roleKind,
            roleLabel: linePres.roleLabel,
            contextLabel: linePres.contextLabel,
            cueGroupId: groupId,
            cueGroupFullText: cleanText,
            ...(isIntroOrOutro ? { isIntroOrOutro: true } : {}),
          });
        });
      } else {
        const subChunks = splitScriptSentences(cleanText, 165);
        subChunks.forEach((chunk, chunkIdx) => {
          const isLastChunk = chunkIdx === subChunks.length - 1;
          let pauseAfter = 0;
          let pauseKind: PlannedNarrationSegment['pauseKind'] = undefined;
          if (isLastChunk) {
            if (!isLastPass) {
              pauseAfter = targetRepeatPauseSec;
              pauseKind = 'repeat';
            } else {
              pauseAfter = finalPostLinePause;
              pauseKind = finalPauseKind;
            }
          }
          segments.push({
            text: chunk,
            voiceId: chosenVoice,
            voiceSlot: chosenSlot,
            detectedLang,
            pauseAfterSec: pauseAfter,
            pauseKind,
            segmentKind: 'speech',
            roleKind: linePres.roleKind,
            roleLabel: linePres.roleLabel,
            contextLabel: linePres.contextLabel,
            ...(isIntroOrOutro ? { isIntroOrOutro: true } : {}),
          });
        });
      }
    }
  };

  mainLines.forEach((line, idx) => processLine(line, idx, mainLines.length, mainLines, 'main'));
  flushAnswerRecap();

  if (summarizeAtEnd) {
    const summary = buildVideoEndingSummary({
      subject: config.subject,
      language: config.language,
      scriptStyle: config.scriptStyle,
      primaryLang,
      questions: collectedQuestions,
      targetHighlights: collectedTargetHighlights,
      sourceHighlights: collectedSourceHighlights,
    });
    if (summary) {
      if (segments.length > 0 && segments[segments.length - 1].pauseAfterSec < 0.7) {
        segments[segments.length - 1].pauseAfterSec = 0.7;
        segments[segments.length - 1].pauseKind = 'recap';
      }
      const mappedVoice = getFallbackVoiceForLangCode(
        summary.voiceLang,
        primaryVoice,
        secondaryVoice
      );
      const sumChunks = splitScriptSentences(summary.text, 165);
      sumChunks.forEach((chunk, ci) => {
        segments.push({
          text: chunk,
          voiceId: mappedVoice.voiceId,
          voiceSlot: mappedVoice.slot,
          detectedLang: summary.voiceLang,
          pauseAfterSec:
            ci === sumChunks.length - 1 && pendingOutroLines.length > 0 ? 0.5 : 0,
          pauseKind:
            ci === sumChunks.length - 1 && pendingOutroLines.length > 0 ? 'recap' : undefined,
          segmentKind: 'summary',
        });
      });
    }
  }

  if (pendingOutroLines.length > 0) {
    inAnswerBlock = false;
    pendingOutroLines.forEach((line, idx) =>
      processLine(line, idx, pendingOutroLines.length, pendingOutroLines, 'outro')
    );
  }

  return segments;
}

export function buildCountdownCues(
  startSec: number,
  durationSec: number,
  startIndex = 1
): SubtitleCue[] {
  const totalDur = Math.max(0.5, durationSec);
  const steps = Math.max(1, Math.min(10, Math.round(totalDur)));
  const stepDur = totalDur / steps;
  const result: SubtitleCue[] = [];
  for (let k = 0; k < steps; k++) {
    const num = steps - k;
    result.push({
      index: startIndex + k,
      startSec: startSec + k * stepDur,
      endSec: startSec + (k + 1) * stepDur,
      text: String(num),
      voiceSlot: 'primary',
      isCountdown: true,
      countdownTotalSteps: steps,
    });
  }
  return result;
}

export interface RawSegmentTiming {
  text: string;
  startSec: number;
  endSec: number;
  voiceSlot: 'primary' | 'secondary';
  segmentKind?: 'speech' | 'recap' | 'summary';
  isIntroOrOutro?: boolean;
  pauseAfterSec?: number;
  pauseKind?: 'thinking' | 'repeat' | 'recap';
  countdownStartSec?: number;
  countdownEndSec?: number;
  roleKind?: ScriptRoleKind;
  roleLabel?: string;
  contextLabel?: string;
  cueGroupId?: string;
  cueGroupFullText?: string;
}

export function buildDualSubtitleCues(
  records: RawSegmentTiming[],
  options: {
    stickyDualSubtitle?: boolean;
    maxSourceCharsPerLine?: number;
    maxCjkSourceCharsPerLine?: number;
    maxTargetCharsPerLine?: number;
    maxCjkTargetCharsPerLine?: number;
  } = {}
): SubtitleCue[] {
  const stickyEnabled = options.stickyDualSubtitle !== false;
  const hasSecondarySpeech = records.some(
    (r) =>
      r.voiceSlot === 'secondary' &&
      r.segmentKind !== 'recap' &&
      r.segmentKind !== 'summary' &&
      !r.isIntroOrOutro
  );

  if (!stickyEnabled || !hasSecondarySpeech) {
    const plain: SubtitleCue[] = [];
    for (const rec of records) {
      plain.push({
        index: plain.length + 1,
        startSec: rec.startSec,
        endSec: rec.endSec,
        text: rec.text,
        voiceSlot: rec.voiceSlot,
        isIntroOrOutro: rec.isIntroOrOutro,
        roleKind: rec.roleKind,
        roleLabel: rec.roleLabel,
        contextLabel: rec.contextLabel,
      });
      if (rec.countdownStartSec !== undefined && rec.countdownEndSec !== undefined) {
        if (!rec.isIntroOrOutro && rec.countdownEndSec > rec.endSec + 0.05) {
          plain.push({
            index: plain.length + 1,
            startSec: rec.endSec,
            endSec: rec.countdownEndSec,
            text: rec.text,
            voiceSlot: rec.voiceSlot,
            isStickySource: true,
            roleKind: rec.roleKind,
            roleLabel: rec.roleLabel,
            contextLabel: rec.contextLabel,
          });
        }
        const dur = Math.max(0.5, rec.countdownEndSec - rec.countdownStartSec);
        plain.push(...buildCountdownCues(rec.countdownStartSec, dur, plain.length + 1));
      }
    }
    return plain;
  }

  const cues: SubtitleCue[] = [];
  const latinSrcLimit = options.maxSourceCharsPerLine ?? 28;
  const cjkSrcLimit = options.maxCjkSourceCharsPerLine ?? 16;
  const latinTgtLimit = options.maxTargetCharsPerLine ?? 26;
  const cjkTgtLimit = options.maxCjkTargetCharsPerLine ?? 15;

  const countWrappedLines = (text: string, isSource: boolean): number => {
    const isCjkNoSpace = hasCjkChars(text) && !text.includes(' ');
    const limit = isSource
      ? isCjkNoSpace
        ? cjkSrcLimit
        : latinSrcLimit
      : isCjkNoSpace
      ? cjkTgtLimit
      : latinTgtLimit;
    return Math.max(1, wrapSubtitleLine(text, limit).split('\n').length);
  };

  let i = 0;
  while (i < records.length) {
    const rec = records[i];

    // Intro/Outro, recap/summary, or standalone secondary outside a primary pair -> display cleanly ONCE
    if (
      rec.isIntroOrOutro ||
      rec.segmentKind === 'recap' ||
      rec.segmentKind === 'summary' ||
      rec.voiceSlot !== 'primary'
    ) {
      cues.push({
        index: cues.length + 1,
        startSec: rec.startSec,
        endSec: rec.endSec,
        text: rec.text,
        voiceSlot: rec.voiceSlot,
        isIntroOrOutro: rec.isIntroOrOutro,
        roleKind: rec.roleKind,
        roleLabel: rec.roleLabel,
        contextLabel: rec.contextLabel,
      });
      if (rec.countdownStartSec !== undefined && rec.countdownEndSec !== undefined) {
        const dur = Math.max(0.5, rec.countdownEndSec - rec.countdownStartSec);
        cues.push(...buildCountdownCues(rec.countdownStartSec, dur, cues.length + 1));
      }
      i += 1;
      continue;
    }

    // Primary speech segment: check if followed by secondary target lines before next primary/intro/outro/recap/summary
    let j = i + 1;
    while (
      j < records.length &&
      records[j].voiceSlot === 'secondary' &&
      !records[j].isIntroOrOutro &&
      records[j].segmentKind !== 'recap' &&
      records[j].segmentKind !== 'summary'
    ) {
      j += 1;
    }

    const hasFollowingTarget = j > i + 1;
    if (!hasFollowingTarget) {
      cues.push({
        index: cues.length + 1,
        startSec: rec.startSec,
        endSec: rec.endSec,
        text: rec.text,
        voiceSlot: 'primary',
        roleKind: rec.roleKind,
        roleLabel: rec.roleLabel,
        contextLabel: rec.contextLabel,
      });
      if (rec.countdownStartSec !== undefined && rec.countdownEndSec !== undefined) {
        if (rec.countdownEndSec > rec.endSec + 0.05) {
          cues.push({
            index: cues.length + 1,
            startSec: rec.endSec,
            endSec: rec.countdownEndSec,
            text: rec.text,
            voiceSlot: 'primary',
            isStickySource: true,
            roleKind: rec.roleKind,
            roleLabel: rec.roleLabel,
            contextLabel: rec.contextLabel,
          });
        }
        const dur = Math.max(0.5, rec.countdownEndSec - rec.countdownStartSec);
        cues.push(...buildCountdownCues(rec.countdownStartSec, dur, cues.length + 1));
      }
      i += 1;
      continue;
    }

    // Determine exact moment the next source line (or recap/summary/end) begins
    const lastTarget = records[j - 1];
    const holdUntilSec =
      j < records.length
        ? records[j].startSec
        : lastTarget.endSec + (lastTarget.pauseAfterSec ?? 0);

    const sourceLines = countWrappedLines(rec.text, true);
    const maxTargetLines = Math.max(
      1,
      ...records.slice(i + 1, j).map((t) => countWrappedLines(t.text, false))
    );

    // 1. Active source read
    cues.push({
      index: cues.length + 1,
      startSec: rec.startSec,
      endSec: rec.endSec,
      text: rec.text,
      voiceSlot: 'primary',
      roleKind: rec.roleKind,
      roleLabel: rec.roleLabel,
      contextLabel: rec.contextLabel,
    });

    // 2. Pinned source caption underneath until the next source sentence starts
    if (holdUntilSec > rec.endSec + 0.05) {
      cues.push({
        index: cues.length + 1,
        startSec: rec.endSec,
        endSec: holdUntilSec,
        text: rec.text,
        voiceSlot: 'primary',
        isStickySource: true,
        companionTargetLines: maxTargetLines,
        roleKind: rec.roleKind,
        roleLabel: rec.roleLabel,
        contextLabel: rec.contextLabel,
      });
    }

    // 3. Countdown cues (if thinking pause exists before target answer)
    if (rec.countdownStartSec !== undefined && rec.countdownEndSec !== undefined) {
      const dur = Math.max(0.5, rec.countdownEndSec - rec.countdownStartSec);
      cues.push(...buildCountdownCues(rec.countdownStartSec, dur, cues.length + 1));
    }

    // 4. Target cues positioned ABOVE the pinned source sentence.
    // Collapse consecutive repeat passes of the same target sentence into ONE continuous cue
    // so the text displays ONCE (running karaoke/animation on pass 1 and staying cleanly lit on repeats).
    let k = i + 1;
    while (k < j) {
      const firstTgt = records[k];
      let m = k;
      while (
        m + 1 < j &&
        records[m].pauseKind === 'repeat' &&
        records[m + 1].text.trim() === firstTgt.text.trim()
      ) {
        m += 1;
      }
      const lastTgt = records[m];
      const hasRepeatPass = m > k;
      cues.push({
        index: cues.length + 1,
        startSec: firstTgt.startSec,
        endSec: lastTgt.endSec,
        animDurationSec: hasRepeatPass
          ? Math.max(0.4, firstTgt.endSec - firstTgt.startSec)
          : undefined,
        text: firstTgt.text,
        voiceSlot: 'secondary',
        companionSourceLines: sourceLines,
        roleKind: firstTgt.roleKind,
        roleLabel: firstTgt.roleLabel,
        contextLabel: firstTgt.contextLabel,
      });
      k = m + 1;
    }

    i = j;
  }

  return cues;
}

export function getScriptLengthSummary(sentenceCount: number): {
  tierLabel: string;
  estSec: number;
  estClips: number;
} {
  const count = Math.max(2, Math.min(25, Math.round(sentenceCount)));
  const estSec = Math.round(count * 5.2);
  const estClips = count * 2;
  let tierLabel = 'Ngắn';
  if (count <= 4) tierLabel = 'Rất ngắn';
  else if (count <= 7) tierLabel = 'Ngắn';
  else if (count <= 12) tierLabel = 'Trung bình';
  else if (count <= 18) tierLabel = 'Dài';
  else tierLabel = 'Rất dài';
  return { tierLabel, estSec, estClips };
}

export function getCanvasDimensions(
  aspectRatio: VideoAspectRatio,
  quality: VideoQuality = '720p'
): {
  width: number;
  height: number;
} {
  if (quality === '480p') {
    if (aspectRatio === '9:16') return { width: 480, height: 854 };
    if (aspectRatio === '1:1') return { width: 480, height: 480 };
    return { width: 854, height: 480 };
  }
  if (quality === '1080p') {
    if (aspectRatio === '9:16') return { width: 1080, height: 1920 };
    if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
    return { width: 1920, height: 1080 };
  }
  if (aspectRatio === '9:16') {
    return { width: 720, height: 1280 };
  }
  if (aspectRatio === '1:1') {
    return { width: 720, height: 720 };
  }
  return { width: 1280, height: 720 };
}

export function getQualityEncodingParams(quality: VideoQuality = '720p'): {
  crf: string;
  maxrate: string;
  bufsize: string;
  audioBitrate: string;
  label: string;
} {
  if (quality === '480p') {
    return {
      crf: '22',
      maxrate: '1250k',
      bufsize: '2500k',
      audioBitrate: '112k',
      label: '480p Tiết kiệm',
    };
  }
  if (quality === '1080p') {
    return {
      crf: '18',
      maxrate: '4000k',
      bufsize: '8000k',
      audioBitrate: '192k',
      label: '1080p Full HD',
    };
  }
  return {
    crf: '20',
    maxrate: '2200k',
    bufsize: '4400k',
    audioBitrate: '128k',
    label: '720p HD',
  };
}

export function getSubtitleWrapBudget(
  subtitle: Pick<SubtitleConfig, 'fontSize' | 'strokeWidth' | 'boxStyle'>,
  width: number,
  height: number,
  hasCjk = false
): {
  resScale: number;
  scaledFontSize: number;
  marginH: number;
  maxCharsPerLine: number;
  maxCueChars: number;
  outlineWidth: number;
  shadowDepth: number;
} {
  const minDim = Math.max(320, Math.min(width, height));
  const resScale = minDim / 720;
  const baseSize = Math.max(24, Math.min(64, Math.round(subtitle.fontSize)));
  const scaledFontSize = Math.max(18, Math.round(baseSize * resScale));
  const marginH = Math.max(24, Math.round(width * 0.08));
  const usableWidth = Math.max(180, width - marginH * 2);
  const charWidthFactor = hasCjk ? 1.08 : 0.58;
  const maxCharsPerLine = Math.max(
    hasCjk ? 8 : 12,
    Math.min(hasCjk ? 24 : 44, Math.floor(usableWidth / (scaledFontSize * charWidthFactor)))
  );
  const maxCueChars = Math.max(hasCjk ? 14 : 20, Math.round(maxCharsPerLine * 1.9));
  const isBox = subtitle.boxStyle === 'dark_box';
  const outlineWidth = isBox
    ? Math.max(4, Math.round(6.5 * resScale))
    : Math.max(1.5, Number((subtitle.strokeWidth * resScale * 1.15).toFixed(1)));
  const shadowDepth = isBox ? 0 : Math.max(0.9, Number((1.3 * resScale).toFixed(1)));

  return {
    resScale,
    scaledFontSize,
    marginH,
    maxCharsPerLine,
    maxCueChars,
    outlineWidth,
    shadowDepth,
  };
}

/**
 * Splits Vietnamese, English, or Japanese scripts into speakable chunks <= maxLen chars,
 * preserving natural sentence boundaries so TTS and per-scene visuals align accurately.
 */
export function splitScriptSentences(script: string, maxLen = 165): string[] {
  const cleaned = script.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  const rawSentences = cleaned
    .split(/(?<=[.!?…。！？])(?![\"'”’」』)])\s*|\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of rawSentences) {
    const effectiveMax = hasCjkChars(sentence) ? Math.min(maxLen, 72) : maxLen;
    if (sentence.length <= effectiveMax) {
      chunks.push(sentence);
      continue;
    }

    const subParts = sentence.split(/(?<=[,;:、，；：])\s*/);
    let buffer = '';
    for (const part of subParts) {
      const joiner = hasCjkChars(part) ? '' : ' ';
      const candidate = buffer ? `${buffer}${joiner}${part}`.trim() : part;
      if (candidate.length <= effectiveMax) {
        buffer = candidate;
      } else {
        if (buffer) chunks.push(buffer);
        if (part.length <= effectiveMax) {
          buffer = part;
        } else if (hasCjkChars(part) && !part.includes(' ')) {
          for (let i = 0; i < part.length; i += effectiveMax) {
            chunks.push(part.slice(i, i + effectiveMax));
          }
          buffer = '';
        } else {
          const words = part.split(' ');
          let wordBuf = '';
          for (const w of words) {
            if ((wordBuf + ' ' + w).trim().length <= effectiveMax) {
              wordBuf = (wordBuf + ' ' + w).trim();
            } else {
              if (wordBuf) chunks.push(wordBuf);
              wordBuf = w;
            }
          }
          buffer = wordBuf;
        }
      }
    }
    if (buffer) chunks.push(buffer);
  }

  return chunks;
}

export function wrapSubtitleLine(text: string, maxCharsPerLine = 26): string {
  const clean = text.trim();
  if (!clean) return '';

  if (hasCjkChars(clean) && !clean.includes(' ')) {
    const cjkMax = Math.max(8, Math.min(maxCharsPerLine, 18));
    if (clean.length <= cjkMax) return clean;
    const lines: string[] = [];
    let start = 0;
    while (start < clean.length) {
      let end = Math.min(clean.length, start + cjkMax);
      if (end < clean.length) {
        const slice = clean.slice(start, end + 2);
        const punctIdx = Math.max(slice.lastIndexOf('、'), slice.lastIndexOf('。'), slice.lastIndexOf('，'));
        if (punctIdx >= Math.floor(cjkMax * 0.5)) {
          end = start + punctIdx + 1;
        }
      }
      lines.push(clean.slice(start, end));
      start = end;
    }
    return lines.join('\n');
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const safeLimit = Math.max(10, maxCharsPerLine);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (word.length > safeLimit) {
      if (current) {
        lines.push(current);
        current = '';
      }
      for (let i = 0; i < word.length; i += safeLimit) {
        const piece = word.slice(i, i + safeLimit);
        if (i + safeLimit < word.length) {
          lines.push(piece);
        } else {
          current = piece;
        }
      }
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= safeLimit) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
}

/**
 * Splits long sentence-level subtitle cues into snappy 1-2 line phrases timed
 * proportionally by character count (supporting both Latin and CJK scripts).
 */
export function splitCueIntoShortSubCues(
  cues: SubtitleCue[],
  maxCharsPerCue = 42
): SubtitleCue[] {
  const result: SubtitleCue[] = [];
  let nextIdx = 1;

  for (const cue of cues) {
    if (cue.isCountdown || cue.isStickySource || cue.isStaticHold) {
      result.push({
        ...cue,
        index: nextIdx++,
      });
      continue;
    }
    const clean = cue.text.replace(/\s+/g, ' ').trim();
    const totalDur = Math.max(0.4, cue.endSec - cue.startSec);
    if (!clean) continue;

    const isCjkNoSpace = hasCjkChars(clean) && !clean.includes(' ');
    const effectiveLimit = isCjkNoSpace ? Math.min(maxCharsPerCue, 22) : maxCharsPerCue;
    // If cue spans a repeated target read (animDurationSec defined), keep it as one continuous cue
    // up to a generous 2.2x threshold so the repeat pass doesn't swap lines unexpectedly.
    const singleCueMax =
      cue.animDurationSec !== undefined ? Math.round(effectiveLimit * 2.2) : effectiveLimit;

    if (clean.length <= singleCueMax) {
      result.push({
        index: nextIdx++,
        startSec: cue.startSec,
        endSec: cue.endSec,
        animDurationSec: cue.animDurationSec,
        text: clean,
        voiceSlot: cue.voiceSlot,
        isIntroOrOutro: cue.isIntroOrOutro,
        companionSourceLines: cue.companionSourceLines,
        companionTargetLines: cue.companionTargetLines,
        roleKind: cue.roleKind,
        roleLabel: cue.roleLabel,
        contextLabel: cue.contextLabel,
      });
      continue;
    }

    const segments: string[] = [];
    if (isCjkNoSpace) {
      const clauses = clean.split(/(?<=[、。！？，])/);
      let buf = '';
      for (const clause of clauses) {
        if (!clause) continue;
        if ((buf + clause).length <= effectiveLimit) {
          buf += clause;
        } else {
          if (buf) segments.push(buf);
          if (clause.length <= effectiveLimit) {
            buf = clause;
          } else {
            const numParts = Math.ceil(clause.length / effectiveLimit);
            const step = Math.ceil(clause.length / numParts);
            for (let i = 0; i < clause.length; i += step) {
              segments.push(clause.slice(i, i + step));
            }
            buf = '';
          }
        }
      }
      if (buf) segments.push(buf);
    } else {
      const numChunks = Math.max(2, Math.ceil(clean.length / effectiveLimit));
      const targetLen = Math.ceil(clean.length / numChunks);
      const words = clean.split(' ');
      let buf = '';

      for (const w of words) {
        const candidate = buf ? `${buf} ${w}` : w;
        const endsWithPause = /[,;:—-]$/.test(buf);
        if (
          segments.length < numChunks - 1 &&
          ((candidate.length > targetLen + 4 && buf.length >= 14) ||
            (endsWithPause && buf.length >= 14))
        ) {
          if (buf) segments.push(buf);
          buf = w;
        } else {
          buf = candidate;
        }
      }
      if (buf) segments.push(buf);

      if (segments.length >= 2) {
        const last = segments[segments.length - 1];
        const prev = segments[segments.length - 2];
        if (last.split(' ').length <= 2 && prev.length + last.length + 1 <= effectiveLimit + 10) {
          segments.splice(segments.length - 2, 2, `${prev} ${last}`);
        }
      }
    }

    const totalChars = Math.max(
      1,
      segments.reduce((acc, s) => acc + s.length, 0)
    );
    const activeAnimSpan = cue.animDurationSec ?? totalDur;
    let cursor = cue.startSec;
    segments.forEach((seg, idx) => {
      const share = seg.length / totalChars;
      const isLastSeg = idx === segments.length - 1;
      const rawEnd = isLastSeg
        ? cue.endSec
        : Math.min(cue.startSec + activeAnimSpan - 0.1, cursor + activeAnimSpan * share);
      const end = isLastSeg ? cue.endSec : Math.max(cursor + 0.2, rawEnd);
      result.push({
        index: nextIdx++,
        startSec: cursor,
        endSec: end,
        animDurationSec:
          isLastSeg && cue.animDurationSec !== undefined
            ? Math.max(0.25, cue.startSec + activeAnimSpan - cursor)
            : undefined,
        text: seg,
        voiceSlot: cue.voiceSlot,
        isIntroOrOutro: cue.isIntroOrOutro,
        companionSourceLines: cue.companionSourceLines,
        companionTargetLines: cue.companionTargetLines,
        roleKind: cue.roleKind,
        roleLabel: cue.roleLabel,
        contextLabel: cue.contextLabel,
      });
      cursor = end;
    });
  }

  return result;
}

function formatSrtTimestamp(sec: number): string {
  const totalMs = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatAssTimestamp(sec: number): string {
  const totalCs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(totalCs / 360000);
  const m = Math.floor((totalCs % 360000) / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function hexToAssBgr(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return '&H00FFFFFF';
  }
  const r = clean.slice(0, 2).toUpperCase();
  const g = clean.slice(2, 4).toUpperCase();
  const b = clean.slice(4, 6).toUpperCase();
  return `&H00${b}${g}${r}`;
}

export function buildSrtFromCues(cues: SubtitleCue[]): string {
  return cues
    .filter((cue) => !cue.isStickySource && !cue.isStaticHold)
    .map((cue, idx) => {
      const wrapped = wrapSubtitleLine(cue.text, 34);
      return `${idx + 1}\n${formatSrtTimestamp(cue.startSec)} --> ${formatSrtTimestamp(cue.endSec)}\n${wrapped}`;
    })
    .join('\n\n');
}

export function tokenizeSubtitleForEffect(text: string): string[] {
  const clean = text.replace(/\r\n/g, '\n');
  const lines = clean.split('\n');
  const tokens: string[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      tokens.push('\n');
    }
    if (hasCjkChars(line) && !line.includes(' ')) {
      // Split Japanese/CJK into natural 2-char syllable-like beats for smooth karaoke/typewriter
      for (let i = 0; i < line.length; i += 2) {
        tokens.push(line.slice(i, i + 2));
      }
    } else {
      const words = line.split(/(\s+)/).filter((t) => t.length > 0);
      for (let i = 0; i < words.length; i++) {
        if (words[i].trim() === '' && tokens.length > 0) {
          tokens[tokens.length - 1] += words[i];
        } else if (words[i].trim() !== '') {
          tokens.push(words[i]);
        }
      }
    }
  });

  return tokens.filter((t) => t.length > 0);
}

function escapeAssText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '(')
    .replace(/\}/g, ')');
}

function formatAssCueBody(
  wrappedText: string,
  durationSec: number,
  effect: SubtitleEffect,
  pos?: {
    width: number;
    height: number;
    alignment: number;
    marginV: number;
    highlightColour?: string;
    outlineColour?: string;
  }
): string {
  if (effect === 'static') {
    return escapeAssText(wrappedText).replace(/\n/g, '\\N');
  }

  if (effect === 'pop_zoom') {
    const body = escapeAssText(wrappedText).replace(/\n/g, '\\N');
    return `{\\fscx58\\fscy58\\t(0,145,\\fscx118\\fscy118)\\t(145,290,\\fscx100\\fscy100)}${body}`;
  }

  if (effect === 'fade_slide') {
    const body = escapeAssText(wrappedText).replace(/\n/g, '\\N');
    if (pos) {
      const cx = Math.round(pos.width / 2);
      const cy =
        pos.alignment === 8
          ? pos.marginV
          : pos.alignment === 5
          ? Math.round(pos.height / 2)
          : pos.height - pos.marginV;
      const slidePx = Math.max(18, Math.round(pos.height * 0.03));
      const startY = pos.alignment === 8 ? Math.max(10, cy - slidePx) : cy + slidePx;
      return `{\\move(${cx},${startY},${cx},${cy},0,260)\\fad(220,150)}${body}`;
    }
    return `{\\fad(220,150)\\fscx92\\fscy92\\t(0,240,\\fscx100\\fscy100)}${body}`;
  }

  const tokens = tokenizeSubtitleForEffect(wrappedText);
  const spokenTokens = tokens.filter((t) => t !== '\n');
  if (spokenTokens.length === 0) {
    return escapeAssText(wrappedText).replace(/\n/g, '\\N');
  }

  const tokenWeight = (tok: string) =>
    Math.max(1, tok.trim().length) + (/[,;:、，；：.!?。！？]$/.test(tok.trim()) ? 1.5 : 0);

  if (effect === 'karaoke') {
    const totalCs = Math.max(15, Math.round(durationSec * 100));
    const totalWeights = Math.max(
      1,
      spokenTokens.reduce((acc, t) => acc + tokenWeight(t), 0)
    );
    let allocatedCs = 0;
    let spokenSeen = 0;

    return tokens
      .map((token) => {
        if (token === '\n') return '\\N';
        spokenSeen++;
        const isLast = spokenSeen === spokenTokens.length;
        const weight = tokenWeight(token);
        const cs = isLast
          ? Math.max(5, totalCs - allocatedCs)
          : Math.max(5, Math.round((totalCs * weight) / totalWeights));
        allocatedCs += cs;
        return `{\\kf${cs}}${escapeAssText(token)}`;
      })
      .join('');
  }

  if (effect === 'laser') {
    const hiCol = pos?.highlightColour ?? '&H0015CCFA';
    const outCol = pos?.outlineColour ?? '&H00000000';
    const revealWindowMs = Math.max(280, Math.round(durationSec * 820));
    const totalWeights = Math.max(
      1,
      spokenTokens.reduce((acc, t) => acc + tokenWeight(t), 0)
    );
    let elapsedWeight = 0;

    return tokens
      .map((token) => {
        if (token === '\n') return '\\N';
        const w = tokenWeight(token);
        const tStart = Math.round((elapsedWeight / totalWeights) * revealWindowMs);
        const tFlash = tStart + 55;
        const tSettle = tStart + 210;
        elapsedWeight += w;
        const escaped = escapeAssText(token);
        if (tStart === 0) {
          return `{\\1c&HFFFFFF&\\3c${hiCol}\\blur2.2\\t(55,210,\\1c${hiCol}\\3c${outCol}\\blur0.3)}${escaped}`;
        }
        return `{\\alpha&HFF&\\t(${tStart},${tFlash},\\alpha&H00&\\1c&HFFFFFF&\\3c${hiCol}\\blur2.2)\\t(${tFlash},${tSettle},\\1c${hiCol}\\3c${outCol}\\blur0.3)}${escaped}`;
      })
      .join('');
  }

  // Typewriter: reveal words sequentially over the active speech window
  const revealWindowMs = Math.max(250, Math.round(durationSec * 820));
  const totalWeights = Math.max(
    1,
    spokenTokens.reduce((acc, t) => acc + tokenWeight(t), 0)
  );
  let elapsedWeight = 0;

  return tokens
    .map((token) => {
      if (token === '\n') return '\\N';
      const w = tokenWeight(token);
      const tStart = Math.round((elapsedWeight / totalWeights) * revealWindowMs);
      const tEnd = Math.round(tStart + 45);
      elapsedWeight += w;
      if (tStart === 0) {
        return escapeAssText(token);
      }
      return `{\\alpha&HFF&\\t(${tStart},${tEnd},\\alpha&H00&)}${escapeAssText(token)}`;
    })
    .join('');
}

export interface SubtitleVerticalBand {
  topPx: number;
  bottomPx: number;
}

export function resolveCountdownCenterY(
  overlappingBands: SubtitleVerticalBand[],
  countdownHeightPx: number,
  height: number
): number {
  const minCenterY = Math.round(height * 0.14 + countdownHeightPx / 2);
  const maxCenterY = Math.round(height * 0.86 - countdownHeightPx / 2);
  const preferredY = Math.max(minCenterY, Math.min(maxCenterY, Math.round(height * 0.53)));

  if (overlappingBands.length === 0) {
    return preferredY;
  }

  const gap = Math.max(22, Math.round(height * 0.04));
  const halfCd = countdownHeightPx / 2;

  const overlapsAny = (centerY: number, marginGap: number): boolean => {
    const cdTop = centerY - halfCd - marginGap;
    const cdBottom = centerY + halfCd + marginGap;
    return overlappingBands.some((b) => cdBottom > b.topPx && cdTop < b.bottomPx);
  };

  if (!overlapsAny(preferredY, gap)) {
    return preferredY;
  }

  const unionTop = Math.min(...overlappingBands.map((b) => b.topPx));
  const unionBottom = Math.max(...overlappingBands.map((b) => b.bottomPx));
  const subtitleCenterY = (unionTop + unionBottom) / 2;

  const upFromUnion = Math.max(minCenterY, Math.round(unionTop - gap - halfCd));
  const downFromUnion = Math.min(maxCenterY, Math.round(unionBottom + gap + halfCd));

  const candidates =
    subtitleCenterY >= height * 0.45
      ? [upFromUnion, Math.round(height * 0.24), minCenterY, downFromUnion, Math.round(height * 0.74), maxCenterY]
      : [downFromUnion, Math.round(height * 0.74), maxCenterY, upFromUnion, Math.round(height * 0.24), minCenterY];

  const clampedCandidates = Array.from(
    new Set(candidates.map((c) => Math.max(minCenterY, Math.min(maxCenterY, c))))
  );

  for (const cand of clampedCandidates) {
    if (!overlapsAny(cand, gap)) {
      return cand;
    }
  }
  for (const cand of clampedCandidates) {
    if (!overlapsAny(cand, 4)) {
      return cand;
    }
  }

  // Fallback: pick candidate with maximum vertical clearance from all overlapping bands
  let bestY = upFromUnion;
  let bestClearance = -Infinity;
  for (const cand of clampedCandidates) {
    const clearance = Math.min(
      ...overlappingBands.map((b) => Math.max(b.topPx - (cand + halfCd), (cand - halfCd) - b.bottomPx))
    );
    if (clearance > bestClearance) {
      bestClearance = clearance;
      bestY = cand;
    }
  }
  return bestY;
}

export function buildAssFromCues(
  cues: SubtitleCue[],
  subtitle: SubtitleConfig,
  width: number,
  height: number
): string {
  const effect: SubtitleEffect = subtitle.effect ?? 'karaoke';
  const baseColour = hexToAssBgr(subtitle.textColor);
  const highlightColour = hexToAssBgr(subtitle.highlightColor || '#FACC15');
  const primaryColour = effect === 'karaoke' ? highlightColour : baseColour;
  const secondaryColour = effect === 'karaoke' ? baseColour : '&H000000FF';

  const outlineColour = hexToAssBgr(subtitle.strokeColor);
  const alignment =
    subtitle.position === 'top' ? 8 : subtitle.position === 'center' ? 5 : 2;

  let marginV = Math.round(height * 0.135);
  if (subtitle.position === 'top') {
    marginV = Math.round(height * 0.09);
  } else if (subtitle.position === 'center') {
    marginV = 0;
  } else if (subtitle.position === 'custom') {
    const clampedPct = Math.max(8, Math.min(90, subtitle.customPositionPct));
    marginV = Math.round(((100 - clampedPct) / 100) * height);
  }

  const effectiveFontName = subtitle.fontName || 'Noto Sans';
  const isJpFontSelected =
    effectiveFontName === 'M PLUS 1p' || effectiveFontName === 'BIZ UDPGothic';
  const preferredCjkFont = isJpFontSelected ? effectiveFontName : 'M PLUS 1p';

  const hasAnyCjk = cues.some((c) => hasCjkChars(c.text));
  const latinBudget = getSubtitleWrapBudget(subtitle, width, height, false);
  const cjkBudget = getSubtitleWrapBudget(subtitle, width, height, true);

  const sourceRawSize = Math.max(
    18,
    Math.min(58, Math.round(subtitle.sourceFontSize ?? subtitle.fontSize * 0.8))
  );
  const sourceSubCfg = { ...subtitle, fontSize: sourceRawSize };
  const sourceLatinBudget = getSubtitleWrapBudget(sourceSubCfg, width, height, false);
  const sourceCjkBudget = getSubtitleWrapBudget(sourceSubCfg, width, height, true);

  const isBox = subtitle.boxStyle === 'dark_box';
  const borderStyle = isBox ? 3 : 1;
  const backColour = isBox ? '&H66000000' : '&H99000000';

  const secondaryTextColour =
    subtitle.textColor.toUpperCase() === '#FACC15' ? '&H00F8BD38' : '&H0015CCFA';
  const secPrimary = effect === 'karaoke' ? highlightColour : secondaryTextColour;
  const secSecondary = effect === 'karaoke' ? '&H00F8BD38' : '&H000000FF';

  const stickyFontSize = sourceLatinBudget.scaledFontSize;
  const stickyHasCjk = cues.some((c) => c.isStickySource && hasCjkChars(c.text));
  const stickyStyleFont = stickyHasCjk ? preferredCjkFont : effectiveFontName;
  const stickyColour = hexToAssBgr('#E2E8F0');
  const stickyAlignment = subtitle.position === 'top' ? 8 : 2;
  const stickyBaseMarginV =
    subtitle.position === 'center' ? Math.round(height * 0.44) : marginV;

  const countdownFontSize = Math.max(36, Math.round(latinBudget.scaledFontSize * 2.25));
  const countdownOutline = Math.max(3.2, Number((latinBudget.outlineWidth * 1.65).toFixed(1)));
  const countdownShadow = Math.max(1.5, Number((latinBudget.shadowDepth * 1.4).toFixed(1)));
  const countdownBoxHeight = Math.round(countdownFontSize * 1.18);

  const estimateCueBand = (cue: SubtitleCue): SubtitleVerticalBand => {
    const cueHasCjk = hasAnyCjk && hasCjkChars(cue.text);
    const cueIsCjkWrap = cueHasCjk && !cue.text.includes(' ');
    const wrapMax = cue.isStickySource
      ? cueIsCjkWrap
        ? sourceCjkBudget.maxCharsPerLine
        : sourceLatinBudget.maxCharsPerLine
      : cueIsCjkWrap
      ? cjkBudget.maxCharsPerLine
      : latinBudget.maxCharsPerLine;
    const lineCount = Math.max(1, wrapSubtitleLine(cue.text, wrapMax).split('\n').length);
    const fontPx = cue.isStickySource ? stickyFontSize : latinBudget.scaledFontSize;
    const blockHeight = Math.round(
      lineCount * fontPx * 1.24 + (isBox ? 16 : 6) * latinBudget.resScale
    );

    if (cue.isStickySource) {
      if (subtitle.position === 'top') {
        const tgtLines = Math.max(1, cue.companionTargetLines ?? 1);
        const gapPx = Math.round((isBox ? 22 : 14) * latinBudget.resScale);
        const topPx =
          stickyBaseMarginV + Math.round(tgtLines * latinBudget.scaledFontSize * 1.24 + gapPx);
        return { topPx, bottomPx: topPx + blockHeight };
      }
      const bottomPx = height - stickyBaseMarginV;
      return { topPx: Math.max(0, bottomPx - blockHeight), bottomPx };
    }

    const companionSrcLines = cue.companionSourceLines ?? 0;
    const useStackedTarget = companionSrcLines > 0 && subtitle.position !== 'top';
    let effectiveAlignment = alignment;
    let effectiveMarginV = marginV;
    if (useStackedTarget) {
      const baseBottomMargin =
        subtitle.position === 'center' ? Math.round(height * 0.44) : marginV;
      const gapPx = Math.round((isBox ? 22 : 14) * latinBudget.resScale);
      const sourceBlockHeight = Math.round(companionSrcLines * stickyFontSize * 1.24 + gapPx);
      effectiveAlignment = 2;
      effectiveMarginV = baseBottomMargin + sourceBlockHeight;
    }

    if (effectiveAlignment === 8) {
      return { topPx: effectiveMarginV, bottomPx: effectiveMarginV + blockHeight };
    }
    if (effectiveAlignment === 5) {
      const mid = Math.round(height * 0.5);
      return {
        topPx: Math.max(0, Math.round(mid - blockHeight / 2)),
        bottomPx: Math.min(height, Math.round(mid + blockHeight / 2)),
      };
    }
    const bottomPx = height - effectiveMarginV;
    return { topPx: Math.max(0, bottomPx - blockHeight), bottomPx };
  };

  const header = [
    '[Script Info]',
    'Title: MoneyPrinterTurbo VN Subtitles',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,${effectiveFontName},${latinBudget.scaledFontSize},${primaryColour},${secondaryColour},${isBox ? '&H66000000' : outlineColour},${backColour},-1,0,0,0,100,100,0.4,0,${borderStyle},${latinBudget.outlineWidth.toFixed(1)},${latinBudget.shadowDepth.toFixed(1)},${alignment},${latinBudget.marginH},${latinBudget.marginH},${marginV},1`,
    `Style: Secondary,${effectiveFontName},${latinBudget.scaledFontSize},${secPrimary},${secSecondary},${isBox ? '&H66000000' : outlineColour},${backColour},-1,0,0,0,100,100,0.4,0,${borderStyle},${latinBudget.outlineWidth.toFixed(1)},${latinBudget.shadowDepth.toFixed(1)},${alignment},${latinBudget.marginH},${latinBudget.marginH},${marginV},1`,
    `Style: StickySource,${stickyStyleFont},${stickyFontSize},${stickyColour},&H00FFFFFF,${isBox ? '&H66000000' : outlineColour},${backColour},-1,0,0,0,100,100,0.3,0,${borderStyle},${sourceLatinBudget.outlineWidth.toFixed(1)},${sourceLatinBudget.shadowDepth.toFixed(1)},${stickyAlignment},${sourceLatinBudget.marginH},${sourceLatinBudget.marginH},${stickyBaseMarginV},1`,
    `Style: Countdown,${effectiveFontName},${countdownFontSize},${highlightColour},&H00FFFFFF,${outlineColour},&H80000000,-1,0,0,0,100,100,0,0,1,${countdownOutline.toFixed(1)},${countdownShadow.toFixed(1)},5,20,20,0,1`,
    `Style: CountdownMeta,${effectiveFontName},${Math.max(14, Math.round(latinBudget.scaledFontSize * 0.52))},&H00FFFFFF,&H00FFFFFF,&H000F172A,&H990F172A,-1,0,0,0,100,100,0.4,0,3,${Math.max(2, Math.round(4 * latinBudget.resScale))},0,5,16,16,0,1`,
    `Style: RoleBadge,${effectiveFontName},${Math.max(14, Math.round(latinBudget.scaledFontSize * 0.52))},&H00FFFFFF,&H00FFFFFF,&H001E293B,&HAA1E293B,-1,0,0,0,100,100,0.3,0,3,${Math.max(2, Math.round(4 * latinBudget.resScale))},0,2,16,16,0,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const nonCountdownCues = cues.filter((c) => !c.isCountdown);
  const showRoleBadges = subtitle.showRoleBadges !== false;

  const events: string[] = [];
  for (const cue of cues) {
    if (cue.isCountdown) {
      const cleanNum = escapeAssText(cue.text.trim());
      const overlappingBands = nonCountdownCues
        .filter((other) => other.endSec > cue.startSec - 0.05 && other.startSec < cue.endSec + 0.05)
        .map(estimateCueBand);
      const cdCenterY = resolveCountdownCenterY(overlappingBands, countdownBoxHeight, height);
      const cdCenterX = Math.round(width / 2);
      const totalSteps = Math.max(1, cue.countdownTotalSteps ?? 5);
      const numVal = Math.max(1, Number(cue.text.trim()) || 1);
      const barWidth = Math.round(Math.min(width * 0.36, 180 * latinBudget.resScale));
      const fillWidth = Math.max(12, Math.round((numVal / totalSteps) * barWidth));
      const barY = Math.min(height - 30, cdCenterY + Math.round(countdownFontSize * 0.62));
      const labelY = Math.max(30, cdCenterY - Math.round(countdownFontSize * 0.62));

      events.push(
        `Dialogue: 1,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},Countdown,,0,0,0,,{\\an5\\pos(${cdCenterX},${cdCenterY})\\fscx62\\fscy62\\t(0,145,\\fscx120\\fscy120)\\t(145,280,\\fscx100\\fscy100)\\fad(30,110)}${cleanNum}`
      );
      events.push(
        `Dialogue: 1,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},CountdownMeta,,0,0,0,,{\\an5\\pos(${cdCenterX},${labelY})\\1c${highlightColour}\\3c&H00171717&\\fad(30,100)}THINK`
      );
      events.push(
        `Dialogue: 1,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},CountdownMeta,,0,0,0,,{\\an5\\pos(${cdCenterX},${barY})\\p1\\1c${highlightColour}\\3c&H00000000&\\bord1\\fad(30,100)}m ${-Math.round(barWidth / 2)} 0 l ${-Math.round(barWidth / 2) + fillWidth} 0 l ${-Math.round(barWidth / 2) + fillWidth} ${Math.max(6, Math.round(7 * latinBudget.resScale))} l ${-Math.round(barWidth / 2)} ${Math.max(6, Math.round(7 * latinBudget.resScale))}{\\p0}`
      );
      continue;
    }

    const cueHasCjk = hasAnyCjk && hasCjkChars(cue.text);
    const cueIsCjkWrap = cueHasCjk && !cue.text.includes(' ');
    const wrapMax = cue.isStickySource
      ? cueIsCjkWrap
        ? sourceCjkBudget.maxCharsPerLine
        : sourceLatinBudget.maxCharsPerLine
      : cueIsCjkWrap
      ? cjkBudget.maxCharsPerLine
      : latinBudget.maxCharsPerLine;
    const wrapped = wrapSubtitleLine(cue.text, wrapMax);
    const totalDur = Math.max(0.25, cue.endSec - cue.startSec);
    const animDur = cue.animDurationSec ? Math.max(0.25, cue.animDurationSec) : totalDur;

    if (cue.isStickySource) {
      let stickyEventMarginV = 0;
      if (subtitle.position === 'top') {
        const tgtLines = Math.max(1, cue.companionTargetLines ?? 1);
        const gapPx = Math.round((isBox ? 22 : 14) * latinBudget.resScale);
        stickyEventMarginV =
          stickyBaseMarginV +
          Math.round(tgtLines * latinBudget.scaledFontSize * 1.24 + gapPx);
      }
      const staticBody = formatAssCueBody(wrapped, totalDur, 'static');
      const fontOverride = cueHasCjk && stickyStyleFont !== preferredCjkFont ? `{\\fn${preferredCjkFont}}` : '';
      events.push(
        `Dialogue: 0,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},StickySource,,0,0,${stickyEventMarginV},,${fontOverride}${staticBody}`
      );
      continue;
    }

    const companionSrcLines = cue.companionSourceLines ?? 0;
    const useStackedTarget = companionSrcLines > 0 && subtitle.position !== 'top';
    let effectiveAlignment = alignment;
    let effectiveMarginV = marginV;
    let eventMarginV = 0;

    if (useStackedTarget) {
      const baseBottomMargin =
        subtitle.position === 'center' ? Math.round(height * 0.44) : marginV;
      const gapPx = Math.round((isBox ? 22 : 14) * latinBudget.resScale);
      const sourceBlockHeight = Math.round(
        companionSrcLines * stickyFontSize * 1.24 + gapPx
      );
      effectiveAlignment = 2;
      effectiveMarginV = baseBottomMargin + sourceBlockHeight;
      eventMarginV = effectiveMarginV;
    }

    const cueEffect: SubtitleEffect = cue.isStaticHold ? 'static' : effect;
    const formattedBody = formatAssCueBody(wrapped, animDur, cueEffect, {
      width,
      height,
      alignment: effectiveAlignment,
      marginV: effectiveMarginV,
      highlightColour,
      outlineColour: isBox ? '&H66000000' : outlineColour,
    });
    const styleName = cue.voiceSlot === 'secondary' ? 'Secondary' : 'Default';
    const alignOverride = useStackedTarget && alignment !== 2 ? '{\\an2}' : '';
    const cjkFontPrefix = cueHasCjk && !isJpFontSelected ? `{\\fn${preferredCjkFont}}` : '';
    const staticHoldColorPrefix =
      cue.isStaticHold && (effect === 'karaoke' || effect === 'laser')
        ? `{\\1c${highlightColour}}`
        : '';
    events.push(
      `Dialogue: 0,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},${styleName},,0,0,${eventMarginV},,${alignOverride}${cjkFontPrefix}${staticHoldColorPrefix}${formattedBody}`
    );

    if (showRoleBadges && cue.roleKind && (cue.roleKind === 'question' || cue.roleKind === 'answer' || cue.roleKind === 'title')) {
      const badgeLang: 'vi' | 'en' | 'ja' = hasCjkChars(cue.text)
        ? 'ja'
        : hasVietnameseDiacritics(cue.text)
        ? 'vi'
        : 'en';
      const badgeColor =
        cue.roleKind === 'question'
          ? '&H00FD6E0D&'
          : cue.roleKind === 'answer'
          ? '&H00548719&'
          : '&H00F0CA0D&';
      const badgeText =
        cue.roleKind === 'question'
          ? `● ${cue.roleLabel || ROLE_LABELS_BY_LANG.question[badgeLang]}`
          : cue.roleKind === 'answer'
          ? `● ${cue.roleLabel || ROLE_LABELS_BY_LANG.answer[badgeLang]}`
          : `★ ${cue.roleLabel || ROLE_LABELS_BY_LANG.title[badgeLang]}`;
      const band = estimateCueBand(cue);
      const badgeY = Math.max(28, band.topPx - Math.round(18 * latinBudget.resScale));
      events.push(
        `Dialogue: 1,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},RoleBadge,,0,0,0,,{\\an2\\pos(${Math.round(width / 2)},${badgeY})\\3c${badgeColor}\\4c${badgeColor}}${escapeAssText(badgeText)}`
      );
    }
  }

  return [...header, ...events, ''].join('\n');
}

/**
 * Builds the MoneyPrinterTurbo prompt for ChatGPT / Gemini Web or server AI:
 * - 'all_in_one': AI selects a fascinating knowledge topic ("subject"), writes the full narration ("script"),
 *   and supplies English stock video/image search keywords ("terms") + 1-to-1 scene prompts ("scenePrompts").
 * - 'from_subject': Writes script + terms + scenePrompts specifically for the given subject.
 */
export function buildMoneyPrinterPrompt(params: {
  subject: string;
  language: LanguageCode;
  scriptStyle: ScriptStyle;
  sentenceCount: number;
  mode?: 'all_in_one' | 'from_subject' | 'from_user_script';
  verifiedFacts?: string[];
  rawScript?: string;
  mediaTypeFilter?: MediaTypeFilter;
  visualMood?: VisualMood;
  aspectRatio?: VideoAspectRatio;
  dualVoiceEnabled?: boolean;
  pauseBetweenLinesSec?: number;
  targetRepeatCount?: number;
  fullAnswerRecapMode?: FullAnswerRecapMode;
  summarizeAtEnd?: boolean;
  stickyDualSubtitle?: boolean;
  subtitleEffect?: SubtitleEffect;
}): string {
  const {
    subject,
    language,
    scriptStyle,
    sentenceCount,
    mode = 'from_subject',
    verifiedFacts = [],
    rawScript = '',
    mediaTypeFilter = 'all',
    visualMood = 'auto',
    aspectRatio = '9:16',
    dualVoiceEnabled = false,
    pauseBetweenLinesSec = 0,
    targetRepeatCount = 0,
    fullAnswerRecapMode = 'off',
    summarizeAtEnd = false,
    stickyDualSubtitle = true,
    subtitleEffect = 'karaoke',
  } = params;
  const count = Math.max(2, Math.min(25, Math.round(sentenceCount)));
  const cleanSubject = subject.trim();
  const cleanUserScript = rawScript.trim();

  const styleDesc: Record<ScriptStyle, string> = {
    curious_facts: 'Sự thật bất ngờ, câu mở đầu gây tò mò mạnh ngay 3 giây đầu',
    storytelling: 'Kể chuyện điện ảnh có mở nút, cao trào và kết thúc sâu lắng',
    tips_howto: 'Mẹo thực tế ngắn gọn, đánh số rõ ràng từng ý dễ nhớ',
    news_fast: 'Tin tức nhanh súc tích, nêu thẳng trọng tâm',
    motivational: 'Truyền cảm hứng nhẹ nhàng, triết lý sâu sắc',
    top_list: 'Liệt kê Top / Thứ hạng hấp dẫn từ cuối lên đầu',
    language_challenge:
      'Học ngoại ngữ phản xạ 5 giây / Phỏng vấn Q&A (đọc câu nguồn -> chờ 5s [PAUSE] -> đọc đáp án đích)',
    bilingual_dialogue: 'Hội thoại 2 giọng thực tế tự nhiên theo ngữ cảnh đời sống / công sở',
    quiz_riddle: 'Đố vui tương tác 5 giây suy nghĩ [PAUSE] rồi bật mí đáp án bất ngờ',
  };

  const langDescMap: Record<LanguageCode, string> = {
    vi: 'Ngôn ngữ viết kịch bản: 100% Tiếng Việt tự nhiên, súc tích.',
    en: 'Ngôn ngữ viết kịch bản: 100% Natural English (clear, spoken rhythm).',
    ja: 'Ngôn ngữ viết kịch bản: 100%自然な日本語 (natural spoken Japanese, NO Vietnamese/English filler).',
    bilingual:
      'Ngôn ngữ song ngữ Việt – Anh: mỗi câu Việt ([VI] hoặc Q:) đi kèm câu dịch tiếng Anh (English: hoặc [EN]) ngay bên dưới.',
    vi_ja:
      'Ngôn ngữ song ngữ Việt – Nhật: mỗi câu Việt ([VI] hoặc Q:) đi kèm câu tiếng Nhật ([JA]) ngay bên dưới.',
    ja_en:
      'Ngôn ngữ song ngữ Nhật – Anh: câu tiếng Nhật ([JA] hoặc Q:/A:) đi kèm câu tiếng Anh (English: hoặc [EN]) ngay bên dưới.',
  };
  const langDesc = langDescMap[language];

  const factualRule =
    '- NGUYÊN TẮC SỰ THẬT: Chỉ sử dụng kiến thức, số liệu chính xác có thật; tuyệt đối không bịa đặt thông tin.\n';

  const verifiedBlock =
    verifiedFacts.length > 0
      ? `\nDỮ KIỆN XÁC THỰC THAM KHẢO:\n${verifiedFacts.map((f) => `- ${f}`).join('\n')}\n`
      : '';

  const configContextBlock = `
TÙY CHỌN STUDIO ĐANG ĐỒNG BỘ:
- "aspectRatio": "${aspectRatio}", "mediaTypeFilter": "${mediaTypeFilter}", "visualMood": "${visualMood}"
- Giọng đọc: ${dualVoiceEnabled ? '2 giọng luân phiên' : '1 giọng'}, Đếm ngược suy nghĩ: ${pauseBetweenLinesSec}s, Lặp câu đích: ${targetRepeatCount}x
- Đọc lại cả đoạn câu trả lời: "${fullAnswerRecapMode}", Tóm tắt cuối bài: ${summarizeAtEnd}, Ghim câu gốc dưới đích: ${stickyDualSubtitle}, Hiệu ứng phụ đề: "${subtitleEffect}"`;

  const shortLengthRule =
    count <= 5
      ? `QUY TẮC ĐỘ DÀI NGẮN (<= ${count} dòng): Video rất ngắn nên KHÔNG viết Outro dài dòng hay tóm tắt rườm rà; câu kết CHỈ cần 1 lời cảm ơn cực ngắn đúng ngôn ngữ bài ("Thank you!", "ありがとうございます！", hoặc "Cảm ơn bạn!").`
      : `QUY TẮC ĐỘ DÀI: Nếu có kết bài / tóm tắt (${summarizeAtEnd ? 'Đang bật' : 'Đang tắt'}), giữ thật ngắn gọn súc tích tối đa 1 câu ngắn và lời cảm ơn.`;

  const componentCreativeGuide = `
6. TẠO "sceneComponents" (Kiến trúc KineticSub 2411 — sáng tạo từng cảnh, 1-1 với từng dòng script):
   - Mỗi dòng script có 1 object { "variant", "animationIn", "title", "subtitle", "labels", "highlightWord", "formula", "speechText", "reactionText" }.
   - SÁNG TẠO & KHÔNG LẶP LẠI: Luôn đa dạng hóa "variant" giữa các câu liên tiếp (tuyệt đối KHÔNG lặp 1 variant 2 lần liền nhau):
     * "css-browser-mockup" | "bs-card-header": hợp câu mở đầu / chủ đề chính
     * "friends-chat": CẢNH HỘI THOẠI 2 NHÂN VẬT (phỏng vấn Q&A, [V1]/[V2], đồng nghiệp/bạn bè nói chuyện — truyền "labels": ["Tên người A", "Tên người B"], "speechText": "câu thoại ngắn", "reactionText": "nhãn phản hồi")
     * "avatar-speech": NHÂN VẬT & BÓNG THOẠI (1 người nói câu giao tiếp tự nhiên kèm "speechText": "câu thoại", "reactionText": "Polite! / Tự nhiên!")
     * "dialogue-upgrade": NÂNG CẤP HỘI THOẠI (so sánh cách nói thô/cơ bản → tự nhiên/lịch sự — truyền "labels": ["Cách nói cơ bản", "Cách nói tự nhiên"], "speechText": "câu cơ bản", "highlightWord": "cụm nâng cấp", "reactionText": "Natural!")
     * "css-flashcard" | "gauge-tone": hợp câu hỏi / thử thách dịch [PAUSE] hoặc đo sắc thái lịch sự/thân thiện
     * "css-compare" | "css-equation": hợp câu đáp án / đối chiếu cấu trúc ngữ pháp (VD labels: ["Ngữ cảnh", "Mẫu câu chuẩn"], formula: "S + V + O")
     * "css-roadmap" | "staircase-3d" | "bs-progress-meter": hợp các bước / số liệu / thứ hạng
     * "bs-alert-callout": hợp câu cảnh báo / lưu ý quan trọng
     * "css-glass-quote": hợp triết lý / trích dẫn / lời cảm ơn kết thúc
   - "animationIn": chọn luân phiên từ ["pop-up", "slide-up", "drop-in", "fade-scale"].
   - RÀNG BUỘC NGÔN NGỮ TUYỆT ĐỐI: Mọi "title", "subtitle", "labels", "highlightWord", "speechText", "reactionText" PHẢI viết 100% bằng ĐÚNG NGÔN NGỮ của câu đó (nếu câu là tiếng Anh thì 100% tiếng Anh; tiếng Nhật thì 100% tiếng Nhật; TUYỆT ĐỐI KHÔNG trộn nhãn tiếng Việt vào câu tiếng Anh/Nhật!).`;

  const strictFileContract = `
QUY TẮC XUẤT FILE BẮT BUỘC (STRICT FILE OUTPUT):
- CHỈ xuất ra duy nhất 1 tệp tin tải xuống tên là \`script_2411.json\` (hoặc nếu giao diện chat không hỗ trợ nút tạo file thì chỉ trả về DUY NHẤT 1 code block \`\`\`json ... \`\`\` chứa JSON hợp lệ UTF-8).
- TUYỆT ĐỐI KHÔNG viết bất kỳ lời chào, giải thích, markdown hay văn bản nào bên ngoài file JSON.`;

  if (mode === 'from_user_script' && cleanUserScript) {
    const userLineCount = cleanUserScript.split('\n').map((l) => l.trim()).filter(Boolean).length;
    const pauseInstruction =
      pauseBetweenLinesSec > 0
        ? `CHÈN NHỊP ĐẾM NGƯỢC ${pauseBetweenLinesSec}s \`[PAUSE]\`: tự động phân tích và chèn \`[PAUSE]\` vào cuối các dòng câu hỏi (\`Q:\`) hoặc câu nguồn nội dung chính cần người xem suy nghĩ trước khi hiện câu dịch/đáp án. Tuyệt đối KHÔNG chèn \`[PAUSE]\` vào \`Tiêu đề:\`, \`Tiêu đề nhỏ:\`, phần mở đầu (Intro) hay kết thúc (Outro).`
        : 'Không chèn `[PAUSE]` vì người dùng đang tắt thời gian chờ đếm ngược.';
    return `Bạn là đạo diễn hình ảnh & kiến trúc sư Component 2411 chuẩn MoneyPrinterTurbo.
Người dùng đã nhập ĐOẠN NỘI DUNG LỜI THOẠI GỐC bên dưới (có thể là văn bản tự do, đoạn hội thoại chưa tách câu, hoặc kịch bản thô chưa gắn thẻ).
Nhiệm vụ của bạn là PHÂN TÍCH đoạn nội dung đó, giữ nguyên 100% ý nghĩa gốc của người dùng và chuẩn hóa thành tệp JSON hoàn chỉnh:
1. PHÂN TÍCH & TÁCH CÂU: Tách các đoạn dài thành từng câu ngắn gọn (1 câu / 1 lượt nói trên mỗi dòng \`\\n\`) để đọc TTS và chạy phụ đề khớp nhịp. Ngôn ngữ & phong cách mục tiêu: "${language}" · ${styleDesc[scriptStyle]}
2. CHUẨN HÓA THẺ CẤU TRÚC (tự động nhận diện phần mở đầu, câu hỏi, câu trả lời, ngôn ngữ từng dòng):
   - Hỗ trợ đầy đủ các thẻ: \`Tiêu đề:\`, \`Tiêu đề nhỏ:\`, \`Q:\`, \`A:\`, \`English:\`, \`[VI]\`, \`[EN]\`, \`[JA]\`, \`[V1]\`, \`[V2]\`.
   - Phần mở đầu (Intro / Tiêu đề) và phần kết (Outro) CHỈ viết bằng ngôn ngữ gốc (KHÔNG dịch sang ngôn ngữ đích, KHÔNG chèn \`[PAUSE]\`, CHỈ xuất hiện 1 lần). Riêng Intro nói rõ luật chơi kiểu "Now I will read..., you have 5 seconds to translate" / "今から日本語を読み上げます...".
   - ${shortLengthRule}
   - Nếu nội dung có câu hỏi/trả lời mà người dùng chưa gắn thẻ, hãy tự gắn \`Q:\` / \`A:\` tương ứng.
   - Nếu đang ở chế độ song ngữ (${language}) mà có câu hỏi/câu nội dung chính nào chưa có câu dịch đích bên dưới (trừ Intro/Outro), hãy tự động dịch tự nhiên và chèn thêm dòng \`English:\` / \`[EN]\` / \`[JA]\` / \`[VI]\` ngay bên dưới câu đó.
   - ${pauseInstruction}
3. ĐẶT "subject": Ngắn gọn, thu hút dựa đúng theo nội dung/Tiêu đề bài người dùng nhập (viết đúng ngôn ngữ nguồn của bài).
4. TẠO "terms": 4–6 từ khóa tìm B-roll tiếng Anh ngắn, sát bối cảnh thực tế của lời thoại.
5. TẠO "scenePrompts": Mảng mô tả cảnh quay bằng tiếng Anh tương ứng 1-1 với TỪNG DÒNG trong "script" (phong cách "${visualMood}", loại "${mediaTypeFilter}", tỉ lệ ${aspectRatio}, no text).
${componentCreativeGuide}
${configContextBlock}

NỘI DUNG LỜI THOẠI GỐC NGƯỜI DÙNG NHẬP (${userLineCount} dòng thô):
"""
${cleanUserScript}
"""
${strictFileContract}

Cấu trúc JSON mẫu (script_2411.json):
{
  "subject": "Title matching source language",
  "script": "Tiêu đề: ...\\nQ: ... [PAUSE]\\nEnglish: ...",
  "terms": ["relevant context keyword 1", "relevant context keyword 2"],
  "scenePrompts": [
    "scene prompt 1 matching line 1 context and ${visualMood} mood, ${aspectRatio}, no text",
    "scene prompt 2 matching line 2 context and ${visualMood} mood, ${aspectRatio}, no text"
  ],
  "sceneComponents": [
    { "variant": "css-browser-mockup", "animationIn": "drop-in", "title": "Native title matching line language", "subtitle": "5s Drill", "labels": ["Listen", "Translate"], "highlightWord": "5s" },
    { "variant": "css-flashcard", "animationIn": "pop-up", "title": "Core Phrase", "subtitle": "Speak Out Loud", "labels": ["Prompt", "Target"], "highlightWord": "key" }
  ],
  "visualMood": "${visualMood}",
  "mediaTypeFilter": "${mediaTypeFilter}"
}`;
  }

  if (mode === 'all_in_one') {
    const nicheHint = cleanSubject
      ? `Hướng/lĩnh vực tham khảo (có thể mở rộng sáng tạo nếu muốn): "${cleanSubject}". Nếu từ khóa đang ở ngôn ngữ khác, hãy chuyển sang chủ đề mới thuần ngôn ngữ đích.`
      : 'Tự chọn 1 chủ đề kiến thức, địa danh, hiện tượng khoa học hoặc sự kiện lịch sử CÓ THẬT (vũ trụ, tâm lý học, lịch sử, tự nhiên, công nghệ). Tránh chủ đề hư cấu hoặc lặp lại nhàm chán.';

    return `Bạn là đạo diễn nội dung & kiến trúc sư Component 2411 chuẩn MoneyPrinterTurbo.
Nhiệm vụ trọn gói (All-in-One): Bạn hãy TỰ CHỌN CHỦ ĐỀ CÓ THẬT hấp dẫn, VIẾT KỊCH BẢN chi tiết, và ĐỀ XUẤT COMPONENT + TỪ KHÓA TÌM ẢNH / VIDEO B-ROLL chuẩn cho từng cảnh quay.
${nicheHint}
Phong cách: ${styleDesc[scriptStyle]}
${langDesc}${factualRule}${verifiedBlock}${configContextBlock}
Yêu cầu BẮT BUỘC:
1. "subject": Tên chủ đề thu hút bằng ngôn ngữ mục tiêu (ngắn gọn 6-14 từ, gây tò mò ngay khi đọc).
2. "script": Gồm đúng ${count} dòng ngắn gọn đọc thành tiếng, mỗi câu/lượt nói nằm trên 1 dòng riêng biệt. Nếu là song ngữ/phỏng vấn, dùng tag Tiêu đề:/Tiêu đề nhỏ:/Q:/A:/English: hoặc [VI]/[EN]/[JA]. ${shortLengthRule}
3. "terms": Mảng gồm 4-6 cụm từ khóa tìm kiếm bằng tiếng Anh ngắn gọn (2-3 từ mỗi cụm) sát với bối cảnh thực tế của kịch bản để tìm tư liệu ${mediaTypeFilter}.
4. "scenePrompts": Mảng gồm đúng ${count} mô tả cảnh quay bằng tiếng Anh tương ứng 1-1 với từng dòng trong "script" (bám sát ngữ cảnh câu nói + phong cách ánh sáng ${visualMood}, khung hình ${aspectRatio}, không chữ trên ảnh).
${componentCreativeGuide}
${strictFileContract}

Cấu trúc JSON mẫu (script_2411.json):
{
  "subject": "Tiêu đề chủ đề thuần ngôn ngữ đích",
  "script": "Dòng 1...\\nDòng 2...\\n...",
  "terms": ["english stock keyword 1", "english stock keyword 2", "english stock keyword 3", "english stock keyword 4"],
  "scenePrompts": [
    "visual query for line 1 matching context and ${visualMood} mood, no text",
    "visual query for line 2 matching context and ${visualMood} mood, no text"
  ],
  "sceneComponents": [
    { "variant": "bs-card-header", "animationIn": "drop-in", "title": "Matched Title", "subtitle": "Hook", "labels": ["Topic", "Focus"] },
    { "variant": "css-compare", "animationIn": "slide-up", "title": "Matched Concept", "subtitle": "Breakdown", "labels": ["A", "B"] }
  ],
  "visualMood": "${visualMood}",
  "mediaTypeFilter": "${mediaTypeFilter}"
}`;
  }

  return `Bạn là biên kịch & kiến trúc sư Component 2411 chuẩn MoneyPrinterTurbo.
Chủ đề: "${cleanSubject || 'Kiến thức khoa học thú vị'}"
Phong cách: ${styleDesc[scriptStyle]}
${langDesc}${factualRule}${verifiedBlock}${configContextBlock}
Yêu cầu BẮT BUỘC:
1. "subject": Chuẩn hóa lại tên chủ đề theo đúng ngôn ngữ đã chọn.
2. "script": Gồm đúng ${count} dòng ngắn gọn, mỗi câu/lượt nói nằm trên 1 dòng riêng biệt. ${shortLengthRule}
3. "terms": Mảng gồm 3-6 cụm từ khóa tiếng Anh ngắn (2-3 từ) để tìm tư liệu ${mediaTypeFilter} sát với ngữ cảnh từng phần.
4. "scenePrompts": Mảng gồm đúng ${count} mô tả cảnh quay bằng tiếng Anh (tương ứng 1-1 với từng dòng trong script, bám sát ngữ cảnh, phong cách ${visualMood}, không chứa chữ viết trên ảnh).
${componentCreativeGuide}
${strictFileContract}

Cấu trúc JSON mẫu (script_2411.json):
{
  "subject": "${cleanSubject || 'Tiêu đề chủ đề'}",
  "script": "Dòng 1...\\nDòng 2...\\n...",
  "terms": ["keyword one", "keyword two", "keyword three"],
  "scenePrompts": [
    "visual description for line 1 matching context and ${visualMood} mood, no text",
    "visual description for line 2 matching context and ${visualMood} mood, no text"
  ],
  "sceneComponents": [
    { "variant": "bs-card-header", "animationIn": "drop-in", "title": "Matched Title", "subtitle": "Context", "labels": ["Step 1", "Step 2"] },
    { "variant": "css-roadmap", "animationIn": "slide-up", "title": "Core Takeaway", "subtitle": "Insight", "labels": ["Fact", "Impact"] }
  ],
  "visualMood": "${visualMood}",
  "mediaTypeFilter": "${mediaTypeFilter}"
}`;
}

const VALID_2411_VARIANTS: ReadonlySet<string> = new Set([
  'bs-card-header',
  'css-compare',
  'css-roadmap',
  'css-glass-quote',
  'css-equation',
  'css-flashcard',
  'bs-progress-meter',
  'bs-alert-callout',
  'css-browser-mockup',
  'gauge-tone',
  'staircase-3d',
  'friends-chat',
  'avatar-speech',
  'dialogue-upgrade',
]);

const VALID_2411_ANIMATIONS: ReadonlySet<string> = new Set([
  'pop-up',
  'slide-up',
  'drop-in',
  'fade-scale',
]);

export function sanitizeSceneComponentsList(
  rawList: unknown
): Studio2411SceneComponentOverride[] | undefined {
  if (!Array.isArray(rawList) || rawList.length === 0) return undefined;
  const normalized: Studio2411SceneComponentOverride[] = rawList.map((item) => {
    if (!item || typeof item !== 'object') return {};
    const obj = item as Record<string, unknown>;
    const variantRaw = typeof obj.variant === 'string' ? obj.variant.trim() : '';
    const animRaw = typeof obj.animationIn === 'string' ? obj.animationIn.trim() : '';
    const labels = Array.isArray(obj.labels)
      ? obj.labels.map((x) => String(x).trim()).filter(Boolean).slice(0, 4)
      : undefined;
    const progressPct =
      typeof obj.progressPct === 'number' && Number.isFinite(obj.progressPct)
        ? Math.max(5, Math.min(100, Math.round(obj.progressPct)))
        : undefined;
    return {
      ...(VALID_2411_VARIANTS.has(variantRaw)
        ? { variant: variantRaw as Studio2411ComponentVariant }
        : {}),
      ...(VALID_2411_ANIMATIONS.has(animRaw)
        ? { animationIn: animRaw as Studio2411AnimationIn }
        : {}),
      ...(typeof obj.title === 'string' && obj.title.trim()
        ? { title: obj.title.trim().slice(0, 90) }
        : {}),
      ...(typeof obj.subtitle === 'string' && obj.subtitle.trim()
        ? { subtitle: obj.subtitle.trim().slice(0, 80) }
        : {}),
      ...(labels && labels.length > 0 ? { labels } : {}),
      ...(typeof obj.highlightWord === 'string' && obj.highlightWord.trim()
        ? { highlightWord: obj.highlightWord.trim().slice(0, 40) }
        : {}),
      ...(typeof obj.formula === 'string' && obj.formula.trim()
        ? { formula: obj.formula.trim().slice(0, 72) }
        : {}),
      ...(typeof obj.speechText === 'string' && obj.speechText.trim()
        ? { speechText: obj.speechText.trim().slice(0, 110) }
        : {}),
      ...(typeof obj.reactionText === 'string' && obj.reactionText.trim()
        ? { reactionText: obj.reactionText.trim().slice(0, 36) }
        : {}),
      ...(typeof obj.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(obj.accentColor.trim())
        ? { accentColor: obj.accentColor.trim() }
        : {}),
      ...(progressPct !== undefined ? { progressPct } : {}),
    };
  });
  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Parses either structured JSON output (from ChatGPT/Gemini Web, Gemini API, .json files, or Pollinations AI)
 * OR plain multi-line script pasted by the user.
 */
export function parseAiWebOrJsonOutput(
  rawText: string,
  subject: string
): {
  subject?: string;
  script: string;
  terms: string[];
  scenePrompts: string[];
  sceneComponents?: Studio2411SceneComponentOverride[];
  visualMood?: VisualMood;
  mediaTypeFilter?: MediaTypeFilter;
} | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        subject?: string;
        title?: string;
        script?: string | string[];
        terms?: string[];
        scenePrompts?: string[];
        mediaSearchQueries?: string[];
        sceneComponents?: unknown;
        components?: unknown;
        scenes?: Array<{
          text?: string;
          narration?: string;
          componentSpec?: unknown;
          visualElements?: unknown;
        }>;
        visualMood?: VisualMood;
        mediaTypeFilter?: MediaTypeFilter;
      };
      const parsedSubject =
        typeof parsed.subject === 'string' && parsed.subject.trim().length > 2
          ? parsed.subject.trim()
          : typeof parsed.title === 'string' && parsed.title.trim().length > 2
          ? parsed.title.trim()
          : undefined;
      const effectiveSubject = parsedSubject || subject;

      let rawScript = Array.isArray(parsed.script)
        ? parsed.script.map((s) => String(s).trim()).filter(Boolean).join('\n')
        : typeof parsed.script === 'string'
        ? parsed.script
        : '';

      // Also accept lequyenktpm/2411 scenes JSON structure when imported as a .json file
      if (!rawScript.trim() && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
        rawScript = parsed.scenes
          .map((s) => String(s.text ?? s.narration ?? '').trim())
          .filter(Boolean)
          .join('\n');
      }

      if (rawScript.trim().length > 3) {
        const cleanScript = rawScript
          .replace(/\\n/g, '\n')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .join('\n');
        const sentences = splitScriptSentences(cleanScript);
        const terms =
          Array.isArray(parsed.terms) && parsed.terms.length > 0
            ? parsed.terms.map((t) => String(t).trim()).filter(Boolean)
            : extractEnglishSearchTerms(effectiveSubject, cleanScript);
        const rawPrompts =
          Array.isArray(parsed.scenePrompts) && parsed.scenePrompts.length > 0
            ? parsed.scenePrompts
            : Array.isArray(parsed.mediaSearchQueries) && parsed.mediaSearchQueries.length > 0
            ? parsed.mediaSearchQueries
            : null;
        const scenePrompts = rawPrompts
          ? rawPrompts.map((p) => String(p).trim()).filter(Boolean)
          : buildScenePromptsFromScript(sentences, effectiveSubject, terms);
        const sceneComponents = sanitizeSceneComponentsList(
          parsed.sceneComponents ??
            parsed.components ??
            (Array.isArray(parsed.scenes)
              ? parsed.scenes.map((s) => s.componentSpec ?? {})
              : undefined)
        );
        return {
          subject: parsedSubject,
          script: cleanScript,
          terms,
          scenePrompts,
          ...(sceneComponents ? { sceneComponents } : {}),
          visualMood: parsed.visualMood,
          mediaTypeFilter: parsed.mediaTypeFilter,
        };
      }
    } catch {
      // Fall through to plain-text parsing
    }
  }

  const lines = trimmed
    .split('\n')
    .map((l) => l.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((l) => l.length >= 1 && !l.startsWith('```'));
  if (lines.length === 0) return null;

  const titleLine = lines.find((l) => /^\s*(?:Tiêu\s*đề|Title)\s*[:：]/i.test(l));
  const extractedSubject = titleLine ? stripNarrationTags(titleLine) : undefined;
  const effectiveSubject = extractedSubject || subject;
  const cleanScript = lines.join('\n');
  const sentences = splitScriptSentences(cleanScript);
  const terms = extractEnglishSearchTerms(effectiveSubject, cleanScript);
  const scenePrompts = buildScenePromptsFromScript(sentences, effectiveSubject, terms);
  return { subject: extractedSubject, script: cleanScript, terms, scenePrompts };
}

const VI_KEYWORD_MAP: Array<[RegExp, string]> = [
  [/面接|自己PR|自己pr|interview|phỏng vấn|tuyển dụng|xin việc|resume|hồ sơ/i, 'job interview office meeting'],
  [/アルバイト|part-time|làm thêm|商品|khách hàng|customer|bán hàng|store|cửa hàng/i, 'retail store customer service'],
  [/スピーチ|発表会|サークル|speech|presentation|club|thuyết trình|đội nhóm|teamwork/i, 'presentation meeting team office'],
  [/計画|責任|planning|responsibility|kế hoạch|trách nhiệm|schedule|mục tiêu/i, 'planning notebook desk office'],
  [/長所|短所|積極性|strength|weakness|proactive|tính cách|ưu điểm|nhược điểm/i, 'confident office professional portrait'],
  [/評価|evaluate|đánh giá|feedback|colleague|đồng nghiệp/i, 'coworkers office discussion meeting'],
  [/学生|大学|trường học|sinh viên|học sinh|student|university|campus/i, 'university students campus study'],
  [/cà phê|espresso|latte|rang xay|barista|coffee|コーヒー|カフェ/i, 'coffee espresso barista cafe'],
  [/máy bay|hàng không|bầu trời|bay lượn|phi công|airplane|飛行機/i, 'airplane flight sky clouds'],
  [/thành phố xanh|bền vững|năng lượng mặt trời|đô thị xanh/i, 'sustainable city green architecture'],
  [/kim tự tháp|ai cập|pharaoh|giza|nhân sư|pyramid|ピラミッド/i, 'Egyptian pyramids desert'],
  [/rãnh mariana|mariana|đáy biển|vực thẳm|マリアナ海溝/i, 'deep sea mariana ocean'],
  [/phát sáng|sứa biển|sinh vật biển|jellyfish|クラゲ/i, 'bioluminescent jellyfish ocean'],
  [/tàu ngầm|thám hiểm biển|thợ lặn/i, 'underwater coral ocean'],
  [/đại dương|biển cả|sóng biển|san hô|ocean|海|深海/i, 'ocean waves coral'],
  [/vũ trụ|không gian|hành tinh|ngôi sao|thiên hà|hố đen|space|universe|宇宙/i, 'space galaxy stars'],
  [/(?:^|[\s,.!?])mèo(?:$|[\s,.!?])|thú cưng|hộp giấy|cat|猫/i, 'cat pet cute'],
  [/(?:^|[\s,.!?])chó(?:$|[\s,.!?])|chú cún|dog|犬/i, 'dog running happy'],
  [/tập trung|làm việc|học tập|bàn làm việc|sáng tạo|workspace|集中|勉強/i, 'workspace desk laptop coffee'],
  [/thói quen|buổi sáng|đồng hồ báo thức|ngủ dậy|morning|朝/i, 'morning sunrise coffee'],
  [/công nghệ|trí tuệ nhân tạo|máy tính|lập trình|robot|technology|ai|テクノロジー|ロボット/i, 'robotics technology future'],
  [/núi non|leo núi|đỉnh núi|hoàng hôn|mountain|山|富士山/i, 'mountain landscape sunset'],
  [/thiên nhiên|rừng xanh|cơn mưa|forest|nature|自然|森/i, 'forest nature waterfall'],
  [/thành phố|đường phố|đô thị|giao thông|city|tokyo|東京|都市/i, 'city night timelapse'],
  [/tài chính|tiền bạc|kinh doanh|đầu tư|business|finance/i, 'business finance skyscraper'],
  [/sức khỏe|thể thao|chạy bộ|tập gym|fitness|health|健康/i, 'running fitness sunrise'],
  [/ẩm thực|nấu ăn|món ăn|food|cooking|料理|グルメ/i, 'cooking kitchen food'],
  [/lịch sử|cổ đại|đế chế|di tích|history|ancient|歴史/i, 'ancient architecture ruins'],
  [/não bộ|tâm lý|giấc mơ|suy nghĩ|brain|psychology|脳/i, 'abstract light brain'],
  [/nhật bản|tokyo|kyoto|hoa anh đào|sakura|japan|日本|桜/i, 'japan tokyo cherry blossom'],
  [/cẩn thận|chú ý|watch out|careful|気をつけて/i, 'person warning gesture street'],
  [/nghỉ ngơi|đừng quá|take it easy|relax|無理しないで/i, 'calm person relaxing tea'],
  [/nước|mưa|thời tiết|bầu trời|rain|weather|sky|clouds|天気|雨/i, 'weather sky clouds'],
  [/gia đình|bạn bè|nói chuyện|trò chuyện|family|friends|talk|conversation|家族|友達/i, 'friends talking cafe'],
  [/đọc sách|sách|thư viện|kiến thức|book|reading|library|本|読書/i, 'person reading book library'],
  [/ngủ|giấc ngủ|đêm|sleep|night|dream|睡眠|夜/i, 'peaceful night bedroom'],
];

export function computeVisualMatchScore(
  assetTitle: string,
  sentenceKeywords: string[],
  subjectKeywords: string[] = []
): number {
  const lower = assetTitle.toLowerCase();
  if (
    /(diagram|chart|flowchart|graph|infographic|flag of|coat of arms|signature|logo|icon|blueprint|poster|stamp|coin|newspaper|book cover|page \d|scan|gravestone|statue of|horror|creepy|scary|skull|skeleton|zombie|ghost|monster|blood|gore|surgery|corpse|autopsy|morgue|cemetery|coffin|spider|cockroach|nightmare|demon|devil|warfare|dead body|wound|injury)/i.test(
      lower
    )
  ) {
    return -10;
  }

  let score = 0;
  let sentenceHits = 0;
  for (const kw of sentenceKeywords) {
    const clean = kw.toLowerCase().trim();
    if (clean.length < 3) continue;
    if (lower.includes(clean)) {
      score += 5;
      sentenceHits += 1;
    }
  }
  if (sentenceHits >= 2) {
    score += 6;
  }
  for (const kw of subjectKeywords) {
    const clean = kw.toLowerCase().trim();
    if (clean.length < 3) continue;
    if (!sentenceKeywords.includes(clean) && lower.includes(clean)) {
      score += 2;
    }
  }
  return score;
}

export function extractEnglishSearchTerms(subject: string, script: string): string[] {
  const combined = `${subject} ${script}`.trim();
  const matched: string[] = [];

  for (const [pattern, englishTerm] of VI_KEYWORD_MAP) {
    if (pattern.test(combined)) {
      matched.push(englishTerm);
    }
  }

  const asciiWords = `${subject} ${script}`
    .replace(/\[(?:V1|V2|1|2|A|B|Q|VI|EN|JA|PAUSE(?::\d+)?)\]/gi, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length >= 4 &&
        !/^(english|japanese|vietnamese|question|answer|title|subtitle|this|that|with|from|into|your|about|what|when|how|watch|just|minute|second|instant|translation|challenge)$/i.test(
          w
        )
    );

  if (asciiWords.length >= 2) {
    matched.push(asciiWords.slice(0, 4).join(' '));
  }

  if (matched.length === 0) {
    matched.push('cinematic nature landscape', 'city sunset timelapse', 'dramatic light rays');
  }

  return Array.from(new Set(matched)).slice(0, 6);
}

export function buildScenePromptsFromScript(
  sentences: string[],
  subject: string,
  terms: string[]
): string[] {
  return sentences.map((sentence, idx) => {
    const matchedForSentence = extractEnglishSearchTerms(sentence, '').filter(
      (t) => !t.includes('cinematic nature landscape')
    );
    const subjectMatched = extractEnglishSearchTerms(subject, '').filter(
      (t) => !t.includes('cinematic nature landscape')
    );
    const baseConcept =
      matchedForSentence[0] ??
      terms[idx % Math.max(1, terms.length)] ??
      subjectMatched[0] ??
      'dramatic cinematic scenery';
    const cameraAngles = [
      'wide cinematic establishing shot, natural lighting',
      'close-up subject detail, shallow depth of field',
      'dynamic medium perspective, atmospheric depth',
      'cinematic storytelling composition, natural color grading',
    ];
    return `${baseConcept}, ${cameraAngles[idx % cameraAngles.length]}, photorealistic, no text, no watermark`;
  });
}

function padOrSliceSentences(
  baseSentences: string[],
  targetCount: number,
  topic: string,
  language: LanguageCode,
  scriptStyle: ScriptStyle = 'curious_facts'
): string[] {
  const count = Math.max(2, Math.min(25, Math.round(targetCount)));
  if (baseSentences.length >= count) {
    if (count === 2) {
      return [baseSentences[0], baseSentences[baseSentences.length - 1]];
    }
    return [...baseSentences.slice(0, count - 1), baseSentences[baseSentences.length - 1]];
  }

  let expansionPool: string[];
  if (scriptStyle === 'language_challenge') {
    if (language === 'ja_en') {
      expansionPool = [
        '[JA] 次の問題！「ちょっと待ってね」を自然な英語で言うと？ [PAUSE]',
        '[EN] Hold on just a second!',
        '[JA] 「気にしないで」はどう表現しますか？ [PAUSE]',
        '[EN] Never mind, don’t worry about it!',
        '[JA] 「すごく助かりました」を英語にしてみましょう！ [PAUSE]',
        '[EN] You really saved me! Thank you so much!',
      ];
    } else if (language === 'vi_ja') {
      expansionPool = [
        '[VI] Câu tiếp theo: "Xin lỗi, làm phiền bạn một chút!" nói tiếng Nhật sao? [PAUSE]',
        '[JA] すみません、ちょっといいですか？',
        '[VI] Còn câu "Cố lên nhé, bạn làm được mà!" trong tiếng Nhật là gì? [PAUSE]',
        '[JA] 頑張ってね、あなたならできるよ！',
        '[VI] Câu cuối cực hay: "Cảm ơn vì đã giúp đỡ tôi nhé!" [PAUSE]',
        '[JA] 手伝ってくれて本当にありがとう！',
      ];
    } else if (language === 'ja') {
      expansionPool = [
        '[V1] 次の問題！この表現は正しいでしょうか？ [PAUSE]',
        '[V2] 自然な言い回しを意識して声に出してみましょう！',
      ];
    } else if (language === 'en') {
      expansionPool = [
        '[V1] Next challenge! How would you reply politely in 3 seconds? [PAUSE]',
        '[V2] I appreciate it, let me get right back to you!',
      ];
    } else {
      expansionPool = [
        '[VI] Câu tiếp theo: "Cho mình suy nghĩ một lát nhé" nói tiếng Anh sao? [PAUSE]',
        '[EN] Let me think about it for a second!',
        '[VI] Còn câu "Thật sự rất cảm ơn sự giúp đỡ của bạn!" là gì? [PAUSE]',
        '[EN] I really appreciate your help!',
        '[VI] Thử thêm 1 câu cực phổ biến: "Chúc bạn một ngày tốt lành!" [PAUSE]',
        '[EN] Have a wonderful day ahead!',
      ];
    }
  } else {
    expansionPool =
      language === 'ja'
        ? [
            `${topic}については、時代とともに新しい発見や研究結果が次々と報告されています。`,
            `一見するとシンプルに見える仕組みの裏側には、驚くほど精巧なバランスが隠されています。`,
            `世界の専門家たちは、${topic}が私たちの日常や未来に与える影響に注目しています。`,
            `実際に観察してみると、小さな変化が大きな違いを生み出していることが分かります。`,
            `歴史的な背景を振り返ることで、${topic}の本当の魅力がさらに深く見えてきます。`,
            `最新のデータや記録からも、これまで知られていなかった事実が次々と明らかになっています。`,
            `こうした知識を少し意識するだけで、いつもの景色がまったく違って見えるはずです。`,
            `さらに詳しく見ていくと、多くの人が見落としがちな重要なポイントが浮かび上がります。`,
          ]
        : language === 'en'
        ? [
            `Looking closer at ${topic}, every small detail reveals a surprisingly intricate pattern.`,
            `Researchers and creators continue to uncover overlooked angles behind ${topic}.`,
            `Historical records show how ${topic} evolved far beyond what most people imagine.`,
            `In real-world conditions, subtle shifts create massive long-term impact.`,
            `Comparing multiple perspectives makes the hidden logic of ${topic} crystal clear.`,
            `Modern technology is now helping us observe ${topic} in unprecedented resolution.`,
            `What seems ordinary on the surface often holds the most compelling story underneath.`,
            `Understanding this core principle changes how you notice ${topic} every day.`,
          ]
        : language === 'bilingual'
        ? [
            `[EN] Let's practice one more real-life expression together.`,
            `[VI] Hãy thử lặp lại câu vừa rồi thật to và tự nhiên nhé!`,
            `[EN] Native speakers use this short phrase every single day.`,
            `[VI] Ghi nhớ cụm từ này sẽ giúp bạn phản xạ giao tiếp nhanh hơn hẳn.`,
          ]
        : language === 'vi_ja'
        ? [
            `[JA] もう一度ゆっくり聞いてみましょう。`,
            `[VI] Bạn đã nghe rõ ngữ điệu tự nhiên của người Nhật chưa nào? [PAUSE]`,
            `[JA] 毎日少しずつ練習すれば、必ず話せるようになります。`,
            `[VI] Hãy lưu lại câu mẫu này để luyện phản xạ tiếng Nhật mỗi ngày nhé!`,
          ]
        : language === 'ja_en'
        ? [
            `[JA] 次のフレーズにも挑戦してみましょう！ [PAUSE]`,
            `[EN] Let's try speaking it out loud one more time.`,
            `[JA] ネイティブは日常会話でとてもよくこの表現を使います。`,
            `[EN] Keep practicing every day and it will become automatic.`,
          ]
        : [
            `Khi quan sát kỹ hơn về ${topic}, từng chi tiết nhỏ đều phản ánh một quy luật vô cùng thú vị.`,
            `Các nhà nghiên cứu đã ghi nhận nhiều dữ kiện bất ngờ làm thay đổi cách chúng ta hiểu về ${topic}.`,
            `Không chỉ dừng lại ở bề nổi, câu chuyện đằng sau ${topic} còn gắn liền với nhiều yếu tố thực tế ít người biết.`,
            `Nếu đặt trong bối cảnh rộng lớn hơn, vai trò của ${topic} càng trở nên rõ nét và đáng suy ngẫm.`,
            `Nhiều bằng chứng thực nghiệm gần đây tiếp tục hé lộ những khía cạnh hoàn toàn mới mẻ.`,
            `Điều khiến nhiều người bất ngờ nhất chính là sự kết nối chặt chẽ giữa các chi tiết tưởng chừng rời rạc.`,
            `Khi hiểu đúng bản chất của ${topic}, bạn sẽ nhìn thấy những giá trị sâu sắc hơn trong đời sống hằng ngày.`,
            `Những câu chuyện thực tế xoay quanh chủ đề này luôn mang lại nguồn cảm hứng bất tận cho người khám phá.`,
          ];
  }

  const head = baseSentences.slice(0, Math.max(1, baseSentences.length - 1));
  const tail = baseSentences[baseSentences.length - 1];
  const combined = [...head];
  let idx = 0;
  while (combined.length < count - 1) {
    combined.push(expansionPool[idx % expansionPool.length]);
    idx++;
  }
  combined.push(tail);
  return combined.slice(0, count);
}

/**
 * Builds a clean, fluent short-video script from factual Wikipedia excerpts
 * or structured topic templates matching the selected language, style, and flexible length (2..25).
 */
export function buildSmartVietnameseScriptFromFacts(params: {
  subject: string;
  language: LanguageCode;
  scriptStyle: ScriptStyle;
  sentenceCount: number;
  wikiTitle?: string;
  wikiSentences?: string[];
  englishTerms?: string[];
}): { script: string; terms: string[]; scenePrompts: string[] } {
  const topic = params.subject.trim() || 'Những bí ẩn kỳ diệu quanh ta';
  const count = Math.max(2, Math.min(25, Math.round(params.sentenceCount)));
  const terms =
    params.englishTerms && params.englishTerms.length > 0
      ? params.englishTerms
      : extractEnglishSearchTerms(topic, '');

  const isDualMode =
    isBilingualLanguage(params.language) ||
    params.scriptStyle === 'language_challenge' ||
    params.scriptStyle === 'bilingual_dialogue' ||
    params.scriptStyle === 'quiz_riddle';

  if (params.wikiSentences && params.wikiSentences.length >= 2 && !isDualMode) {
    const title = params.wikiTitle || topic;
    let hook = `Bạn có biết những sự thật cực kỳ bất ngờ về ${title} chưa?`;
    let outro = 'Theo dõi kênh để cùng khám phá thêm nhiều kiến thức thú vị mỗi ngày nhé!';

    if (params.language === 'ja') {
      const jaHooks: Record<string, string> = {
        curious_facts: `${title}について、意外と知られていない驚きの事実をご存じですか？`,
        storytelling: `${title}の裏側には、あまり語られない魅力的な物語が隠されています。`,
        tips_howto: `${title}の重要なポイントを、数秒で分かりやすくまとめました。`,
        news_fast: `今あらためて注目されている${title}の核心を短くお伝えします。`,
        motivational: `${title}から学べる、人生を少し前向きにする大切なヒントがあります。`,
        top_list: `${title}にまつわる驚くべきポイントを順番に見ていきましょう。`,
      };
      hook = jaHooks[params.scriptStyle] ?? jaHooks.curious_facts;
      outro = '毎日新しい発見をお届けしますので、ぜひフォローしてチェックしてください！';
    } else if (params.language === 'en') {
      const enHooks: Record<string, string> = {
        curious_facts: `Did you know these surprising facts about ${title}?`,
        storytelling: `Behind ${title} lies a remarkable story most people never hear.`,
        tips_howto: `Here are the essential takeaways about ${title} in just seconds.`,
        news_fast: `Here is what makes ${title} stand out right now.`,
        motivational: `Here is one powerful lesson from ${title} that changes how we think.`,
        top_list: `Let's count down the most fascinating facts about ${title}.`,
      };
      hook = enHooks[params.scriptStyle] ?? enHooks.curious_facts;
      outro = 'Follow for more bite-sized discoveries every single day!';
    } else {
      const viHooks: Record<string, string> = {
        curious_facts: `Bạn có biết những sự thật cực kỳ bất ngờ về ${title} chưa?`,
        storytelling: `Ít ai biết câu chuyện đằng sau ${title} lại ẩn chứa nhiều điều kỳ vĩ đến vậy.`,
        tips_howto: `Hãy cùng điểm qua những thông tin quan trọng nhất về ${title} chỉ trong vài giây!`,
        news_fast: `Sự thật về ${title} mà rất nhiều người vẫn chưa từng nghe tới.`,
        motivational: `Bài học truyền cảm hứng sâu sắc từ ${title} dành cho bạn hôm nay.`,
        top_list: `Cùng điểm danh những sự thật thú vị nhất về ${title} ngay sau đây.`,
      };
      hook = viHooks[params.scriptStyle] ?? viHooks.curious_facts;
    }

    const bodyLimit = Math.max(1, count - 2);
    const body = params.wikiSentences
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length >= 12 && s.length <= 185)
      .slice(0, bodyLimit);

    const rawAssembled = [hook, ...body, outro];
    const finalSentences = padOrSliceSentences(rawAssembled, count, topic, params.language);
    const scenePrompts = buildScenePromptsFromScript(finalSentences, topic, terms);
    return {
      script: finalSentences.join('\n'),
      terms,
      scenePrompts,
    };
  }

  return generateOfflineVietnameseScript(
    topic,
    params.language,
    count,
    terms,
    params.scriptStyle
  );
}

export function generateOfflineVietnameseScript(
  subject: string,
  language: LanguageCode,
  sentenceCount = 4,
  overrideTerms?: string[],
  scriptStyle: ScriptStyle = 'curious_facts'
): { script: string; terms: string[]; scenePrompts: string[] } {
  const topic = subject.trim() || 'Những bí ẩn kỳ diệu quanh ta';
  const count = Math.max(2, Math.min(25, Math.round(sentenceCount)));
  const terms =
    overrideTerms && overrideTerms.length > 0
      ? overrideTerms
      : extractEnglishSearchTerms(topic, '');

  let sentences: string[];
  const isShort = count <= 5;
  if (
    scriptStyle === 'language_challenge' ||
    ((language === 'vi_ja' || language === 'ja_en') &&
      scriptStyle !== 'bilingual_dialogue' &&
      scriptStyle !== 'quiz_riddle')
  ) {
    if (language === 'ja_en') {
      sentences = [
        'Tiêu đề: 今から日本語を読み上げます。5秒以内に英語で言ってみましょう！',
        'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
        'English: Watch out for her!',
        'Q: 続いて「無理しないでね」はどう言いますか？ [PAUSE]',
        'English: Take it easy and don’t push yourself too hard!',
        isShort
          ? 'Outro: ありがとうございました！'
          : 'Outro: お疲れ様でした！保存して練習しましょう！',
      ];
    } else if (language === 'vi_ja') {
      sentences = [
        'Tiêu đề: Bây giờ mình sẽ đọc từng câu, bạn có 5 giây để dịch sang tiếng Nhật nhé!',
        'Q: Câu đầu tiên: "Hôm nay bạn vất vả rồi" nói tiếng Nhật thế nào? [PAUSE]',
        '[JA] 今日もお疲れ様でした！',
        'Q: Câu thứ 2: "Đừng lo lắng quá nhé" trong tiếng Nhật là gì? [PAUSE]',
        '[JA] あまり心配しないでくださいね！',
        isShort
          ? 'Outro: Cảm ơn bạn đã luyện tập!'
          : 'Outro: Lưu video lại để luyện phản xạ mỗi ngày nhé!',
      ];
    } else if (language === 'ja') {
      sentences = [
        `Tiêu đề: 今から${topic}の問題を読み上げます。5秒以内に答えてみましょう！`,
        `Q: ${topic}について正しいのはどちらでしょうか？ [PAUSE]`,
        `A: 正解は、多くの人が見落としがちな小さな仕組みに隠されています。`,
        `Outro: ありがとうございました！`,
      ];
    } else if (language === 'en') {
      sentences = [
        `Tiêu đề: Now I will read each prompt on ${topic}, and you have 5 seconds to answer!`,
        `Q: How do native speakers react naturally in this situation? [PAUSE]`,
        `A: Keep it natural, concise, and confident!`,
        `Outro: Thank you!`,
      ];
    } else {
      sentences = [
        'Tiêu đề: Bây giờ mình sẽ đọc câu tiếng Việt, bạn có 5 giây để dịch sang tiếng Anh nhé!',
        'Q: Câu 1: "Hãy cẩn thận với cô ấy!" bạn nói tiếng Anh thế nào? [PAUSE]',
        'English: Watch out for her!',
        'Q: Câu 2: "Cứ từ từ, đừng vội nhé!" dịch sang tiếng Anh là gì? [PAUSE]',
        'English: Take your time, there is no rush!',
        isShort
          ? 'Outro: Cảm ơn bạn!'
          : 'Outro: Lưu video lại để luyện phản xạ tiếng Anh mỗi ngày nhé!',
      ];
    }
  } else if (scriptStyle === 'bilingual_dialogue') {
    if (language === 'vi_ja') {
      sentences = [
        '[VI] Này, bạn biết cách chào hỏi tự nhiên khi vào quán ăn Nhật không?',
        '[JA] もちろん！笑顔で「すみません」と声をかければバッチリですよ。',
        '[VI] Quá hay! Thế còn khi ăn xong muốn cảm ơn đầu bếp thì sao?',
        '[JA] 「ごちそうさまでした！」と言うと、お店の方もすごく喜んでくれます。',
      ];
    } else if (language === 'ja_en') {
      sentences = [
        '[JA] カフェで自然に英語で注文するフレーズを教えて！',
        '[EN] Sure! Just say, "Could I get an iced latte to go, please?"',
        '[JA] すごくシンプルで使いやすいですね！',
        '[EN] Yes, polite and super natural anywhere in the world!',
      ];
    } else if (language === 'bilingual') {
      sentences = [
        `[VI] Hôm nay cùng tìm hiểu chủ đề "${topic}" qua hội thoại hai giọng nhé!`,
        `[EN] That sounds awesome—let’s break down the key insight in just a few seconds.`,
        `[VI] Điều quan trọng nhất là lắng nghe cách ngắt nhịp và dùng từ tự nhiên.`,
        `[EN] Practice out loud with us! Thank you!`,
      ];
    } else {
      sentences = [
        `[V1] Này bạn, hôm nay chúng ta bàn nhanh về "${topic}" nhé!`,
        `[V2] Quá tuyệt! Điều bất ngờ nhất ở chủ đề này là gì thế?`,
        `[V1] Chính là những chi tiết nhỏ mà hầu hết mọi người đều bỏ qua mỗi ngày.`,
        `[V2] Đúng vậy, thử để ý một chút là thấy cuộc sống thú vị hơn hẳn! Cảm ơn bạn!`,
      ];
    }
  } else if (scriptStyle === 'quiz_riddle') {
    sentences =
      language === 'ja'
        ? [
            `[V1] 5秒クイズ！${topic}にまつわる驚きの答えが分かりますか？ [PAUSE]`,
            `[V2] 正解は、一見すると逆に見える自然の法則にありました！`,
            `[V1] ありがとうございました！`,
          ]
        : language === 'en'
        ? [
            `[V1] Quick 5-second riddle about ${topic}: can you guess the real answer? [PAUSE]`,
            `[V2] Surprise! The answer lies in a tiny detail most people overlook.`,
            `[V1] Thank you for playing!`,
          ]
        : [
            `[V1] Đố bạn trong 5 giây về ${topic}: đâu là sự thật ít người đoán trúng? [PAUSE]`,
            `[V2] Đáp án bất ngờ nằm ngay ở chi tiết tưởng như ngược đời nhất!`,
            `[V1] Cảm ơn bạn đã tham gia!`,
          ];
  } else if (scriptStyle === 'motivational') {
    sentences =
      language === 'ja'
        ? [
            `今日、少しだけ立ち止まって${topic}について考えてみませんか。`,
            `大きな変化はいつも、誰にも見えない静かな一歩から始まります。`,
            `昨日の自分より1%だけ前に進むことが、やがて大きな自信に変わります。`,
            `焦らなくて大丈夫。ありがとうございました！`,
          ]
        : language === 'en'
        ? [
            `Take a quiet breath and think about ${topic} for just ten seconds.`,
            `Every meaningful breakthrough begins with small, unseen consistency.`,
            `You do not need perfection today—just one honest step forward.`,
            `Thank you!`,
          ]
        : [
            `Dành ra 10 giây hôm nay để suy ngẫm về ${topic} bạn nhé.`,
            `Mọi bứt phá lớn lao đều bắt đầu từ những bước nhỏ âm thầm mỗi ngày.`,
            `Bạn không cần phải hoàn hảo ngay lập tức, chỉ cần kiên trì hơn hôm qua một chút.`,
            `Cảm ơn bạn đã lắng nghe!`,
          ];
  } else if (scriptStyle === 'top_list') {
    sentences =
      language === 'ja'
        ? [
            `${topic}について、今すぐ知っておきたい注目ポイントを3つ厳選しました。`,
            `第3位は、日常の小さな習慣が大きな差を生むという事実です。`,
            `第2位は、プロほど基本を徹底しているというシンプルな原則です。`,
            `そして第1位は、今日から誰でもすぐ実践できるシンプルな工夫でした！`,
          ]
        : language === 'en'
        ? [
            `Here are the top 3 eye-opening insights about ${topic}.`,
            `Number three: subtle daily details quietly shape the biggest outcomes.`,
            `Number two: experts rely on simple fundamentals more than complex tricks.`,
            `And number one: you can start applying this immediately today! Thank you!`,
          ]
        : [
            `Top 3 điều bất ngờ nhất về ${topic} mà ai cũng nên biết một lần.`,
            `Số 3: Những thói quen nhỏ hằng ngày quyết định tới 80% kết quả lâu dài.`,
            `Số 2: Người giỏi nhất luôn tập trung vào những nguyên lý cơ bản nhất.`,
            `Và số 1: Bạn hoàn toàn có thể áp dụng bí quyết này ngay hôm nay! Cảm ơn bạn!`,
          ];
  } else if (language === 'ja') {
    sentences = [
      `ちょっと待ってください、${topic}には多くの人が知らない驚きの秘密があります。`,
      `一見すると普通の光景に見えても、その背景には緻密な仕組みや歴史が隠れています。`,
      `最新の調査や観察によって、${topic}の意外な側面が次々と明らかになってきました。`,
      `小さな視点の違いに気づくだけで、毎日の見方が大きく変わるはずです。`,
      `ありがとうございました！`,
    ];
  } else if (language === 'en') {
    sentences = [
      `Stop scrolling—what you are about to learn about ${topic} will completely surprise you.`,
      `Even today, scientists and explorers are still uncovering hidden mechanisms behind ${topic}.`,
      `What looks ordinary at first glance actually hides extraordinary precision beneath the surface.`,
      `Researchers found that small historical details completely reshape how we understand ${topic}.`,
      `Thank you!`,
    ];
  } else if (language === 'bilingual') {
    sentences = [
      `[VI] Bạn có biết sự thật gây kinh ngạc đằng sau ${topic} chưa?`,
      `[EN] Most people miss the most fascinating detail hidden inside ${topic}.`,
      `[VI] Khi quan sát cận cảnh, từng chi tiết nhỏ đều ẩn chứa quy luật đầy bất ngờ.`,
      `[EN] Thank you!`,
    ];
  } else if (/kim tự tháp|ai cập|pharaoh/i.test(topic)) {
    sentences = [
      'Làm thế nào người Ai Cập cổ đại có thể dựng nên những kim tự tháp khổng lồ với độ chính xác gần như tuyệt đối?',
      'Hơn 138 kim tự tháp đã được tìm thấy, trong đó Đại Kim tự tháp Giza gồm hơn 2,3 triệu khối đá nặng hàng chục tấn.',
      'Nhiều hành lang bí ẩn bên trong kim tự tháp hướng thẳng về các chòm sao cổ xưa với kỹ thuật thiên văn đáng kinh ngạc.',
      isShort ? 'Cảm ơn bạn đã xem!' : 'Cảm ơn bạn đã cùng khám phá kỳ quan cổ đại này!',
    ];
  } else if (/đại dương|mariana|biển/i.test(topic)) {
    sentences = [
      'Hơn tám mươi phần trăm đại dương sâu thẳm trên Trái Đất vẫn chưa từng được con người đặt chân tới.',
      'Ở độ sâu tối đen hàng nghìn mét, nhiều sinh vật biển tự phát sáng rực rỡ để săn mồi giữa bóng tối.',
      'Tại đáy rãnh Mariana, áp suất nước lớn gấp hơn một nghìn lần mặt đất nhưng sự sống vẫn tồn tại.',
      isShort ? 'Cảm ơn bạn đã xem!' : 'Cảm ơn bạn đã đồng hành khám phá đại dương xanh!',
    ];
  } else if (/mèo|hộp/i.test(topic)) {
    sentences = [
      'Vì sao một chú mèo sẵn sàng bỏ qua chiếc giường êm ái để chui vào hộp giấy chật chội?',
      'Theo bản năng săn mồi tự nhiên, không gian kín bốn phía giúp mèo cảm thấy an toàn và giảm căng thẳng.',
      'Bìa cứng còn giữ nhiệt cơ thể cực tốt, biến chiếc hộp nhỏ thành tổ ấm lý tưởng cho mèo ngủ say.',
      'Thử đặt một chiếc hộp cạnh góc làm việc xem boss nhà bạn có lập tức chiếm đóng không nhé! Cảm ơn bạn!',
    ];
  } else if (/tập trung|thói quen|sáng/i.test(topic)) {
    sentences = [
      'Chỉ cần thay đổi 15 phút đầu tiên mỗi sáng, khả năng tập trung cả ngày của bạn sẽ tăng gấp đôi.',
      'Thói quen mở điện thoại ngay khi vừa tỉnh giấc khiến não bộ bị quá tải bởi hàng loạt thông báo.',
      'Thay vào đó, hãy uống một ly nước ấm, đón ánh nắng tự nhiên và viết ra đúng 3 việc quan trọng nhất.',
      'Áp dụng thử ngay sáng mai để cảm nhận sự khác biệt rõ rệt! Cảm ơn bạn!',
    ];
  } else {
    sentences = [
      `Ít ai ngờ rằng đằng sau ${topic} lại ẩn chứa một sự thật thú vị đến vậy.`,
      `Khi tìm hiểu sâu hơn về ${topic}, những chi tiết tưởng nhỏ bé lại quyết định kết quả lớn nhất.`,
      `Các quan sát thực tế cho thấy chỉ cần hiểu đúng quy luật này, góc nhìn của bạn sẽ thay đổi hoàn toàn.`,
      isShort ? 'Cảm ơn bạn đã xem!' : `Cảm ơn bạn đã theo dõi chủ đề hôm nay!`,
    ];
  }

  const finalSentences = padOrSliceSentences(sentences, count, topic, language, scriptStyle);
  const scenePrompts = buildScenePromptsFromScript(finalSentences, topic, terms);
  return {
    script: finalSentences.join('\n'),
    terms,
    scenePrompts,
  };
}

export function validateRenderConfig(config: RenderJobConfig): string | null {
  if (!config.script.trim()) {
    return 'Vui lòng nhập hoặc bấm tạo lời thoại trước khi xuất video.';
  }
  if (config.clipDurationSec < 2 || config.clipDurationSec > 20) {
    return 'Thời lượng mỗi đoạn cảnh nền cần nằm trong khoảng 2 đến 20 giây.';
  }
  if (config.voiceRate < 0.75 || config.voiceRate > 1.6) {
    return 'Tốc độ giọng đọc hợp lệ từ 0.75x đến 1.6x.';
  }
  if (config.subtitle.fontSize < 20 || config.subtitle.fontSize > 96) {
    return 'Cỡ chữ phụ đề hợp lệ từ 20px đến 96px.';
  }
  return null;
}

export const RANDOM_XFADE_POOL = [
  'fade',
  'dissolve',
  'slideleft',
  'slideright',
  'wipeleft',
  'wiperight',
  'smoothleft',
  'smoothright',
  'circleopen',
  'radial',
  'fadeblack',
  'horzopen',
  'vertopen',
] as const;

export function resolveXfadeTransition(
  mode: VideoTransitionMode,
  cutIndex: number,
  seed = 1337
): string {
  if (mode === 'none') return 'none';
  if (mode === 'slide') return 'slideleft';
  if (mode === 'random') {
    const idx = Math.abs((seed * 31 + cutIndex * 17) % RANDOM_XFADE_POOL.length);
    return RANDOM_XFADE_POOL[idx];
  }
  return mode;
}

/**
 * Splits long TTS paragraphs (e.g., full answer recaps / end summaries) into <= maxLen
 * character chunks along natural sentence/clause boundaries so Google TTS never returns HTTP 400/413.
 */
export function splitTtsTextChunks(text: string, maxLen = 170): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentenceUnits = clean
    .split(/(?<=[。！？.!?;；])\s*/u)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = '';

  const flushBuffer = () => {
    if (buffer.trim()) {
      chunks.push(buffer.trim());
      buffer = '';
    }
  };

  for (const unit of sentenceUnits) {
    if (unit.length > maxLen) {
      flushBuffer();
      const subUnits = unit
        .split(/(?<=[,、，])\s*/u)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const sub of subUnits) {
        if (sub.length <= maxLen) {
          if (!buffer) {
            buffer = sub;
          } else if (`${buffer} ${sub}`.length <= maxLen) {
            buffer = `${buffer} ${sub}`;
          } else {
            flushBuffer();
            buffer = sub;
          }
        } else {
          flushBuffer();
          const words = sub.split(/\s+/);
          if (words.length > 1) {
            for (const w of words) {
              if (!buffer) {
                buffer = w;
              } else if (`${buffer} ${w}`.length <= maxLen) {
                buffer = `${buffer} ${w}`;
              } else {
                flushBuffer();
                buffer = w;
              }
            }
          } else {
            for (let i = 0; i < sub.length; i += maxLen) {
              chunks.push(sub.slice(i, i + maxLen));
            }
          }
        }
      }
      flushBuffer();
      continue;
    }

    if (!buffer) {
      buffer = unit;
    } else if (`${buffer} ${unit}`.length <= maxLen) {
      buffer = `${buffer} ${unit}`;
    } else {
      flushBuffer();
      buffer = unit;
    }
  }
  flushBuffer();
  return chunks.length > 0 ? chunks : [clean.slice(0, maxLen)];
}

/**
 * Splits a long list of clips into memory-safe batches for FFmpeg xfade processing
 * so long videos (30–120+ clips) never exceed open decoder / memory / timeout limits.
 */
export function planXfadeMergeBatches<T>(items: T[], maxBatchSize = 6): T[][] {
  if (items.length === 0) return [];
  const safeSize = Math.max(2, Math.floor(maxBatchSize));
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += safeSize) {
    const slice = items.slice(i, i + safeSize);
    if (slice.length === 1 && batches.length > 0) {
      const prev = batches[batches.length - 1];
      if (prev.length >= 3) {
        const borrowed = prev.pop()!;
        batches.push([borrowed, slice[0]]);
      } else {
        prev.push(slice[0]);
      }
    } else {
      batches.push(slice);
    }
  }
  return batches;
}

const STUDY_ENERGY_FALLBACK_EMOJIS = ['🔥', '🚀', '⚡', '💡', '🎯'] as const;

export function pickStudyEnergyEmoji(
  subject: string,
  script = '',
  scriptStyle?: ScriptStyle,
  language?: LanguageCode
): string {
  const combined = `${subject} ${script}`.trim();
  if (/面接|自己PR|interview|phỏng vấn|tuyển dụng|công sở|kế hoạch|planning|business|đánh giá|評価/i.test(combined)) {
    return '💼';
  }
  if (/5s|phản xạ|thử thách|challenge|瞬間英作文|quiz|riddle|đố vui/i.test(combined) || scriptStyle === 'language_challenge' || scriptStyle === 'quiz_riddle') {
    return '⚡';
  }
  if (/tiếng anh|tiếng nhật|english|japanese|日本語|英語|học|từ vựng|giao tiếp|ngôn ngữ|nói sao|luyện/i.test(combined) || (language && isBilingualLanguage(language))) {
    return '🔥';
  }
  if (/đại dương|biển|mariana|ocean|rừng|núi|thiên nhiên|nature|海|深海/i.test(combined)) {
    return '🌊';
  }
  if (/não bộ|tâm lý|khoa học|vũ trụ|công nghệ|ai|robot|science|space|brain|physics|psychology|宇宙|脳/i.test(combined)) {
    return '🧠';
  }
  if (/thói quen|buổi sáng|tập trung|động lực|morning|focus|habit|朝/i.test(combined) || scriptStyle === 'motivational') {
    return '☀️';
  }
  if (/cà phê|coffee|ẩm thực|nấu ăn|food|cafe|コーヒー/i.test(combined)) {
    return '☕';
  }
  if (/lịch sử|cổ đại|kim tự tháp|bí ẩn|history|ancient|pyramid|nhật bản|japan|tokyo/i.test(combined)) {
    return '✨';
  }

  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) >>> 0;
  }
  return STUDY_ENERGY_FALLBACK_EMOJIS[hash % STUDY_ENERGY_FALLBACK_EMOJIS.length];
}

export function slugifyOutputFilename(
  subject: string,
  fallback = '🚀 Video học tập',
  options?: {
    script?: string;
    scriptStyle?: ScriptStyle;
    language?: LanguageCode;
    includeEmoji?: boolean;
  }
): string {
  const raw = subject
    .replace(/_/g, ' ')
    .replace(/[/\\:*?"<>|\r\n]+/g, ' ')
    .replace(/[【】「」『』\[\]()""''“”‘’]/g, ' ')
    .replace(/[,.;!?。！？、・]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!raw) {
    return fallback.replace(/_/g, ' ').replace(/\s+/g, ' ').trim() || '🚀 Video học tập';
  }

  const trimmed =
    raw.length > 52
      ? raw.slice(0, 52).replace(/\s+\S*$/, '').trim() || raw.slice(0, 52).trim()
      : raw;

  const alreadyHasEmoji = /^[\p{Extended_Pictographic}]/u.test(trimmed);
  const shouldIncludeEmoji = options?.includeEmoji !== false;

  if (!shouldIncludeEmoji || alreadyHasEmoji) {
    return trimmed;
  }

  const emoji = pickStudyEnergyEmoji(
    subject,
    options?.script ?? '',
    options?.scriptStyle,
    options?.language
  );
  return `${emoji} ${trimmed}`.trim();
}

export function normalizeOutputSubdir(input?: string): string {
  const raw = (input ?? '').trim().replace(/\\/g, '/');
  if (!raw || raw === '.' || raw === '/' || raw === 'output' || raw === './output') {
    return 'output';
  }
  const cleanSegments = raw
    .split('/')
    .map((seg) =>
      seg
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
    )
    .filter((seg) => seg && seg !== '.' && seg !== '..');

  if (cleanSegments.length === 0) return 'output';
  if (cleanSegments[0].toLowerCase() === 'output') {
    return cleanSegments.join('/');
  }
  return ['output', ...cleanSegments].join('/');
}

export function buildMediaClipsPlan(
  availableMediaCount: number,
  totalVoiceSec: number,
  clipDurationSec: number,
  concatMode: 'random' | 'sequential',
  seed = 42
): number[] {
  if (availableMediaCount <= 0) return [];
  const safeClipDur = Math.max(2, clipDurationSec);
  const neededClips = Math.max(1, Math.ceil(totalVoiceSec / safeClipDur));
  const indices: number[] = [];

  if (concatMode === 'sequential') {
    for (let i = 0; i < neededClips; i++) {
      indices.push(i % availableMediaCount);
    }
    return indices;
  }

  let s = seed >>> 0;
  for (let i = 0; i < neededClips; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const candidate = s % availableMediaCount;
    if (
      availableMediaCount > 1 &&
      indices.length > 0 &&
      indices[indices.length - 1] === candidate
    ) {
      indices.push((candidate + 1) % availableMediaCount);
    } else {
      indices.push(candidate);
    }
  }
  return indices;
}

export function updateScriptLinePreservingTag(
  script: string,
  nonEmptyLineIdx: number,
  nextCleanText: string
): string {
  const allLines = script.replace(/\r\n/g, '\n').split('\n');
  let nonEmptySeen = -1;
  for (let i = 0; i < allLines.length; i++) {
    if (!allLines[i].trim()) continue;
    nonEmptySeen += 1;
    if (nonEmptySeen === nonEmptyLineIdx) {
      const orig = allLines[i];
      const prefixMatch = orig.match(
        /^(\s*(?:\[(?:V1|V2|1|2|A|B|Q|VI|EN|JA|ANSWER|QUESTION|TITLE|SUBTITLE|INTRO|OUTRO)\]\s*)?(?:(?:Tiêu\s*đề\s*nhỏ|Tiêu\s*đề|Mở\s*đầu|Kết\s*thúc|Subheading|Subtitle|Heading|Title|Intro|Outro|Q|A|Question|Answer|Câu\s*hỏi|Trả\s*lời|Speaker\s*[12]|Người\s*[12]|English|Japanese|Vietnamese|Tiếng\s*Anh|Tiếng\s*Nhật|Tiếng\s*Việt)\s*[:：]\s*)?)/i
      );
      const pauseMatch = orig.match(/(\s*\[PAUSE(?::\d+(?:\.\d+)?)?\]\s*)$/i);
      const prefix = prefixMatch?.[1] ?? '';
      const suffix = pauseMatch ? ` ${pauseMatch[1].trim()}` : '';
      allLines[i] = `${prefix}${nextCleanText.replace(/\r?\n/g, ' ').trim()}${suffix}`.trim();
      break;
    }
  }
  return allLines.join('\n');
}

