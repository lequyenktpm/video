import React from 'react';
import { ScriptStyle, Studio2411ThemeId, VideoAspectRatio } from '../shared/types';
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
  });

  const { theme } = spec;
  const primaryAccent =
    spec.layoutKind === 'answer_reveal' ? theme.secondaryAccentHex : theme.accentHex;
  const secondaryAccent =
    spec.layoutKind === 'answer_reveal' ? theme.accentHex : theme.secondaryAccentHex;
  const isLandscape = aspectRatio === '16:9';

  return (
    <div
      key={`${theme.id}_${lineIndex}`}
      data-testid="studio-2411-stage-card"
      data-theme={theme.id}
      className="animate-mpt-scene-fade absolute inset-0 overflow-hidden select-none pointer-events-none"
      style={{
        background: `linear-gradient(145deg, ${theme.bgTopHex}, ${theme.bgBottomHex})`,
      }}
    >
      {/* Subtle architectural grid matching 2411 Studio surfaces */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `linear-gradient(to right, ${theme.gridColorRgba} 1px, transparent 1px), linear-gradient(to bottom, ${theme.gridColorRgba} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient tonal orb */}
      <div
        className="absolute -top-10 -left-10 w-44 h-44 rounded-full blur-2xl opacity-55"
        style={{ backgroundColor: theme.bgAccentHex }}
      />

      {/* Upper-center structured Study Card (keeps lower zone clean for subtitles & countdown) */}
      <div
        className={`relative z-10 mx-auto transition-opacity duration-200 ${
          countdownActive ? 'opacity-70' : 'opacity-100'
        } ${isLandscape ? 'w-[74%] mt-[6%]' : 'w-[84%] mt-[11%]'}`}
      >
        <div
          className="rounded-xl overflow-hidden border shadow-md"
          style={{
            backgroundColor: theme.cardBgHex,
            borderColor: theme.cardBorderHex,
          }}
        >
          {/* Card Window Header Strip */}
          <div
            className="flex items-center justify-between gap-2 px-3 py-1.5 border-b"
            style={{
              backgroundColor: theme.surfaceTintHex,
              borderColor: theme.cardBorderHex,
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: primaryAccent }}
              />
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: secondaryAccent }}
              />
              <span
                className="text-[9px] font-bold tracking-wider uppercase truncate"
                style={{ color: primaryAccent }}
              >
                {spec.kickerLabel}
              </span>
            </div>
            <span
              className="text-[9px] font-mono font-semibold tabular-nums shrink-0"
              style={{ color: theme.mutedTextHex }}
            >
              {String(spec.stepIndex).padStart(2, '0')} / {String(spec.totalSteps).padStart(2, '0')}
            </span>
          </div>

          {/* Card Body */}
          <div className="p-3 flex items-center gap-2.5">
            <div
              className="w-11 h-11 rounded-lg border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: theme.surfaceTintHex,
                borderColor: theme.cardBorderHex,
                color: primaryAccent,
              }}
            >
              <PresentationIcon iconKey={spec.iconKey} className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-bold truncate" style={{ color: theme.textHex }}>
                <span className="truncate">{spec.roleLabel}</span>
                <span style={{ color: theme.mutedTextHex }}>·</span>
                <span className="truncate" style={{ color: primaryAccent }}>
                  {spec.contextLabel}
                </span>
              </div>

              <div className="text-[9px] font-mono tracking-wide uppercase" style={{ color: theme.mutedTextHex }}>
                {spec.hasPause
                  ? `THINK TIME · ${spec.pauseSec}S`
                  : spec.layoutKind === 'answer_reveal'
                  ? 'TARGET EXPRESSION'
                  : 'STUDY FOCUS'}
              </div>

              <div className="flex items-end gap-1 h-3.5 pt-0.5">
                {WAVE_BARS.map((ratio, idx) => (
                  <span
                    key={idx}
                    className="w-1 rounded-full"
                    style={{
                      height: `${Math.max(4, Math.round(ratio * 13))}px`,
                      backgroundColor: idx % 2 === 0 ? primaryAccent : secondaryAccent,
                      opacity: 0.55 + ratio * 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Progress Track */}
          <div className="px-3 pb-2.5">
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
