import React from 'react';
import { Clock } from 'lucide-react';
import {
  ScriptStyle,
  Studio2411SceneComponentOverride,
  Studio2411ThemeId,
  VideoAspectRatio,
} from '../shared/types';
import {
  build2411CardSpecForLine,
  getStudio2411ThemeMeta,
} from '../shared/studioComponents2411';
import { PresentationIcon } from './PresentationIcon';

interface Studio2411CountdownCardProps {
  countdownNumber: number;
  countdownTotalSec: number;
  themeId?: Studio2411ThemeId;
  accentColor?: string;
}

export const Studio2411CountdownCard: React.FC<Studio2411CountdownCardProps> = ({
  countdownNumber,
  countdownTotalSec,
  themeId,
  accentColor,
}) => {
  const theme = getStudio2411ThemeMeta(themeId);
  const totalSteps = Math.max(1, Math.round(countdownTotalSec || 5));
  const pct = Math.max(6, Math.min(100, Math.round((countdownNumber / totalSteps) * 100)));
  const primaryHex = accentColor || theme.accentHex;
  const secondaryHex = theme.secondaryAccentHex;
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div
      data-testid="studio-2411-countdown-card"
      className="rounded-xl border shadow-lg px-3 py-1.5 flex items-center gap-2.5"
      style={{
        minWidth: '154px',
        backgroundColor: theme.isLight ? 'rgba(255,255,255,0.97)' : 'rgba(15,23,42,0.93)',
        borderColor: theme.cardBorderHex,
      }}
    >
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 38 38" className="w-9 h-9 -rotate-90" aria-hidden="true">
          <circle
            cx="19"
            cy="19"
            r={radius}
            fill="none"
            stroke={theme.cardBorderHex}
            strokeWidth="3.5"
          />
          <circle
            cx="19"
            cy="19"
            r={radius}
            fill="none"
            stroke={primaryHex}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 260ms ease-out' }}
          />
        </svg>
        <span
          key={countdownNumber}
          className="animate-mpt-countdown absolute inset-0 flex items-center justify-center text-sm font-extrabold tabular-nums select-none"
          style={{ color: theme.textHex }}
        >
          {countdownNumber}
        </span>
      </div>

      <div className="flex-1 min-w-[78px] space-y-1">
        <div
          className="flex items-center justify-between gap-1.5 text-[8.5px] font-bold tracking-wider uppercase"
          style={{ color: primaryHex }}
        >
          <span className="inline-flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
            <span>THINK TIME</span>
          </span>
          <span className="tabular-nums" style={{ color: theme.mutedTextHex }}>
            {countdownNumber}s
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: theme.cardBorderHex }}
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
  );
};

interface Studio2411StageCardProps {
  rawLine: string;
  lineIndex: number;
  totalLines: number;
  isSecondarySlot?: boolean;
  isIntroOrOutro?: boolean;
  scriptStyle?: ScriptStyle;
  themeId?: Studio2411ThemeId;
  pauseBetweenLinesSec?: number;
  aspectRatio?: VideoAspectRatio;
  countdownActive?: boolean;
  prevTargetText?: string;
  animationSeed?: number;
  override?: Studio2411SceneComponentOverride;
}

const WAVE_BARS = [0.36, 0.72, 0.96, 0.54, 0.84, 0.45, 0.75, 0.4];

export const Studio2411StageCard: React.FC<Studio2411StageCardProps> = ({
  rawLine,
  lineIndex,
  totalLines,
  isSecondarySlot = false,
  isIntroOrOutro = false,
  scriptStyle,
  themeId,
  pauseBetweenLinesSec = 5,
  aspectRatio = '9:16',
  countdownActive = false,
  prevTargetText,
  animationSeed = 0,
  override,
}) => {
  const spec = build2411CardSpecForLine({
    rawLine,
    lineIndex,
    totalLines,
    isSecondarySlot,
    isIntroOrOutro,
    scriptStyle,
    themeId,
    defaultPauseSec: pauseBetweenLinesSec,
    prevTargetText,
    animationSeed,
    override,
  });

  const { theme } = spec;
  const primaryAccent =
    spec.accentOverrideHex ??
    (spec.layoutKind === 'answer_reveal' ? theme.secondaryAccentHex : theme.accentHex);
  const secondaryAccent =
    spec.layoutKind === 'answer_reveal' ? theme.accentHex : theme.secondaryAccentHex;
  const isLandscape = aspectRatio === '16:9';

  const animClass =
    spec.resolvedAnimationIn === 'pop-up'
      ? 'animate-2411-pop-up'
      : spec.resolvedAnimationIn === 'drop-in'
      ? 'animate-2411-drop-in'
      : spec.resolvedAnimationIn === 'fade-scale'
      ? 'animate-2411-fade-scale'
      : 'animate-2411-slide-up';

  const dynamicTextCls = (str: string, base: string, compact: string) =>
    str.length > 34 ? compact : base;

  const renderVariantBody = () => {
    switch (spec.variant) {
      case 'css-compare':
        return (
          <div className="p-2 grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5">
            <div
              className="rounded-lg border p-1.5 text-center flex flex-col justify-center min-w-0"
              style={{ backgroundColor: theme.surfaceTintHex, borderColor: theme.cardBorderHex }}
            >
              <div className="text-[7.5px] font-bold uppercase break-words" style={{ color: theme.mutedTextHex }}>
                {spec.labels[0] ?? 'Prompt'}
              </div>
              <div className="text-[9px] font-bold leading-snug break-words mt-0.5" style={{ color: theme.textHex }}>
                {spec.contextLabel || spec.subtitle}
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full text-[8px] font-bold text-white flex items-center justify-center shrink-0 self-center"
              style={{ backgroundColor: secondaryAccent }}
            >
              VS
            </span>
            <div
              className="rounded-lg border p-1.5 text-center flex flex-col justify-center min-w-0"
              style={{
                backgroundColor: `${primaryAccent}1A`,
                borderColor: primaryAccent,
              }}
            >
              <div className="text-[7.5px] font-bold uppercase break-words" style={{ color: primaryAccent }}>
                {spec.labels[1] ?? 'Target'}
              </div>
              <div className={dynamicTextCls(spec.speechText || spec.highlightWord, 'text-[9.5px] font-bold leading-snug break-words mt-0.5', 'text-[8.5px] font-bold leading-snug break-words mt-0.5')} style={{ color: theme.textHex }}>
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
          <div className="p-2 space-y-1.5">
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
                      className="w-5 h-5 rounded-full border text-[8px] font-mono font-bold flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: active ? primaryAccent : theme.cardBgHex,
                        borderColor: active ? primaryAccent : theme.cardBorderHex,
                        color: active ? '#FFFFFF' : theme.mutedTextHex,
                      }}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className="text-[8px] font-semibold text-center leading-tight break-words"
                      style={{ color: active ? theme.textHex : theme.mutedTextHex }}
                    >
                      {lbl}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-[9px] font-medium text-center leading-snug break-words" style={{ color: theme.mutedTextHex }}>
              {spec.title}
            </div>
          </div>
        );
      }

      case 'css-glass-quote':
        return (
          <div className="p-2 flex items-start gap-2">
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: primaryAccent }} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-sm leading-none font-serif font-bold" style={{ color: secondaryAccent }}>
                “
              </div>
              <div
                className={`${dynamicTextCls(spec.title, 'text-[10px]', 'text-[9px]')} font-bold leading-snug break-words`}
                style={{ color: theme.textHex }}
              >
                {spec.title}
              </div>
              <div className="text-[8.5px] leading-snug break-words" style={{ color: theme.mutedTextHex }}>
                {spec.subtitle}
              </div>
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold break-words"
                style={{ backgroundColor: `${primaryAccent}20`, color: primaryAccent }}
              >
                {spec.highlightWord}
              </span>
            </div>
          </div>
        );

      case 'css-equation':
        return (
          <div className="p-2 space-y-1.5">
            <div className="text-[8px] font-mono font-semibold leading-snug break-words" style={{ color: primaryAccent }}>
              {spec.formula}
            </div>
            <div className="flex items-stretch gap-1 text-[8.5px] font-bold">
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
          <div className="p-2">
            <div
              className="rounded-lg border p-2 text-center space-y-1 shadow-xs"
              style={{
                backgroundColor: theme.surfaceTintHex,
                borderColor: primaryAccent,
              }}
            >
              <div className="flex items-center justify-between text-[8px] font-bold uppercase">
                <span style={{ color: primaryAccent }}>{spec.labels[0] ?? 'FLASHCARD'}</span>
                <PresentationIcon iconKey={spec.iconKey} className="w-3.5 h-3.5 shrink-0" />
              </div>
              <div
                className={`${dynamicTextCls(spec.highlightWord, 'text-[11px]', 'text-[9.5px]')} font-bold leading-snug break-words`}
                style={{ color: theme.textHex }}
              >
                {spec.highlightWord}
              </div>
              <div className="text-[8.5px] leading-snug break-words" style={{ color: theme.mutedTextHex }}>
                {spec.subtitle}
              </div>
            </div>
          </div>
        );

      case 'bs-progress-meter':
        return (
          <div className="p-2 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9.5px] font-bold leading-snug break-words" style={{ color: theme.textHex }}>
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
            <div className="text-[8px] font-mono leading-snug break-words" style={{ color: theme.mutedTextHex }}>
              {spec.labels.join(' · ')}
            </div>
          </div>
        );

      case 'bs-alert-callout':
        return (
          <div className="p-2">
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
                <div className="text-[9.5px] font-bold leading-snug break-words" style={{ color: theme.textHex }}>
                  {spec.title}
                </div>
                <div className="text-[8.5px] leading-snug break-words" style={{ color: theme.mutedTextHex }}>
                  {spec.subtitle}
                </div>
              </div>
            </div>
          </div>
        );

      case 'gauge-tone': {
        const angleDeg = -90 + Math.round((spec.progressPct / 100) * 180);
        return (
          <div className="p-2 flex items-center gap-2">
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
              <div className="text-[9.5px] font-bold leading-snug break-words" style={{ color: theme.textHex }}>
                {spec.title}
              </div>
              <div className="text-[8.5px] font-semibold leading-snug break-words" style={{ color: primaryAccent }}>
                {spec.highlightWord} · {spec.progressPct}%
              </div>
            </div>
          </div>
        );
      }

      case 'staircase-3d': {
        const blocks = [
          { lbl: spec.labels[0] ?? 'Step 1', h: 24 },
          { lbl: spec.labels[1] ?? 'Step 2', h: 34 },
          { lbl: spec.labels[2] ?? 'Step 3', h: 44 },
        ];
        return (
          <div className="p-2 flex items-end gap-1.5 min-h-[54px]">
            {blocks.map((b, idx) => (
              <div
                key={idx}
                className="flex-1 min-w-0 rounded-md border flex items-center justify-center px-1 py-1 text-center shadow-xs"
                style={{
                  minHeight: `${b.h}px`,
                  backgroundColor: idx === 2 ? primaryAccent : theme.surfaceTintHex,
                  borderColor: idx === 2 ? primaryAccent : theme.cardBorderHex,
                  color: idx === 2 ? '#FFFFFF' : theme.textHex,
                }}
              >
                <span className="text-[8px] font-bold leading-tight break-words">{b.lbl}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'friends-chat': {
        const spkA = spec.labels[0] ?? 'Speaker A';
        const spkB = spec.labels[1] ?? 'Speaker B';
        return (
          <div className="p-2 grid grid-cols-[auto_1fr_auto] items-center gap-1.5">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <svg viewBox="-26 -24 52 58" className="w-8 h-9" aria-hidden="true">
                <path d="M-22 30 C-20 14 20 14 22 30 Z" fill={primaryAccent} />
                <circle cx="0" cy="0" r="16" fill="#FDE68A" />
                <path d="M-17 -6 C-16 -22 16 -22 17 -6 C10 -11 -10 -11 -17 -6 Z" fill="#1E293B" />
                <circle cx="-5" cy="0" r="1.8" fill="#1E293B" />
                <circle cx="5" cy="0" r="1.8" fill="#1E293B" />
                <path d="M-5 7 Q0 11 5 7" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span
                className="px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white text-center leading-tight"
                style={{ backgroundColor: primaryAccent }}
              >
                {spkA}
              </span>
            </div>

            <div
              className="rounded-xl border px-2 py-1.5 text-center space-y-0.5 min-w-0"
              style={{
                backgroundColor: theme.surfaceTintHex,
                borderColor: primaryAccent,
              }}
            >
              <div className="flex items-center justify-center gap-1" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryAccent }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryAccent }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryAccent }} />
              </div>
              <div
                className={`${dynamicTextCls(spec.speechText, 'text-[9px]', 'text-[8px]')} font-bold leading-snug break-words whitespace-normal`}
                style={{ color: theme.textHex }}
              >
                {spec.speechText}
              </div>
              <div className="text-[7.5px] font-bold break-words" style={{ color: secondaryAccent }}>
                {spec.reactionText}
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <svg viewBox="-26 -24 52 58" className="w-8 h-9" aria-hidden="true">
                <path d="M-22 30 C-20 14 20 14 22 30 Z" fill={secondaryAccent} />
                <circle cx="0" cy="0" r="16" fill="#FDE68A" />
                <path d="M-20 -4 C-22 -24 22 -24 20 -4 L20 10 C15 6 11 -4 0 -6 C-11 -4 -15 6 -20 10 Z" fill="#78350F" />
                <circle cx="-5" cy="0" r="1.8" fill="#1E293B" />
                <circle cx="5" cy="0" r="1.8" fill="#1E293B" />
                <path d="M-5 7 Q0 12 5 7" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span
                className="px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white text-center leading-tight"
                style={{ backgroundColor: secondaryAccent }}
              >
                {spkB}
              </span>
            </div>
          </div>
        );
      }

      case 'avatar-speech':
        return (
          <div className="p-2 flex items-center gap-2">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryAccent}20` }}
              >
                <svg viewBox="-24 -22 48 54" className="w-8 h-8" aria-hidden="true">
                  <path d="M-20 28 C-18 14 18 14 20 28 Z" fill={primaryAccent} />
                  <circle cx="0" cy="0" r="15" fill="#FDE68A" />
                  <path d="M-16 -6 C-15 -20 15 -20 16 -6 C9 -10 -9 -10 -16 -6 Z" fill="#1E293B" />
                  <circle cx="-5" cy="0" r="1.8" fill="#1E293B" />
                  <circle cx="5" cy="0" r="1.8" fill="#1E293B" />
                  <path d="M-5 7 Q0 11 5 7" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span
                className="px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white text-center leading-tight"
                style={{ backgroundColor: primaryAccent }}
              >
                {spec.labels[0] ?? 'Speaker'}
              </span>
            </div>

            <div className="relative min-w-0 flex-1">
              <div
                className="rounded-xl border px-2 py-1.5 space-y-1"
                style={{
                  backgroundColor: theme.surfaceTintHex,
                  borderColor: primaryAccent,
                }}
              >
                <div
                  className={`${dynamicTextCls(spec.speechText, 'text-[9.5px]', 'text-[8.5px]')} font-bold leading-snug break-words whitespace-normal`}
                  style={{ color: theme.textHex }}
                >
                  {spec.speechText}
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <span className="text-[7.5px] leading-tight break-words" style={{ color: theme.mutedTextHex }}>
                    {spec.subtitle}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white shrink-0"
                    style={{ backgroundColor: secondaryAccent }}
                  >
                    {spec.reactionText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'dialogue-upgrade':
        return (
          <div className="p-2 grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5">
            <div
              className="rounded-lg border p-1.5 min-w-0 flex flex-col justify-center"
              style={{ backgroundColor: theme.surfaceTintHex, borderColor: theme.cardBorderHex }}
            >
              <div className="text-[7px] font-bold uppercase break-words" style={{ color: theme.mutedTextHex }}>
                {spec.labels[0] ?? 'Basic Form'}
              </div>
              <div className="text-[8.5px] font-semibold leading-snug break-words mt-0.5" style={{ color: theme.textHex }}>
                {spec.speechText}
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0 self-center"
              style={{ backgroundColor: primaryAccent }}
            >
              →
            </span>
            <div
              className="rounded-lg border p-1.5 min-w-0 flex flex-col justify-center"
              style={{
                backgroundColor: `${primaryAccent}1A`,
                borderColor: primaryAccent,
              }}
            >
              <div className="text-[7px] font-bold uppercase break-words" style={{ color: primaryAccent }}>
                ✓ {spec.labels[1] ?? 'Natural Form'}
              </div>
              <div className="text-[9px] font-bold leading-snug break-words mt-0.5" style={{ color: theme.textHex }}>
                {spec.highlightWord}
              </div>
            </div>
          </div>
        );

      case 'css-browser-mockup':
      case 'bs-card-header':
      default:
        return (
          <div className="p-2 flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: theme.surfaceTintHex,
                borderColor: theme.cardBorderHex,
                color: primaryAccent,
              }}
            >
              <PresentationIcon iconKey={spec.iconKey} className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="text-[9.5px] font-bold leading-snug break-words" style={{ color: theme.textHex }}>
                {spec.title}
              </div>
              <div className="text-[8px] font-mono tracking-wide uppercase leading-snug break-words" style={{ color: theme.mutedTextHex }}>
                {spec.subtitle}
              </div>
              <div className="flex items-end gap-1 h-2.5 pt-0.5">
                {WAVE_BARS.map((ratio, idx) => (
                  <span
                    key={idx}
                    className="w-1 rounded-full"
                    style={{
                      height: `${Math.max(3, Math.round(ratio * 9))}px`,
                      backgroundColor: idx % 2 === 0 ? primaryAccent : secondaryAccent,
                      opacity: 0.55 + ratio * 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      key={`${theme.id}_${spec.variant}_${lineIndex}`}
      data-testid="studio-2411-stage-card"
      data-theme={theme.id}
      data-variant={spec.variant}
      data-animation={spec.animationIn}
      data-resolved-animation={spec.resolvedAnimationIn}
      className="animate-mpt-scene-fade absolute inset-0 overflow-hidden select-none pointer-events-none"
      style={{
        background: `linear-gradient(145deg, ${theme.bgTopHex}, ${theme.bgBottomHex})`,
      }}
    >
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

      <div
        className={`relative z-10 mx-auto transition-all duration-200 ${animClass} ${
          countdownActive ? 'opacity-95' : 'opacity-100'
        } ${
          isLandscape
            ? countdownActive
              ? 'w-[76%] mt-[4.5%]'
              : 'w-[76%] mt-[7.5%]'
            : countdownActive
            ? 'w-[89%] mt-[8.5%]'
            : 'w-[89%] mt-[11.5%]'
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

          <div
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b"
            style={{
              backgroundColor: theme.surfaceTintHex,
              borderColor: theme.cardBorderHex,
            }}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: primaryAccent }} />
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: secondaryAccent }} />
              {spec.variant === 'css-browser-mockup' && (
                <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
              )}
              <span
                className="text-[8px] font-bold tracking-wider uppercase break-words ml-0.5"
                style={{ color: primaryAccent }}
              >
                {spec.variant === 'css-browser-mockup'
                  ? `studio://2411/${spec.layoutKind}`
                  : `${spec.kickerLabel} · ${spec.variant}`}
              </span>
            </div>
            <span
              className="text-[8px] font-mono font-semibold tabular-nums shrink-0"
              style={{ color: theme.mutedTextHex }}
            >
              {String(spec.stepIndex).padStart(2, '0')} / {String(spec.totalSteps).padStart(2, '0')}
            </span>
          </div>

          <div className="py-1">{renderVariantBody()}</div>

          {(spec.prevTargetText || spec.exampleText) && (
            <div className="px-2.5 pb-1.5">
              <div
                data-testid="studio-2411-context-strip"
                className="rounded-md border px-2 py-1 text-[8px] leading-snug break-words space-y-0.5"
                style={{
                  backgroundColor: `${primaryAccent}12`,
                  borderColor: theme.cardBorderHex,
                }}
              >
                {spec.prevTargetText && (
                  <div>
                    <span className="font-bold uppercase mr-1" style={{ color: primaryAccent }}>
                      Recall Prev:
                    </span>
                    <span className="font-semibold" style={{ color: theme.textHex }}>
                      {spec.prevTargetText}
                    </span>
                  </div>
                )}
                {spec.exampleText && (
                  <div>
                    <span className="font-bold uppercase mr-1" style={{ color: theme.mutedTextHex }}>
                      Example:
                    </span>
                    <span className="font-semibold" style={{ color: theme.textHex }}>
                      {spec.exampleText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-2.5 pb-2 space-y-1">
            <div className="flex items-center justify-between gap-2 text-[8px]" style={{ color: theme.mutedTextHex }}>
              <span className="font-semibold break-words min-w-0">{spec.title}</span>
              <span className="font-mono uppercase shrink-0" style={{ color: primaryAccent }}>
                {spec.animationIn === 'random'
                  ? `random → ${spec.resolvedAnimationIn}`
                  : spec.animationIn}
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
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
