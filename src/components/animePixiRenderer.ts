import { Container, Graphics, Text } from 'pixi.js';
import { AnimeRoomKind, AnimeSceneStyle, SubtitleEffect } from '../shared/types';
import {
  AnimeCharacterProfile,
  AnimeEmotion,
  AnimeFxKind,
  AnimeHandProp,
  AnimeStoryboardBeat,
  ComputedCharRig,
  getAnimeThemePalette,
  resolveBubbleKaraokeColor,
  tokenizeAnimeKaraokeLine,
  wrapAnimeBubbleLines,
} from '../shared/animeStoryEngine';

const DEG2RAD = Math.PI / 180;
const LINE_INK = 0x1e1b18;

export function hexToPixi(hex: string, fallback = 0xffffff): number {
  const clean = (hex ?? '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return fallback;
  return parseInt(clean, 16);
}

export function approxBubbleTextUnits(text: string): number {
  let u = 0;
  for (const ch of Array.from(text)) {
    if (/[\u3000-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/.test(ch)) u += 1.02;
    else if (/[A-Z0-9@#%&MW]/.test(ch)) u += 0.72;
    else if (/[iljtfrI1!.,:;'"|()（）「」]/.test(ch)) u += 0.36;
    else u += 0.56;
  }
  return u;
}

// ============================================================================
// Hierarchical 2D Skeletal Character Rig (Joint-Pivoted Containers + Secondary Motion)
// ============================================================================

export interface PixiCharRigHandle {
  profile: AnimeCharacterProfile;
  root: Container;
  shadow: Graphics;
  poseFlip: Container;
  backThigh: Container;
  backShin: Container;
  frontThigh: Container;
  frontShin: Container;
  pelvis: Container;
  torso: Container;
  backUpperArm: Container;
  backForearm: Container;
  frontUpperArm: Container;
  frontForearm: Container;
  handPropContainer: Container;
  neckHead: Container;
  backHair: Container;
  frontHair: Container;
  leftEye: Container;
  rightEye: Container;
  leftEyeGfx: Graphics;
  rightEyeGfx: Graphics;
  browsGfx: Graphics;
  mouthGfx: Graphics;
  fxContainer: Container;
  fxGfx: Graphics;
  nameTag: Container;
  lastHandProp: AnimeHandProp | null;
  lastFaceKey: string;
  lastMouthKey: string;
}

function createLegBone(
  upperFill: number,
  lowerFill: number,
  shoeFill: number,
  hipX: number,
  isBack: boolean
): { thigh: Container; shin: Container } {
  const thigh = new Container();
  thigh.position.set(hipX, -82);
  thigh.alpha = isBack ? 0.92 : 1;

  const thighGfx = new Graphics();
  thighGfx
    .roundRect(-9, -2, 18, 44, 9)
    .fill({ color: upperFill })
    .stroke({ width: 2.4, color: LINE_INK });
  thigh.addChild(thighGfx);

  const shin = new Container();
  shin.position.set(0, 40);
  const shinGfx = new Graphics();
  shinGfx
    .roundRect(-8, -2, 16, 40, 8)
    .fill({ color: lowerFill })
    .stroke({ width: 2.4, color: LINE_INK });
  shinGfx
    .moveTo(-9, 36)
    .lineTo(14, 36)
    .bezierCurveTo(19, 36, 21, 44, 14, 45)
    .lineTo(-9, 45)
    .bezierCurveTo(-12, 45, -12, 36, -9, 36)
    .closePath()
    .fill({ color: shoeFill })
    .stroke({ width: 2.2, color: LINE_INK });
  shinGfx
    .moveTo(-8, 43)
    .lineTo(15, 43)
    .stroke({ width: 1.6, color: 0xffffff, alpha: 0.45 });
  shin.addChild(shinGfx);
  thigh.addChild(shin);

  return { thigh, shin };
}

function createArmBone(
  outfitFill: number,
  skinFill: number,
  shoulderX: number
): { upperArm: Container; forearm: Container; propAnchor: Container } {
  const upperArm = new Container();
  upperArm.position.set(shoulderX, -70);

  const upperGfx = new Graphics();
  upperGfx
    .roundRect(-8, 0, 16, 38, 8)
    .fill({ color: outfitFill })
    .stroke({ width: 2.4, color: LINE_INK });
  upperArm.addChild(upperGfx);

  const forearm = new Container();
  forearm.position.set(0, 34);
  const foreGfx = new Graphics();
  foreGfx
    .roundRect(-7, 0, 14, 32, 7)
    .fill({ color: outfitFill })
    .stroke({ width: 2.4, color: LINE_INK });
  foreGfx
    .circle(0, 34, 7.5)
    .fill({ color: skinFill })
    .stroke({ width: 2.2, color: LINE_INK });
  forearm.addChild(foreGfx);

  const propAnchor = new Container();
  forearm.addChild(propAnchor);
  upperArm.addChild(forearm);

  return { upperArm, forearm, propAnchor };
}

function drawHandProp(container: Container, prop: AnimeHandProp): void {
  container.removeChildren().forEach((c) => c.destroy());
  if (prop === 'none' || prop === 'cup_mouth') return;
  const g = new Graphics();
  if (prop === 'coffee_cup') {
    g.position.set(4, 34);
    g.roundRect(-8, -12, 16, 18, 3)
      .fill({ color: 0xfffbeb })
      .stroke({ width: 2, color: LINE_INK });
    g.roundRect(-9, -15, 18, 5, 2)
      .fill({ color: 0x78350f })
      .stroke({ width: 1.6, color: LINE_INK });
    g.rect(-8, -6, 16, 6).fill({ color: 0xd97706, alpha: 0.78 });
  } else if (prop === 'popsicle_box') {
    g.position.set(8, 32);
    g.roundRect(-15, -11, 30, 20, 4)
      .fill({ color: 0x38bdf8 })
      .stroke({ width: 2, color: 0x0369a1 });
    g.roundRect(-10, -6, 20, 10, 2).fill({ color: 0xe0f2fe });
    g.moveTo(-6, -1).lineTo(6, -1).stroke({ width: 2.2, color: 0x0284c7 });
  } else if (prop === 'beer_case') {
    g.position.set(10, 30);
    g.roundRect(-17, -13, 34, 24, 4)
      .fill({ color: 0xfbbf24 })
      .stroke({ width: 2.2, color: 0x92400e });
    g.roundRect(-11, -8, 22, 12, 2).fill({ color: 0xfef3c7 });
    g.circle(-4, -2, 3.5).fill({ color: 0xb45309 });
    g.circle(5, -2, 3.5).fill({ color: 0xb45309 });
  } else if (prop === 'clipboard') {
    g.position.set(6, 34);
    g.roundRect(-11, -15, 22, 28, 3)
      .fill({ color: 0xffffff })
      .stroke({ width: 2, color: 0x334155 });
    g.roundRect(-6, -18, 12, 5, 2).fill({ color: 0x64748b });
    g.moveTo(-7, -6).lineTo(7, -6).stroke({ width: 2, color: 0x94a3b8 });
    g.moveTo(-7, 0).lineTo(7, 0).stroke({ width: 2, color: 0x94a3b8 });
    g.moveTo(-7, 6).lineTo(4, 6).stroke({ width: 2, color: 0x94a3b8 });
  }
  container.addChild(g);
}

export function createPixiCharacterRig(
  profile: AnimeCharacterProfile,
  fontCss: string
): PixiCharRigHandle {
  const skinFill = hexToPixi(profile.skinHex, 0xfce3d0);
  const hairFill = hexToPixi(profile.hairHex, 0x1e293b);
  const hairShadeFill = hexToPixi(profile.hairShadeHex, 0x0f172a);
  const outfitFill = hexToPixi(profile.outfitHex, 0x4f46e5);
  const outfitAccentFill = hexToPixi(profile.outfitAccentHex, 0xe0e7ff);
  const pantsFill = hexToPixi(profile.pantsHex, 0x1e293b);
  const shoeFill = hexToPixi(profile.shoeHex, 0x0f172a);
  const badgeFill = hexToPixi(profile.nameBadgeHex, 0x4338ca);

  const root = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0, 4, 46, 9).fill({ color: 0x0f172a, alpha: 0.2 });
  root.addChild(shadow);

  const poseFlip = new Container();
  root.addChild(poseFlip);

  const legUpperFill = profile.gender === 'female' ? skinFill : pantsFill;
  const legLowerFill = profile.gender === 'female' ? 0xf8fafc : pantsFill;
  const backLeg = createLegBone(legUpperFill, legLowerFill, shoeFill, -14, true);
  const frontLeg = createLegBone(legUpperFill, legLowerFill, shoeFill, 14, false);
  poseFlip.addChild(backLeg.thigh, frontLeg.thigh);

  const pelvis = new Container();
  const pelvisGfx = new Graphics();
  if (profile.gender === 'female') {
    pelvisGfx
      .moveTo(-32, -88)
      .lineTo(32, -88)
      .lineTo(40, -48)
      .bezierCurveTo(18, -43, -18, -43, -40, -48)
      .closePath()
      .fill({ color: pantsFill })
      .stroke({ width: 2.6, color: LINE_INK, join: 'round' });
    pelvisGfx.moveTo(-14, -84).lineTo(-18, -46).stroke({ width: 1.8, color: 0x334155 });
    pelvisGfx.moveTo(0, -84).lineTo(0, -45).stroke({ width: 1.8, color: 0x334155 });
    pelvisGfx.moveTo(14, -84).lineTo(18, -46).stroke({ width: 1.8, color: 0x334155 });
  } else {
    pelvisGfx
      .poly([-30, -88, 30, -88, 32, -70, -32, -70])
      .fill({ color: pantsFill })
      .stroke({ width: 2.4, color: LINE_INK });
  }
  pelvis.addChild(pelvisGfx);
  poseFlip.addChild(pelvis);

  const torso = new Container();
  torso.position.set(0, -82);
  poseFlip.addChild(torso);

  const backArm = createArmBone(outfitFill, skinFill, -26);
  torso.addChild(backArm.upperArm);

  const torsoMesh = new Graphics();
  torsoMesh
    .moveTo(-33, -74)
    .bezierCurveTo(-35, -86, -20, -90, 0, -90)
    .bezierCurveTo(20, -90, 35, -86, 33, -74)
    .lineTo(35, 2)
    .bezierCurveTo(35, 8, 28, 11, 22, 11)
    .lineTo(-22, 11)
    .bezierCurveTo(-28, 11, -35, 8, -35, 2)
    .closePath()
    .fill({ color: outfitFill })
    .stroke({ width: 2.8, color: LINE_INK });
  torsoMesh
    .poly([-13, -88, 0, -62, 13, -88])
    .fill({ color: outfitAccentFill })
    .stroke({ width: 2, color: LINE_INK });
  torsoMesh
    .moveTo(0, -62)
    .lineTo(0, 8)
    .stroke({ width: 2, color: outfitAccentFill, alpha: 0.65 });
  torso.addChild(torsoMesh);

  // Neck & Head Group
  const neckHead = new Container();
  neckHead.position.set(0, -84);
  torso.addChild(neckHead);

  const neckGfx = new Graphics();
  neckGfx
    .roundRect(-10, -12, 20, 22, 8)
    .fill({ color: skinFill })
    .stroke({ width: 2.4, color: LINE_INK });
  neckHead.addChild(neckGfx);

  const headLocal = new Container();
  headLocal.position.set(0, 84);
  neckHead.addChild(headLocal);

  // Back hair with pivot at upper head (-148) for secondary overlapping sway
  const backHair = new Container();
  backHair.position.set(0, -148);
  if (profile.hairStyle === 'bob') {
    const bhGfx = new Graphics();
    bhGfx
      .moveTo(-46, 12)
      .bezierCurveTo(-56, 38, -56, 76, -44, 92)
      .lineTo(44, 92)
      .bezierCurveTo(56, 76, 56, 38, 46, 12)
      .closePath()
      .fill({ color: hairShadeFill })
      .stroke({ width: 2.6, color: LINE_INK });
    backHair.addChild(bhGfx);
  }
  headLocal.addChild(backHair);

  const faceGfx = new Graphics();
  faceGfx
    .circle(-41, -124, 8)
    .fill({ color: skinFill })
    .stroke({ width: 2.2, color: LINE_INK });
  faceGfx
    .circle(41, -124, 8)
    .fill({ color: skinFill })
    .stroke({ width: 2.2, color: LINE_INK });
  faceGfx
    .moveTo(-40, -142)
    .bezierCurveTo(-42, -106, -22, -84, 0, -84)
    .bezierCurveTo(22, -84, 42, -106, 40, -142)
    .bezierCurveTo(38, -174, 22, -188, 0, -188)
    .bezierCurveTo(-22, -188, -38, -174, -40, -142)
    .closePath()
    .fill({ color: skinFill })
    .stroke({ width: 2.6, color: LINE_INK });
  faceGfx.ellipse(-24, -108, 7, 3.5).fill({ color: 0xfda4af, alpha: 0.45 });
  faceGfx.ellipse(24, -108, 7, 3.5).fill({ color: 0xfda4af, alpha: 0.45 });
  faceGfx
    .moveTo(0, -114)
    .lineTo(3, -107)
    .stroke({ width: 2, color: 0xc28e70, cap: 'round' });
  headLocal.addChild(faceGfx);

  const leftEye = new Container();
  leftEye.position.set(-17, -122);
  const leftEyeGfx = new Graphics();
  leftEye.addChild(leftEyeGfx);

  const rightEye = new Container();
  rightEye.position.set(17, -122);
  const rightEyeGfx = new Graphics();
  rightEye.addChild(rightEyeGfx);

  const browsGfx = new Graphics();
  const mouthGfx = new Graphics();
  headLocal.addChild(leftEye, rightEye, browsGfx, mouthGfx);

  const frontHair = new Container();
  frontHair.position.set(0, -165);
  const fhGfx = new Graphics();
  if (profile.hairStyle === 'spiky') {
    fhGfx
      .moveTo(-44, 19)
      .bezierCurveTo(-44, -21, -14, -37, 8, -31)
      .bezierCurveTo(32, -31, 48, -11, 46, 21)
      .bezierCurveTo(42, 11, 32, 3, 24, 13)
      .bezierCurveTo(14, 0, 0, 15, -8, 1)
      .bezierCurveTo(-18, 17, -32, 7, -44, 19)
      .closePath()
      .fill({ color: hairFill })
      .stroke({ width: 2.6, color: LINE_INK, join: 'round' });
    fhGfx
      .moveTo(-36, -19)
      .lineTo(-48, -35)
      .lineTo(-22, -25)
      .lineTo(-8, -43)
      .lineTo(6, -25)
      .lineTo(28, -39)
      .lineTo(26, -17)
      .fill({ color: hairFill })
      .stroke({ width: 2.4, color: LINE_INK, join: 'round' });
  } else if (profile.hairStyle === 'bob') {
    fhGfx
      .moveTo(-47, 23)
      .bezierCurveTo(-48, -23, -16, -37, 0, -37)
      .bezierCurveTo(18, -37, 48, -23, 47, 23)
      .bezierCurveTo(36, 9, 22, 5, 12, 17)
      .bezierCurveTo(2, 5, -12, 5, -22, 17)
      .bezierCurveTo(-32, 9, -40, 11, -47, 23)
      .closePath()
      .fill({ color: hairFill })
      .stroke({ width: 2.6, color: LINE_INK, join: 'round' });
    const clip = new Graphics();
    clip.roundRect(-6, -2.5, 12, 5, 2.5).fill({ color: 0xf43f5e });
    clip.position.set(32, 9);
    clip.rotation = -18 * DEG2RAD;
    frontHair.addChild(clip);
  } else {
    fhGfx
      .moveTo(-45, 21)
      .bezierCurveTo(-46, -21, -16, -37, 4, -35)
      .bezierCurveTo(28, -33, 48, -15, 45, 21)
      .bezierCurveTo(34, 9, 22, 19, 12, 5)
      .bezierCurveTo(2, 21, -10, 7, -22, 19)
      .bezierCurveTo(-32, 7, -40, 13, -45, 21)
      .closePath()
      .fill({ color: hairFill })
      .stroke({ width: 2.6, color: LINE_INK, join: 'round' });
  }
  frontHair.addChildAt(fhGfx, 0);
  headLocal.addChild(frontHair);

  const frontArm = createArmBone(outfitFill, skinFill, 26);
  torso.addChild(frontArm.upperArm);

  const fxContainer = new Container();
  const fxGfx = new Graphics();
  fxContainer.addChild(fxGfx);
  root.addChild(fxContainer);

  const nameTag = new Container();
  nameTag.position.set(0, 24);
  const tagBg = new Graphics();
  tagBg
    .roundRect(-40, -12, 80, 22, 11)
    .fill({ color: badgeFill })
    .stroke({ width: 1.8, color: 0xffffff });
  const tagText = new Text({
    text: profile.displayName,
    style: {
      fontFamily: fontCss,
      fontSize: 12,
      fontWeight: '800',
      fill: 0xffffff,
    },
  });
  tagText.anchor.set(0.5, 0.5);
  tagText.position.set(0, -1);
  nameTag.addChild(tagBg, tagText);
  root.addChild(nameTag);

  return {
    profile,
    root,
    shadow,
    poseFlip,
    backThigh: backLeg.thigh,
    backShin: backLeg.shin,
    frontThigh: frontLeg.thigh,
    frontShin: frontLeg.shin,
    pelvis,
    torso,
    backUpperArm: backArm.upperArm,
    backForearm: backArm.forearm,
    frontUpperArm: frontArm.upperArm,
    frontForearm: frontArm.forearm,
    handPropContainer: frontArm.propAnchor,
    neckHead,
    backHair,
    frontHair,
    leftEye,
    rightEye,
    leftEyeGfx,
    rightEyeGfx,
    browsGfx,
    mouthGfx,
    fxContainer,
    fxGfx,
    nameTag,
    lastHandProp: null,
    lastFaceKey: '',
    lastMouthKey: '',
  };
}

function redrawEyesAndBrows(
  handle: PixiCharRigHandle,
  emotion: AnimeEmotion,
  isBowDeep: boolean,
  lookOffsetX: number
): void {
  const { leftEyeGfx, rightEyeGfx, browsGfx } = handle;
  leftEyeGfx.clear();
  rightEyeGfx.clear();
  browsGfx.clear();

  if (emotion === 'apologetic' && isBowDeep) {
    leftEyeGfx
      .moveTo(-7, -6)
      .lineTo(7, 0)
      .lineTo(-7, 6)
      .stroke({ width: 3.2, color: LINE_INK, cap: 'round', join: 'round' });
    rightEyeGfx
      .moveTo(7, -6)
      .lineTo(-7, 0)
      .lineTo(7, 6)
      .stroke({ width: 3.2, color: LINE_INK, cap: 'round', join: 'round' });
  } else if (emotion === 'happy' || emotion === 'wry_smile') {
    leftEyeGfx
      .moveTo(-9, 2)
      .quadraticCurveTo(0, -9, 9, 2)
      .stroke({ width: 3.2, color: LINE_INK, cap: 'round' });
    rightEyeGfx
      .moveTo(-9, 2)
      .quadraticCurveTo(0, -9, 9, 2)
      .stroke({ width: 3.2, color: LINE_INK, cap: 'round' });
  } else {
    const irisR = emotion === 'shocked' ? 5.2 : 7.6;
    for (const g of [leftEyeGfx, rightEyeGfx]) {
      g.ellipse(0, 0, 9, 10.5)
        .fill({ color: 0xffffff })
        .stroke({ width: 2.2, color: LINE_INK });
      g.circle(lookOffsetX, 1, irisR).fill({ color: 0x1e293b });
      g.circle(lookOffsetX - 2.4, -2.8, 2.6).fill({ color: 0xffffff });
    }
  }

  if (emotion === 'angry') {
    browsGfx.moveTo(-29, -141).lineTo(-7, -132).stroke({ width: 3.5, color: LINE_INK, cap: 'round' });
    browsGfx.moveTo(29, -141).lineTo(7, -132).stroke({ width: 3.5, color: LINE_INK, cap: 'round' });
  } else if (emotion === 'apologetic' || emotion === 'wry_smile') {
    browsGfx.moveTo(-28, -134).lineTo(-8, -141).stroke({ width: 3, color: LINE_INK, cap: 'round' });
    browsGfx.moveTo(28, -134).lineTo(8, -141).stroke({ width: 3, color: LINE_INK, cap: 'round' });
  } else if (emotion === 'shocked') {
    browsGfx
      .moveTo(-27, -144)
      .quadraticCurveTo(-17, -151, -7, -144)
      .stroke({ width: 3, color: LINE_INK, cap: 'round' });
    browsGfx
      .moveTo(7, -144)
      .quadraticCurveTo(17, -151, 27, -144)
      .stroke({ width: 3, color: LINE_INK, cap: 'round' });
  } else {
    browsGfx
      .moveTo(-27, -139)
      .quadraticCurveTo(-17, -143, -8, -139)
      .stroke({ width: 2.8, color: LINE_INK, cap: 'round' });
    browsGfx
      .moveTo(8, -139)
      .quadraticCurveTo(17, -143, 27, -139)
      .stroke({ width: 2.8, color: LINE_INK, cap: 'round' });
  }
}

function redrawMouth(handle: PixiCharRigHandle, rig: ComputedCharRig): void {
  const { mouthGfx } = handle;
  mouthGfx.clear();

  if (rig.isSpeaking && rig.mouthPhase > 0.14) {
    const mh =
      rig.mouthViseme === 'i'
        ? 2.6 + rig.mouthPhase * 4.5
        : rig.mouthViseme === 'o' || rig.mouthViseme === 'u'
        ? 4.2 + rig.mouthPhase * 7.8
        : 3.5 + rig.mouthPhase * 9.5;
    const mw =
      rig.mouthViseme === 'i' || rig.mouthViseme === 'e'
        ? 7.8 + rig.mouthPhase * 3.5
        : rig.mouthViseme === 'u' || rig.mouthViseme === 'o'
        ? 4.2 + rig.mouthPhase * 2.8
        : 5.5 + (1 - rig.mouthPhase * 0.3) * 5.0;
    mouthGfx
      .ellipse(0, -96, mw, mh)
      .fill({ color: 0x9f1239 })
      .stroke({ width: 2.2, color: LINE_INK });
    mouthGfx.ellipse(0, -96 + mh * 0.45, mw * 0.65, mh * 0.35).fill({ color: 0xfb7185 });
  } else if (rig.emotion === 'happy') {
    mouthGfx
      .moveTo(-10, -99)
      .quadraticCurveTo(0, -89, 10, -99)
      .stroke({ width: 2.8, color: LINE_INK, cap: 'round' });
  } else if (rig.emotion === 'angry') {
    mouthGfx
      .moveTo(-10, -94)
      .quadraticCurveTo(0, -101, 10, -94)
      .stroke({ width: 2.8, color: LINE_INK, cap: 'round' });
  } else if (rig.emotion === 'shocked') {
    mouthGfx
      .ellipse(0, -95, 6, 8)
      .fill({ color: 0x9f1239 })
      .stroke({ width: 2.2, color: LINE_INK });
  } else if (rig.emotion === 'wry_smile') {
    mouthGfx
      .moveTo(-9, -97)
      .quadraticCurveTo(-2, -91, 9, -98)
      .stroke({ width: 2.6, color: LINE_INK, cap: 'round' });
  } else {
    mouthGfx
      .moveTo(-7, -96)
      .quadraticCurveTo(0, -93, 7, -96)
      .stroke({ width: 2.6, color: LINE_INK, cap: 'round' });
  }
}

function redrawComicFx(
  gfx: Graphics,
  fx: AnimeFxKind,
  facing: 1 | -1,
  hipDropY: number,
  timeSec: number
): void {
  gfx.clear();
  if (fx === 'none') return;

  if (fx === 'anger_cross') {
    const pulse = 1 + Math.sin(timeSec * 12) * 0.16;
    gfx.position.set(38, -252 + hipDropY);
    gfx.scale.set(pulse);
    gfx
      .moveTo(-9, -3)
      .quadraticCurveTo(-3, -3, -3, -9)
      .moveTo(3, -9)
      .quadraticCurveTo(3, -3, 9, -3)
      .moveTo(9, 3)
      .quadraticCurveTo(3, 3, 3, 9)
      .moveTo(-3, 9)
      .quadraticCurveTo(-3, 3, -9, 3)
      .stroke({ width: 3.4, color: 0xef4444, cap: 'round' });
  } else if (fx === 'sweat') {
    const dropY = (timeSec * 18) % 10;
    gfx.position.set(-42, -230 + hipDropY + dropY);
    gfx.scale.set(1);
    gfx
      .moveTo(0, -10)
      .bezierCurveTo(5, -2, 7, 3, 7, 6)
      .arc(0, 6, 7, 0, Math.PI)
      .bezierCurveTo(-7, 3, -5, -2, 0, -10)
      .closePath()
      .fill({ color: 0x38bdf8 })
      .stroke({ width: 2, color: 0x0284c7 });
  } else if (fx === 'shock_burst') {
    const pop = 1 + Math.sin(timeSec * 15) * 0.14;
    gfx.position.set(40 * facing, -256 + hipDropY);
    gfx.scale.set(pop);
    gfx.moveTo(-4, -16).lineTo(-4, 2).stroke({ width: 4.5, color: 0xef4444, cap: 'round' });
    gfx.circle(-4, 10, 2.8).fill({ color: 0xef4444 });
    gfx.moveTo(8, -13).lineTo(12, 3).stroke({ width: 3.6, color: 0xf59e0b, cap: 'round' });
  } else if (fx === 'whisper_wave') {
    const wShift = Math.sin(timeSec * 8) * 3;
    gfx.position.set(38 * facing, -192 + hipDropY + wShift);
    gfx.scale.set(1);
    gfx
      .moveTo(0, -8)
      .quadraticCurveTo(10 * facing, 0, 0, 8)
      .stroke({ width: 2.6, color: 0x0d9488, cap: 'round' });
    gfx
      .moveTo(7 * facing, -12)
      .quadraticCurveTo(19 * facing, 0, 7 * facing, 12)
      .stroke({ width: 2.4, color: 0x0d9488, alpha: 0.7, cap: 'round' });
  } else if (fx === 'sparkle') {
    const spin = 0.85 + 0.25 * Math.sin(timeSec * 7);
    gfx.position.set(38, -250 + hipDropY);
    gfx.scale.set(spin);
    gfx
      .poly([0, -11, 3, -3, 11, 0, 3, 3, 0, 11, -3, 3, -11, 0, -3, -3])
      .fill({ color: 0xfbbf24 })
      .stroke({ width: 1.6, color: 0xd97706 });
  }
}

export function updatePixiCharacterRig(
  handle: PixiCharRigHandle,
  rig: ComputedCharRig,
  timeSec: number
): void {
  handle.root.position.set(rig.x, rig.y);
  handle.root.scale.set(rig.scale * rig.squashX, rig.scale * rig.squashY);
  handle.root.alpha = rig.opacity;
  handle.poseFlip.scale.set(rig.facing, 1);

  // Subtle shadow squash when character hops
  handle.shadow.scale.set(1 / Math.max(0.85, rig.squashY), 1);

  // Legs
  handle.backThigh.position.set(-14, -82 + rig.hipDropY);
  handle.backThigh.rotation = rig.leftThighAngle * DEG2RAD;
  handle.backShin.rotation = rig.leftShinAngle * DEG2RAD;

  handle.frontThigh.position.set(14, -82 + rig.hipDropY);
  handle.frontThigh.rotation = rig.rightThighAngle * DEG2RAD;
  handle.frontShin.rotation = rig.rightShinAngle * DEG2RAD;

  // Pelvis & Torso
  handle.pelvis.position.set(0, rig.hipDropY);
  handle.torso.position.set(0, -82 + rig.hipDropY + rig.shoulderBreathY * 0.45);
  handle.torso.rotation = rig.bodyTiltDeg * DEG2RAD;

  // Arms
  handle.backUpperArm.position.set(-26, -70 + rig.shoulderBreathY * 0.5);
  handle.backUpperArm.rotation = rig.leftArmAngle * DEG2RAD;
  handle.backForearm.rotation = rig.leftForearmAngle * DEG2RAD;

  handle.frontUpperArm.position.set(26, -70 + rig.shoulderBreathY * 0.5);
  handle.frontUpperArm.rotation = rig.rightArmAngle * DEG2RAD;
  handle.frontForearm.rotation = rig.rightForearmAngle * DEG2RAD;

  if (handle.lastHandProp !== rig.handProp) {
    handle.lastHandProp = rig.handProp;
    drawHandProp(handle.handPropContainer, rig.handProp);
  }

  // Head & Secondary Hair Overlapping Motion
  handle.neckHead.rotation = rig.headTiltDeg * DEG2RAD;
  handle.backHair.rotation = rig.hairSwayDeg * 0.65 * DEG2RAD;
  handle.frontHair.rotation = rig.hairSwayDeg * 0.45 * DEG2RAD;

  // Blink scaling
  const eyeScaleY = Math.max(0.08, 1 - rig.blinkAmt);
  const canBlink = !(rig.emotion === 'apologetic' && rig.action === 'bow_deep') &&
    rig.emotion !== 'happy' &&
    rig.emotion !== 'wry_smile';
  handle.leftEye.scale.set(1, canBlink ? eyeScaleY : 1);
  handle.rightEye.scale.set(1, canBlink ? eyeScaleY : 1);

  const faceKey = `${rig.emotion}_${rig.action === 'bow_deep' ? 1 : 0}_${rig.lookOffsetX.toFixed(1)}`;
  if (handle.lastFaceKey !== faceKey) {
    handle.lastFaceKey = faceKey;
    redrawEyesAndBrows(handle, rig.emotion, rig.action === 'bow_deep', rig.lookOffsetX);
  }

  const mouthKey = rig.isSpeaking
    ? `s_${rig.mouthViseme}_${Math.round(rig.mouthPhase * 20)}`
    : `i_${rig.emotion}`;
  if (handle.lastMouthKey !== mouthKey) {
    handle.lastMouthKey = mouthKey;
    redrawMouth(handle, rig);
  }

  redrawComicFx(handle.fxGfx, rig.fx, rig.facing, rig.hipDropY, timeSec);
}

// ============================================================================
// Multi-Room Backdrop Renderer (PixiJS v8 Graphics)
// ============================================================================

function drawFridge(
  g: Graphics,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
  open: boolean
): void {
  g.roundRect(fx, fy, fw, fh, 8)
    .fill({ color: 0xf8fafc })
    .stroke({ width: 3.5, color: 0x475569 });
  g.moveTo(fx, fy + Math.round(fh * 0.36))
    .lineTo(fx + fw, fy + Math.round(fh * 0.36))
    .stroke({ width: 2.5, color: 0x64748b });
  g.roundRect(fx + fw - 14, fy + Math.round(fh * 0.12), 5, Math.round(fh * 0.16), 2).fill({
    color: 0x94a3b8,
  });
  g.roundRect(fx + fw - 14, fy + Math.round(fh * 0.44), 5, Math.round(fh * 0.22), 2).fill({
    color: 0x94a3b8,
  });

  if (open) {
    g.roundRect(fx + 6, fy + 6, Math.max(12, fw - 12), Math.round(fh * 0.28), 3).fill({
      color: 0xe0f2fe,
    });
    g.moveTo(fx + 8, fy + Math.round(fh * 0.2))
      .lineTo(fx + fw - 8, fy + Math.round(fh * 0.2))
      .stroke({ width: 2, color: 0x7dd3fc });
    g.poly([
      fx + fw,
      fy,
      fx + fw + Math.round(fw * 0.45),
      fy - 8,
      fx + fw + Math.round(fw * 0.45),
      fy + Math.round(fh * 0.38),
      fx + fw,
      fy + Math.round(fh * 0.36),
    ])
      .fill({ color: 0xffffff })
      .stroke({ width: 2.8, color: 0x475569 });
  }
}

export function drawPixiRoomBackdrop(
  layer: Container,
  width: number,
  height: number,
  beat: AnimeStoryboardBeat,
  sceneStyle: AnimeSceneStyle,
  timeSec: number,
  beatProgress: number
): void {
  layer.removeChildren().forEach((c) => c.destroy());
  const g = new Graphics();
  layer.addChild(g);

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

  if (room === 'cafe_corner') {
    const winX = Math.round(width * 0.06);
    const winY = Math.round(horizonY * 0.2);
    const winW = Math.round(width * 0.34);
    const winH = Math.round(horizonY * 0.48);
    g.rect(0, 0, width, horizonY).fill({ color: 0xfef3c7 });
    g.rect(0, Math.round(horizonY * 0.65), width, Math.round(horizonY * 0.35)).fill({
      color: 0xd6b48c,
    });
    g.rect(0, horizonY, width, floorH).fill({ color: 0x9a6b42 });
    g.roundRect(winX, winY, winW, winH, 6)
      .fill({ color: 0xbae6fd })
      .stroke({ width: 5, color: 0x78350f });
    g.ellipse(winX + Math.round(winW * 0.3) + cloudDrift * 0.4, winY + 32, 28, 12).fill({
      color: 0xffffff,
      alpha: 0.85,
    });
    g.moveTo(winX + 10, winY + winH)
      .quadraticCurveTo(winX + winW * 0.25, winY + winH * 0.55, winX + winW * 0.5, winY + winH)
      .closePath()
      .fill({ color: 0x86efac });
    g.moveTo(winX + Math.round(winW * 0.5), winY)
      .lineTo(winX + Math.round(winW * 0.5), winY + winH)
      .stroke({ width: 3.5, color: 0x78350f });

    for (const rx of [0.34, 0.66]) {
      const lx = Math.round(width * rx);
      const sway = Math.sin(timeSec * 1.4 + rx * 4) * 3;
      g.moveTo(lx, 0)
        .lineTo(lx + sway, Math.round(horizonY * 0.16))
        .stroke({ width: 3, color: 0x451a03 });
      g.poly([
        lx - 20 + sway,
        Math.round(horizonY * 0.21),
        lx + 20 + sway,
        Math.round(horizonY * 0.21),
        lx + 11 + sway,
        Math.round(horizonY * 0.16),
        lx - 11 + sway,
        Math.round(horizonY * 0.16),
      ])
        .fill({ color: 0xf59e0b })
        .stroke({ width: 2.5, color: 0x78350f });
    }

    g.roundRect(
      Math.round(width * 0.46),
      Math.round(horizonY * 0.25),
      Math.round(width * 0.24),
      Math.round(horizonY * 0.3),
      5
    )
      .fill({ color: 0x1e293b })
      .stroke({ width: 5, color: 0x78350f });
    const menuTxt = new Text({
      text: 'CAFE MENU',
      style: { fontSize: 13, fontWeight: '800', fill: 0xfde68a },
    });
    menuTxt.anchor.set(0.5, 0.5);
    menuTxt.position.set(Math.round(width * 0.58), Math.round(horizonY * 0.34));
    layer.addChild(menuTxt);
    g.moveTo(Math.round(width * 0.5), Math.round(horizonY * 0.41))
      .lineTo(Math.round(width * 0.66), Math.round(horizonY * 0.41))
      .stroke({ width: 2, color: 0x94a3b8 });
    g.moveTo(Math.round(width * 0.5), Math.round(horizonY * 0.47))
      .lineTo(Math.round(width * 0.63), Math.round(horizonY * 0.47))
      .stroke({ width: 2, color: 0x94a3b8 });

    g.rect(doorX, doorY, doorW, doorH)
      .fill({ color: 0x334155 })
      .stroke({ width: 4, color: 0x451a03 });
    g.rect(doorX - doorSlidePx, doorY, doorW, doorH)
      .fill({ color: 0xe0f2fe, alpha: 0.88 })
      .stroke({ width: 4, color: 0x78350f });
  } else if (room === 'office_desk') {
    const winX = Math.round(width * 0.06);
    const winY = Math.round(horizonY * 0.18);
    const winW = Math.round(width * 0.36);
    const winH = Math.round(horizonY * 0.46);
    g.rect(0, 0, width, horizonY).fill({ color: 0xf1f5f9 });
    g.rect(0, horizonY - 10, width, 10).fill({ color: 0x94a3b8 });
    g.rect(0, horizonY, width, floorH).fill({ color: 0xcbd5e1 });
    g.roundRect(winX, winY, winW, winH, 4)
      .fill({ color: 0xbae6fd })
      .stroke({ width: 5, color: 0x475569 });
    g.rect(winX + 16, winY + Math.round(winH * 0.42), 28, Math.round(winH * 0.58)).fill({
      color: 0x94a3b8,
    });
    g.rect(winX + 52, winY + Math.round(winH * 0.25), 34, Math.round(winH * 0.75)).fill({
      color: 0x64748b,
    });
    g.rect(winX + 94, winY + Math.round(winH * 0.5), 26, Math.round(winH * 0.5)).fill({
      color: 0x94a3b8,
    });
    g.roundRect(
      Math.round(width * 0.46),
      Math.round(horizonY * 0.22),
      Math.round(width * 0.24),
      Math.round(horizonY * 0.28),
      4
    )
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: 0x64748b });
    g.moveTo(Math.round(width * 0.49), Math.round(horizonY * 0.42))
      .lineTo(Math.round(width * 0.55), Math.round(horizonY * 0.36))
      .lineTo(Math.round(width * 0.61), Math.round(horizonY * 0.38))
      .lineTo(Math.round(width * 0.67), Math.round(horizonY * 0.29))
      .stroke({ width: 3, color: 0x4f46e5 });

    if (beat.hasFridgeProp) {
      drawFridge(
        g,
        Math.round(width * 0.76),
        horizonY - Math.round(horizonY * 0.56),
        Math.round(width * 0.16),
        Math.round(horizonY * 0.56),
        beat.fridgeOpen
      );
    } else {
      g.rect(doorX, doorY, doorW, doorH)
        .fill({ color: 0x1e293b })
        .stroke({ width: 4, color: 0x334155 });
      g.rect(doorX - doorSlidePx, doorY, doorW, doorH)
        .fill({ color: 0xe2e8f0 })
        .stroke({ width: 4, color: 0x475569 });
    }
  } else if (room === 'school_classroom') {
    g.rect(0, 0, width, horizonY).fill({ color: 0xfffbeb });
    g.rect(0, horizonY - 12, width, 12).fill({ color: 0xb45309 });
    g.rect(0, horizonY, width, floorH).fill({ color: 0xd6a972 });
    g.moveTo(0, horizonY + floorH * 0.35).lineTo(width, horizonY + floorH * 0.35).stroke({ width: 1.5, color: 0xb45309, alpha: 0.25 });
    g.moveTo(0, horizonY + floorH * 0.68).lineTo(width, horizonY + floorH * 0.68).stroke({ width: 1.5, color: 0xb45309, alpha: 0.25 });
    g.roundRect(
      Math.round(width * 0.26),
      Math.round(horizonY * 0.22),
      Math.round(width * 0.54),
      Math.round(horizonY * 0.36),
      4
    )
      .fill({ color: 0x14532d })
      .stroke({ width: 6, color: 0x92400e });
    g.moveTo(Math.round(width * 0.32), Math.round(horizonY * 0.34))
      .lineTo(Math.round(width * 0.6), Math.round(horizonY * 0.34))
      .stroke({ width: 3, color: 0xe2e8f0, alpha: 0.7 });
    g.moveTo(Math.round(width * 0.32), Math.round(horizonY * 0.42))
      .lineTo(Math.round(width * 0.52), Math.round(horizonY * 0.42))
      .stroke({ width: 2.5, color: 0xfde68a, alpha: 0.7 });
    const clsWinX = Math.round(width * 0.06);
    const clsWinY = Math.round(horizonY * 0.2);
    const clsWinW = Math.round(width * 0.14);
    const clsWinH = Math.round(horizonY * 0.48);
    g.roundRect(clsWinX, clsWinY, clsWinW, clsWinH, 3)
      .fill({ color: 0xbae6fd })
      .stroke({ width: 4, color: 0x78350f });
    g.moveTo(clsWinX + clsWinW / 2, clsWinY)
      .lineTo(clsWinX + clsWinW / 2, clsWinY + clsWinH)
      .stroke({ width: 2.5, color: 0x78350f });
    g.moveTo(clsWinX, clsWinY + clsWinH / 2)
      .lineTo(clsWinX + clsWinW, clsWinY + clsWinH / 2)
      .stroke({ width: 2.5, color: 0x78350f });
    g.circle(Math.round(width * 0.5), Math.round(horizonY * 0.13), 16)
      .fill({ color: 0xffffff })
      .stroke({ width: 3, color: 0x475569 });
    g.moveTo(Math.round(width * 0.5), Math.round(horizonY * 0.13))
      .lineTo(Math.round(width * 0.5), Math.round(horizonY * 0.13) - 9)
      .stroke({ width: 2.2, color: 0x1e293b });
    g.moveTo(Math.round(width * 0.5), Math.round(horizonY * 0.13))
      .lineTo(Math.round(width * 0.5) + 7, Math.round(horizonY * 0.13))
      .stroke({ width: 2.2, color: 0x1e293b });
  } else if (room === 'street_park') {
    g.rect(0, 0, width, horizonY).fill({ color: 0xbae6fd });
    g.ellipse(Math.round(width * 0.25) + cloudDrift, Math.round(horizonY * 0.22), 46, 16).fill({
      color: 0xffffff,
      alpha: 0.9,
    });
    g.ellipse(Math.round(width * 0.74) - cloudDrift * 0.6, Math.round(horizonY * 0.18), 52, 18).fill({
      color: 0xffffff,
      alpha: 0.85,
    });
    g.moveTo(0, horizonY)
      .quadraticCurveTo(width * 0.18, horizonY * 0.62, width * 0.36, horizonY)
      .closePath()
      .fill({ color: 0x4ade80 });
    g.moveTo(width * 0.62, horizonY)
      .quadraticCurveTo(width * 0.82, horizonY * 0.58, width, horizonY)
      .closePath()
      .fill({ color: 0x22c55e });
    g.roundRect(Math.round(width * 0.36), horizonY - 38, Math.round(width * 0.28), 12, 3)
      .fill({ color: 0xb45309 })
      .stroke({ width: 2.5, color: 0x78350f });
    g.rect(Math.round(width * 0.38), horizonY - 26, 8, 26).fill({ color: 0x475569 });
    g.rect(Math.round(width * 0.6), horizonY - 26, 8, 26).fill({ color: 0x475569 });
    g.rect(0, horizonY, width, floorH).fill({ color: 0x94a3b8 });
    g.moveTo(0, horizonY + 8).lineTo(width, horizonY + 8).stroke({ width: 4, color: 0x64748b });
  } else if (room === 'restaurant_izakaya') {
    g.rect(0, 0, width, horizonY).fill({ color: 0x7c2d12 });
    g.rect(0, horizonY, width, floorH).fill({ color: 0x78350f });
    for (const rx of [0.2, 0.5, 0.8]) {
      const lx = Math.round(width * rx) + Math.sin(timeSec * 1.6 + rx * 5) * 2.5;
      const ly = Math.round(horizonY * 0.24);
      g.ellipse(lx, ly, 22, 28)
        .fill({ color: 0xfef08a })
        .stroke({ width: 3.5, color: 0xdc2626 });
      g.moveTo(lx - 18, ly).lineTo(lx + 18, ly).stroke({ width: 2, color: 0xdc2626 });
    }
    g.rect(Math.round(width * 0.14), horizonY - 46, Math.round(width * 0.72), 46)
      .fill({ color: 0xa16207 })
      .stroke({ width: 4, color: 0x451a03 });
  } else if (room === 'train_station') {
    g.rect(0, 0, width, horizonY).fill({ color: 0xe0f2fe });
    g.rect(0, 0, width, Math.round(horizonY * 0.18)).fill({ color: 0x334155 });
    g.roundRect(Math.round(width * 0.34), Math.round(horizonY * 0.22), Math.round(width * 0.32), 38, 4)
      .fill({ color: 0xffffff })
      .stroke({ width: 3.5, color: 0x0f172a });
    g.rect(Math.round(width * 0.34), Math.round(horizonY * 0.22) + 28, Math.round(width * 0.32), 10).fill({
      color: 0x16a34a,
    });
    g.rect(0, horizonY, width, floorH).fill({ color: 0xcbd5e1 });
    g.rect(0, horizonY + 14, width, 10).fill({ color: 0xfacc15 });
  } else if (room === 'kitchen_fridge') {
    const fW = Math.round(width * 0.22);
    const fH = Math.round(horizonY * 0.62);
    const fX = Math.round(width * 0.08);
    const fY = horizonY - fH;
    g.rect(0, 0, width, horizonY).fill({ color: 0xfffbeb });
    g.rect(0, horizonY, width, floorH).fill({ color: 0xe2e8f0 });
    drawFridge(g, fX, fY, fW, fH, beat.fridgeOpen);
    g.rect(
      Math.round(width * 0.36),
      horizonY - Math.round(horizonY * 0.28),
      Math.round(width * 0.4),
      Math.round(horizonY * 0.28)
    )
      .fill({ color: 0xf1f5f9 })
      .stroke({ width: 3, color: 0x94a3b8 });
    g.roundRect(
      Math.round(width * 0.34),
      horizonY - Math.round(horizonY * 0.3),
      Math.round(width * 0.44),
      12,
      3
    )
      .fill({ color: 0xcbd5e1 })
      .stroke({ width: 2.5, color: 0x64748b });
    g.rect(doorX, doorY, doorW, doorH)
      .fill({ color: 0x1e293b })
      .stroke({ width: 4, color: hexToPixi(pal.woodDarkHex) });
    g.rect(doorX - doorSlidePx, doorY, doorW, doorH)
      .fill({ color: 0xfefdf7 })
      .stroke({ width: 4, color: hexToPixi(pal.woodHex) });
  } else {
    // room_living default
    const winX = Math.round(width * (beat.hasFridgeProp ? 0.28 : 0.07));
    const winY = Math.round(horizonY * 0.22);
    const winW = Math.round(width * 0.26);
    const winH = Math.round(horizonY * 0.42);
    const woodHex = hexToPixi(pal.woodHex, 0x925b32);
    const woodDarkHex = hexToPixi(pal.woodDarkHex, 0x683e1e);

    // Subtle banded wall gradient
    g.rect(0, 0, width, horizonY * 0.55).fill({ color: hexToPixi(pal.wallTop) });
    g.rect(0, horizonY * 0.55, width, horizonY * 0.45).fill({ color: hexToPixi(pal.wallBottom) });
    g.rect(0, horizonY - 12, width, 14).fill({ color: woodHex });
    g.rect(0, horizonY, width, floorH * 0.45).fill({ color: hexToPixi(pal.floorTop) });
    g.rect(0, horizonY + floorH * 0.45, width, floorH * 0.55).fill({
      color: hexToPixi(pal.floorBottom),
    });

    g.poly([
      Math.round(width * 0.08),
      horizonY + 12,
      Math.round(width * 0.92),
      horizonY + 12,
      Math.round(width * 0.98),
      height - 16,
      Math.round(width * 0.02),
      height - 16,
    ])
      .fill({ color: hexToPixi(pal.tatamiHex), alpha: 0.72 })
      .stroke({ width: 4, color: woodHex });

    if (beat.hasFridgeProp) {
      drawFridge(
        g,
        Math.round(width * 0.05),
        horizonY - Math.round(horizonY * 0.56),
        Math.round(width * 0.17),
        Math.round(horizonY * 0.56),
        beat.fridgeOpen
      );
    }

    g.roundRect(winX, winY, winW, winH, 4)
      .fill({ color: hexToPixi(pal.skyHex) })
      .stroke({ width: 5, color: woodDarkHex });
    g.circle(
      winX + Math.round(winW * 0.72),
      winY + Math.round(winH * 0.3),
      Math.round(Math.min(winW, winH) * 0.16)
    ).fill({ color: hexToPixi(pal.windowGlowHex), alpha: 0.85 });
    g.moveTo(winX + Math.round(winW * 0.5), winY)
      .lineTo(winX + Math.round(winW * 0.5), winY + winH)
      .stroke({ width: 3, color: woodHex });
    g.moveTo(winX, winY + Math.round(winH * 0.5))
      .lineTo(winX + winW, winY + Math.round(winH * 0.5))
      .stroke({ width: 3, color: woodHex });
    g.poly([
      winX,
      winY + winH,
      winX + winW,
      winY + winH,
      winX + winW + Math.round(width * 0.25),
      height,
      winX + Math.round(width * 0.06),
      height,
    ]).fill({ color: hexToPixi(pal.windowGlowHex), alpha: beamOpacity });

    const px = Math.round(width * 0.58);
    const py = Math.round(horizonY * 0.26);
    const pw = Math.round(width * 0.14);
    const ph = Math.round(horizonY * 0.24);
    g.roundRect(px, py, pw, ph, 3)
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: woodHex });
    g.rect(px + 7, py + 7, pw - 14, ph - 14).fill({ color: 0xe0f2fe });
    g.poly([
      px + 10,
      py + Math.round(horizonY * 0.18),
      px + Math.round(width * 0.055),
      py + Math.round(horizonY * 0.1),
      px + Math.round(width * 0.1),
      py + Math.round(horizonY * 0.18),
    ]).fill({ color: 0x60a5fa });

    g.rect(doorX, doorY, doorW, doorH)
      .fill({ color: 0x1e293b })
      .stroke({ width: 5, color: woodDarkHex });
    g.rect(doorX - doorSlidePx, doorY, doorW, doorH)
      .fill({ color: 0xfefdf7 })
      .stroke({ width: 4, color: woodHex });
    g.circle(doorX - doorSlidePx + 18, doorY + Math.round(doorH * 0.54), 5).fill({
      color: woodDarkHex,
    });
  }

  if (beat.emotion === 'angry') {
    g.rect(0, 0, width, height).fill({ color: 0xef4444, alpha: 0.09 });
    const pulse = 0.16 + Math.sin(timeSec * 11) * 0.06;
    g.moveTo(0, 0).lineTo(Math.round(width * 0.22), Math.round(height * 0.26)).stroke({
      width: 3,
      color: 0xdc2626,
      alpha: pulse,
    });
    g.moveTo(width, 0).lineTo(Math.round(width * 0.78), Math.round(height * 0.26)).stroke({
      width: 3,
      color: 0xdc2626,
      alpha: pulse,
    });
    g.moveTo(0, Math.round(height * 0.35))
      .lineTo(Math.round(width * 0.18), Math.round(height * 0.42))
      .stroke({ width: 3, color: 0xdc2626, alpha: pulse });
    g.moveTo(width, Math.round(height * 0.35))
      .lineTo(Math.round(width * 0.82), Math.round(height * 0.42))
      .stroke({ width: 3, color: 0xdc2626, alpha: pulse });
  }
}

// ============================================================================
// 60fps Particle Pool (Dust Motes, Sakura Petals, Steam, Embers, Frost)
// ============================================================================

interface ParticleItem {
  gfx: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  size: number;
  kind: 'mote' | 'sakura' | 'steam' | 'ember' | 'frost';
}

export class PixiParticleSystem {
  public readonly container = new Container();
  private items: ParticleItem[] = [];
  private currentRoom: AnimeRoomKind = 'room_living';
  private width = 720;
  private height = 1280;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    for (let i = 0; i < 28; i++) {
      const gfx = new Graphics();
      this.container.addChild(gfx);
      this.items.push({
        gfx,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2,
        size: 2.5 + (i % 4),
        kind: 'mote',
      });
    }
    this.configureRoom('room_living', width, height, false);
  }

  public configureRoom(
    roomKind: AnimeRoomKind,
    width: number,
    height: number,
    fridgeOpen: boolean
  ): void {
    this.width = width;
    this.height = height;
    this.currentRoom = roomKind;

    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      p.gfx.clear();
      const isFrost = fridgeOpen && i >= this.items.length - 6;

      if (isFrost) {
        p.kind = 'frost';
        p.x = width * 0.14 + (Math.random() - 0.5) * 46;
        p.y = height * 0.36 + Math.random() * 48;
        p.vx = (Math.random() - 0.5) * 14;
        p.vy = 18 + Math.random() * 18;
        p.gfx.circle(0, 0, 5 + (i % 3) * 2).fill({ color: 0xe0f2fe, alpha: 0.52 });
      } else if (roomKind === 'street_park') {
        p.kind = 'sakura';
        p.vx = 14 + Math.random() * 18;
        p.vy = 26 + Math.random() * 24;
        p.gfx.ellipse(0, 0, 6, 3.2).fill({ color: 0xfbcfe8, alpha: 0.85 });
      } else if (roomKind === 'restaurant_izakaya') {
        p.kind = 'ember';
        p.vx = (Math.random() - 0.5) * 12;
        p.vy = -18 - Math.random() * 22;
        p.gfx.circle(0, 0, 2.5 + (i % 3) * 1.4).fill({ color: 0xfde047, alpha: 0.38 });
      } else if (roomKind === 'cafe_corner') {
        p.kind = 'steam';
        p.vx = (Math.random() - 0.5) * 10;
        p.vy = -16 - Math.random() * 16;
        p.gfx.circle(0, 0, 3.5 + (i % 3) * 1.5).fill({ color: 0xfffbeb, alpha: 0.3 });
      } else {
        p.kind = 'mote';
        p.vx = 4 + Math.random() * 8;
        p.vy = -4 + Math.random() * 8;
        p.gfx.circle(0, 0, 2 + (i % 2) * 1.2).fill({ color: 0xfef3c7, alpha: 0.42 });
      }
    }
  }

  public update(dtSec: number, timeSec: number): void {
    const dt = Math.min(0.05, Math.max(0.001, dtSec));
    for (const p of this.items) {
      p.x += (p.vx + Math.sin(timeSec * 1.8 + p.phase) * 9) * dt;
      p.y += p.vy * dt;

      if (p.kind === 'sakura') {
        p.gfx.rotation = timeSec * 1.8 + p.phase;
        if (p.y > this.height * 0.88) p.y = -12;
        if (p.x > this.width + 16) p.x = -12;
      } else if (p.kind === 'ember' || p.kind === 'steam') {
        if (p.y < this.height * 0.1) p.y = this.height * 0.78;
        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        p.gfx.alpha = 0.25 + 0.3 * Math.sin(timeSec * 2.5 + p.phase);
      } else if (p.kind === 'frost') {
        if (p.y > this.height * 0.62) {
          p.y = this.height * 0.35;
          p.x = this.width * 0.14 + Math.sin(timeSec * 3 + p.phase) * 24;
        }
        p.gfx.alpha = 0.25 + 0.3 * Math.abs(Math.sin(timeSec * 2 + p.phase));
      } else {
        if (p.x > this.width + 10) p.x = -10;
        if (p.y < this.height * 0.08) p.y = this.height * 0.75;
        if (p.y > this.height * 0.78) p.y = this.height * 0.1;
        p.gfx.alpha = 0.22 + 0.25 * Math.sin(timeSec * 2.1 + p.phase);
      }

      p.gfx.position.set(p.x, p.y);
    }
  }

  public getRoom(): AnimeRoomKind {
    return this.currentRoom;
  }
}

// ============================================================================
// Top Banner & Spring-Animated Speech Bubble with Smooth Karaoke Text
// ============================================================================

export function drawPixiTopBanner(
  layer: Container,
  width: number,
  height: number,
  beat: AnimeStoryboardBeat,
  storyTitle: string,
  fontCss: string
): void {
  layer.removeChildren().forEach((c) => c.destroy());
  const headerFs = Math.max(15, Math.round(Math.min(width, height) * 0.026));
  const textStr = beat.isStageCue ? beat.sceneTitle || beat.rawText : storyTitle;
  const bannerW = Math.min(
    Math.round(width * 0.88),
    Math.max(180, Math.round(approxBubbleTextUnits(textStr) * headerFs * 1.05 + 36))
  );
  const bannerH = Math.round(headerFs * 1.95);
  const bannerX = Math.round((width - bannerW) / 2);
  const bannerY = Math.round(height * 0.04);

  const g = new Graphics();
  g.roundRect(bannerX, bannerY, bannerW, bannerH, 10)
    .fill({ color: beat.isStageCue ? 0x1e293b : 0xffffff, alpha: 0.94 })
    .stroke({ width: 2.2, color: beat.isStageCue ? 0xf59e0b : 0xcbd5e1 });

  const label = new Text({
    text: textStr,
    style: {
      fontFamily: fontCss,
      fontSize: headerFs,
      fontWeight: '800',
      fill: beat.isStageCue ? 0xfef3c7 : 0x0f172a,
    },
  });
  label.anchor.set(0.5, 0.5);
  label.position.set(Math.round(width / 2), bannerY + Math.round(bannerH * 0.5));
  layer.addChild(g, label);
}

export interface PixiSpeechBubbleHandle {
  root: Container;
  pivotContainer: Container;
  lastBeatKey: string;
  lastLitCount: number;
  tokenizedLines: string[][];
  lines: string[];
  totalTokens: number;
}

export function createPixiSpeechBubbleHandle(): PixiSpeechBubbleHandle {
  const root = new Container();
  const pivotContainer = new Container();
  root.addChild(pivotContainer);
  return {
    root,
    pivotContainer,
    lastBeatKey: '',
    lastLitCount: -1,
    tokenizedLines: [],
    lines: [],
    totalTokens: 0,
  };
}

export function updatePixiSpeechBubble(params: {
  handle: PixiSpeechBubbleHandle;
  beat: AnimeStoryboardBeat;
  focusRig: ComputedCharRig | undefined;
  width: number;
  height: number;
  fontCss: string;
  subtitleEffect: SubtitleEffect;
  highlightColor?: string;
  beatProgress: number;
  isPlayingSpeech: boolean;
  bubbleScale: number;
  bubbleAlpha: number;
}): void {
  const {
    handle,
    beat,
    focusRig,
    width,
    height,
    fontCss,
    subtitleEffect,
    highlightColor,
    beatProgress,
    isPlayingSpeech,
    bubbleScale,
    bubbleAlpha,
  } = params;

  if (beat.isStageCue || !focusRig) {
    handle.root.visible = false;
    return;
  }
  handle.root.visible = true;

  const isPortrait = height > width;
  const text = beat.spokenText || beat.rawText;
  const fontSize = isPortrait ? Math.round(width * 0.036) : Math.round(height * 0.034);
  const maxUnits = isPortrait ? 17 : 26;
  const lines = wrapAnimeBubbleLines(text, maxUnits);
  const tokenizedLines = lines.map((ln) => tokenizeAnimeKaraokeLine(ln));
  const totalToks = Math.max(1, tokenizedLines.reduce((sum, arr) => sum + arr.length, 0));

  const karaokeEnabled = subtitleEffect === 'karaoke' || subtitleEffect === 'laser';
  const activeGlobalToks = karaokeEnabled
    ? Math.max(1, Math.ceil(Math.min(1, isPlayingSpeech ? beatProgress / 0.86 : 1) * totalToks))
    : totalToks;

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
  const headTopY = focusRig.y - 314 * focusRig.scale + focusRig.hipDropY * focusRig.scale;
  const minTopY = Math.round(height * 0.1);
  const bubbleY = Math.max(minTopY, Math.round(headTopY - bubbleH - 24));
  const tailTipX = Math.max(
    bubbleX + 24,
    Math.min(bubbleX + bubbleW - 24, Math.round(targetAnchorX))
  );
  const tailBaseL = Math.max(bubbleX + 18, tailTipX - 11);
  const tailBaseR = Math.min(bubbleX + bubbleW - 18, tailTipX + 11);
  const tailY = bubbleY + bubbleH;

  // Pivot around the speaker-pointing tail tip for authentic spring pop-in!
  handle.pivotContainer.position.set(tailTipX, tailY + 14);
  handle.pivotContainer.pivot.set(tailTipX, tailY + 14);
  handle.pivotContainer.scale.set(bubbleScale);
  handle.pivotContainer.alpha = bubbleAlpha;

  const activeKaraokeColor = resolveBubbleKaraokeColor(
    highlightColor,
    focusRig.profile.bubbleBorderHex
  );
  const beatKey = `${beat.index}_${text}_${width}x${height}_${fontCss}_${activeKaraokeColor}_${
    karaokeEnabled ? 1 : 0
  }_${Math.round(bubbleX)}`;

  if (handle.lastBeatKey === beatKey && handle.lastLitCount === activeGlobalToks) {
    return;
  }

  handle.lastBeatKey = beatKey;
  handle.lastLitCount = activeGlobalToks;
  handle.tokenizedLines = tokenizedLines;
  handle.lines = lines;
  handle.totalTokens = totalToks;

  handle.pivotContainer.removeChildren().forEach((c) => c.destroy());

  const bgFill = hexToPixi(focusRig.profile.bubbleBgHex, 0xfffbeb);
  const borderFill = hexToPixi(focusRig.profile.bubbleBorderHex, 0xd97706);
  const litFill = hexToPixi(activeKaraokeColor, 0x4f46e5);

  const g = new Graphics();
  g.roundRect(bubbleX + 3, bubbleY + 5, bubbleW, bubbleH, 18).fill({
    color: 0x0f172a,
    alpha: 0.15,
  });
  g.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 18)
    .fill({ color: bgFill })
    .stroke({ width: 3.2, color: borderFill });
  g.poly([tailBaseL, tailY - 2, tailBaseR, tailY - 2, tailTipX, tailY + 18]).fill({
    color: bgFill,
  });
  g.moveTo(tailBaseL, tailY)
    .lineTo(tailTipX, tailY + 18)
    .lineTo(tailBaseR, tailY)
    .stroke({ width: 3.2, color: borderFill, join: 'round' });
  handle.pivotContainer.addChild(g);

  if (beat.actingNote) {
    const noteText = new Text({
      text: `（${beat.actingNote}）`,
      style: {
        fontFamily: fontCss,
        fontSize: Math.max(11, Math.round(fontSize * 0.64)),
        fontWeight: '800',
        fill: borderFill,
      },
    });
    noteText.position.set(bubbleX + padX, bubbleY + padY - 1);
    handle.pivotContainer.addChild(noteText);
  }

  let runningTokIdx = 0;
  for (let idx = 0; idx < tokenizedLines.length; idx++) {
    const toks = tokenizedLines[idx];
    const yPos = bubbleY + padY + noteExtraH + idx * lineHeight;

    if (!karaokeEnabled) {
      const lineTxt = new Text({
        text: lines[idx],
        style: {
          fontFamily: fontCss,
          fontSize,
          fontWeight: '700',
          fill: 0x0f172a,
        },
      });
      lineTxt.position.set(bubbleX + padX, yPos);
      handle.pivotContainer.addChild(lineTxt);
      continue;
    }

    let litText = '';
    let unlitText = '';
    for (const tok of toks) {
      if (runningTokIdx < activeGlobalToks) {
        litText += tok;
      } else {
        unlitText += tok;
      }
      runningTokIdx++;
    }

    let cursorX = bubbleX + padX;
    if (litText) {
      const litObj = new Text({
        text: litText,
        style: {
          fontFamily: fontCss,
          fontSize,
          fontWeight: '800',
          fill: litFill,
        },
      });
      litObj.position.set(cursorX, yPos);
      handle.pivotContainer.addChild(litObj);
      cursorX += litObj.width;
    }
    if (unlitText) {
      const unlitObj = new Text({
        text: unlitText,
        style: {
          fontFamily: fontCss,
          fontSize,
          fontWeight: '800',
          fill: 0x334155,
        },
      });
      unlitObj.position.set(cursorX, yPos);
      handle.pivotContainer.addChild(unlitObj);
    }
  }
}
