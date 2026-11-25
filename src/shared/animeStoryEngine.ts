import { AnimeRoomKind, AnimeSceneStyle, SubtitleEffect, VoiceOptionId } from './types';

export type { AnimeRoomKind };

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
  | 'check_fridge_panic'
  | 'gesture_talk'
  | 'lean_confront'
  | 'lean_whisper'
  | 'jump_recoil'
  | 'bow_deep'
  | 'scratch_head'
  | 'point_advise'
  | 'cheer_wave'
  | 'hold_prop_offer'
  | 'nervous_fidget';

export type AnimeFxKind =
  | 'none'
  | 'anger_cross'
  | 'sweat'
  | 'shock_burst'
  | 'whisper_wave'
  | 'sparkle';

export type AnimeHandProp =
  | 'none'
  | 'cup_mouth'
  | 'coffee_cup'
  | 'popsicle_box'
  | 'beer_case'
  | 'clipboard';

export const ANIME_ROOM_METAS: Array<{ id: AnimeRoomKind; label: string; hint: string }> = [
  { id: 'room_living', label: 'Phòng khách & Tủ lạnh', hint: 'Chiếu tatami, cửa shoji, bàn trà & góc tủ lạnh' },
  { id: 'kitchen_fridge', label: 'Nhà bếp & Tủ lạnh', hint: 'Bếp hiện đại, tủ lạnh đóng/mở & bàn ăn' },
  { id: 'cafe_corner', label: 'Quán Cà phê', hint: 'Đèn thả ấm áp, bảng menu, cửa kính & bàn cafe' },
  { id: 'office_desk', label: 'Văn phòng / Phòng nghỉ', hint: 'Cửa kính thành phố, bảng trắng, máy nước & bàn họp' },
  { id: 'school_classroom', label: 'Lớp học', hint: 'Bảng xanh, cửa sổ nắng, đồng hồ & bàn ghế gỗ' },
  { id: 'street_park', label: 'Đường phố & Công viên', hint: 'Trời xanh mây trôi, hàng cây, ghế đá & máy bán nước' },
  { id: 'restaurant_izakaya', label: 'Quán ăn / Izakaya', hint: 'Rèm noren, đèn lồng giấy, quầy gỗ & thực đơn' },
  { id: 'train_station', label: 'Nhà ga Tàu điện', hint: 'Biển tên ga, mái che sân ga, ghế chờ & đường ray' },
];

export function getAnimeRoomMeta(roomKind: AnimeRoomKind): { id: AnimeRoomKind; label: string; hint: string } {
  return ANIME_ROOM_METAS.find((m) => m.id === roomKind) ?? ANIME_ROOM_METAS[0];
}

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
  pantsHex: string;
  shoeHex: string;
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
  hasFridgeProp: boolean;
  fridgeOpen: boolean;
  speakerId: string;
  speakerName: string;
  rawText: string;
  spokenText: string;
  actingNote?: string;
  emotionTag?: string;
  emotion: AnimeEmotion;
  action: AnimeBodyAction;
  handProp: AnimeHandProp;
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
    label: '会話 1: 親しき中にも礼儀あり (Phòng & Tủ lạnh)',
    subject: '会話 1: 親しき中にも礼儀あり',
    language: 'ja',
    script: DEFAULT_ANIME_DIALOGUE_SCRIPT,
  },
  {
    id: 'cafe_secret',
    label: 'カフェでの相談 (Quán Cà phê JP)',
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
  {
    id: 'school_to_park',
    label: 'Trường học -> Công viên (Đổi 2 bối cảnh)',
    subject: 'Tan học cùng bạn thân',
    language: 'vi',
    script: [
      'Tiêu đề: Kế hoạch ôn thi cuối kỳ',
      '（Trong lớp học sau giờ tan trường）',
      'Minh Anh：Khoa ơi! Tuần sau thi rồi mà cậu vẫn bình tĩnh vậy à?',
      'Khoa：（cười gượng）Thật ra tớ lo muốn xỉu luôn nè…',
      '（Cả hai đi bộ ra công viên gần trường）',
      'Minh Anh：Vậy tối nay qua nhà tớ ôn chung đi, tớ pha trà đào cho!',
      'Khoa：Tuyệt vời! Có cậu kèm là tớ yên tâm hẳn luôn!',
    ].join('\n'),
  },
];

const CHARACTER_PRESETS: Record<string, Partial<AnimeCharacterProfile>> = {
  先輩: {
    displayName: '先輩',
    gender: 'male',
    defaultVoiceId: 'ja-JP-DaichiNeural',
    pitchRatio: 0.93,
    hairStyle: 'spiky',
    hairHex: '#1E293B',
    hairShadeHex: '#0F172A',
    outfitHex: '#B45309',
    outfitAccentHex: '#FDE68A',
    pantsHex: '#334155',
    shoeHex: '#1E293B',
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
    pantsHex: '#1E293B',
    shoeHex: '#451A03',
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
    pantsHex: '#1E293B',
    shoeHex: '#0F172A',
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
    defaultVoiceId: 'ja-JP-DaichiNeural',
    pitchRatio: 0.96,
    hairStyle: 'spiky',
    hairHex: '#1E293B',
    hairShadeHex: '#0F172A',
    outfitHex: '#4F46E5',
    outfitAccentHex: '#E0E7FF',
    pantsHex: '#1E293B',
    shoeHex: '#0F172A',
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
    pantsHex: '#1E293B',
    shoeHex: '#451A03',
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
    pantsHex: '#334155',
    shoeHex: '#1E293B',
    skinHex: '#FCDCC8',
    bubbleBgHex: '#EFF6FF',
    bubbleBorderHex: '#2563EB',
    nameBadgeHex: '#1D4ED8',
    phaseSeed: 2.9,
  },
  {
    gender: 'female',
    defaultVoiceId: 'ja-JP-AoiNeural',
    pitchRatio: 1.08,
    hairStyle: 'neat',
    hairHex: '#312E81',
    hairShadeHex: '#1E1B4B',
    outfitHex: '#DB2777',
    outfitAccentHex: '#FCE7F3',
    pantsHex: '#1E293B',
    shoeHex: '#3B0764',
    skinHex: '#FDE7D9',
    bubbleBgHex: '#FDF2F8',
    bubbleBorderHex: '#DB2777',
    nameBadgeHex: '#BE185D',
    phaseSeed: 4.1,
  },
];

export interface AnimeCharacterVisualDetail {
  irisMainHex: string;
  irisDarkHex: string;
  irisGlowHex: string;
  skinShadeHex: string;
  outfitShadeHex: string;
  skirtOrPantsShadeHex: string;
  hairHighlightHex: string;
  ribbonOrTieHex: string;
  hasGlasses: boolean;
  glassesFrameHex: string;
  hasSideBow: boolean;
}

export function getAnimeCharacterVisualDetail(
  profile: AnimeCharacterProfile
): AnimeCharacterVisualDetail {
  const outfitLower = profile.outfitHex.toUpperCase();
  const hairLower = profile.hairHex.toUpperCase();

  let irisMainHex = '#2563EB';
  let irisDarkHex = '#1E3A8A';
  let irisGlowHex = '#93C5FD';
  let outfitShadeHex = '#1E293B';
  let ribbonOrTieHex = '#D97706';

  if (outfitLower === '#0F766E' || outfitLower === '#0D9488') {
    irisMainHex = '#0D9488';
    irisDarkHex = '#115E59';
    irisGlowHex = '#5EEAD4';
    outfitShadeHex = '#0F524C';
    ribbonOrTieHex = '#F59E0B';
  } else if (outfitLower === '#B45309') {
    irisMainHex = '#D97706';
    irisDarkHex = '#78350F';
    irisGlowHex = '#FCD34D';
    outfitShadeHex = '#853D07';
    ribbonOrTieHex = '#334155';
  } else if (outfitLower === '#DB2777') {
    irisMainHex = '#0D9488';
    irisDarkHex = '#0F524C';
    irisGlowHex = '#67E8F9';
    outfitShadeHex = '#9D174D';
    ribbonOrTieHex = '#E11D48';
  } else if (outfitLower === '#4F46E5') {
    irisMainHex = '#4F46E5';
    irisDarkHex = '#312E81';
    irisGlowHex = '#A5B4FC';
    outfitShadeHex = '#3730A3';
    ribbonOrTieHex = '#1E293B';
  } else if (outfitLower === '#2563EB') {
    irisMainHex = '#0284C7';
    irisDarkHex = '#1E3A8A';
    irisGlowHex = '#7DD3FC';
    outfitShadeHex = '#1D4ED8';
    ribbonOrTieHex = '#1E293B';
  }

  const isCoolDarkHair =
    hairLower === '#1E293B' ||
    hairLower === '#0F172A' ||
    hairLower === '#312E81';
  const hairHighlightHex = isCoolDarkHair ? '#67E8F9' : '#FDE68A';

  const hasSideBow = profile.gender === 'female' && profile.hairStyle === 'bob';
  const hasGlasses = profile.gender === 'female' && profile.hairStyle === 'neat';

  return {
    irisMainHex,
    irisDarkHex,
    irisGlowHex,
    skinShadeHex: '#F3C4A8',
    outfitShadeHex,
    skirtOrPantsShadeHex: '#0F172A',
    hairHighlightHex,
    ribbonOrTieHex,
    hasGlasses,
    glassesFrameHex: '#F97316',
    hasSideBow,
  };
}

function guessCharacterGender(name: string): 'male' | 'female' {
  if (/(?:芳蘭|美咲|花|さくら|ゆい|あおい|蘭|結衣|葵|凛)/.test(name)) {
    return 'female';
  }
  const normalized = name.trim();
  if (
    /(?:^|[\s_-])(?:Minh Anh|Lan Anh|Ngọc Anh|Bảo Anh|Lan|Mai|Linh|Hoa|Ngọc|Nữ|Trang|Thảo|Hương|Phương|Vy|Hà|Nhi|My|Quỳnh|Yến|Chi|Trâm|Tiên|Ánh)(?:$|[\s_-])/i.test(
      normalized
    )
  ) {
    return 'female';
  }
  return 'male';
}

function detectLanguageVoiceForScript(script: string, gender: 'male' | 'female', orderIdx: number): VoiceOptionId {
  const hasJa = /[\u3040-\u30ff\u4e00-\u9faf]/.test(script);
  const hasVi = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(script);
  if (hasJa) {
    if (gender === 'female') {
      if (orderIdx >= 2) return 'ja-JP-MayuNeural';
      return orderIdx === 0 ? 'ja-JP-NanamiNeural' : 'ja-JP-AoiNeural';
    }
    if (orderIdx >= 2) return 'ja-JP-NaokiNeural';
    return orderIdx === 0 ? 'ja-JP-DaichiNeural' : 'ja-JP-KeitaNeural';
  }
  if (hasVi) {
    if (gender === 'female') {
      return orderIdx % 2 === 0 ? 'vi-VN-HoaiMyNeural' : 'vi-VN-HoaiMyBright';
    }
    return orderIdx % 2 === 0 ? 'vi-VN-NamMinhNeural' : 'vi-VN-NamMinhYoung';
  }
  if (gender === 'female') {
    if (orderIdx >= 2) return 'en-US-EmmaNeural';
    return orderIdx === 0 ? 'en-US-JennyNeural' : 'en-US-AriaNeural';
  }
  if (orderIdx >= 2) return 'en-GB-RyanNeural';
  return orderIdx === 0 ? 'en-US-GuyNeural' : 'en-US-DavisNeural';
}

function buildCharacterProfile(
  name: string,
  orderIdx: number,
  fullScript: string,
  voiceOverrides?: Record<string, VoiceOptionId>
): AnimeCharacterProfile {
  const preset = CHARACTER_PRESETS[name];
  const gender = preset?.gender ?? guessCharacterGender(name);
  const genderPalettes = FALLBACK_PALETTES.filter((p) => p.gender === gender);
  const fallbackPool = genderPalettes.length > 0 ? genderPalettes : FALLBACK_PALETTES;
  const fallback = fallbackPool[orderIdx % fallbackPool.length];
  const langDefaultVoice = preset?.defaultVoiceId ?? detectLanguageVoiceForScript(fullScript, gender, orderIdx);
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
    pantsHex: preset?.pantsHex ?? fallback.pantsHex,
    shoeHex: preset?.shoeHex ?? fallback.shoeHex,
    skinHex: preset?.skinHex ?? fallback.skinHex,
    bubbleBgHex: preset?.bubbleBgHex ?? fallback.bubbleBgHex,
    bubbleBorderHex: preset?.bubbleBorderHex ?? fallback.bubbleBorderHex,
    nameBadgeHex: preset?.nameBadgeHex ?? fallback.nameBadgeHex,
    phaseSeed: preset?.phaseSeed ?? fallback.phaseSeed,
  };
}

export function detectRoomFromCue(cueText: string, current: AnimeRoomKind): AnimeRoomKind {
  if (/キッチン|台所|冷蔵庫|冷凍庫|kitchen|bếp|tủ lạnh/i.test(cueText)) return 'kitchen_fridge';
  if (/カフェ|喫茶|コーヒー|cafe|coffee|cà phê/i.test(cueText)) return 'cafe_corner';
  if (/オフィス|会社|事務所|会議|プレゼン|office|công ty|phòng nghỉ|văn phòng|sếp|trưởng nhóm|đồng nghiệp|deadline/i.test(cueText)) {
    return 'office_desk';
  }
  if (/公園|外|通り|散歩|コンビニ|桜|park|street|công viên|ngoài phố|trên đường|đi bộ/i.test(cueText)) {
    return 'street_park';
  }
  if (/学校|教室|授業|先生|クラス|黒板|宿題|school|classroom|lớp học|trường|thầy|cô giáo/i.test(cueText)) {
    return 'school_classroom';
  }
  if (/居酒屋|レストラン|食堂|ラーメン|焼肉|乾杯|restaurant|izakaya|quán ăn|nhà hàng|quán nhậu/i.test(cueText)) {
    return 'restaurant_izakaya';
  }
  if (/駅|電車|ホーム|改札|バス停|station|train|nhà ga|tàu điện|sân ga/i.test(cueText)) {
    return 'train_station';
  }
  if (/部屋|宅|自宅|家|リビング|畳|room|living|phòng khách|ở nhà|nhà riêng/i.test(cueText)) {
    return 'room_living';
  }
  return current;
}

function inferInitialRoomFromScript(rawScript: string): AnimeRoomKind {
  const firstCue = rawScript.match(/[（(]([^）)\n]{2,60})[）)]/);
  if (firstCue) {
    const detected = detectRoomFromCue(firstCue[1], 'room_living');
    if (detected !== 'room_living') return detected;
  }
  return detectRoomFromCue(rawScript, 'room_living');
}

function analyzeEmotionAndAction(
  spokenText: string,
  actingNote: string | undefined,
  roomKind: AnimeRoomKind
): {
  emotion: AnimeEmotion;
  action: AnimeBodyAction;
  fx: AnimeFxKind;
  handProp: AnimeHandProp;
  fridgeOpen: boolean;
} {
  const combined = `${actingNote ?? ''} ${spokenText}`;

  if (/小声|ひそひそ|thì thầm|nói nhỏ|whisper|lean_whisper/i.test(combined)) {
    return {
      emotion: 'whisper',
      action: 'lean_whisper',
      fx: 'whisper_wave',
      handProp: 'cup_mouth',
      fridgeOpen: false,
    };
  }
  if (/check_fridge_panic|(?:ガリガリ君|アイス|trà sữa|冷蔵庫|tủ lạnh).*(?:ない|mất rồi|đâu)|(?:ない！|đâu mất rồi)/i.test(combined)) {
    return {
      emotion: 'shocked',
      action: 'check_fridge_panic',
      fx: 'shock_burst',
      handProp: 'none',
      fridgeOpen: true,
    };
  }
  if (/苦笑い|cười gượng|wry/i.test(combined)) {
    return {
      emotion: 'wry_smile',
      action: 'scratch_head',
      fx: 'sweat',
      handProp: 'none',
      fridgeOpen: false,
    };
  }
  if (/申し訳ございません|すみません|お許し|反省|xin lỗi|tạ lỗi/i.test(combined)) {
    return {
      emotion: 'apologetic',
      action: 'bow_deep',
      fx: 'sweat',
      handProp: 'none',
      fridgeOpen: false,
    };
  }
  if (/えー！|えっ？|わっ|やっぺー|日向が！|úi chết|hả\?|cái gì|えっ！/i.test(combined)) {
    return {
      emotion: 'shocked',
      action: 'jump_recoil',
      fx: 'shock_burst',
      handProp: 'none',
      fridgeOpen: false,
    };
  }
  if (/くそー|懲らしめて|ふざけた|食ったんだな|怒ってる|căng thẳng|phải không|đừng đùa/i.test(combined)) {
    return {
      emotion: 'angry',
      action: 'lean_confront',
      fx: 'anger_cross',
      handProp: 'none',
      fridgeOpen: false,
    };
  }
  if (/ビール1箱|10倍にして返|đặt đền|size L|コーヒーおごる|trà đào/i.test(combined)) {
    const prop: AnimeHandProp = /ビール|beer/i.test(combined)
      ? 'beer_case'
      : /ガリガリ君|アイス/i.test(combined)
      ? 'popsicle_box'
      : 'coffee_cup';
    return {
      emotion: 'happy',
      action: 'hold_prop_offer',
      fx: 'sparkle',
      handProp: prop,
      fridgeOpen: false,
    };
  }
  if (/最高|お安い御用|うーっす|本当！？|助かる|chào mọi người|tuyệt vời/i.test(combined)) {
    return {
      emotion: 'happy',
      action: 'cheer_wave',
      fx: 'sparkle',
      handProp: roomKind === 'cafe_corner' ? 'coffee_cup' : 'none',
      fridgeOpen: false,
    };
  }
  if (/礼儀あり|きっちり|上下関係|プレゼン|thi|kế hoạch/i.test(combined)) {
    return {
      emotion: 'serious',
      action: 'point_advise',
      fx: 'none',
      handProp: /プレゼン|tài liệu|thi/i.test(combined) ? 'clipboard' : 'none',
      fridgeOpen: false,
    };
  }
  return {
    emotion: 'calm',
    action: 'gesture_talk',
    fx: 'none',
    handProp: roomKind === 'cafe_corner' && /コーヒー|cà phê/i.test(combined) ? 'coffee_cup' : 'none',
    fridgeOpen: false,
  };
}

function estimateBeatSec(text: string, isStageCue: boolean): number {
  if (isStageCue) return 1.8;
  const clean = text.replace(/\s+/g, '');
  return Math.max(1.8, Math.min(6.2, Number((1.15 + clean.length * 0.085).toFixed(2))));
}

export function parseAnimeDialogueScript(
  rawScript: string,
  voiceOverrides?: Record<string, VoiceOptionId>,
  options?: { roomOverride?: 'auto' | AnimeRoomKind }
): ParsedAnimeStory {
  const lines = rawScript
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let title = 'Câu chuyện Hội thoại Hoạt hình';
  const overrideRoom =
    options?.roomOverride && options.roomOverride !== 'auto' ? options.roomOverride : undefined;
  let currentRoom: AnimeRoomKind = overrideRoom ?? inferInitialRoomFromScript(rawScript);
  const hasFridgeInStory = /ガリガリ君|アイス|冷蔵庫|冷凍庫|trà sữa|tủ lạnh|fridge|ice cream/i.test(
    rawScript
  );

  interface DraftLine {
    kind: 'cue' | 'speech';
    speaker?: string;
    rawText: string;
    spokenText: string;
    actingNote?: string;
    emotionTag?: string;
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

    if (
      i === 0 &&
      (/^(?:会話|シーン|Episode|Scene|Story|Tiêu\s*đề|Title)\s*[^:：]*[:：]/i.test(line) ||
        (!/[：:]/.test(line) && !/^[（(]/.test(line) && lines.length > 2))
    ) {
      title = line.replace(/^(?:Tiêu\s*đề|Title)\s*[:：]\s*/i, '').trim() || title;
      continue;
    }

    const cueMatch = line.match(/^[（(](.+)[）)]$/);
    if (cueMatch) {
      const cueInner = cueMatch[1].trim();
      if (!overrideRoom) {
        currentRoom = detectRoomFromCue(cueInner, currentRoom);
      }
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

    const spkMatch = line.match(/^([^:：()（）\n]{1,24}?)\s*[：:]\s*(.+)$/);
    if (spkMatch) {
      const speaker = spkMatch[1].trim();
      let rest = spkMatch[2].trim();
      registerSpeaker(speaker);

      const actingNotes: string[] = [];
      const bracketTags: string[] = [];
      rest = rest.replace(/\[([A-Za-z0-9_-]{2,36})\]/g, (_m, tag: string) => {
        const cleanTag = tag.trim().toLowerCase();
        if (cleanTag) bracketTags.push(cleanTag);
        return '';
      });
      rest = rest.replace(/[（(]([^（）()]{1,24})[）)]/g, (_m, inner: string) => {
        const cleanInner = inner.trim();
        if (cleanInner) actingNotes.push(cleanInner);
        return '';
      });
      const cleanSpoken =
        rest.replace(/\s+/g, ' ').replace(/[。.]+\s*$/, (m) => m).trim() || spkMatch[2].trim();
      const actingNote = actingNotes.length > 0 ? actingNotes.join('・') : undefined;
      const emotionTag = bracketTags.length > 0 ? bracketTags[0] : undefined;

      drafts.push({
        kind: 'speech',
        speaker,
        rawText: actingNote ? `${cleanSpoken}（${actingNote}）` : cleanSpoken,
        spokenText: cleanSpoken,
        actingNote,
        emotionTag,
        roomKind: currentRoom,
        isArrivalCue: false,
      });
      continue;
    }

    const fallbackSpeaker = speakerOrder[0] ?? 'Narrator';
    registerSpeaker(fallbackSpeaker);
    const fallbackBrackets: string[] = [];
    const fallbackClean = line
      .replace(/\[([A-Za-z0-9_-]{2,36})\]/g, (_m, tag: string) => {
        const cleanTag = tag.trim().toLowerCase();
        if (cleanTag) fallbackBrackets.push(cleanTag);
        return '';
      })
      .replace(/\s+/g, ' ')
      .trim();
    drafts.push({
      kind: 'speech',
      speaker: fallbackSpeaker,
      rawText: line,
      spokenText: fallbackClean || line,
      emotionTag: fallbackBrackets[0],
      roomKind: currentRoom,
      isArrivalCue: false,
    });
  }

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
        for (let k = di + 1; k < drafts.length; k++) {
          if (drafts[k].kind === 'speech' && drafts[k].speaker) {
            d.enteringCandidateName = drafts[k].speaker;
            break;
          }
        }
      }
    }
  }

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
        hasFridgeProp: hasFridgeInStory,
        fridgeOpen: false,
        speakerId: enteringId ?? present[0] ?? '',
        speakerName: enteringId ?? '',
        rawText: d.rawText,
        spokenText: d.spokenText,
        emotion: enteringId ? 'happy' : 'calm',
        action: enteringId ? 'walk_in' : 'idle',
        handProp: 'none',
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
    const { emotion, action, fx, handProp, fridgeOpen } = analyzeEmotionAndAction(
      d.spokenText,
      [d.actingNote, d.emotionTag].filter(Boolean).join(' '),
      d.roomKind
    );
    beats.push({
      index: idx,
      isStageCue: false,
      roomKind: d.roomKind,
      hasFridgeProp: hasFridgeInStory,
      fridgeOpen,
      speakerId: spk,
      speakerName: spk,
      rawText: d.rawText,
      spokenText: d.spokenText,
      actingNote: d.actingNote,
      emotionTag: d.emotionTag,
      emotion,
      action,
      handProp,
      fx,
      presentCharacterIds: [...present],
      doorOpen: false,
      estDurationSec: estimateBeatSec(d.spokenText, false),
    });
  });

  return { title, characters, beats };
}

// ============================================================================
// Pure 2D Full-Body Articulated SVG Renderer (Shared Preview & 24fps Export)
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

export function resolveBubbleKaraokeColor(
  highlightColor: string | undefined,
  fallbackDarkAccent: string
): string {
  const candidate = (highlightColor ?? '').trim();
  const hexMatch = candidate.match(/^#([0-9a-f]{6})$/i);
  if (!hexMatch) return fallbackDarkAccent;
  const intVal = parseInt(hexMatch[1], 16);
  const r = ((intVal >> 16) & 255) / 255;
  const g = ((intVal >> 8) & 255) / 255;
  const b = (intVal & 255) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Bright yellow/cyan/white lacks contrast on pastel white/cream bubbles
  return lum > 0.42 ? fallbackDarkAccent : candidate;
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

export function tokenizeAnimeKaraokeLine(line: string): string[] {
  if (!line) return [];
  const hasSpaces = /\s/.test(line);
  const hasCjk = /[\u3040-\u30FF\u4E00-\u9FFF]/.test(line);
  if (hasCjk && !hasSpaces) {
    // Keep ASCII runs (like KY, 10) together while splitting Japanese characters smoothly
    return segmentMixedUnits(line);
  }
  // Word tokens preserving trailing spaces
  return line.match(/\S+\s*/g) ?? [line];
}

export type AnimeMouthViseme = 'closed' | 'a' | 'i' | 'u' | 'e' | 'o';

export interface ComputedCharRig {
  profile: AnimeCharacterProfile;
  x: number;
  y: number; // Ground foot baseline!
  scale: number;
  squashX: number;
  squashY: number;
  facing: 1 | -1;
  hipDropY: number;
  shoulderBreathY: number;
  bodyTiltDeg: number;
  headTiltDeg: number;
  hairSwayDeg: number;
  blinkAmt: number;
  mouthPhase: number;
  mouthViseme: AnimeMouthViseme;
  isSpeaking: boolean;
  isActiveFocus: boolean;
  lookOffsetX: number;
  emotion: AnimeEmotion;
  action: AnimeBodyAction;
  handProp: AnimeHandProp;
  fx: AnimeFxKind;
  leftArmAngle: number;
  leftForearmAngle: number;
  rightArmAngle: number;
  rightForearmAngle: number;
  leftThighAngle: number;
  leftShinAngle: number;
  rightThighAngle: number;
  rightShinAngle: number;
  opacity: number;
}

export function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

export function easeOutBack(t: number, overshoot = 1.45): number {
  const c = Math.max(0, Math.min(1, t));
  const c3 = overshoot + 1;
  return 1 + c3 * Math.pow(c - 1, 3) + overshoot * Math.pow(c - 1, 2);
}

export function easeInOutSine(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

export function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolateRigStates(
  fromRigs: ComputedCharRig[],
  toRigs: ComputedCharRig[],
  rawT: number
): ComputedCharRig[] {
  const t = easeOutCubic(rawT);
  if (t >= 0.999) return toRigs;
  const fromMap = new Map(fromRigs.map((r) => [r.profile.id, r]));

  return toRigs.map((to) => {
    const from = fromMap.get(to.profile.id);
    if (!from) {
      // Newly entering character fades in cleanly without snapping
      return {
        ...to,
        opacity: to.opacity * Math.min(1, t * 1.4),
      };
    }
    const facing = t < 0.35 ? from.facing : to.facing;
    return {
      ...to,
      x: lerpNum(from.x, to.x, t),
      y: lerpNum(from.y, to.y, t),
      scale: lerpNum(from.scale, to.scale, t),
      squashX: lerpNum(from.squashX, to.squashX, t),
      squashY: lerpNum(from.squashY, to.squashY, t),
      facing,
      hipDropY: lerpNum(from.hipDropY, to.hipDropY, t),
      shoulderBreathY: lerpNum(from.shoulderBreathY, to.shoulderBreathY, t),
      bodyTiltDeg: lerpNum(from.bodyTiltDeg, to.bodyTiltDeg, t),
      headTiltDeg: lerpNum(from.headTiltDeg, to.headTiltDeg, t),
      hairSwayDeg: lerpNum(from.hairSwayDeg, to.hairSwayDeg, t),
      lookOffsetX: lerpNum(from.lookOffsetX, to.lookOffsetX, t),
      leftArmAngle: lerpNum(from.leftArmAngle, to.leftArmAngle, t),
      leftForearmAngle: lerpNum(from.leftForearmAngle, to.leftForearmAngle, t),
      rightArmAngle: lerpNum(from.rightArmAngle, to.rightArmAngle, t),
      rightForearmAngle: lerpNum(from.rightForearmAngle, to.rightForearmAngle, t),
      leftThighAngle: lerpNum(from.leftThighAngle, to.leftThighAngle, t),
      leftShinAngle: lerpNum(from.leftShinAngle, to.leftShinAngle, t),
      rightThighAngle: lerpNum(from.rightThighAngle, to.rightThighAngle, t),
      rightShinAngle: lerpNum(from.rightShinAngle, to.rightShinAngle, t),
      opacity: lerpNum(from.opacity, to.opacity, Math.min(1, t * 1.25)),
    };
  });
}

export interface ComputedCameraState {
  scale: number;
  offsetX: number;
  offsetY: number;
  shakeX: number;
  shakeY: number;
}

export function computeAnimeCameraState(params: {
  width: number;
  height: number;
  beat: AnimeStoryboardBeat;
  focusRig: ComputedCharRig | undefined;
  prevBeat?: AnimeStoryboardBeat;
  prevFocusX?: number;
  beatProgress: number;
  timeSec: number;
}): ComputedCameraState {
  const { width, height, beat, focusRig, prevBeat, prevFocusX, beatProgress, timeSec } = params;
  const targetScale = beat.isStageCue
    ? 1.0
    : beat.emotion === 'angry' || beat.emotion === 'shocked'
    ? 1.055
    : 1.024;
  const prevScale =
    !prevBeat || prevBeat.isStageCue
      ? 1.0
      : prevBeat.emotion === 'angry' || prevBeat.emotion === 'shocked'
      ? 1.055
      : 1.024;

  const camEase = easeOutCubic(Math.min(1, beatProgress / 0.28));
  const scale = lerpNum(prevScale, targetScale, camEase) + Math.sin(timeSec * 0.9) * 0.003;

  const targetFocusX = focusRig ? focusRig.x : width * 0.5;
  const startFocusX = prevFocusX ?? targetFocusX;
  const curFocusX = lerpNum(startFocusX, targetFocusX, camEase);
  const offsetX = (width * 0.5 - curFocusX) * 0.095 + Math.sin(timeSec * 0.65) * 2.5;
  const offsetY = (height * 0.5 - height * 0.54) * 0.03 + Math.cos(timeSec * 0.8) * 1.8;

  // Impact micro-shake for shock or anger during opening 0.35s of beat
  const impactWindow =
    (beat.emotion === 'shocked' || beat.emotion === 'angry' || beat.action === 'jump_recoil') &&
    beatProgress < 0.28
      ? (1 - beatProgress / 0.28)
      : 0;
  const shakeAmp = impactWindow * impactWindow * (beat.emotion === 'shocked' ? 6.5 : 4.2);
  const shakeX = shakeAmp > 0.05 ? Math.sin(timeSec * 52) * shakeAmp : 0;
  const shakeY = shakeAmp > 0.05 ? Math.cos(timeSec * 44) * shakeAmp * 0.7 : 0;

  return { scale, offsetX, offsetY, shakeX, shakeY };
}

export function computeAnimeRigStates(params: {
  story: ParsedAnimeStory;
  beat: AnimeStoryboardBeat;
  timeSec: number;
  beatProgress: number; // 0..1 inside active beat
  width: number;
  height: number;
  isPlayingSpeech: boolean;
  audioAmplitude?: number; // optional real-time RMS 0..1 from live TTS AnalyserNode
}): ComputedCharRig[] {
  const {
    story,
    beat,
    timeSec,
    beatProgress,
    width,
    height,
    isPlayingSpeech,
    audioAmplitude,
  } = params;
  const presentIds =
    beat.presentCharacterIds.length > 0
      ? beat.presentCharacterIds
      : story.characters.map((c) => c.id);

  const count = presentIds.length;
  const isPortrait = height > width;
  // Full-body character is ~275 local units tall from shoes (0) to hair top (-275)
  const baseScale = isPortrait
    ? Math.min(width / 720, height / 1280) * (count >= 3 ? 0.96 : 1.06)
    : Math.min(width / 1280, height / 720) * (count >= 3 ? 0.88 : 0.94);

  const stageY = isPortrait ? height * 0.74 : height * 0.79;
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
    const breathPhase = timeSec * 2.4 + profile.phaseSeed;
    const swayPhase = timeSec * 1.35 + profile.phaseSeed;

    let x = xSlots[idx] + Math.sin(swayPhase * 0.7) * 2.2;
    let y = stageY;
    let squashX = 1 + Math.sin(breathPhase) * 0.012;
    let squashY = 1 - Math.sin(breathPhase) * 0.012;
    let hipDropY = Math.sin(breathPhase) * 2.1;
    let shoulderBreathY = -Math.sin(breathPhase - 0.35) * 1.4;
    let bodyTiltDeg = Math.sin(swayPhase) * 1.6;
    let headTiltDeg = Math.sin(timeSec * 1.9 + profile.phaseSeed + 0.55) * 2.4;
    let hairSwayDeg = -bodyTiltDeg * 0.55 + Math.sin(timeSec * 2.1 + profile.phaseSeed - 0.8) * 2.2;
    let opacity = 1;

    const isActive = !beat.isStageCue && beat.speakerId === id;
    const isEntering = beat.isStageCue && beat.enteringCharacterId === id;
    const listenerNervous =
      !isActive &&
      !isEntering &&
      !beat.isStageCue &&
      (beat.emotion === 'angry' || beat.action === 'lean_confront') &&
      idx === presentIds.length - 1;

    const emotion: AnimeEmotion = isActive
      ? beat.emotion
      : isEntering
      ? 'happy'
      : listenerNervous
      ? 'apologetic'
      : 'calm';
    const action: AnimeBodyAction = isActive
      ? beat.action
      : isEntering
      ? 'walk_in'
      : listenerNervous
      ? 'nervous_fidget'
      : 'idle';
    const fx: AnimeFxKind = isActive
      ? beat.fx
      : isEntering
      ? 'sparkle'
      : listenerNervous
      ? 'sweat'
      : 'none';
    const handProp: AnimeHandProp = isActive ? beat.handProp : 'none';

    const blinkCycle = (timeSec * 0.32 + profile.phaseSeed * 0.41) % 1;
    const blinkAmt =
      emotion === 'apologetic' && action === 'bow_deep'
        ? 0.92
        : blinkCycle > 0.94
        ? Math.sin(((blinkCycle - 0.94) / 0.06) * Math.PI)
        : 0;

    // Facing direction: +1 faces right, -1 faces left
    let facing: 1 | -1 =
      count === 1
        ? 1
        : isActive
        ? idx === count - 1 && count >= 2
          ? -1
          : 1
        : activeSpeakerX >= x
        ? 1
        : -1;
    const lookOffsetX = isActive
      ? 2.0 + Math.sin(timeSec * 1.1 + profile.phaseSeed) * 0.7
      : 2.5 + Math.sin(timeSec * 0.9 + profile.phaseSeed) * 0.6;

    // Default articulated limb angles with subtle organic breathing & weight-shift
    const weightShift = Math.sin(swayPhase);
    let leftArmAngle = 15 + Math.sin(breathPhase + 0.4) * 4.5; // back arm
    let leftForearmAngle = -15 + Math.cos(breathPhase) * 3.5;
    let rightArmAngle = -15 - Math.sin(breathPhase + 0.9) * 4.5; // front arm
    let rightForearmAngle = -20 + Math.sin(breathPhase + 1.1) * 4.0;

    let leftThighAngle = 4.5 + weightShift * 2.4;
    let leftShinAngle = 2 + Math.max(0, -weightShift) * 2.0;
    let rightThighAngle = -4.5 - weightShift * 2.4;
    let rightShinAngle = 2 + Math.max(0, weightShift) * 2.0;

    if (action === 'walk_in') {
      facing = -1; // walking in from the right door towards center!
      const tWalk = Math.min(1, beatProgress / 0.68);
      const easeOut = 1 - Math.pow(1 - tWalk, 3);
      const startX = width * 1.05;
      x = startX + (xSlots[idx] - startX) * easeOut;
      if (tWalk < 0.96) {
        const stride = tWalk * Math.PI * 5;
        const swing = Math.sin(stride);
        hipDropY = -Math.abs(swing) * 7;
        bodyTiltDeg = 7;
        leftThighAngle = swing * 28;
        leftShinAngle = Math.max(4, -Math.cos(stride) * 32);
        rightThighAngle = -swing * 28;
        rightShinAngle = Math.max(4, Math.cos(stride) * 32);
        leftArmAngle = -swing * 26;
        leftForearmAngle = -24;
        rightArmAngle = swing * 26;
        rightForearmAngle = -28;
      } else {
        facing = idx === count - 1 ? -1 : 1;
      }
      opacity = Math.min(1, tWalk * 3.5);
    } else if (action === 'check_fridge_panic') {
      // Phase 1 (0..0.38): step left toward fridge & peer inside; Phase 2 (0.38..1): stagger back clutching head!
      const fridgeTargetX = Math.max(width * 0.14, xSlots[idx] - width * 0.08);
      if (beatProgress < 0.38) {
        facing = -1;
        const tStep = Math.min(1, beatProgress / 0.28);
        x = xSlots[idx] + (fridgeTargetX - xSlots[idx]) * tStep;
        bodyTiltDeg = 18 * tStep;
        headTiltDeg = 8;
        hipDropY = 5 * tStep;
        leftThighAngle = -14 * tStep;
        leftShinAngle = 16 * tStep;
        rightThighAngle = 12 * tStep;
        rightShinAngle = 6 * tStep;
        rightArmAngle = -58 * tStep;
        rightForearmAngle = -18;
      } else {
        facing = 1;
        const recoilT = Math.min(1, (beatProgress - 0.38) / 0.25);
        const bounce = Math.sin(recoilT * Math.PI) * 14;
        x = fridgeTargetX + (xSlots[idx] - fridgeTargetX) * recoilT;
        y -= bounce * baseScale;
        hipDropY = 8;
        bodyTiltDeg = -9 + Math.sin(timeSec * 14) * 1.5;
        headTiltDeg = -8;
        leftThighAngle = -14;
        leftShinAngle = 18;
        rightThighAngle = 16;
        rightShinAngle = 12;
        // Both hands clutch cheeks / head in panic!
        leftArmAngle = -126;
        leftForearmAngle = -92;
        rightArmAngle = -122;
        rightForearmAngle = -96;
      }
    } else if (action === 'bow_deep') {
      const bowEnv = Math.sin(Math.min(1, beatProgress * 1.15) * Math.PI * 0.88);
      const holdBow = Math.max(0.55, bowEnv);
      x += facing * 12 * baseScale;
      hipDropY = 18 * holdBow;
      bodyTiltDeg = 46 * holdBow;
      headTiltDeg = 18 * holdBow;
      leftThighAngle = -20 * holdBow;
      leftShinAngle = 24 * holdBow;
      rightThighAngle = -14 * holdBow;
      rightShinAngle = 20 * holdBow;
      // Hands pressed down straight along knees/thighs (authentic Japanese ojigi)
      leftArmAngle = 10;
      leftForearmAngle = 6;
      rightArmAngle = 14;
      rightForearmAngle = 8;
      const bounce = Math.sin(Math.min(1, beatProgress / 0.35) * Math.PI);
      squashX = 1 - bounce * 0.04;
      squashY = 1 + bounce * 0.05;
      hairSwayDeg = -6 - Math.sin(timeSec * 7.5) * 4.5;
    } else if (action === 'jump_recoil') {
      const crouch = beatProgress < 0.14 ? (beatProgress / 0.14) * 12 : 0;
      const hop = beatProgress >= 0.14 && beatProgress < 0.48
        ? Math.sin(((beatProgress - 0.14) / 0.34) * Math.PI)
        : 0;
      const stepBack = Math.min(1, beatProgress / 0.35) * 18 * baseScale;
      x -= facing * stepBack;
      y -= hop * 28 * baseScale;
      hipDropY = crouch;
      if (beatProgress < 0.14) {
        squashX = 1.09;
        squashY = 0.91;
      } else if (hop > 0.1) {
        squashX = 1 - hop * 0.08;
        squashY = 1 + hop * 0.09;
      }
      hairSwayDeg = hop * 14 + Math.sin(timeSec * 13) * 4;
      bodyTiltDeg = -10 * hop + Math.sin(timeSec * 14) * 1.5;
      headTiltDeg = -8;
      leftThighAngle = -18 - hop * 12;
      leftShinAngle = 24 + hop * 22;
      rightThighAngle = 18 + hop * 8;
      rightShinAngle = 12 + hop * 18;
      leftArmAngle = -88 + Math.sin(timeSec * 12) * 12;
      leftForearmAngle = -55;
      rightArmAngle = -96 - Math.sin(timeSec * 12) * 12;
      rightForearmAngle = -58;
    } else if (action === 'lean_confront') {
      const stepFwd = easeOutCubic(Math.min(1, beatProgress / 0.32));
      x += facing * 26 * stepFwd * baseScale;
      const leanPulse = 0.72 + 0.28 * Math.sin(timeSec * 6);
      bodyTiltDeg = 12 * leanPulse;
      headTiltDeg = 6;
      hipDropY = 4;
      hairSwayDeg = -7 + Math.sin(timeSec * 6) * 3;
      leftThighAngle = 15; // back leg braced
      leftShinAngle = 4;
      rightThighAngle = -16; // front leg stepped forward
      rightShinAngle = 14;
      // Back arm on hip, front arm pointing straight at culprit!
      leftArmAngle = 32;
      leftForearmAngle = -68;
      rightArmAngle = -84 - Math.sin(timeSec * 8) * 10;
      rightForearmAngle = -8;
    } else if (action === 'lean_whisper') {
      // Step closer to nearest listener!
      const nearestPartnerIdx = idx === 0 ? 1 : idx - 1;
      const partnerX = xSlots[Math.min(xSlots.length - 1, Math.max(0, nearestPartnerIdx))];
      const stepDir = partnerX >= x ? 1 : -1;
      facing = stepDir;
      const slideT = easeOutCubic(Math.min(1, beatProgress / 0.35));
      x += stepDir * Math.min(54, Math.abs(partnerX - x) * 0.34) * slideT * baseScale;
      bodyTiltDeg = 14;
      headTiltDeg = 8;
      hipDropY = 6;
      leftThighAngle = 12;
      leftShinAngle = 10;
      rightThighAngle = -16;
      rightShinAngle = 18;
      // Front hand cupped next to mouth, back arm tucked slightly behind
      rightArmAngle = -102;
      rightForearmAngle = -88;
      leftArmAngle = 22;
      leftForearmAngle = -24;
    } else if (action === 'scratch_head') {
      bodyTiltDeg = -4;
      headTiltDeg = 11 + Math.sin(timeSec * 4) * 2;
      hipDropY = 4;
      leftThighAngle = -10;
      leftShinAngle = 14;
      rightThighAngle = 6;
      rightShinAngle = 2;
      // Left hand on hip, right hand raised behind head scratching sheepishly
      leftArmAngle = 28;
      leftForearmAngle = -64;
      rightArmAngle = -132;
      rightForearmAngle = -92 + Math.sin(timeSec * 8) * 9;
    } else if (action === 'point_advise') {
      bodyTiltDeg = 4;
      hipDropY = 2;
      leftThighAngle = 8;
      leftShinAngle = 2;
      rightThighAngle = -10;
      rightShinAngle = 6;
      leftArmAngle = 18;
      leftForearmAngle = -72; // hand across waist/clipboard
      rightArmAngle = -104 + Math.sin(timeSec * 5.2) * 8;
      rightForearmAngle = -28;
    } else if (action === 'hold_prop_offer') {
      const stepT = easeOutCubic(Math.min(1, beatProgress / 0.35));
      x += facing * 18 * stepT * baseScale;
      bodyTiltDeg = 6;
      hipDropY = 2;
      leftThighAngle = 10;
      leftShinAngle = 4;
      rightThighAngle = -12;
      rightShinAngle = 8;
      // Extend prop forward cleanly
      rightArmAngle = -68 + Math.sin(timeSec * 4) * 5;
      rightForearmAngle = -28;
      leftArmAngle = 18;
      leftForearmAngle = -22;
    } else if (action === 'cheer_wave') {
      const wave = Math.sin(timeSec * 8.5);
      const hopAmt = Math.abs(wave);
      y -= hopAmt * 7 * baseScale;
      squashX = 1 - hopAmt * 0.035;
      squashY = 1 + hopAmt * 0.04;
      hairSwayDeg = wave * 7;
      hipDropY = 0;
      leftThighAngle = -8 + wave * 6;
      leftShinAngle = 10;
      rightThighAngle = 8 - wave * 6;
      rightShinAngle = 10;
      rightArmAngle = -128 + wave * 18;
      rightForearmAngle = -24 + wave * 14;
      leftArmAngle = 36 - wave * 12;
      leftForearmAngle = -34;
    } else if (action === 'nervous_fidget') {
      const fidget = Math.sin(timeSec * 9.5);
      x -= facing * 10 * baseScale;
      hipDropY = 8;
      bodyTiltDeg = -6 + fidget * 1.8;
      headTiltDeg = 6;
      leftThighAngle = -12;
      leftShinAngle = 16;
      rightThighAngle = 10;
      rightShinAngle = 12;
      leftArmAngle = 16;
      leftForearmAngle = -58;
      rightArmAngle = -22;
      rightForearmAngle = -66 + fidget * 6;
    } else if (action === 'gesture_talk') {
      const g = Math.sin(timeSec * 6.5 + profile.phaseSeed);
      const sway = Math.sin(timeSec * 2.1 + profile.phaseSeed);
      hipDropY = 2 + Math.abs(sway) * 2.4;
      bodyTiltDeg = sway * 2.2;
      headTiltDeg = Math.sin(timeSec * 3.4 + profile.phaseSeed) * 3.2;
      leftThighAngle = 6 + sway * 4;
      leftShinAngle = 4;
      rightThighAngle = -8 - sway * 4;
      rightShinAngle = 6;
      rightArmAngle = -52 + g * 18;
      rightForearmAngle = -42 + Math.cos(timeSec * 6.5) * 14;
      leftArmAngle = 18 - g * 8;
      leftForearmAngle = -34;
    }

    const isSpeaking = isActive && isPlayingSpeech;
    const rawFallbackMouth = Math.abs(
      Math.sin(timeSec * 14.5 + profile.phaseSeed) * 0.58 +
        Math.sin(timeSec * 23.0) * 0.28 +
        Math.sin(timeSec * 9.2) * 0.14
    );
    const hasAudioLevel = typeof audioAmplitude === 'number' && Number.isFinite(audioAmplitude);
    const mouthPhase = isSpeaking
      ? hasAudioLevel
        ? Math.min(1, Math.max(0.05, audioAmplitude * 1.55))
        : rawFallbackMouth
      : 0;
    const visemeCycle = Math.floor(timeSec * 9.5) % 5;
    const mouthViseme: AnimeMouthViseme =
      !isSpeaking || mouthPhase <= 0.14
        ? 'closed'
        : mouthPhase > 0.68
        ? 'a'
        : visemeCycle === 0
        ? 'a'
        : visemeCycle === 1
        ? 'e'
        : visemeCycle === 2
        ? 'o'
        : visemeCycle === 3
        ? 'i'
        : 'u';

    return {
      profile,
      x,
      y,
      scale: baseScale,
      squashX,
      squashY,
      facing,
      hipDropY,
      shoulderBreathY,
      bodyTiltDeg,
      headTiltDeg,
      hairSwayDeg,
      blinkAmt,
      mouthPhase,
      mouthViseme,
      isSpeaking,
      isActiveFocus: isActive || isEntering,
      lookOffsetX,
      emotion,
      action,
      handProp,
      fx,
      leftArmAngle,
      leftForearmAngle,
      rightArmAngle,
      rightForearmAngle,
      leftThighAngle,
      leftShinAngle,
      rightThighAngle,
      rightShinAngle,
      opacity,
    };
  });
}

function renderHandPropSvg(prop: AnimeHandProp): string {
  if (prop === 'coffee_cup') {
    return `<g transform="translate(4,34)">
      <rect x="-8" y="-12" width="16" height="18" rx="3" fill="#FFFBEB" stroke="#1E1B18" stroke-width="2"/>
      <rect x="-9" y="-15" width="18" height="5" rx="2" fill="#78350F" stroke="#1E1B18" stroke-width="1.6"/>
      <rect x="-8" y="-6" width="16" height="6" fill="#D97706" fill-opacity="0.75"/>
    </g>`;
  }
  if (prop === 'popsicle_box') {
    return `<g transform="translate(8,32)">
      <rect x="-15" y="-11" width="30" height="20" rx="4" fill="#38BDF8" stroke="#0369A1" stroke-width="2"/>
      <rect x="-10" y="-6" width="20" height="10" rx="2" fill="#E0F2FE"/>
      <line x1="-6" y1="-1" x2="6" y2="-1" stroke="#0284C7" stroke-width="2.2"/>
    </g>`;
  }
  if (prop === 'beer_case') {
    return `<g transform="translate(10,30)">
      <rect x="-17" y="-13" width="34" height="24" rx="4" fill="#FBBF24" stroke="#92400E" stroke-width="2.2"/>
      <rect x="-11" y="-8" width="22" height="12" rx="2" fill="#FEF3C7"/>
      <circle cx="-4" cy="-2" r="3.5" fill="#B45309"/>
      <circle cx="5" cy="-2" r="3.5" fill="#B45309"/>
    </g>`;
  }
  if (prop === 'clipboard') {
    return `<g transform="translate(6,34)">
      <rect x="-11" y="-15" width="22" height="28" rx="3" fill="#FFFFFF" stroke="#334155" stroke-width="2"/>
      <rect x="-6" y="-18" width="12" height="5" rx="2" fill="#64748B"/>
      <line x1="-7" y1="-6" x2="7" y2="-6" stroke="#94A3B8" stroke-width="2"/>
      <line x1="-7" y1="0" x2="7" y2="0" stroke="#94A3B8" stroke-width="2"/>
      <line x1="-7" y1="6" x2="4" y2="6" stroke="#94A3B8" stroke-width="2"/>
    </g>`;
  }
  return '';
}

function renderAnimeCharacterSvg(rig: ComputedCharRig, timeSec: number): string {
  const {
    profile,
    x,
    y,
    scale,
    squashX,
    squashY,
    facing,
    hipDropY,
    shoulderBreathY,
    bodyTiltDeg,
    headTiltDeg,
    hairSwayDeg,
    blinkAmt,
    mouthPhase,
    mouthViseme,
    isSpeaking,
    emotion,
    handProp,
    fx,
    opacity,
  } = rig;
  const {
    gender,
    hairStyle,
    hairHex,
    hairShadeHex,
    outfitHex,
    outfitAccentHex,
    pantsHex,
    shoeHex,
    skinHex,
    nameBadgeHex,
  } = profile;
  const det = getAnimeCharacterVisualDetail(profile);
  const ink = '#3B2828';

  // Layered glossy back hair (female bob/neat extends gracefully behind shoulders with feathered ends)
  const backHairSvg =
    hairStyle === 'bob'
      ? `<g transform="rotate(${(hairSwayDeg * 0.65).toFixed(2)}, 0, -148)">
           <path d="M-47 -144 C-57 -112 -57 -66 -43 -46 C-28 -52 -14 -45 0 -46 C14 -45 28 -52 43 -46 C57 -66 57 -112 47 -144 Z" fill="${hairShadeHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
           <path d="M-42 -126 C-49 -96 -48 -68 -39 -52 L-24 -52 C-28 -74 -30 -104 -30 -126 Z" fill="${hairHex}" fill-opacity="0.45"/>
           <path d="M42 -126 C49 -96 48 -68 39 -52 L24 -52 C28 -74 30 -104 30 -126 Z" fill="${hairHex}" fill-opacity="0.45"/>
         </g>`
      : hairStyle === 'neat' && gender === 'female'
      ? `<g transform="rotate(${(hairSwayDeg * 0.65).toFixed(2)}, 0, -148)">
           <path d="M-46 -144 C-56 -104 -54 -56 -40 -38 C-26 -44 -12 -38 0 -40 C12 -38 26 -44 40 -38 C54 -56 56 -104 46 -144 Z" fill="${hairShadeHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
           <path d="M-44 -90 Q-32 -84 -20 -90 M20 -90 Q32 -84 44 -90" fill="none" stroke="${det.hairHighlightHex}" stroke-opacity="0.32" stroke-width="2.2" stroke-linecap="round"/>
         </g>`
      : `<g transform="rotate(${(hairSwayDeg * 0.5).toFixed(2)}, 0, -148)">
           <path d="M-40 -142 C-45 -124 -44 -108 -34 -98 L34 -98 C44 -108 45 -124 40 -142 Z" fill="${hairShadeHex}"/>
         </g>`;

  // Cheek-framing hime / temple strands (transforms cartoon outline into authentic Live2D anime hair)
  const sideLocksSvg =
    gender === 'female'
      ? `<path d="M-45 -158 C-48 -134 -46 -106 -33 -86 C-30 -98 -33 -120 -35 -146 Z" fill="${hairHex}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>
         <path d="M45 -158 C48 -134 46 -106 33 -86 C30 -98 33 -120 35 -146 Z" fill="${hairHex}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>`
      : `<path d="M-43 -154 C-45 -136 -43 -118 -35 -106 C-33 -118 -35 -134 -36 -148 Z" fill="${hairHex}" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>
         <path d="M43 -154 C45 -136 43 -118 35 -106 C33 -118 35 -134 36 -148 Z" fill="${hairHex}" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>`;

  // Curved "Angel Ring" glossy hair specular highlight band across the crown/bangs
  const hairHighlightArcSvg = `
    <path d="M-26 -175 Q-12 -183 0 -177 Q14 -183 26 -173" fill="none" stroke="${det.hairHighlightHex}" stroke-opacity="0.28" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M-18 -170 Q-8 -175 -2 -172 M8 -172 Q16 -176 22 -170" fill="none" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="1.5" stroke-linecap="round"/>
  `;

  // Side ribbon bow (e.g. golden-amber ribbon like NTT XR Concierge) or hair clip
  const sideRibbonBowSvg = det.hasSideBow
    ? `<g transform="translate(35,-166) rotate(-22)">
         <path d="M0 0 L-12 -9 C-16 -4 -14 5 -9 7 Z" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>
         <path d="M0 0 L13 -7 C16 -1 14 7 8 8 Z" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>
         <path d="M-2 2 L-7 15 L-1 13 Z" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
         <path d="M2 2 L9 14 L3 14 Z" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
         <circle cx="0" cy="0" r="3.6" fill="#FEF3C7" stroke="${ink}" stroke-width="1.5"/>
       </g>`
    : '';

  const frontHairSvg =
    hairStyle === 'spiky'
      ? `<g transform="rotate(${(hairSwayDeg * 0.45).toFixed(2)}, 0, -165)">
           ${sideLocksSvg}
           <path d="M-44 -148 C-45 -186 -15 -202 8 -196 C32 -196 47 -176 45 -146 C40 -157 31 -165 23 -150 C15 -168 2 -149 -6 -166 C-16 -148 -30 -162 -44 -148 Z" fill="${hairHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
           <path d="M-36 -184 L-47 -199 L-22 -190 L-7 -206 L6 -190 L27 -203 L25 -182" fill="${hairHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
           ${hairHighlightArcSvg}
         </g>`
      : hairStyle === 'bob'
      ? `<g transform="rotate(${(hairSwayDeg * 0.4).toFixed(2)}, 0, -165)">
           ${sideLocksSvg}
           <path d="M-46 -146 C-47 -188 -16 -202 0 -202 C18 -202 47 -188 46 -146 C37 -158 26 -159 18 -147 C11 -159 5 -159 0 -145 C-5 -159 -12 -159 -19 -147 C-27 -159 -37 -157 -46 -146 Z" fill="${hairHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
           ${hairHighlightArcSvg}
           ${sideRibbonBowSvg}
         </g>`
      : `<g transform="rotate(${(hairSwayDeg * 0.45).toFixed(2)}, 0, -165)">
           ${sideLocksSvg}
           <path d="M-45 -146 C-46 -187 -16 -202 3 -201 C26 -200 46 -182 45 -146 C35 -159 23 -150 13 -162 C4 -146 -6 -161 -17 -148 C-28 -160 -38 -154 -45 -146 Z" fill="${hairHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
           ${hairHighlightArcSvg}
         </g>`;

  const eyeScaleY = Math.max(0.08, 1 - blinkAmt);
  let eyesSvg = '';
  if (emotion === 'apologetic' && rig.action === 'bow_deep') {
    eyesSvg = `
      <path d="M-24 -128 L-10 -122 L-24 -116" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 -128 L10 -122 L24 -116" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (emotion === 'happy' || emotion === 'wry_smile') {
    eyesSvg = `
      <path d="M-27 -120 Q-17 -132 -8 -120" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M-28 -121 L-24 -124" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M8 -120 Q17 -132 27 -120" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M28 -121 L24 -124" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
  } else {
    const irisRx = emotion === 'shocked' ? 5.0 : 7.4;
    const irisRy = emotion === 'shocked' ? 5.8 : 8.6;
    const pupilR = emotion === 'shocked' ? 2.1 : 3.0;
    const pupilDx = rig.lookOffsetX;
    const renderOneEye = (cx: number, wingDir: number) => `
      <g transform="translate(${cx},-121) scale(1,${eyeScaleY.toFixed(2)})">
        <!-- Soft borderless Live2D white sclera + gentle upper shadow -->
        <ellipse cx="0" cy="0" rx="10" ry="9.2" fill="#FFFFFF"/>
        <path d="M-9.2 -3 Q0 -9.6 9.2 -3 L9.2 -6 Q0 -11 -9.2 -6 Z" fill="#CBD5E1" fill-opacity="0.5"/>
        <!-- Large vivid multi-layer Live2D iris touching upper/lower lids -->
        <ellipse cx="${pupilDx.toFixed(1)}" cy="0.2" rx="${irisRx}" ry="${irisRy}" fill="${det.irisMainHex}"/>
        <ellipse cx="${pupilDx.toFixed(1)}" cy="${(-irisRy * 0.34).toFixed(1)}" rx="${(irisRx * 0.92).toFixed(1)}" ry="${(irisRy * 0.52).toFixed(1)}" fill="${det.irisDarkHex}" fill-opacity="0.72"/>
        <ellipse cx="${pupilDx.toFixed(1)}" cy="${(irisRy * 0.54).toFixed(1)}" rx="${(irisRx * 0.72).toFixed(1)}" ry="${(irisRy * 0.28).toFixed(1)}" fill="${det.irisGlowHex}" fill-opacity="0.88"/>
        <circle cx="${pupilDx.toFixed(1)}" cy="0.4" r="${pupilR}" fill="#0F172A"/>
        <circle cx="${(pupilDx - 2.4).toFixed(1)}" cy="-2.8" r="2.7" fill="#FFFFFF"/>
        <circle cx="${(pupilDx + 2.5).toFixed(1)}" cy="3.1" r="1.3" fill="#FFFFFF" fill-opacity="0.96"/>
        <!-- Plush curved upper eyelash with wing & delicate double-eyelid crease -->
        <path d="M${(-10.2 * wingDir).toFixed(1)} -2.2 Q0 -11.4 ${(11.5 * wingDir).toFixed(1)} -1.2" fill="none" stroke="${ink}" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M${(-6.5 * wingDir).toFixed(1)} -12.4 Q0 -15.0 ${(7.2 * wingDir).toFixed(1)} -12.0" fill="none" stroke="${ink}" stroke-opacity="0.52" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M-5.8 8.8 Q0 10.0 5.8 8.8" fill="none" stroke="${ink}" stroke-opacity="0.48" stroke-width="1.2" stroke-linecap="round"/>
      </g>`;
    eyesSvg = `${renderOneEye(-17, -1)}${renderOneEye(17, 1)}`;
  }

  // Optional stylish round Live2D glasses (e.g. CHELULU look for 'neat' female)
  const glassesSvg = det.hasGlasses
    ? `<g opacity="0.92">
         <circle cx="-17" cy="-120" r="11.5" fill="#ECFEFF" fill-opacity="0.16" stroke="${det.glassesFrameHex}" stroke-width="2.1"/>
         <circle cx="17" cy="-120" r="11.5" fill="#ECFEFF" fill-opacity="0.16" stroke="${det.glassesFrameHex}" stroke-width="2.1"/>
         <path d="M-5.5 -121 Q0 -123.5 5.5 -121" fill="none" stroke="${det.glassesFrameHex}" stroke-width="2"/>
         <line x1="-22" y1="-125" x2="-17" y2="-118" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>
         <line x1="12" y1="-125" x2="17" y2="-118" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>
       </g>`
    : '';

  let browsSvg = '';
  if (emotion === 'angry') {
    browsSvg = `
      <path d="M-28 -140 L-7 -132" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      <path d="M28 -140 L7 -132" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (emotion === 'apologetic' || emotion === 'wry_smile') {
    browsSvg = `
      <path d="M-27 -134 L-8 -140" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M27 -134 L8 -140" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  } else if (emotion === 'shocked') {
    browsSvg = `
      <path d="M-26 -143 Q-17 -149 -8 -143" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M8 -143 Q17 -149 26 -143" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  } else {
    browsSvg = `
      <path d="M-26 -138 Q-17 -142 -8 -138" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>
      <path d="M8 -138 Q17 -142 26 -138" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>`;
  }

  let mouthSvg = '';
  if (isSpeaking && mouthPhase > 0.14) {
    const mh =
      mouthViseme === 'i'
        ? 2.6 + mouthPhase * 4.5
        : mouthViseme === 'o' || mouthViseme === 'u'
        ? 4.2 + mouthPhase * 7.6
        : 3.4 + mouthPhase * 9.0;
    const mw =
      mouthViseme === 'i' || mouthViseme === 'e'
        ? 7.6 + mouthPhase * 3.2
        : mouthViseme === 'u' || mouthViseme === 'o'
        ? 4.2 + mouthPhase * 2.6
        : 5.4 + (1 - mouthPhase * 0.3) * 4.8;
    const teethSvg =
      mh >= 5.2 && (mouthViseme === 'a' || mouthViseme === 'e' || mouthViseme === 'i')
        ? `<path d="M${(-mw * 0.72).toFixed(1)} ${(-96 - mh * 0.45).toFixed(1)} Q0 ${(-96 - mh * 0.85).toFixed(1)} ${(mw * 0.72).toFixed(1)} ${(-96 - mh * 0.45).toFixed(1)} L${(mw * 0.62).toFixed(1)} ${(-96 - mh * 0.18).toFixed(1)} L${(-mw * 0.62).toFixed(1)} ${(-96 - mh * 0.18).toFixed(1)} Z" fill="#FFFFFF" fill-opacity="0.92"/>`
        : '';
    mouthSvg = `<ellipse cx="0" cy="-96" rx="${mw.toFixed(1)}" ry="${mh.toFixed(1)}" fill="#881337" stroke="${ink}" stroke-width="1.9"/>
                <ellipse cx="0" cy="${(-96 + mh * 0.42).toFixed(1)}" rx="${(mw * 0.66).toFixed(1)}" ry="${(mh * 0.36).toFixed(1)}" fill="#FB7185"/>
                ${teethSvg}`;
  } else if (emotion === 'happy') {
    mouthSvg = `<path d="M-9 -99 Q0 -89 9 -99" fill="#FB7185" fill-opacity="0.35" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;
  } else if (emotion === 'angry') {
    mouthSvg = `<path d="M-9 -94 Q0 -100 9 -94" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;
  } else if (emotion === 'shocked') {
    mouthSvg = `<ellipse cx="0" cy="-95" rx="5.5" ry="7.2" fill="#881337" stroke="${ink}" stroke-width="1.9"/>`;
  } else if (emotion === 'wry_smile') {
    mouthSvg = `<path d="M-8 -97 Q-1 -91 8 -98" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
  } else {
    mouthSvg = `<path d="M-6.5 -96 Q0 -93.2 6.5 -96" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>`;
  }

  // Unflipped Comic FX anchored cleanly above head
  let fxSvg = '';
  if (fx === 'anger_cross') {
    const pulse = 1 + Math.sin(timeSec * 12) * 0.16;
    fxSvg = `<g transform="translate(38,${(-252 + hipDropY).toFixed(1)}) scale(${pulse.toFixed(2)})">
      <path d="M-9 -3 Q-3 -3 -3 -9 M3 -9 Q3 -3 9 -3 M9 3 Q3 3 3 9 M-3 9 Q-3 3 -9 3" fill="none" stroke="#EF4444" stroke-width="3.4" stroke-linecap="round"/>
    </g>`;
  } else if (fx === 'sweat') {
    const dropY = (timeSec * 18) % 10;
    fxSvg = `<g transform="translate(-42,${(-230 + hipDropY + dropY).toFixed(1)})">
      <path d="M0 -10 C5 -2 7 3 7 6 A7 7 0 1 1 -7 6 C-7 3 -5 -2 0 -10 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
    </g>`;
  } else if (fx === 'shock_burst') {
    const pop = 1 + Math.sin(timeSec * 15) * 0.14;
    fxSvg = `<g transform="translate(${40 * facing},${(-256 + hipDropY).toFixed(1)}) scale(${pop.toFixed(2)})">
      <line x1="-4" y1="-16" x2="-4" y2="2" stroke="#EF4444" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="-4" cy="10" r="2.8" fill="#EF4444"/>
      <line x1="8" y1="-13" x2="12" y2="3" stroke="#F59E0B" stroke-width="3.6" stroke-linecap="round"/>
    </g>`;
  } else if (fx === 'whisper_wave') {
    const wShift = Math.sin(timeSec * 8) * 3;
    fxSvg = `<g transform="translate(${(38 * facing).toFixed(1)},${(-192 + hipDropY + wShift).toFixed(1)})">
      <path d="M0 -8 Q${10 * facing} 0 0 8" fill="none" stroke="#0D9488" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M${7 * facing} -12 Q${19 * facing} 0 ${7 * facing} 12" fill="none" stroke="#0D9488" stroke-width="2.4" stroke-linecap="round" stroke-opacity="0.7"/>
    </g>`;
  } else if (fx === 'sparkle') {
    const spin = 0.85 + 0.25 * Math.sin(timeSec * 7);
    fxSvg = `<g transform="translate(38,${(-250 + hipDropY).toFixed(1)}) scale(${spin.toFixed(2)})">
      <path d="M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3 Z" fill="#FBBF24" stroke="#D97706" stroke-width="1.6"/>
    </g>`;
  }

  const legUpperFill = gender === 'female' ? skinHex : pantsHex;
  const legLowerFill = gender === 'female' ? '#F8FAFC' : pantsHex;

  const renderLeg = (hipX: number, thighDeg: number, shinDeg: number, isBack: boolean) => `
    <g transform="translate(${hipX},${(-82 + hipDropY).toFixed(1)}) rotate(${thighDeg.toFixed(1)})" opacity="${isBack ? '0.92' : '1'}">
      <path d="M-8.5 -2 L8.5 -2 L7 39 C4 43 -4 43 -7 39 Z" fill="${legUpperFill}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
      <g transform="translate(0,40) rotate(${shinDeg.toFixed(1)})">
        <path d="M-7 -2 L7 -2 L6 37 C3 40 -3 40 -6 37 Z" fill="${legLowerFill}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
        ${
          gender === 'female'
            ? `<rect x="-7.2" y="-1" width="14.4" height="4.5" rx="1.8" fill="${pantsHex}" stroke="${ink}" stroke-width="1.2"/>`
            : `<line x1="0" y1="4" x2="0" y2="33" stroke="${det.skirtOrPantsShadeHex}" stroke-opacity="0.35" stroke-width="1.4"/>`
        }
        <path d="M-8 36 L13 36 C18 36 20 44 13 45 L-8 45 C-11 45 -11 36 -8 36 Z" fill="${shoeHex}" stroke="${ink}" stroke-width="2"/>
        <path d="M-4 37.5 Q5 37.5 12 39" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1.4" stroke-linecap="round"/>
      </g>
    </g>
  `;

  const skirtSvg =
    gender === 'female'
      ? `<path d="M-27 -88 L27 -88 L39 -47 C18 -42 -18 -42 -39 -47 Z" fill="${pantsHex}" stroke="${ink}" stroke-width="2.1" stroke-linejoin="round"/>
         <rect x="-27.5" y="-90" width="55" height="6" rx="2" fill="${det.skirtOrPantsShadeHex}" stroke="${ink}" stroke-width="1.6"/>
         <rect x="-4" y="-90" width="8" height="6" rx="1.2" fill="#FDE68A" stroke="${ink}" stroke-width="1.2"/>
         <path d="M-36 -54 C-16 -49 16 -49 36 -54 L39 -47 C18 -42 -18 -42 -39 -47 Z" fill="${det.skirtOrPantsShadeHex}" fill-opacity="0.28"/>
         <line x1="-13" y1="-82" x2="-18" y2="-45" stroke="${det.skirtOrPantsShadeHex}" stroke-opacity="0.55" stroke-width="1.6"/>
         <line x1="0" y1="-82" x2="0" y2="-44" stroke="${det.skirtOrPantsShadeHex}" stroke-opacity="0.55" stroke-width="1.6"/>
         <line x1="13" y1="-82" x2="18" y2="-45" stroke="${det.skirtOrPantsShadeHex}" stroke-opacity="0.55" stroke-width="1.6"/>`
      : `<path d="M-28 -88 L28 -88 L30 -68 L-30 -68 Z" fill="${pantsHex}" stroke="${ink}" stroke-width="2"/>
         <rect x="-28" y="-89" width="56" height="5.5" rx="1.5" fill="${det.skirtOrPantsShadeHex}"/>
         <rect x="-4" y="-89" width="8" height="5.5" rx="1" fill="#CBD5E1" stroke="${ink}" stroke-width="1.1"/>`;

  const renderHand = () =>
    `<path d="M-4.5 29 C-7 32 -6.5 39 -2 40.5 C2.5 41.5 6.5 39 7 34.5 C7.5 31.5 5 29 3.5 29 Z" fill="${skinHex}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>
     <path d="M4.5 31.5 C7.5 31.5 8.5 34 6.5 36" fill="${skinHex}" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`;

  const collarDetailSvg =
    gender === 'female'
      ? `<!-- Crisp anime shirt collar + ribbon bow or jewel pendant -->
         <path d="M-13 -88 L-2 -68 L-16 -64 Z" fill="#FFFFFF" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>
         <path d="M13 -88 L2 -68 L16 -64 Z" fill="#FFFFFF" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>
         ${
           det.hasGlasses
             ? `<path d="M-9 -82 Q0 -63 9 -82" fill="none" stroke="#F59E0B" stroke-width="1.4"/>
                <circle cx="0" cy="-68" r="3.4" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.3"/>`
             : `<g transform="translate(0,-70)">
                  <path d="M0 0 L-13 -7 L-10 6 Z" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M0 0 L13 -7 L10 6 Z" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M-2 2 L-8 19 L-2 16 Z" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
                  <path d="M2 2 L8 19 L2 16 Z" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
                  <circle cx="0" cy="0" r="3.4" fill="#FEF3C7" stroke="${ink}" stroke-width="1.4"/>
                </g>`
         }`
      : `<!-- Tailored male jacket lapels + inner shirt + necktie -->
         <path d="M-13 -88 L0 -56 L13 -88 Z" fill="#FFFFFF" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>
         <path d="M-13 -88 L-19 -68 L-8 -61 Z" fill="${det.outfitShadeHex}" fill-opacity="0.45" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
         <path d="M13 -88 L19 -68 L8 -61 Z" fill="${det.outfitShadeHex}" fill-opacity="0.45" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
         <polygon points="-3.5,-80 3.5,-80 5,-44 0,-36 -5,-44" fill="${det.ribbonOrTieHex}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>`;

  return `
    <g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(scale * squashX).toFixed(3)},${(scale * squashY).toFixed(3)})" opacity="${opacity.toFixed(2)}">
      <!-- Ground contact shadow under shoes -->
      <ellipse cx="0" cy="4" rx="44" ry="8.5" fill="#0F172A" fill-opacity="0.18"/>

      <!-- Full-Body Pose Group oriented by facing (+1 right, -1 left) -->
      <g transform="scale(${facing}, 1)">
        <!-- Back Leg -->
        ${renderLeg(-13, rig.leftThighAngle, rig.leftShinAngle, true)}
        <!-- Front Leg -->
        ${renderLeg(13, rig.rightThighAngle, rig.rightShinAngle, false)}

        <!-- Pelvis / Skirt -->
        <g transform="translate(0,${hipDropY.toFixed(1)})">
          ${skirtSvg}
        </g>

        <!-- Upper Body pivoting at hip (-82 + hipDropY) -->
        <g transform="translate(0,${(-82 + hipDropY + shoulderBreathY * 0.45).toFixed(1)}) rotate(${bodyTiltDeg.toFixed(2)})">
          <!-- Back Articulated Arm -->
          <g transform="translate(-25,${(-70 + shoulderBreathY * 0.5).toFixed(1)}) rotate(${rig.leftArmAngle.toFixed(1)})">
            <path d="M-7.5 0 L7.5 0 L6.5 34 C4 37 -4 37 -6.5 34 Z" fill="${outfitHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
            <g transform="translate(0,34) rotate(${rig.leftForearmAngle.toFixed(1)})">
              <path d="M-6.5 0 L6.5 0 L5.5 29 C3 31 -3 31 -5.5 29 Z" fill="${outfitHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
              <rect x="-5.8" y="24" width="11.6" height="5" rx="1.8" fill="#FFFFFF" stroke="${ink}" stroke-width="1.5"/>
              ${renderHand()}
            </g>
          </g>

          <!-- Tailored Torso + Cel Shading + Collar -->
          <path d="M-29 -74 C-31 -86 -17 -90 0 -90 C17 -90 31 -86 29 -74 L25 -24 L29 2 C29 7 23 10 18 10 L-18 10 C-23 10 -29 7 -29 2 L-25 -24 Z" fill="${outfitHex}" stroke="${ink}" stroke-width="2.1" stroke-linejoin="round"/>
          <path d="M16 -84 C25 -80 28 -70 25 -24 L28 2 C28 6 22 9 16 9 L12 9 C18 -20 19 -54 16 -84 Z" fill="${det.outfitShadeHex}" fill-opacity="0.34"/>
          <line x1="0" y1="-58" x2="0" y2="8" stroke="${outfitAccentHex}" stroke-opacity="0.55" stroke-width="1.6"/>
          ${collarDetailSvg}

          <!-- Neck & Head Group -->
          <g transform="translate(0,-84) rotate(${headTiltDeg.toFixed(2)})">
            <rect x="-8" y="-12" width="16" height="21" rx="7" fill="${skinHex}" stroke="${ink}" stroke-width="1.9"/>
            <path d="M-7.5 -4 Q0 3 7.5 -4 L7.5 -9 Q0 -4 -7.5 -9 Z" fill="${det.skinShadeHex}" fill-opacity="0.88"/>
            <g transform="translate(0,84)">
              ${backHairSvg}
              <!-- Delicate anime ears with inner curve -->
              <ellipse cx="-38" cy="-123" rx="6" ry="8" fill="${skinHex}" stroke="${ink}" stroke-width="1.8"/>
              <path d="M-39 -126 Q-36 -123 -38 -119" fill="none" stroke="${det.skinShadeHex}" stroke-width="1.5" stroke-linecap="round"/>
              <ellipse cx="38" cy="-123" rx="6" ry="8" fill="${skinHex}" stroke="${ink}" stroke-width="1.8"/>
              <path d="M39 -126 Q36 -123 38 -119" fill="none" stroke="${det.skinShadeHex}" stroke-width="1.5" stroke-linecap="round"/>

              <!-- Sculpted V-chin anime face contour -->
              <path d="M-38 -144 C-39 -112 -24 -91 0 -84 C24 -91 39 -112 38 -144 C36 -175 21 -189 0 -189 C-21 -189 -36 -175 -38 -144 Z" fill="${skinHex}" stroke="${ink}" stroke-width="2.1" stroke-linejoin="round"/>
              <!-- Soft airbrushed rosy cheek blush + cute anime diagonal hatch marks -->
              <ellipse cx="-23" cy="-109" rx="9" ry="4.5" fill="#FDA4AF" fill-opacity="0.46"/>
              <ellipse cx="-23" cy="-109" rx="5.2" ry="2.6" fill="#FB7185" fill-opacity="0.42"/>
              <ellipse cx="23" cy="-109" rx="9" ry="4.5" fill="#FDA4AF" fill-opacity="0.46"/>
              <ellipse cx="23" cy="-109" rx="5.2" ry="2.6" fill="#FB7185" fill-opacity="0.42"/>
              <path d="M-26 -107 L-24 -111 M-21 -107 L-19 -111 M19 -107 L21 -111 M24 -107 L26 -111" stroke="#FB7185" stroke-opacity="0.6" stroke-width="1.2" stroke-linecap="round"/>

              ${eyesSvg}
              ${glassesSvg}
              ${browsSvg}
              <!-- Delicate anime nose point -->
              <path d="M0.5 -113 L2.2 -108.5" stroke="#C28E70" stroke-width="1.6" stroke-linecap="round"/>
              ${mouthSvg}
              ${frontHairSvg}
            </g>
          </g>

          <!-- Front Articulated Arm + Hand Prop -->
          <g transform="translate(25,${(-70 + shoulderBreathY * 0.5).toFixed(1)}) rotate(${rig.rightArmAngle.toFixed(1)})">
            <path d="M-7.5 0 L7.5 0 L6.5 34 C4 37 -4 37 -6.5 34 Z" fill="${outfitHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
            <g transform="translate(0,34) rotate(${rig.rightForearmAngle.toFixed(1)})">
              <path d="M-6.5 0 L6.5 0 L5.5 29 C3 31 -3 31 -5.5 29 Z" fill="${outfitHex}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
              <rect x="-5.8" y="24" width="11.6" height="5" rx="1.8" fill="#FFFFFF" stroke="${ink}" stroke-width="1.5"/>
              ${renderHand()}
              ${renderHandPropSvg(handProp)}
            </g>
          </g>
        </g>
      </g>

      ${fxSvg}

      <!-- Unflipped Character Name Tag cleanly below shoes -->
      <g transform="translate(0,24)">
        <rect x="-38" y="-12" width="76" height="22" rx="11" fill="${nameBadgeHex}" stroke="#FFFFFF" stroke-width="1.8"/>
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
  const horizonY = Math.round(height * (height > width ? 0.59 : 0.63));
  const floorH = height - horizonY;
  const room = beat.roomKind;

  const doorSlidePx = beat.doorOpen
    ? Math.round(Math.min(1, beatProgress * 2.2) * (width * 0.14))
    : 0;
  const doorW = Math.round(width * 0.19);
  const doorH = Math.round(horizonY * 0.65);
  const doorX = Math.round(width * 0.78);
  const doorY = horizonY - doorH;

  const beamOpacity = (0.18 + Math.sin(timeSec * 0.8) * 0.03).toFixed(2);
  const isAngryScene = beat.emotion === 'angry';
  const cloudDrift = Math.sin(timeSec * 0.35) * 18;

  const fridgeSvg = (fx: number, fy: number, fw: number, fh: number, open: boolean) => `
    <g>
      <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="8" fill="#F8FAFC" stroke="#475569" stroke-width="3.5"/>
      <line x1="${fx}" y1="${fy + Math.round(fh * 0.36)}" x2="${fx + fw}" y2="${fy + Math.round(fh * 0.36)}" stroke="#64748B" stroke-width="2.5"/>
      <rect x="${fx + fw - 14}" y="${fy + Math.round(fh * 0.12)}" width="5" height="${Math.round(fh * 0.16)}" rx="2" fill="#94A3B8"/>
      <rect x="${fx + fw - 14}" y="${fy + Math.round(fh * 0.44)}" width="5" height="${Math.round(fh * 0.22)}" rx="2" fill="#94A3B8"/>
      ${
        open
          ? `<rect x="${fx + 6}" y="${fy + 6}" width="${fw - 12}" height="${Math.round(fh * 0.28)}" rx="3" fill="#E0F2FE"/>
             <line x1="${fx + 8}" y1="${fy + Math.round(fh * 0.20)}" x2="${fx + fw - 8}" y2="${fy + Math.round(fh * 0.20)}" stroke="#7DD3FC" stroke-width="2"/>
             <polygon points="${fx + fw},${fy} ${fx + fw + Math.round(fw * 0.45)},${fy - 8} ${fx + fw + Math.round(fw * 0.45)},${fy + Math.round(fh * 0.38)} ${fx + fw},${fy + Math.round(fh * 0.36)}" fill="#FFFFFF" stroke="#475569" stroke-width="2.8"/>`
          : ''
      }
    </g>
  `;

  let sceneBodySvg = '';

  if (room === 'cafe_corner') {
    const winX = Math.round(width * 0.06);
    const winY = Math.round(horizonY * 0.20);
    const winW = Math.round(width * 0.34);
    const winH = Math.round(horizonY * 0.48);
    sceneBodySvg = `
      <rect x="0" y="0" width="${width}" height="${horizonY}" fill="#FEF3C7"/>
      <rect x="0" y="${Math.round(horizonY * 0.65)}" width="${width}" height="${Math.round(horizonY * 0.35)}" fill="#D6B48C"/>
      <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="#9A6B42"/>
      <!-- Cafe Storefront Window -->
      <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="6" fill="#BAE6FD" stroke="#78350F" stroke-width="5"/>
      <ellipse cx="${winX + Math.round(winW * 0.3) + cloudDrift * 0.4}" cy="${winY + 32}" rx="28" ry="12" fill="#FFFFFF" fill-opacity="0.85"/>
      <path d="M${winX + 10} ${winY + winH} Q${winX + winW * 0.25} ${winY + winH * 0.55} ${winX + winW * 0.5} ${winY + winH} Z" fill="#86EFAC"/>
      <line x1="${winX + Math.round(winW * 0.5)}" y1="${winY}" x2="${winX + Math.round(winW * 0.5)}" y2="${winY + winH}" stroke="#78350F" stroke-width="3.5"/>
      <!-- Hanging Pendant Lamps -->
      ${[0.34, 0.66].map((rx) => {
        const lx = Math.round(width * rx);
        return `<line x1="${lx}" y1="0" x2="${lx}" y2="${Math.round(horizonY * 0.16)}" stroke="#451A03" stroke-width="3"/>
                <path d="M${lx - 20} ${Math.round(horizonY * 0.21)} L${lx + 20} ${Math.round(horizonY * 0.21)} L${lx + 11} ${Math.round(horizonY * 0.16)} L${lx - 11} ${Math.round(horizonY * 0.16)} Z" fill="#F59E0B" stroke="#78350F" stroke-width="2.5"/>`;
      }).join('')}
      <!-- Menu Chalkboard -->
      <rect x="${Math.round(width * 0.46)}" y="${Math.round(horizonY * 0.25)}" width="${Math.round(width * 0.24)}" height="${Math.round(horizonY * 0.30)}" rx="5" fill="#1E293B" stroke="#78350F" stroke-width="5"/>
      <text x="${Math.round(width * 0.58)}" y="${Math.round(horizonY * 0.35)}" text-anchor="middle" font-size="14" font-weight="800" fill="#FDE68A">CAFE MENU</text>
      <line x1="${Math.round(width * 0.50)}" y1="${Math.round(horizonY * 0.41)}" x2="${Math.round(width * 0.66)}" y2="${Math.round(horizonY * 0.41)}" stroke="#94A3B8" stroke-width="2"/>
      <line x1="${Math.round(width * 0.50)}" y1="${Math.round(horizonY * 0.47)}" x2="${Math.round(width * 0.63)}" y2="${Math.round(horizonY * 0.47)}" stroke="#94A3B8" stroke-width="2"/>
      <!-- Cafe Glass Door -->
      <rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#334155" stroke="#451A03" stroke-width="4"/>
      <rect x="${doorX - doorSlidePx}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#E0F2FE" fill-opacity="0.88" stroke="#78350F" stroke-width="4"/>
    `;
  } else if (room === 'office_desk') {
    const winX = Math.round(width * 0.06);
    const winY = Math.round(horizonY * 0.18);
    const winW = Math.round(width * 0.36);
    const winH = Math.round(horizonY * 0.46);
    sceneBodySvg = `
      <rect x="0" y="0" width="${width}" height="${horizonY}" fill="#F1F5F9"/>
      <rect x="0" y="${horizonY - 10}" width="${width}" height="10" fill="#94A3B8"/>
      <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="#CBD5E1"/>
      <!-- City Skyline Window -->
      <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="4" fill="#BAE6FD" stroke="#475569" stroke-width="5"/>
      <rect x="${winX + 16}" y="${winY + Math.round(winH * 0.42)}" width="28" height="${Math.round(winH * 0.58)}" fill="#94A3B8"/>
      <rect x="${winX + 52}" y="${winY + Math.round(winH * 0.25)}" width="34" height="${Math.round(winH * 0.75)}" fill="#64748B"/>
      <rect x="${winX + 94}" y="${winY + Math.round(winH * 0.50)}" width="26" height="${Math.round(winH * 0.50)}" fill="#94A3B8"/>
      <!-- Whiteboard -->
      <rect x="${Math.round(width * 0.46)}" y="${Math.round(horizonY * 0.22)}" width="${Math.round(width * 0.24)}" height="${Math.round(horizonY * 0.28)}" rx="4" fill="#FFFFFF" stroke="#64748B" stroke-width="4"/>
      <polyline points="${Math.round(width * 0.49)},${Math.round(horizonY * 0.42)} ${Math.round(width * 0.55)},${Math.round(horizonY * 0.36)} ${Math.round(width * 0.61)},${Math.round(horizonY * 0.38)} ${Math.round(width * 0.67)},${Math.round(horizonY * 0.29)}" fill="none" stroke="#4F46E5" stroke-width="3"/>
      <!-- Office Pantry Fridge if needed, else Office Door -->
      ${
        beat.hasFridgeProp
          ? fridgeSvg(Math.round(width * 0.76), horizonY - Math.round(horizonY * 0.56), Math.round(width * 0.16), Math.round(horizonY * 0.56), beat.fridgeOpen)
          : `<rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#1E293B" stroke="#334155" stroke-width="4"/>
             <rect x="${doorX - doorSlidePx}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#E2E8F0" stroke="#475569" stroke-width="4"/>`
      }
    `;
  } else if (room === 'school_classroom') {
    sceneBodySvg = `
      <rect x="0" y="0" width="${width}" height="${horizonY}" fill="#FFFBEB"/>
      <rect x="0" y="${horizonY - 12}" width="${width}" height="12" fill="#B45309"/>
      <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="#D6A972"/>
      <!-- Classroom Chalkboard -->
      <rect x="${Math.round(width * 0.24)}" y="${Math.round(horizonY * 0.22)}" width="${Math.round(width * 0.52)}" height="${Math.round(horizonY * 0.36)}" rx="4" fill="#14532D" stroke="#92400E" stroke-width="6"/>
      <line x1="${Math.round(width * 0.30)}" y1="${Math.round(horizonY * 0.34)}" x2="${Math.round(width * 0.58)}" y2="${Math.round(horizonY * 0.34)}" stroke="#E2E8F0" stroke-opacity="0.7" stroke-width="3"/>
      <line x1="${Math.round(width * 0.30)}" y1="${Math.round(horizonY * 0.42)}" x2="${Math.round(width * 0.50)}" y2="${Math.round(horizonY * 0.42)}" stroke="#FDE68A" stroke-opacity="0.7" stroke-width="2.5"/>
      <!-- Tall Classroom Windows Left -->
      <rect x="${Math.round(width * 0.04)}" y="${Math.round(horizonY * 0.20)}" width="${Math.round(width * 0.15)}" height="${Math.round(horizonY * 0.48)}" rx="3" fill="#BAE6FD" stroke="#78350F" stroke-width="4"/>
      <circle cx="${Math.round(width * 0.50)}" cy="${Math.round(horizonY * 0.13)}" r="16" fill="#FFFFFF" stroke="#475569" stroke-width="3"/>
      <line x1="${Math.round(width * 0.50)}" y1="${Math.round(horizonY * 0.13)}" x2="${Math.round(width * 0.50)}" y2="${Math.round(horizonY * 0.13) - 9}" stroke="#1E293B" stroke-width="2.2"/>
      <line x1="${Math.round(width * 0.50)}" y1="${Math.round(horizonY * 0.13)}" x2="${Math.round(width * 0.50) + 7}" y2="${Math.round(horizonY * 0.13)}" stroke="#1E293B" stroke-width="2.2"/>
    `;
  } else if (room === 'street_park') {
    sceneBodySvg = `
      <rect x="0" y="0" width="${width}" height="${horizonY}" fill="#BAE6FD"/>
      <ellipse cx="${Math.round(width * 0.25) + cloudDrift}" cy="${Math.round(horizonY * 0.22)}" rx="46" ry="16" fill="#FFFFFF" fill-opacity="0.9"/>
      <ellipse cx="${Math.round(width * 0.74) - cloudDrift * 0.6}" cy="${Math.round(horizonY * 0.18)}" rx="52" ry="18" fill="#FFFFFF" fill-opacity="0.85"/>
      <!-- Distant Trees & Bushes -->
      <path d="M0 ${horizonY} Q${width * 0.18} ${horizonY * 0.62} ${width * 0.36} ${horizonY} Z" fill="#4ADE80"/>
      <path d="M${width * 0.62} ${horizonY} Q${width * 0.82} ${horizonY * 0.58} ${width} ${horizonY} Z" fill="#22C55E"/>
      <!-- Park Bench -->
      <rect x="${Math.round(width * 0.36)}" y="${horizonY - 38}" width="${Math.round(width * 0.28)}" height="12" rx="3" fill="#B45309" stroke="#78350F" stroke-width="2.5"/>
      <rect x="${Math.round(width * 0.38)}" y="${horizonY - 26}" width="8" height="26" fill="#475569"/>
      <rect x="${Math.round(width * 0.60)}" y="${horizonY - 26}" width="8" height="26" fill="#475569"/>
      <!-- Paved Walkway -->
      <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="#94A3B8"/>
      <line x1="0" y1="${horizonY + 8}" x2="${width}" y2="${horizonY + 8}" stroke="#64748B" stroke-width="4"/>
    `;
  } else if (room === 'restaurant_izakaya') {
    sceneBodySvg = `
      <rect x="0" y="0" width="${width}" height="${horizonY}" fill="#7C2D12"/>
      <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="#78350F"/>
      <!-- Paper Lanterns -->
      ${[0.2, 0.5, 0.8].map((rx) => {
        const lx = Math.round(width * rx);
        return `<ellipse cx="${lx}" cy="${Math.round(horizonY * 0.24)}" rx="22" ry="28" fill="#FEF08A" stroke="#DC2626" stroke-width="3.5"/>
                <line x1="${lx - 18}" y1="${Math.round(horizonY * 0.24)}" x2="${lx + 18}" y2="${Math.round(horizonY * 0.24)}" stroke="#DC2626" stroke-width="2"/>`;
      }).join('')}
      <!-- Noren Curtain & Counter -->
      <rect x="${Math.round(width * 0.14)}" y="${horizonY - 46}" width="${Math.round(width * 0.72)}" height="46" fill="#A16207" stroke="#451A03" stroke-width="4"/>
    `;
  } else if (room === 'train_station') {
    sceneBodySvg = `
      <rect x="0" y="0" width="${width}" height="${horizonY}" fill="#E0F2FE"/>
      <rect x="0" y="0" width="${width}" height="${Math.round(horizonY * 0.18)}" fill="#334155"/>
      <!-- Station Sign -->
      <rect x="${Math.round(width * 0.34)}" y="${Math.round(horizonY * 0.22)}" width="${Math.round(width * 0.32)}" height="38" rx="4" fill="#FFFFFF" stroke="#0F172A" stroke-width="3.5"/>
      <rect x="${Math.round(width * 0.34)}" y="${Math.round(horizonY * 0.22) + 28}" width="${Math.round(width * 0.32)}" height="10" fill="#16A34A"/>
      <!-- Platform & Yellow Tactile Line -->
      <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="#CBD5E1"/>
      <rect x="0" y="${horizonY + 14}" width="${width}" height="10" fill="#FACC15"/>
    `;
  } else if (room === 'kitchen_fridge') {
    const fW = Math.round(width * 0.22);
    const fH = Math.round(horizonY * 0.62);
    const fX = Math.round(width * 0.08);
    const fY = horizonY - fH;
    sceneBodySvg = `
      <rect x="0" y="0" width="${width}" height="${horizonY}" fill="#FFFBEB"/>
      <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="#E2E8F0"/>
      ${fridgeSvg(fX, fY, fW, fH, beat.fridgeOpen)}
      <!-- Kitchen Counter & Cabinets -->
      <rect x="${Math.round(width * 0.36)}" y="${horizonY - Math.round(horizonY * 0.28)}" width="${Math.round(width * 0.40)}" height="${Math.round(horizonY * 0.28)}" fill="#F1F5F9" stroke="#94A3B8" stroke-width="3"/>
      <rect x="${Math.round(width * 0.34)}" y="${horizonY - Math.round(horizonY * 0.30)}" width="${Math.round(width * 0.44)}" height="12" rx="3" fill="#CBD5E1" stroke="#64748B" stroke-width="2.5"/>
      <rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#1E293B" stroke="${pal.woodDarkHex}" stroke-width="4"/>
      <rect x="${doorX - doorSlidePx}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#FEFDF7" stroke="${pal.woodHex}" stroke-width="4"/>
    `;
  } else {
    // room_living (default home apartment, with mini-fridge when story mentions ice cream / fridge!)
    const winX = Math.round(width * (beat.hasFridgeProp ? 0.28 : 0.07));
    const winY = Math.round(horizonY * 0.22);
    const winW = Math.round(width * 0.26);
    const winH = Math.round(horizonY * 0.42);
    sceneBodySvg = `
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
      <rect x="0" y="0" width="${width}" height="${horizonY}" fill="url(#animeWallGrad)"/>
      <rect x="0" y="${horizonY - 12}" width="${width}" height="14" fill="${pal.woodHex}"/>
      <rect x="0" y="${horizonY}" width="${width}" height="${floorH}" fill="url(#animeFloorGrad)"/>
      <polygon points="${Math.round(width * 0.08)},${horizonY + 12} ${Math.round(width * 0.92)},${horizonY + 12} ${Math.round(width * 0.98)},${height - 16} ${Math.round(width * 0.02)},${height - 16}" fill="${pal.tatamiHex}" stroke="${pal.woodHex}" stroke-width="4" fill-opacity="0.72"/>
      ${
        beat.hasFridgeProp
          ? fridgeSvg(Math.round(width * 0.05), horizonY - Math.round(horizonY * 0.56), Math.round(width * 0.17), Math.round(horizonY * 0.56), beat.fridgeOpen)
          : ''
      }
      <!-- Window with Shoji Lattice -->
      <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="4" fill="${pal.skyHex}" stroke="${pal.woodDarkHex}" stroke-width="5"/>
      <circle cx="${winX + Math.round(winW * 0.72)}" cy="${winY + Math.round(winH * 0.30)}" r="${Math.round(Math.min(winW, winH) * 0.16)}" fill="${pal.windowGlowHex}" fill-opacity="0.85"/>
      <line x1="${winX + Math.round(winW * 0.5)}" y1="${winY}" x2="${winX + Math.round(winW * 0.5)}" y2="${winY + winH}" stroke="${pal.woodHex}" stroke-width="3"/>
      <line x1="${winX}" y1="${winY + Math.round(winH * 0.5)}" x2="${winX + winW}" y2="${winY + Math.round(winH * 0.5)}" stroke="${pal.woodHex}" stroke-width="3"/>
      <polygon points="${winX},${winY + winH} ${winX + winW},${winY + winH} ${winX + winW + Math.round(width * 0.25)},${height} ${winX + Math.round(width * 0.06)},${height}" fill="${pal.windowGlowHex}" fill-opacity="${beamOpacity}"/>
      <!-- Wall Poster -->
      <g transform="translate(${Math.round(width * 0.58)},${Math.round(horizonY * 0.26)})">
        <rect x="0" y="0" width="${Math.round(width * 0.14)}" height="${Math.round(horizonY * 0.24)}" rx="3" fill="#FFFFFF" stroke="${pal.woodHex}" stroke-width="4"/>
        <rect x="7" y="7" width="${Math.round(width * 0.14) - 14}" height="${Math.round(horizonY * 0.24) - 14}" fill="#E0F2FE"/>
        <path d="M10 ${Math.round(horizonY * 0.18)} L${Math.round(width * 0.055)} ${Math.round(horizonY * 0.10)} L${Math.round(width * 0.10)} ${Math.round(horizonY * 0.18)} Z" fill="#60A5FA"/>
      </g>
      <!-- Sliding Fusuma Door -->
      <rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#1E293B" stroke="${pal.woodDarkHex}" stroke-width="5"/>
      <rect x="${doorX - doorSlidePx}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#FEFDF7" stroke="${pal.woodHex}" stroke-width="4"/>
      <circle cx="${doorX - doorSlidePx + 18}" cy="${doorY + Math.round(doorH * 0.54)}" r="5" fill="${pal.woodDarkHex}"/>
    `;
  }

  return `
    ${sceneBodySvg}
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
  beatProgress: number;
  isPlayingSpeech: boolean;
  karaokeEnabled: boolean;
  highlightColor?: string;
}): string {
  const {
    speakerRig,
    beat,
    width,
    height,
    fontFamily,
    beatProgress,
    isPlayingSpeech,
    karaokeEnabled,
    highlightColor,
  } = params;
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

  const targetAnchorX = speakerRig.x;
  const bubbleX = Math.max(
    Math.round(width * 0.06),
    Math.min(width - bubbleW - Math.round(width * 0.06), Math.round(targetAnchorX - bubbleW / 2))
  );
  // Full-body head top is ~275 units above ground baseline
  const headTopY = speakerRig.y - 275 * speakerRig.scale + speakerRig.hipDropY * speakerRig.scale;
  const minTopY = Math.round(height * 0.10);
  const bubbleY = Math.max(minTopY, Math.round(headTopY - bubbleH - 22));

  const tailTipX = Math.max(
    bubbleX + 24,
    Math.min(bubbleX + bubbleW - 24, Math.round(targetAnchorX))
  );
  const tailBaseL = Math.max(bubbleX + 18, tailTipX - 11);
  const tailBaseR = Math.min(bubbleX + bubbleW - 18, tailTipX + 11);
  const tailY = bubbleY + bubbleH;

  const borderColor = speakerRig.profile.bubbleBorderHex;
  const bgColor = speakerRig.profile.bubbleBgHex;
  const activeKaraokeColor = resolveBubbleKaraokeColor(highlightColor, borderColor);

  const tokenizedLines = lines.map((ln) => tokenizeAnimeKaraokeLine(ln));
  const totalToks = Math.max(1, tokenizedLines.reduce((sum, arr) => sum + arr.length, 0));
  const activeGlobalToks = karaokeEnabled
    ? Math.max(1, Math.ceil(Math.min(1, isPlayingSpeech ? beatProgress / 0.86 : 1) * totalToks))
    : totalToks;

  let runningTokIdx = 0;
  const linesSvg = tokenizedLines
    .map((toks, idx) => {
      const yPos = bubbleY + padY + noteExtraH + Math.round(fontSize * 0.88) + idx * lineHeight;
      if (!karaokeEnabled) {
        return `<text x="${bubbleX + padX}" y="${yPos}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="#0F172A">${escapeXml(lines[idx])}</text>`;
      }
      let litText = '';
      let unlitText = '';
      for (const tok of toks) {
        if (runningTokIdx < activeGlobalToks) {
          litText += tok;
        } else {
          unlitText += tok;
        }
        runningTokIdx++;
      }
      return `<text x="${bubbleX + padX}" y="${yPos}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="800">${
        litText ? `<tspan fill="${escapeXml(activeKaraokeColor)}">${escapeXml(litText)}</tspan>` : ''
      }${unlitText ? `<tspan fill="#334155">${escapeXml(unlitText)}</tspan>` : ''}</text>`;
    })
    .join('');

  const noteBadgeSvg = beat.actingNote
    ? `<text x="${bubbleX + padX}" y="${bubbleY + padY + Math.round(fontSize * 0.68)}" font-family="${fontFamily}" font-size="${Math.max(11, Math.round(fontSize * 0.64))}" font-weight="800" fill="${borderColor}">（${escapeXml(beat.actingNote)}）</text>`
    : '';

  return `
    <g>
      <rect x="${bubbleX + 3}" y="${bubbleY + 5}" width="${bubbleW}" height="${bubbleH}" rx="18" fill="#0F172A" fill-opacity="0.14"/>
      <rect x="${bubbleX}" y="${bubbleY}" width="${bubbleW}" height="${bubbleH}" rx="18" fill="${bgColor}" stroke="${borderColor}" stroke-width="3.2"/>
      <polygon points="${tailBaseL},${tailY - 2} ${tailBaseR},${tailY - 2} ${tailTipX},${tailY + 18}" fill="${bgColor}"/>
      <polyline points="${tailBaseL},${tailY} ${tailTipX},${tailY + 18} ${tailBaseR},${tailY}" fill="none" stroke="${borderColor}" stroke-width="3.2" stroke-linejoin="round"/>
      ${noteBadgeSvg}
      ${linesSvg}
    </g>
  `;
}

function renderAmbientParticlesSvg(params: {
  width: number;
  height: number;
  roomKind: AnimeRoomKind;
  timeSec: number;
  fridgeOpen: boolean;
}): string {
  const { width, height, roomKind, timeSec, fridgeOpen } = params;
  const parts: string[] = [];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const seed = (i * 1.6180339) % 1;
    const baseX = ((seed * 1.37 + timeSec * (0.015 + (i % 3) * 0.008)) % 1) * width;
    if (roomKind === 'street_park') {
      const py = (((i * 0.19 + timeSec * 0.11) % 1) * height * 0.85);
      const px = (baseX + Math.sin(timeSec * 2 + i) * 24 + width) % width;
      const rot = (timeSec * 45 + i * 37) % 360;
      parts.push(
        `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="5.5" ry="3.2" fill="#FBCFE8" fill-opacity="0.8" transform="rotate(${rot.toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})"/>`
      );
    } else if (roomKind === 'restaurant_izakaya') {
      const py = height * 0.78 - (((i * 0.23 + timeSec * 0.14) % 1) * height * 0.65);
      const px = baseX + Math.sin(timeSec * 2.5 + i) * 14;
      const r = 2 + (i % 3) * 1.5;
      parts.push(
        `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="#FDE047" fill-opacity="0.32"/>`
      );
    } else if (roomKind === 'cafe_corner') {
      const py = height * 0.72 - (((i * 0.21 + timeSec * 0.12) % 1) * height * 0.48);
      const px = width * 0.25 + ((i * 53) % (width * 0.55)) + Math.sin(timeSec * 2 + i) * 10;
      const alpha = (0.28 * (1 - ((height * 0.72 - py) / (height * 0.48)))).toFixed(2);
      parts.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${3 + (i % 3)}" fill="#FFFBEB" fill-opacity="${alpha}"/>`);
    } else {
      const py = height * 0.12 + (((i * 0.29 + Math.sin(timeSec * 0.5 + i) * 0.08) % 0.68) * height);
      const alpha = (0.22 + 0.18 * Math.sin(timeSec * 2.2 + i * 1.3)).toFixed(2);
      parts.push(`<circle cx="${baseX.toFixed(1)}" cy="${py.toFixed(1)}" r="${1.8 + (i % 2) * 1.2}" fill="#FEF3C7" fill-opacity="${alpha}"/>`);
    }
  }
  if (fridgeOpen) {
    for (let j = 0; j < 6; j++) {
      const cx = width * 0.14 + Math.sin(timeSec * 3 + j) * 26;
      const cy = height * 0.42 + ((timeSec * 40 + j * 14) % 45);
      parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${5 + (j % 3) * 2}" fill="#E0F2FE" fill-opacity="0.55"/>`);
    }
  }
  return parts.join('');
}

export function renderAnimeBeatSvgFrame(params: {
  story: ParsedAnimeStory;
  beat: AnimeStoryboardBeat;
  prevBeat?: AnimeStoryboardBeat;
  timeSec: number;
  beatProgress: number;
  width: number;
  height: number;
  sceneStyle?: AnimeSceneStyle;
  fontName?: string;
  isPlayingSpeech?: boolean;
  subtitleEffect?: SubtitleEffect;
  highlightColor?: string;
}): string {
  const {
    story,
    beat,
    prevBeat,
    timeSec,
    beatProgress,
    width,
    height,
    sceneStyle = 'room_warm',
    fontName = 'M PLUS 1p',
    isPlayingSpeech = true,
    subtitleEffect = 'karaoke',
    highlightColor,
  } = params;

  const fontFamily =
    fontName === 'BIZ UDPGothic'
      ? "'BIZ UDPGothic', 'M PLUS 1p', 'Noto Sans', sans-serif"
      : "'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif";

  const targetRigs = computeAnimeRigStates({
    story,
    beat,
    timeSec,
    beatProgress,
    width,
    height,
    isPlayingSpeech: isPlayingSpeech && !beat.isStageCue,
  });

  // Smooth pose-to-pose transition from previous beat over first ~26% of beat
  let rigs = targetRigs;
  let prevFocusX: number | undefined;
  if (prevBeat && beatProgress < 0.28) {
    const prevRigs = computeAnimeRigStates({
      story,
      beat: prevBeat,
      timeSec: Math.max(0, timeSec - 0.04),
      beatProgress: 0.96,
      width,
      height,
      isPlayingSpeech: false,
    });
    prevFocusX = (prevRigs.find((r) => r.isActiveFocus) ?? prevRigs[0])?.x;
    rigs = interpolateRigStates(prevRigs, targetRigs, beatProgress / 0.28);
  }

  const focusRig = rigs.find((r) => r.isActiveFocus) ?? rigs[0];
  const cam = computeAnimeCameraState({
    width,
    height,
    beat,
    focusRig,
    prevBeat,
    prevFocusX,
    beatProgress,
    timeSec,
  });

  const sortedRigs = [...rigs].sort((a, b) => (a.isActiveFocus ? 1 : 0) - (b.isActiveFocus ? 1 : 0));
  const charactersSvg = sortedRigs.map((r) => renderAnimeCharacterSvg(r, timeSec)).join('');

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
          beatProgress,
          isPlayingSpeech,
          karaokeEnabled: subtitleEffect === 'karaoke' || subtitleEffect === 'laser',
          highlightColor,
        })
      : '';

  const roomTransitionOverlay =
    prevBeat && prevBeat.roomKind !== beat.roomKind && beatProgress < 0.25
      ? `<rect x="0" y="0" width="${width}" height="${height}" fill="#0F172A" fill-opacity="${(
          (1 - easeOutCubic(beatProgress / 0.25)) *
          0.55
        ).toFixed(2)}"/>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g transform="translate(${(width / 2 + cam.offsetX + cam.shakeX).toFixed(1)},${(height / 2 + cam.offsetY + cam.shakeY).toFixed(1)}) scale(${cam.scale.toFixed(3)}) translate(${(-width / 2).toFixed(1)},${(-height / 2).toFixed(1)})">
      ${renderRoomBackdropSvg({ width, height, beat, sceneStyle, timeSec, beatProgress })}
      ${renderAmbientParticlesSvg({ width, height, roomKind: beat.roomKind, timeSec, fridgeOpen: beat.fridgeOpen })}
      ${charactersSvg}
    </g>
    ${roomTransitionOverlay}
    ${bannerSvg}
    ${speechBubbleSvg}
  </svg>`;
}
