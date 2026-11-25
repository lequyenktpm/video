import React, { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { AnimeSceneStyle, SubtitleEffect, VideoAspectRatio } from '../shared/types';
import {
  AnimeCharacterProfile,
  AnimeStoryboardBeat,
  ComputedCharRig,
  computeAnimeRigStates,
  interpolateRigStates,
  ParsedAnimeStory,
} from '../shared/animeStoryEngine';
import {
  createPixiCharacterRig,
  createPixiSpeechBubbleHandle,
  drawPixiRoomBackdrop,
  drawPixiTopBanner,
  PixiCharRigHandle,
  PixiParticleSystem,
  updatePixiCharacterRig,
  updatePixiSpeechBubble,
} from './animePixiRenderer';

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
  speechLevelRef?: React.RefObject<number | undefined>;
}

function getStageDimensions(aspectRatio: VideoAspectRatio): { width: number; height: number } {
  if (aspectRatio === '9:16') return { width: 720, height: 1280 };
  if (aspectRatio === '1:1') return { width: 720, height: 720 };
  return { width: 1280, height: 720 };
}

function resolveBeat(story: ParsedAnimeStory, beatIndex: number): {
  beat: AnimeStoryboardBeat;
  safeBeatIdx: number;
} {
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
  return { beat, safeBeatIdx };
}

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
  speechLevelRef,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const propsRef = useRef({
    story,
    beatIndex,
    aspectRatio,
    sceneStyle,
    fontName,
    isPlaying,
    subtitleEffect,
    highlightColor,
    replayNonce,
    speechLevelRef,
  });
  propsRef.current = {
    story,
    beatIndex,
    aspectRatio,
    sceneStyle,
    fontName,
    isPlaying,
    subtitleEffect,
    highlightColor,
    replayNonce,
    speechLevelRef,
  };

  // GSAP-animated continuous stage state (zero React setState in 60fps ticker)
  const animCtrlRef = useRef({
    timeSec: 0,
    beatElapsed: 0,
    poseBlend: 1,
    camScale: 1,
    camOffsetX: 0,
    camOffsetY: 0,
    shakeX: 0,
    shakeY: 0,
    bubbleScale: 1,
    bubbleAlpha: 1,
    roomFadeAlpha: 0,
    lastBeatKey: '',
    lastRoomKind: '',
    lastBannerKey: '',
    lastBackdropKey: '',
    fromRigs: [] as ComputedCharRig[],
    lastRenderedRigs: [] as ComputedCharRig[],
  });

  const pixiReadyRef = useRef<{
    app: Application;
    cameraWorld: Container;
    backdropLayer: Container;
    particleSystem: PixiParticleSystem;
    castLayer: Container;
    transitionCurtain: Graphics;
    bannerLayer: Container;
    bubbleHandle: ReturnType<typeof createPixiSpeechBubbleHandle>;
    rigHandles: Map<string, PixiCharRigHandle>;
    lastFontCss: string;
  } | null>(null);

  // Trigger GSAP tweens whenever beat, script, style, or replayNonce changes
  useEffect(() => {
    const ctrl = animCtrlRef.current;
    const { beat, safeBeatIdx } = resolveBeat(story, beatIndex);
    const { width, height } = getStageDimensions(aspectRatio);
    const beatKey = `${safeBeatIdx}_${beat.rawText}_${replayNonce}`;

    if (ctrl.lastBeatKey !== beatKey) {
      const prevRoom = ctrl.lastRoomKind;
      ctrl.lastBeatKey = beatKey;
      ctrl.lastRoomKind = beat.roomKind;
      ctrl.beatElapsed = 0;

      // Capture outgoing live poses so characters smoothly glide into the next pose
      if (ctrl.lastRenderedRigs.length > 0) {
        ctrl.fromRigs = ctrl.lastRenderedRigs.map((r) => ({ ...r }));
        ctrl.poseBlend = 0;
        gsap.to(ctrl, {
          poseBlend: 1,
          duration: 0.36,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      } else {
        ctrl.poseBlend = 1;
      }

      // Compute target camera focus & tween smoothly with GSAP
      const targetRigs = computeAnimeRigStates({
        story,
        beat,
        timeSec: ctrl.timeSec,
        beatProgress: 0.35,
        width,
        height,
        isPlayingSpeech: false,
      });
      const focusRig = targetRigs.find((r) => r.isActiveFocus) ?? targetRigs[0];
      const targetScale = beat.isStageCue
        ? 1.0
        : beat.emotion === 'angry' || beat.emotion === 'shocked'
        ? 1.055
        : 1.024;
      const targetOffsetX = focusRig ? (width * 0.5 - focusRig.x) * 0.095 : 0;
      const targetOffsetY = (height * 0.5 - height * 0.54) * 0.03;

      gsap.to(ctrl, {
        camScale: targetScale,
        camOffsetX: targetOffsetX,
        camOffsetY: targetOffsetY,
        duration: 0.55,
        ease: 'power3.out',
        overwrite: 'auto',
      });

      // Micro camera shake on shock or anger
      if (!beat.isStageCue && (beat.emotion === 'shocked' || beat.emotion === 'angry' || beat.action === 'jump_recoil')) {
        const amp = beat.emotion === 'shocked' ? 7 : 4.5;
        gsap.fromTo(
          ctrl,
          { shakeX: amp, shakeY: -amp * 0.6 },
          {
            shakeX: 0,
            shakeY: 0,
            duration: 0.34,
            ease: 'elastic.out(1.4, 0.35)',
            overwrite: 'auto',
          }
        );
      }

      // Spring pop-in for speech bubble
      if (!beat.isStageCue) {
        gsap.fromTo(
          ctrl,
          { bubbleScale: 0.76, bubbleAlpha: 0 },
          {
            bubbleScale: 1,
            bubbleAlpha: 1,
            duration: 0.34,
            ease: 'back.out(1.7)',
            overwrite: 'auto',
          }
        );
      }

      // Cinematic transition fade when switching rooms
      if (prevRoom && prevRoom !== beat.roomKind) {
        gsap.fromTo(
          ctrl,
          { roomFadeAlpha: 0.65 },
          {
            roomFadeAlpha: 0,
            duration: 0.58,
            ease: 'power2.inOut',
            overwrite: 'auto',
          }
        );
      }
    }
  }, [story, beatIndex, aspectRatio, replayNonce]);

  // Resize PixiJS canvas cleanly when aspectRatio changes without recreating Application
  useEffect(() => {
    const ready = pixiReadyRef.current;
    if (!ready) return;
    const { width, height } = getStageDimensions(aspectRatio);
    if (ready.app.renderer.width !== width || ready.app.renderer.height !== height) {
      ready.app.renderer.resize(width, height);
      animCtrlRef.current.lastBannerKey = '';
      animCtrlRef.current.lastBackdropKey = '';
    }
  }, [aspectRatio]);

  // Mount PixiJS v8 Application once
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let mountedApp: Application | null = null;

    const initPixi = async () => {
      const { width, height } = getStageDimensions(propsRef.current.aspectRatio);
      const app = new Application();
      await app.init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(2, window.devicePixelRatio || 1.5),
        preference: ['webgl', 'canvas'],
        webgl: {
          antialias: true,
          powerPreference: 'high-performance',
        },
      });

      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }

      mountedApp = app;
      const canvas = app.canvas;
      canvas.setAttribute('data-testid', 'anime-pixi-canvas');
      canvas.className = 'w-full h-full block pointer-events-none select-none';
      host.innerHTML = '';
      host.appendChild(canvas);

      const cameraWorld = new Container();
      const backdropLayer = new Container();
      const particleSystem = new PixiParticleSystem(width, height);
      const castLayer = new Container();
      const transitionCurtain = new Graphics();
      const bannerLayer = new Container();
      const bubbleHandle = createPixiSpeechBubbleHandle();

      cameraWorld.addChild(backdropLayer, particleSystem.container, castLayer);
      app.stage.addChild(cameraWorld, transitionCurtain, bannerLayer, bubbleHandle.root);

      const state = {
        app,
        cameraWorld,
        backdropLayer,
        particleSystem,
        castLayer,
        transitionCurtain,
        bannerLayer,
        bubbleHandle,
        rigHandles: new Map<string, PixiCharRigHandle>(),
        lastFontCss: '',
      };
      pixiReadyRef.current = state;

      const onTick = () => {
        if (cancelled) return;
        const p = propsRef.current;
        const ctrl = animCtrlRef.current;
        const dims = getStageDimensions(p.aspectRatio);
        const dtSec = Math.min(0.05, app.ticker.deltaMS / 1000);
        // Subtle 1.35x expressive cadence matches the stage choreography smoothly
        ctrl.timeSec += dtSec * 1.45;
        ctrl.beatElapsed += dtSec * 1.45;

        const { beat } = resolveBeat(p.story, p.beatIndex);
        const beatDur = Math.max(1.4, beat.estDurationSec);
        const beatProgress = Math.min(1, ctrl.beatElapsed / beatDur);

        const fontCss =
          p.fontName === 'BIZ UDPGothic'
            ? "'BIZ UDPGothic', 'M PLUS 1p', 'Noto Sans', sans-serif"
            : "'M PLUS 1p', 'BIZ UDPGothic', 'Noto Sans', sans-serif";

        // Rebuild character rig handles if cast or font changed
        const presentCharIds = new Set(p.story.characters.map((c) => c.id));
        if (state.lastFontCss !== fontCss) {
          state.lastFontCss = fontCss;
          for (const handle of state.rigHandles.values()) {
            handle.root.destroy({ children: true });
          }
          state.rigHandles.clear();
        }
        for (const [id, handle] of state.rigHandles.entries()) {
          if (!presentCharIds.has(id)) {
            handle.root.destroy({ children: true });
            state.rigHandles.delete(id);
          }
        }
        for (const ch of p.story.characters) {
          if (!state.rigHandles.has(ch.id)) {
            state.rigHandles.set(ch.id, createPixiCharacterRig(ch, fontCss));
          }
        }

        const isPlayingSpeech = !beat.isStageCue && (p.isPlaying || beatProgress < 0.88);
        const liveAudioLevel =
          p.isPlaying && p.speechLevelRef ? p.speechLevelRef.current : undefined;

        const targetRigs = computeAnimeRigStates({
          story: p.story,
          beat,
          timeSec: ctrl.timeSec,
          beatProgress,
          width: dims.width,
          height: dims.height,
          isPlayingSpeech,
          audioAmplitude: liveAudioLevel,
        });

        const rigs =
          ctrl.poseBlend < 0.999 && ctrl.fromRigs.length > 0
            ? interpolateRigStates(ctrl.fromRigs, targetRigs, ctrl.poseBlend)
            : targetRigs;
        ctrl.lastRenderedRigs = rigs;

        // Sort characters so active speaker renders in front
        const sortedRigs = [...rigs].sort(
          (a, b) => (a.isActiveFocus ? 1 : 0) - (b.isActiveFocus ? 1 : 0)
        );
        state.castLayer.removeChildren();
        for (const rig of sortedRigs) {
          const handle = state.rigHandles.get(rig.profile.id);
          if (handle) {
            updatePixiCharacterRig(handle, rig, ctrl.timeSec);
            state.castLayer.addChild(handle.root);
          }
        }

        // Camera breathing + GSAP pan/zoom + impact shake
        const breatheScale = ctrl.camScale + Math.sin(ctrl.timeSec * 0.9) * 0.0025;
        const breatheDx = Math.sin(ctrl.timeSec * 0.65) * 2.2;
        const breatheDy = Math.cos(ctrl.timeSec * 0.8) * 1.6;
        state.cameraWorld.pivot.set(dims.width / 2, dims.height / 2);
        state.cameraWorld.position.set(
          dims.width / 2 + ctrl.camOffsetX + ctrl.shakeX + breatheDx,
          dims.height / 2 + ctrl.camOffsetY + ctrl.shakeY + breatheDy
        );
        state.cameraWorld.scale.set(breatheScale);

        // Backdrop update (quantized softly when animated elements like clouds/door/angry pulse move)
        const doorBucket = beat.doorOpen ? Math.round(beatProgress * 30) : 0;
        const cloudBucket =
          beat.roomKind === 'street_park' ||
          beat.roomKind === 'cafe_corner' ||
          beat.roomKind === 'restaurant_izakaya' ||
          beat.roomKind === 'room_living' ||
          beat.emotion === 'angry'
            ? Math.floor(ctrl.timeSec * 24)
            : 0;
        const backdropKey = `${dims.width}x${dims.height}_${beat.roomKind}_${p.sceneStyle}_${
          beat.hasFridgeProp ? 1 : 0
        }_${beat.fridgeOpen ? 1 : 0}_${beat.emotion}_${doorBucket}_${cloudBucket}`;
        if (ctrl.lastBackdropKey !== backdropKey) {
          ctrl.lastBackdropKey = backdropKey;
          drawPixiRoomBackdrop(
            state.backdropLayer,
            dims.width,
            dims.height,
            beat,
            p.sceneStyle,
            ctrl.timeSec,
            beatProgress
          );
        }

        // Particles per room
        if (
          state.particleSystem.getRoom() !== beat.roomKind ||
          ctrl.lastRoomKind !== beat.roomKind
        ) {
          state.particleSystem.configureRoom(
            beat.roomKind,
            dims.width,
            dims.height,
            beat.fridgeOpen
          );
        }
        state.particleSystem.update(dtSec, ctrl.timeSec);

        // Transition curtain overlay when changing rooms
        state.transitionCurtain.clear();
        if (ctrl.roomFadeAlpha > 0.01) {
          state.transitionCurtain
            .rect(0, 0, dims.width, dims.height)
            .fill({ color: 0x0f172a, alpha: ctrl.roomFadeAlpha });
        }

        // Top Story / Stage-Cue Banner
        const bannerText = beat.isStageCue ? beat.sceneTitle || beat.rawText : p.story.title;
        const bannerKey = `${dims.width}x${dims.height}_${beat.isStageCue ? 1 : 0}_${bannerText}_${fontCss}`;
        if (ctrl.lastBannerKey !== bannerKey) {
          ctrl.lastBannerKey = bannerKey;
          drawPixiTopBanner(
            state.bannerLayer,
            dims.width,
            dims.height,
            beat,
            p.story.title,
            fontCss
          );
        }

        // Speech Bubble with GSAP Spring Scale & Smooth Karaoke Highlight
        const focusRig = rigs.find((r) => r.isActiveFocus) ?? rigs[0];
        updatePixiSpeechBubble({
          handle: state.bubbleHandle,
          beat,
          focusRig,
          width: dims.width,
          height: dims.height,
          fontCss,
          subtitleEffect: p.subtitleEffect ?? 'karaoke',
          highlightColor: p.highlightColor,
          beatProgress,
          isPlayingSpeech,
          bubbleScale: ctrl.bubbleScale,
          bubbleAlpha: ctrl.bubbleAlpha,
        });
      };

      app.ticker.add(onTick);
    };

    void initPixi();

    return () => {
      cancelled = true;
      gsap.killTweensOf(animCtrlRef.current);
      if (pixiReadyRef.current) {
        pixiReadyRef.current = null;
      }
      if (mountedApp) {
        mountedApp.destroy(true, { children: true });
        mountedApp = null;
      }
    };
  }, []);

  const { beat, safeBeatIdx } = resolveBeat(story, beatIndex);
  const karaokeEnabled = subtitleEffect === 'karaoke' || subtitleEffect === 'laser';

  return (
    <div
      data-testid="anime-story-stage"
      data-renderer="pixi-gsap"
      data-beat-index={safeBeatIdx}
      data-room={beat.roomKind}
      data-speaker={beat.speakerId}
      data-emotion={beat.emotion}
      data-action={beat.action}
      className="absolute inset-0 w-full h-full select-none pointer-events-none"
    >
      <div ref={hostRef} className="w-full h-full" />

      {/* Semantic accessibility state mirror for screen readers & DOM verification */}
      <div className="sr-only" aria-live="polite">
        <span data-testid={`anime-room-${beat.roomKind}`}>{beat.roomKind}</span>
        {beat.hasFridgeProp && (
          <span
            data-testid="anime-fridge-prop"
            data-open={beat.fridgeOpen ? 'true' : 'false'}
          />
        )}
        {beat.presentCharacterIds.map((charId) => (
          <span
            key={charId}
            data-testid={`anime-char-${charId}`}
            data-action={beat.speakerId === charId ? beat.action : 'idle'}
          >
            {charId}
          </span>
        ))}
        {!beat.isStageCue && (
          <div data-testid="anime-speech-bubble" data-karaoke={karaokeEnabled ? 'on' : 'off'}>
            <span>{beat.speakerName}: </span>
            <span data-testid={karaokeEnabled ? 'anime-bubble-karaoke-lit' : undefined}>
              {beat.spokenText || beat.rawText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
