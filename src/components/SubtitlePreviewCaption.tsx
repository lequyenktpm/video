import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SubtitleConfig, VideoAspectRatio } from '../shared/types';
import {
  getCanvasDimensions,
  getSubtitleWrapBudget,
  hasCjkChars,
  resolveCountdownCenterY,
  tokenizeSubtitleForEffect,
  wrapSubtitleLine,
} from '../shared/mptEngine';

interface SubtitlePreviewCaptionProps {
  text: string;
  subtitle: SubtitleConfig;
  aspectRatio?: VideoAspectRatio;
  replayNonce: number;
  countdownNumber?: number | null;
  pinnedSourceText?: string | null;
}

export const SubtitlePreviewCaption: React.FC<SubtitlePreviewCaptionProps> = ({
  text,
  subtitle,
  aspectRatio = '9:16',
  replayNonce,
  countdownNumber = null,
  pinnedSourceText = null,
}) => {
  const effect = subtitle.effect ?? 'karaoke';

  // Compute exact proportional wrapping matching the ASS subtitle renderer at 720p reference
  const { width, height } = getCanvasDimensions(aspectRatio, '720p');
  const textHasCjk = hasCjkChars(text) && !text.includes(' ');
  const budget = getSubtitleWrapBudget(subtitle, width, height, textHasCjk);
  const wrappedText = useMemo(
    () => wrapSubtitleLine(text, budget.maxCharsPerLine),
    [text, budget.maxCharsPerLine]
  );

  const tokens = useMemo(() => tokenizeSubtitleForEffect(wrappedText), [wrappedText]);
  const [progress, setProgress] = useState(0);
  const subtitleBoxRef = useRef<HTMLDivElement | null>(null);
  const [countdownTopPct, setCountdownTopPct] = useState<number>(44);

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

  // Preview card CSS widths: 9:16 -> 245px (scale 245/720=0.34), 1:1 -> 300px (300/720=0.416), 16:9 -> ~430px (430/1280=0.336)
  const previewScale =
    aspectRatio === '1:1' ? 300 / 720 : aspectRatio === '16:9' ? 430 / 1280 : 245 / 720;
  const previewFontPx = Math.max(11, Math.min(24, Math.round(budget.scaledFontSize * previewScale)));
  const countdownFontPx = Math.max(38, Math.min(68, Math.round(previewFontPx * 2.55)));

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

  const baseStyle: React.CSSProperties = {
    fontFamily: fontCss,
    fontSize: `${previewFontPx}px`,
    letterSpacing: '0.015em',
    color: subtitle.textColor,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    paintOrder: 'stroke fill',
    WebkitTextStroke:
      subtitle.boxStyle === 'outline' && subtitle.strokeWidth > 0
        ? `${Math.max(1.0, subtitle.strokeWidth * 0.62)}px ${subtitle.strokeColor}`
        : undefined,
    textShadow: '0 2px 5px rgba(0,0,0,0.92)',
  };

  const containerPosStyle: React.CSSProperties =
    subtitle.position === 'top'
      ? { top: '9%' }
      : subtitle.position === 'center'
      ? { top: '50%', transform: 'translateY(-50%)' }
      : subtitle.position === 'custom'
      ? { top: `${subtitle.customPositionPct}%`, transform: 'translateY(-50%)' }
      : { bottom: '13.5%' };

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
    color: '#E2E8F0',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    paintOrder: 'stroke fill',
    WebkitTextStroke:
      subtitle.boxStyle === 'outline' && subtitle.strokeWidth > 0
        ? `${Math.max(0.9, subtitle.strokeWidth * 0.56)}px ${subtitle.strokeColor}`
        : undefined,
    textShadow: '0 2px 5px rgba(0,0,0,0.92)',
  };

  const isTopPos = subtitle.position === 'top';

  useLayoutEffect(() => {
    const subEl = subtitleBoxRef.current;
    const stageEl = subEl?.offsetParent as HTMLElement | null;
    if (!subEl || !stageEl || stageEl.clientHeight <= 0) return;
    const stageH = stageEl.clientHeight;
    const subTop = subEl.offsetTop;
    const subBottom = subTop + subEl.offsetHeight;
    const cdHeightPx = Math.max(44, Math.round(countdownFontPx * 1.15));
    const safeCenterY = resolveCountdownCenterY(
      [{ topPx: subTop, bottomPx: subBottom }],
      cdHeightPx,
      stageH
    );
    const nextPct = Math.max(16, Math.min(82, Number(((safeCenterY / stageH) * 100).toFixed(1))));
    setCountdownTopPct(nextPct);
  }, [
    countdownNumber,
    wrappedText,
    pinnedSourceText,
    subtitle.position,
    subtitle.customPositionPct,
    subtitle.fontSize,
    subtitle.sourceFontSize,
    subtitle.boxStyle,
    aspectRatio,
    countdownFontPx,
  ]);

  const targetCaptionNode = (
    <p
      key={`${effect}_${wrappedText}_${replayNonce}`}
      className={`text-center font-bold leading-snug max-w-[92%] ${animClass} ${
        subtitle.boxStyle === 'dark_box' ? 'px-2.5 py-1 rounded bg-black/70' : ''
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
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  color: isHighlighted ? subtitle.highlightColor || '#FACC15' : subtitle.textColor,
                  display: 'inline-block',
                  transform: isCurrent ? 'scale(1.03)' : 'scale(1)',
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
          const hi = subtitle.highlightColor || '#FACC15';
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  opacity: isLit ? 1 : 0.08,
                  color: isHead ? '#FFFFFF' : isLit ? hi : subtitle.textColor,
                  display: 'inline-block',
                  transform: isHead ? 'scale(1.07)' : 'scale(1)',
                  textShadow: isHead
                    ? `0 0 10px ${hi}, 0 0 20px ${hi}, 0 2px 5px rgba(0,0,0,0.95)`
                    : isLit
                    ? `0 0 6px ${hi}66, 0 2px 5px rgba(0,0,0,0.92)`
                    : '0 2px 5px rgba(0,0,0,0.92)',
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
                    style={{ color: subtitle.highlightColor || '#FACC15' }}
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
    <p
      data-testid="studio-preview-sticky-source"
      className={`text-center font-medium leading-snug max-w-[92%] ${
        subtitle.boxStyle === 'dark_box' ? 'px-2 py-0.5 rounded bg-black/65' : ''
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
  ) : null;

  return (
    <>
      {countdownNumber != null && (
        <div
          data-testid="studio-preview-countdown"
          className="absolute left-0 right-0 flex flex-col items-center pointer-events-none z-20 transition-[top] duration-150 ease-out"
          style={{
            top: `${countdownTopPct}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <span
            key={countdownNumber}
            className="animate-mpt-countdown font-extrabold leading-none tabular-nums select-none"
            style={{
              fontFamily: fontCss,
              fontSize: `${countdownFontPx}px`,
              color: subtitle.highlightColor || '#FACC15',
              paintOrder: 'stroke fill',
              WebkitTextStroke: '3px #000000',
              textShadow: '0 4px 16px rgba(0,0,0,0.9)',
            }}
          >
            {countdownNumber}
          </span>
        </div>
      )}

      <div
        ref={subtitleBoxRef}
        data-testid="studio-preview-subtitle"
        data-effect={effect}
        className={`absolute left-3 right-3 flex flex-col items-center pointer-events-none z-10 ${
          isTopPos ? 'gap-1.5' : 'gap-1.5'
        }`}
        style={containerPosStyle}
      >
        {targetCaptionNode}
        {pinnedSourceNode}
      </div>
    </>
  );
};
