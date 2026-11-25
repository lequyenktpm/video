import { ScriptStyle, Studio2411ThemeId } from './types';
import {
  analyzeScriptLinePresentation,
  PresentationIconKey,
  PresentationRoleTone,
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

export interface Studio2411CardSpec {
  layoutKind: Studio2411CardLayoutKind;
  kickerLabel: string;
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

export function build2411CardSpecForLine(params: {
  rawLine: string;
  lineIndex: number;
  totalLines: number;
  isSecondarySlot?: boolean;
  isIntroOrOutro?: boolean;
  scriptStyle?: ScriptStyle;
  themeId?: Studio2411ThemeId;
  defaultPauseSec?: number;
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
  } = params;

  const theme = getStudio2411ThemeMeta(themeId);
  const pres = analyzeScriptLinePresentation(rawLine, {
    isSecondarySlot,
    isIntroOrOutro,
    scriptStyle,
  });

  const safeTotal = Math.max(1, totalLines);
  const stepIndex = Math.max(1, Math.min(safeTotal, lineIndex + 1));
  const progressPct = Math.round((stepIndex / safeTotal) * 100);

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

  return {
    layoutKind,
    kickerLabel,
    contextLabel: pres.contextLabel,
    roleLabel: pres.roleLabel,
    roleTone: pres.roleTone,
    iconKey: pres.contextIconKey,
    stepIndex,
    totalSteps: safeTotal,
    progressPct,
    hasPause: pres.hasPause,
    pauseSec: pres.pauseSec ?? Math.max(1, Math.round(defaultPauseSec || 5)),
    theme,
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

/**
 * Generates a crisp high-DPI SVG card modeled on lequyenktpm/2411 (KineticSub Studio)
 * placed in the upper-center viewport band so subtitles & countdowns remain uncluttered.
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

  const cardW = isLandscape ? Math.round(width * 0.72) : Math.round(width * 0.84);
  const cardH = isLandscape ? Math.round(height * 0.36) : Math.round(height * 0.25);
  const cardX = Math.round((width - cardW) / 2);
  const cardY = isLandscape ? Math.round(height * 0.09) : Math.round(height * 0.10);
  const cardR = Math.max(18, Math.round(Math.min(width, height) * 0.032));

  const gridStep = Math.max(28, Math.round(Math.min(width, height) * 0.055));
  const dotLines: string[] = [];
  for (let gx = gridStep; gx < width; gx += gridStep) {
    dotLines.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${height}" stroke="${theme.gridColorRgba}" stroke-width="1"/>`);
  }
  for (let gy = gridStep; gy < height; gy += gridStep) {
    dotLines.push(`<line x1="0" y1="${gy}" x2="${width}" y2="${gy}" stroke="${theme.gridColorRgba}" stroke-width="1"/>`);
  }

  const headerH = Math.round(cardH * 0.22);
  const padX = Math.round(cardW * 0.065);
  const stepText = `${String(spec.stepIndex).padStart(2, '0')} / ${String(spec.totalSteps).padStart(2, '0')}`;
  const kickerSize = Math.max(15, Math.round(Math.min(width, height) * 0.025));
  const subTitleSize = Math.max(13, Math.round(kickerSize * 0.85));

  const iconCx = cardX + Math.round(cardW * 0.22);
  const iconCy = cardY + Math.round(cardH * 0.56);
  const iconScale = Math.max(0.75, Math.min(1.6, Math.min(cardW, cardH) / 250));

  const rightColX = cardX + Math.round(cardW * 0.42);
  const rightColW = Math.round(cardW * 0.51);
  const barY = cardY + Math.round(cardH * 0.78);
  const barW = cardW - padX * 2;
  const barFillW = Math.max(16, Math.round((spec.progressPct / 100) * barW));

  const modePrimaryHex =
    spec.layoutKind === 'answer_reveal'
      ? theme.secondaryAccentHex
      : theme.accentHex;
  const modeSecondaryHex =
    spec.layoutKind === 'answer_reveal'
      ? theme.accentHex
      : theme.secondaryAccentHex;

  // Animated wave bars inside the card visual panel matching 2411 infographic polish
  const waveHeights = [0.34, 0.68, 0.95, 0.52, 0.82, 0.44, 0.72, 0.38];
  const waveBaseY = cardY + Math.round(cardH * 0.64);
  const waveMaxH = Math.round(cardH * 0.16);
  const waveSvg = waveHeights
    .map((ratio, idx) => {
      const bw = Math.max(5, Math.round(rightColW * 0.055));
      const gap = Math.max(4, Math.round(rightColW * 0.032));
      const bh = Math.max(8, Math.round(waveMaxH * ratio));
      const bx = rightColX + idx * (bw + gap);
      const by = waveBaseY - bh;
      const fill = idx % 2 === 0 ? modePrimaryHex : modeSecondaryHex;
      return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${Math.round(bw / 2)}" fill="${fill}" fill-opacity="${(0.55 + ratio * 0.4).toFixed(2)}"/>`;
    })
    .join('');

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

  <!-- Layered ambient studio surface -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <circle cx="${Math.round(width * 0.2)}" cy="${Math.round(height * 0.22)}" r="${Math.round(Math.min(width, height) * 0.38)}" fill="${theme.bgAccentHex}" fill-opacity="0.55"/>
  <circle cx="${Math.round(width * 0.84)}" cy="${Math.round(height * 0.76)}" r="${Math.round(Math.min(width, height) * 0.34)}" fill="${modeSecondaryHex}" fill-opacity="0.08"/>
  <g>${dotLines.join('')}</g>

  <!-- Main 2411 Component Study Card Shell -->
  <rect x="${cardX + 4}" y="${cardY + 10}" width="${cardW}" height="${cardH}" rx="${cardR}" fill="#000000" fill-opacity="${theme.isLight ? '0.07' : '0.36'}"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${cardR}" fill="${theme.cardBgHex}" stroke="${theme.cardBorderHex}" stroke-width="2.5"/>

  <!-- Card Top Bar (Component header strip) -->
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${headerH}" rx="${cardR}" fill="${theme.surfaceTintHex}"/>
  <rect x="${cardX}" y="${cardY + Math.round(headerH / 2)}" width="${cardW}" height="${Math.round(headerH / 2)}" fill="${theme.surfaceTintHex}"/>
  <line x1="${cardX}" y1="${cardY + headerH}" x2="${cardX + cardW}" y2="${cardY + headerH}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>

  <!-- Minimal window dots (non-pill clean affordance) -->
  <circle cx="${cardX + padX}" cy="${cardY + Math.round(headerH / 2)}" r="5" fill="${modePrimaryHex}"/>
  <circle cx="${cardX + padX + 16}" cy="${cardY + Math.round(headerH / 2)}" r="5" fill="${modeSecondaryHex}"/>
  <text x="${cardX + padX + 34}" y="${cardY + Math.round(headerH / 2) + Math.round(subTitleSize * 0.34)}" font-family="${fontFamily}" font-size="${subTitleSize}" font-weight="700" fill="${modePrimaryHex}" letter-spacing="1.2">${escapeXml(spec.kickerLabel)}</text>
  <text x="${cardX + cardW - padX}" y="${cardY + Math.round(headerH / 2) + Math.round(subTitleSize * 0.34)}" text-anchor="end" font-family="${fontFamily}" font-size="${subTitleSize}" font-weight="700" fill="${theme.mutedTextHex}">${escapeXml(stepText)}</text>

  <!-- Left Vector Graphic Well -->
  <rect x="${cardX + padX}" y="${cardY + headerH + Math.round(cardH * 0.08)}" width="${Math.round(cardW * 0.29)}" height="${Math.round(cardH * 0.44)}" rx="${Math.round(cardR * 0.65)}" fill="${theme.surfaceTintHex}" stroke="${theme.cardBorderHex}" stroke-width="1.5"/>
  ${getSvgVectorIllustration(spec.iconKey, iconCx, iconCy, iconScale, modePrimaryHex, modeSecondaryHex, theme.cardBgHex)}

  <!-- Right Structured Label & Audio Rhythm Bars -->
  <text x="${rightColX}" y="${cardY + headerH + Math.round(cardH * 0.16)}" font-family="${fontFamily}" font-size="${kickerSize}" font-weight="700" fill="${theme.textHex}">${escapeXml(spec.roleLabel)} · ${escapeXml(spec.contextLabel)}</text>
  <text x="${rightColX}" y="${cardY + headerH + Math.round(cardH * 0.28)}" font-family="${fontFamily}" font-size="${subTitleSize}" font-weight="500" fill="${theme.mutedTextHex}">${spec.hasPause ? `THINK TIME · ${spec.pauseSec}S` : spec.layoutKind === 'answer_reveal' ? 'TARGET EXPRESSION' : 'FOCUS MODE'}</text>
  ${waveSvg}

  <!-- Bottom Card Progress Track -->
  <rect x="${cardX + padX}" y="${barY}" width="${barW}" height="8" rx="4" fill="${theme.cardBorderHex}" fill-opacity="0.6"/>
  <rect x="${cardX + padX}" y="${barY}" width="${barFillW}" height="8" rx="4" fill="url(#accentBar)"/>
</svg>`;
}
