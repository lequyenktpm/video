import {
  FullAnswerRecapMode,
  LanguageCode,
  RenderJobConfig,
  ScriptStyle,
  SubtitleConfig,
  SubtitleCue,
  SubtitleEffect,
  VideoAspectRatio,
  VideoQuality,
  VideoTransitionMode,
  VoiceOptionId,
} from './types';

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
    .replace(/^\s*\[(?:V1|V2|1|2|A|B|Q|VI|EN|JA|ANSWER|QUESTION)\]\s*/i, '')
    .replace(
      /^\s*(?:Q|A|Question|Answer|Câu\s*hỏi|Trả\s*lời|Speaker\s*[12]|Người\s*[12]|English|Japanese|Vietnamese|Tiếng\s*Anh|Tiếng\s*Nhật|Tiếng\s*Việt)\s*[:：]\s*/i,
      ''
    )
    .replace(/\s*\[PAUSE(?::\d+(?:\.\d+)?)?\]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface PlannedNarrationSegment {
  text: string;
  voiceId: VoiceOptionId;
  voiceSlot: 'primary' | 'secondary';
  detectedLang: 'vi' | 'en' | 'ja';
  pauseAfterSec: number;
  pauseKind?: 'thinking' | 'repeat' | 'recap';
  segmentKind?: 'speech' | 'recap' | 'summary';
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

function isOutroCtaLine(cleanText: string): boolean {
  return /theo dõi|đăng ký|lưu video|bình luận|chia sẻ|follow|subscribe|save this|comment|保存|フォロー|コメント|チャンネル登録/i.test(
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
    const sampleQuestion = (questions[0] ?? cleanSubject).replace(/[?!。？！]+$/g, '').trim();
    const firstKey = (targetHighlights[0] ?? '').replace(/[.!?。！？]+$/g, '').trim();
    const count = Math.max(1, targetHighlights.length || sourceHighlights.length);

    if (primaryLang === 'ja' || language === 'ja_en') {
      const qPart = sampleQuestion ? `「${sampleQuestion.slice(0, 48)}」について、` : '';
      const keyPart = firstKey ? `「${firstKey.slice(0, 56)}」などの` : '';
      return {
        voiceLang: 'ja',
        text: `今日のまとめ：${qPart}${keyPart}実践フレーズを${count}つ学びました。ぜひ声に出して復習しましょう！`,
      };
    }
    if (primaryLang === 'en' && !isBilingualLanguage(language)) {
      const qPart = sampleQuestion ? `on "${sampleQuestion.slice(0, 55)}"` : 'today';
      return {
        voiceLang: 'en',
        text: `Quick recap: we practiced ${count} key expressions ${qPart}. Review them out loud to lock them in!`,
      };
    }
    const qPart = sampleQuestion ? `chủ đề "${sampleQuestion.slice(0, 52)}" ` : '';
    const keyPart = firstKey ? `với mẫu câu trọng tâm "${firstKey.slice(0, 56)}"` : '';
    return {
      voiceLang: 'vi',
      text: `Tóm tắt bài học hôm nay: chúng ta đã luyện ${count} câu trả lời ${qPart}${keyPart}.`,
    };
  }

  // Knowledge / storytelling / tips video summary
  const middleFacts = sourceHighlights.filter((s) => !isOutroCtaLine(s));
  const coreFact = (middleFacts[1] ?? middleFacts[0] ?? '').replace(/[.!?。！？]+$/g, '').trim();
  if (!coreFact && !cleanSubject) return null;

  if (primaryLang === 'ja') {
    const topicLabel = cleanSubject || '今日のテーマ';
    return {
      voiceLang: 'ja',
      text: coreFact
        ? `今日のまとめ：${topicLabel}について、${coreFact.slice(0, 75)}という大切な知識を学びました。`
        : `今日のまとめ：${topicLabel}の重要なポイントを振り返りました。`,
    };
  }
  if (primaryLang === 'en') {
    const topicLabel = cleanSubject || 'this topic';
    return {
      voiceLang: 'en',
      text: coreFact
        ? `Key takeaway on ${topicLabel}: ${coreFact.slice(0, 90)}.`
        : `Key takeaway: remember the core insights we explored about ${topicLabel}.`,
    };
  }
  const topicLabel = cleanSubject || 'chủ đề hôm nay';
  return {
    voiceLang: 'vi',
    text: coreFact
      ? `Tóm tắt kiến thức hôm nay: qua chủ đề ${topicLabel}, điểm đáng nhớ nhất là ${coreFact.slice(0, 95)}.`
      : `Tóm tắt kiến thức hôm nay: chúng ta đã cùng tìm hiểu những góc nhìn nổi bật về ${topicLabel}.`,
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
    /^\s*(?:Q|Question|Câu\s*hỏi|Answer|Trả\s*lời|English|Japanese|Vietnamese|Tiếng\s*Anh|Tiếng\s*Nhật|Tiếng\s*Việt)\s*[:：]/i.test(
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
    if (hasJaLine && hasEnTarget) {
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

  let pendingOutroLines: string[] = [];
  const mainLines = [...rawLines];
  if (
    summarizeAtEnd &&
    mainLines.length >= 2 &&
    isOutroCtaLine(stripNarrationTags(mainLines[mainLines.length - 1]))
  ) {
    pendingOutroLines = [mainLines.pop()!];
  }

  const processLine = (rawLine: string, lineIdx: number, totalCount: number) => {
    const pauseMatch = rawLine.match(/\[PAUSE(?::(\d+(?:\.\d+)?))?\]/i);
    const explicitPauseSec = pauseMatch
      ? pauseMatch[1]
        ? Math.max(0.5, Math.min(10, parseFloat(pauseMatch[1])))
        : Math.max(1.0, basePause || 5.0)
      : 0;

    const isQuestionHeader = /^\s*(?:Q|Question|Câu\s*hỏi)\s*[:：]/i.test(rawLine);
    const isAnswerHeader =
      hasExplicitQaSyntax && /^\s*(?:A|Answer|Trả\s*lời)\s*[:：]/i.test(rawLine);

    if (isQuestionHeader) {
      flushAnswerRecap();
      inAnswerBlock = false;
    } else if (isAnswerHeader) {
      flushAnswerRecap();
      inAnswerBlock = true;
    }

    let explicitSlot: 'primary' | 'secondary' | null = null;
    let explicitLangTag: 'vi' | 'en' | 'ja' | null = null;

    if (
      /^\s*\[(?:V1|1|A)\]/i.test(rawLine) ||
      (!hasExplicitQaSyntax && /^\s*(?:A|Speaker\s*1|Người\s*1)\s*[:：]/i.test(rawLine))
    ) {
      explicitSlot = 'primary';
    } else if (
      /^\s*\[(?:V2|2|B)\]/i.test(rawLine) ||
      /^\s*(?:B|Speaker\s*2|Người\s*2)\s*[:：]/i.test(rawLine)
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
        (config.scriptStyle === 'bilingual_dialogue' || config.scriptStyle === 'quiz_riddle') &&
        lineIdx % 2 === 1
      ) {
        chosenVoice = secondaryVoice;
        chosenSlot = 'secondary';
      }
    }

    if (isQuestionHeader) {
      collectedQuestions.push(cleanText);
    }

    const looksLikeIntro =
      lineIdx === 0 &&
      totalCount >= 3 &&
      /chào mừng|sẵn sàng|thử thách|welcome|ready|challenge|クイズ|チャレンジ|スタート/i.test(
        cleanText
      );

    if (chosenSlot === 'secondary') {
      collectedTargetHighlights.push(cleanText);
      if (inAnswerBlock) {
        answerTargetSentences.push(cleanText);
      }
    } else if (!looksLikeIntro && !isOutroCtaLine(cleanText)) {
      collectedSourceHighlights.push(cleanText);
      if (inAnswerBlock) {
        answerSourceSentences.push(cleanText);
      }
    }

    const isQuestionPrompt =
      isChallengeMode &&
      chosenSlot === 'primary' &&
      lineIdx < totalCount - 1 &&
      !looksLikeIntro &&
      !inAnswerBlock &&
      (/[?？]/.test(cleanText) || isQuestionHeader || totalCount <= 2);

    const isLastLine = lineIdx === totalCount - 1 && pendingOutroLines.length === 0 && !summarizeAtEnd;
    let finalPostLinePause = 0;
    let finalPauseKind: PlannedNarrationSegment['pauseKind'] = undefined;

    if (explicitPauseSec > 0) {
      finalPostLinePause = explicitPauseSec;
      finalPauseKind = 'thinking';
    } else if (!isLastLine) {
      if (isChallengeMode) {
        if (isQuestionPrompt) {
          finalPostLinePause = basePause || 5.0;
          finalPauseKind = 'thinking';
        } else if (basePause > 0) {
          finalPostLinePause = 0.55;
        }
      } else {
        finalPostLinePause = basePause;
        if (basePause >= 1.5) finalPauseKind = 'thinking';
      }
    }

    const isTargetForRepeat =
      chosenSlot === 'secondary' &&
      targetRepeatCount > 0 &&
      (detectedLang !== primaryLang ||
        Boolean(explicitLangTag) ||
        isBilingualLanguage(config.language) ||
        config.scriptStyle === 'language_challenge');

    const subChunks = splitScriptSentences(cleanText, 165);
    const totalReads = isTargetForRepeat ? 1 + targetRepeatCount : 1;

    for (let readPass = 0; readPass < totalReads; readPass++) {
      const isLastPass = readPass === totalReads - 1;
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
        });
      });
    }
  };

  mainLines.forEach((line, idx) => processLine(line, idx, mainLines.length));
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
      processLine(line, idx, pendingOutroLines.length)
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
    });
  }
  return result;
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
    if (cue.isCountdown) {
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

    if (clean.length <= effectiveLimit) {
      result.push({
        index: nextIdx++,
        startSec: cue.startSec,
        endSec: cue.endSec,
        text: clean,
        voiceSlot: cue.voiceSlot,
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
    let cursor = cue.startSec;
    segments.forEach((seg, idx) => {
      const share = seg.length / totalChars;
      const end =
        idx === segments.length - 1 ? cue.endSec : Math.min(cue.endSec, cursor + totalDur * share);
      result.push({
        index: nextIdx++,
        startSec: cursor,
        endSec: Math.max(cursor + 0.25, end),
        text: seg,
        voiceSlot: cue.voiceSlot,
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
  pos?: { width: number; height: number; alignment: number; marginV: number }
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

  if (effect === 'karaoke') {
    const totalCs = Math.max(15, Math.round(durationSec * 100));
    const totalWeights = Math.max(
      1,
      spokenTokens.reduce((acc, t) => acc + Math.max(1, t.trim().length), 0)
    );
    let allocatedCs = 0;
    let spokenSeen = 0;

    return tokens
      .map((token) => {
        if (token === '\n') return '\\N';
        spokenSeen++;
        const isLast = spokenSeen === spokenTokens.length;
        const weight = Math.max(1, token.trim().length);
        const cs = isLast
          ? Math.max(5, totalCs - allocatedCs)
          : Math.max(5, Math.round((totalCs * weight) / totalWeights));
        allocatedCs += cs;
        return `{\\kf${cs}}${escapeAssText(token)}`;
      })
      .join('');
  }

  // Typewriter: reveal words sequentially over the first 75% of the cue duration
  const revealWindowMs = Math.max(250, Math.round(durationSec * 750));
  const stepMs = revealWindowMs / Math.max(1, spokenTokens.length);
  let spokenIdx = 0;

  return tokens
    .map((token) => {
      if (token === '\n') return '\\N';
      const tStart = Math.round(spokenIdx * stepMs);
      const tEnd = Math.round(tStart + Math.min(60, Math.max(25, stepMs * 0.55)));
      spokenIdx++;
      if (tStart === 0) {
        return escapeAssText(token);
      }
      return `{\\alpha&HFF&\\t(${tStart},${tEnd},\\alpha&H00&)}${escapeAssText(token)}`;
    })
    .join('');
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

  // Always keep crisp vector outline font (Noto Sans / DejaVu Sans / Liberation Sans / JetBrains Mono)
  // so Vietnamese & English text stays sharp; fontconfig falls back per-glyph for any CJK characters.
  const effectiveFontName = subtitle.fontName || 'Noto Sans';

  const hasAnyCjk = cues.some((c) => hasCjkChars(c.text));
  const latinBudget = getSubtitleWrapBudget(subtitle, width, height, false);
  const cjkBudget = getSubtitleWrapBudget(subtitle, width, height, true);

  const isBox = subtitle.boxStyle === 'dark_box';
  const borderStyle = isBox ? 3 : 1;
  const backColour = isBox ? '&H66000000' : '&H99000000';

  const secondaryTextColour =
    subtitle.textColor.toUpperCase() === '#FACC15' ? '&H00F8BD38' : '&H0015CCFA';
  const secPrimary = effect === 'karaoke' ? highlightColour : secondaryTextColour;
  const secSecondary = effect === 'karaoke' ? '&H00F8BD38' : '&H000000FF';

  const countdownFontSize = Math.max(36, Math.round(latinBudget.scaledFontSize * 2.25));
  const countdownOutline = Math.max(3.2, Number((latinBudget.outlineWidth * 1.65).toFixed(1)));
  const countdownShadow = Math.max(1.5, Number((latinBudget.shadowDepth * 1.4).toFixed(1)));

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
    `Style: Countdown,${effectiveFontName},${countdownFontSize},${highlightColour},&H00FFFFFF,${outlineColour},&H80000000,-1,0,0,0,100,100,0,0,1,${countdownOutline.toFixed(1)},${countdownShadow.toFixed(1)},5,20,20,0,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const events = cues.map((cue) => {
    if (cue.isCountdown) {
      const cleanNum = escapeAssText(cue.text.trim());
      return `Dialogue: 1,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},Countdown,,0,0,0,,{\\fscx62\\fscy62\\t(0,145,\\fscx120\\fscy120)\\t(145,280,\\fscx100\\fscy100)\\fad(30,110)}${cleanNum}`;
    }
    const cueIsCjk = hasAnyCjk && hasCjkChars(cue.text) && !cue.text.includes(' ');
    const wrapMax = cueIsCjk ? cjkBudget.maxCharsPerLine : latinBudget.maxCharsPerLine;
    const wrapped = wrapSubtitleLine(cue.text, wrapMax);
    const dur = Math.max(0.25, cue.endSec - cue.startSec);
    const formattedBody = formatAssCueBody(wrapped, dur, effect, {
      width,
      height,
      alignment,
      marginV,
    });
    const styleName = cue.voiceSlot === 'secondary' ? 'Secondary' : 'Default';
    return `Dialogue: 0,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},${styleName},,0,0,0,,${formattedBody}`;
  });

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
  mode?: 'all_in_one' | 'from_subject';
  verifiedFacts?: string[];
}): string {
  const { subject, language, scriptStyle, sentenceCount, mode = 'from_subject', verifiedFacts = [] } = params;
  const count = Math.max(2, Math.min(25, Math.round(sentenceCount)));
  const cleanSubject = subject.trim();

  const styleDesc: Record<ScriptStyle, string> = {
    curious_facts:
      'Mở đầu bằng câu hỏi hoặc sự thật có thực gây tò mò trong 3 giây đầu, sau đó đưa ra các dữ kiện, con số và sự thật khoa học/lịch sử chính xác.',
    storytelling:
      'Kể lại câu chuyện/sự kiện có thật mạch lạc, giàu hình ảnh, tôn trọng đúng mốc thời gian và nhân vật/địa danh thực tế.',
    tips_howto: 'Đi thẳng vào vấn đề, liệt kê kiến thức hoặc mẹo thực tế có cơ sở khoa học rõ ràng, dễ áp dụng.',
    news_fast: 'Nhịp độ nhanh, súc tích, nêu thông tin sự kiện có thật đắt giá ngay câu đầu tiên.',
    language_challenge:
      'Thử thách phản xạ học dịch câu kiểu Instant Translation / 瞬間英作文. BẮT BUỘC đủ 3 phần: (1) Câu Intro mở đầu giới thiệu thử thách, (2) Các cặp câu hỏi tiếng mẹ đẻ gắn [PAUSE] ở cuối + câu đáp án tự nhiên bằng ngoại ngữ (kèm tag [VI]/[JA]/[EN]), (3) Câu Outro kết thúc kêu gọi lưu video/bình luận.',
    bilingual_dialogue:
      'Hội thoại / Podcast 2 người đối đáp tự nhiên, mỗi lượt nói 1 dòng gắn tag [V1] hoặc [V2] (hoặc [VI]/[EN]/[JA]) để 2 giọng đọc luân phiên.',
    quiz_riddle:
      'Đố vui kiến thức có thực: đặt câu hỏi kèm [PAUSE] cho người xem đoán, rồi bật mí đáp án chính xác dựa trên sự thật.',
    motivational:
      'Truyền cảm hứng, triết lý sống sâu sắc, nhịp chậm truyền cảm, câu văn súc tích đọng lại cảm xúc.',
    top_list:
      'Dạng Top xếp hạng (Top 3 / Top 5) gồm các sự kiện, địa danh hoặc dữ kiện có thật từ ít bất ngờ đến gây kinh ngạc nhất.',
  };

  let langDesc =
    'Viết cả "subject" và "script" 100% bằng tiếng Việt tự nhiên để đọc thành tiếng (không dùng emoji, không hashtag, không ghi "MC:" hay "Người dẫn:").';
  if (language === 'en') {
    langDesc =
      'Write BOTH "subject" and "script" 100% in crisp, natural conversational English (no Vietnamese, no emojis, no hashtags, no speaker labels).';
  } else if (language === 'ja') {
    langDesc =
      '「subject」と「script」は100%自然な日本語のみで書いてください（ベトナム語や絵文字・ハッシュタグ・話者ラベルは絶対に含めないでください）。1文ごとに改行してください。';
  } else if (language === 'bilingual') {
    langDesc =
      'Write alternating lines in Vietnamese (tagged [VI] at line start) and natural English (tagged [EN] at line start) so dual voices read each language with native pronunciation. Add [PAUSE] at the end of question/challenge lines when helpful.';
  } else if (language === 'vi_ja') {
    langDesc =
      'Write alternating lines in Vietnamese (tagged [VI] at line start) and natural Japanese (tagged [JA] at line start) so dual voices read each language with native pronunciation. Add [PAUSE] at the end of challenge lines when helpful.';
  } else if (language === 'ja_en') {
    langDesc =
      'Write alternating lines in natural Japanese (tagged [JA] at line start) and natural English (tagged [EN] at line start), following the 1-minute Instant Translation (瞬間英作文) style. Add [PAUSE] at the end of the Japanese prompt line before the English answer.';
  }

  const factualRule =
    scriptStyle === 'language_challenge' || scriptStyle === 'bilingual_dialogue'
      ? ''
      : '\nNGUYÊN TẮC SỰ THẬT: Chỉ trình bày kiến thức, sự kiện, số liệu và tên riêng CÓ THẬT trong lịch sử/khoa học/tin tức thực tế. Tuyệt đối KHÔNG bịa đặt hay hư cấu chi tiết giả.';

  const verifiedBlock =
    verifiedFacts.length > 0
      ? `\nDỮ LIỆU THỰC TẾ ĐÃ XÁC MINH (Wikipedia / Tin tức thực tế — hãy ưu tiên sử dụng các dữ kiện này):\n${verifiedFacts
          .slice(0, 10)
          .map((f, i) => `${i + 1}. ${f}`)
          .join('\n')}\n`
      : '';

  if (mode === 'all_in_one') {
    const nicheHint = cleanSubject
      ? `Hướng/lĩnh vực tham khảo (có thể mở rộng sáng tạo nếu muốn): "${cleanSubject}". Nếu từ khóa đang ở ngôn ngữ khác, hãy chuyển sang chủ đề mới thuần ngôn ngữ đích.`
      : 'Tự chọn 1 chủ đề kiến thức, địa danh, hiện tượng khoa học hoặc sự kiện lịch sử CÓ THẬT (vũ trụ, tâm lý học, lịch sử, tự nhiên, công nghệ). Tránh chủ đề hư cấu hoặc lặp lại nhàm chán.';

    return `Bạn là đạo diễn nội dung & biên kịch video ngắn (TikTok / YouTube Shorts / Reels) chuẩn MoneyPrinterTurbo.
Nhiệm vụ trọn gói (All-in-One): Bạn hãy TỰ CHỌN CHỦ ĐỀ CÓ THẬT hấp dẫn, VIẾT KỊCH BẢN chi tiết, và ĐỀ XUẤT TỪ KHÓA TÌM ẢNH / VIDEO B-ROLL chuẩn cho từng cảnh quay.
${nicheHint}
Phong cách: ${styleDesc[scriptStyle]}
${langDesc}${factualRule}${verifiedBlock}
Yêu cầu BẮT BUỘC:
1. "subject": Tên chủ đề thu hút bằng ngôn ngữ mục tiêu (ngắn gọn 6-14 từ, gây tò mò ngay khi đọc).
2. "script": Gồm đúng ${count} dòng ngắn gọn đọc thành tiếng, mỗi câu/lượt nói nằm trên 1 dòng riêng biệt. Nếu là song ngữ/2 giọng, gắn tag [VI]/[EN]/[JA] hoặc [V1]/[V2] đầu dòng và dùng [PAUSE] sau câu hỏi thử thách.
3. "terms": Mảng gồm 4-6 cụm từ khóa tìm kiếm bằng tiếng Anh ngắn gọn (2-3 từ mỗi cụm, ví dụ: "black hole galaxy", "friends talking cafe") để hệ thống tự động tìm video MP4 & ảnh thật trên kho miễn phí.
4. "scenePrompts": Mảng gồm đúng ${count} cụm từ khóa / mô tả hình ảnh-video bằng tiếng Anh tương ứng 1-1 với từng dòng trong "script" (rõ chủ thể, bối cảnh, ánh sáng điện ảnh, không chữ trên ảnh).

Chỉ trả về đúng 1 khối JSON hợp lệ theo mẫu sau (không giải thích thừa bên ngoài JSON):
{
  "subject": "Tiêu đề chủ đề thuần ngôn ngữ đích",
  "script": "Dòng 1...\\nDòng 2...\\n...",
  "terms": ["english stock keyword 1", "english stock keyword 2", "english stock keyword 3", "english stock keyword 4"],
  "scenePrompts": [
    "cinematic visual query for line 1, photorealistic, 8k, no text",
    "cinematic visual query for line 2, photorealistic, 8k, no text"
  ]
}`;
  }

  return `Bạn là biên kịch chuyên tạo video ngắn (TikTok / YouTube Shorts / Reels) chuẩn MoneyPrinterTurbo.
Chủ đề: "${cleanSubject || 'Kiến thức khoa học thú vị'}"
Phong cách: ${styleDesc[scriptStyle]}
${langDesc}${factualRule}${verifiedBlock}
Yêu cầu BẮT BUỘC:
1. "subject": Chuẩn hóa lại tên chủ đề theo đúng ngôn ngữ đã chọn.
2. "script": Gồm đúng ${count} dòng ngắn gọn, mỗi câu/lượt nói nằm trên 1 dòng riêng biệt.
3. "terms": Mảng gồm 3-6 cụm từ khóa tiếng Anh ngắn (2-3 từ) để tìm stock video & ảnh trên kho miễn phí theo đúng trình tự nội dung.
4. "scenePrompts": Mảng gồm đúng ${count} mô tả cảnh quay bằng tiếng Anh (mỗi mô tả tương ứng 1-1 với từng dòng trong script, tả rõ chủ thể, ánh sáng, góc máy điện ảnh, không chứa chữ viết trên ảnh).

Chỉ trả về đúng JSON hợp lệ theo mẫu sau (không giải thích thừa):
{
  "subject": "${cleanSubject || 'Tiêu đề chủ đề'}",
  "script": "Dòng 1...\\nDòng 2...\\n...",
  "terms": ["keyword one", "keyword two", "keyword three"],
  "scenePrompts": [
    "cinematic visual description for line 1, photorealistic, 8k, no text",
    "cinematic visual description for line 2, photorealistic, 8k, no text"
  ]
}`;
}

/**
 * Parses either structured JSON output (from ChatGPT/Gemini Web, Gemini API, or Pollinations AI)
 * OR plain multi-line script pasted by the user.
 */
export function parseAiWebOrJsonOutput(
  rawText: string,
  subject: string
): { subject?: string; script: string; terms: string[]; scenePrompts: string[] } | null {
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
      };
      const parsedSubject =
        typeof parsed.subject === 'string' && parsed.subject.trim().length > 2
          ? parsed.subject.trim()
          : typeof parsed.title === 'string' && parsed.title.trim().length > 2
          ? parsed.title.trim()
          : undefined;
      const effectiveSubject = parsedSubject || subject;

      const rawScript = Array.isArray(parsed.script)
        ? parsed.script.map((s) => String(s).trim()).filter(Boolean).join('\n')
        : typeof parsed.script === 'string'
        ? parsed.script
        : '';

      if (rawScript.trim().length > 6) {
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
        return { subject: parsedSubject, script: cleanScript, terms, scenePrompts };
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

  const cleanScript = lines.join('\n');
  const sentences = splitScriptSentences(cleanScript);
  const terms = extractEnglishSearchTerms(subject, cleanScript);
  const scenePrompts = buildScenePromptsFromScript(sentences, subject, terms);
  return { script: cleanScript, terms, scenePrompts };
}

const VI_KEYWORD_MAP: Array<[RegExp, string]> = [
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
  [/tập trung|làm việc|học tập|bàn làm việc|sáng tạo|workspace|集中/i, 'workspace desk laptop coffee'],
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
];

export function extractEnglishSearchTerms(subject: string, script: string): string[] {
  const combined = `${subject} ${script}`.trim();
  const matched: string[] = [];

  for (const [pattern, englishTerm] of VI_KEYWORD_MAP) {
    if (pattern.test(combined)) {
      matched.push(englishTerm);
    }
  }

  const asciiWords = subject
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);

  if (asciiWords.length >= 2) {
    matched.push(asciiWords.slice(0, 4).join(' '));
  }

  if (matched.length === 0) {
    matched.push('cinematic nature landscape', 'city sunset timelapse', 'dramatic light rays');
  }

  return Array.from(new Set(matched)).slice(0, 5);
}

export function buildScenePromptsFromScript(
  sentences: string[],
  subject: string,
  terms: string[]
): string[] {
  return sentences.map((sentence, idx) => {
    const matchedForSentence = extractEnglishSearchTerms(sentence, subject);
    const baseConcept =
      terms[idx % Math.max(1, terms.length)] ??
      matchedForSentence[idx % matchedForSentence.length] ??
      'dramatic cinematic scenery';
    const cameraAngles = [
      'wide cinematic establishing shot, dramatic golden lighting',
      'close-up architectural or nature detail, shallow depth of field',
      'dynamic low-angle perspective, atmospheric depth',
      'sweeping aerial view, dramatic natural light rays',
    ];
    return `${baseConcept}, ${cameraAngles[idx % cameraAngles.length]}, photorealistic, high contrast, no text, no watermark`;
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
  if (
    scriptStyle === 'language_challenge' ||
    ((language === 'vi_ja' || language === 'ja_en') &&
      scriptStyle !== 'bilingual_dialogue' &&
      scriptStyle !== 'quiz_riddle')
  ) {
    if (language === 'ja_en') {
      sentences = [
        '[JA] 1分瞬間英作文チャレンジ！今から出す日本語を5秒で英語にしてみましょう！',
        '[JA] 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
        '[EN] Watch out for her!',
        '[JA] 続いて「無理しないでね」はどう言いますか？ [PAUSE]',
        '[EN] Take it easy and don’t push yourself too hard!',
        '[JA] いくつ言えましたか？気に入ったら保存して、毎日声に出して練習しましょう！',
      ];
    } else if (language === 'vi_ja') {
      sentences = [
        '[VI] Thử thách phản xạ dịch câu tiếng Nhật trong 5 giây! Bạn sẵn sàng chưa?',
        '[VI] Câu đầu tiên: "Hôm nay bạn vất vả rồi" nói tiếng Nhật thế nào? [PAUSE]',
        '[JA] 今日もお疲れ様でした！',
        '[VI] Câu thứ 2: "Đừng lo lắng quá nhé" trong tiếng Nhật là gì? [PAUSE]',
        '[JA] あまり心配しないでくださいね！',
        '[VI] Bạn dịch đúng hết chứ? Lưu video lại và bình luận câu bạn muốn học tiếp nhé!',
      ];
    } else if (language === 'ja') {
      sentences = [
        `[V1] 5秒チャレンジ！${topic}の重要フレーズに挑戦しましょう！`,
        `[V1] 質問です。${topic}について正しいのはどちらでしょうか？ [PAUSE]`,
        `[V2] 正解は、多くの人が見落としがちな小さな仕組みに隠されています。`,
        `[V1] いくつ正解できましたか？保存して毎日のトレーニングに役立ててくださいね！`,
      ];
    } else if (language === 'en') {
      sentences = [
        `[V1] Welcome to the 5-second speaking challenge on ${topic}! Ready?`,
        `[V1] Question 1: How do native speakers react smoothly in this situation? [PAUSE]`,
        `[V2] Keep it natural, concise, and confident!`,
        `[V1] How many did you get right? Save this video and practice out loud every day!`,
      ];
    } else {
      sentences = [
        '[VI] Chào mừng bạn đến với thử thách phản xạ dịch câu tiếng Anh trong 5 giây! Sẵn sàng chưa nào?',
        '[VI] Câu 1: "Hãy cẩn thận với cô ấy!" bạn nói tiếng Anh thế nào? [PAUSE]',
        '[EN] Watch out for her!',
        '[VI] Câu 2: "Cứ từ từ, đừng vội nhé!" dịch sang tiếng Anh là gì? [PAUSE]',
        '[EN] Take your time, there is no rush!',
        '[VI] Bạn dịch đúng được mấy câu? Lưu video và bình luận đáp án bên dưới nhé!',
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
        `[EN] Practice out loud with us every day and save this clip for later!`,
      ];
    } else {
      sentences = [
        `[V1] Này bạn, hôm nay chúng ta bàn nhanh về "${topic}" nhé!`,
        `[V2] Quá tuyệt! Điều bất ngờ nhất ở chủ đề này là gì thế?`,
        `[V1] Chính là những chi tiết nhỏ mà hầu hết mọi người đều bỏ qua mỗi ngày.`,
        `[V2] Đúng vậy, thử để ý một chút là thấy cuộc sống thú vị hơn hẳn luôn!`,
      ];
    }
  } else if (scriptStyle === 'quiz_riddle') {
    sentences =
      language === 'ja'
        ? [
            `[V1] 5秒クイズ！${topic}にまつわる驚きの答えが分かりますか？ [PAUSE]`,
            `[V2] 正解は、一見すると逆に見える自然の法則にありました！`,
            `[V1] あなたの予想は当たりましたか？コメントで教えてくださいね！`,
          ]
        : language === 'en'
        ? [
            `[V1] Quick 5-second riddle about ${topic}: can you guess the real answer? [PAUSE]`,
            `[V2] Surprise! The answer lies in a tiny detail most people overlook.`,
            `[V1] Did you get it right? Save this and challenge a friend!`,
          ]
        : [
            `[V1] Đố bạn trong 5 giây về ${topic}: đâu là sự thật ít người đoán trúng? [PAUSE]`,
            `[V2] Đáp án bất ngờ nằm ngay ở chi tiết tưởng như ngược đời nhất!`,
            `[V1] Bạn có đoán đúng không? Chia sẻ cho bạn bè cùng thử sức nhé!`,
          ];
  } else if (scriptStyle === 'motivational') {
    sentences =
      language === 'ja'
        ? [
            `今日、少しだけ立ち止まって${topic}について考えてみませんか。`,
            `大きな変化はいつも、誰にも見えない静かな一歩から始まります。`,
            `昨日の自分より1%だけ前に進むことが、やがて大きな自信に変わります。`,
            `焦らなくて大丈夫。今日のあなたの歩みを心から応援しています！`,
          ]
        : language === 'en'
        ? [
            `Take a quiet breath and think about ${topic} for just ten seconds.`,
            `Every meaningful breakthrough begins with small, unseen consistency.`,
            `You do not need perfection today—just one honest step forward.`,
            `Save this reminder for whenever you need a calm reset.`,
          ]
        : [
            `Dành ra 10 giây hôm nay để suy ngẫm về ${topic} bạn nhé.`,
            `Mọi bứt phá lớn lao đều bắt đầu từ những bước nhỏ âm thầm mỗi ngày.`,
            `Bạn không cần phải hoàn hảo ngay lập tức, chỉ cần kiên trì hơn hôm qua một chút.`,
            `Lưu lại video này làm động lực cho hành trình rực rỡ phía trước nhé!`,
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
            `And number one: you can start applying this immediately today!`,
          ]
        : [
            `Top 3 điều bất ngờ nhất về ${topic} mà ai cũng nên biết một lần.`,
            `Số 3: Những thói quen nhỏ hằng ngày quyết định tới 80% kết quả lâu dài.`,
            `Số 2: Người giỏi nhất luôn tập trung vào những nguyên lý cơ bản nhất.`,
            `Và số 1: Bạn hoàn toàn có thể áp dụng bí quyết này ngay từ hôm nay!`,
          ];
  } else if (language === 'ja') {
    sentences = [
      `ちょっと待ってください、${topic}には多くの人が知らない驚きの秘密があります。`,
      `一見すると普通の光景に見えても、その背景には緻密な仕組みや歴史が隠れています。`,
      `最新の調査や観察によって、${topic}の意外な側面が次々と明らかになってきました。`,
      `小さな視点の違いに気づくだけで、毎日の見方が大きく変わるはずです。`,
      `気になる方は保存して、次回のショート動画もぜひフォローしてくださいね！`,
    ];
  } else if (language === 'en') {
    sentences = [
      `Stop scrolling—what you are about to learn about ${topic} will completely surprise you.`,
      `Even today, scientists and explorers are still uncovering hidden mechanisms behind ${topic}.`,
      `What looks ordinary at first glance actually hides extraordinary energy and precision beneath the surface.`,
      `Researchers found that small historical details completely reshape how we understand ${topic}.`,
      `Follow this channel for more mind-blowing short discoveries every single day.`,
    ];
  } else if (language === 'bilingual') {
    sentences = [
      `[VI] Bạn có biết sự thật gây kinh ngạc đằng sau ${topic} chưa?`,
      `[EN] Most people miss the most fascinating detail hidden inside ${topic}.`,
      `[VI] Khi quan sát cận cảnh, từng chi tiết nhỏ đều ẩn chứa quy luật đầy bất ngờ.`,
      `[EN] Save this video and follow for more bilingual insights every day!`,
    ];
  } else if (/kim tự tháp|ai cập|pharaoh/i.test(topic)) {
    sentences = [
      'Làm thế nào người Ai Cập cổ đại có thể dựng nên những kim tự tháp khổng lồ với độ chính xác gần như tuyệt đối?',
      'Hơn 138 kim tự tháp đã được tìm thấy, trong đó Đại Kim tự tháp Giza gồm hơn 2,3 triệu khối đá nặng hàng chục tấn.',
      'Nhiều hành lang bí ẩn bên trong kim tự tháp hướng thẳng về các chòm sao cổ xưa với kỹ thuật thiên văn đáng kinh ngạc.',
      'Theo dõi kênh để cùng giải mã thêm những kỳ quan bí ẩn của thế giới cổ đại nhé!',
    ];
  } else if (/đại dương|mariana|biển/i.test(topic)) {
    sentences = [
      'Hơn tám mươi phần trăm đại dương sâu thẳm trên Trái Đất vẫn chưa từng được con người đặt chân tới.',
      'Ở độ sâu tối đen hàng nghìn mét, nhiều sinh vật biển tự phát sáng rực rỡ để săn mồi giữa bóng tối.',
      'Tại đáy rãnh Mariana, áp suất nước lớn gấp hơn một nghìn lần mặt đất nhưng sự sống vẫn tồn tại.',
      'Theo dõi kênh để cùng khám phá thêm những bí ẩn kỳ vĩ của hành tinh xanh mỗi ngày nhé!',
    ];
  } else if (/mèo|hộp/i.test(topic)) {
    sentences = [
      'Vì sao một chú mèo sẵn sàng bỏ qua chiếc giường êm ái để chui vào hộp giấy chật chội?',
      'Theo bản năng săn mồi tự nhiên, không gian kín bốn phía giúp mèo cảm thấy an toàn và giảm căng thẳng.',
      'Bìa cứng còn giữ nhiệt cơ thể cực tốt, biến chiếc hộp nhỏ thành tổ ấm lý tưởng cho mèo ngủ say.',
      'Thử đặt một chiếc hộp cạnh góc làm việc xem boss nhà bạn có lập tức chiếm đóng không nhé!',
    ];
  } else if (/tập trung|thói quen|sáng/i.test(topic)) {
    sentences = [
      'Chỉ cần thay đổi 15 phút đầu tiên mỗi sáng, khả năng tập trung cả ngày của bạn sẽ tăng gấp đôi.',
      'Thói quen mở điện thoại ngay khi vừa tỉnh giấc khiến não bộ bị quá tải bởi hàng loạt thông báo.',
      'Thay vào đó, hãy uống một ly nước ấm, đón ánh nắng tự nhiên và viết ra đúng 3 việc quan trọng nhất.',
      'Áp dụng thử ngay sáng mai để cảm nhận sự khác biệt rõ rệt trong hiệu suất làm việc của bạn!',
    ];
  } else {
    sentences = [
      `Ít ai ngờ rằng đằng sau ${topic} lại ẩn chứa một sự thật thú vị đến vậy.`,
      `Khi tìm hiểu sâu hơn về ${topic}, những chi tiết tưởng nhỏ bé lại quyết định kết quả lớn nhất.`,
      `Các quan sát thực tế cho thấy chỉ cần hiểu đúng quy luật này, góc nhìn của bạn sẽ thay đổi hoàn toàn.`,
      `Hãy lưu lại video và theo dõi kênh để không bỏ lỡ những chủ đề hấp dẫn tiếp theo!`,
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
  if (config.subtitle.fontSize < 24 || config.subtitle.fontSize > 80) {
    return 'Cỡ chữ phụ đề hợp lệ từ 24px đến 80px.';
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

export function slugifyOutputFilename(subject: string, fallback = 'video_ngan'): string {
  const raw = subject.trim();
  if (!raw) return fallback;

  // Transliterate Vietnamese characters to clean ASCII while preserving CJK if no Latin words exist
  const noVi = raw
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const cleaned = noVi
    .replace(/[^a-zA-Z0-9\u3040-\u30ff\u4e00-\u9faf\s_-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  if (!cleaned) return fallback;
  return cleaned.slice(0, 56).replace(/_+$/g, '') || fallback;
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
