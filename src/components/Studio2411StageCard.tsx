import React from 'react';
import {
  ScriptStyle,
  Studio2411SceneComponentOverride,
  Studio2411ThemeId,
  VideoAspectRatio,
} from '../shared/types';
import { build2411CardSpecForLine } from '../shared/studioComponents2411';
import { PresentationIcon } from './PresentationIcon';

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
    spec.animationIn === 'pop-up'
      ? 'animate-2411-pop-up'
      : spec.animationIn === 'drop-in'
      ? 'animate-2411-drop-in'
      : spec.animationIn === 'fade-scale'
      ? 'animate-2411-fade-scale'
      : 'animate-2411-slide-up';

  const renderVariantBody = () => {
    switch (spec.variant) {
      case 'css-compare':
        return (
          <div className="p-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
            <div
              className="rounded-lg border p-2 text-center"
              style={{ backgroundColor: theme.surfaceTintHex, borderColor: theme.cardBorderHex }}
            >
              <div className="text-[8px] font-bold uppercase truncate" style={{ color: theme.mutedTextHex }}>
                {spec.labels[0] ?? 'Source'}
              </div>
              <div className="text-[10px] font-bold truncate mt-0.5" style={{ color: theme.textHex }}>
                {spec.subtitle}
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full text-[8px] font-bold text-white flex items-center justify-center shrink-0"
              style={{ backgroundColor: secondaryAccent }}
            >
              VS
            </span>
            <div
              className="rounded-lg border p-2 text-center"
              style={{
                backgroundColor: `${primaryAccent}1A`,
                borderColor: primaryAccent,
              }}
            >
              <div className="text-[8px] font-bold uppercase truncate" style={{ color: primaryAccent }}>
                {spec.labels[1] ?? 'Target'}
              </div>
              <div className="text-[10px] font-bold truncate mt-0.5" style={{ color: theme.textHex }}>
                {spec.highlightWord}
              </div>
            </div>
          </div>
        );

      case 'css-roadmap': {
        const steps = [
          spec.labels[0] ?? 'Step 1',
          spec.labels[1] ?? 'Step 2',
          spec.labels[2] ?? 'Step 3',
        ];
        const activeStep = spec.stepIndex % 3;
        return (
          <div className="p-2.5 space-y-2">
            <div className="relative flex items-center justify-between px-2">
              <div
                className="absolute left-4 right-4 top-2.5 h-0.5"
                style={{ backgroundColor: theme.cardBorderHex }}
              />
              {steps.map((lbl, idx) => {
                const active = idx <= activeStep;
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-1 min-w-0 max-w-[32%]">
                    <span
                      className="w-5 h-5 rounded-full border text-[8px] font-mono font-bold flex items-center justify-center"
                      style={{
                        backgroundColor: active ? primaryAccent : theme.cardBgHex,
                        borderColor: active ? primaryAccent : theme.cardBorderHex,
                        color: active ? '#FFFFFF' : theme.mutedTextHex,
                      }}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className="text-[8px] font-semibold truncate max-w-full"
                      style={{ color: active ? theme.textHex : theme.mutedTextHex }}
                    >
                      {lbl}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-[9px] font-medium text-center truncate" style={{ color: theme.mutedTextHex }}>
              {spec.title}
            </div>
          </div>
        );
      }

      case 'css-glass-quote':
        return (
          <div className="p-2.5 flex items-start gap-2">
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: primaryAccent }} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-base leading-none font-serif font-bold" style={{ color: secondaryAccent }}>
                “
              </div>
              <div className="text-[10px] font-bold leading-snug truncate" style={{ color: theme.textHex }}>
                {spec.title}
              </div>
              <div className="text-[9px] truncate" style={{ color: theme.mutedTextHex }}>
                {spec.subtitle}
              </div>
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold"
                style={{ backgroundColor: `${primaryAccent}20`, color: primaryAccent }}
              >
                {spec.highlightWord}
              </span>
            </div>
          </div>
        );

      case 'css-equation':
        return (
          <div className="p-2.5 space-y-1.5">
            <div className="text-[8px] font-mono font-semibold truncate" style={{ color: primaryAccent }}>
              {spec.formula}
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold">
              <div
                className="flex-1 min-w-0 px-1.5 py-1.5 rounded border text-center truncate"
                style={{
                  backgroundColor: theme.surfaceTintHex,
                  borderColor: theme.cardBorderHex,
                  color: theme.textHex,
                }}
              >
                {spec.labels[0] ?? 'A'}
              </div>
              <span style={{ color: secondaryAccent }}>+</span>
              <div
                className="flex-1 min-w-0 px-1.5 py-1.5 rounded border text-center truncate"
                style={{
                  backgroundColor: theme.surfaceTintHex,
                  borderColor: theme.cardBorderHex,
                  color: theme.textHex,
                }}
              >
                {spec.labels[1] ?? 'B'}
              </div>
              <span style={{ color: primaryAccent }}>=</span>
              <div
                className="flex-1 min-w-0 px-1.5 py-1.5 rounded border text-center truncate"
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
          <div className="p-2.5">
            <div
              className="rounded-lg border p-2.5 text-center space-y-1 shadow-xs"
              style={{
                backgroundColor: theme.surfaceTintHex,
                borderColor: primaryAccent,
              }}
            >
              <div className="flex items-center justify-between text-[8px] font-bold uppercase">
                <span style={{ color: primaryAccent }}>{spec.labels[0] ?? 'FLASHCARD'}</span>
                <PresentationIcon iconKey={spec.iconKey} className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs font-bold truncate" style={{ color: theme.textHex }}>
                {spec.highlightWord}
              </div>
              <div className="text-[9px] truncate" style={{ color: theme.mutedTextHex }}>
                {spec.subtitle}
              </div>
            </div>
          </div>
        );

      case 'bs-progress-meter':
        return (
          <div className="p-2.5 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold truncate" style={{ color: theme.textHex }}>
                {spec.title}
              </span>
              <span className="text-xs font-mono font-bold tabular-nums" style={{ color: primaryAccent }}>
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
            <div className="text-[8px] font-mono truncate" style={{ color: theme.mutedTextHex }}>
              {spec.labels.join(' · ')}
            </div>
          </div>
        );

      case 'bs-alert-callout':
        return (
          <div className="p-2.5">
            <div
              className="rounded-lg border-l-4 border p-2 flex items-center gap-2"
              style={{
                backgroundColor: `${secondaryAccent}14`,
                borderColor: theme.cardBorderHex,
                borderLeftColor: secondaryAccent,
              }}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: theme.cardBgHex, color: secondaryAccent }}
              >
                <PresentationIcon iconKey="alert_triangle" className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold truncate" style={{ color: theme.textHex }}>
                  {spec.title}
                </div>
                <div className="text-[9px] truncate" style={{ color: theme.mutedTextHex }}>
                  {spec.subtitle}
                </div>
              </div>
            </div>
          </div>
        );

      case 'gauge-tone': {
        const angleDeg = -90 + Math.round((spec.progressPct / 100) * 180);
        return (
          <div className="p-2.5 flex items-center gap-2.5">
            <svg viewBox="0 0 80 48" className="w-16 h-10 shrink-0" aria-hidden="true">
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
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold truncate" style={{ color: theme.textHex }}>
                {spec.title}
              </div>
              <div className="text-[9px] font-semibold truncate" style={{ color: primaryAccent }}>
                {spec.highlightWord} · {spec.progressPct}%
              </div>
            </div>
          </div>
        );
      }

      case 'staircase-3d': {
        const blocks = [
          { lbl: spec.labels[0] ?? 'Step 1', h: 22 },
          { lbl: spec.labels[1] ?? 'Step 2', h: 32 },
          { lbl: spec.labels[2] ?? 'Step 3', h: 42 },
        ];
        return (
          <div className="p-2.5 flex items-end gap-1.5 h-[62px]">
            {blocks.map((b, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-md border flex items-center justify-center px-1 text-center shadow-xs"
                style={{
                  height: `${b.h}px`,
                  backgroundColor: idx === 2 ? primaryAccent : theme.surfaceTintHex,
                  borderColor: idx === 2 ? primaryAccent : theme.cardBorderHex,
                  color: idx === 2 ? '#FFFFFF' : theme.textHex,
                }}
              >
                <span className="text-[8px] font-bold truncate">{b.lbl}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'friends-chat': {
        const spkA = spec.labels[0] ?? 'Speaker A';
        const spkB = spec.labels[1] ?? 'Speaker B';
        return (
          <div className="p-2.5 grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <svg viewBox="-26 -24 52 58" className="w-9 h-10" aria-hidden="true">
                <path d="M-22 30 C-20 14 20 14 22 30 Z" fill={primaryAccent} />
                <circle cx="0" cy="0" r="16" fill="#FDE68A" />
                <path d="M-17 -6 C-16 -22 16 -22 17 -6 C10 -11 -10 -11 -17 -6 Z" fill="#1E293B" />
                <circle cx="-5" cy="0" r="1.8" fill="#1E293B" />
                <circle cx="5" cy="0" r="1.8" fill="#1E293B" />
                <path d="M-5 7 Q0 11 5 7" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span
                className="px-1.5 py-0.5 rounded-full text-[7.5px] font-bold text-white truncate max-w-[60px]"
                style={{ backgroundColor: primaryAccent }}
              >
                {spkA}
              </span>
            </div>

            <div
              className="rounded-xl border px-2 py-1.5 text-center space-y-1 min-w-0"
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
              <div className="text-[9.5px] font-bold leading-snug line-clamp-2" style={{ color: theme.textHex }}>
                {spec.speechText}
              </div>
              <div className="text-[8px] font-bold truncate" style={{ color: secondaryAccent }}>
                {spec.reactionText}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <svg viewBox="-26 -24 52 58" className="w-9 h-10" aria-hidden="true">
                <path d="M-22 30 C-20 14 20 14 22 30 Z" fill={secondaryAccent} />
                <circle cx="0" cy="0" r="16" fill="#FDE68A" />
                <path d="M-20 -4 C-22 -24 22 -24 20 -4 L20 10 C15 6 11 -4 0 -6 C-11 -4 -15 6 -20 10 Z" fill="#78350F" />
                <circle cx="-5" cy="0" r="1.8" fill="#1E293B" />
                <circle cx="5" cy="0" r="1.8" fill="#1E293B" />
                <path d="M-5 7 Q0 12 5 7" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span
                className="px-1.5 py-0.5 rounded-full text-[7.5px] font-bold text-white truncate max-w-[60px]"
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
          <div className="p-2.5 flex items-center gap-2.5">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryAccent}20` }}
              >
                <svg viewBox="-24 -22 48 54" className="w-10 h-10" aria-hidden="true">
                  <path d="M-20 28 C-18 14 18 14 20 28 Z" fill={primaryAccent} />
                  <circle cx="0" cy="0" r="15" fill="#FDE68A" />
                  <path d="M-16 -6 C-15 -20 15 -20 16 -6 C9 -10 -9 -10 -16 -6 Z" fill="#1E293B" />
                  <circle cx="-5" cy="0" r="1.8" fill="#1E293B" />
                  <circle cx="5" cy="0" r="1.8" fill="#1E293B" />
                  <path d="M-5 7 Q0 11 5 7" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span
                className="px-1.5 py-0.5 rounded-full text-[7.5px] font-bold text-white truncate max-w-[64px]"
                style={{ backgroundColor: primaryAccent }}
              >
                {spec.labels[0] ?? 'Speaker'}
              </span>
            </div>

            <div className="relative min-w-0 flex-1">
              <div
                className="rounded-xl border px-2.5 py-2 space-y-1"
                style={{
                  backgroundColor: theme.surfaceTintHex,
                  borderColor: primaryAccent,
                }}
              >
                <div className="text-[10px] font-bold leading-snug line-clamp-2" style={{ color: theme.textHex }}>
                  {spec.speechText}
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <span className="text-[8px] truncate" style={{ color: theme.mutedTextHex }}>
                    {spec.subtitle}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[7.5px] font-bold text-white shrink-0"
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
          <div className="p-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
            <div
              className="rounded-lg border p-2 min-w-0"
              style={{ backgroundColor: theme.surfaceTintHex, borderColor: theme.cardBorderHex }}
            >
              <div className="text-[7.5px] font-bold uppercase truncate" style={{ color: theme.mutedTextHex }}>
                {spec.labels[0] ?? 'Basic'}
              </div>
              <div className="text-[9.5px] font-semibold truncate mt-0.5" style={{ color: theme.textHex }}>
                {spec.speechText}
              </div>
            </div>
            <span
              className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
              style={{ backgroundColor: primaryAccent }}
            >
              →
            </span>
            <div
              className="rounded-lg border p-2 min-w-0"
              style={{
                backgroundColor: `${primaryAccent}1A`,
                borderColor: primaryAccent,
              }}
            >
              <div className="text-[7.5px] font-bold uppercase truncate" style={{ color: primaryAccent }}>
                ✓ {spec.labels[1] ?? 'Natural'}
              </div>
              <div className="text-[10px] font-bold truncate mt-0.5" style={{ color: theme.textHex }}>
                {spec.highlightWord}
              </div>
            </div>
          </div>
        );

      case 'css-browser-mockup':
      case 'bs-card-header':
      default:
        return (
          <div className="p-2.5 flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: theme.surfaceTintHex,
                borderColor: theme.cardBorderHex,
                color: primaryAccent,
              }}
            >
              <PresentationIcon iconKey={spec.iconKey} className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-[10px] font-bold truncate" style={{ color: theme.textHex }}>
                {spec.title}
              </div>
              <div className="text-[9px] font-mono tracking-wide uppercase truncate" style={{ color: theme.mutedTextHex }}>
                {spec.subtitle}
              </div>
              <div className="flex items-end gap-1 h-3 pt-0.5">
                {WAVE_BARS.map((ratio, idx) => (
                  <span
                    key={idx}
                    className="w-1 rounded-full"
                    style={{
                      height: `${Math.max(4, Math.round(ratio * 11))}px`,
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
        className={`relative z-10 mx-auto transition-opacity duration-200 ${animClass} ${
          countdownActive ? 'opacity-70' : 'opacity-100'
        } ${isLandscape ? 'w-[74%] mt-[10%]' : 'w-[86%] mt-[16%]'}`}
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
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${primaryAccent}, ${secondaryAccent})` }}
            />
          )}

          <div
            className="flex items-center justify-between gap-2 px-3 py-2 border-b"
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
                className="text-[8.5px] font-bold tracking-wider uppercase truncate ml-0.5"
                style={{ color: primaryAccent }}
              >
                {spec.variant === 'css-browser-mockup'
                  ? `studio://2411/${spec.layoutKind}`
                  : `${spec.kickerLabel} · ${spec.variant}`}
              </span>
            </div>
            <span
              className="text-[8.5px] font-mono font-semibold tabular-nums shrink-0"
              style={{ color: theme.mutedTextHex }}
            >
              {String(spec.stepIndex).padStart(2, '0')} / {String(spec.totalSteps).padStart(2, '0')}
            </span>
          </div>

          <div className="py-1.5">{renderVariantBody()}</div>

          <div className="px-3 pb-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[8.5px]" style={{ color: theme.mutedTextHex }}>
              <span className="font-semibold truncate">{spec.title}</span>
              <span className="font-mono uppercase shrink-0" style={{ color: primaryAccent }}>
                {spec.animationIn}
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
