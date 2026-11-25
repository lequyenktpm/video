import { AnimeSceneStyle, VideoAspectRatio, VoiceOptionId } from './types';

export type AnimeEmotion =
  | 'calm'
  | 'happy'
  | 'angry'
  | 'shocked'
  | 'whisper'
  | 'apologetic'
  | 'wry_smile'
  | 'serious';

export type AnimeBodyAction =
  | 'idle'
  | 'walk_in'
  | 'gesture_talk'
  | 'lean_confront'
  | 'lean_whisper'
  | 'jump_recoil'
  | 'bow_deep'
  | 'scratch_head'
  | 'point_advise'
  | 'cheer_wave';

export type AnimeFxKind =
  | 'none'
  | 'anger_cross'
  | 'sweat'
  | 'shock_burst'
  | 'whisper_wave'
  | 'sparkle';

export type AnimeRoomKind = 'room_living' | 'cafe_corner' | 'office_desk';

export interface AnimeCharacterProfile {
  id: string;
  displayName: string;
  gender: 'male' | 'female';
  defaultVoiceId: VoiceOptionId;
  pitchRatio: number;
  hairStyle: 'spiky' | 'bob' | 'tousled' | 'neat';
  hairHex: string;
  hairShadeHex: string;
  outfitHex: string;
  outfitAccentHex: string;
  skinHex: string;
  bubbleBgHex: string;
  bubbleBorderHex: string;
  nameBadgeHex: string;
  phaseSeed: number;
}

export interface AnimeStoryboardBeat {
  index: number;
  isStageCue: boolean;
  sceneTitle?: string;
  roomKind: AnimeRoomKind;
  speakerId: string;
  speakerName: string;
  rawText: string;
  spokenText: string;
  actingNote?: string;
  emotion: AnimeEmotion;
  action: AnimeBodyAction;
  fx: AnimeFxKind;
  presentCharacterIds: string[];
  enteringCharacterId?: string;
  doorOpen: boolean;
  estDurationSec: number;
}

export interface ParsedAnimeStory {
  title: string;
  characters: AnimeCharacterProfile[];
  beats: AnimeStoryboardBeat[];
}

export const DEFAULT_ANIME_DIALOGUE_SCRIPT = [
  '会話 1: 親しき中にも礼儀あり',
  '',
  '（先輩の部屋で）',
  '先輩：えー！ガリガリ君がない！',
  '芳蘭：あっ、それなら、昨日日向君がお風呂上りに食べてましたよ。',
  '先輩：日向が！',
  '芳蘭：てっきり先輩の許可もらってそうしてるんだと思ってたんだけど……。',
  '先輩：くそー、後で、少し懲らしめてやらないと。',
  '',
  '（何も知らず日向君が先輩宅をやってくる）',
  '日向：うーっす。あれ？先輩、何か機嫌悪そうだけど、何かあったんすか。',
  '先輩：お前、俺のガリガリ君食ったんだな。',
  '日向：はい、やっぱりお風呂上りのガリガリ君は最高なってないっすね。',
  '芳蘭：（小声で）日向君、よほどのKYね。先輩怒ってるの、分かんないの？',
  '日向：えっ？わっ、やっぺー。えーっと、先輩、今回の件に関しましては誠に申し訳ございませんでした。どうかお許しを！',
  '',
  '先輩：お前、そんなふざけた謝り方しやがって！',
  '日向：すみません、先輩！本当に反省してますって。ガリガリ君、10倍にして返しますから。',
  '先輩：それプラス、ビール1箱なら許してやらないこともないがな。',
  '日向：はい、それで許してもらえるなら、お安い御用です。',
  '芳蘭：日向君、先輩が優しいからって、上下関係はきっちりしないと。しかも、いくら仲よくても、やっぱり「親しき中にも礼儀あり」だよ。',
  '日向：芳蘭さんにそう言われるとは（苦笑い）。',
].join('\n');

export const ANIME_STORY_PRESETS: Array<{
  id: string;
  label: string;
  subject: string;
  language: 'ja' | 'vi' | 'ja_en';
  script: string;
}> = [
  {
    id: 'garigari_senpai',
    label: '会話 1: 親しき中にも礼儀あり (3 nhân vật JP)',
    subject: '会話 1: 親しき中にも礼儀あり',
    language: 'ja',
    script: DEFAULT_ANIME_DIALOGUE_SCRIPT,
  },
  {
    id: 'cafe_secret',
    label: 'カフェでの相談 (2 nhân vật JP)',
    subject: 'カフェでの相談 — 締め切りの前日',
    language: 'ja',
    script: [
      '会話 2: カフェでの相談',
      '（午後の静かなカフェで）',
      '美咲：ねえ健太、明日のプレゼン資料、もう完成した？',
      '健太：（苦笑い）実はまだ半分しか終わってないんだ……。',
      '美咲：えっ！今から一緒に仕上げよう！コーヒーおごるから。',
      '健太：本当！？美咲がいてくれて本当に助かるよ！',
    ].join('\n'),
  },
  {
    id: 'office_vi',
    label: 'Hội thoại Văn phòng Vui (Tiếng Việt)',
    subject: 'Chuyện công sở — Ly trà sữa bí ẩn',
    language: 'vi',
    script: [
      'Tiêu đề: Ly trà sữa bí ẩn trong tủ lạnh',
      '（Tại phòng nghỉ công ty）',
      'Trưởng nhóm：Ơ hay! Ly trà sữa trân châu của anh đâu mất rồi!',
      'Lan Anh：À, lúc nãy Minh uống ngon lành lắm rồi anh ơi.',
      '（Minh bước vào phòng mà không hay biết gì）',
      'Minh：Chào mọi người! Ủa sao nay sếp nhìn căng thẳng vậy ạ?',
      'Trưởng nhóm：Cậu vừa uống trà sữa của tôi phải không?',
      'Minh：Úi chết! Em xin lỗi sếp, để em đặt đền sếp hẳn hai ly size L nhé!',
    ].join('\n'),
  },
];

const CHARACTER_PRESETS: Record<string, Partial<AnimeCharacterProfile>> = {
  先輩: {
    displayName: '先輩',
    gender: 'male',
    defaultVoiceId: 'ja-JP-KeitaNeural',
    pitchRatio: 0.93,
    hairStyle: 'spiky',
    hairHex: '#1E293B',
    hairShadeHex: '#0F172A',
    outfitHex: '#B45309',
    outfitAccentHex: '#FDE68A',
    skinHex: '#FCE3D0',
    bubbleBgHex: '#FFFBEB',
    bubbleBorderHex: '#D97706',
    nameBadgeHex: '#B45309',
    phaseSeed: 0.4,
  },
  芳蘭: {
    displayName: '芳蘭',
    gender: 'female',
    defaultVoiceId: 'ja-JP-NanamiNeural',
    pitchRatio: 1.03,
    hairStyle: 'bob',
    hairHex: '#4A2C2A',
    hairShadeHex: '#2E1A18',
    outfitHex: '#0F766E',
    outfitAccentHex: '#CCFBF1',
    skinHex: '#FDE7D9',
    bubbleBgHex: '#F0FDFA',
    bubbleBorderHex: '#0D9488',
    nameBadgeHex: '#0F766E',
    phaseSeed: 1.7,
  },
  日向: {
    displayName: '日向',
    gender: 'male',
    defaultVoiceId: 'ja-JP-KeitaNeural',
    pitchRatio: 1.13,
    hairStyle: 'tousled',
    hairHex: '#78350F',
    hairShadeHex: '#451A03',
    outfitHex: '#2563EB',
    outfitAccentHex: '#DBEAFE',
    skinHex: '#FCDCC8',
    bubbleBgHex: '#EFF6FF',
    bubbleBorderHex: '#2563EB',
    nameBadgeHex: '#1D4ED8',
    phaseSeed: 3.1,
  },
};

const FALLBACK_PALETTES: Array<Omit<AnimeCharacterProfile, 'id' | 'displayName'>> = [
  {
    gender: 'male',
    defaultVoiceId: 'ja-JP-KeitaNeural',
    pitchRatio: 0.96,
    hairStyle: 'spiky',
    hairHex: '#1E293B',
    hairShadeHex: '#0F172A',
    outfitHex: '#4F46E5',
    outfitAccentHex: '#E0E7FF',
    skinHex: '#FCE3D0',
    bubbleBgHex: '#EEF2FF',
    bubbleBorderHex: '#4F46E5',
    nameBadgeHex: '#4338CA',
    phaseSeed: 0.5,
  },
  {
    gender: 'female',
    defaultVoiceId: 'ja-JP-NanamiNeural',
    pitchRatio: 1.04,
    hairStyle: 'bob',
    hairHex: '#5B2333',
    hairShadeHex: '#3B1420',
    outfitHex: '#0D9488',
    outfitAccentHex: '#CCFBF1',
    skinHex: '#FDE7D9',
    bubbleBgHex: '#F0FDFA',
    bubbleBorderHex: '#0D9488',
    nameBadgeHex: '#0F766E',
    phaseSeed: 1.8,
  },
  {
    gender: 'male',
    defaultVoiceId: 'ja-JP-KeitaNeural',
    pitchRatio: 1.12,
    hairStyle: 'tousled',
    hairHex: '#7C2D12',
    hairShadeHex: '#431407',
    outfitHex: '#2563EB',
    outfitAccentHex: '#DBEAFE',
    skinHex: '#FCDCC8',
    bubbleBgHex: '#EFF6FF',
    bubbleBorderHex: '#2563EB',
    nameBadgeHex: '#1D4ED8',
    phaseSeed: 2.9,
  },
  {
    gender: 'female',
    defaultVoiceId: 'ja-JP-NanamiNeural',
    pitchRatio: 1.08,
    hairStyle: 'neat',
    hairHex: '#312E81',
    hairShadeHex: '#1E1B4B',
    outfitHex: '#DB2777',
    outfitAccentHex: '#FCE7F3',
    skinHex: '#FDE7D9',
    bubbleBgHex: '#FDF2F8',
    bubbleBorderHex: '#DB2777',
    nameBadgeHex: '#BE185D',
    phaseSeed: 4.1,
  },
];

function guessCharacterGender(name: string): 'male' | 'female' {
  if (/(?:芳蘭|美咲|花|さくら|ゆい|あおい|蘭|Minh Anh|Lan|Mai|Linh|Hoa|Ngọc|Nữ)/i.test(name)) {
    return 'female';
  }
  return 'male';
}

function detectLanguageVoiceForScript(script: string, gender: 'male' | 'female'): VoiceOptionId {
  const hasJa = /[\u3040-\u30FF\u4E00-\u9FFF]/.test(script);
  const hasVi = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(script);
  if (hasVi && !hasJa) {
    return gender === 'female' ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural';
  }
  if (!hasJa && !hasVi) {
    return gender === 'female' ? 'en-US-JennyNeural' : 'en-US-GuyNeural';
  }
  return gender === 'female' ? 'ja-JP-NanamiNeural' : 'ja-JP-KeitaNeural';
}

function buildCharacterProfile(
  name: string,
  orderIdx: number,
  fullScript: string,
  voiceOverrides?: Record<string, VoiceOptionId>
): AnimeCharacterProfile {
  const preset = CHARACTER_PRESETS[name];
  const fallback = FALLBACK_PALETTES[orderIdx % FALLBACK_PALETTES.length];
  const gender = preset?.gender ?? guessCharacterGender(name);
  const langDefaultVoice = preset?.defaultVoiceId ?? detectLanguageVoiceForScript(fullScript, gender);
  const assignedVoice = voiceOverrides?.[name] ?? langDefaultVoice;
  const sameMaleIndex = orderIdx === 0 ? 0.94 : orderIdx >= 2 ? 1.12 : 1.02;

  return {
    id: name,
    displayName: preset?.displayName ?? name,
    gender,
    defaultVoiceId: assignedVoice,
    pitchRatio: preset?.pitchRatio ?? (gender === 'female' ? 1.04 : sameMaleIndex),
    hairStyle: preset?.hairStyle ?? fallback.hairStyle,
    hairHex: preset?.hairHex ?? fallback.hairHex,
    hairShadeHex: preset?.hairShadeHex ?? fallback.hairShadeHex,
    outfitHex: preset?.outfitHex ?? fallback.outfitHex,
    outfitAccentHex: preset?.outfitAccentHex ?? fallback.outfitAccentHex,
    skinHex: preset?.skinHex ?? fallback.skinHex,
    bubbleBgHex: preset?.bubbleBgHex ?? fallback.bubbleBgHex,
    bubbleBorderHex: preset?.bubbleBorderHex ?? fallback.bubbleBorderHex,
    nameBadgeHex: preset?.nameBadgeHex ?? fallback.nameBadgeHex,
    phaseSeed: preset?.phaseSeed ?? fallback.phaseSeed,
  };
}

function detectRoomFromCue(cueText: string, current: AnimeRoomKind): AnimeRoomKind {
  if (/カフェ|cafe|quán cà phê|coffee/i.test(cueText)) return 'cafe_corner';
  if (/オフィス|会社|office|công ty|phòng nghỉ|văn phòng/i.test(cueText)) return 'office_desk';
  if (/部屋|宅|自宅|living|phòng/i.test(cueText)) return 'room_living';
  return current;
}

function analyzeEmotionAndAction(
  spokenText: string,
  actingNote?: string
): { emotion: AnimeEmotion; action: AnimeBodyAction; fx: AnimeFxKind } {
  const combined = `${actingNote ?? ''} ${spokenText}`;

  if (/小声|ひそひそ|thì thầm|whisper/i.test(combined)) {
    return { emotion: 'whisper', action: 'lean_whisper', fx: 'whisper_wave' };
  }
  if (/苦笑い|cười gượng|wry/i.test(combined)) {
    return { emotion: 'wry_smile', action: 'scratch_head', fx: 'sweat' };
  }
  if (/申し訳ございません|すみません|お許し|反省|xin lỗi|đền/i.test(combined)) {
    return { emotion: 'apologetic', action: 'bow_deep', fx: 'sweat' };
  }
  if (/えー！|えっ？|わっ|やっぺー|日向が！|úi chết|hả\?|cái gì/i.test(combined)) {
    return { emotion: 'shocked', action: 'jump_recoil', fx: 'shock_burst' };
  }
  if (/くそー|懲らしめて|ふざけた|食ったんだな|怒ってる|mất rồi|căng thẳng|phải không/i.test(combined)) {
    return { emotion: 'angry', action: 'lean_confront', fx: 'anger_cross' };
  }
  if (/最高|ビール1箱|お安い御用|うーっす|本当！？|助かる|chào mọi người/i.test(combined)) {
    return { emotion: 'happy', action: 'cheer_wave', fx: 'sparkle' };
  }
  if (/礼儀あり|きっちり|上下関係/i.test(combined)) {
    return { emotion: 'serious', action: 'point_advise', fx: 'none' };
  }
  return { emotion: 'calm', action: 'gesture_talk', fx: 'none' };
}

function estimateBeatSec(text: string, isStageCue: boolean): number {
  if (isStageCue) return 1.8;
  const clean = text.replace(/\s+/g, '');
  return Math.max(1.8, Math.min(6.2, Number((1.15 + clean.length * 0.085).toFixed(2))));
}

export function parseAnimeDialogueScript(
  rawScript: string,
  voiceOverrides?: Record<string, VoiceOptionId>
): ParsedAnimeStory {
  const lines = rawScript
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let title = 'Câu chuyện Hội thoại Hoạt hình';
  let currentRoom: AnimeRoomKind = 'room_living';

  interface DraftLine {
    kind: 'cue' | 'speech';
    speaker?: string;
    rawText: string;
    spokenText: string;
    actingNote?: string;
    roomKind: AnimeRoomKind;
    isArrivalCue: boolean;
    enteringCandidateName?: string;
  }

  const drafts: DraftLine[] = [];
  const speakerOrder: string[] = [];
  const registerSpeaker = (name: string) => {
    if (name && !speakerOrder.includes(name)) {
      speakerOrder.push(name);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Title line: 会話 1: ... / Tiêu đề: ... / Title: ...
    if (
      i === 0 &&
      (/^(?:会話|シーン|Episode|Scene|Story|Tiêu\s*đề|Title)\s*[^:：]*[:：]/i.test(line) ||
        (!/[：:]/.test(line) && !/^[（(]/.test(line) && lines.length > 2))
    ) {
      title = line.replace(/^(?:Tiêu\s*đề|Title)\s*[:：]\s*/i, '').trim() || title;
      continue;
    }

    // Pure stage cue line: （...） or (...)
    const cueMatch = line.match(/^[（(](.+)[）)]$/);
    if (cueMatch) {
      const cueInner = cueMatch[1].trim();
      currentRoom = detectRoomFromCue(cueInner, currentRoom);
      const isArrivalCue =
        /やってくる|やってきた|入って|登場|到着|やって来|bước vào|đến|tới/i.test(cueInner);
      drafts.push({
        kind: 'cue',
        rawText: cueInner,
        spokenText: cueInner,
        roomKind: currentRoom,
        isArrivalCue,
      });
      continue;
    }

    // Speaker dialogue line: Name：text or Name: text (supports multi-word names like "Trưởng nhóm" or "Lan Anh")
    const spkMatch = line.match(/^([^:：()（）\n]{1,24}?)\s*[：:]\s*(.+)$/);
    if (spkMatch) {
      const speaker = spkMatch[1].trim();
      let rest = spkMatch[2].trim();
      registerSpeaker(speaker);

      const actingNotes: string[] = [];
      // Extract leading or trailing stage cues like （小声で） or （苦笑い）
      rest = rest.replace(/[（(]([^（）()]{1,24})[）)]/g, (_m, inner: string) => {
        const cleanInner = inner.trim();
        if (cleanInner) actingNotes.push(cleanInner);
        return '';
      });
      const cleanSpoken = rest.replace(/\s+/g, ' ').replace(/[。.]+\s*$/, (m) => m).trim() || spkMatch[2].trim();
      const actingNote = actingNotes.length > 0 ? actingNotes.join('・') : undefined;

      drafts.push({
        kind: 'speech',
        speaker,
        rawText: actingNote ? `${cleanSpoken}（${actingNote}）` : cleanSpoken,
        spokenText: cleanSpoken,
        actingNote,
        roomKind: currentRoom,
        isArrivalCue: false,
      });
      continue;
    }

    // Fallback plain narration line
    const fallbackSpeaker = speakerOrder[0] ?? 'Narrator';
    registerSpeaker(fallbackSpeaker);
    drafts.push({
      kind: 'speech',
      speaker: fallbackSpeaker,
      rawText: line,
      spokenText: line,
      roomKind: currentRoom,
      isArrivalCue: false,
    });
  }

  // Resolve arrival characters from arrival cue text + lookahead speaker (preferring characters not yet on stage & earliest subject mention)
  for (let di = 0; di < drafts.length; di++) {
    const d = drafts[di];
    if (d.kind === 'cue' && d.isArrivalCue) {
      const spokenBefore = new Set(
        drafts
          .slice(0, di)
          .filter((prev) => prev.kind === 'speech' && prev.speaker)
          .map((prev) => prev.speaker!)
      );
      const offStageFirst = speakerOrder.filter((n) => !spokenBefore.has(n));
      const pool = offStageFirst.length > 0 ? offStageFirst : speakerOrder;
      const mentioned = pool
        .filter((n) => d.rawText.includes(n))
        .sort((a, b) => d.rawText.indexOf(a) - d.rawText.indexOf(b));
      if (mentioned.length > 0) {
        d.enteringCandidateName = mentioned[0];
      } else {
        // Look ahead for the next speaker
        for (let k = di + 1; k < drafts.length; k++) {
          if (drafts[k].kind === 'speech' && drafts[k].speaker) {
            d.enteringCandidateName = drafts[k].speaker;
            break;
          }
        }
      }
    }
  }

  // Characters who arrive later via an arrival cue should NOT appear before their arrival cue
  const arrivalIndexBySpeaker = new Map<string, number>();
  drafts.forEach((d, idx) => {
    if (d.kind === 'cue' && d.isArrivalCue && d.enteringCandidateName) {
      if (!arrivalIndexBySpeaker.has(d.enteringCandidateName)) {
        arrivalIndexBySpeaker.set(d.enteringCandidateName, idx);
      }
    }
  });

  const initialSpeakers = speakerOrder.filter((n) => !arrivalIndexBySpeaker.has(n));
  let present =
    initialSpeakers.length > 0
      ? [...initialSpeakers]
      : speakerOrder.slice(0, Math.max(1, speakerOrder.length));

  const characters: AnimeCharacterProfile[] = speakerOrder.map((name, idx) =>
    buildCharacterProfile(name, idx, rawScript, voiceOverrides)
  );

  const beats: AnimeStoryboardBeat[] = [];

  drafts.forEach((d, idx) => {
    if (d.kind === 'cue') {
      let enteringId: string | undefined;
      if (d.isArrivalCue && d.enteringCandidateName) {
        enteringId = d.enteringCandidateName;
        if (!present.includes(enteringId)) {
          present = [...present, enteringId];
        }
      }
      beats.push({
        index: idx,
        isStageCue: true,
        sceneTitle: d.rawText,
        roomKind: d.roomKind,
        speakerId: enteringId ?? present[0] ?? '',
        speakerName: enteringId ?? '',
        rawText: d.rawText,
        spokenText: d.spokenText,
        emotion: enteringId ? 'happy' : 'calm',
        action: enteringId ? 'walk_in' : 'idle',
        fx: enteringId ? 'sparkle' : 'none',
        presentCharacterIds: [...present],
        enteringCharacterId: enteringId,
        doorOpen: Boolean(enteringId),
        estDurationSec: estimateBeatSec(d.rawText, true),
      });
      return;
    }

    const spk = d.speaker ?? speakerOrder[0] ?? 'Narrator';
    if (!present.includes(spk)) {
      present = [...present, spk];
    }
    const { emotion, action, fx } = analyzeEmotionAndAction(d.spokenText, d.actingNote);
    beats.push({
      index: idx,
      isStageCue: false,
      roomKind: d.roomKind,
      speakerId: spk,
      speakerName: spk,
      rawText: d.rawText,
      spokenText: d.spokenText,
      actingNote: d.actingNote,
      emotion,
      action,
      fx,
      presentCharacterIds: [...present],
      doorOpen: false,
      estDurationSec: estimateBeatSec(d.spokenText, false),
    });
  });

  return { title, characters, beats };
}

// ============================================================================
// Pure 2D Articulated SVG Renderer (Shared across Preview & 24fps MP4 Export)
// ============================================================================

export function getAnimeThemePalette(style: AnimeSceneStyle = 'room_warm'): {
  wallTop: string;
  wallBottom: string;
  floorTop: string;
  floorBottom: string;
  tatamiHex: string;
  woodHex: string;
  woodDarkHex: string;
  windowGlowHex: string;
  skyHex: string;
  accentHex: string;
  subTextHex: string;
} {
  if (style === 'dramatic_anime') {
    return {
      wallTop: '#FDE68A',
      wallBottom: '#FCA5A5',
      floorTop: '#92400E',
      floorBottom: '#78350F',
      tatamiHex: '#A7F3D0',
      woodHex: '#78350F',
      woodDarkHex: '#451A03',
      windowGlowHex: '#FEF3C7',
      skyHex: '#FDBA74',
      accentHex: '#DC2626',
      subTextHex: '#0F172A',
    };
  }
  if (style === 'pastel_slice') {
    return {
      wallTop: '#EEF2FF',
      wallBottom: '#E0F2FE',
      floorTop: '#E5D3B3',
      floorBottom: '#D6BE99',
      tatamiHex: '#D1FAE5',
      woodHex: '#A16207',
      woodDarkHex: '#713F12',
      windowGlowHex: '#FFFFFF',
      skyHex: '#BAE6FD',
      accentHex: '#6366F1',
      subTextHex: '#1E293B',
    };
  }
  return {
    wallTop: '#FFF8EB',
    wallBottom: '#F5E6CC',
    floorTop: '#D9B88F',
    floorBottom: '#C29B6C',
    tatamiHex: '#D5DFB8',
    woodHex: '#925B32',
    woodDarkHex: '#683E1E',
    windowGlowHex: '#FFFDF5',
    skyHex: '#BAE6FD',
    accentHex: '#D97706',
    subTextHex: '#1E293B',
  };
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
  if (/[\u3000-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/.test(ch)) return 1.02;
  if (/[A-Z0-9@#%&MW]/.test(ch)) return 0.72;
  if (/[iljtfrI1!.,:;'"|()（）「」]/.test(ch)) return 0.36;
  return 0.56;
}

function segmentMixedUnits(token: string): string[] {
  const out: string[] = [];
  let asciiBuf = '';
  for (const ch of Array.from(token)) {
    if (/^[A-Za-z0-9._+-]$/.test(ch)) {
      asciiBuf += ch;
    } else {
      if (asciiBuf) {
        out.push(asciiBuf);
        asciiBuf = '';
      }
      out.push(ch);
    }
  }
  if (asciiBuf) out.push(asciiBuf);
  return out;
}

function measureUnits(text: string): number {
  return Array.from(text).reduce((s, ch) => s + charVisualUnits(ch), 0);
}

export function wrapAnimeBubbleLines(text: string, maxUnitsPerLine: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  const budget = Math.max(6, maxUnitsPerLine);
  const words = clean.split(' ').filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  let curUnits = 0;

  for (const word of words) {
    const wu = measureUnits(word);
    if (wu > budget) {
      if (cur.trim()) {
        lines.push(cur.trim());
        cur = '';
        curUnits = 0;
      }
      const pieces = segmentMixedUnits(word);
      let chunk = '';
      let cu = 0;
      for (const p of pieces) {
        const pu = measureUnits(p);
        if (chunk && cu + pu > budget) {
          lines.push(chunk);
          chunk = p;
          cu = pu;
        } else {
          chunk += p;
          cu += pu;
        }
      }
      if (chunk) {
        cur = chunk;
        curUnits = cu;
      }
      continue;
    }

    const sp = cur ? 0.45 : 0;
    if (cur && curUnits + sp + wu > budget) {
      lines.push(cur.trim());
      cur = word;
      curUnits = wu;
    } else {
      cur = cur ? `${cur} ${word}` : word;
      curUnits += sp + wu;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.length > 0 ? lines : [''];
}

export interface ComputedCharRig {
  profile: AnimeCharacterProfile;
  x: number;
  y: number;
  scale: number;
  facing: 1 | -1;
  bodyTiltDeg: number;
  headTiltDeg: number;
  blinkAmt: number;
  mouthPhase: number;
  isSpeaking: boolean;
  isActiveFocus: boolean;
  lookOffsetX: number;
  emotion: AnimeEmotion;
  action: AnimeBodyAction;
  fx: AnimeFxKind;
  leftArmAngle: number;
  leftForearmAngle: number;
  rightArmAngle: number;
  rightForearmAngle: number;
  opacity: number;
}

export function computeAnimeRigStates(params: {
  story: ParsedAnimeStory;
  beat: AnimeStoryboardBeat;
  timeSec: number;
  beatProgress: number; // 0..1 inside active beat
  width: number;
  height: number;
  isPlayingSpeech: boolean;
}): ComputedCharRig[] {
  const { story, beat, timeSec, beatProgress, width, height, isPlayingSpeech } = params;
  const presentIds =
    beat.presentCharacterIds.length > 0
      ? beat.presentCharacterIds
      : story.characters.map((c) => c.id);

  const count = presentIds.length;
  const isPortrait = height > width;
  const baseScale = isPortrait
    ? Math.min(width / 720, height / 1280) * (count >= 3 ? 1.0 : 1.12)
    : Math.min(width / 1280, height / 720) * (count >= 3 ? 0.96 : 1.05);

  const stageY = isPortrait ? height * 0.675 : height * 0.725;
  const xSlots: number[] =
    count === 1
      ? [width * 0.5]
      : count === 2
      ? [width * 0.30, width * 0.70]
      : count === 3
      ? [width * 0.21, width * 0.50, width * 0.79]
      : presentIds.map((_, i) => width * (0.16 + (i / Math.max(1, count - 1)) * 0.68));

  const activeSpeakerIdx = presentIds.indexOf(beat.speakerId);
  const activeSpeakerX = activeSpeakerIdx >= 0 ? xSlots[activeSpeakerIdx] : width * 0.5;

  return presentIds.map((id, idx) => {
    const profile =
      story.characters.find((c) => c.id === id) ?? buildCharacterProfile(id, idx, '', undefined);
    let x = xSlots[idx];
    let y = stageY + Math.sin(timeSec * 2.2 + profile.phaseSeed) * 2.4 * baseScale;
    let bodyTiltDeg = Math.sin(timeSec * 1.4 + profile.phaseSeed) * 1.1;
    let headTiltDeg = Math.sin(timeSec * 1.8 + profile.phaseSeed + 0.5) * 1.6;
    let opacity = 1;

    const isActive = !beat.isStageCue && beat.speakerId === id;
    const isEntering = beat.isStageCue && beat.enteringCharacterId === id;
    const emotion: AnimeEmotion = isActive ? beat.emotion : isEntering ? 'happy' : 'calm';
    const action: AnimeBodyAction = isActive
      ? beat.action
      : isEntering
      ? 'walk_in'
      : 'idle';
    const fx: AnimeFxKind = isActive ? beat.fx : isEntering ? 'sparkle' : 'none';

    // Periodic natural eye blink (~every 3.2s, 140ms blink window)
    const blinkCycle = (timeSec * 0.32 + profile.phaseSeed * 0.41) % 1;
    const blinkAmt =
      emotion === 'apologetic' && action === 'bow_deep'
        ? 0.92
        : blinkCycle > 0.94
        ? Math.sin(((blinkCycle - 0.94) / 0.06) * Math.PI)
        : 0;

    // Facing & gaze direction towards speaker
    const facing: 1 | -1 =
      count === 1
        ? 1
        : isActive
        ? idx === count - 1 && count >= 2
          ? -1
          : 1
        : activeSpeakerX >= x
        ? 1
        : -1;
    const lookOffsetX = isActive ? 0 : activeSpeakerX >= x ? 2.2 : -2.2;

    // Articulated arm base angles (degrees)
    let leftArmAngle = 14 + Math.sin(timeSec * 1.9 + profile.phaseSeed) * 3;
    let leftForearmAngle = -16;
    let rightArmAngle = -14 - Math.sin(timeSec * 1.9 + profile.phaseSeed + 0.7) * 3;
    let rightForearmAngle = 16;

    if (action === 'walk_in') {
      const tWalk = Math.min(1, beatProgress / 0.65);
      const easeOut = 1 - Math.pow(1 - tWalk, 3);
      const startX = width * 1.05;
      x = startX + (xSlots[idx] - startX) * easeOut;
      const stepPhase = tWalk * Math.PI * 5;
      const stepBounce = tWalk < 0.98 ? Math.abs(Math.sin(stepPhase)) * 11 * baseScale : 0;
      y -= stepBounce;
      bodyTiltDeg = tWalk < 0.98 ? -6 : 0;
      leftArmAngle = 22 + Math.sin(stepPhase) * 28;
      rightArmAngle = -22 - Math.sin(stepPhase) * 28;
      rightForearmAngle = -45;
      opacity = Math.min(1, tWalk * 3.5);
    } else if (action === 'bow_deep') {
      const bowEnv = Math.sin(Math.min(1, beatProgress * 1.15) * Math.PI * 0.88);
      const holdBow = Math.max(0.42, bowEnv);
      bodyTiltDeg = 22 * holdBow;
      headTiltDeg = 14 * holdBow;
      y += 14 * holdBow * baseScale;
      leftArmAngle = 6;
      leftForearmAngle = 12;
      rightArmAngle = -6;
      rightForearmAngle = -12;
    } else if (action === 'jump_recoil') {
      const hop = beatProgress < 0.35 ? Math.sin((beatProgress / 0.35) * Math.PI) : 0;
      y -= hop * 26 * baseScale;
      bodyTiltDeg = -7 * hop + Math.sin(timeSec * 14) * 1.4;
      headTiltDeg = -6;
      leftArmAngle = 58 + Math.sin(timeSec * 12) * 12;
      leftForearmAngle = 42;
      rightArmAngle = -58 - Math.sin(timeSec * 12) * 12;
      rightForearmAngle = -42;
    } else if (action === 'lean_confront') {
      const leanPulse = 0.65 + 0.35 * Math.sin(timeSec * 6);
      bodyTiltDeg = 9 * facing * leanPulse;
      headTiltDeg = 5 * facing;
      rightArmAngle = -62 - Math.sin(timeSec * 8) * 16;
      rightForearmAngle = -35;
      leftArmAngle = 24;
      leftForearmAngle = 55;
    } else if (action === 'lean_whisper') {
      bodyTiltDeg = 7 * facing;
      headTiltDeg = 6 * facing;
      rightArmAngle = -72;
      rightForearmAngle = -68;
      leftArmAngle = 18;
      leftForearmAngle = 28;
    } else if (action === 'scratch_head') {
      headTiltDeg = 9;
      bodyTiltDeg = 3;
      rightArmAngle = -112;
      rightForearmAngle = -72 + Math.sin(timeSec * 7) * 8;
      leftArmAngle = 14;
      leftForearmAngle = 20;
    } else if (action === 'point_advise') {
      bodyTiltDeg = 3 * facing;
      rightArmAngle = -68 + Math.sin(timeSec * 5.2) * 10;
      rightForearmAngle = -24;
      leftArmAngle = 20;
      leftForearmAngle = 36;
    } else if (action === 'cheer_wave') {
      const wave = Math.sin(timeSec * 8.5);
      y -= Math.abs(wave) * 5 * baseScale;
      rightArmAngle = -118 + wave * 18;
      rightForearmAngle = -28 + wave * 14;
      leftArmAngle = 42 - wave * 12;
      leftForearmAngle = 38;
    } else if (action === 'gesture_talk') {
      const g = Math.sin(timeSec * 6.5 + profile.phaseSeed);
      rightArmAngle = -44 + g * 18;
      rightForearmAngle = -42 + Math.cos(timeSec * 6.5) * 16;
      leftArmAngle = 22 - g * 10;
      leftForearmAngle = 32;
    }

    const isSpeaking = isActive && isPlayingSpeech;
    const mouthPhase = isSpeaking
      ? Math.abs(Math.sin(timeSec * 14.5) * 0.65 + Math.sin(timeSec * 23.0) * 0.35)
      : 0;

    return {
      profile,
      x,
      y,
      scale: baseScale,
      facing,
      bodyTiltDeg,
      headTiltDeg,
      blinkAmt,
      mouthPhase,
      isSpeaking,
      isActiveFocus: isActive || isEntering,
      lookOffsetX,
      emotion,
      action,
      fx,
      leftArmAngle,
      leftForearmAngle,
      rightArmAngle,
      rightForearmAngle,
      opacity,
    };
  });
}

function renderAnimeCharacterSvg(rig: ComputedCharRig, timeSec: number): string {
  const { profile, x, y, scale, facing, bodyTiltDeg, headTiltDeg, blinkAmt, mouthPhase, isSpeaking, emotion, fx, opacity } = rig;
  const { hairStyle, hairHex, hairShadeHex, outfitHex, outfitAccentHex, skinHex, nameBadgeHex } = profile;
  const f = facing;

  // Hair silhouette back & bangs
  const backHairSvg =
    hairStyle === 'bob'
      ? `<path d="M-46 -136 C-56 -110 -56 -72 -44 -56 L44 -56 C56 -72 56 -110 46 -136 Z" fill="${hairShadeHex}" stroke="#1E1B18" stroke-width="2.6"/>`
      : '';

  const frontHairSvg =
    hairStyle === 'spiky'
      ? `<path d="M-44 -146 C-44 -186 -14 -202 8 -196 C32 -196 48 -176 46 -144 C42 -154 32 -162 24 -152 C14 -165 0 -150 -8 -164 C-18 -148 -32 -158 -44 -146 Z" fill="${hairHex}" stroke="#1E1B18" stroke-width="2.6" stroke-linejoin="round"/>
         <path d="M-36 -184 L-48 -200 L-22 -190 L-8 -208 L6 -190 L28 -204 L26 -182" fill="${hairHex}" stroke="#1E1B18" stroke-width="2.4" stroke-linejoin="round"/>`
      : hairStyle === 'bob'
      ? `<path d="M-47 -142 C-48 -188 -16 -202 0 -202 C18 -202 48 -188 47 -142 C36 -156 22 -160 12 -148 C2 -160 -12 -160 -22 -148 C-32 -156 -40 -154 -47 -142 Z" fill="${hairHex}" stroke="#1E1B18" stroke-width="2.6" stroke-linejoin="round"/>
         <rect x="26" y="-158" width="12" height="5" rx="2.5" transform="rotate(-18 32 -156)" fill="#F43F5E"/>`
      : `<path d="M-45 -144 C-46 -186 -16 -202 4 -200 C28 -198 48 -180 45 -144 C34 -156 22 -146 12 -160 C2 -144 -10 -158 -22 -146 C-32 -158 -40 -152 -45 -144 Z" fill="${hairHex}" stroke="#1E1B18" stroke-width="2.6" stroke-linejoin="round"/>`;

  // Eyes (open / blinking / >< shocked / ^_^ happy)
  const eyeScaleY = Math.max(0.08, 1 - blinkAmt);
  let eyesSvg = '';
  if (emotion === 'apologetic' && rig.action === 'bow_deep') {
    eyesSvg = `
      <path d="M-24 -128 L-10 -122 L-24 -116" fill="none" stroke="#1E1B18" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 -128 L10 -122 L24 -116" fill="none" stroke="#1E1B18" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (emotion === 'happy' || emotion === 'wry_smile') {
    eyesSvg = `
      <path d="M-26 -120 Q-17 -131 -8 -120" fill="none" stroke="#1E1B18" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M8 -120 Q17 -131 26 -120" fill="none" stroke="#1E1B18" stroke-width="3.2" stroke-linecap="round"/>`;
  } else {
    const irisR = emotion === 'shocked' ? 5.2 : 7.6;
    const pupilDx = rig.lookOffsetX;
    eyesSvg = `
      <g transform="translate(-17,-122) scale(1,${eyeScaleY.toFixed(2)})">
        <ellipse cx="0" cy="0" rx="9" ry="10.5" fill="#FFFFFF" stroke="#1E1B18" stroke-width="2.2"/>
        <circle cx="${pupilDx.toFixed(1)}" cy="1" r="${irisR}" fill="#1E293B"/>
        <circle cx="${(pupilDx - 2.4).toFixed(1)}" cy="-2.8" r="2.6" fill="#FFFFFF"/>
      </g>
      <g transform="translate(17,-122) scale(1,${eyeScaleY.toFixed(2)})">
        <ellipse cx="0" cy="0" rx="9" ry="10.5" fill="#FFFFFF" stroke="#1E1B18" stroke-width="2.2"/>
        <circle cx="${pupilDx.toFixed(1)}" cy="1" r="${irisR}" fill="#1E293B"/>
        <circle cx="${(pupilDx - 2.4).toFixed(1)}" cy="-2.8" r="2.6" fill="#FFFFFF"/>
      </g>`;
  }

  // Eyebrows
  let browsSvg = '';
  if (emotion === 'angry') {
    browsSvg = `
      <path d="M-29 -141 L-7 -132" stroke="#1E1B18" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M29 -141 L7 -132" stroke="#1E1B18" stroke-width="3.5" stroke-linecap="round"/>`;
  } else if (emotion === 'apologetic' || emotion === 'wry_smile') {
    browsSvg = `
      <path d="M-28 -134 L-8 -141" stroke="#1E1B18" stroke-width="3" stroke-linecap="round"/>
      <path d="M28 -134 L8 -141" stroke="#1E1B18" stroke-width="3" stroke-linecap="round"/>`;
  } else if (emotion === 'shocked') {
    browsSvg = `
      <path d="M-27 -144 Q-17 -151 -7 -144" fill="none" stroke="#1E1B18" stroke-width="3" stroke-linecap="round"/>
      <path d="M7 -144 Q17 -151 27 -144" fill="none" stroke="#1E1B18" stroke-width="3" stroke-linecap="round"/>`;
  } else {
    browsSvg = `
      <path d="M-27 -139 Q-17 -143 -8 -139" fill="none" stroke="#1E1B18" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M8 -139 Q17 -143 27 -139" fill="none" stroke="#1E1B18" stroke-width="2.8" stroke-linecap="round"/>`;
  }

  // Mouth (6 smooth speech visemes driven strictly by mouthPhase when isSpeaking)
  let mouthSvg = '';
  if (isSpeaking && mouthPhase > 0.14) {
    const mh = (3.5 + mouthPhase * 9.5).toFixed(1);
    const mw = (5.5 + (1 - mouthPhase * 0.3) * 5.0).toFixed(1);
    mouthSvg = `<ellipse cx="0" cy="-96" rx="${mw}" ry="${mh}" fill="#9F1239" stroke="#1E1B18" stroke-width="2.2"/>
                <ellipse cx="0" cy="${(-96 + Number(mh) * 0.45).toFixed(1)}" rx="${(Number(mw) * 0.65).toFixed(1)}" ry="${(Number(mh) * 0.35).toFixed(1)}" fill="#FB7185"/>`;
  } else if (emotion === 'happy') {
    mouthSvg = `<path d="M-10 -99 Q0 -89 10 -99" fill="none" stroke="#1E1B18" stroke-width="2.8" stroke-linecap="round"/>`;
  } else if (emotion === 'angry') {
    mouthSvg = `<path d="M-10 -94 Q0 -101 10 -94" fill="none" stroke="#1E1B18" stroke-width="2.8" stroke-linecap="round"/>`;
  } else if (emotion === 'shocked') {
    mouthSvg = `<ellipse cx="0" cy="-95" rx="6" ry="8" fill="#9F1239" stroke="#1E1B18" stroke-width="2.2"/>`;
  } else if (emotion === 'wry_smile') {
    mouthSvg = `<path d="M-9 -97 Q-2 -91 9 -98" fill="none" stroke="#1E1B18" stroke-width="2.6" stroke-linecap="round"/>`;
  } else {
    mouthSvg = `<path d="M-7 -96 Q0 -93 7 -96" fill="none" stroke="#1E1B18" stroke-width="2.6" stroke-linecap="round"/>`;
  }

  // Comic Emotion FX anchored around head
  let fxSvg = '';
  if (fx === 'anger_cross') {
    const pulse = 1 + Math.sin(timeSec * 12) * 0.16;
    fxSvg = `<g transform="translate(36,-164) scale(${pulse.toFixed(2)})">
      <path d="M-9 -3 Q-3 -3 -3 -9 M3 -9 Q3 -3 9 -3 M9 3 Q3 3 3 9 M-3 9 Q-3 3 -9 3" fill="none" stroke="#EF4444" stroke-width="3.4" stroke-linecap="round"/>
    </g>`;
  } else if (fx === 'sweat') {
    const dropY = (timeSec * 18) % 10;
    fxSvg = `<g transform="translate(-38,${(-146 + dropY).toFixed(1)})">
      <path d="M0 -10 C5 -2 7 3 7 6 A7 7 0 1 1 -7 6 C-7 3 -5 -2 0 -10 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
    </g>`;
  } else if (fx === 'shock_burst') {
    const pop = 1 + Math.sin(timeSec * 15) * 0.14;
    fxSvg = `<g transform="translate(${38 * f},-168) scale(${pop.toFixed(2)})">
      <line x1="-4" y1="-16" x2="-4" y2="2" stroke="#EF4444" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="-4" cy="10" r="2.8" fill="#EF4444"/>
      <line x1="8" y1="-13" x2="12" y2="3" stroke="#F59E0B" stroke-width="3.6" stroke-linecap="round"/>
    </g>`;
  } else if (fx === 'whisper_wave') {
    const wShift = Math.sin(timeSec * 8) * 3;
    fxSvg = `<g transform="translate(${(34 * f).toFixed(1)},${(-102 + wShift).toFixed(1)})">
      <path d="M0 -8 Q${10 * f} 0 0 8" fill="none" stroke="#0D9488" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M${7 * f} -12 Q${19 * f} 0 ${7 * f} 12" fill="none" stroke="#0D9488" stroke-width="2.4" stroke-linecap="round" stroke-opacity="0.7"/>
    </g>`;
  } else if (fx === 'sparkle') {
    const spin = 0.85 + 0.25 * Math.sin(timeSec * 7);
    fxSvg = `<g transform="translate(36,-162) scale(${spin.toFixed(2)})">
      <path d="M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3 Z" fill="#FBBF24" stroke="#D97706" stroke-width="1.6"/>
    </g>`;
  }

  return `
    <g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${scale.toFixed(3)})" opacity="${opacity.toFixed(2)}">
      <!-- Ground contact shadow -->
      <ellipse cx="0" cy="12" rx="44" ry="10" fill="#0F172A" fill-opacity="0.16"/>

      <g transform="rotate(${bodyTiltDeg.toFixed(2)} 0 -20)">
        <!-- Back Articulated Arm (Left shoulder at -34,-68) -->
        <g transform="translate(-34,-68) rotate(${rig.leftArmAngle.toFixed(1)})">
          <rect x="-8" y="0" width="16" height="40" rx="8" fill="${outfitHex}" stroke="#1E1B18" stroke-width="2.4"/>
          <g transform="translate(0,36) rotate(${rig.leftForearmAngle.toFixed(1)})">
            <rect x="-7" y="0" width="14" height="34" rx="7" fill="${outfitHex}" stroke="#1E1B18" stroke-width="2.4"/>
            <circle cx="0" cy="36" r="8" fill="${skinHex}" stroke="#1E1B18" stroke-width="2.2"/>
          </g>
        </g>

        <!-- Waist-up Torso & Collar -->
        <path d="M-38 -74 C-40 -86 -24 -90 0 -90 C24 -90 40 -86 38 -74 L44 6 C44 12 36 16 28 16 L-28 16 C-36 16 -44 12 -44 6 Z" fill="${outfitHex}" stroke="#1E1B18" stroke-width="2.8"/>
        <path d="M-14 -88 L0 -62 L14 -88 Z" fill="${outfitAccentHex}" stroke="#1E1B18" stroke-width="2"/>
        <line x1="0" y1="-62" x2="0" y2="12" stroke="${outfitAccentHex}" stroke-opacity="0.65" stroke-width="2"/>

        <!-- Neck & Head Group -->
        <g transform="translate(0,-84) rotate(${headTiltDeg.toFixed(2)})">
          <rect x="-10" y="-12" width="20" height="22" rx="8" fill="${skinHex}" stroke="#1E1B18" stroke-width="2.4"/>
          <g transform="translate(0,84)">
            ${backHairSvg}
            <!-- Ears -->
            <circle cx="-41" cy="-124" r="8" fill="${skinHex}" stroke="#1E1B18" stroke-width="2.2"/>
            <circle cx="41" cy="-124" r="8" fill="${skinHex}" stroke="#1E1B18" stroke-width="2.2"/>
            <!-- Anime Face -->
            <path d="M-40 -142 C-42 -106 -22 -84 0 -84 C22 -84 42 -106 40 -142 C38 -174 22 -188 0 -188 C-22 -188 -38 -174 -40 -142 Z" fill="${skinHex}" stroke="#1E1B18" stroke-width="2.6"/>
            <!-- Subtle cheek tint -->
            <ellipse cx="-24" cy="-108" rx="7" ry="3.5" fill="#FDA4AF" fill-opacity="0.45"/>
            <ellipse cx="24" cy="-108" rx="7" ry="3.5" fill="#FDA4AF" fill-opacity="0.45"/>
            ${eyesSvg}
            ${browsSvg}
            <path d="M0 -114 L${(2 * f).toFixed(1)} -107" stroke="#C28E70" stroke-width="2" stroke-linecap="round"/>
            ${mouthSvg}
            ${frontHairSvg}
            ${fxSvg}
          </g>
        </g>

        <!-- Front Articulated Arm (Right shoulder at 34,-68) -->
        <g transform="translate(34,-68) rotate(${rig.rightArmAngle.toFixed(1)})">
          <rect x="-8" y="0" width="16" height="40" rx="8" fill="${outfitHex}" stroke="#1E1B18" stroke-width="2.4"/>
          <g transform="translate(0,36) rotate(${rig.rightForearmAngle.toFixed(1)})">
            <rect x="-7" y="0" width="14" height="34" rx="7" fill="${outfitHex}" stroke="#1E1B18" stroke-width="2.4"/>
            <circle cx="0" cy="36" r="8" fill="${skinHex}" stroke="#1E1B18" stroke-width="2.2"/>
          </g>
        </g>
      </g>

      <!-- Character Name Tag -->
      <g transform="translate(0,30)">
        <rect x="-34" y="-12" width="68" height="22" rx="11" fill="${nameBadgeHex}" stroke="#FFFFFF" stroke-width="1.8"/>
        <text x="0" y="3" text-anchor="middle" font-family="'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif" font-size="12" font-weight="800" fill="#FFFFFF">${escapeXml(profile.displayName)}</text>
      </g>
    </g>
  `;
}

function renderRoomBackdropSvg(params: {
  width: number;
  height: number;
  beat: AnimeStoryboardBeat;
  sceneStyle: AnimeSceneStyle;
  timeSec: number;
  beatProgress: number;
}): string {
  const { width, height, beat, sceneStyle, timeSec, beatProgress } = params;
  const pal = getAnimeThemePalette(sceneStyle);
  const horizonY = Math.round(height * (height > width ? 0.61 : 0.65));
  const floorH = height - horizonY;

  // Sliding door opening animation on entrance cue
  const doorSlidePx = beat.doorOpen
    ? Math.round(Math.min(1, beatProgress * 2.2) * (width * 0.14))
    : 0;
  const doorW = Math.round(width * 0.20);
  const doorH = Math.round(horizonY * 0.68);
  const doorX = Math.round(width * 0.77);
  const doorY = horizonY - doorH;

  // Window on the left
  const winX = Math.round(width * 0.07);
  const winY = Math.round(horizonY * 0.22);
  const winW = Math.round(width * 0.29);
  const winH = Math.round(horizonY * 0.44);

  // Subtle sunbeam sway
  const beamOpacity = (0.20 + Math.sin(timeSec * 0.8) * 0.03).toFixed(2);
  const isAngryScene = beat.emotion === 'angry';

  return `
    <defs>
      <linearGradient id="animeWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${pal.wallTop}"/>
        <stop offset="100%" stop-color="${pal.wallBottom}"/>
      </linearGradient>
      <linearGradient id="animeFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${pal.floorTop}"/>
        <stop offset="100%" stop-color="${pal.floorBottom}"/>
      </linearGradient>
    </defs>

    <!-- Back Wall -->
    <rect x="0" y="0" width="${width}" height="${horizonY}" fill="url(#animeWallGrad)"/>
    <!-- Wood Wainscoting Trim -->
    <rect x="0" y="${horizonY - 12}" width="${width}" height="14" fill="${pal.woodHex}"/>

    <!-- Tatami / Wood Floor -->
    <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="url(#animeFloorGrad)"/>
    <polygon points="${Math.round(width * 0.08)},${horizonY + 12} ${Math.round(width * 0.92)},${horizonY + 12} ${Math.round(width * 0.98)},${height - 16} ${Math.round(width * 0.02)},${height - 16}" fill="${pal.tatamiHex}" stroke="${pal.woodHex}" stroke-width="4" fill-opacity="0.72"/>

    <!-- Window with Shoji Lattice -->
    <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="4" fill="${pal.skyHex}" stroke="${pal.woodDarkHex}" stroke-width="5"/>
    <circle cx="${winX + Math.round(winW * 0.72)}" cy="${winY + Math.round(winH * 0.30)}" r="${Math.round(Math.min(winW, winH) * 0.16)}" fill="${pal.windowGlowHex}" fill-opacity="0.85"/>
    <line x1="${winX + Math.round(winW * 0.5)}" y1="${winY}" x2="${winX + Math.round(winW * 0.5)}" y2="${winY + winH}" stroke="${pal.woodHex}" stroke-width="3"/>
    <line x1="${winX}" y1="${winY + Math.round(winH * 0.5)}" x2="${winX + winW}" y2="${winY + Math.round(winH * 0.5)}" stroke="${pal.woodHex}" stroke-width="3"/>

    <!-- Diagonal Warm Sunbeam -->
    <polygon points="${winX},${winY + winH} ${winX + winW},${winY + winH} ${winX + winW + Math.round(width * 0.25)},${height} ${winX + Math.round(width * 0.06)},${height}" fill="${pal.windowGlowHex}" fill-opacity="${beamOpacity}"/>

    <!-- Wall Poster / Framed Art -->
    <g transform="translate(${Math.round(width * 0.48)},${Math.round(horizonY * 0.28)})">
      <rect x="0" y="0" width="${Math.round(width * 0.16)}" height="${Math.round(horizonY * 0.24)}" rx="3" fill="#FFFFFF" stroke="${pal.woodHex}" stroke-width="4"/>
      <rect x="8" y="8" width="${Math.round(width * 0.16) - 16}" height="${Math.round(horizonY * 0.24) - 16}" fill="#E0F2FE"/>
      <path d="M12 ${Math.round(horizonY * 0.18)} L${Math.round(width * 0.06)} ${Math.round(horizonY * 0.10)} L${Math.round(width * 0.11)} ${Math.round(horizonY * 0.18)} Z" fill="#60A5FA"/>
      <circle cx="${Math.round(width * 0.11)}" cy="${Math.round(horizonY * 0.07)}" r="7" fill="#FBBF24"/>
    </g>

    <!-- Sliding Fusuma / Entrance Door on Right -->
    <rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#1E293B" stroke="${pal.woodDarkHex}" stroke-width="5"/>
    <rect x="${doorX - doorSlidePx}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#FEFDF7" stroke="${pal.woodHex}" stroke-width="4"/>
    <rect x="${doorX - doorSlidePx + 10}" y="${doorY + 12}" width="${Math.max(12, doorW - 20)}" height="${Math.round(doorH * 0.62)}" fill="none" stroke="#CBD5E1" stroke-width="2"/>
    <circle cx="${doorX - doorSlidePx + 18}" cy="${doorY + Math.round(doorH * 0.54)}" r="5" fill="${pal.woodDarkHex}"/>

    ${
      isAngryScene
        ? `<rect x="0" y="0" width="${width}" height="${height}" fill="#EF4444" fill-opacity="0.09"/>
           <g stroke="#DC2626" stroke-opacity="0.18" stroke-width="3">
             <line x1="0" y1="0" x2="${Math.round(width * 0.22)}" y2="${Math.round(height * 0.26)}"/>
             <line x1="${width}" y1="0" x2="${Math.round(width * 0.78)}" y2="${Math.round(height * 0.26)}"/>
             <line x1="0" y1="${Math.round(height * 0.35)}" x2="${Math.round(width * 0.18)}" y2="${Math.round(height * 0.42)}"/>
             <line x1="${width}" y1="${Math.round(height * 0.35)}" x2="${Math.round(width * 0.82)}" y2="${Math.round(height * 0.42)}"/>
           </g>`
        : ''
    }
  `;
}

function renderSpeechBubbleSvg(params: {
  speakerRig: ComputedCharRig;
  beat: AnimeStoryboardBeat;
  width: number;
  height: number;
  fontFamily: string;
}): string {
  const { speakerRig, beat, width, height, fontFamily } = params;
  const text = beat.spokenText || beat.rawText;
  const isPortrait = height > width;
  const fontSize = isPortrait ? Math.round(width * 0.036) : Math.round(height * 0.034);
  const maxUnits = isPortrait ? 17 : 26;
  const lines = wrapAnimeBubbleLines(text, maxUnits);
  const longestLineUnits = Math.max(4, ...lines.map((l) => measureUnits(l)));

  const lineHeight = Math.round(fontSize * 1.32);
  const padX = Math.round(fontSize * 0.95);
  const padY = Math.round(fontSize * 0.65);

  const estTextW = Math.round(longestLineUnits * fontSize * 0.96);
  const maxBubbleW = Math.round(width * (isPortrait ? 0.82 : 0.62));
  const bubbleW = Math.max(Math.round(width * 0.26), Math.min(maxBubbleW, estTextW + padX * 2));
  const noteExtraH = beat.actingNote ? Math.round(fontSize * 1.05) : 0;
  const bubbleH = lines.length * lineHeight + padY * 2 + noteExtraH;

  // Position bubble cleanly above the active speaker without clipping viewport edges
  const targetAnchorX = speakerRig.x;
  const bubbleX = Math.max(
    Math.round(width * 0.06),
    Math.min(width - bubbleW - Math.round(width * 0.06), Math.round(targetAnchorX - bubbleW / 2))
  );
  const headTopY = speakerRig.y - 210 * speakerRig.scale;
  const minTopY = Math.round(height * 0.11);
  const bubbleY = Math.max(minTopY, Math.round(headTopY - bubbleH - 22));

  // Pointer tail directly aimed at speaker's head center
  const tailTipX = Math.max(
    bubbleX + 24,
    Math.min(bubbleX + bubbleW - 24, Math.round(targetAnchorX))
  );
  const tailBaseL = Math.max(bubbleX + 18, tailTipX - 11);
  const tailBaseR = Math.min(bubbleX + bubbleW - 18, tailTipX + 11);
  const tailY = bubbleY + bubbleH;

  const borderColor = speakerRig.profile.bubbleBorderHex;
  const bgColor = speakerRig.profile.bubbleBgHex;

  const linesSvg = lines
    .map(
      (ln, idx) =>
        `<text x="${bubbleX + padX}" y="${bubbleY + padY + noteExtraH + Math.round(fontSize * 0.88) + idx * lineHeight}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="#0F172A">${escapeXml(ln)}</text>`
    )
    .join('');

  const noteBadgeSvg = beat.actingNote
    ? `<text x="${bubbleX + padX}" y="${bubbleY + padY + Math.round(fontSize * 0.68)}" font-family="${fontFamily}" font-size="${Math.max(11, Math.round(fontSize * 0.64))}" font-weight="800" fill="${borderColor}">（${escapeXml(beat.actingNote)}）</text>`
    : '';

  return `
    <g>
      <!-- Drop shadow -->
      <rect x="${bubbleX + 3}" y="${bubbleY + 5}" width="${bubbleW}" height="${bubbleH}" rx="18" fill="#0F172A" fill-opacity="0.14"/>
      <!-- Compact Text-Hugging Bubble -->
      <rect x="${bubbleX}" y="${bubbleY}" width="${bubbleW}" height="${bubbleH}" rx="18" fill="${bgColor}" stroke="${borderColor}" stroke-width="3.2"/>
      <!-- Directional Tail -->
      <polygon points="${tailBaseL},${tailY - 2} ${tailBaseR},${tailY - 2} ${tailTipX},${tailY + 18}" fill="${bgColor}"/>
      <polyline points="${tailBaseL},${tailY} ${tailTipX},${tailY + 18} ${tailBaseR},${tailY}" fill="none" stroke="${borderColor}" stroke-width="3.2" stroke-linejoin="round"/>
      ${noteBadgeSvg}
      ${linesSvg}
    </g>
  `;
}

export function renderAnimeBeatSvgFrame(params: {
  story: ParsedAnimeStory;
  beat: AnimeStoryboardBeat;
  timeSec: number;
  beatProgress: number;
  width: number;
  height: number;
  sceneStyle?: AnimeSceneStyle;
  fontName?: string;
  isPlayingSpeech?: boolean;
}): string {
  const {
    story,
    beat,
    timeSec,
    beatProgress,
    width,
    height,
    sceneStyle = 'room_warm',
    fontName = 'M PLUS 1p',
    isPlayingSpeech = true,
  } = params;

  const fontFamily =
    fontName === 'BIZ UDPGothic'
      ? "'BIZ UDPGothic', 'M PLUS 1p', 'Noto Sans', sans-serif"
      : "'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif";

  const rigs = computeAnimeRigStates({
    story,
    beat,
    timeSec,
    beatProgress,
    width,
    height,
    isPlayingSpeech: isPlayingSpeech && !beat.isStageCue,
  });

  // Subtle eased camera pan & zoom toward active speaker
  const focusRig = rigs.find((r) => r.isActiveFocus) ?? rigs[0];
  const camScale = beat.isStageCue ? 1.0 : beat.emotion === 'angry' || beat.emotion === 'shocked' ? 1.045 : 1.022;
  const focusDx = focusRig ? (width * 0.5 - focusRig.x) * 0.08 : 0;
  const focusDy = (height * 0.5 - height * 0.52) * 0.03;

  const sortedRigs = [...rigs].sort((a, b) => (a.isActiveFocus ? 1 : 0) - (b.isActiveFocus ? 1 : 0));
  const charactersSvg = sortedRigs.map((r) => renderAnimeCharacterSvg(r, timeSec)).join('');

  // Foreground low wooden chabudai table (with popsicle tray & tea cups)
  const isPortrait = height > width;
  const tableW = Math.round(width * (isPortrait ? 0.56 : 0.36));
  const tableH = Math.round(height * 0.055);
  const tableX = Math.round((width - tableW) / 2);
  const tableY = Math.round(height * (isPortrait ? 0.72 : 0.765));

  const tableSvg = `
    <g>
      <rect x="${tableX + 18}" y="${tableY + tableH - 4}" width="14" height="${Math.round(height * 0.055)}" rx="3" fill="#683E1E"/>
      <rect x="${tableX + tableW - 32}" y="${tableY + tableH - 4}" width="14" height="${Math.round(height * 0.055)}" rx="3" fill="#683E1E"/>
      <rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="10" fill="#A16207" stroke="#573110" stroke-width="3"/>
      <!-- Empty Garigari-kun tray + green tea cups -->
      <rect x="${tableX + Math.round(tableW * 0.16)}" y="${tableY - 8}" width="38" height="10" rx="3" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.8"/>
      <rect x="${tableX + Math.round(tableW * 0.72)}" y="${tableY - 12}" width="16" height="14" rx="3" fill="#DCFCE7" stroke="#15803D" stroke-width="1.8"/>
      <rect x="${tableX + Math.round(tableW * 0.80)}" y="${tableY - 12}" width="16" height="14" rx="3" fill="#FEF3C7" stroke="#B45309" stroke-width="1.8"/>
    </g>
  `;

  // Top Title / Stage Cue Banner
  const headerFs = Math.max(15, Math.round(Math.min(width, height) * 0.026));
  const topBannerText = beat.isStageCue
    ? beat.sceneTitle || beat.rawText
    : story.title;
  const topBannerW = Math.min(
    Math.round(width * 0.88),
    Math.max(180, Math.round(measureUnits(topBannerText) * headerFs * 1.05 + 36))
  );
  const topBannerX = Math.round((width - topBannerW) / 2);
  const topBannerY = Math.round(height * 0.04);

  const bannerSvg = `
    <g>
      <rect x="${topBannerX}" y="${topBannerY}" width="${topBannerW}" height="${Math.round(headerFs * 1.95)}" rx="10" fill="${beat.isStageCue ? '#1E293B' : '#FFFFFF'}" fill-opacity="0.93" stroke="${beat.isStageCue ? '#F59E0B' : '#CBD5E1'}" stroke-width="2.2"/>
      <text x="${Math.round(width / 2)}" y="${topBannerY + Math.round(headerFs * 1.28)}" text-anchor="middle" font-family="${fontFamily}" font-size="${headerFs}" font-weight="800" fill="${beat.isStageCue ? '#FEF3C7' : '#0F172A'}">${escapeXml(topBannerText)}</text>
    </g>
  `;

  const speechBubbleSvg =
    !beat.isStageCue && focusRig
      ? renderSpeechBubbleSvg({
          speakerRig: focusRig,
          beat,
          width,
          height,
          fontFamily,
        })
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g transform="translate(${(width / 2 + focusDx).toFixed(1)},${(height / 2 + focusDy).toFixed(1)}) scale(${camScale.toFixed(3)}) translate(${(-width / 2).toFixed(1)},${(-height / 2).toFixed(1)})">
      ${renderRoomBackdropSvg({ width, height, beat, sceneStyle, timeSec, beatProgress })}
      ${charactersSvg}
      ${tableSvg}
    </g>
    ${bannerSvg}
    ${speechBubbleSvg}
  </svg>`;
}
