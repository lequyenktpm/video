import { CuratedBackgroundCategory, ScriptStyle } from './types';

export interface CuratedBackgroundMeta {
  id: string;
  category: Exclude<CuratedBackgroundCategory, 'all'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  filename: string;
  previewUrl: string;
  palette: {
    topHex: string;
    midHex: string;
    bottomHex: string;
    glowHex: string;
    accentHex: string;
    secondaryHex: string;
  };
}

export const CURATED_CATEGORY_LABELS: Record<CuratedBackgroundCategory, string> = {
  all: 'Tự động xoay vòng theo chủ đề',
  study: 'Học tập & Ngoại ngữ',
  interview: 'Phỏng vấn & Công sở',
  life: 'Kiến thức & Cuộc sống',
};

export const CURATED_BACKGROUNDS: CuratedBackgroundMeta[] = [
  {
    id: 'study_desk_morning',
    category: 'study',
    categoryLabel: 'Học tập & Ngoại ngữ',
    title: 'Bàn học nắng sớm & Sổ tay',
    subtitle: 'Ánh sáng ấm, tập trung ghi nhớ từ vựng',
    filename: 'study_desk_morning.jpg',
    previewUrl: '/files/curated/study_desk_morning.jpg',
    palette: {
      topHex: '#2C221E',
      midHex: '#3E2E26',
      bottomHex: '#120E0C',
      glowHex: '#F59E0B',
      accentHex: '#FBBF24',
      secondaryHex: '#38BDF8',
    },
  },
  {
    id: 'study_library_warm',
    category: 'study',
    categoryLabel: 'Học tập & Ngoại ngữ',
    title: 'Thư viện yên tĩnh & Giá sách',
    subtitle: 'Không gian đọc sách cổ điển dịu mắt',
    filename: 'study_library_warm.jpg',
    previewUrl: '/files/curated/study_library_warm.jpg',
    palette: {
      topHex: '#1E293B',
      midHex: '#293548',
      bottomHex: '#0B1120',
      glowHex: '#FDE68A',
      accentHex: '#F59E0B',
      secondaryHex: '#93C5FD',
    },
  },
  {
    id: 'study_minimal_cafe',
    category: 'study',
    categoryLabel: 'Học tập & Ngoại ngữ',
    title: 'Góc tự học Minimalist & Đèn bàn',
    subtitle: 'Nền trầm sâu giúp phụ đề nổi bật rõ nét',
    filename: 'study_minimal_cafe.jpg',
    previewUrl: '/files/curated/study_minimal_cafe.jpg',
    palette: {
      topHex: '#18181B',
      midHex: '#27272A',
      bottomHex: '#09090B',
      glowHex: '#34D399',
      accentHex: '#2DD4BF',
      secondaryHex: '#FBBF24',
    },
  },
  {
    id: 'interview_modern_room',
    category: 'interview',
    categoryLabel: 'Phỏng vấn & Công sở',
    title: 'Phòng phỏng vấn kính hiện đại',
    subtitle: 'Chuyên nghiệp, ánh sáng công sở tự nhiên',
    filename: 'interview_modern_room.jpg',
    previewUrl: '/files/curated/interview_modern_room.jpg',
    palette: {
      topHex: '#0F2942',
      midHex: '#1E3A5F',
      bottomHex: '#081424',
      glowHex: '#38BDF8',
      accentHex: '#60A5FA',
      secondaryHex: '#34D399',
    },
  },
  {
    id: 'interview_exec_desk',
    category: 'interview',
    categoryLabel: 'Phỏng vấn & Công sở',
    title: 'Không gian làm việc & Chiến lược',
    subtitle: 'Tông xanh than lịch lãm cho Q&A phỏng vấn',
    filename: 'interview_exec_desk.jpg',
    previewUrl: '/files/curated/interview_exec_desk.jpg',
    palette: {
      topHex: '#1E1B4B',
      midHex: '#312E81',
      bottomHex: '#0D0B26',
      glowHex: '#818CF8',
      accentHex: '#A5B4FC',
      secondaryHex: '#2DD4BF',
    },
  },
  {
    id: 'interview_presentation_hall',
    category: 'interview',
    categoryLabel: 'Phỏng vấn & Công sở',
    title: 'Hội thảo & Thuyết trình đội nhóm',
    subtitle: 'Chiều sâu kiến trúc tinh tế, dễ theo dõi chữ',
    filename: 'interview_presentation_hall.jpg',
    previewUrl: '/files/curated/interview_presentation_hall.jpg',
    palette: {
      topHex: '#162433',
      midHex: '#1F354D',
      bottomHex: '#0A111A',
      glowHex: '#2DD4BF',
      accentHex: '#5EEAD4',
      secondaryHex: '#FACC15',
    },
  },
  {
    id: 'life_mountain_lake',
    category: 'life',
    categoryLabel: 'Kiến thức & Cuộc sống',
    title: 'Hồ núi bình minh & Rừng thông',
    subtitle: 'Thiên nhiên tĩnh lặng cho kể chuyện & triết lý',
    filename: 'life_mountain_lake.jpg',
    previewUrl: '/files/curated/life_mountain_lake.jpg',
    palette: {
      topHex: '#132A2E',
      midHex: '#1D4044',
      bottomHex: '#081517',
      glowHex: '#FBBF24',
      accentHex: '#34D399',
      secondaryHex: '#FDE68A',
    },
  },
  {
    id: 'life_twilight_cosmos',
    category: 'life',
    categoryLabel: 'Kiến thức & Cuộc sống',
    title: 'Bầu trời hoàng hôn & Khoa học',
    subtitle: 'Khung cảnh vũ trụ & biển đêm chiều sâu 35mm',
    filename: 'life_twilight_cosmos.jpg',
    previewUrl: '/files/curated/life_twilight_cosmos.jpg',
    palette: {
      topHex: '#0F172A',
      midHex: '#1E1B4B',
      bottomHex: '#050814',
      glowHex: '#A855F7',
      accentHex: '#38BDF8',
      secondaryHex: '#F472B6',
    },
  },
  {
    id: 'life_city_sunrise',
    category: 'life',
    categoryLabel: 'Kiến thức & Cuộc sống',
    title: 'Đô thị sáng sớm & Nhịp sống',
    subtitle: 'Ánh đèn ấm áp cho mẹo đời sống & văn hóa',
    filename: 'life_city_sunrise.jpg',
    previewUrl: '/files/curated/life_city_sunrise.jpg',
    palette: {
      topHex: '#2B1E2E',
      midHex: '#3F2A3E',
      bottomHex: '#100A14',
      glowHex: '#FB7185',
      accentHex: '#FDBA74',
      secondaryHex: '#60A5FA',
    },
  },
];

export function getCuratedBackgroundById(id?: string): CuratedBackgroundMeta | undefined {
  if (!id || id === 'auto') return undefined;
  return CURATED_BACKGROUNDS.find((bg) => bg.id === id);
}

export function detectCuratedCategoryFromTopic(
  subject: string,
  script = '',
  scriptStyle?: ScriptStyle
): Exclude<CuratedBackgroundCategory, 'all'> {
  const text = `${subject} ${script}`.trim();
  if (
    /面接|自己PR|自己pr|interview|phỏng vấn|tuyển dụng|công sở|nhân sự|đánh giá|評価|resume|cv|meeting|presentation/i.test(
      text
    )
  ) {
    return 'interview';
  }
  if (
    scriptStyle === 'language_challenge' ||
    scriptStyle === 'quiz_riddle' ||
    /5s|phản xạ|từ vựng|ngữ pháp|tiếng anh|tiếng nhật|english|japanese|日本語|英語|瞬間英作文|học|study|sách|luyện/i.test(
      text
    )
  ) {
    return 'study';
  }
  return 'life';
}

export function selectCuratedBackgroundsForConfig(params: {
  category?: CuratedBackgroundCategory;
  bgId?: string;
  subject: string;
  script?: string;
  scriptStyle?: ScriptStyle;
  count: number;
}): CuratedBackgroundMeta[] {
  const safeCount = Math.max(1, params.count);
  const specific = getCuratedBackgroundById(params.bgId);
  if (specific) {
    return Array.from({ length: safeCount }, () => specific);
  }

  const effectiveCat =
    !params.category || params.category === 'all'
      ? detectCuratedCategoryFromTopic(params.subject, params.script ?? '', params.scriptStyle)
      : params.category;

  const primaryPool = CURATED_BACKGROUNDS.filter((bg) => bg.category === effectiveCat);
  const fullPool =
    params.category === 'all'
      ? [...primaryPool, ...CURATED_BACKGROUNDS.filter((bg) => bg.category !== effectiveCat)]
      : primaryPool;
  const pool = fullPool.length > 0 ? fullPool : CURATED_BACKGROUNDS;

  return Array.from({ length: safeCount }, (_, idx) => pool[idx % pool.length]);
}

/**
 * Generates crisp 1080x1920 atmospheric editorial SVG scenes rasterized into static local JPGs
 * with clean darkened lower-thirds for high subtitle contrast.
 */
export function buildCuratedBackgroundSvg(
  id: string,
  width = 1080,
  height = 1920
): string {
  const meta = CURATED_BACKGROUNDS.find((b) => b.id === id) ?? CURATED_BACKGROUNDS[0];
  const { topHex, midHex, bottomHex, glowHex, accentHex, secondaryHex } = meta.palette;

  const bokehCircles = [
    { cx: 0.18, cy: 0.22, r: 0.08, o: 0.16, c: glowHex },
    { cx: 0.78, cy: 0.16, r: 0.11, o: 0.12, c: accentHex },
    { cx: 0.64, cy: 0.36, r: 0.06, o: 0.14, c: secondaryHex },
    { cx: 0.28, cy: 0.44, r: 0.09, o: 0.09, c: glowHex },
    { cx: 0.86, cy: 0.48, r: 0.07, o: 0.11, c: accentHex },
    { cx: 0.48, cy: 0.26, r: 0.26, o: 0.14, c: glowHex },
  ]
    .map(
      (b) =>
        `<circle cx="${Math.round(width * b.cx)}" cy="${Math.round(height * b.cy)}" r="${Math.round(Math.min(width, height) * b.r)}" fill="${b.c}" fill-opacity="${b.o}"/>`
    )
    .join('\n');

  let motifSvg = '';
  if (meta.category === 'study') {
    // Sunlit window beams + desk silhouette + open notebook / book spine silhouettes + desk lamp glow
    const deskY = Math.round(height * 0.56);
    const shelfRows = [0.16, 0.29, 0.42].map((ry) => {
      const y = Math.round(height * ry);
      const books = Array.from({ length: 12 }, (_, bi) => {
        const bw = Math.round(width * (0.04 + ((bi * 7) % 4) * 0.01));
        const bh = Math.round(height * (0.07 + ((bi * 5) % 4) * 0.012));
        const bx = Math.round(width * 0.07) + bi * Math.round(width * 0.074);
        const by = y - bh;
        return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="4" fill="${bi % 3 === 0 ? accentHex : secondaryHex}" fill-opacity="${bi % 2 === 0 ? '0.14' : '0.09'}"/>`;
      }).join('');
      return `${books}<rect x="${Math.round(width * 0.05)}" y="${y}" width="${Math.round(width * 0.9)}" height="8" rx="4" fill="#FFFFFF" fill-opacity="0.08"/>`;
    });

    motifSvg = `
      <polygon points="0,0 ${Math.round(width * 0.55)},0 ${Math.round(width * 0.92)},${deskY} ${Math.round(width * 0.15)},${deskY}" fill="${glowHex}" fill-opacity="0.07"/>
      ${meta.id === 'study_library_warm' ? shelfRows.join('\n') : ''}
      ${
        meta.id === 'study_desk_morning'
          ? `
        <rect x="${Math.round(width * 0.16)}" y="${Math.round(height * 0.46)}" width="${Math.round(width * 0.68)}" height="${Math.round(height * 0.11)}" rx="24" fill="#FFFBEB" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="2"/>
        <line x1="${Math.round(width * 0.5)}" y1="${Math.round(height * 0.46)}" x2="${Math.round(width * 0.5)}" y2="${Math.round(height * 0.57)}" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="2"/>
        <rect x="${Math.round(width * 0.72)}" y="${Math.round(height * 0.38)}" width="${Math.round(width * 0.11)}" height="${Math.round(height * 0.08)}" rx="18" fill="${glowHex}" fill-opacity="0.22"/>
      `
          : ''
      }
      ${
        meta.id === 'study_minimal_cafe'
          ? `
        <path d="M${Math.round(width * 0.75)} ${Math.round(height * 0.18)} L${Math.round(width * 0.62)} ${Math.round(height * 0.34)} L${Math.round(width * 0.86)} ${Math.round(height * 0.34)} Z" fill="${glowHex}" fill-opacity="0.18"/>
        <polygon points="${Math.round(width * 0.62)},${Math.round(height * 0.34)} ${Math.round(width * 0.86)},${Math.round(height * 0.34)} ${width},${deskY} ${Math.round(width * 0.42)},${deskY}" fill="${glowHex}" fill-opacity="0.07"/>
      `
          : ''
      }
      <rect x="0" y="${deskY}" width="${width}" height="${height - deskY}" fill="#000000" fill-opacity="0.28"/>
      <line x1="0" y1="${deskY}" x2="${width}" y2="${deskY}" stroke="${accentHex}" stroke-opacity="0.28" stroke-width="3"/>
    `;
  } else if (meta.category === 'interview') {
    // Modern architectural glass panels + blurred skyline bars + sleek conference surface
    const horizonY = Math.round(height * 0.55);
    const mullions = [0.22, 0.5, 0.78]
      .map(
        (rx) =>
          `<line x1="${Math.round(width * rx)}" y1="0" x2="${Math.round(width * rx)}" y2="${horizonY}" stroke="#FFFFFF" stroke-opacity="0.09" stroke-width="4"/>`
      )
      .join('');
    const towers = [0.12, 0.24, 0.38, 0.54, 0.68, 0.82]
      .map((rx, idx) => {
        const th = Math.round(height * (0.14 + (idx % 3) * 0.07));
        const tw = Math.round(width * 0.095);
        return `<rect x="${Math.round(width * rx)}" y="${horizonY - th}" width="${tw}" height="${th}" rx="6" fill="#FFFFFF" fill-opacity="${0.05 + (idx % 2) * 0.03}"/>`;
      })
      .join('');
    motifSvg = `
      ${towers}
      ${mullions}
      <polygon points="${Math.round(width * 0.08)},0 ${Math.round(width * 0.42)},0 ${Math.round(width * 0.65)},${horizonY} ${Math.round(width * 0.28)},${horizonY}" fill="#FFFFFF" fill-opacity="0.05"/>
      <ellipse cx="${Math.round(width * 0.14)}" cy="${Math.round(height * 0.45)}" rx="${Math.round(width * 0.14)}" ry="${Math.round(height * 0.11)}" fill="#10B981" fill-opacity="0.13"/>
      <ellipse cx="${Math.round(width * 0.20)}" cy="${Math.round(height * 0.49)}" rx="${Math.round(width * 0.11)}" ry="${Math.round(height * 0.09)}" fill="#34D399" fill-opacity="0.10"/>
      <rect x="0" y="${horizonY}" width="${width}" height="${height - horizonY}" fill="#020617" fill-opacity="0.34"/>
      <line x1="0" y1="${horizonY}" x2="${width}" y2="${horizonY}" stroke="${accentHex}" stroke-opacity="0.32" stroke-width="3"/>
    `;
  } else {
    // Everyday life & science: layered mountain ridges, twilight stars, or warm city horizon
    const waterY = Math.round(height * 0.56);
    if (meta.id === 'life_mountain_lake') {
      motifSvg = `
        <circle cx="${Math.round(width * 0.5)}" cy="${Math.round(height * 0.36)}" r="${Math.round(width * 0.16)}" fill="${glowHex}" fill-opacity="0.22"/>
        <path d="M0 ${waterY} L${Math.round(width * 0.25)} ${Math.round(height * 0.39)} L${Math.round(width * 0.52)} ${Math.round(height * 0.48)} L${Math.round(width * 0.80)} ${Math.round(height * 0.35)} L${width} ${Math.round(height * 0.45)} L${width} ${waterY} Z" fill="#0F172A" fill-opacity="0.38"/>
        <path d="M0 ${waterY} L${Math.round(width * 0.18)} ${Math.round(height * 0.46)} L${Math.round(width * 0.44)} ${Math.round(height * 0.41)} L${Math.round(width * 0.72)} ${Math.round(height * 0.49)} L${width} ${Math.round(height * 0.43)} L${width} ${waterY} Z" fill="#064E3B" fill-opacity="0.46"/>
        <rect x="0" y="${waterY}" width="${width}" height="${height - waterY}" fill="#020617" fill-opacity="0.42"/>
        <ellipse cx="${Math.round(width * 0.5)}" cy="${Math.round(height * 0.60)}" rx="${Math.round(width * 0.22)}" ry="12" fill="${glowHex}" fill-opacity="0.18"/>
      `;
    } else if (meta.id === 'life_twilight_cosmos') {
      const stars = Array.from({ length: 34 }, (_, si) => {
        const sx = Math.round(((si * 197 + 43) % 94 + 3) * (width / 100));
        const sy = Math.round(((si * 131 + 19) % 48 + 4) * (height / 100));
        const sr = si % 4 === 0 ? 3.5 : 2;
        return `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#FFFFFF" fill-opacity="${0.25 + (si % 5) * 0.14}"/>`;
      }).join('\n');
      motifSvg = `
        ${stars}
        <circle cx="${Math.round(width * 0.5)}" cy="${Math.round(height * 0.42)}" r="${Math.round(width * 0.34)}" fill="none" stroke="${accentHex}" stroke-opacity="0.16" stroke-width="2" stroke-dasharray="10 14"/>
        <circle cx="${Math.round(width * 0.5)}" cy="${Math.round(height * 0.42)}" r="${Math.round(width * 0.23)}" fill="none" stroke="${secondaryHex}" stroke-opacity="0.14" stroke-width="2"/>
        <rect x="0" y="${waterY}" width="${width}" height="${height - waterY}" fill="#030712" fill-opacity="0.48"/>
      `;
    } else {
      const buildings = Array.from({ length: 11 }, (_, bi) => {
        const bw = Math.round(width * 0.095);
        const bh = Math.round(height * (0.12 + ((bi * 3) % 5) * 0.045));
        const bx = bi * Math.round(width * 0.091);
        return `<rect x="${bx}" y="${waterY - bh}" width="${bw}" height="${bh}" fill="#090D16" fill-opacity="0.48"/>
          <circle cx="${bx + Math.round(bw * 0.5)}" cy="${waterY - bh + 28}" r="5" fill="${glowHex}" fill-opacity="0.4"/>`;
      }).join('');
      motifSvg = `
        <circle cx="${Math.round(width * 0.52)}" cy="${Math.round(height * 0.39)}" r="${Math.round(width * 0.22)}" fill="${glowHex}" fill-opacity="0.18"/>
        ${buildings}
        <rect x="0" y="${waterY}" width="${width}" height="${height - waterY}" fill="#090D16" fill-opacity="0.46"/>
      `;
    }
  }

  // Subtle architectural grid texture + bottom protective gradient scrim for legible white subtitles
  const gridStep = Math.round(Math.min(width, height) * 0.065);
  const gridLines: string[] = [];
  for (let gx = gridStep; gx < width; gx += gridStep) {
    gridLines.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${height}" stroke="#FFFFFF" stroke-opacity="0.025" stroke-width="1"/>`);
  }
  for (let gy = gridStep; gy < height; gy += gridStep) {
    gridLines.push(`<line x1="0" y1="${gy}" x2="${width}" y2="${gy}" stroke="#FFFFFF" stroke-opacity="0.025" stroke-width="1"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="skyBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${topHex}"/>
      <stop offset="52%" stop-color="${midHex}"/>
      <stop offset="100%" stop-color="${bottomHex}"/>
    </linearGradient>
    <linearGradient id="subtitleScrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="55%" stop-color="#000000" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.62"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#skyBg)"/>
  <g>${bokehCircles}</g>
  <g>${motifSvg}</g>
  <g>${gridLines.join('')}</g>
  <rect x="0" y="${Math.round(height * 0.52)}" width="${width}" height="${Math.round(height * 0.48)}" fill="url(#subtitleScrim)"/>
</svg>`;
}
