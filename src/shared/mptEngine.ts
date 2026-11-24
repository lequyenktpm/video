import {
  RenderJobConfig,
  ScriptStyle,
  SubtitleConfig,
  SubtitleCue,
  VideoAspectRatio,
} from './types';

export function getCanvasDimensions(aspectRatio: VideoAspectRatio): {
  width: number;
  height: number;
} {
  if (aspectRatio === '9:16') {
    return { width: 720, height: 1280 };
  }
  if (aspectRatio === '1:1') {
    return { width: 720, height: 720 };
  }
  return { width: 1280, height: 720 };
}

/**
 * Splits a Vietnamese or English script into speakable chunks <= maxLen characters,
 * preserving natural sentence boundaries so TTS and per-scene visuals align accurately.
 */
export function splitScriptSentences(script: string, maxLen = 165): string[] {
  const cleaned = script.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  const rawSentences = cleaned
    .split(/(?<=[.!?…。！？\n])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of rawSentences) {
    if (sentence.length <= maxLen) {
      chunks.push(sentence);
      continue;
    }

    const subParts = sentence.split(/(?<=[,;:])\s+/);
    let buffer = '';
    for (const part of subParts) {
      if ((buffer + ' ' + part).trim().length <= maxLen) {
        buffer = (buffer + ' ' + part).trim();
      } else {
        if (buffer) chunks.push(buffer);
        if (part.length <= maxLen) {
          buffer = part;
        } else {
          const words = part.split(' ');
          let wordBuf = '';
          for (const w of words) {
            if ((wordBuf + ' ' + w).trim().length <= maxLen) {
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
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
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
 * proportionally by character count so captions stay clean and non-intrusive.
 */
export function splitCueIntoShortSubCues(
  cues: SubtitleCue[],
  maxCharsPerCue = 42
): SubtitleCue[] {
  const result: SubtitleCue[] = [];
  let nextIdx = 1;

  for (const cue of cues) {
    const clean = cue.text.replace(/\s+/g, ' ').trim();
    const totalDur = Math.max(0.4, cue.endSec - cue.startSec);
    if (!clean) continue;

    if (clean.length <= maxCharsPerCue) {
      result.push({
        index: nextIdx++,
        startSec: cue.startSec,
        endSec: cue.endSec,
        text: clean,
      });
      continue;
    }

    // Break into balanced word segments near targetLen so chunks stay natural
    const numChunks = Math.max(2, Math.ceil(clean.length / maxCharsPerCue));
    const targetLen = Math.ceil(clean.length / numChunks);
    const words = clean.split(' ');
    const segments: string[] = [];
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

    // Avoid a tiny 1-word trailing orphan by balancing the last two segments
    if (segments.length >= 2) {
      const last = segments[segments.length - 1];
      const prev = segments[segments.length - 2];
      if (last.split(' ').length <= 2 && prev.length + last.length + 1 <= maxCharsPerCue + 10) {
        segments.splice(segments.length - 2, 2, `${prev} ${last}`);
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

export function buildAssFromCues(
  cues: SubtitleCue[],
  subtitle: SubtitleConfig,
  width: number,
  height: number
): string {
  const primaryColour = hexToAssBgr(subtitle.textColor);
  const outlineColour = hexToAssBgr(subtitle.strokeColor);
  const alignment =
    subtitle.position === 'top' ? 8 : subtitle.position === 'center' ? 5 : 2;

  let marginV = Math.round(height * 0.11);
  if (subtitle.position === 'top') {
    marginV = Math.round(height * 0.08);
  } else if (subtitle.position === 'center') {
    marginV = 0;
  } else if (subtitle.position === 'custom') {
    const clampedPct = Math.max(5, Math.min(95, subtitle.customPositionPct));
    marginV = Math.round(((100 - clampedPct) / 100) * height);
  }

  const maxChars = width < height ? 23 : 40;
  const scaledFontSize = Math.max(24, Math.min(72, Math.round(subtitle.fontSize)));
  const isBox = subtitle.boxStyle === 'dark_box';
  const borderStyle = isBox ? 3 : 1;
  const backColour = isBox ? '&H55000000' : '&H70000000';
  const outlineWidth = isBox ? 6 : subtitle.strokeWidth;

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
    `Style: Default,${subtitle.fontName},${scaledFontSize},${primaryColour},&H000000FF,${isBox ? '&H55000000' : outlineColour},${backColour},-1,0,0,0,100,100,0,0,${borderStyle},${outlineWidth.toFixed(1)},${isBox ? 0 : 1.0},${alignment},40,40,${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const events = cues.map((cue) => {
    const wrapped = wrapSubtitleLine(cue.text, maxChars)
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '(')
      .replace(/\}/g, ')')
      .replace(/\n/g, '\\N');
    return `Dialogue: 0,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},Default,,0,0,0,,${wrapped}`;
  });

  return [...header, ...events, ''].join('\n');
}

/**
 * Builds the exact MoneyPrinterTurbo-style prompt for generating both narration script
 * and chronological per-scene visual prompts/keywords (usable in-app OR copyable to ChatGPT/Gemini Web).
 */
export function buildMoneyPrinterPrompt(params: {
  subject: string;
  language: 'vi' | 'en' | 'bilingual';
  scriptStyle: ScriptStyle;
  sentenceCount: number;
}): string {
  const { subject, language, scriptStyle, sentenceCount } = params;
  const count = Math.max(3, Math.min(8, sentenceCount));

  const styleDesc: Record<ScriptStyle, string> = {
    curious_facts: 'Mở đầu bằng câu hỏi hoặc sự thật gây tò mò cực mạnh trong 3 giây đầu, sau đó đưa ra các dữ kiện bất ngờ, cụ thể.',
    storytelling: 'Kể chuyện mạch lạc, giàu hình ảnh, tạo cao trào cảm xúc và kết thúc đọng lại suy ngẫm.',
    tips_howto: 'Đi thẳng vào vấn đề, liệt kê mẹo thực tế ngắn gọn, dễ áp dụng ngay.',
    news_fast: 'Nhịp độ nhanh, súc tích, nêu thông tin đắt giá ngay câu đầu tiên.',
  };

  const langDesc =
    language === 'en'
      ? 'Write the "script" in crisp, natural conversational English.'
      : language === 'bilingual'
      ? 'Write the "script" alternating Vietnamese and short natural English lines.'
      : 'Viết phần "script" hoàn toàn bằng tiếng Việt tự nhiên để đọc thành tiếng (không dùng emoji, không hashtag, không ghi "MC:" hay "Người dẫn:").';

  return `Bạn là biên kịch chuyên tạo video ngắn (TikTok / YouTube Shorts / Reels) chuẩn MoneyPrinterTurbo.
Chủ đề: "${subject}"
Phong cách: ${styleDesc[scriptStyle]}
${langDesc}

Yêu cầu BẮT BUỘC:
1. "script": Gồm đúng ${count} câu ngắn gọn, mỗi câu nằm trên 1 dòng riêng biệt, câu đầu tiên phải giữ chân người xem ngay lập tức.
2. "terms": Mảng gồm 3-5 cụm từ khóa tiếng Anh ngắn (2-3 từ) để tìm stock video trên kho miễn phí theo đúng trình tự nội dung.
3. "scenePrompts": Mảng gồm đúng ${count} mô tả cảnh quay bằng tiếng Anh (mỗi mô tả tương ứng 1-1 với từng câu trong script, tả rõ chủ thể, ánh sáng, góc máy điện ảnh, không chứa chữ viết trên ảnh).

Chỉ trả về đúng JSON hợp lệ theo mẫu sau (không giải thích thừa):
{
  "script": "Câu 1...\\nCâu 2...\\nCâu 3...\\nCâu 4...",
  "terms": ["keyword one", "keyword two", "keyword three"],
  "scenePrompts": [
    "cinematic visual description for sentence 1, photorealistic, 8k, no text",
    "cinematic visual description for sentence 2, photorealistic, 8k, no text",
    "cinematic visual description for sentence 3, photorealistic, 8k, no text",
    "cinematic visual description for sentence 4, photorealistic, 8k, no text"
  ]
}`;
}

/**
 * Parses either structured JSON output (from ChatGPT/Gemini Web or Pollinations AI)
 * OR plain multi-line script pasted by the user.
 */
export function parseAiWebOrJsonOutput(
  rawText: string,
  subject: string
): { script: string; terms: string[]; scenePrompts: string[] } | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        script?: string | string[];
        terms?: string[];
        scenePrompts?: string[];
      };
      const rawScript = Array.isArray(parsed.script)
        ? parsed.script.map((s) => String(s).trim()).filter(Boolean).join('\n')
        : typeof parsed.script === 'string'
        ? parsed.script
        : '';

      if (rawScript.trim().length > 10) {
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
            : extractEnglishSearchTerms(subject, cleanScript);
        const scenePrompts =
          Array.isArray(parsed.scenePrompts) && parsed.scenePrompts.length > 0
            ? parsed.scenePrompts.map((p) => String(p).trim()).filter(Boolean)
            : buildScenePromptsFromScript(sentences, subject, terms);
        return { script: cleanScript, terms, scenePrompts };
      }
    } catch {
      // Fall through to plain-text parsing
    }
  }

  // Plain-text script pasted directly from ChatGPT / Gemini Web
  const lines = trimmed
    .split('\n')
    .map((l) => l.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((l) => l.length > 4 && !l.startsWith('```'));
  if (lines.length === 0) return null;

  const cleanScript = lines.join('\n');
  const sentences = splitScriptSentences(cleanScript);
  const terms = extractEnglishSearchTerms(subject, cleanScript);
  const scenePrompts = buildScenePromptsFromScript(sentences, subject, terms);
  return { script: cleanScript, terms, scenePrompts };
}

const VI_KEYWORD_MAP: Array<[RegExp, string]> = [
  [/cà phê|espresso|latte|rang xay|barista/i, 'coffee espresso barista cafe'],
  [/máy bay|hàng không|bầu trời|bay lượn|phi công/i, 'airplane flight sky clouds'],
  [/thành phố xanh|bền vững|năng lượng mặt trời|đô thị xanh/i, 'sustainable city green architecture'],
  [/kim tự tháp|ai cập|pharaoh|giza|nhân sư/i, 'Egyptian pyramids desert'],
  [/rãnh mariana|mariana|đáy biển|vực thẳm/i, 'deep sea mariana ocean'],
  [/phát sáng|sứa biển|sinh vật biển/i, 'bioluminescent jellyfish ocean'],
  [/tàu ngầm|thám hiểm biển|thợ lặn/i, 'underwater coral ocean'],
  [/đại dương|biển cả|sóng biển|san hô/i, 'ocean waves coral'],
  [/vũ trụ|không gian|hành tinh|ngôi sao|thiên hà|hố đen/i, 'space galaxy stars'],
  [/(?:^|[\s,.!?])mèo(?:$|[\s,.!?])|thú cưng|hộp giấy/i, 'cat pet cute'],
  [/(?:^|[\s,.!?])chó(?:$|[\s,.!?])|chú cún/i, 'dog running happy'],
  [/tập trung|làm việc|học tập|bàn làm việc|sáng tạo/i, 'workspace desk laptop coffee'],
  [/thói quen|buổi sáng|đồng hồ báo thức|ngủ dậy/i, 'morning sunrise coffee'],
  [/công nghệ|trí tuệ nhân tạo|máy tính|lập trình|robot/i, 'robotics technology future'],
  [/núi non|leo núi|đỉnh núi|hoàng hôn/i, 'mountain landscape sunset'],
  [/thiên nhiên|rừng xanh|cơn mưa/i, 'forest nature waterfall'],
  [/thành phố|đường phố|đô thị|giao thông/i, 'city night timelapse'],
  [/tài chính|tiền bạc|kinh doanh|đầu tư/i, 'business finance skyscraper'],
  [/sức khỏe|thể thao|chạy bộ|tập gym/i, 'running fitness sunrise'],
  [/ẩm thực|nấu ăn|món ăn/i, 'cooking kitchen food'],
  [/lịch sử|cổ đại|đế chế|di tích/i, 'ancient architecture ruins'],
  [/não bộ|tâm lý|giấc mơ|suy nghĩ/i, 'abstract light brain'],
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

/**
 * Generates specific, rich visual scene prompts per sentence when AI scenePrompts aren't provided.
 */
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

/**
 * Builds a clean, fluent Vietnamese short-video script from factual Wikipedia excerpts
 * or structured topic templates matching the selected style and sentence count.
 */
export function buildSmartVietnameseScriptFromFacts(params: {
  subject: string;
  language: 'vi' | 'en' | 'bilingual';
  scriptStyle: ScriptStyle;
  sentenceCount: number;
  wikiTitle?: string;
  wikiSentences?: string[];
  englishTerms?: string[];
}): { script: string; terms: string[]; scenePrompts: string[] } {
  const topic = params.subject.trim() || 'Những bí ẩn kỳ diệu quanh ta';
  const count = Math.max(3, Math.min(8, params.sentenceCount));
  const terms =
    params.englishTerms && params.englishTerms.length > 0
      ? params.englishTerms
      : extractEnglishSearchTerms(topic, '');

  if (params.language === 'vi' && params.wikiSentences && params.wikiSentences.length >= 2) {
    const hookMap: Record<ScriptStyle, string> = {
      curious_facts: `Bạn có biết những sự thật cực kỳ bất ngờ về ${params.wikiTitle || topic} chưa?`,
      storytelling: `Ít ai biết câu chuyện đằng sau ${params.wikiTitle || topic} lại ẩn chứa nhiều điều kỳ vĩ đến vậy.`,
      tips_howto: `Hãy cùng điểm qua những thông tin quan trọng nhất về ${params.wikiTitle || topic} chỉ trong vài giây!`,
      news_fast: `Sự thật về ${params.wikiTitle || topic} mà rất nhiều người vẫn chưa từng nghe tới.`,
    };
    const outro =
      'Theo dõi kênh để cùng khám phá thêm nhiều kiến thức thú vị mỗi ngày nhé!';

    const bodyLimit = Math.max(1, count - 2);
    const body = params.wikiSentences
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length >= 18 && s.length <= 180)
      .slice(0, bodyLimit);

    const assembled = [hookMap[params.scriptStyle], ...body, outro].slice(0, count);
    const scenePrompts = buildScenePromptsFromScript(assembled, topic, terms);
    return {
      script: assembled.join('\n'),
      terms,
      scenePrompts,
    };
  }

  return generateOfflineVietnameseScript(topic, params.language, count, terms);
}

export function generateOfflineVietnameseScript(
  subject: string,
  language: 'vi' | 'en' | 'bilingual',
  sentenceCount = 4,
  overrideTerms?: string[]
): { script: string; terms: string[]; scenePrompts: string[] } {
  const topic = subject.trim() || 'Những bí ẩn kỳ diệu quanh ta';
  const terms =
    overrideTerms && overrideTerms.length > 0
      ? overrideTerms
      : extractEnglishSearchTerms(topic, '');

  let sentences: string[];
  if (language === 'en') {
    sentences = [
      `Stop scrolling—what you are about to learn about ${topic} will completely surprise you.`,
      `Even today, scientists and explorers are still uncovering hidden mechanisms behind ${topic}.`,
      `What looks ordinary at first glance actually hides extraordinary energy and precision beneath the surface.`,
      `Researchers found that small historical details completely reshape how we understand ${topic}.`,
      `Follow this channel for more mind-blowing short discoveries every single day.`,
    ];
  } else if (language === 'bilingual') {
    sentences = [
      `Bạn có biết sự thật gây kinh ngạc đằng sau ${topic} chưa?`,
      `Most people miss the most fascinating detail hidden inside ${topic}.`,
      `Khi quan sát cận cảnh, từng chi tiết nhỏ đều ẩn chứa quy luật đầy bất ngờ.`,
      `Lưu lại video này và chia sẻ cho bạn bè cùng khám phá nhé.`,
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

  const sliced = sentences.slice(0, Math.max(3, Math.min(6, sentenceCount)));
  const scenePrompts = buildScenePromptsFromScript(sliced, topic, terms);
  return {
    script: sliced.join('\n'),
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
