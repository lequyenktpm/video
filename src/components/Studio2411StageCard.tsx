import React from 'react';
import { AlertTriangle, Clock, Lightbulb, RotateCcw } from 'lucide-react';
import {
  ScriptStyle,
  Studio2411SceneComponentOverride,
  Studio2411ThemeId,
  VideoAspectRatio,
} from '../shared/types';
import {
  build2411CardSpecForLine,
  getStudio2411ThemeMeta,
  isGenericSpeakerLabel,
} from '../shared/studioComponents2411';
import { PresentationIcon } from './PresentationIcon';

interface Studio2411CountdownCardProps {
  countdownNumber: number;
  countdownTotalSec: number;
  themeId?: Studio2411ThemeId;
  accentColor?: string;
  aspectRatio?: VideoAspectRatio;
  fontName?: string;
}

function resolve2411FontCss(fontName?: string): string {
  if (fontName === 'JetBrains Mono') {
    return "'JetBrains Mono', 'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif";
  }
  if (fontName === 'BIZ UDPGothic') {
    return "'BIZ UDPGothic', 'M PLUS 1p', 'Noto Sans', sans-serif";
  }
  if (fontName && fontName !== 'DM Sans' && fontName !== 'Noto Sans') {
    return `'${fontName}', 'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif`;
  }
  return "'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif";
}

export const Studio2411CountdownCard: React.FC<Studio2411CountdownCardProps> = ({
  countdownNumber,
  countdownTotalSec,
  themeId,
  accentColor,
  aspectRatio = '9:16',
  fontName,
}) => {
  const theme = getStudio2411ThemeMeta(themeId);
  const totalSteps = Math.max(1, Math.round(countdownTotalSec || 5));
  const pct = Math.max(6, Math.min(100, Math.round((countdownNumber / totalSteps) * 100)));
  const primaryHex = accentColor || theme.accentHex;
  const secondaryHex = theme.secondaryAccentHex;
  const isLandscape = aspectRatio === '16:9';
  const isSquare = aspectRatio === '1:1';
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div
      data-testid="studio-2411-countdown-card"
      className="rounded-xl border shadow-xl overflow-hidden backdrop-blur-sm"
      style={{
        fontFamily: resolve2411FontCss(fontName),
        minWidth: isLandscape ? '152px' : isSquare ? '164px' : '180px',
        maxWidth: isLandscape ? '186px' : isSquare ? '198px' : '220px',
        backgroundColor: theme.isLight ? 'rgba(255,255,255,0.98)' : 'rgba(15,23,42,0.95)',
        borderColor: primaryHex,
        boxShadow: `0 10px 26px -8px ${primaryHex}44`,
      }}
    >
      <div
        className={`flex items-center justify-between gap-2 px-2 border-b font-bold tracking-wider uppercase ${
          isLandscape || isSquare ? 'py-0.5 text-[8px] leading-tight' : 'py-1 text-[9.5px]'
        }`}
        style={{
          backgroundColor: theme.surfaceTintHex,
          borderColor: theme.cardBorderHex,
          color: primaryHex,
        }}
      >
        <span className="inline-flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
          <span>THINK TIME</span>
        </span>
        <span
          className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold tabular-nums text-white leading-none"
          style={{ backgroundColor: primaryHex }}
        >
          {countdownNumber}s
        </span>
      </div>

      <div className={`${isLandscape ? 'px-2 py-0.5 gap-1.5' : isSquare ? 'px-2 py-1 gap-2' : 'px-2.5 py-1.5 gap-2'} flex items-center`}>
        <div
          className={`relative flex items-center justify-center shrink-0 ${
            isLandscape ? 'w-5.5 h-5.5' : isSquare ? 'w-6.5 h-6.5' : 'w-8 h-8'
          }`}
        >
          <svg viewBox="0 0 38 38" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle
              cx="19"
              cy="19"
              r={radius}
              fill="none"
              stroke={theme.cardBorderHex}
              strokeWidth="3.8"
            />
            <circle
              cx="19"
              cy="19"
              r={radius}
              fill="none"
              stroke={primaryHex}
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 260ms ease-out' }}
            />
          </svg>
          <span
            key={countdownNumber}
            className={`animate-mpt-countdown absolute inset-0 flex items-center justify-center font-extrabold tabular-nums select-none ${
              isLandscape ? 'text-[10.5px]' : isSquare ? 'text-[12px]' : 'text-[13.5px]'
            }`}
            style={{ color: theme.textHex }}
          >
            {countdownNumber}
          </span>
        </div>

        <div className={`flex-1 min-w-[84px] ${isLandscape || isSquare ? 'space-y-0.5' : 'space-y-1'}`}>
          {!isLandscape && (
            <div
              className={`${isSquare ? 'text-[8.5px]' : 'text-[10px]'} font-semibold leading-none`}
              style={{ color: theme.textHex }}
            >
              Speak aloud now
            </div>
          )}
          <div
            className={`w-full ${isLandscape || isSquare ? 'h-1.5' : 'h-2'} rounded-full overflow-hidden border`}
            style={{ backgroundColor: theme.surfaceTintHex, borderColor: theme.cardBorderHex }}
            role="progressbar"
            aria-label="Think time countdown"
            aria-valuenow={countdownNumber}
            aria-valuemin={0}
            aria-valuemax={totalSteps}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${primaryHex}, ${secondaryHex})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface Studio2411StageCardProps {
  rawLine: string;
  lineIndex: number;
  totalLines: number;
  isSecondarySlot?: boolean;
  isIntroOrOutro?: boolean;
  scriptStyle?: ScriptStyle;
  dualVoiceEnabled?: boolean;
  themeId?: Studio2411ThemeId;
  pauseBetweenLinesSec?: number;
  aspectRatio?: VideoAspectRatio;
  countdownActive?: boolean;
  prevTargetText?: string;
  promptPreviewText?: string;
  animationSeed?: number;
  fontName?: string;
  hideBackdrop?: boolean;
  isExiting?: boolean;
  override?: Studio2411SceneComponentOverride;
}

const WAVE_BARS = [0.36, 0.72, 0.96, 0.54, 0.84, 0.45, 0.75, 0.4];

interface Animated2411AvatarProps {
  shirtHex: string;
  hairHex: string;
  hairStyle: 'short' | 'bob';
  pose: 'talking' | 'thinking' | 'idle';
  side: 'left' | 'right';
  className: string;
  dotAccentHex?: string;
}

const Animated2411Avatar: React.FC<Animated2411AvatarProps> = ({
  shirtHex,
  hairHex,
  hairStyle,
  pose,
  side,
  className,
  dotAccentHex,
}) => {
  const dir = side === 'right' ? -1 : 1;
  return (
    <svg
      viewBox="-32 -28 66 64"
      className={className}
      data-avatar-pose={pose}
      aria-hidden="true"
    >
      <path d="M-22 30 C-20 14 20 14 22 30 Z" fill={shirtHex} />
      <circle cx="0" cy="0" r="16" fill="#FDE68A" />
      {hairStyle === 'bob' ? (
        <path
          d="M-20 -4 C-22 -24 22 -24 20 -4 L20 10 C15 6 11 -4 0 -6 C-11 -4 -15 6 -20 10 Z"
          fill={hairHex}
        />
      ) : (
        <path
          d="M-17 -6 C-16 -22 16 -22 17 -6 C10 -11 -10 -11 -17 -6 Z"
          fill={hairHex}
        />
      )}
      <circle cx="-5" cy="0" r="1.8" fill="#1E293B" />
      <circle cx="5" cy="0" r="1.8" fill="#1E293B" />
      {pose === 'talking' ? (
        <>
          <ellipse
            cx="0"
            cy="8"
            rx="4.8"
            ry="3.8"
            fill="#991B1B"
            stroke="#1E293B"
            strokeWidth="1.4"
            className="animate-2411-mouth-talk"
          />
          <g className="animate-2411-hand-wave">
            <path
              d={`M${dir * 14} 21 Q${dir * 20} 16 ${dir * 23} 10`}
              fill="none"
              stroke={shirtHex}
              strokeWidth="4.6"
              strokeLinecap="round"
            />
            <circle
              cx={dir * 23}
              cy="8.5"
              r="4.2"
              fill="#FDE68A"
              stroke="#1E293B"
              strokeWidth="1.1"
            />
          </g>
        </>
      ) : pose === 'thinking' ? (
        <>
          <path
            d="M-3.5 8 Q1 6.8 4.5 9"
            fill="none"
            stroke="#1E293B"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <g className="animate-2411-hand-think">
            <path
              d="M-14 23 Q-10 17 -5 13.5"
              fill="none"
              stroke={shirtHex}
              strokeWidth="4.2"
              strokeLinecap="round"
            />
            <circle cx="-4.5" cy="12.5" r="3.8" fill="#FDE68A" stroke="#1E293B" strokeWidth="1.1" />
          </g>
          <circle cx="-20" cy="-12" r="2" fill={dotAccentHex ?? shirtHex} fillOpacity="0.7" />
          <circle cx="-24" cy="-19" r="3" fill={dotAccentHex ?? shirtHex} fillOpacity="0.45" />
        </>
      ) : (
        <path
          d="M-5 7 Q0 11.5 5 7"
          fill="none"
          stroke="#1E293B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

export const Studio2411StageCard: React.FC<Studio2411StageCardProps> = ({
  rawLine,
  lineIndex,
  totalLines,
  isSecondarySlot = false,
  isIntroOrOutro = false,
  scriptStyle,
  dualVoiceEnabled = false,
  themeId,
  pauseBetweenLinesSec = 5,
  aspectRatio = '9:16',
  countdownActive = false,
  prevTargetText,
  promptPreviewText,
  animationSeed = 0,
  fontName,
  hideBackdrop = false,
  isExiting = false,
  override,
}) => {
  const spec = build2411CardSpecForLine({
    rawLine,
    lineIndex,
    totalLines,
    isSecondarySlot,
    isIntroOrOutro,
    scriptStyle,
    dualVoiceEnabled,
    themeId,
    defaultPauseSec: pauseBetweenLinesSec,
    prevTargetText,
    promptPreviewText,
    animationSeed,
    override,
  });

  const { theme } = spec;
  const stageFontCss = resolve2411FontCss(fontName);
  const primaryAccent =
    spec.accentOverrideHex ??
    (spec.layoutKind === 'answer_reveal' ? theme.secondaryAccentHex : theme.accentHex);
  const secondaryAccent =
    spec.layoutKind === 'answer_reveal' ? theme.accentHex : theme.secondaryAccentHex;
  const isLandscape = aspectRatio === '16:9';
  const isSquare = aspectRatio === '1:1';
  const isCompactStage = isLandscape || isSquare;
  const padCls = isLandscape ? 'px-2 py-1' : isSquare ? 'px-2 py-1.5' : 'p-2.5';

  const animClass = isExiting
    ? 'animate-2411-exit'
    : spec.resolvedAnimationIn === 'pop-up'
    ? 'animate-2411-pop-up'
    : spec.resolvedAnimationIn === 'drop-in'
    ? 'animate-2411-drop-in'
    : spec.resolvedAnimationIn === 'fade-scale'
    ? 'animate-2411-fade-scale'
    : 'animate-2411-slide-up';

  const dynamicTextCls = (str: string, base: string, compact: string) =>
    str.length > 42 ? compact : base;

  const renderVariantBody = () => {
    switch (spec.variant) {
      case 'css-compare':
        return (
          <div className={`${padCls} grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5`}>
            <div
              className="rounded-lg border p-2 text-center flex flex-col justify-center min-w-0"
              style={{ backgroundColor: theme.surfaceTintHex, borderColor: theme.cardBorderHex }}
            >
              <div className="text-[9.5px] font-bold uppercase break-words" style={{ color: theme.mutedTextHex }}>
                {spec.labels[0] ?? 'Prompt'}
              </div>
              <div className={`${isLandscape ? 'text-[10.5px]' : 'text-[11.5px]'} font-bold leading-snug break-words mt-0.5`} style={{ color: theme.textHex }}>
                {spec.contextLabel || spec.subtitle}
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0 self-center"
              style={{ backgroundColor: secondaryAccent }}
            >
              VS
            </span>
            <div
              className="rounded-lg border p-2 text-center flex flex-col justify-center min-w-0"
              style={{
                backgroundColor: `${primaryAccent}1A`,
                borderColor: primaryAccent,
              }}
            >
              <div className="text-[9.5px] font-bold uppercase break-words" style={{ color: primaryAccent }}>
                {spec.labels[1] ?? 'Target'}
              </div>
              <div
                className={dynamicTextCls(
                  spec.speechText || spec.highlightWord,
                  `${isLandscape ? 'text-[11px]' : 'text-[12px]'} font-bold leading-snug break-words mt-0.5`,
                  'text-[10.5px] font-bold leading-snug break-words mt-0.5'
                )}
                style={{ color: theme.textHex }}
              >
                {spec.speechText || spec.highlightWord}
              </div>
            </div>
          </div>
        );

      case 'css-roadmap': {
        const steps = [
          spec.labels[0] ?? 'Listen',
          spec.labels[1] ?? 'Recall',
          spec.labels[2] ?? 'Speak',
        ];
        const activeStep = spec.stepIndex % 3;
        return (
          <div className={`${padCls} space-y-1.5`}>
            <div className="relative flex items-start justify-between px-2">
              <div
                className="absolute left-4 right-4 top-2.5 h-0.5"
                style={{ backgroundColor: theme.cardBorderHex }}
              />
              {steps.map((lbl, idx) => {
                const active = idx <= activeStep;
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-0.5 min-w-0 max-w-[32%]">
                    <span
                      className="w-5 h-5 rounded-full border text-[9px] font-mono font-bold flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: active ? primaryAccent : theme.cardBgHex,
                        borderColor: active ? primaryAccent : theme.cardBorderHex,
                        color: active ? '#FFFFFF' : theme.mutedTextHex,
                      }}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className="text-[9.5px] font-semibold text-center leading-tight break-words"
                      style={{ color: active ? theme.textHex : theme.mutedTextHex }}
                    >
                      {lbl}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={`${isLandscape ? 'text-[10.5px]' : 'text-[11.5px]'} font-semibold text-center leading-snug break-words`} style={{ color: theme.textHex }}>
              {spec.title}
            </div>
          </div>
        );
      }

      case 'css-glass-quote':
        return (
          <div className={`${padCls} flex items-start gap-2`}>
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: primaryAccent }} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-sm leading-none font-serif font-bold" style={{ color: secondaryAccent }}>
                “
              </div>
              <div
                className={`${dynamicTextCls(spec.title, isLandscape ? 'text-[11px]' : 'text-[12px]', 'text-[10.5px]')} font-bold leading-snug break-words`}
                style={{ color: theme.textHex }}
              >
                {spec.title}
              </div>
              <div className="text-[10px] leading-snug break-words" style={{ color: theme.mutedTextHex }}>
                {spec.subtitle}
              </div>
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold break-words"
                style={{ backgroundColor: `${primaryAccent}20`, color: primaryAccent }}
              >
                {spec.highlightWord}
              </span>
            </div>
          </div>
        );

      case 'css-equation':
        return (
          <div className={`${padCls} space-y-1.5`}>
            <div className="text-[9.5px] font-mono font-semibold leading-snug break-words" style={{ color: primaryAccent }}>
              {spec.formula}
            </div>
            <div className="flex items-stretch gap-1 text-[10px] font-bold">
              <div
                className="flex-1 min-w-0 px-1.5 py-1 rounded border text-center flex items-center justify-center break-words leading-tight"
                style={{
                  backgroundColor: theme.surfaceTintHex,
                  borderColor: theme.cardBorderHex,
                  color: theme.textHex,
                }}
              >
                {spec.labels[0] ?? 'A'}
              </div>
              <span className="self-center shrink-0" style={{ color: secondaryAccent }}>+</span>
              <div
                className="flex-1 min-w-0 px-1.5 py-1 rounded border text-center flex items-center justify-center break-words leading-tight"
                style={{
                  backgroundColor: theme.surfaceTintHex,
                  borderColor: theme.cardBorderHex,
                  color: theme.textHex,
                }}
              >
                {spec.labels[1] ?? 'B'}
              </div>
              <span className="self-center shrink-0" style={{ color: primaryAccent }}>=</span>
              <div
                className="flex-1 min-w-0 px-1.5 py-1 rounded border text-center flex items-center justify-center break-words leading-tight"
                style={{
                  backgroundColor: `${primaryAccent}22`,
                  borderColor: primaryAccent,
                  color: primaryAccent,
                }}
              >
                {spec.highlightWord}
              </div>
            </div>
          </div>
        );

      case 'css-flashcard':
        return (
          <div className={padCls}>
            <div
              className="rounded-lg border p-2 text-center space-y-1 shadow-xs"
              style={{
                backgroundColor: theme.surfaceTintHex,
                borderColor: primaryAccent,
              }}
            >
              <div className="flex items-center justify-between text-[9.5px] font-bold uppercase">
                <span style={{ color: primaryAccent }}>{spec.labels[0] ?? 'FLASHCARD'}</span>
                <PresentationIcon iconKey={spec.iconKey} className="w-3.5 h-3.5 shrink-0" />
              </div>
              <div
                className={`${dynamicTextCls(spec.highlightWord, isLandscape ? 'text-[11px]' : 'text-[12px]', 'text-[10.5px]')} font-bold leading-snug break-words`}
                style={{ color: theme.textHex }}
              >
                {spec.highlightWord}
              </div>
              <div className="text-[10px] leading-snug break-words" style={{ color: theme.mutedTextHex }}>
                {spec.subtitle}
              </div>
            </div>
          </div>
        );

      case 'bs-progress-meter':
        return (
          <div className={`${padCls} space-y-1.5`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className={`${isLandscape ? 'text-[10.5px]' : 'text-[11.5px]'} font-bold leading-snug break-words`} style={{ color: theme.textHex }}>
                {spec.title}
              </span>
              <span className="text-xs font-mono font-bold tabular-nums shrink-0" style={{ color: primaryAccent }}>
                {spec.progressPct}%
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 h-2">
              {[20, 40, 60, 80, 100].map((tick) => (
                <div
                  key={tick}
                  className="rounded-sm"
                  style={{
                    backgroundColor:
                      spec.progressPct >= tick - 10 ? primaryAccent : theme.cardBorderHex,
                    opacity: spec.progressPct >= tick - 10 ? 0.95 : 0.45,
                  }}
                />
              ))}
            </div>
            <div className="text-[9.5px] font-mono leading-snug break-words" style={{ color: theme.mutedTextHex }}>
              {spec.labels.join(' · ')}
            </div>
          </div>
        );

      case 'bs-alert-callout':
        return (
          <div className={padCls}>
            <div
              className="rounded-lg border-l-4 border p-2 flex items-center gap-2"
              style={{
                backgroundColor: `${secondaryAccent}14`,
                borderColor: theme.cardBorderHex,
                borderLeftColor: secondaryAccent,
              }}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: theme.cardBgHex, color: secondaryAccent }}
              >
                <PresentationIcon iconKey="alert_triangle" className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className={`${isLandscape ? 'text-[10.5px]' : 'text-[11.5px]'} font-bold leading-snug break-words`} style={{ color: theme.textHex }}>
                  {spec.title}
                </div>
                <div className="text-[10px] leading-snug break-words" style={{ color: theme.mutedTextHex }}>
                  {spec.subtitle}
                </div>
              </div>
            </div>
          </div>
        );

      case 'gauge-tone': {
        const angleDeg = -90 + Math.round((spec.progressPct / 100) * 180);
        return (
          <div className={`${padCls} flex items-center gap-2.5`}>
            <svg viewBox="0 0 80 48" className="w-14 h-9 shrink-0" aria-hidden="true">
              <path
                d="M 10 42 A 30 30 0 0 1 70 42"
                fill="none"
                stroke={theme.cardBorderHex}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M 10 42 A 30 30 0 0 1 56 17"
                fill="none"
                stroke={primaryAccent}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <g transform={`translate(40,42) rotate(${angleDeg})`}>
                <line x1="0" y1="0" x2="0" y2="-22" stroke={theme.textHex} strokeWidth="2.5" strokeLinecap="round" />
              </g>
              <circle cx="40" cy="42" r="3.5" fill={secondaryAccent} />
            </svg>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className={`${isLandscape ? 'text-[10.5px]' : 'text-[11.5px]'} font-bold leading-snug break-words`} style={{ color: theme.textHex }}>
                {spec.title}
              </div>
              <div className="text-[10px] font-semibold leading-snug break-words" style={{ color: primaryAccent }}>
                {spec.highlightWord} · {spec.progressPct}%
              </div>
            </div>
          </div>
        );
      }

      case 'staircase-3d': {
        const blocks = [
          { lbl: spec.labels[0] ?? 'Step 1', h: isLandscape ? 18 : 26 },
          { lbl: spec.labels[1] ?? 'Step 2', h: isLandscape ? 25 : 36 },
          { lbl: spec.labels[2] ?? 'Step 3', h: isLandscape ? 33 : 46 },
        ];
        return (
          <div className={`${padCls} flex items-end gap-1.5 ${isLandscape ? 'min-h-[38px]' : 'min-h-[54px]'}`}>
            {blocks.map((b, idx) => (
              <div
                key={idx}
                className="flex-1 min-w-0 rounded-md border flex items-center justify-center px-1.5 py-0.5 text-center shadow-xs"
                style={{
                  minHeight: `${b.h}px`,
                  backgroundColor: idx === 2 ? primaryAccent : theme.surfaceTintHex,
                  borderColor: idx === 2 ? primaryAccent : theme.cardBorderHex,
                  color: idx === 2 ? '#FFFFFF' : theme.textHex,
                }}
              >
                <span className="text-[9.5px] font-bold leading-tight break-words">{b.lbl}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'friends-chat': {
        const isIntro = spec.layoutKind === 'intro_hero';
        const isOutro = spec.layoutKind === 'outro_recap';
        const isQuizPrompt = spec.layoutKind === 'quiz_prompt';
        const isAnswerReveal = spec.layoutKind === 'answer_reveal';
        const rawLabelA = spec.labels[0]?.trim() ?? '';
        const rawLabelB = spec.labels[1]?.trim() ?? '';
        const spkA = rawLabelA && !isGenericSpeakerLabel(rawLabelA) ? rawLabelA : '';
        const spkB = rawLabelB && !isGenericSpeakerLabel(rawLabelB) ? rawLabelB : '';
        const promptBubbleText =
          isAnswerReveal && spec.promptPreviewText ? spec.promptPreviewText : spec.speechText;
        const replyBubbleText = isAnswerReveal
          ? spec.speechText
          : spec.subtitle && spec.subtitle !== promptBubbleText
          ? spec.subtitle
          : spec.highlightWord;

        if (isIntro || isOutro) {
          return (
            <div
              className={`${isLandscape ? 'px-2.5 py-1.5' : isSquare ? 'px-2.5 py-2' : 'p-3'}`}
              data-testid="studio-2411-friends-chat"
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <Animated2411Avatar
                    shirtHex={primaryAccent}
                    hairHex="#1E293B"
                    hairStyle="short"
                    pose="talking"
                    side="left"
                    className={isCompactStage ? 'w-7 h-7' : 'w-9 h-9'}
                  />
                  {spkA && (
                    <span
                      className="px-1.5 py-0.5 text-[8.5px] rounded-full font-bold text-white text-center leading-tight break-words"
                      style={{ backgroundColor: primaryAccent }}
                    >
                      {spkA}
                    </span>
                  )}
                </div>

                <div
                  className={`flex-1 min-w-0 rounded-xl rounded-tl-sm border ${
                    isLandscape ? 'px-2.5 py-1.5' : isSquare ? 'px-2.5 py-2' : 'px-3 py-2.5'
                  }`}
                  style={{
                    backgroundColor: theme.surfaceTintHex,
                    borderColor: primaryAccent,
                  }}
                >
                  <div
                    className={`${dynamicTextCls(
                      promptBubbleText,
                      isLandscape ? 'text-[11px]' : isSquare ? 'text-[11.5px]' : 'text-[13px]',
                      isLandscape ? 'text-[10px]' : 'text-[11.5px]'
                    )} font-semibold leading-snug tracking-[0.015em] break-words whitespace-normal ${
                      isCompactStage ? 'line-clamp-3' : ''
                    }`}
                    style={{ color: theme.textHex }}
                  >
                    {promptBubbleText}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        let speakerAPose: 'talking' | 'thinking' | 'idle' = 'idle';
        let speakerBPose: 'talking' | 'thinking' | 'idle' = 'idle';
        if (countdownActive) {
          speakerAPose = 'idle';
          speakerBPose = 'thinking';
        } else if (isSecondarySlot || isAnswerReveal) {
          speakerAPose = 'idle';
          speakerBPose = 'talking';
        } else {
          speakerAPose = 'talking';
          speakerBPose = 'idle';
        }

        const isAActive = speakerAPose !== 'idle';
        const isBActive = speakerBPose !== 'idle';

        return (
          <div
            className={`${
              isLandscape ? 'px-2 py-1 space-y-1.5' : isSquare ? 'px-2.5 py-1.5 space-y-1.5' : 'p-2.5 space-y-2'
            }`}
            data-testid="studio-2411-friends-chat"
          >
            {/* Row 1: Speaker A source prompt bubble */}
            <div className={`flex items-center gap-2 transition-opacity duration-200 ${isAActive ? 'opacity-100' : 'opacity-90'}`}>
              <div className={`flex flex-col items-center gap-0.5 shrink-0 ${isCompactStage ? 'min-w-[34px]' : 'min-w-[40px]'}`}>
                <Animated2411Avatar
                  shirtHex={primaryAccent}
                  hairHex="#1E293B"
                  hairStyle="short"
                  pose={speakerAPose}
                  side="left"
                  className={isCompactStage ? 'w-6.5 h-6.5' : 'w-8.5 h-8.5'}
                />
                {spkA && (
                  <span
                    className={`${isCompactStage ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[8.5px]'} rounded-full font-bold text-white text-center leading-tight break-words`}
                    style={{ backgroundColor: primaryAccent }}
                  >
                    {spkA}
                  </span>
                )}
              </div>

              <div
                className={`flex-1 min-w-0 rounded-xl rounded-tl-sm border ${
                  isLandscape ? 'px-2.5 py-1' : isSquare ? 'px-2.5 py-1.5' : 'px-3 py-2'
                }`}
                style={{
                  backgroundColor: theme.surfaceTintHex,
                  borderColor: primaryAccent,
                  borderWidth: isAActive ? '1.5px' : '1px',
                }}
              >
                <div
                  className={`${dynamicTextCls(
                    promptBubbleText,
                    isLandscape ? 'text-[10.5px]' : isSquare ? 'text-[11px]' : 'text-[12.5px]',
                    isLandscape ? 'text-[9.5px]' : 'text-[11px]'
                  )} font-semibold leading-snug tracking-[0.015em] break-words whitespace-normal ${
                    isCompactStage ? 'line-clamp-2' : ''
                  }`}
                  style={{ color: theme.textHex }}
                >
                  {promptBubbleText}
                </div>
              </div>
            </div>

            {/* Row 2: Speaker B animated 3-dot thinking bubble OR target answer bubble */}
            <div className={`flex items-center justify-end gap-2 transition-opacity duration-200 ${isBActive ? 'opacity-100' : 'opacity-90'}`}>
              <div
                className={`flex-1 min-w-0 rounded-xl rounded-tr-sm border ${
                  isLandscape ? 'px-2.5 py-1' : isSquare ? 'px-2.5 py-1.5' : 'px-3 py-2'
                } ${isQuizPrompt ? 'border-dashed' : ''}`}
                style={{
                  backgroundColor: `${secondaryAccent}1C`,
                  borderColor: secondaryAccent,
                  borderWidth: isBActive ? '1.5px' : '1px',
                }}
              >
                {isQuizPrompt ? (
                  <div
                    data-testid="studio-2411-thinking-bubble"
                    className="flex items-center justify-between gap-2 py-0.5"
                  >
                    <div className="inline-flex items-center gap-1.5 pl-1">
                      <span
                        className="animate-2411-think-dot-1 w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: secondaryAccent }}
                      />
                      <span
                        className="animate-2411-think-dot-2 w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: secondaryAccent }}
                      />
                      <span
                        className="animate-2411-think-dot-3 w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: secondaryAccent }}
                      />
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold shrink-0"
                      style={{
                        backgroundColor: `${secondaryAccent}22`,
                        color: secondaryAccent,
                      }}
                    >
                      <Clock className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                      <span>Think {Math.max(1, spec.pauseSec || 5)}s</span>
                    </span>
                  </div>
                ) : (
                  <div
                    className={`${dynamicTextCls(
                      replyBubbleText,
                      isLandscape ? 'text-[10.5px]' : isSquare ? 'text-[11px]' : 'text-[12.5px]',
                      isLandscape ? 'text-[9.5px]' : 'text-[11px]'
                    )} font-semibold leading-snug tracking-[0.015em] break-words whitespace-normal ${
                      isCompactStage ? 'line-clamp-2' : ''
                    }`}
                    style={{ color: theme.textHex }}
                  >
                    {replyBubbleText}
                  </div>
                )}
              </div>

              <div className={`flex flex-col items-center gap-0.5 shrink-0 ${isCompactStage ? 'min-w-[34px]' : 'min-w-[40px]'}`}>
                <Animated2411Avatar
                  shirtHex={secondaryAccent}
                  hairHex="#78350F"
                  hairStyle="bob"
                  pose={speakerBPose}
                  side="right"
                  dotAccentHex={secondaryAccent}
                  className={isCompactStage ? 'w-6.5 h-6.5' : 'w-8.5 h-8.5'}
                />
                {spkB && (
                  <span
                    className={`${isCompactStage ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[8.5px]'} rounded-full font-bold text-white text-center leading-tight break-words`}
                    style={{ backgroundColor: secondaryAccent }}
                  >
                    {spkB}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'avatar-speech': {
        const rawAvatarLabel = spec.labels[0]?.trim() ?? '';
        const avatarTag =
          rawAvatarLabel && !isGenericSpeakerLabel(rawAvatarLabel) ? rawAvatarLabel : '';
        return (
          <div className={`${padCls} flex items-center gap-2`}>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div
                className={`${isCompactStage ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center`}
                style={{ backgroundColor: `${primaryAccent}20` }}
              >
                <Animated2411Avatar
                  shirtHex={primaryAccent}
                  hairHex="#1E293B"
                  hairStyle="short"
                  pose="talking"
                  side="left"
                  className={isCompactStage ? 'w-6 h-6' : 'w-8 h-8'}
                />
              </div>
              {avatarTag && (
                <span
                  className={`${isCompactStage ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[8.5px]'} rounded-full font-bold text-white text-center leading-tight`}
                  style={{ backgroundColor: primaryAccent }}
                >
                  {avatarTag}
                </span>
              )}
            </div>

            <div className="relative min-w-0 flex-1">
              <div
                className={`rounded-xl border ${isLandscape ? 'px-2 py-1 space-y-0.5' : 'px-2.5 py-1.5 space-y-1'}`}
                style={{
                  backgroundColor: theme.surfaceTintHex,
                  borderColor: primaryAccent,
                }}
              >
                <div
                  className={`${dynamicTextCls(spec.speechText, isLandscape ? 'text-[10.5px]' : isSquare ? 'text-[11px]' : 'text-[12.5px]', 'text-[10.5px]')} font-semibold leading-snug tracking-[0.015em] break-words whitespace-normal ${isCompactStage ? 'line-clamp-2' : ''}`}
                  style={{ color: theme.textHex }}
                >
                  {spec.speechText}
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <span className="text-[9px] font-semibold leading-tight break-words truncate" style={{ color: theme.mutedTextHex }}>
                    {spec.subtitle}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold text-white shrink-0"
                    style={{ backgroundColor: secondaryAccent }}
                  >
                    {spec.reactionText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'dialogue-upgrade':
        return (
          <div className={`${padCls} grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5`}>
            <div
              className="rounded-lg border p-2 min-w-0 flex flex-col justify-center"
              style={{ backgroundColor: theme.surfaceTintHex, borderColor: theme.cardBorderHex }}
            >
              <div className="text-[9px] font-bold uppercase break-words" style={{ color: theme.mutedTextHex }}>
                {spec.labels[0] ?? 'Basic Form'}
              </div>
              <div className={`${isLandscape ? 'text-[10px]' : 'text-[11px]'} font-semibold leading-snug break-words mt-0.5`} style={{ color: theme.textHex }}>
                {spec.speechText}
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full text-[9.5px] font-bold text-white flex items-center justify-center shrink-0 self-center"
              style={{ backgroundColor: primaryAccent }}
            >
              →
            </span>
            <div
              className="rounded-lg border p-2 min-w-0 flex flex-col justify-center"
              style={{
                backgroundColor: `${primaryAccent}1A`,
                borderColor: primaryAccent,
              }}
            >
              <div className="text-[9px] font-bold uppercase break-words" style={{ color: primaryAccent }}>
                ✓ {spec.labels[1] ?? 'Natural Form'}
              </div>
              <div className={`${isLandscape ? 'text-[10.5px]' : 'text-[11.5px]'} font-bold leading-snug break-words mt-0.5`} style={{ color: theme.textHex }}>
                {spec.highlightWord}
              </div>
            </div>
          </div>
        );

      case 'css-browser-mockup':
      case 'bs-card-header':
      default: {
        const mainHeadline =
          spec.speechText && spec.speechText.length > spec.title.length
            ? spec.speechText
            : spec.title;
        return (
          <div className={`${padCls} flex items-center gap-2`}>
            <div
              className={`${isLandscape ? 'w-8 h-8' : isSquare ? 'w-9 h-9' : 'w-11 h-11'} rounded-lg border flex items-center justify-center shrink-0`}
              style={{
                backgroundColor: theme.surfaceTintHex,
                borderColor: theme.cardBorderHex,
                color: primaryAccent,
              }}
            >
              <PresentationIcon iconKey={spec.iconKey} className={`${isCompactStage ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div
                className={`${dynamicTextCls(mainHeadline, isLandscape ? 'text-[10px]' : isSquare ? 'text-[10.5px]' : 'text-[12px]', isLandscape ? 'text-[9.5px]' : 'text-[10px]')} font-bold leading-tight break-words ${isCompactStage ? 'line-clamp-2' : ''}`}
                style={{ color: theme.textHex }}
              >
                {mainHeadline}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase leading-tight break-words"
                  style={{ backgroundColor: `${primaryAccent}18`, color: primaryAccent }}
                >
                  {spec.subtitle}
                </span>
                <div className="flex items-end gap-1 h-2.5">
                  {WAVE_BARS.map((ratio, idx) => (
                    <span
                      key={idx}
                      className="w-1 rounded-full"
                      style={{
                        height: `${Math.max(3, Math.round(ratio * 8))}px`,
                        backgroundColor: idx % 2 === 0 ? primaryAccent : secondaryAccent,
                        opacity: 0.55 + ratio * 0.4,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div
      key={`${theme.id}_${spec.variant}_${lineIndex}`}
      data-testid={isExiting ? 'studio-2411-stage-card-exiting' : 'studio-2411-stage-card'}
      data-theme={theme.id}
      data-variant={spec.variant}
      data-animation={spec.animationIn}
      data-resolved-animation={spec.resolvedAnimationIn}
      className="absolute inset-0 overflow-hidden select-none pointer-events-none"
      style={{
        fontFamily: stageFontCss,
        ...(hideBackdrop
          ? {}
          : { background: `linear-gradient(145deg, ${theme.bgTopHex}, ${theme.bgBottomHex})` }),
      }}
    >
      {!hideBackdrop && (
        <>
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.gridColorRgba} 1px, transparent 1px), linear-gradient(to bottom, ${theme.gridColorRgba} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div
            className="absolute -top-10 -left-10 w-44 h-44 rounded-full blur-2xl opacity-55"
            style={{ backgroundColor: theme.bgAccentHex }}
          />
        </>
      )}

      <div
        className={`relative z-10 mx-auto opacity-100 ${animClass} ${
          isLandscape
            ? 'w-[74%] mt-[5%]'
            : isSquare
            ? 'w-[89%] mt-[6.5%]'
            : 'w-[89%] mt-[9%]'
        }`}
      >
        <div
          className="rounded-xl overflow-hidden border shadow-lg"
          style={{
            backgroundColor: theme.cardBgHex,
            borderColor: theme.cardBorderHex,
          }}
        >
          {spec.variant === 'bs-card-header' && (
            <div
              className="h-1 w-full"
              style={{ background: `linear-gradient(90deg, ${primaryAccent}, ${secondaryAccent})` }}
            />
          )}

          <div className={isCompactStage ? 'py-1' : 'py-2'}>{renderVariantBody()}</div>

          {(spec.prevTargetText || spec.exampleText) && (
            <div className={`${isCompactStage ? 'px-2 pb-1' : 'px-2.5 pb-1.5'}`}>
              <div
                data-testid="studio-2411-context-strip"
                className={`rounded-md border ${
                  isLandscape
                    ? 'px-1.5 py-0.5 text-[8.5px] leading-tight truncate'
                    : isSquare
                    ? 'px-2 py-0.5 text-[8.5px] leading-tight line-clamp-2'
                    : 'px-2 py-1 text-[9px] leading-snug break-words space-y-0.5'
                }`}
                style={{
                  backgroundColor: `${primaryAccent}12`,
                  borderColor: theme.cardBorderHex,
                }}
              >
                {spec.prevTargetText && (
                  <span className={isLandscape ? 'inline-flex items-center gap-1 mr-2' : 'flex items-center gap-1'}>
                    <RotateCcw className="w-2.5 h-2.5 shrink-0" style={{ color: primaryAccent }} aria-hidden="true" />
                    <span className="font-bold uppercase" style={{ color: primaryAccent }}>
                      Prev:
                    </span>
                    <span className="font-semibold truncate" style={{ color: theme.textHex }}>
                      {spec.prevTargetText}
                    </span>
                  </span>
                )}
                {spec.exampleText && (() => {
                  const trimmedEx = spec.exampleText.trim();
                  const isHint = /^Hint:/i.test(trimmedEx) || spec.layoutKind === 'quiz_prompt';
                  const isCaution = spec.hintKind === 'caution';
                  const bodyEx = trimmedEx.replace(/^(Hint|Example|Ex):\s*/i, '');
                  return (
                    <span className={isLandscape ? 'inline-flex items-center gap-1' : 'flex items-center gap-1'}>
                      {isCaution ? (
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-amber-600" aria-hidden="true" />
                      ) : (
                        <Lightbulb className="w-2.5 h-2.5 shrink-0" style={{ color: secondaryAccent }} aria-hidden="true" />
                      )}
                      <span
                        className="font-bold uppercase shrink-0"
                        style={{ color: isCaution ? '#D97706' : isHint ? secondaryAccent : theme.mutedTextHex }}
                      >
                        {isCaution && isHint ? 'Caution:' : isHint ? 'Hint:' : 'Ex:'}
                      </span>
                      <span className="font-semibold" style={{ color: theme.textHex }}>
                        {bodyEx}
                      </span>
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          <div className={`${isCompactStage ? 'px-2 pb-1.5' : 'px-2.5 pb-2'}`}>
            <div
              className={`w-full ${isCompactStage ? 'h-1' : 'h-1.5'} rounded-full overflow-hidden`}
              style={{ backgroundColor: theme.cardBorderHex }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${spec.progressPct}%`,
                  background: `linear-gradient(90deg, ${primaryAccent}, ${secondaryAccent})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
