import React, { useEffect, useState } from 'react';
import { AnimeRoomKind, AnimeSceneStyle, SubtitleEffect, VideoAspectRatio } from '../shared/types';
import {
  AnimeCharacterProfile,
  AnimeHandProp,
  AnimeStoryboardBeat,
  ComputedCharRig,
  computeAnimeRigStates,
  getAnimeThemePalette,
  ParsedAnimeStory,
  resolveBubbleKaraokeColor,
  tokenizeAnimeKaraokeLine,
  wrapAnimeBubbleLines,
} from '../shared/animeStoryEngine';

interface AnimeStoryStageProps {
  story: ParsedAnimeStory;
  beatIndex: number;
  aspectRatio: VideoAspectRatio;
  sceneStyle: AnimeSceneStyle;
  fontName?: string;
  isPlaying: boolean;
  subtitleEffect?: SubtitleEffect;
  highlightColor?: string;
  replayNonce?: number;
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

const AnimeHandPropSvg: React.FC<{ prop: AnimeHandProp }> = ({ prop }) => {
  if (prop === 'coffee_cup') {
    return (
      <g transform="translate(4,34)">
        <rect x="-8" y="-12" width="16" height="18" rx="3" fill="#FFFBEB" stroke="#1E1B18" strokeWidth="2" />
        <rect x="-9" y="-15" width="18" height="5" rx="2" fill="#78350F" stroke="#1E1B18" strokeWidth="1.6" />
        <rect x="-8" y="-6" width="16" height="6" fill="#D97706" fillOpacity="0.75" />
      </g>
    );
  }
  if (prop === 'popsicle_box') {
    return (
      <g transform="translate(8,32)">
        <rect x="-15" y="-11" width="30" height="20" rx="4" fill="#38BDF8" stroke="#0369A1" strokeWidth="2" />
        <rect x="-10" y="-6" width="20" height="10" rx="2" fill="#E0F2FE" />
        <line x1="-6" y1="-1" x2="6" y2="-1" stroke="#0284C7" strokeWidth="2.2" />
      </g>
    );
  }
  if (prop === 'beer_case') {
    return (
      <g transform="translate(10,30)">
        <rect x="-17" y="-13" width="34" height="24" rx="4" fill="#FBBF24" stroke="#92400E" strokeWidth="2.2" />
        <rect x="-11" y="-8" width="22" height="12" rx="2" fill="#FEF3C7" />
        <circle cx="-4" cy="-2" r="3.5" fill="#B45309" />
        <circle cx="5" cy="-2" r="3.5" fill="#B45309" />
      </g>
    );
  }
  if (prop === 'clipboard') {
    return (
      <g transform="translate(6,34)">
        <rect x="-11" y="-15" width="22" height="28" rx="3" fill="#FFFFFF" stroke="#334155" strokeWidth="2" />
        <rect x="-6" y="-18" width="12" height="5" rx="2" fill="#64748B" />
        <line x1="-7" y1="-6" x2="7" y2="-6" stroke="#94A3B8" strokeWidth="2" />
        <line x1="-7" y1="0" x2="7" y2="0" stroke="#94A3B8" strokeWidth="2" />
        <line x1="-7" y1="6" x2="4" y2="6" stroke="#94A3B8" strokeWidth="2" />
      </g>
    );
  }
  return null;
};

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
    hipDropY,
    bodyTiltDeg,
    headTiltDeg,
    blinkAmt,
    mouthPhase,
    isSpeaking,
    emotion,
    handProp,
    fx,
    opacity,
    lookOffsetX,
  } = rig;
  const {
    gender,
    hairStyle,
    hairHex,
    hairShadeHex,
    outfitHex,
    outfitAccentHex,
    pantsHex,
    shoeHex,
    skinHex,
    nameBadgeHex,
    displayName,
  } = profile;

  const eyeScaleY = Math.max(0.08, 1 - blinkAmt);
  const mh = isSpeaking && mouthPhase > 0.14 ? 3.5 + mouthPhase * 9.5 : 0;
  const mw = isSpeaking && mouthPhase > 0.14 ? 5.5 + (1 - mouthPhase * 0.3) * 5.0 : 0;

  const legUpperFill = gender === 'female' ? skinHex : pantsHex;
  const legLowerFill = gender === 'female' ? '#F8FAFC' : pantsHex;

  const renderLeg = (hipX: number, thighDeg: number, shinDeg: number, isBack: boolean) => (
    <g
      transform={`translate(${hipX},${(-82 + hipDropY).toFixed(1)}) rotate(${thighDeg.toFixed(1)})`}
      opacity={isBack ? 0.93 : 1}
    >
      <rect
        x="-9"
        y="-2"
        width="18"
        height="44"
        rx="9"
        fill={legUpperFill}
        stroke="#1E1B18"
        strokeWidth="2.4"
      />
      <g transform={`translate(0,40) rotate(${shinDeg.toFixed(1)})`}>
        <rect
          x="-8"
          y="-2"
          width="16"
          height="40"
          rx="8"
          fill={legLowerFill}
          stroke="#1E1B18"
          strokeWidth="2.4"
        />
        <path
          d="M-9 36 L14 36 C19 36 21 44 14 45 L-9 45 C-12 45 -12 36 -9 36 Z"
          fill={shoeHex}
          stroke="#1E1B18"
          strokeWidth="2.2"
        />
        <line
          x1="-8"
          y1="43"
          x2="15"
          y2="43"
          stroke="#FFFFFF"
          strokeOpacity="0.45"
          strokeWidth="1.6"
        />
      </g>
    </g>
  );

  return (
    <g
      data-testid={`anime-char-${profile.id}`}
      data-facing={facing}
      data-action={rig.action}
      transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${scale.toFixed(3)})`}
      opacity={opacity}
    >
      {/* Ground contact shadow under shoes */}
      <ellipse cx="0" cy="4" rx="46" ry="9" fill="#0F172A" fillOpacity="0.18" />

      {/* Full-Body Pose Group oriented by facing (+1 right, -1 left) */}
      <g transform={`scale(${facing}, 1)`}>
        {/* Back Leg */}
        {renderLeg(-14, rig.leftThighAngle, rig.leftShinAngle, true)}
        {/* Front Leg */}
        {renderLeg(14, rig.rightThighAngle, rig.rightShinAngle, false)}

        {/* Pelvis / Skirt */}
        <g transform={`translate(0,${hipDropY.toFixed(1)})`}>
          {gender === 'female' ? (
            <>
              <path
                d="M-32 -88 L32 -88 L40 -48 C18 -43 -18 -43 -40 -48 Z"
                fill={pantsHex}
                stroke="#1E1B18"
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              <line x1="-14" y1="-84" x2="-18" y2="-46" stroke="#334155" strokeWidth="1.8" />
              <line x1="0" y1="-84" x2="0" y2="-45" stroke="#334155" strokeWidth="1.8" />
              <line x1="14" y1="-84" x2="18" y2="-46" stroke="#334155" strokeWidth="1.8" />
            </>
          ) : (
            <path
              d="M-30 -88 L30 -88 L32 -70 L-32 -70 Z"
              fill={pantsHex}
              stroke="#1E1B18"
              strokeWidth="2.4"
            />
          )}
        </g>

        {/* Upper Body pivoting at hip (-82 + hipDropY) */}
        <g transform={`translate(0,${(-82 + hipDropY).toFixed(1)}) rotate(${bodyTiltDeg.toFixed(2)})`}>
          {/* Back Articulated Arm */}
          <g transform={`translate(-26,-70) rotate(${rig.leftArmAngle.toFixed(1)})`}>
            <rect
              x="-8"
              y="0"
              width="16"
              height="38"
              rx="8"
              fill={outfitHex}
              stroke="#1E1B18"
              strokeWidth="2.4"
            />
            <g transform={`translate(0,34) rotate(${rig.leftForearmAngle.toFixed(1)})`}>
              <rect
                x="-7"
                y="0"
                width="14"
                height="32"
                rx="7"
                fill={outfitHex}
                stroke="#1E1B18"
                strokeWidth="2.4"
              />
              <circle cx="0" cy="34" r="7.5" fill={skinHex} stroke="#1E1B18" strokeWidth="2.2" />
            </g>
          </g>

          {/* Torso & Collar */}
          <path
            d="M-33 -74 C-35 -86 -20 -90 0 -90 C20 -90 35 -86 33 -74 L35 2 C35 8 28 11 22 11 L-22 11 C-28 11 -35 8 -35 2 Z"
            fill={outfitHex}
            stroke="#1E1B18"
            strokeWidth="2.8"
          />
          <path
            d="M-13 -88 L0 -62 L13 -88 Z"
            fill={outfitAccentHex}
            stroke="#1E1B18"
            strokeWidth="2"
          />
          <line
            x1="0"
            y1="-62"
            x2="0"
            y2="8"
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
                  <path
                    d="M-27 -144 Q-17 -151 -7 -144"
                    fill="none"
                    stroke="#1E1B18"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 -144 Q17 -151 27 -144"
                    fill="none"
                    stroke="#1E1B18"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M-27 -139 Q-17 -143 -8 -139"
                    fill="none"
                    stroke="#1E1B18"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 -139 Q17 -143 27 -139"
                    fill="none"
                    stroke="#1E1B18"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* Nose */}
              <path d="M0 -114 L3 -107" stroke="#C28E70" strokeWidth="2" strokeLinecap="round" />

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
                <path
                  d="M-10 -99 Q0 -89 10 -99"
                  fill="none"
                  stroke="#1E1B18"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              ) : emotion === 'angry' ? (
                <path
                  d="M-10 -94 Q0 -101 10 -94"
                  fill="none"
                  stroke="#1E1B18"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              ) : emotion === 'shocked' ? (
                <ellipse
                  cx="0"
                  cy="-95"
                  rx="6"
                  ry="8"
                  fill="#9F1239"
                  stroke="#1E1B18"
                  strokeWidth="2.2"
                />
              ) : emotion === 'wry_smile' ? (
                <path
                  d="M-9 -97 Q-2 -91 9 -98"
                  fill="none"
                  stroke="#1E1B18"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M-7 -96 Q0 -93 7 -96"
                  fill="none"
                  stroke="#1E1B18"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
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
            </g>
          </g>

          {/* Front Articulated Arm + Hand Prop */}
          <g transform={`translate(26,-70) rotate(${rig.rightArmAngle.toFixed(1)})`}>
            <rect
              x="-8"
              y="0"
              width="16"
              height="38"
              rx="8"
              fill={outfitHex}
              stroke="#1E1B18"
              strokeWidth="2.4"
            />
            <g transform={`translate(0,34) rotate(${rig.rightForearmAngle.toFixed(1)})`}>
              <rect
                x="-7"
                y="0"
                width="14"
                height="32"
                rx="7"
                fill={outfitHex}
                stroke="#1E1B18"
                strokeWidth="2.4"
              />
              <circle cx="0" cy="34" r="7.5" fill={skinHex} stroke="#1E1B18" strokeWidth="2.2" />
              <AnimeHandPropSvg prop={handProp} />
            </g>
          </g>
        </g>
      </g>

      {/* Unflipped Comic FX above head */}
      {fx === 'anger_cross' && (
        <g
          transform={`translate(38,${(-252 + hipDropY).toFixed(1)}) scale(${(
            1 +
            Math.sin(timeSec * 12) * 0.16
          ).toFixed(2)})`}
        >
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
        <g transform={`translate(-42,${(-230 + hipDropY + ((timeSec * 18) % 10)).toFixed(1)})`}>
          <path
            d="M0 -10 C5 -2 7 3 7 6 A7 7 0 1 1 -7 6 C-7 3 -5 -2 0 -10 Z"
            fill="#38BDF8"
            stroke="#0284C7"
            strokeWidth="2"
          />
        </g>
      )}
      {fx === 'shock_burst' && (
        <g
          transform={`translate(${40 * facing},${(-256 + hipDropY).toFixed(1)}) scale(${(
            1 +
            Math.sin(timeSec * 15) * 0.14
          ).toFixed(2)})`}
        >
          <line x1="-4" y1="-16" x2="-4" y2="2" stroke="#EF4444" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="-4" cy="10" r="2.8" fill="#EF4444" />
          <line x1="8" y1="-13" x2="12" y2="3" stroke="#F59E0B" strokeWidth="3.6" strokeLinecap="round" />
        </g>
      )}
      {fx === 'whisper_wave' && (
        <g
          transform={`translate(${(38 * facing).toFixed(1)},${(
            -192 +
            hipDropY +
            Math.sin(timeSec * 8) * 3
          ).toFixed(1)})`}
        >
          <path
            d={`M0 -8 Q${10 * facing} 0 0 8`}
            fill="none"
            stroke="#0D9488"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
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
        <g
          transform={`translate(38,${(-250 + hipDropY).toFixed(1)}) scale(${(
            0.85 +
            0.25 * Math.sin(timeSec * 7)
          ).toFixed(2)})`}
        >
          <path
            d="M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="1.6"
          />
        </g>
      )}

      {/* Unflipped Character Name Tag cleanly below shoes */}
      <g transform="translate(0,24)">
        <rect
          x="-38"
          y="-12"
          width="76"
          height="22"
          rx="11"
          fill={nameBadgeHex}
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
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

const FridgePropSvg: React.FC<{
  fx: number;
  fy: number;
  fw: number;
  fh: number;
  open: boolean;
}> = ({ fx, fy, fw, fh, open }) => (
  <g data-testid="anime-fridge-prop" data-open={open ? 'true' : 'false'}>
    <rect
      x={fx}
      y={fy}
      width={fw}
      height={fh}
      rx="8"
      fill="#F8FAFC"
      stroke="#475569"
      strokeWidth="3.5"
    />
    <line
      x1={fx}
      y1={fy + Math.round(fh * 0.36)}
      x2={fx + fw}
      y2={fy + Math.round(fh * 0.36)}
      stroke="#64748B"
      strokeWidth="2.5"
    />
    <rect
      x={fx + fw - 14}
      y={fy + Math.round(fh * 0.12)}
      width="5"
      height={Math.round(fh * 0.16)}
      rx="2"
      fill="#94A3B8"
    />
    <rect
      x={fx + fw - 14}
      y={fy + Math.round(fh * 0.44)}
      width="5"
      height={Math.round(fh * 0.22)}
      rx="2"
      fill="#94A3B8"
    />
    {open && (
      <>
        <rect
          x={fx + 6}
          y={fy + 6}
          width={Math.max(12, fw - 12)}
          height={Math.round(fh * 0.28)}
          rx="3"
          fill="#E0F2FE"
        />
        <line
          x1={fx + 8}
          y1={fy + Math.round(fh * 0.2)}
          x2={fx + fw - 8}
          y2={fy + Math.round(fh * 0.2)}
          stroke="#7DD3FC"
          strokeWidth="2"
        />
        <polygon
          points={`${fx + fw},${fy} ${fx + fw + Math.round(fw * 0.45)},${fy - 8} ${
            fx + fw + Math.round(fw * 0.45)
          },${fy + Math.round(fh * 0.38)} ${fx + fw},${fy + Math.round(fh * 0.36)}`}
          fill="#FFFFFF"
          stroke="#475569"
          strokeWidth="2.8"
        />
      </>
    )}
  </g>
);

const AnimeRoomBackdropSvg: React.FC<{
  width: number;
  height: number;
  beat: AnimeStoryboardBeat;
  sceneStyle: AnimeSceneStyle;
  timeSec: number;
  beatProgress: number;
}> = ({ width, height, beat, sceneStyle, timeSec, beatProgress }) => {
  const pal = getAnimeThemePalette(sceneStyle);
  const horizonY = Math.round(height * (height > width ? 0.59 : 0.63));
  const floorH = height - horizonY;
  const room: AnimeRoomKind = beat.roomKind;

  const doorSlidePx = beat.doorOpen
    ? Math.round(Math.min(1, beatProgress * 2.2) * (width * 0.14))
    : 0;
  const doorW = Math.round(width * 0.19);
  const doorH = Math.round(horizonY * 0.65);
  const doorX = Math.round(width * 0.78);
  const doorY = horizonY - doorH;

  const beamOpacity = 0.18 + Math.sin(timeSec * 0.8) * 0.03;
  const cloudDrift = Math.sin(timeSec * 0.35) * 18;

  const renderRoomContent = () => {
    if (room === 'cafe_corner') {
      const winX = Math.round(width * 0.06);
      const winY = Math.round(horizonY * 0.2);
      const winW = Math.round(width * 0.34);
      const winH = Math.round(horizonY * 0.48);
      return (
        <>
          <rect x="0" y="0" width={width} height={horizonY} fill="#FEF3C7" />
          <rect
            x="0"
            y={Math.round(horizonY * 0.65)}
            width={width}
            height={Math.round(horizonY * 0.35)}
            fill="#D6B48C"
          />
          <rect x="0" y={horizonY} width={width} height={floorH} fill="#9A6B42" />
          <rect
            x={winX}
            y={winY}
            width={winW}
            height={winH}
            rx="6"
            fill="#BAE6FD"
            stroke="#78350F"
            strokeWidth="5"
          />
          <ellipse
            cx={winX + Math.round(winW * 0.3) + cloudDrift * 0.4}
            cy={winY + 32}
            rx="28"
            ry="12"
            fill="#FFFFFF"
            fillOpacity="0.85"
          />
          <path
            d={`M${winX + 10} ${winY + winH} Q${winX + winW * 0.25} ${winY + winH * 0.55} ${
              winX + winW * 0.5
            } ${winY + winH} Z`}
            fill="#86EFAC"
          />
          <line
            x1={winX + Math.round(winW * 0.5)}
            y1={winY}
            x2={winX + Math.round(winW * 0.5)}
            y2={winY + winH}
            stroke="#78350F"
            strokeWidth="3.5"
          />
          {[0.34, 0.66].map((rx) => {
            const lx = Math.round(width * rx);
            return (
              <g key={rx}>
                <line
                  x1={lx}
                  y1="0"
                  x2={lx}
                  y2={Math.round(horizonY * 0.16)}
                  stroke="#451A03"
                  strokeWidth="3"
                />
                <path
                  d={`M${lx - 20} ${Math.round(horizonY * 0.21)} L${lx + 20} ${Math.round(
                    horizonY * 0.21
                  )} L${lx + 11} ${Math.round(horizonY * 0.16)} L${lx - 11} ${Math.round(
                    horizonY * 0.16
                  )} Z`}
                  fill="#F59E0B"
                  stroke="#78350F"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}
          <rect
            x={Math.round(width * 0.46)}
            y={Math.round(horizonY * 0.25)}
            width={Math.round(width * 0.24)}
            height={Math.round(horizonY * 0.3)}
            rx="5"
            fill="#1E293B"
            stroke="#78350F"
            strokeWidth="5"
          />
          <text
            x={Math.round(width * 0.58)}
            y={Math.round(horizonY * 0.35)}
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="#FDE68A"
          >
            CAFE MENU
          </text>
          <line
            x1={Math.round(width * 0.5)}
            y1={Math.round(horizonY * 0.41)}
            x2={Math.round(width * 0.66)}
            y2={Math.round(horizonY * 0.41)}
            stroke="#94A3B8"
            strokeWidth="2"
          />
          <line
            x1={Math.round(width * 0.5)}
            y1={Math.round(horizonY * 0.47)}
            x2={Math.round(width * 0.63)}
            y2={Math.round(horizonY * 0.47)}
            stroke="#94A3B8"
            strokeWidth="2"
          />
          <rect x={doorX} y={doorY} width={doorW} height={doorH} fill="#334155" stroke="#451A03" strokeWidth="4" />
          <rect
            x={doorX - doorSlidePx}
            y={doorY}
            width={doorW}
            height={doorH}
            fill="#E0F2FE"
            fillOpacity="0.88"
            stroke="#78350F"
            strokeWidth="4"
          />
        </>
      );
    }

    if (room === 'office_desk') {
      const winX = Math.round(width * 0.06);
      const winY = Math.round(horizonY * 0.18);
      const winW = Math.round(width * 0.36);
      const winH = Math.round(horizonY * 0.46);
      return (
        <>
          <rect x="0" y="0" width={width} height={horizonY} fill="#F1F5F9" />
          <rect x="0" y={horizonY - 10} width={width} height="10" fill="#94A3B8" />
          <rect x="0" y={horizonY} width={width} height={floorH} fill="#CBD5E1" />
          <rect
            x={winX}
            y={winY}
            width={winW}
            height={winH}
            rx="4"
            fill="#BAE6FD"
            stroke="#475569"
            strokeWidth="5"
          />
          <rect
            x={winX + 16}
            y={winY + Math.round(winH * 0.42)}
            width="28"
            height={Math.round(winH * 0.58)}
            fill="#94A3B8"
          />
          <rect
            x={winX + 52}
            y={winY + Math.round(winH * 0.25)}
            width="34"
            height={Math.round(winH * 0.75)}
            fill="#64748B"
          />
          <rect
            x={winX + 94}
            y={winY + Math.round(winH * 0.5)}
            width="26"
            height={Math.round(winH * 0.5)}
            fill="#94A3B8"
          />
          <rect
            x={Math.round(width * 0.46)}
            y={Math.round(horizonY * 0.22)}
            width={Math.round(width * 0.24)}
            height={Math.round(horizonY * 0.28)}
            rx="4"
            fill="#FFFFFF"
            stroke="#64748B"
            strokeWidth="4"
          />
          <polyline
            points={`${Math.round(width * 0.49)},${Math.round(horizonY * 0.42)} ${Math.round(
              width * 0.55
            )},${Math.round(horizonY * 0.36)} ${Math.round(width * 0.61)},${Math.round(
              horizonY * 0.38
            )} ${Math.round(width * 0.67)},${Math.round(horizonY * 0.29)}`}
            fill="none"
            stroke="#4F46E5"
            strokeWidth="3"
          />
          {beat.hasFridgeProp ? (
            <FridgePropSvg
              fx={Math.round(width * 0.76)}
              fy={horizonY - Math.round(horizonY * 0.56)}
              fw={Math.round(width * 0.16)}
              fh={Math.round(horizonY * 0.56)}
              open={beat.fridgeOpen}
            />
          ) : (
            <>
              <rect x={doorX} y={doorY} width={doorW} height={doorH} fill="#1E293B" stroke="#334155" strokeWidth="4" />
              <rect
                x={doorX - doorSlidePx}
                y={doorY}
                width={doorW}
                height={doorH}
                fill="#E2E8F0"
                stroke="#475569"
                strokeWidth="4"
              />
            </>
          )}
        </>
      );
    }

    if (room === 'school_classroom') {
      return (
        <>
          <rect x="0" y="0" width={width} height={horizonY} fill="#FFFBEB" />
          <rect x="0" y={horizonY - 12} width={width} height="12" fill="#B45309" />
          <rect x="0" y={horizonY} width={width} height={floorH} fill="#D6A972" />
          <rect
            x={Math.round(width * 0.24)}
            y={Math.round(horizonY * 0.22)}
            width={Math.round(width * 0.52)}
            height={Math.round(horizonY * 0.36)}
            rx="4"
            fill="#14532D"
            stroke="#92400E"
            strokeWidth="6"
          />
          <line
            x1={Math.round(width * 0.3)}
            y1={Math.round(horizonY * 0.34)}
            x2={Math.round(width * 0.58)}
            y2={Math.round(horizonY * 0.34)}
            stroke="#E2E8F0"
            strokeOpacity="0.7"
            strokeWidth="3"
          />
          <line
            x1={Math.round(width * 0.3)}
            y1={Math.round(horizonY * 0.42)}
            x2={Math.round(width * 0.5)}
            y2={Math.round(horizonY * 0.42)}
            stroke="#FDE68A"
            strokeOpacity="0.7"
            strokeWidth="2.5"
          />
          <rect
            x={Math.round(width * 0.04)}
            y={Math.round(horizonY * 0.2)}
            width={Math.round(width * 0.15)}
            height={Math.round(horizonY * 0.48)}
            rx="3"
            fill="#BAE6FD"
            stroke="#78350F"
            strokeWidth="4"
          />
          <circle
            cx={Math.round(width * 0.5)}
            cy={Math.round(horizonY * 0.13)}
            r="16"
            fill="#FFFFFF"
            stroke="#475569"
            strokeWidth="3"
          />
          <line
            x1={Math.round(width * 0.5)}
            y1={Math.round(horizonY * 0.13)}
            x2={Math.round(width * 0.5)}
            y2={Math.round(horizonY * 0.13) - 9}
            stroke="#1E293B"
            strokeWidth="2.2"
          />
          <line
            x1={Math.round(width * 0.5)}
            y1={Math.round(horizonY * 0.13)}
            x2={Math.round(width * 0.5) + 7}
            y2={Math.round(horizonY * 0.13)}
            stroke="#1E293B"
            strokeWidth="2.2"
          />
        </>
      );
    }

    if (room === 'street_park') {
      return (
        <>
          <rect x="0" y="0" width={width} height={horizonY} fill="#BAE6FD" />
          <ellipse
            cx={Math.round(width * 0.25) + cloudDrift}
            cy={Math.round(horizonY * 0.22)}
            rx="46"
            ry="16"
            fill="#FFFFFF"
            fillOpacity="0.9"
          />
          <ellipse
            cx={Math.round(width * 0.74) - cloudDrift * 0.6}
            cy={Math.round(horizonY * 0.18)}
            rx="52"
            ry="18"
            fill="#FFFFFF"
            fillOpacity="0.85"
          />
          <path
            d={`M0 ${horizonY} Q${width * 0.18} ${horizonY * 0.62} ${width * 0.36} ${horizonY} Z`}
            fill="#4ADE80"
          />
          <path
            d={`M${width * 0.62} ${horizonY} Q${width * 0.82} ${horizonY * 0.58} ${width} ${horizonY} Z`}
            fill="#22C55E"
          />
          <rect
            x={Math.round(width * 0.36)}
            y={horizonY - 38}
            width={Math.round(width * 0.28)}
            height="12"
            rx="3"
            fill="#B45309"
            stroke="#78350F"
            strokeWidth="2.5"
          />
          <rect x={Math.round(width * 0.38)} y={horizonY - 26} width="8" height="26" fill="#475569" />
          <rect x={Math.round(width * 0.6)} y={horizonY - 26} width="8" height="26" fill="#475569" />
          <rect x="0" y={horizonY} width={width} height={floorH} fill="#94A3B8" />
          <line x1="0" y1={horizonY + 8} x2={width} y2={horizonY + 8} stroke="#64748B" strokeWidth="4" />
        </>
      );
    }

    if (room === 'restaurant_izakaya') {
      return (
        <>
          <rect x="0" y="0" width={width} height={horizonY} fill="#7C2D12" />
          <rect x="0" y={horizonY} width={width} height={floorH} fill="#78350F" />
          {[0.2, 0.5, 0.8].map((rx) => {
            const lx = Math.round(width * rx);
            return (
              <g key={rx}>
                <ellipse
                  cx={lx}
                  cy={Math.round(horizonY * 0.24)}
                  rx="22"
                  ry="28"
                  fill="#FEF08A"
                  stroke="#DC2626"
                  strokeWidth="3.5"
                />
                <line
                  x1={lx - 18}
                  y1={Math.round(horizonY * 0.24)}
                  x2={lx + 18}
                  y2={Math.round(horizonY * 0.24)}
                  stroke="#DC2626"
                  strokeWidth="2"
                />
              </g>
            );
          })}
          <rect
            x={Math.round(width * 0.14)}
            y={horizonY - 46}
            width={Math.round(width * 0.72)}
            height="46"
            fill="#A16207"
            stroke="#451A03"
            strokeWidth="4"
          />
        </>
      );
    }

    if (room === 'train_station') {
      return (
        <>
          <rect x="0" y="0" width={width} height={horizonY} fill="#E0F2FE" />
          <rect x="0" y="0" width={width} height={Math.round(horizonY * 0.18)} fill="#334155" />
          <rect
            x={Math.round(width * 0.34)}
            y={Math.round(horizonY * 0.22)}
            width={Math.round(width * 0.32)}
            height="38"
            rx="4"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
          <rect
            x={Math.round(width * 0.34)}
            y={Math.round(horizonY * 0.22) + 28}
            width={Math.round(width * 0.32)}
            height="10"
            fill="#16A34A"
          />
          <rect x="0" y={horizonY} width={width} height={floorH} fill="#CBD5E1" />
          <rect x="0" y={horizonY + 14} width={width} height="10" fill="#FACC15" />
        </>
      );
    }

    if (room === 'kitchen_fridge') {
      const fW = Math.round(width * 0.22);
      const fH = Math.round(horizonY * 0.62);
      const fX = Math.round(width * 0.08);
      const fY = horizonY - fH;
      return (
        <>
          <rect x="0" y="0" width={width} height={horizonY} fill="#FFFBEB" />
          <rect x="0" y={horizonY} width={width} height={floorH} fill="#E2E8F0" />
          <FridgePropSvg fx={fX} fy={fY} fw={fW} fh={fH} open={beat.fridgeOpen} />
          <rect
            x={Math.round(width * 0.36)}
            y={horizonY - Math.round(horizonY * 0.28)}
            width={Math.round(width * 0.4)}
            height={Math.round(horizonY * 0.28)}
            fill="#F1F5F9"
            stroke="#94A3B8"
            strokeWidth="3"
          />
          <rect
            x={Math.round(width * 0.34)}
            y={horizonY - Math.round(horizonY * 0.3)}
            width={Math.round(width * 0.44)}
            height="12"
            rx="3"
            fill="#CBD5E1"
            stroke="#64748B"
            strokeWidth="2.5"
          />
          <rect
            x={doorX}
            y={doorY}
            width={doorW}
            height={doorH}
            fill="#1E293B"
            stroke={pal.woodDarkHex}
            strokeWidth="4"
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
        </>
      );
    }

    // room_living default
    const winX = Math.round(width * (beat.hasFridgeProp ? 0.28 : 0.07));
    const winY = Math.round(horizonY * 0.22);
    const winW = Math.round(width * 0.26);
    const winH = Math.round(horizonY * 0.42);
    return (
      <>
        <rect x="0" y="0" width={width} height={horizonY} fill="url(#animeWallGradStage)" />
        <rect x="0" y={horizonY - 12} width={width} height="14" fill={pal.woodHex} />
        <rect x="0" y={horizonY} width={width} height={floorH} fill="url(#animeFloorGradStage)" />
        <polygon
          points={`${Math.round(width * 0.08)},${horizonY + 12} ${Math.round(width * 0.92)},${
            horizonY + 12
          } ${Math.round(width * 0.98)},${height - 16} ${Math.round(width * 0.02)},${height - 16}`}
          fill={pal.tatamiHex}
          stroke={pal.woodHex}
          strokeWidth="4"
          fillOpacity="0.72"
        />
        {beat.hasFridgeProp && (
          <FridgePropSvg
            fx={Math.round(width * 0.05)}
            fy={horizonY - Math.round(horizonY * 0.56)}
            fw={Math.round(width * 0.17)}
            fh={Math.round(horizonY * 0.56)}
            open={beat.fridgeOpen}
          />
        )}
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
          points={`${winX},${winY + winH} ${winX + winW},${winY + winH} ${
            winX + winW + Math.round(width * 0.25)
          },${height} ${winX + Math.round(width * 0.06)},${height}`}
          fill={pal.windowGlowHex}
          fillOpacity={beamOpacity}
        />
        <g transform={`translate(${Math.round(width * 0.58)},${Math.round(horizonY * 0.26)})`}>
          <rect
            x="0"
            y="0"
            width={Math.round(width * 0.14)}
            height={Math.round(horizonY * 0.24)}
            rx="3"
            fill="#FFFFFF"
            stroke={pal.woodHex}
            strokeWidth="4"
          />
          <rect
            x="7"
            y="7"
            width={Math.round(width * 0.14) - 14}
            height={Math.round(horizonY * 0.24) - 14}
            fill="#E0F2FE"
          />
          <path
            d={`M10 ${Math.round(horizonY * 0.18)} L${Math.round(width * 0.055)} ${Math.round(
              horizonY * 0.1
            )} L${Math.round(width * 0.1)} ${Math.round(horizonY * 0.18)} Z`}
            fill="#60A5FA"
          />
        </g>
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
        <circle
          cx={doorX - doorSlidePx + 18}
          cy={doorY + Math.round(doorH * 0.54)}
          r="5"
          fill={pal.woodDarkHex}
        />
      </>
    );
  };

  return (
    <g data-testid={`anime-room-${room}`}>
      {renderRoomContent()}
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
  subtitleEffect = 'karaoke',
  highlightColor,
  replayNonce = 0,
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
    hasFridgeProp: false,
    fridgeOpen: false,
    speakerId: story.characters[0]?.id ?? '先輩',
    speakerName: story.characters[0]?.displayName ?? '先輩',
    rawText: '...',
    spokenText: '...',
    emotion: 'calm',
    action: 'gesture_talk',
    handProp: 'none',
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
  }, [safeBeatIdx, beat.rawText, replayNonce]);

  const width = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 720 : 720;
  const beatDur = Math.max(1.4, beat.estDurationSec);
  const beatProgress = Math.min(1, animState.beatElapsed / beatDur);

  const fontCss =
    fontName === 'BIZ UDPGothic'
      ? "'BIZ UDPGothic', 'M PLUS 1p', 'Noto Sans', sans-serif"
      : "'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif";

  const pal = getAnimeThemePalette(sceneStyle);
  const isPlayingSpeech = !beat.isStageCue && (isPlaying || beatProgress < 0.88);
  const rigs = computeAnimeRigStates({
    story,
    beat,
    timeSec: animState.timeSec,
    beatProgress,
    width,
    height,
    isPlayingSpeech,
  });

  const focusRig = rigs.find((r) => r.isActiveFocus) ?? rigs[0];
  const camScale = beat.isStageCue
    ? 1.0
    : beat.emotion === 'angry' || beat.emotion === 'shocked'
    ? 1.04
    : 1.018;
  const focusDx = focusRig ? (width * 0.5 - focusRig.x) * 0.08 : 0;
  const focusDy = (height * 0.5 - height * 0.54) * 0.025;
  const sortedRigs = [...rigs].sort((a, b) => (a.isActiveFocus ? 1 : 0) - (b.isActiveFocus ? 1 : 0));

  const isPortrait = height > width;

  // Top Banner
  const headerFs = Math.max(15, Math.round(Math.min(width, height) * 0.026));
  const topBannerText = beat.isStageCue ? beat.sceneTitle || beat.rawText : story.title;
  const topBannerW = Math.min(
    Math.round(width * 0.88),
    Math.max(180, Math.round(approxBubbleTextUnits(topBannerText) * headerFs * 1.05 + 36))
  );
  const topBannerX = Math.round((width - topBannerW) / 2);
  const topBannerY = Math.round(height * 0.04);

  // Compact text-hugging speech bubble + karaoke tokens
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
    tokenizedLines: string[][];
    activeGlobalToks: number;
    tailBaseL: number;
    tailBaseR: number;
    tailTipX: number;
    tailY: number;
    bgColor: string;
    borderColor: string;
    activeKaraokeColor: string;
  } | null = null;

  const karaokeEnabled = subtitleEffect === 'karaoke' || subtitleEffect === 'laser';

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
    const headTopY = focusRig.y - 275 * focusRig.scale + focusRig.hipDropY * focusRig.scale;
    const minTopY = Math.round(height * 0.1);
    const bubbleY = Math.max(minTopY, Math.round(headTopY - bubbleH - 22));
    const tailTipX = Math.max(
      bubbleX + 24,
      Math.min(bubbleX + bubbleW - 24, Math.round(targetAnchorX))
    );
    const tailBaseL = Math.max(bubbleX + 18, tailTipX - 11);
    const tailBaseR = Math.min(bubbleX + bubbleW - 18, tailTipX + 11);

    const tokenizedLines = lines.map((ln) => tokenizeAnimeKaraokeLine(ln));
    const totalToks = Math.max(1, tokenizedLines.reduce((sum, arr) => sum + arr.length, 0));
    const activeGlobalToks = karaokeEnabled
      ? Math.max(1, Math.ceil(Math.min(1, isPlayingSpeech ? beatProgress / 0.86 : 1) * totalToks))
      : totalToks;

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
      tokenizedLines,
      activeGlobalToks,
      tailBaseL,
      tailBaseR,
      tailTipX,
      tailY: bubbleY + bubbleH,
      bgColor: focusRig.profile.bubbleBgHex,
      borderColor: focusRig.profile.bubbleBorderHex,
      activeKaraokeColor: resolveBubbleKaraokeColor(
        highlightColor,
        focusRig.profile.bubbleBorderHex
      ),
    };
  }

  let runningTokIdx = 0;

  return (
    <svg
      data-testid="anime-story-stage"
      data-beat-index={safeBeatIdx}
      data-room={beat.roomKind}
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
        transform={`translate(${(width / 2 + focusDx).toFixed(1)},${(height / 2 + focusDy).toFixed(
          1
        )}) scale(${camScale.toFixed(3)}) translate(${(-width / 2).toFixed(1)},${(-height / 2).toFixed(1)})`}
      >
        <AnimeRoomBackdropSvg
          width={width}
          height={height}
          beat={beat}
          sceneStyle={sceneStyle}
          timeSec={animState.timeSec}
          beatProgress={beatProgress}
        />

        {/* Present Cast */}
        {sortedRigs.map((rig) => (
          <AnimeCharacterSvg
            key={rig.profile.id}
            rig={rig}
            timeSec={animState.timeSec}
            fontCss={fontCss}
          />
        ))}
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

      {/* Compact Text-Hugging Speech Bubble with Karaoke */}
      {bubbleGeom && (
        <g data-testid="anime-speech-bubble" data-karaoke={karaokeEnabled ? 'on' : 'off'}>
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
            points={`${bubbleGeom.tailBaseL},${bubbleGeom.tailY - 2} ${bubbleGeom.tailBaseR},${
              bubbleGeom.tailY - 2
            } ${bubbleGeom.tailTipX},${bubbleGeom.tailY + 18}`}
            fill={bubbleGeom.bgColor}
          />
          <polyline
            points={`${bubbleGeom.tailBaseL},${bubbleGeom.tailY} ${bubbleGeom.tailTipX},${
              bubbleGeom.tailY + 18
            } ${bubbleGeom.tailBaseR},${bubbleGeom.tailY}`}
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
          {bubbleGeom.tokenizedLines.map((toks, idx) => {
            const yPos =
              bubbleGeom!.bubbleY +
              bubbleGeom!.padY +
              bubbleGeom!.noteExtraH +
              Math.round(bubbleGeom!.fontSize * 0.88) +
              idx * bubbleGeom!.lineHeight;

            if (!karaokeEnabled) {
              return (
                <text
                  key={idx}
                  x={bubbleGeom!.bubbleX + bubbleGeom!.padX}
                  y={yPos}
                  fontFamily={fontCss}
                  fontSize={bubbleGeom!.fontSize}
                  fontWeight="700"
                  fill="#0F172A"
                >
                  {bubbleGeom!.lines[idx]}
                </text>
              );
            }

            let litText = '';
            let unlitText = '';
            for (const tok of toks) {
              if (runningTokIdx < bubbleGeom!.activeGlobalToks) {
                litText += tok;
              } else {
                unlitText += tok;
              }
              runningTokIdx++;
            }

            return (
              <text
                key={idx}
                x={bubbleGeom!.bubbleX + bubbleGeom!.padX}
                y={yPos}
                fontFamily={fontCss}
                fontSize={bubbleGeom!.fontSize}
                fontWeight="800"
              >
                {litText && (
                  <tspan
                    data-testid="anime-bubble-karaoke-lit"
                    fill={bubbleGeom!.activeKaraokeColor}
                  >
                    {litText}
                  </tspan>
                )}
                {unlitText && <tspan fill="#334155">{unlitText}</tspan>}
              </text>
            );
          })}
        </g>
      )}
    </svg>
  );
};
