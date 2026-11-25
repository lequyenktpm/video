import React, { useEffect, useState } from 'react';
import { AnimeSceneStyle, VideoAspectRatio } from '../shared/types';
import {
  AnimeCharacterProfile,
  AnimeStoryboardBeat,
  ComputedCharRig,
  computeAnimeRigStates,
  getAnimeThemePalette,
  ParsedAnimeStory,
  wrapAnimeBubbleLines,
} from '../shared/animeStoryEngine';

interface AnimeStoryStageProps {
  story: ParsedAnimeStory;
  beatIndex: number;
  aspectRatio: VideoAspectRatio;
  sceneStyle: AnimeSceneStyle;
  fontName?: string;
  isPlaying: boolean;
}

function approxBubbleTextUnits(text: string): number {
  let u = 0;
  for (const ch of Array.from(text)) {
    if (/[\u3000-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/.test(ch)) u += 1.02;
    else if (/[A-Z0-9@#%&MW]/.test(ch)) u += 0.72;
    else if (/[iljtfrI1!.,:;'"|()（）「」]/.test(ch)) u += 0.36;
    else u += 0.56;
  }
  return u;
}

const AnimeCharacterSvg: React.FC<{
  rig: ComputedCharRig;
  timeSec: number;
  fontCss: string;
}> = ({ rig, timeSec, fontCss }) => {
  const {
    profile,
    x,
    y,
    scale,
    facing,
    bodyTiltDeg,
    headTiltDeg,
    blinkAmt,
    mouthPhase,
    isSpeaking,
    emotion,
    fx,
    opacity,
    lookOffsetX,
  } = rig;
  const {
    hairStyle,
    hairHex,
    hairShadeHex,
    outfitHex,
    outfitAccentHex,
    skinHex,
    nameBadgeHex,
    displayName,
  } = profile;

  const eyeScaleY = Math.max(0.08, 1 - blinkAmt);
  const mh = isSpeaking && mouthPhase > 0.14 ? 3.5 + mouthPhase * 9.5 : 0;
  const mw = isSpeaking && mouthPhase > 0.14 ? 5.5 + (1 - mouthPhase * 0.3) * 5.0 : 0;

  return (
    <g
      data-testid={`anime-char-${profile.id}`}
      transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${scale.toFixed(3)})`}
      opacity={opacity}
    >
      <ellipse cx="0" cy="12" rx="44" ry="10" fill="#0F172A" fillOpacity="0.16" />

      <g transform={`rotate(${bodyTiltDeg.toFixed(2)} 0 -20)`}>
        {/* Back Articulated Arm */}
        <g transform={`translate(-34,-68) rotate(${rig.leftArmAngle.toFixed(1)})`}>
          <rect
            x="-8"
            y="0"
            width="16"
            height="40"
            rx="8"
            fill={outfitHex}
            stroke="#1E1B18"
            strokeWidth="2.4"
          />
          <g transform={`translate(0,36) rotate(${rig.leftForearmAngle.toFixed(1)})`}>
            <rect
              x="-7"
              y="0"
              width="14"
              height="34"
              rx="7"
              fill={outfitHex}
              stroke="#1E1B18"
              strokeWidth="2.4"
            />
            <circle cx="0" cy="36" r="8" fill={skinHex} stroke="#1E1B18" strokeWidth="2.2" />
          </g>
        </g>

        {/* Torso */}
        <path
          d="M-38 -74 C-40 -86 -24 -90 0 -90 C24 -90 40 -86 38 -74 L44 6 C44 12 36 16 28 16 L-28 16 C-36 16 -44 12 -44 6 Z"
          fill={outfitHex}
          stroke="#1E1B18"
          strokeWidth="2.8"
        />
        <path
          d="M-14 -88 L0 -62 L14 -88 Z"
          fill={outfitAccentHex}
          stroke="#1E1B18"
          strokeWidth="2"
        />
        <line
          x1="0"
          y1="-62"
          x2="0"
          y2="12"
          stroke={outfitAccentHex}
          strokeOpacity="0.65"
          strokeWidth="2"
        />

        {/* Neck & Head */}
        <g transform={`translate(0,-84) rotate(${headTiltDeg.toFixed(2)})`}>
          <rect
            x="-10"
            y="-12"
            width="20"
            height="22"
            rx="8"
            fill={skinHex}
            stroke="#1E1B18"
            strokeWidth="2.4"
          />
          <g transform="translate(0,84)">
            {hairStyle === 'bob' && (
              <path
                d="M-46 -136 C-56 -110 -56 -72 -44 -56 L44 -56 C56 -72 56 -110 46 -136 Z"
                fill={hairShadeHex}
                stroke="#1E1B18"
                strokeWidth="2.6"
              />
            )}

            <circle cx="-41" cy="-124" r="8" fill={skinHex} stroke="#1E1B18" strokeWidth="2.2" />
            <circle cx="41" cy="-124" r="8" fill={skinHex} stroke="#1E1B18" strokeWidth="2.2" />

            <path
              d="M-40 -142 C-42 -106 -22 -84 0 -84 C22 -84 42 -106 40 -142 C38 -174 22 -188 0 -188 C-22 -188 -38 -174 -40 -142 Z"
              fill={skinHex}
              stroke="#1E1B18"
              strokeWidth="2.6"
            />
            <ellipse cx="-24" cy="-108" rx="7" ry="3.5" fill="#FDA4AF" fillOpacity="0.45" />
            <ellipse cx="24" cy="-108" rx="7" ry="3.5" fill="#FDA4AF" fillOpacity="0.45" />

            {/* Eyes */}
            {emotion === 'apologetic' && rig.action === 'bow_deep' ? (
              <>
                <path
                  d="M-24 -128 L-10 -122 L-24 -116"
                  fill="none"
                  stroke="#1E1B18"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M24 -128 L10 -122 L24 -116"
                  fill="none"
                  stroke="#1E1B18"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : emotion === 'happy' || emotion === 'wry_smile' ? (
              <>
                <path
                  d="M-26 -120 Q-17 -131 -8 -120"
                  fill="none"
                  stroke="#1E1B18"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 -120 Q17 -131 26 -120"
                  fill="none"
                  stroke="#1E1B18"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <g transform={`translate(-17,-122) scale(1,${eyeScaleY.toFixed(2)})`}>
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="9"
                    ry="10.5"
                    fill="#FFFFFF"
                    stroke="#1E1B18"
                    strokeWidth="2.2"
                  />
                  <circle
                    cx={lookOffsetX}
                    cy="1"
                    r={emotion === 'shocked' ? 5.2 : 7.6}
                    fill="#1E293B"
                  />
                  <circle cx={lookOffsetX - 2.4} cy="-2.8" r="2.6" fill="#FFFFFF" />
                </g>
                <g transform={`translate(17,-122) scale(1,${eyeScaleY.toFixed(2)})`}>
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="9"
                    ry="10.5"
                    fill="#FFFFFF"
                    stroke="#1E1B18"
                    strokeWidth="2.2"
                  />
                  <circle
                    cx={lookOffsetX}
                    cy="1"
                    r={emotion === 'shocked' ? 5.2 : 7.6}
                    fill="#1E293B"
                  />
                  <circle cx={lookOffsetX - 2.4} cy="-2.8" r="2.6" fill="#FFFFFF" />
                </g>
              </>
            )}

            {/* Eyebrows */}
            {emotion === 'angry' ? (
              <>
                <path d="M-29 -141 L-7 -132" stroke="#1E1B18" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M29 -141 L7 -132" stroke="#1E1B18" strokeWidth="3.5" strokeLinecap="round" />
              </>
            ) : emotion === 'apologetic' || emotion === 'wry_smile' ? (
              <>
                <path d="M-28 -134 L-8 -141" stroke="#1E1B18" strokeWidth="3" strokeLinecap="round" />
                <path d="M28 -134 L8 -141" stroke="#1E1B18" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : emotion === 'shocked' ? (
              <>
                <path d="M-27 -144 Q-17 -151 -7 -144" fill="none" stroke="#1E1B18" strokeWidth="3" strokeLinecap="round" />
                <path d="M7 -144 Q17 -151 27 -144" fill="none" stroke="#1E1B18" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M-27 -139 Q-17 -143 -8 -139" fill="none" stroke="#1E1B18" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M8 -139 Q17 -143 27 -139" fill="none" stroke="#1E1B18" strokeWidth="2.8" strokeLinecap="round" />
              </>
            )}

            {/* Nose */}
            <path
              d={`M0 -114 L${2 * facing} -107`}
              stroke="#C28E70"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Mouth */}
            {isSpeaking && mouthPhase > 0.14 ? (
              <>
                <ellipse
                  cx="0"
                  cy="-96"
                  rx={mw}
                  ry={mh}
                  fill="#9F1239"
                  stroke="#1E1B18"
                  strokeWidth="2.2"
                />
                <ellipse
                  cx="0"
                  cy={-96 + mh * 0.45}
                  rx={mw * 0.65}
                  ry={mh * 0.35}
                  fill="#FB7185"
                />
              </>
            ) : emotion === 'happy' ? (
              <path d="M-10 -99 Q0 -89 10 -99" fill="none" stroke="#1E1B18" strokeWidth="2.8" strokeLinecap="round" />
            ) : emotion === 'angry' ? (
              <path d="M-10 -94 Q0 -101 10 -94" fill="none" stroke="#1E1B18" strokeWidth="2.8" strokeLinecap="round" />
            ) : emotion === 'shocked' ? (
              <ellipse cx="0" cy="-95" rx="6" ry="8" fill="#9F1239" stroke="#1E1B18" strokeWidth="2.2" />
            ) : emotion === 'wry_smile' ? (
              <path d="M-9 -97 Q-2 -91 9 -98" fill="none" stroke="#1E1B18" strokeWidth="2.6" strokeLinecap="round" />
            ) : (
              <path d="M-7 -96 Q0 -93 7 -96" fill="none" stroke="#1E1B18" strokeWidth="2.6" strokeLinecap="round" />
            )}

            {/* Front Hair */}
            {hairStyle === 'spiky' ? (
              <>
                <path
                  d="M-44 -146 C-44 -186 -14 -202 8 -196 C32 -196 48 -176 46 -144 C42 -154 32 -162 24 -152 C14 -165 0 -150 -8 -164 C-18 -148 -32 -158 -44 -146 Z"
                  fill={hairHex}
                  stroke="#1E1B18"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M-36 -184 L-48 -200 L-22 -190 L-8 -208 L6 -190 L28 -204 L26 -182"
                  fill={hairHex}
                  stroke="#1E1B18"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              </>
            ) : hairStyle === 'bob' ? (
              <>
                <path
                  d="M-47 -142 C-48 -188 -16 -202 0 -202 C18 -202 48 -188 47 -142 C36 -156 22 -160 12 -148 C2 -160 -12 -160 -22 -148 C-32 -156 -40 -154 -47 -142 Z"
                  fill={hairHex}
                  stroke="#1E1B18"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                />
                <rect
                  x="26"
                  y="-158"
                  width="12"
                  height="5"
                  rx="2.5"
                  transform="rotate(-18 32 -156)"
                  fill="#F43F5E"
                />
              </>
            ) : (
              <path
                d="M-45 -144 C-46 -186 -16 -202 4 -200 C28 -198 48 -180 45 -144 C34 -156 22 -146 12 -160 C2 -144 -10 -158 -22 -146 C-32 -158 -40 -152 -45 -144 Z"
                fill={hairHex}
                stroke="#1E1B18"
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
            )}

            {/* Emotion Comic FX */}
            {fx === 'anger_cross' && (
              <g transform={`translate(36,-164) scale(${(1 + Math.sin(timeSec * 12) * 0.16).toFixed(2)})`}>
                <path
                  d="M-9 -3 Q-3 -3 -3 -9 M3 -9 Q3 -3 9 -3 M9 3 Q3 3 3 9 M-3 9 Q-3 3 -9 3"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
              </g>
            )}
            {fx === 'sweat' && (
              <g transform={`translate(-38,${(-146 + ((timeSec * 18) % 10)).toFixed(1)})`}>
                <path
                  d="M0 -10 C5 -2 7 3 7 6 A7 7 0 1 1 -7 6 C-7 3 -5 -2 0 -10 Z"
                  fill="#38BDF8"
                  stroke="#0284C7"
                  strokeWidth="2"
                />
              </g>
            )}
            {fx === 'shock_burst' && (
              <g transform={`translate(${38 * facing},-168) scale(${(1 + Math.sin(timeSec * 15) * 0.14).toFixed(2)})`}>
                <line x1="-4" y1="-16" x2="-4" y2="2" stroke="#EF4444" strokeWidth="4.5" strokeLinecap="round" />
                <circle cx="-4" cy="10" r="2.8" fill="#EF4444" />
                <line x1="8" y1="-13" x2="12" y2="3" stroke="#F59E0B" strokeWidth="3.6" strokeLinecap="round" />
              </g>
            )}
            {fx === 'whisper_wave' && (
              <g transform={`translate(${(34 * facing).toFixed(1)},${(-102 + Math.sin(timeSec * 8) * 3).toFixed(1)})`}>
                <path d={`M0 -8 Q${10 * facing} 0 0 8`} fill="none" stroke="#0D9488" strokeWidth="2.6" strokeLinecap="round" />
                <path
                  d={`M${7 * facing} -12 Q${19 * facing} 0 ${7 * facing} 12`}
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeOpacity="0.7"
                />
              </g>
            )}
            {fx === 'sparkle' && (
              <g transform={`translate(36,-162) scale(${(0.85 + 0.25 * Math.sin(timeSec * 7)).toFixed(2)})`}>
                <path
                  d="M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3 Z"
                  fill="#FBBF24"
                  stroke="#D97706"
                  strokeWidth="1.6"
                />
              </g>
            )}
          </g>
        </g>

        {/* Front Articulated Arm */}
        <g transform={`translate(34,-68) rotate(${rig.rightArmAngle.toFixed(1)})`}>
          <rect
            x="-8"
            y="0"
            width="16"
            height="40"
            rx="8"
            fill={outfitHex}
            stroke="#1E1B18"
            strokeWidth="2.4"
          />
          <g transform={`translate(0,36) rotate(${rig.rightForearmAngle.toFixed(1)})`}>
            <rect
              x="-7"
              y="0"
              width="14"
              height="34"
              rx="7"
              fill={outfitHex}
              stroke="#1E1B18"
              strokeWidth="2.4"
            />
            <circle cx="0" cy="36" r="8" fill={skinHex} stroke="#1E1B18" strokeWidth="2.2" />
          </g>
        </g>
      </g>

      {/* Character Name Tag */}
      <g transform="translate(0,30)">
        <rect x="-34" y="-12" width="68" height="22" rx="11" fill={nameBadgeHex} stroke="#FFFFFF" strokeWidth="1.8" />
        <text
          x="0"
          y="3"
          textAnchor="middle"
          fontFamily={fontCss}
          fontSize="12"
          fontWeight="800"
          fill="#FFFFFF"
        >
          {displayName}
        </text>
      </g>
    </g>
  );
};

export const AnimeStoryStage: React.FC<AnimeStoryStageProps> = ({
  story,
  beatIndex,
  aspectRatio,
  sceneStyle,
  fontName = 'M PLUS 1p',
  isPlaying,
}) => {
  const [animState, setAnimState] = useState<{ timeSec: number; beatElapsed: number }>({
    timeSec: 0,
    beatElapsed: 0,
  });

  const beats = story.beats;
  const safeBeatIdx = beats.length > 0 ? Math.min(Math.max(0, beatIndex), beats.length - 1) : 0;
  const beat: AnimeStoryboardBeat = beats[safeBeatIdx] ?? {
    index: 0,
    isStageCue: false,
    roomKind: 'room_living',
    speakerId: story.characters[0]?.id ?? '先輩',
    speakerName: story.characters[0]?.displayName ?? '先輩',
    rawText: '...',
    spokenText: '...',
    emotion: 'calm',
    action: 'gesture_talk',
    fx: 'none',
    presentCharacterIds: story.characters.map((c: AnimeCharacterProfile) => c.id),
    doorOpen: false,
    estDurationSec: 2.5,
  };

  useEffect(() => {
    setAnimState((prev) => ({ timeSec: prev.timeSec, beatElapsed: 0 }));
    let rafId = 0;
    let lastTs = performance.now();
    let lastPaint = lastTs;

    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - lastTs) / 1000);
      lastTs = now;
      if (now - lastPaint >= 33) {
        lastPaint = now;
        setAnimState((prev) => ({
          timeSec: prev.timeSec + dt * 2,
          beatElapsed: prev.beatElapsed + dt * 2,
        }));
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [safeBeatIdx, beat.rawText]);

  const width = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 720 : 720;
  const beatDur = Math.max(1.4, beat.estDurationSec);
  const beatProgress = Math.min(1, animState.beatElapsed / beatDur);

  const fontCss =
    fontName === 'BIZ UDPGothic'
      ? "'BIZ UDPGothic', 'M PLUS 1p', 'Noto Sans', sans-serif"
      : "'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif";

  const pal = getAnimeThemePalette(sceneStyle);
  const rigs = computeAnimeRigStates({
    story,
    beat,
    timeSec: animState.timeSec,
    beatProgress,
    width,
    height,
    isPlayingSpeech: !beat.isStageCue && (isPlaying || beatProgress < 0.85),
  });

  const focusRig = rigs.find((r) => r.isActiveFocus) ?? rigs[0];
  const camScale = beat.isStageCue
    ? 1.0
    : beat.emotion === 'angry' || beat.emotion === 'shocked'
    ? 1.045
    : 1.022;
  const focusDx = focusRig ? (width * 0.5 - focusRig.x) * 0.08 : 0;
  const focusDy = (height * 0.5 - height * 0.52) * 0.03;
  const sortedRigs = [...rigs].sort((a, b) => (a.isActiveFocus ? 1 : 0) - (b.isActiveFocus ? 1 : 0));

  const horizonY = Math.round(height * (height > width ? 0.61 : 0.65));
  const floorH = height - horizonY;
  const doorSlidePx = beat.doorOpen ? Math.round(Math.min(1, beatProgress * 2.2) * (width * 0.14)) : 0;
  const doorW = Math.round(width * 0.2);
  const doorH = Math.round(horizonY * 0.68);
  const doorX = Math.round(width * 0.77);
  const doorY = horizonY - doorH;
  const winX = Math.round(width * 0.07);
  const winY = Math.round(horizonY * 0.22);
  const winW = Math.round(width * 0.29);
  const winH = Math.round(horizonY * 0.44);
  const beamOpacity = 0.2 + Math.sin(animState.timeSec * 0.8) * 0.03;

  const isPortrait = height > width;
  const tableW = Math.round(width * (isPortrait ? 0.56 : 0.36));
  const tableH = Math.round(height * 0.055);
  const tableX = Math.round((width - tableW) / 2);
  const tableY = Math.round(height * (isPortrait ? 0.72 : 0.765));

  // Top Banner
  const headerFs = Math.max(15, Math.round(Math.min(width, height) * 0.026));
  const topBannerText = beat.isStageCue ? beat.sceneTitle || beat.rawText : story.title;
  const topBannerW = Math.min(
    Math.round(width * 0.88),
    Math.max(180, Math.round(approxBubbleTextUnits(topBannerText) * headerFs * 1.05 + 36))
  );
  const topBannerX = Math.round((width - topBannerW) / 2);
  const topBannerY = Math.round(height * 0.04);

  // Compact text-hugging speech bubble
  let bubbleGeom: {
    bubbleX: number;
    bubbleY: number;
    bubbleW: number;
    bubbleH: number;
    padX: number;
    padY: number;
    fontSize: number;
    lineHeight: number;
    noteExtraH: number;
    lines: string[];
    tailBaseL: number;
    tailBaseR: number;
    tailTipX: number;
    tailY: number;
    bgColor: string;
    borderColor: string;
  } | null = null;

  if (!beat.isStageCue && focusRig) {
    const text = beat.spokenText || beat.rawText;
    const fontSize = isPortrait ? Math.round(width * 0.036) : Math.round(height * 0.034);
    const maxUnits = isPortrait ? 17 : 26;
    const lines = wrapAnimeBubbleLines(text, maxUnits);
    const longestUnits = Math.max(4, ...lines.map((l) => approxBubbleTextUnits(l)));
    const lineHeight = Math.round(fontSize * 1.32);
    const padX = Math.round(fontSize * 0.95);
    const padY = Math.round(fontSize * 0.65);
    const estTextW = Math.round(longestUnits * fontSize * 0.96);
    const maxBubbleW = Math.round(width * (isPortrait ? 0.82 : 0.62));
    const bubbleW = Math.max(Math.round(width * 0.26), Math.min(maxBubbleW, estTextW + padX * 2));
    const noteExtraH = beat.actingNote ? Math.round(fontSize * 1.05) : 0;
    const bubbleH = lines.length * lineHeight + padY * 2 + noteExtraH;
    const targetAnchorX = focusRig.x;
    const bubbleX = Math.max(
      Math.round(width * 0.06),
      Math.min(width - bubbleW - Math.round(width * 0.06), Math.round(targetAnchorX - bubbleW / 2))
    );
    const headTopY = focusRig.y - 210 * focusRig.scale;
    const minTopY = Math.round(height * 0.11);
    const bubbleY = Math.max(minTopY, Math.round(headTopY - bubbleH - 22));
    const tailTipX = Math.max(bubbleX + 24, Math.min(bubbleX + bubbleW - 24, Math.round(targetAnchorX)));
    const tailBaseL = Math.max(bubbleX + 18, tailTipX - 11);
    const tailBaseR = Math.min(bubbleX + bubbleW - 18, tailTipX + 11);

    bubbleGeom = {
      bubbleX,
      bubbleY,
      bubbleW,
      bubbleH,
      padX,
      padY,
      fontSize,
      lineHeight,
      noteExtraH,
      lines,
      tailBaseL,
      tailBaseR,
      tailTipX,
      tailY: bubbleY + bubbleH,
      bgColor: focusRig.profile.bubbleBgHex,
      borderColor: focusRig.profile.bubbleBorderHex,
    };
  }

  return (
    <svg
      data-testid="anime-story-stage"
      data-beat-index={safeBeatIdx}
      data-speaker={beat.speakerId}
      data-emotion={beat.emotion}
      data-action={beat.action}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 w-full h-full select-none pointer-events-none"
    >
      <defs>
        <linearGradient id="animeWallGradStage" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.wallTop} />
          <stop offset="100%" stopColor={pal.wallBottom} />
        </linearGradient>
        <linearGradient id="animeFloorGradStage" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.floorTop} />
          <stop offset="100%" stopColor={pal.floorBottom} />
        </linearGradient>
      </defs>

      <g
        transform={`translate(${(width / 2 + focusDx).toFixed(1)},${(height / 2 + focusDy).toFixed(1)}) scale(${camScale.toFixed(3)}) translate(${(-width / 2).toFixed(1)},${(-height / 2).toFixed(1)})`}
      >
        {/* Wall & Floor */}
        <rect x="0" y="0" width={width} height={horizonY} fill="url(#animeWallGradStage)" />
        <rect x="0" y={horizonY - 12} width={width} height="14" fill={pal.woodHex} />
        <rect x="0" y={horizonY} width={width} height={floorH} fill="url(#animeFloorGradStage)" />
        <polygon
          points={`${Math.round(width * 0.08)},${horizonY + 12} ${Math.round(width * 0.92)},${horizonY + 12} ${Math.round(width * 0.98)},${height - 16} ${Math.round(width * 0.02)},${height - 16}`}
          fill={pal.tatamiHex}
          stroke={pal.woodHex}
          strokeWidth="4"
          fillOpacity="0.72"
        />

        {/* Shoji Window */}
        <rect
          x={winX}
          y={winY}
          width={winW}
          height={winH}
          rx="4"
          fill={pal.skyHex}
          stroke={pal.woodDarkHex}
          strokeWidth="5"
        />
        <circle
          cx={winX + Math.round(winW * 0.72)}
          cy={winY + Math.round(winH * 0.3)}
          r={Math.round(Math.min(winW, winH) * 0.16)}
          fill={pal.windowGlowHex}
          fillOpacity="0.85"
        />
        <line
          x1={winX + Math.round(winW * 0.5)}
          y1={winY}
          x2={winX + Math.round(winW * 0.5)}
          y2={winY + winH}
          stroke={pal.woodHex}
          strokeWidth="3"
        />
        <line
          x1={winX}
          y1={winY + Math.round(winH * 0.5)}
          x2={winX + winW}
          y2={winY + Math.round(winH * 0.5)}
          stroke={pal.woodHex}
          strokeWidth="3"
        />
        <polygon
          points={`${winX},${winY + winH} ${winX + winW},${winY + winH} ${winX + winW + Math.round(width * 0.25)},${height} ${winX + Math.round(width * 0.06)},${height}`}
          fill={pal.windowGlowHex}
          fillOpacity={beamOpacity}
        />

        {/* Wall Art */}
        <g transform={`translate(${Math.round(width * 0.48)},${Math.round(horizonY * 0.28)})`}>
          <rect
            x="0"
            y="0"
            width={Math.round(width * 0.16)}
            height={Math.round(horizonY * 0.24)}
            rx="3"
            fill="#FFFFFF"
            stroke={pal.woodHex}
            strokeWidth="4"
          />
          <rect
            x="8"
            y="8"
            width={Math.round(width * 0.16) - 16}
            height={Math.round(horizonY * 0.24) - 16}
            fill="#E0F2FE"
          />
          <path
            d={`M12 ${Math.round(horizonY * 0.18)} L${Math.round(width * 0.06)} ${Math.round(horizonY * 0.1)} L${Math.round(width * 0.11)} ${Math.round(horizonY * 0.18)} Z`}
            fill="#60A5FA"
          />
          <circle cx={Math.round(width * 0.11)} cy={Math.round(horizonY * 0.07)} r="7" fill="#FBBF24" />
        </g>

        {/* Sliding Door */}
        <rect
          x={doorX}
          y={doorY}
          width={doorW}
          height={doorH}
          fill="#1E293B"
          stroke={pal.woodDarkHex}
          strokeWidth="5"
        />
        <rect
          x={doorX - doorSlidePx}
          y={doorY}
          width={doorW}
          height={doorH}
          fill="#FEFDF7"
          stroke={pal.woodHex}
          strokeWidth="4"
        />
        <rect
          x={doorX - doorSlidePx + 10}
          y={doorY + 12}
          width={Math.max(12, doorW - 20)}
          height={Math.round(doorH * 0.62)}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
        <circle
          cx={doorX - doorSlidePx + 18}
          cy={doorY + Math.round(doorH * 0.54)}
          r="5"
          fill={pal.woodDarkHex}
        />

        {beat.emotion === 'angry' && (
          <>
            <rect x="0" y="0" width={width} height={height} fill="#EF4444" fillOpacity="0.09" />
            <g stroke="#DC2626" strokeOpacity="0.18" strokeWidth="3">
              <line x1="0" y1="0" x2={Math.round(width * 0.22)} y2={Math.round(height * 0.26)} />
              <line x1={width} y1="0" x2={Math.round(width * 0.78)} y2={Math.round(height * 0.26)} />
              <line x1="0" y1={Math.round(height * 0.35)} x2={Math.round(width * 0.18)} y2={Math.round(height * 0.42)} />
              <line x1={width} y1={Math.round(height * 0.35)} x2={Math.round(width * 0.82)} y2={Math.round(height * 0.42)} />
            </g>
          </>
        )}

        {/* Present Cast */}
        {sortedRigs.map((rig) => (
          <AnimeCharacterSvg
            key={rig.profile.id}
            rig={rig}
            timeSec={animState.timeSec}
            fontCss={fontCss}
          />
        ))}

        {/* Foreground Chabudai Table */}
        <g>
          <rect
            x={tableX + 18}
            y={tableY + tableH - 4}
            width="14"
            height={Math.round(height * 0.055)}
            rx="3"
            fill="#683E1E"
          />
          <rect
            x={tableX + tableW - 32}
            y={tableY + tableH - 4}
            width="14"
            height={Math.round(height * 0.055)}
            rx="3"
            fill="#683E1E"
          />
          <rect
            x={tableX}
            y={tableY}
            width={tableW}
            height={tableH}
            rx="10"
            fill="#A16207"
            stroke="#573110"
            strokeWidth="3"
          />
          <rect
            x={tableX + Math.round(tableW * 0.16)}
            y={tableY - 8}
            width="38"
            height="10"
            rx="3"
            fill="#E0F2FE"
            stroke="#0284C7"
            strokeWidth="1.8"
          />
          <rect
            x={tableX + Math.round(tableW * 0.72)}
            y={tableY - 12}
            width="16"
            height="14"
            rx="3"
            fill="#DCFCE7"
            stroke="#15803D"
            strokeWidth="1.8"
          />
          <rect
            x={tableX + Math.round(tableW * 0.8)}
            y={tableY - 12}
            width="16"
            height="14"
            rx="3"
            fill="#FEF3C7"
            stroke="#B45309"
            strokeWidth="1.8"
          />
        </g>
      </g>

      {/* Top Title / Stage Cue Pill */}
      <g>
        <rect
          x={topBannerX}
          y={topBannerY}
          width={topBannerW}
          height={Math.round(headerFs * 1.95)}
          rx="10"
          fill={beat.isStageCue ? '#1E293B' : '#FFFFFF'}
          fillOpacity="0.93"
          stroke={beat.isStageCue ? '#F59E0B' : '#CBD5E1'}
          strokeWidth="2.2"
        />
        <text
          x={Math.round(width / 2)}
          y={topBannerY + Math.round(headerFs * 1.28)}
          textAnchor="middle"
          fontFamily={fontCss}
          fontSize={headerFs}
          fontWeight="800"
          fill={beat.isStageCue ? '#FEF3C7' : '#0F172A'}
        >
          {topBannerText}
        </text>
      </g>

      {/* Compact Text-Hugging Speech Bubble */}
      {bubbleGeom && (
        <g data-testid="anime-speech-bubble">
          <rect
            x={bubbleGeom.bubbleX + 3}
            y={bubbleGeom.bubbleY + 5}
            width={bubbleGeom.bubbleW}
            height={bubbleGeom.bubbleH}
            rx="18"
            fill="#0F172A"
            fillOpacity="0.14"
          />
          <rect
            x={bubbleGeom.bubbleX}
            y={bubbleGeom.bubbleY}
            width={bubbleGeom.bubbleW}
            height={bubbleGeom.bubbleH}
            rx="18"
            fill={bubbleGeom.bgColor}
            stroke={bubbleGeom.borderColor}
            strokeWidth="3.2"
          />
          <polygon
            points={`${bubbleGeom.tailBaseL},${bubbleGeom.tailY - 2} ${bubbleGeom.tailBaseR},${bubbleGeom.tailY - 2} ${bubbleGeom.tailTipX},${bubbleGeom.tailY + 18}`}
            fill={bubbleGeom.bgColor}
          />
          <polyline
            points={`${bubbleGeom.tailBaseL},${bubbleGeom.tailY} ${bubbleGeom.tailTipX},${bubbleGeom.tailY + 18} ${bubbleGeom.tailBaseR},${bubbleGeom.tailY}`}
            fill="none"
            stroke={bubbleGeom.borderColor}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {beat.actingNote && (
            <text
              x={bubbleGeom.bubbleX + bubbleGeom.padX}
              y={bubbleGeom.bubbleY + bubbleGeom.padY + Math.round(bubbleGeom.fontSize * 0.68)}
              fontFamily={fontCss}
              fontSize={Math.max(11, Math.round(bubbleGeom.fontSize * 0.64))}
              fontWeight="800"
              fill={bubbleGeom.borderColor}
            >
              （{beat.actingNote}）
            </text>
          )}
          {bubbleGeom.lines.map((ln, idx) => (
            <text
              key={idx}
              x={bubbleGeom.bubbleX + bubbleGeom.padX}
              y={
                bubbleGeom.bubbleY +
                bubbleGeom.padY +
                bubbleGeom.noteExtraH +
                Math.round(bubbleGeom.fontSize * 0.88) +
                idx * bubbleGeom.lineHeight
              }
              fontFamily={fontCss}
              fontSize={bubbleGeom.fontSize}
              fontWeight="700"
              fill="#0F172A"
            >
              {ln}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
};
