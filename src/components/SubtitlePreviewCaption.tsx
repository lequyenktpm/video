import React, { useEffect, useMemo, useState } from 'react';
import { SubtitleConfig, VideoAspectRatio } from '../shared/types';
import {
  getCanvasDimensions,
  getSubtitleWrapBudget,
  hasCjkChars,
  tokenizeSubtitleForEffect,
  wrapSubtitleLine,
} from '../shared/mptEngine';

interface SubtitlePreviewCaptionProps {
  text: string;
  subtitle: SubtitleConfig;
  aspectRatio?: VideoAspectRatio;
  replayNonce: number;
  countdownNumber?: number | null;
}

export const SubtitlePreviewCaption: React.FC<SubtitlePreviewCaptionProps> = ({
  text,
  subtitle,
  aspectRatio = '9:16',
  replayNonce,
  countdownNumber = null,
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

  useEffect(() => {
    setProgress(0);
    if (effect !== 'karaoke' && effect !== 'typewriter') {
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

  const fontCss =
    subtitle.fontName === 'JetBrains Mono'
      ? 'var(--font-mono)'
      : `'${subtitle.fontName}', 'Noto Sans', sans-serif`;

  const baseStyle: React.CSSProperties = {
    fontFamily: fontCss,
    fontSize: `${previewFontPx}px`,
    color: subtitle.textColor,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    paintOrder: 'stroke fill',
    WebkitTextStroke:
      subtitle.boxStyle === 'outline' && subtitle.strokeWidth > 0
        ? `${Math.max(1.2, subtitle.strokeWidth * 0.78)}px ${subtitle.strokeColor}`
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

  return (
    <>
      {countdownNumber != null && (
        <div
          data-testid="studio-preview-countdown"
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
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
        data-testid="studio-preview-subtitle"
        data-effect={effect}
        className="absolute left-3 right-3 flex justify-center pointer-events-none z-10"
        style={containerPosStyle}
      >
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
              return (
                <span
                  key={i}
                  style={{
                    color: isHighlighted ? subtitle.highlightColor || '#FACC15' : subtitle.textColor,
                    display: 'inline-block',
                    whiteSpace: 'pre-wrap',
                    transform: isCurrent ? 'scale(1.07)' : 'scale(1)',
                    transition: 'color 95ms linear, transform 95ms ease-out',
                  }}
                >
                  {tok}
                </span>
              );
            })
          ) : effect === 'typewriter' ? (
            <>
              {tokens.map((tok, i) => {
                if (tok === '\n') return <br key={i} />;
                const visible = i < activeWordCount;
                const isLastVisible = i === activeWordCount - 1;
                return (
                  <React.Fragment key={i}>
                    <span
                      style={{
                        opacity: visible ? 1 : 0,
                        whiteSpace: 'pre-wrap',
                        transition: 'opacity 60ms ease-in',
                      }}
                    >
                      {tok}
                    </span>
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
      </div>
    </>
  );
};
