import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import {
  ScriptStyle,
  Studio2411ThemeId,
  SubtitleConfig,
  VideoAspectRatio,
} from '../shared/types';
import {
  analyzeScriptLinePresentation,
  getCanvasDimensions,
  getSubtitleWrapBudget,
  hasCjkChars,
  PresentationRoleTone,
  resolveCountdownCenterY,
  tokenizeSubtitleForEffect,
  wrapSubtitleLine,
} from '../shared/mptEngine';
import { PresentationIcon } from './PresentationIcon';
import { Studio2411CountdownCard } from './Studio2411StageCard';

const ROLE_TONE_CLASSES: Record<PresentationRoleTone, string> = {
  indigo: 'bg-indigo-600/90 text-white border-indigo-400/50',
  emerald: 'bg-emerald-600/90 text-white border-emerald-400/50',
  sky: 'bg-sky-600/90 text-white border-sky-400/50',
  amber: 'bg-amber-500/95 text-slate-950 border-amber-300/60',
  slate: 'bg-slate-800/90 text-slate-100 border-slate-600/60',
};

interface SubtitlePreviewCaptionProps {
  text: string;
  subtitle: SubtitleConfig;
  aspectRatio?: VideoAspectRatio;
  replayNonce: number;
  countdownNumber?: number | null;
  countdownTotalSec?: number;
  pinnedSourceText?: string | null;
  rawLine?: string;
  scriptStyle?: ScriptStyle;
  isSecondarySlot?: boolean;
  isIntroOrOutro?: boolean;
  isLightBackground?: boolean;
  use2411CountdownStyle?: boolean;
  studio2411Theme?: Studio2411ThemeId;
}

function needsDarkContrastOnLightBg(hex: string): boolean {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 135;
}

function computeInlineTokenClasses(tokens: string[], enableHighlight: boolean): string[] {
  if (!enableHighlight) return tokens.map(() => '');
  const classes: string[] = new Array(tokens.length).fill('');
  let inQuote = false;
  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    if (raw === '\n') continue;
    const word = raw.trim();
    if (!word) continue;

    const hasOpen = /[「『"“]/.test(word);
    const hasClose = /[」』"”]/.test(word);
    const isCompleteQuote = /^[「『"“].*[」』"”]$/.test(word);

    if (isCompleteQuote) {
      classes[i] = 'mpt-caption-chip';
      continue;
    }
    if (hasOpen && !inQuote) {
      inQuote = true;
      classes[i] = 'mpt-caption-chip';
      if (hasClose && !/^[「『"“]$/.test(word)) {
        inQuote = false;
      }
      continue;
    }
    if (inQuote) {
      classes[i] = 'mpt-caption-chip';
      if (hasClose) {
        inQuote = false;
      }
      continue;
    }
    if (/\d/.test(word)) {
      classes[i] = 'mpt-caption-num';
    }
  }
  return classes;
}

export const SubtitlePreviewCaption: React.FC<SubtitlePreviewCaptionProps> = ({
  text,
  subtitle,
  aspectRatio = '9:16',
  replayNonce,
  countdownNumber = null,
  countdownTotalSec = 5,
  pinnedSourceText = null,
  rawLine,
  scriptStyle,
  isSecondarySlot = false,
  isIntroOrOutro = false,
  isLightBackground = false,
  use2411CountdownStyle = false,
  studio2411Theme,
}) => {
  const effect = subtitle.effect ?? 'karaoke';
  const showBadges = subtitle.showRoleBadges !== false;

  const presentation = useMemo(
    () =>
      analyzeScriptLinePresentation(rawLine || text, {
        isSecondarySlot,
        isIntroOrOutro,
        scriptStyle,
      }),
    [rawLine, text, isSecondarySlot, isIntroOrOutro, scriptStyle]
  );

  // Compute exact proportional wrapping matching the ASS subtitle renderer at 720p reference
  const { width, height } = getCanvasDimensions(aspectRatio, '720p');
  const textHasCjk = hasCjkChars(text) && !text.includes(' ');
  const budget = getSubtitleWrapBudget(subtitle, width, height, textHasCjk);
  const wrappedText = useMemo(
    () => wrapSubtitleLine(text, budget.maxCharsPerLine),
    [text, budget.maxCharsPerLine]
  );

  const tokens = useMemo(() => tokenizeSubtitleForEffect(wrappedText), [wrappedText]);
  const adaptLightContrast = isLightBackground && subtitle.boxStyle !== 'dark_box';
  const inlineTokenClasses = useMemo(
    () => computeInlineTokenClasses(tokens, showBadges && !adaptLightContrast && !textHasCjk),
    [tokens, showBadges, adaptLightContrast, textHasCjk]
  );
  const [progress, setProgress] = useState(0);
  const subtitleBoxRef = useRef<HTMLDivElement | null>(null);
  const [countdownTopPct, setCountdownTopPct] = useState<number>(53);

  useEffect(() => {
    setProgress(0);
    if (effect !== 'karaoke' && effect !== 'typewriter' && effect !== 'laser') {
      return;
    }

    const cycleMs = Math.max(1500, Math.min(3400, tokens.length * 220));
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = (now - start) % (cycleMs + 750);
      const ratio = Math.min(1, elapsed / cycleMs);
      setProgress(ratio);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [effect, tokens.length, wrappedText, replayNonce]);

  // Preview card CSS widths: 9:16 -> 245px, 1:1 -> 300px, 16:9 -> ~458px
  const previewScale =
    aspectRatio === '1:1' ? 300 / 720 : aspectRatio === '16:9' ? 450 / 1280 : 245 / 720;
  const previewFontPx = Math.max(11, Math.min(24, Math.round(budget.scaledFontSize * previewScale)));
  const countdownFontPx = Math.max(28, Math.min(54, Math.round(previewFontPx * 2.15)));

  const resolveFontCss = (sampleText: string): string => {
    if (subtitle.fontName === 'JetBrains Mono') {
      return 'var(--font-mono)';
    }
    if (
      hasCjkChars(sampleText) &&
      subtitle.fontName !== 'M PLUS 1p' &&
      subtitle.fontName !== 'BIZ UDPGothic'
    ) {
      return `'M PLUS 1p', 'BIZ UDPGothic', '${subtitle.fontName}', 'Noto Sans', sans-serif`;
    }
    return `'${subtitle.fontName}', 'M PLUS 1p', 'Noto Sans', sans-serif`;
  };

  const fontCss = resolveFontCss(text);
  const effectiveTextColor = adaptLightContrast
    ? needsDarkContrastOnLightBg(subtitle.textColor)
      ? '#0F172A'
      : subtitle.textColor
    : needsDarkContrastOnLightBg(subtitle.textColor)
    ? subtitle.textColor
    : '#FFFFFF';
  const effectiveHighlightColor = adaptLightContrast
    ? needsDarkContrastOnLightBg(subtitle.highlightColor || '#FACC15')
      ? '#4338CA'
      : subtitle.highlightColor || '#4338CA'
    : needsDarkContrastOnLightBg(subtitle.highlightColor || '#FACC15')
    ? subtitle.highlightColor || '#FACC15'
    : '#FACC15';
  const effectiveStrokeColor = adaptLightContrast
    ? '#FFFFFF'
    : needsDarkContrastOnLightBg(subtitle.strokeColor || '#000000')
    ? '#0F172A'
    : subtitle.strokeColor || '#000000';

  const baseStyle: React.CSSProperties = {
    fontFamily: fontCss,
    fontSize: `${previewFontPx}px`,
    letterSpacing: '0.015em',
    color: effectiveTextColor,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    paintOrder: 'stroke fill',
    WebkitTextStroke:
      subtitle.boxStyle === 'outline' && subtitle.strokeWidth > 0 && !adaptLightContrast
        ? `${Math.max(1.0, subtitle.strokeWidth * 0.62)}px ${effectiveStrokeColor}`
        : undefined,
    textShadow: adaptLightContrast ? '0 1px 0 rgba(255,255,255,0.75)' : '0 2px 5px rgba(0,0,0,0.92)',
  };

  const containerPosStyle: React.CSSProperties =
    subtitle.position === 'top'
      ? { top: aspectRatio === '16:9' ? '8%' : '11%' }
      : subtitle.position === 'center'
      ? { top: '50%', transform: 'translateY(-50%)' }
      : subtitle.position === 'custom'
      ? { top: `${subtitle.customPositionPct}%`, transform: 'translateY(-50%)' }
      : { bottom: aspectRatio === '16:9' ? '2.5%' : aspectRatio === '1:1' ? '4.5%' : '8%' };

  const activeWordCount = Math.max(1, Math.ceil(progress * Math.max(1, tokens.length)));
  const isTypingFinished = activeWordCount >= tokens.length;

  const animClass =
    effect === 'pop_zoom'
      ? 'animate-mpt-pop'
      : effect === 'fade_slide'
      ? 'animate-mpt-slide'
      : '';

  const sourceRawSize = Math.max(
    18,
    Math.min(58, Math.round(subtitle.sourceFontSize ?? subtitle.fontSize * 0.8))
  );
  const srcBudget = useMemo(() => {
    const srcCjk = Boolean(
      pinnedSourceText && hasCjkChars(pinnedSourceText) && !pinnedSourceText.includes(' ')
    );
    return getSubtitleWrapBudget(
      { ...subtitle, fontSize: sourceRawSize },
      width,
      height,
      srcCjk
    );
  }, [pinnedSourceText, subtitle, sourceRawSize, width, height]);

  const wrappedPinnedSource = useMemo(() => {
    if (!pinnedSourceText?.trim()) return '';
    return wrapSubtitleLine(pinnedSourceText.trim(), srcBudget.maxCharsPerLine);
  }, [pinnedSourceText, srcBudget.maxCharsPerLine]);

  const stickyFontPx = Math.max(
    10,
    Math.min(24, Math.round(srcBudget.scaledFontSize * previewScale))
  );
  const stickyFontCss = resolveFontCss(pinnedSourceText ?? '');
  const stickyStyle: React.CSSProperties = {
    fontFamily: stickyFontCss,
    fontSize: `${stickyFontPx}px`,
    letterSpacing: '0.015em',
    color: adaptLightContrast ? '#334155' : '#E2E8F0',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    paintOrder: 'stroke fill',
    WebkitTextStroke:
      subtitle.boxStyle === 'outline' && subtitle.strokeWidth > 0 && !adaptLightContrast
        ? `${Math.max(0.9, subtitle.strokeWidth * 0.56)}px ${effectiveStrokeColor}`
        : undefined,
    textShadow: adaptLightContrast ? '0 1px 0 rgba(255,255,255,0.65)' : '0 2px 5px rgba(0,0,0,0.92)',
  };

  const isCountdownActive = countdownNumber != null;

  useLayoutEffect(() => {
    const subEl = subtitleBoxRef.current;
    const stageEl = subEl?.offsetParent as HTMLElement | null;
    if (!subEl || !stageEl || stageEl.clientHeight <= 0) return;
    const stageH = stageEl.clientHeight;
    const subTop = subEl.offsetTop;
    const subBottom = subTop + subEl.offsetHeight;
    const cdEl = stageEl.querySelector('[data-testid="studio-preview-countdown"]') as HTMLElement | null;
    const measuredCdH = cdEl ? Math.round(cdEl.offsetHeight) : 0;
    const cdHeightPx =
      measuredCdH > 0
        ? measuredCdH
        : use2411CountdownStyle
        ? aspectRatio === '16:9'
          ? 42
          : aspectRatio === '1:1'
          ? 50
          : 68
        : Math.max(76, Math.round(countdownFontPx * 1.8));
    const bands = [{ topPx: subTop, bottomPx: subBottom }];
    const cardInnerEl = stageEl.querySelector('[data-testid="studio-2411-stage-card"] > div:last-child');
    if (cardInnerEl) {
      const sr = stageEl.getBoundingClientRect();
      const cr = cardInnerEl.getBoundingClientRect();
      bands.push({
        topPx: Math.max(0, Math.round(cr.top - sr.top)),
        bottomPx: Math.max(0, Math.round(cr.bottom - sr.top)),
      });
    } else if (use2411CountdownStyle) {
      bands.push({
        topPx: 0,
        bottomPx: Math.round(stageH * (aspectRatio === '16:9' ? 0.50 : 0.48)),
      });
    } else if (subTop > stageH * 0.56) {
      bands.push({ topPx: 0, bottomPx: Math.round(stageH * 0.37) });
    }
    const safeCenterY = resolveCountdownCenterY(
      bands,
      cdHeightPx,
      stageH
    );
    const nextPct = Math.max(18, Math.min(82, Number(((safeCenterY / stageH) * 100).toFixed(1))));
    setCountdownTopPct(nextPct);
  }, [
    isCountdownActive,
    wrappedText,
    pinnedSourceText,
    showBadges,
    subtitle.position,
    subtitle.customPositionPct,
    subtitle.fontSize,
    subtitle.sourceFontSize,
    subtitle.boxStyle,
    aspectRatio,
    countdownFontPx,
    use2411CountdownStyle,
  ]);

  const targetCaptionNode = (
    <p
      key={`${effect}_${wrappedText}_${replayNonce}`}
      className={`text-center font-bold leading-snug max-w-[94%] m-0 ${animClass} ${
        subtitle.boxStyle === 'dark_box' ? 'px-2.5 py-1 rounded bg-black/75' : ''
      }`}
      style={baseStyle}
    >
      {effect === 'karaoke' ? (
        tokens.map((tok, i) => {
          if (tok === '\n') return <br key={i} />;
          const isHighlighted = i < activeWordCount;
          const isCurrent = i === activeWordCount - 1;
          const spaceMatch = tok.match(/^(.*?)(\s+)$/);
          const wordPart = spaceMatch ? spaceMatch[1] : tok;
          const spacePart = spaceMatch ? spaceMatch[2] : '';
          const tokCls = inlineTokenClasses[i] ?? '';
          return (
            <React.Fragment key={i}>
              <span
                className={tokCls}
                style={{
                  color: isHighlighted ? effectiveHighlightColor : effectiveTextColor,
                  display: textHasCjk || tokCls === 'mpt-caption-chip' ? 'inline' : 'inline-block',
                  transform:
                    textHasCjk || tokCls === 'mpt-caption-chip'
                      ? undefined
                      : isCurrent
                      ? 'scale(1.03)'
                      : 'scale(1)',
                  transition: 'color 95ms linear, transform 95ms ease-out',
                }}
              >
                {wordPart}
              </span>
              {spacePart}
            </React.Fragment>
          );
        })
      ) : effect === 'laser' ? (
        tokens.map((tok, i) => {
          if (tok === '\n') return <br key={i} />;
          const isLit = i < activeWordCount;
          const isHead = i === activeWordCount - 1;
          const spaceMatch = tok.match(/^(.*?)(\s+)$/);
          const wordPart = spaceMatch ? spaceMatch[1] : tok;
          const spacePart = spaceMatch ? spaceMatch[2] : '';
          const hi = effectiveHighlightColor;
          return (
            <React.Fragment key={i}>
              <span
                className={inlineTokenClasses[i] ?? ''}
                style={{
                  opacity: isLit ? 1 : 0.08,
                  color: isHead ? (adaptLightContrast ? '#0D6EFD' : '#FFFFFF') : isLit ? hi : effectiveTextColor,
                  display: inlineTokenClasses[i] === 'mpt-caption-chip' ? 'inline' : 'inline-block',
                  transform:
                    inlineTokenClasses[i] === 'mpt-caption-chip'
                      ? undefined
                      : isHead
                      ? 'scale(1.07)'
                      : 'scale(1)',
                  textShadow: isHead
                    ? `0 0 10px ${hi}, 0 0 20px ${hi}, 0 2px 5px rgba(0,0,0,0.85)`
                    : isLit
                    ? `0 0 6px ${hi}66, 0 2px 5px rgba(0,0,0,0.72)`
                    : undefined,
                  transition:
                    'opacity 70ms linear, color 140ms ease-out, transform 120ms ease-out, text-shadow 140ms ease-out',
                }}
              >
                {wordPart}
              </span>
              {spacePart}
            </React.Fragment>
          );
        })
      ) : effect === 'typewriter' ? (
        <>
          {tokens.map((tok, i) => {
            if (tok === '\n') return <br key={i} />;
            const visible = i < activeWordCount;
            const isLastVisible = i === activeWordCount - 1;
            const spaceMatch = tok.match(/^(.*?)(\s+)$/);
            const wordPart = spaceMatch ? spaceMatch[1] : tok;
            const spacePart = spaceMatch ? spaceMatch[2] : '';
            return (
              <React.Fragment key={i}>
                <span
                  className={inlineTokenClasses[i] ?? ''}
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: 'opacity 60ms ease-in',
                  }}
                >
                  {wordPart}
                </span>
                {spacePart}
                {isLastVisible && !isTypingFinished && (
                  <span
                    aria-hidden="true"
                    className="animate-mpt-caret inline-block ml-0.5 font-normal"
                    style={{ color: effectiveHighlightColor }}
                  >
                    |
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </>
      ) : (
        wrappedText.split('\n').map((line, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {line}
          </React.Fragment>
        ))
      )}
    </p>
  );

  const pinnedSourceNode = wrappedPinnedSource ? (
    <div className={`flex flex-col items-center max-w-[94%] ${aspectRatio === '16:9' ? 'gap-0' : 'gap-0.5'}`}>
      {showBadges && (
        <span
          className={`${aspectRatio === '16:9' ? 'text-[8px] leading-none' : 'text-[9px]'} font-semibold tracking-wider uppercase ${
            adaptLightContrast ? 'text-indigo-700' : 'text-sky-300'
          }`}
        >
          Prompt
        </span>
      )}
      <p
        data-testid="studio-preview-sticky-source"
        className={`text-center font-medium leading-snug m-0 ${
          subtitle.boxStyle === 'dark_box' ? 'px-2 py-0.5 rounded bg-black/70' : ''
        }`}
        style={stickyStyle}
      >
        {wrappedPinnedSource.split('\n').map((line, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </p>
    </div>
  ) : null;

  const totalCdSteps = Math.max(1, Math.round(countdownTotalSec || 5));
  const countdownPct =
    countdownNumber != null
      ? Math.max(8, Math.min(100, Math.round((countdownNumber / totalCdSteps) * 100)))
      : 0;

  return (
    <>
      {countdownNumber != null && (
        <div
          data-testid="studio-preview-countdown"
          className="absolute left-0 right-0 flex flex-col items-center pointer-events-none z-20"
          style={{
            top: `${countdownTopPct}%`,
            transform: 'translateY(-50%)',
          }}
        >
          {use2411CountdownStyle ? (
            <Studio2411CountdownCard
              countdownNumber={countdownNumber}
              countdownTotalSec={totalCdSteps}
              themeId={studio2411Theme}
              accentColor={effectiveHighlightColor}
              aspectRatio={aspectRatio}
              fontName={subtitle.fontName}
            />
          ) : (
            <div
              className="rounded-xl border border-amber-400/45 shadow-xl px-4 py-2.5 flex flex-col items-center gap-1.5"
              style={{
                minWidth: '126px',
                backgroundColor: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-amber-300">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>THINK TIME</span>
              </span>

              <span
                key={countdownNumber}
                className="animate-mpt-countdown font-extrabold leading-none tabular-nums select-none"
                style={{
                  fontFamily: fontCss,
                  fontSize: `${countdownFontPx}px`,
                  color: subtitle.highlightColor || '#FACC15',
                  paintOrder: 'stroke fill',
                  WebkitTextStroke: '2.5px #000000',
                  textShadow: '0 4px 14px rgba(0,0,0,0.85)',
                }}
              >
                {countdownNumber}
              </span>

              <div
                className="w-full h-1.5 rounded-full bg-slate-700/80 overflow-hidden"
                role="progressbar"
                aria-label="Think countdown"
                aria-valuenow={countdownNumber}
                aria-valuemin={0}
                aria-valuemax={totalCdSteps}
              >
                <div
                  className="h-full rounded-full bg-amber-400 transition-[width] duration-300 ease-out"
                  style={{ width: `${countdownPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={subtitleBoxRef}
        data-testid="studio-preview-subtitle"
        data-effect={effect}
        className={`absolute left-3 right-3 flex flex-col items-center pointer-events-none z-10 ${
          aspectRatio === '16:9' ? 'gap-0.5' : 'gap-1'
        }`}
        style={containerPosStyle}
      >
        {showBadges && (
          <div
            data-testid="preview-role-badge"
            className={`inline-flex items-center gap-1 rounded-md border font-semibold tracking-tight shadow-sm ${
              aspectRatio === '16:9' ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]'
            } ${ROLE_TONE_CLASSES[presentation.roleTone]}`}
          >
            <PresentationIcon iconKey={presentation.roleIconKey} className="w-3 h-3 shrink-0" />
            <span>{presentation.roleLabel}</span>
            <span className="opacity-60">·</span>
            <PresentationIcon iconKey={presentation.contextIconKey} className="w-3 h-3 shrink-0" />
            <span data-testid="preview-context-badge">{presentation.contextLabel}</span>
          </div>
        )}
        {targetCaptionNode}
        {pinnedSourceNode}
      </div>
    </>
  );
};
