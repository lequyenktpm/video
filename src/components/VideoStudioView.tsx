import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  KeyRound,
  Layers,
  LayoutGrid,
  ListChecks,
  Loader2,
  MapPin,
  Palette,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import {
  AnimeRoomKind,
  AnimeSceneStyle,
  BgmPreset,
  CompletedVideoRecord,
  CuratedBackgroundCategory,
  FullAnswerRecapMode,
  GroundingSource,
  LanguageCode,
  LlmProvider,
  MaterialSource,
  MediaAssetItem,
  MediaTypeFilter,
  NeutralBgTheme,
  RenderJobConfig,
  RenderJobStatus,
  ScenePreviewItem,
  ScriptStyle,
  Studio2411AnimationIn,
  Studio2411ComponentVariant,
  Studio2411SceneComponentOverride,
  Studio2411ThemeId,
  StudioTab,
  SubtitleBoxStyle,
  SubtitleEffect,
  SubtitleFont,
  SubtitlePosition,
  TtsProvider,
  VideoAspectRatio,
  VideoConcatMode,
  VideoQuality,
  VideoTransitionMode,
  VisualMood,
  VoiceOptionId,
} from '../shared/types';
import {
  analyzeScriptLinePresentation,
  buildMoneyPrinterPrompt,
  buildScenePromptsFromScript,
  doesVoiceMatchLanguage,
  extractEnglishSearchTerms,
  formatVoiceOptionLabel,
  generateOfflineVietnameseScript,
  getDefaultSecondaryVoiceForLanguage,
  getDefaultVoiceForLanguage,
  getNeutralBgThemeMeta,
  getPresetsForLanguage,
  getScriptLengthSummary,
  hasCjkChars,
  hasVietnameseDiacritics,
  isBilingualLanguage,
  isElevenLabsVoiceId,
  isKnownPresetSubject,
  NEUTRAL_BG_THEMES,
  normalizeOutputSubdir,
  parseAiWebOrJsonOutput,
  planNarrationSegments,
  PresentationRoleTone,
  safeParseJsonResponse,
  slugifyOutputFilename,
  splitScriptSentences,
  stripNarrationTags,
  updateScriptLinePreservingTag,
  VOICE_CATALOG,
} from '../shared/mptEngine';
import {
  build2411CardSpecForLine,
  buildContextualSceneComponentsForScript,
  getStudio2411ThemeMeta,
  STUDIO_2411_ANIMATION_OPTIONS,
  STUDIO_2411_THEMES,
  STUDIO_2411_VARIANT_OPTIONS,
} from '../shared/studioComponents2411';
import {
  CURATED_BACKGROUNDS,
  CURATED_CATEGORY_LABELS,
  selectCuratedBackgroundsForConfig,
} from '../shared/curatedBackgrounds';
import {
  ANIME_ROOM_METAS,
  ANIME_STORY_PRESETS,
  getAnimeRoomMeta,
  parseAnimeDialogueScript,
} from '../shared/animeStoryEngine';
import { TopicDiscoveryBar } from './TopicDiscoveryBar';
import { SubtitlePreviewCaption } from './SubtitlePreviewCaption';
import { PresentationIcon } from './PresentationIcon';
import { Studio2411StageCard } from './Studio2411StageCard';
import { AnimeStoryStage } from './AnimeStoryStage';

const BREAKDOWN_TONE_CLASSES: Record<PresentationRoleTone, string> = {
  indigo: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  sky: 'text-sky-700 bg-sky-50 border-sky-200',
  amber: 'text-amber-800 bg-amber-50 border-amber-200',
  slate: 'text-slate-700 bg-slate-100 border-slate-200',
};

const SUBTITLE_COLOR_THEMES: Array<{
  name: string;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
}> = [
  { name: 'Mực Đen Indigo (Nền sáng 2411)', textColor: '#0F172A', highlightColor: '#4F46E5', strokeColor: '#FFFFFF' },
  { name: 'Navy Sắc Nét (Nền sáng)', textColor: '#1E293B', highlightColor: '#0284C7', strokeColor: '#FFFFFF' },
  { name: 'Ngọc Lục Bảo Đậm (Nền sáng)', textColor: '#064E3B', highlightColor: '#059669', strokeColor: '#FFFFFF' },
  { name: 'Trắng Vàng Điện Ảnh (Nền tối)', textColor: '#FFFFFF', highlightColor: '#FACC15', strokeColor: '#0F172A' },
  { name: 'Xanh Ngọc Hiện Đại (Nền tối)', textColor: '#F8FAFC', highlightColor: '#2DD4BF', strokeColor: '#0F172A' },
  { name: 'Hồng San Hô Nổi Bật (Nền tối)', textColor: '#FFF1F2', highlightColor: '#FB7185', strokeColor: '#1E1B4B' },
];

const TEXT_COLOR_SWATCHES = [
  '#0F172A',
  '#1E293B',
  '#312E81',
  '#064E3B',
  '#FFFFFF',
  '#FACC15',
  '#38BDF8',
  '#2DD4BF',
];

const KARAOKE_COLOR_SWATCHES = [
  '#4F46E5',
  '#0284C7',
  '#059669',
  '#FACC15',
  '#2DD4BF',
  '#FB7185',
  '#C084FC',
  '#FB923C',
];

interface VideoStudioViewProps {
  studioTab: StudioTab;
  config: RenderJobConfig;
  onChangeConfig: (patch: Partial<RenderJobConfig>) => void;
  uploadedMedia: MediaAssetItem[];
  builtinBgm: MediaAssetItem[];
  onTriggerUpload: () => void;
  onDeleteMedia: (id: string) => void;
  renderJob: RenderJobStatus | null;
  isRendering: boolean;
  onStartRender: () => void;
  onCancelRender: () => void;
  onResetForm: () => void;
  recentHistory: CompletedVideoRecord[];
  onDeleteHistory: (jobId: string) => void;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  studioTab,
  config,
  onChangeConfig,
  uploadedMedia,
  builtinBgm,
  onTriggerUpload,
  onDeleteMedia,
  renderJob,
  isRendering,
  onStartRender,
  onCancelRender,
  onResetForm,
  recentHistory,
  onDeleteHistory,
}) => {
  const quickPasteRef = useRef<HTMLTextAreaElement | null>(null);
  const sceneFileInputRef = useRef<HTMLInputElement | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const previewPlayTimerRef = useRef<number | null>(null);
  const previewPlayingRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stagePreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const stagePreviewAbortRef = useRef<AbortController | null>(null);
  const speechLevelRef = useRef<number | undefined>(undefined);
  const speechMeterRafRef = useRef<number | null>(null);

  const [termsInput, setTermsInput] = useState(config.terms.join(', '));
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptNote, setScriptNote] = useState<string | null>(null);
  const [scriptSources, setScriptSources] = useState<GroundingSource[]>([]);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [showAiWebPanel, setShowAiWebPanel] = useState(true);
  const [aiWebPromptMode, setAiWebPromptMode] = useState<
    'from_user_script' | 'from_subject' | 'all_in_one'
  >('from_user_script');
  const [autoFetchScenesOnPaste, setAutoFetchScenesOnPaste] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [aiWebPasteText, setAiWebPasteText] = useState('');
  const [aiWebStatus, setAiWebStatus] = useState<string | null>(null);

  const [previewScenes, setPreviewScenes] = useState<ScenePreviewItem[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [scenesError, setScenesError] = useState<string | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const [sceneEditQuery, setSceneEditQuery] = useState('');
  const [sceneAltCandidates, setSceneAltCandidates] = useState<ScenePreviewItem[]>([]);
  const [isLoadingSceneAlt, setIsLoadingSceneAlt] = useState(false);
  const [isGeneratingSceneAi, setIsGeneratingSceneAi] = useState(false);
  const [sceneEditStatus, setSceneEditStatus] = useState<string | null>(null);

  const [isPreviewingTts, setIsPreviewingTts] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [ttsPreviewNote, setTtsPreviewNote] = useState<string | null>(null);
  const [showElKey, setShowElKey] = useState(false);
  const [isCheckingElKey, setIsCheckingElKey] = useState(false);
  const [elKeyStatus, setElKeyStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [customElVoices, setCustomElVoices] = useState<
    Array<{ id: VoiceOptionId; name: string; category?: string }>
  >(() => {
    try {
      const raw = window.localStorage.getItem('mpt_vn_el_voices_v1');
      return raw ? (JSON.parse(raw) as Array<{ id: VoiceOptionId; name: string; category?: string }>) : [];
    } catch {
      return [];
    }
  });
  const [captionReplayNonce, setCaptionReplayNonce] = useState(0);
  const [previewCountdown, setPreviewCountdown] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [videoPlaybackError, setVideoPlaybackError] = useState<string | null>(null);
  const [exiting2411Card, setExiting2411Card] = useState<{
    key: string;
    rawLine: string;
    lineIndex: number;
    totalLines: number;
    isSecondarySlot: boolean;
    isIntroOrOutro: boolean;
    scriptStyle?: ScriptStyle;
    dualVoiceEnabled: boolean;
    themeId?: Studio2411ThemeId;
    pauseBetweenLinesSec: number;
    aspectRatio: VideoAspectRatio;
    prevTargetText?: string;
    promptPreviewText?: string;
    animationSeed: number;
    fontName?: string;
    override?: Studio2411SceneComponentOverride;
  } | null>(null);
  const current2411SnapRef = useRef<{
    key: string;
    rawLine: string;
    lineIndex: number;
    totalLines: number;
    isSecondarySlot: boolean;
    isIntroOrOutro: boolean;
    scriptStyle?: ScriptStyle;
    dualVoiceEnabled: boolean;
    themeId?: Studio2411ThemeId;
    pauseBetweenLinesSec: number;
    aspectRatio: VideoAspectRatio;
    prevTargetText?: string;
    promptPreviewText?: string;
    animationSeed: number;
    fontName?: string;
    override?: Studio2411SceneComponentOverride;
  } | null>(null);
  const exit2411TimerRef = useRef<number | null>(null);

  const [outputFolders, setOutputFolders] = useState<string[]>(['output']);
  const [outputRootAbsPath, setOutputRootAbsPath] = useState<string>('');
  const [newFolderInput, setNewFolderInput] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const loadOutputFolders = async () => {
    try {
      const res = await fetch('/api/outputs/folders');
      if (res.ok) {
        const data = await safeParseJsonResponse<{
          rootAbsPath?: string;
          folders?: string[];
        }>(res, 'Lỗi đọc danh sách thư mục output.');
        if (Array.isArray(data.folders) && data.folders.length > 0) {
          setOutputFolders(data.folders);
        }
        if (data.rootAbsPath) {
          setOutputRootAbsPath(data.rootAbsPath);
        }
      }
    } catch {
      // Ignore gracefully
    }
  };

  useEffect(() => {
    void loadOutputFolders();
  }, []);

  const handleCreateOutputFolder = async () => {
    const clean = newFolderInput.trim();
    if (!clean) return;
    try {
      const res = await fetch('/api/outputs/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: clean }),
      });
      if (res.ok) {
        const data = await safeParseJsonResponse<{ folder: string; folders: string[] }>(
          res,
          'Không tạo được thư mục.'
        );
        setOutputFolders(data.folders);
        onChangeConfig({ outputDir: data.folder });
        setNewFolderInput('');
        setShowNewFolderInput(false);
      }
    } catch {
      // Ignore gracefully
    }
  };

  const stopCountdownPreview = () => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setPreviewCountdown(null);
  };

  const stopPreviewPlayback = () => {
    previewPlayingRef.current = false;
    if (previewPlayTimerRef.current !== null) {
      window.clearTimeout(previewPlayTimerRef.current);
      previewPlayTimerRef.current = null;
    }
    if (stagePreviewAbortRef.current) {
      try {
        stagePreviewAbortRef.current.abort();
      } catch {
        // Ignore abort errors safely
      }
      stagePreviewAbortRef.current = null;
    }
    if (stagePreviewAudioRef.current) {
      try {
        stagePreviewAudioRef.current.pause();
        stagePreviewAudioRef.current.src = '';
      } catch {
        // Ignore audio element cleanup errors safely
      }
      stagePreviewAudioRef.current = null;
    }
    if (speechMeterRafRef.current !== null) {
      window.cancelAnimationFrame(speechMeterRafRef.current);
      speechMeterRafRef.current = null;
    }
    speechLevelRef.current = undefined;
    stopCountdownPreview();
    setIsPlayingPreview(false);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore speechSynthesis cancel errors safely
    }
  };

  const playClockTickInBrowser = (isTick: boolean) => {
    if (config.clockTickEnabled === false) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isTick ? 2250 : 1620, now);
      osc.frequency.exponentialRampToValueAtTime(isTick ? 950 : 680, now + 0.032);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore Web Audio errors safely
    }
  };

  const speakPreviewSlideText = (
    slideText: string,
    isSecondary: boolean,
    customVoice?: VoiceOptionId,
    pitchRatio?: number
  ) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const clean = stripNarrationTags(slideText);
      if (!clean) return;
      const utter = new SpeechSynthesisUtterance(clean);
      const voiceRef =
        customVoice ?? (isSecondary ? config.secondaryVoiceId || config.voiceId : config.voiceId);
      if (hasCjkChars(clean) || voiceRef?.startsWith('ja')) {
        utter.lang = 'ja-JP';
      } else if (hasVietnameseDiacritics(clean) || voiceRef?.startsWith('vi')) {
        utter.lang = 'vi-VN';
      } else {
        utter.lang = 'en-US';
      }
      if (pitchRatio && Number.isFinite(pitchRatio)) {
        utter.pitch = Math.max(0.75, Math.min(1.35, pitchRatio));
      }
      utter.rate = Math.max(0.85, Math.min(1.4, config.voiceRate || 1.0));
      utter.volume = Math.max(0.2, Math.min(1.0, config.voiceVolume || 1.0));
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speechSynthesis errors gracefully
    }
  };

  const handleRunCountdownPreview = (onFinish?: () => void) => {
    stopCountdownPreview();
    const total = Math.max(1, Math.min(10, Math.round(config.pauseBetweenLinesSec || 5)));
    let current = total;
    setPreviewCountdown(current);
    playClockTickInBrowser(true);

    let tickStep = 1;
    countdownTimerRef.current = window.setInterval(() => {
      current -= 1;
      if (current <= 0) {
        stopCountdownPreview();
        if (onFinish) onFinish();
        return;
      }
      setPreviewCountdown(current);
      playClockTickInBrowser(tickStep % 2 === 0);
      tickStep += 1;
    }, 1000);
  };

  useEffect(() => {
    return () => {
      previewPlayingRef.current = false;
      if (previewPlayTimerRef.current !== null) {
        window.clearTimeout(previewPlayTimerRef.current);
      }
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }
      if (exit2411TimerRef.current !== null) {
        window.clearTimeout(exit2411TimerRef.current);
      }
      if (stagePreviewAbortRef.current) {
        try {
          stagePreviewAbortRef.current.abort();
        } catch {
          // Ignore
        }
        stagePreviewAbortRef.current = null;
      }
      if (stagePreviewAudioRef.current) {
        try {
          stagePreviewAudioRef.current.pause();
          stagePreviewAudioRef.current.src = '';
        } catch {
          // Ignore
        }
        stagePreviewAudioRef.current = null;
      }
      if (speechMeterRafRef.current !== null) {
        window.cancelAnimationFrame(speechMeterRafRef.current);
        speechMeterRafRef.current = null;
      }
      speechLevelRef.current = undefined;
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignore
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    stopPreviewPlayback();
    setPreviewScenes(config.customScenes ?? []);
    setPreviewAudioUrl(null);
    setTtsPreviewNote(null);
    setScriptNote(null);
    setScriptError(null);
    setActiveSceneIdx(0);
    setCaptionReplayNonce((n) => n + 1);
  }, [studioTab]);

  useEffect(() => {
    setTermsInput(config.terms.join(', '));
  }, [config.terms]);

  useEffect(() => {
    if (renderJob?.scenes && renderJob.scenes.length > 0) {
      setPreviewScenes(renderJob.scenes);
    }
  }, [renderJob?.scenes]);

  useEffect(() => {
    setVideoPlaybackError(null);
  }, [renderJob?.videoUrl]);

  const topicPresets = getPresetsForLanguage(config.language);
  const uploadedVisuals = uploadedMedia.filter((m) => m.kind === 'video' || m.kind === 'image');
  const uploadedAudios = uploadedMedia.filter((m) => m.kind === 'audio');

  const rawNonEmptyLines = config.script
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const isAnimeMode =
    studioTab === 'anime_story' || config.materialSource === 'anime_cartoon';
  const parsedAnimeStory = parseAnimeDialogueScript(
    config.script,
    config.animeCharacterVoices,
    { roomOverride: config.animeRoomOverride }
  );

  const handleVerifyElevenLabsKey = async () => {
    setIsCheckingElKey(true);
    setElKeyStatus(null);
    try {
      const res = await fetch('/api/elevenlabs/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: config.elevenLabsApiKey ?? '' }),
      });
      const data = await safeParseJsonResponse<{
        ok?: boolean;
        voices?: Array<{ id: VoiceOptionId; name: string; category?: string }>;
        error?: string;
      }>(res, 'Không kiểm tra được ELEVENLABS_API_KEY.');
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'ELEVENLABS_API_KEY chưa hợp lệ.');
      }
      const fetched = Array.isArray(data.voices) ? data.voices : [];
      setCustomElVoices(fetched);
      try {
        window.localStorage.setItem('mpt_vn_el_voices_v1', JSON.stringify(fetched));
      } catch {
        // Ignore storage quota errors
      }
      setElKeyStatus({
        ok: true,
        message: `Kết nối ElevenLabs thành công! Đã tải ${fetched.length} giọng từ tài khoản của bạn.`,
      });
      onChangeConfig({ ttsProvider: 'elevenlabs' });
    } catch (err) {
      setElKeyStatus({
        ok: false,
        message: err instanceof Error ? err.message : 'Lỗi kết nối ElevenLabs API.',
      });
    } finally {
      setIsCheckingElKey(false);
    }
  };

  const renderVoiceSelectOptions = () => {
    const viVoices = VOICE_CATALOG.filter((v) => v.language === 'vi');
    const jaVoices = VOICE_CATALOG.filter((v) => v.language === 'ja');
    const enVoices = VOICE_CATALOG.filter((v) => v.language === 'en');
    const elVoices = VOICE_CATALOG.filter((v) => v.language === 'multi');
    return (
      <>
        <optgroup label="Tiếng Việt · Edge Neural / Google TTS">
          {viVoices.map((v) => (
            <option key={v.id} value={v.id}>
              {formatVoiceOptionLabel(v)}
            </option>
          ))}
        </optgroup>
        <optgroup label="Tiếng Nhật (日本語) · Edge Neural / Google TTS">
          {jaVoices.map((v) => (
            <option key={v.id} value={v.id}>
              {formatVoiceOptionLabel(v)}
            </option>
          ))}
        </optgroup>
        <optgroup label="Tiếng Anh (English) · Edge Neural / Google TTS">
          {enVoices.map((v) => (
            <option key={v.id} value={v.id}>
              {formatVoiceOptionLabel(v)}
            </option>
          ))}
        </optgroup>
        <optgroup label="ElevenLabs AI · Đa ngôn ngữ (Cần ELEVENLABS_API_KEY)">
          {elVoices.map((v) => (
            <option key={v.id} value={v.id}>
              {formatVoiceOptionLabel(v)}
            </option>
          ))}
        </optgroup>
        {customElVoices.length > 0 && (
          <optgroup label="ElevenLabs Account · Giọng riêng của bạn">
            {customElVoices.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {`[ElevenLabs Account] ${cv.name}${cv.category ? ` (${cv.category})` : ''}`}
              </option>
            ))}
          </optgroup>
        )}
      </>
    );
  };

  const previewLines = splitScriptSentences(config.script, 140)
    .map((l) => stripNarrationTags(l))
    .filter(Boolean);
  const totalPreviewItems = isAnimeMode
    ? parsedAnimeStory.beats.length
    : previewScenes.length > 0
    ? previewScenes.length
    : previewLines.length;
  const safeActiveIdx =
    totalPreviewItems > 0 ? Math.min(activeSceneIdx, totalPreviewItems - 1) : 0;
  const activeScene = !isAnimeMode ? previewScenes[safeActiveIdx] ?? null : null;
  const activeAnimeBeat = isAnimeMode ? parsedAnimeStory.beats[safeActiveIdx] : undefined;
  const activeAnimeSubtitleText = activeAnimeBeat
    ? activeAnimeBeat.isStageCue
      ? activeAnimeBeat.sceneTitle || activeAnimeBeat.rawText
      : `${activeAnimeBeat.speakerName}: ${activeAnimeBeat.spokenText}`
    : '';
  const activeAnimeRawLine = activeAnimeBeat ? activeAnimeBeat.rawText : '';

  useEffect(() => {
    if (activeScene) {
      setSceneEditQuery(activeScene.prompt || '');
    } else {
      setSceneEditQuery('');
    }
    setSceneAltCandidates([]);
    setSceneEditStatus(null);
  }, [safeActiveIdx, activeScene?.previewUrl]);

  const rawActiveSentence =
    stripNarrationTags(
      activeScene?.sentence ??
        previewLines[safeActiveIdx] ??
        previewLines[0] ??
        'Clean high-contrast subtitles appear here.'
    ) || 'Clean high-contrast subtitles appear here.';

  const previewBaseSegments = planNarrationSegments({
    script: config.script,
    language: config.language,
    scriptStyle: config.scriptStyle,
    voiceId: config.voiceId,
    dualVoiceEnabled: config.dualVoiceEnabled,
    secondaryVoiceId: config.secondaryVoiceId,
    pauseBetweenLinesSec: 0,
    targetRepeatCount: 0,
    fullAnswerRecapMode: 'off',
    summarizeAtEnd: false,
  });

  const findNonEmptyLineIndex = (cleanTarget: string, hintIdx = 0): number | null => {
    if (!cleanTarget) return null;
    if (
      hintIdx >= 0 &&
      hintIdx < rawNonEmptyLines.length &&
      stripNarrationTags(rawNonEmptyLines[hintIdx]) === cleanTarget
    ) {
      return hintIdx;
    }
    const exactIdx = rawNonEmptyLines.findIndex((l) => stripNarrationTags(l) === cleanTarget);
    if (exactIdx >= 0) return exactIdx;
    const partialIdx = rawNonEmptyLines.findIndex((l) => {
      const stripped = stripNarrationTags(l);
      return stripped.includes(cleanTarget) || cleanTarget.includes(stripped);
    });
    return partialIdx >= 0 ? partialIdx : null;
  };

  let pinnedSourceForPreview: string | null = null;
  const activeRawLineIdx = findNonEmptyLineIndex(rawActiveSentence, safeActiveIdx);
  let activeSegIdx =
    previewBaseSegments[safeActiveIdx]?.text === rawActiveSentence
      ? safeActiveIdx
      : previewBaseSegments.findIndex((s) => s.text === rawActiveSentence);
  if (activeSegIdx < 0 && activeRawLineIdx !== null) {
    activeSegIdx = previewBaseSegments.findIndex((s) => s.rawLineIndex === activeRawLineIdx);
  }
  if (activeSegIdx < 0 && previewBaseSegments.length > 0) {
    activeSegIdx = Math.min(safeActiveIdx, previewBaseSegments.length - 1);
  }

  let editTargetLineIdx: number | null = null;
  let editSourceLineIdx: number | null = null;

  if (activeSegIdx >= 0 && previewBaseSegments[activeSegIdx]) {
    const activeSeg = previewBaseSegments[activeSegIdx];
    if (activeSeg.voiceSlot === 'secondary' && !activeSeg.isIntroOrOutro) {
      editTargetLineIdx = activeRawLineIdx;
      for (let p = activeSegIdx - 1; p >= 0; p--) {
        if (previewBaseSegments[p].voiceSlot === 'primary' && !previewBaseSegments[p].isIntroOrOutro) {
          const srcText = previewBaseSegments[p].text;
          if (config.stickyDualSubtitle !== false) {
            pinnedSourceForPreview = srcText;
          }
          editSourceLineIdx = findNonEmptyLineIndex(srcText, p);
          break;
        }
      }
    } else if (activeSeg.voiceSlot === 'secondary') {
      editTargetLineIdx = activeRawLineIdx;
    } else {
      editSourceLineIdx = activeRawLineIdx;
      const nextSeg = previewBaseSegments[activeSegIdx + 1];
      if (!activeSeg.isIntroOrOutro && nextSeg && nextSeg.voiceSlot === 'secondary' && !nextSeg.isIntroOrOutro) {
        editTargetLineIdx = findNonEmptyLineIndex(nextSeg.text, activeSegIdx + 1);
      }
    }
  } else {
    editSourceLineIdx = activeRawLineIdx;
  }

  const handleInlineEditSubtitleLine = (lineIdx: number, nextCleanText: string) => {
    const oldClean = stripNarrationTags(rawNonEmptyLines[lineIdx] ?? '');
    const nextScript = updateScriptLinePreservingTag(config.script, lineIdx, nextCleanText);
    const updatedScenes =
      previewScenes.length > 0
        ? previewScenes.map((s) =>
            stripNarrationTags(s.sentence) === oldClean ? { ...s, sentence: nextCleanText } : s
          )
        : undefined;
    if (updatedScenes) {
      setPreviewScenes(updatedScenes);
    }
    onChangeConfig({
      script: nextScript,
      ...(updatedScenes ? { customScenes: updatedScenes } : {}),
    });
  };

  const activePreviewCaption = rawActiveSentence;
  const activeRawLine =
    activeRawLineIdx !== null ? rawNonEmptyLines[activeRawLineIdx] : activePreviewCaption;
  const activeComponentEditIdx = activeRawLineIdx ?? safeActiveIdx;
  const activeSegMeta = activeSegIdx >= 0 ? previewBaseSegments[activeSegIdx] : undefined;
  const activeIsSecondarySlot = activeSegMeta?.voiceSlot === 'secondary';
  const activeIsIntroOrOutro = Boolean(activeSegMeta?.isIntroOrOutro);
  const activeNeutralMeta = getNeutralBgThemeMeta(config.neutralBgTheme);
  const active2411Meta = getStudio2411ThemeMeta(config.studio2411Theme);
  const rawActive2411Override =
    activeScene?.componentSpec ??
    (activeRawLineIdx !== null ? config.sceneComponents?.[activeRawLineIdx] : undefined);
  const active2411Override =
    rawActive2411Override &&
    rawActive2411Override.speechText &&
    rawActive2411Override.speechText === stripNarrationTags(activeRawLine) &&
    rawActiveSentence &&
    rawActive2411Override.speechText !== rawActiveSentence &&
    rawActive2411Override.speechText.includes(rawActiveSentence)
      ? { ...rawActive2411Override, speechText: rawActiveSentence }
      : !rawActive2411Override &&
        rawActiveSentence &&
        rawActiveSentence !== stripNarrationTags(activeRawLine) &&
        stripNarrationTags(activeRawLine).includes(rawActiveSentence)
      ? { speechText: rawActiveSentence }
      : rawActive2411Override;
  let prevTargetForActive2411: string | undefined;
  let promptPreviewForActive2411: string | undefined;
  if (!activeIsSecondarySlot && !activeIsIntroOrOutro && activeRawLineIdx !== null && activeRawLineIdx > 0) {
    for (let pi = activeRawLineIdx - 1; pi >= 0; pi--) {
      const candidateLine = rawNonEmptyLines[pi] ?? '';
      const candidatePres = analyzeScriptLinePresentation(candidateLine, {
        scriptStyle: config.scriptStyle,
      });
      const looksSecondary =
        candidatePres.roleKind === 'answer' ||
        /^\s*(?:English|Japanese|Vietnamese|\[EN\]|\[JA\]|\[VI\]|\[V2\])\s*[:：]?/i.test(candidateLine);
      if (looksSecondary && candidatePres.cleanText) {
        prevTargetForActive2411 = candidatePres.cleanText;
        break;
      }
    }
  } else if (activeIsSecondarySlot && activeRawLineIdx !== null && activeRawLineIdx > 0) {
    for (let pi = activeRawLineIdx - 1; pi >= 0; pi--) {
      const candidateLine = rawNonEmptyLines[pi] ?? '';
      const candidatePres = analyzeScriptLinePresentation(candidateLine, {
        scriptStyle: config.scriptStyle,
      });
      const looksSecondary =
        candidatePres.roleKind === 'answer' ||
        /^\s*(?:English|Japanese|Vietnamese|\[EN\]|\[JA\]|\[VI\]|\[V2\])\s*[:：]?/i.test(candidateLine);
      if (
        !looksSecondary &&
        candidatePres.roleKind !== 'title' &&
        candidatePres.roleKind !== 'outro' &&
        candidatePres.cleanText
      ) {
        promptPreviewForActive2411 = candidatePres.cleanText;
        break;
      }
    }
  }
  const isDualVoiceMode =
    Boolean(config.dualVoiceEnabled) || isBilingualLanguage(config.language);
  const active2411LineText =
    active2411Override?.speechText && active2411Override.speechText !== stripNarrationTags(activeRawLine)
      ? activeRawLine
      : activeRawLine;
  const active2411Spec = build2411CardSpecForLine({
    rawLine: active2411LineText,
    lineIndex: safeActiveIdx,
    totalLines: Math.max(1, totalPreviewItems),
    isSecondarySlot: activeIsSecondarySlot,
    isIntroOrOutro: activeIsIntroOrOutro,
    scriptStyle: config.scriptStyle,
    dualVoiceEnabled: isDualVoiceMode,
    themeId: config.studio2411Theme,
    defaultPauseSec: config.pauseBetweenLinesSec ?? 5,
    prevTargetText: prevTargetForActive2411,
    promptPreviewText: promptPreviewForActive2411,
    animationSeed: captionReplayNonce,
    override: active2411Override,
  });
  const active2411CardKey = `${safeActiveIdx}_${active2411Spec.variant}_${active2411Spec.resolvedAnimationIn}_${captionReplayNonce}`;

  useEffect(() => {
    const nextSnap = {
      key: active2411CardKey,
      rawLine: activeRawLine,
      lineIndex: safeActiveIdx,
      totalLines: Math.max(1, totalPreviewItems),
      isSecondarySlot: activeIsSecondarySlot,
      isIntroOrOutro: activeIsIntroOrOutro,
      scriptStyle: config.scriptStyle,
      dualVoiceEnabled: isDualVoiceMode,
      themeId: config.studio2411Theme,
      pauseBetweenLinesSec: config.pauseBetweenLinesSec ?? 5,
      aspectRatio: config.aspectRatio,
      prevTargetText: prevTargetForActive2411,
      promptPreviewText: promptPreviewForActive2411,
      animationSeed: captionReplayNonce,
      fontName: config.subtitle.fontName,
      override: active2411Override,
    };
    const prevSnap = current2411SnapRef.current;
    if (prevSnap && prevSnap.key !== active2411CardKey && config.materialSource === 'studio_2411') {
      setExiting2411Card(prevSnap);
      if (exit2411TimerRef.current !== null) {
        window.clearTimeout(exit2411TimerRef.current);
      }
      exit2411TimerRef.current = window.setTimeout(() => {
        setExiting2411Card(null);
      }, 460);
    }
    current2411SnapRef.current = nextSnap;
  }, [active2411CardKey]);

  const playServerTtsBeat = async (params: {
    text: string;
    voiceId: VoiceOptionId;
    fallbackDelayMs: number;
    onFinished: () => void;
    onFallbackSpeak: () => void;
  }) => {
    const { text, voiceId, fallbackDelayMs, onFinished, onFallbackSpeak } = params;
    const clean = stripNarrationTags(text);
    if (!clean) {
      previewPlayTimerRef.current = window.setTimeout(() => {
        if (previewPlayingRef.current) onFinished();
      }, fallbackDelayMs);
      return;
    }

    if (stagePreviewAbortRef.current) {
      try {
        stagePreviewAbortRef.current.abort();
      } catch {
        // Ignore
      }
    }
    if (stagePreviewAudioRef.current) {
      try {
        stagePreviewAudioRef.current.pause();
        stagePreviewAudioRef.current.src = '';
      } catch {
        // Ignore
      }
      stagePreviewAudioRef.current = null;
    }

    const controller = new AbortController();
    stagePreviewAbortRef.current = controller;

    try {
      const res = await fetch('/api/tts-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: clean,
          voiceId,
          ttsProvider:
            config.ttsProvider === 'elevenlabs' || isElevenLabsVoiceId(voiceId)
              ? 'elevenlabs'
              : config.ttsProvider,
          voiceRate: config.voiceRate,
          elevenLabsApiKey: config.elevenLabsApiKey,
          dualVoiceEnabled: false,
        }),
      });
      if (!previewPlayingRef.current || controller.signal.aborted) return;

      const data = await safeParseJsonResponse<{
        audioUrl?: string;
        engineUsed?: string;
        recoveredFromEdgeError?: boolean;
        fallbackNote?: string;
        error?: string;
      }>(res, 'Không tạo được giọng đọc thử.');

      if (!previewPlayingRef.current || controller.signal.aborted) return;

      if (!res.ok || !data.audioUrl) {
        throw new Error(data.error || 'Không tạo được giọng đọc thử.');
      }

      setPreviewAudioUrl(data.audioUrl);
      setTtsPreviewNote(
        data.fallbackNote
          ? data.fallbackNote
          : data.recoveredFromEdgeError
          ? `Edge-TTS bị chặn -> Tự chuyển sang ${data.engineUsed}`
          : `Đang phát thử từ ${data.engineUsed} (${voiceId})`
      );

      const audio = new Audio(data.audioUrl);
      audio.volume = Math.max(0.2, Math.min(1.0, config.voiceVolume || 1.0));
      stagePreviewAudioRef.current = audio;

      // Real-time Web Audio amplitude envelope for accurate ElevenLabs lip-sync
      const stopSpeechMeter = () => {
        if (speechMeterRafRef.current !== null) {
          window.cancelAnimationFrame(speechMeterRafRef.current);
          speechMeterRafRef.current = null;
        }
        speechLevelRef.current = undefined;
      };
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new Ctx();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') {
            void ctx.resume();
          }
          const srcNode = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.45;
          srcNode.connect(analyser);
          analyser.connect(ctx.destination);
          const buf = new Uint8Array(analyser.fftSize);
          const sampleLevel = () => {
            if (!previewPlayingRef.current || stagePreviewAudioRef.current !== audio || audio.paused) {
              return;
            }
            analyser.getByteTimeDomainData(buf);
            let sumSq = 0;
            for (let i = 0; i < buf.length; i++) {
              const norm = (buf[i] - 128) / 128;
              sumSq += norm * norm;
            }
            const rms = Math.sqrt(sumSq / buf.length);
            speechLevelRef.current = Math.min(1, rms * 3.4);
            speechMeterRafRef.current = window.requestAnimationFrame(sampleLevel);
          };
          speechMeterRafRef.current = window.requestAnimationFrame(sampleLevel);
        }
      } catch {
        // Gracefully fall back to syllable cadence if Web Audio routing is unavailable
        speechLevelRef.current = undefined;
      }

      let settled = false;
      const finishOnce = () => {
        if (settled) return;
        settled = true;
        stopSpeechMeter();
        if (!previewPlayingRef.current) return;
        previewPlayTimerRef.current = window.setTimeout(() => {
          if (previewPlayingRef.current) onFinished();
        }, 220);
      };

      audio.onended = finishOnce;
      audio.onerror = () => {
        if (settled) return;
        settled = true;
        stopSpeechMeter();
        onFallbackSpeak();
        if (previewPlayingRef.current) {
          previewPlayTimerRef.current = window.setTimeout(() => {
            if (previewPlayingRef.current) onFinished();
          }, fallbackDelayMs);
        }
      };

      await audio.play();
    } catch (err) {
      if (controller.signal.aborted || !previewPlayingRef.current) return;
      if (err instanceof Error && err.message) {
        setTtsPreviewNote(err.message);
      }
      onFallbackSpeak();
      previewPlayTimerRef.current = window.setTimeout(() => {
        if (previewPlayingRef.current) onFinished();
      }, fallbackDelayMs);
    }
  };

  const startPreviewPlayback = () => {
    const count = Math.max(1, totalPreviewItems);
    stopPreviewPlayback();
    previewPlayingRef.current = true;
    setIsPlayingPreview(true);
    const startIdx = safeActiveIdx >= count - 1 ? 0 : safeActiveIdx;

    if (isAnimeMode) {
      const beats = parsedAnimeStory.beats;
      const runAnimeBeat = (idx: number) => {
        if (!previewPlayingRef.current) return;
        if (idx >= beats.length) {
          stopPreviewPlayback();
          return;
        }
        const beat = beats[idx];
        setActiveSceneIdx(idx);
        setCaptionReplayNonce((n) => n + 1);
        const charProfile = parsedAnimeStory.characters.find((c) => c.id === beat.speakerId);
        const charVoiceId =
          config.animeCharacterVoices?.[beat.speakerId] ??
          charProfile?.defaultVoiceId ??
          config.voiceId;
        const delayMs = Math.max(1700, Math.round(beat.estDurationSec * 1000));
        const shouldSpeak = !beat.isStageCue || Boolean(config.animeReadStageDirections);

        if (shouldSpeak && (config.ttsProvider === 'elevenlabs' || isElevenLabsVoiceId(charVoiceId))) {
          void playServerTtsBeat({
            text: beat.spokenText,
            voiceId: charVoiceId,
            fallbackDelayMs: delayMs,
            onFinished: () => runAnimeBeat(idx + 1),
            onFallbackSpeak: () =>
              speakPreviewSlideText(
                beat.spokenText,
                charProfile?.gender === 'female',
                charVoiceId,
                charProfile?.pitchRatio
              ),
          });
          return;
        }

        if (shouldSpeak) {
          speakPreviewSlideText(
            beat.spokenText,
            charProfile?.gender === 'female',
            charVoiceId,
            charProfile?.pitchRatio
          );
        }
        previewPlayTimerRef.current = window.setTimeout(() => {
          if (!previewPlayingRef.current) return;
          runAnimeBeat(idx + 1);
        }, delayMs);
      };
      runAnimeBeat(startIdx);
      return;
    }

    const runStep = (idx: number) => {
      if (!previewPlayingRef.current) return;
      if (idx >= count) {
        stopPreviewPlayback();
        return;
      }
      setActiveSceneIdx(idx);
      setCaptionReplayNonce((n) => n + 1);

      const lineText =
        stripNarrationTags(previewScenes[idx]?.sentence ?? previewLines[idx] ?? '') || '';
      const matchedRawIdx = findNonEmptyLineIndex(lineText, idx);
      const rawLineForIdx =
        matchedRawIdx !== null ? rawNonEmptyLines[matchedRawIdx] : lineText;
      const segForIdx =
        previewBaseSegments.find((s) => s.text === lineText) ??
        (matchedRawIdx !== null
          ? previewBaseSegments.find((s) => s.rawLineIndex === matchedRawIdx)
          : undefined) ??
        previewBaseSegments[idx];
      const isSecondary = segForIdx?.voiceSlot === 'secondary';
      const segVoiceId =
        segForIdx?.voiceId ??
        (isSecondary ? config.secondaryVoiceId || config.voiceId : config.voiceId);

      const hasPause =
        /\[PAUSE\]/i.test(rawLineForIdx) ||
        (/^\s*(?:Q|Question)\s*[:：]/i.test(rawLineForIdx) && (config.pauseBetweenLinesSec ?? 0) > 0);
      const pauseSec = Math.max(0, Math.round(config.pauseBetweenLinesSec ?? 0));
      const readDelayMs = Math.max(2200, Math.min(4200, Math.round(lineText.length * 52 + 1200)));

      const advanceAfterLine = () => {
        if (!previewPlayingRef.current) return;
        if (hasPause && pauseSec > 0) {
          handleRunCountdownPreview(() => {
            if (!previewPlayingRef.current) return;
            runStep(idx + 1);
          });
        } else {
          runStep(idx + 1);
        }
      };

      if (lineText && (config.ttsProvider === 'elevenlabs' || isElevenLabsVoiceId(segVoiceId))) {
        void playServerTtsBeat({
          text: lineText,
          voiceId: segVoiceId,
          fallbackDelayMs: hasPause && pauseSec > 0 ? 1250 : readDelayMs,
          onFinished: advanceAfterLine,
          onFallbackSpeak: () => speakPreviewSlideText(lineText, isSecondary, segVoiceId),
        });
        return;
      }

      speakPreviewSlideText(lineText, isSecondary, segVoiceId);

      if (hasPause && pauseSec > 0) {
        previewPlayTimerRef.current = window.setTimeout(() => {
          if (!previewPlayingRef.current) return;
          handleRunCountdownPreview(() => {
            if (!previewPlayingRef.current) return;
            runStep(idx + 1);
          });
        }, 1250);
      } else {
        previewPlayTimerRef.current = window.setTimeout(() => {
          if (!previewPlayingRef.current) return;
          runStep(idx + 1);
        }, readDelayMs);
      }
    };

    runStep(startIdx);
  };
  const activeCuratedBgs = selectCuratedBackgroundsForConfig({
    subject: config.subject,
    script: config.script,
    scriptStyle: config.scriptStyle,
    category: config.curatedBgCategory,
    bgId: config.curatedBgId,
    count: Math.max(1, totalPreviewItems),
  });
  const activeCuratedBg =
    activeCuratedBgs[safeActiveIdx % Math.max(1, activeCuratedBgs.length)] ??
    CURATED_BACKGROUNDS[0];
  const activeCuratedCategory: CuratedBackgroundCategory =
    config.curatedBgCategory ?? 'all';
  const filteredCuratedBackgrounds =
    activeCuratedCategory === 'all'
      ? CURATED_BACKGROUNDS
      : CURATED_BACKGROUNDS.filter((bg) => bg.category === activeCuratedCategory);
  const isLightNeutralBg =
    (config.materialSource === 'neutral_css_bg' && activeNeutralMeta.isLight) ||
    (config.materialSource === 'studio_2411' && active2411Meta.isLight);

  const promptSubjectInput =
    aiWebPromptMode === 'all_in_one' && isKnownPresetSubject(config.subject)
      ? ''
      : config.subject;

  const generatedPromptForWeb = buildMoneyPrinterPrompt({
    subject: promptSubjectInput,
    language: config.language,
    scriptStyle: config.scriptStyle,
    sentenceCount: config.sentenceCount,
    mode: aiWebPromptMode,
    rawScript: config.script,
    mediaTypeFilter: config.mediaTypeFilter ?? 'all',
    visualMood: config.visualMood ?? 'auto',
    aspectRatio: config.aspectRatio,
    dualVoiceEnabled: Boolean(config.dualVoiceEnabled) || isBilingualLanguage(config.language),
    pauseBetweenLinesSec: config.pauseBetweenLinesSec ?? 0,
    targetRepeatCount: config.targetRepeatCount ?? 0,
    fullAnswerRecapMode: config.fullAnswerRecapMode ?? 'off',
    summarizeAtEnd: Boolean(config.summarizeAtEnd),
    stickyDualSubtitle: config.stickyDualSubtitle !== false,
    subtitleEffect: config.subtitle.effect,
  });

  const applyPastedContent = (rawText: string, sourceHint = 'Clipboard') => {
    setScriptError(null);
    setAiWebStatus(null);
    const parsed = parseAiWebOrJsonOutput(rawText, config.subject);
    if (!parsed) {
      setScriptError('Nội dung dán chưa hợp lệ — hãy dán văn bản kịch bản hoặc JSON.');
      return false;
    }
    const nextSubject = parsed.subject || config.subject;
    const count = splitScriptSentences(parsed.script).length;
    const pastedLines = parsed.script.split('\n').map((l) => l.trim()).filter(Boolean);
    const hasQaTags = pastedLines.some((l) =>
      /^\s*(?:Tiêu\s*đề(?:\s*nhỏ)?|Title|Subtitle|Subheading|Heading|Q|A|Question|Answer|English|Japanese|Vietnamese|\[VI\]|\[EN\]|\[JA\])\s*[:：]?/i.test(
        l
      )
    );
    const hasJa = pastedLines.some((l) => hasCjkChars(stripNarrationTags(l)));
    const hasVi = pastedLines.some(
      (l) =>
        !/^\s*(?:Tiêu\s*đề(?:\s*nhỏ)?|Title|Subtitle)\s*[:：]/i.test(l) &&
        hasVietnameseDiacritics(stripNarrationTags(l))
    );
    const hasEnTarget = pastedLines.some((l) =>
      /^\s*(?:English|Tiếng\s*Anh|\[EN\])\s*[:：]?/i.test(l)
    );

    const autoLangPatch: Partial<RenderJobConfig> = {};
    if (hasQaTags || (hasJa && hasEnTarget)) {
      autoLangPatch.dualVoiceEnabled = true;
      autoLangPatch.stickyDualSubtitle = true;
      autoLangPatch.pauseBetweenLinesSec =
        (config.pauseBetweenLinesSec ?? 0) > 0 ? config.pauseBetweenLinesSec : 5;
      autoLangPatch.clockTickEnabled = config.clockTickEnabled !== false;
      const keepElevenLabs =
        config.ttsProvider === 'elevenlabs' ||
        isElevenLabsVoiceId(config.voiceId) ||
        isElevenLabsVoiceId(config.secondaryVoiceId ?? '');
      if (hasJa && !hasVi) {
        autoLangPatch.language = 'ja_en';
        if (!keepElevenLabs) {
          autoLangPatch.voiceId = 'ja-JP-NanamiNeural';
          autoLangPatch.secondaryVoiceId = 'en-US-JennyNeural';
        }
      } else if (hasVi && hasJa) {
        autoLangPatch.language = 'vi_ja';
        if (!keepElevenLabs) {
          autoLangPatch.voiceId = 'vi-VN-HoaiMyNeural';
          autoLangPatch.secondaryVoiceId = 'ja-JP-NanamiNeural';
        }
      } else if (hasVi && hasEnTarget) {
        autoLangPatch.language = 'bilingual';
        if (!keepElevenLabs) {
          autoLangPatch.voiceId = 'vi-VN-HoaiMyNeural';
          autoLangPatch.secondaryVoiceId = 'en-US-JennyNeural';
        }
      }
      if (pastedLines.some((l) => /^\s*(?:A|Answer)\s*[:：]/i.test(l))) {
        autoLangPatch.fullAnswerRecapMode =
          config.fullAnswerRecapMode === 'off' ? 'target_full' : config.fullAnswerRecapMode;
      }
    }

    if (parsed.visualMood) autoLangPatch.visualMood = parsed.visualMood;
    if (parsed.mediaTypeFilter) autoLangPatch.mediaTypeFilter = parsed.mediaTypeFilter;

    if (!rawText.trim().startsWith('{')) {
      setAiWebPromptMode('from_user_script');
    }

    const nextDualVoice = Boolean(autoLangPatch.dualVoiceEnabled ?? isDualVoiceMode);
    const nextSceneComponents = buildContextualSceneComponentsForScript({
      script: parsed.script,
      scriptStyle: config.scriptStyle,
      dualVoiceEnabled: nextDualVoice,
      pauseBetweenLinesSec:
        autoLangPatch.pauseBetweenLinesSec ?? config.pauseBetweenLinesSec ?? 5,
      existingOverrides: parsed.sceneComponents,
    });

    setTermsInput(parsed.terms.join(', '));
    setScriptSources([]);
    setPreviewScenes([]);
    setActiveSceneIdx(0);
    onChangeConfig({
      ...(parsed.subject ? { subject: parsed.subject } : {}),
      ...(count >= 2 && count <= 25 ? { sentenceCount: count } : {}),
      ...autoLangPatch,
      script: parsed.script,
      terms: parsed.terms,
      scenePrompts: parsed.scenePrompts,
      sceneComponents: nextSceneComponents,
      customScenes: undefined,
    });
    setScriptNote(
      `Đã áp dụng${parsed.subject ? ' chủ đề mới,' : ''} ${count} câu thoại & ${parsed.terms.length} từ khóa từ ${sourceHint}.`
    );
    setAiWebPasteText('');
    setShowQuickPaste(false);
    if (autoFetchScenesOnPaste) {
      void handlePreviewScenes({
        subject: nextSubject,
        script: parsed.script,
        terms: parsed.terms,
        scenePrompts: parsed.scenePrompts,
        sceneComponents: nextSceneComponents,
      });
    }
    return true;
  };

  const handleOneClickPaste = async () => {
    setScriptError(null);
    setScriptNote(null);
    // Clear existing content first before pasting from clipboard
    setPreviewScenes([]);
    setActiveSceneIdx(0);
    setAiWebPasteText('');
    onChangeConfig({ script: '', customScenes: undefined });
    try {
      if (navigator.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim().length > 0) {
          applyPastedContent(clipText, 'Clipboard');
          return;
        }
      }
    } catch {
      // Clipboard API blocked or denied; open sleek inline paste drawer after clearing content
    }
    setScriptNote('Đã xóa nội dung cũ. Bấm Ctrl+V để dán nội dung mới từ bộ nhớ đệm.');
    setShowQuickPaste(true);
    window.setTimeout(() => quickPasteRef.current?.focus(), 60);
  };

  const handleGenerateScript = async () => {
    setScriptError(null);
    setScriptNote(null);
    setScriptSources([]);
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: config.subject,
          language: config.language,
          scriptStyle: config.scriptStyle,
          sentenceCount: config.sentenceCount,
          llmProvider: config.llmProvider,
          dualVoiceEnabled: isDualVoiceMode,
        }),
      });
      const data = await safeParseJsonResponse<{
        script?: string;
        terms?: string[];
        scenePrompts?: string[];
        sceneComponents?: Studio2411SceneComponentOverride[];
        providerUsed?: string;
        groundingSources?: GroundingSource[];
        error?: string;
      }>(res, 'Không thể tạo kịch bản lúc này.');
      if (!res.ok || !data.script) {
        throw new Error(data.error || 'Không thể tạo kịch bản lúc này.');
      }
      const nextTerms = data.terms ?? extractEnglishSearchTerms(config.subject, data.script);
      const nextLines = splitScriptSentences(data.script);
      const nextScenePrompts =
        data.scenePrompts && data.scenePrompts.length > 0
          ? data.scenePrompts
          : buildScenePromptsFromScript(nextLines, config.subject, nextTerms);

      const nextSceneComponents = buildContextualSceneComponentsForScript({
        script: data.script,
        scriptStyle: config.scriptStyle,
        dualVoiceEnabled: isDualVoiceMode,
        pauseBetweenLinesSec: config.pauseBetweenLinesSec ?? 5,
        existingOverrides: data.sceneComponents,
      });

      setTermsInput(nextTerms.join(', '));
      setScriptSources(Array.isArray(data.groundingSources) ? data.groundingSources : []);
      setPreviewScenes([]);
      setActiveSceneIdx(0);
      onChangeConfig({
        script: data.script,
        terms: nextTerms,
        scenePrompts: nextScenePrompts,
        sceneComponents: nextSceneComponents,
        customScenes: undefined,
      });
      setScriptNote(
        `Đã tạo xong từ: ${data.providerUsed ?? 'AI miễn phí'} (${nextLines.length} câu · ${nextTerms.length} từ khóa B-roll)`
      );
    } catch (err) {
      setScriptError(err instanceof Error ? err.message : 'Lỗi khi tạo kịch bản.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleCopyPromptForWeb = async () => {
    try {
      await navigator.clipboard.writeText(generatedPromptForWeb);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    } catch {
      setAiWebStatus('Hãy bôi đen đoạn prompt bên dưới và bấm Ctrl+C.');
    }
  };

  const handlePreviewScenes = async (override?: {
    subject?: string;
    script?: string;
    terms?: string[];
    scenePrompts?: string[];
    sceneComponents?: Studio2411SceneComponentOverride[];
  }) => {
    setScenesError(null);
    setIsLoadingScenes(true);
    try {
      const effSubject = override?.subject ?? config.subject;
      const effScript = override?.script ?? config.script;
      const effTerms = override?.terms ?? config.terms;
      const sentences = splitScriptSentences(effScript);
      const rawPrompts = override?.scenePrompts ?? config.scenePrompts;
      const nextScenePrompts =
        rawPrompts.length >= sentences.length
          ? rawPrompts
          : buildScenePromptsFromScript(sentences, effSubject, effTerms);

      const res = await fetch('/api/preview-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: effSubject,
          script: effScript,
          terms: effTerms,
          scenePrompts: nextScenePrompts,
          sceneComponents: override?.sceneComponents ?? config.sceneComponents,
          materialSource: config.materialSource,
          neutralBgTheme: config.neutralBgTheme ?? 'slate_studio',
          studio2411Theme: config.studio2411Theme ?? 'cards_pastel',
          curatedBgCategory: config.curatedBgCategory ?? 'all',
          curatedBgId: config.curatedBgId ?? 'auto',
          scriptStyle: config.scriptStyle,
          language: config.language,
          dualVoiceEnabled: isDualVoiceMode,
          pauseBetweenLinesSec: config.pauseBetweenLinesSec ?? 5,
          mediaTypeFilter: config.mediaTypeFilter ?? 'all',
          visualMood: config.visualMood ?? 'auto',
          aspectRatio: config.aspectRatio,
          videoQuality: config.videoQuality ?? '720p',
          selectedMediaIds: config.selectedMediaIds,
          subtitleFontName: config.subtitle.fontName,
        }),
      });
      const data = await safeParseJsonResponse<{ scenes?: ScenePreviewItem[]; error?: string }>(
        res,
        'Không thể tải xem trước cảnh quay.'
      );
      if (!res.ok || !data.scenes) {
        throw new Error(data.error || 'Không thể tải xem trước cảnh quay.');
      }
      setPreviewScenes(data.scenes);
      onChangeConfig({ customScenes: data.scenes });
      setActiveSceneIdx(0);
    } catch (err) {
      setScenesError(err instanceof Error ? err.message : 'Lỗi tải xem trước cảnh quay.');
    } finally {
      setIsLoadingScenes(false);
    }
  };

  const updateScenesList = (nextScenes: ScenePreviewItem[], nextActiveIdx?: number) => {
    const reindexed = nextScenes.map((s, i) => ({ ...s, index: i }));
    setPreviewScenes(reindexed);
    onChangeConfig({ customScenes: reindexed });
    if (typeof nextActiveIdx === 'number') {
      setActiveSceneIdx(Math.max(0, Math.min(reindexed.length - 1, nextActiveIdx)));
    }
  };

  const handleDeleteScene = (idxToDelete: number) => {
    if (previewScenes.length <= 1) return;
    const next = previewScenes.filter((_, idx) => idx !== idxToDelete);
    const nextIdx =
      idxToDelete <= safeActiveIdx ? Math.max(0, safeActiveIdx - (idxToDelete === safeActiveIdx ? 0 : 1)) : safeActiveIdx;
    updateScenesList(next, Math.min(nextIdx, next.length - 1));
    setSceneEditStatus(`Đã xóa phân cảnh #${idxToDelete + 1}.`);
  };

  const handleSearchSceneAlternatives = async () => {
    if (!activeScene) return;
    setIsLoadingSceneAlt(true);
    setSceneEditStatus(null);
    try {
      const res = await fetch('/api/scenes/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sceneEditQuery.trim() || activeScene.prompt || config.subject,
          aspectRatio: config.aspectRatio,
          videoQuality: config.videoQuality ?? '720p',
          mediaTypeFilter: config.mediaTypeFilter ?? 'all',
          visualMood: config.visualMood ?? 'auto',
        }),
      });
      const data = await safeParseJsonResponse<{ candidates?: ScenePreviewItem[]; error?: string }>(
        res,
        'Không tìm được ảnh/video thay thế.'
      );
      if (!res.ok || !data.candidates) {
        throw new Error(data.error || 'Không tìm được ảnh/video thay thế.');
      }
      setSceneAltCandidates(data.candidates);
      if (data.candidates.length === 0) {
        setSceneEditStatus('Không tìm thấy mẫu phù hợp — hãy thử từ khóa tiếng Anh ngắn hơn.');
      }
    } catch (err) {
      setSceneEditStatus(err instanceof Error ? err.message : 'Lỗi tìm cảnh thay thế.');
    } finally {
      setIsLoadingSceneAlt(false);
    }
  };

  const handleGenerateAiForActiveScene = async () => {
    if (!activeScene) return;
    setIsGeneratingSceneAi(true);
    setSceneEditStatus(null);
    try {
      const res = await fetch('/api/scenes/ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sceneEditQuery.trim() || activeScene.prompt || config.subject,
          aspectRatio: config.aspectRatio,
          videoQuality: config.videoQuality ?? '720p',
          visualMood: config.visualMood ?? 'auto',
        }),
      });
      const data = await safeParseJsonResponse<{ scene?: ScenePreviewItem; error?: string }>(
        res,
        'Không tạo được ảnh AI mới.'
      );
      if (!res.ok || !data.scene) {
        throw new Error(data.error || 'Không tạo được ảnh AI mới.');
      }
      const next = previewScenes.map((s, idx) =>
        idx === safeActiveIdx
          ? {
              ...s,
              kind: data.scene!.kind,
              prompt: data.scene!.prompt,
              previewUrl: data.scene!.previewUrl,
              thumbUrl: data.scene!.thumbUrl,
              sourceLabel: data.scene!.sourceLabel,
            }
          : s
      );
      updateScenesList(next, safeActiveIdx);
      setSceneEditStatus(`Đã thay cảnh #${safeActiveIdx + 1} bằng ảnh AI mới.`);
    } catch (err) {
      setSceneEditStatus(err instanceof Error ? err.message : 'Lỗi tạo ảnh AI.');
    } finally {
      setIsGeneratingSceneAi(false);
    }
  };

  const handleReplaceSceneWithCandidate = (cand: ScenePreviewItem) => {
    if (!activeScene) return;
    const next = previewScenes.map((s, idx) =>
      idx === safeActiveIdx
        ? {
            ...s,
            kind: cand.kind,
            prompt: cand.prompt || sceneEditQuery || s.prompt,
            previewUrl: cand.previewUrl,
            thumbUrl: cand.thumbUrl,
            sourceLabel: cand.sourceLabel,
          }
        : s
    );
    updateScenesList(next, safeActiveIdx);
    setSceneEditStatus(`Đã thay thế phân cảnh #${safeActiveIdx + 1} (${cand.sourceLabel}).`);
  };

  const handleUploadSceneReplacement = async (file: File) => {
    if (!activeScene) return;
    setSceneEditStatus(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: form });
      const data = await safeParseJsonResponse<{ item?: MediaAssetItem; error?: string }>(
        res,
        'Vui lòng chọn tệp ảnh hoặc video hợp lệ.'
      );
      if (!res.ok || !data.item || data.item.kind === 'audio') {
        throw new Error(data.error || 'Vui lòng chọn tệp ảnh hoặc video hợp lệ.');
      }
      const next = previewScenes.map((s, idx) =>
        idx === safeActiveIdx
          ? {
              ...s,
              kind: data.item!.kind === 'image' ? ('image' as const) : ('video' as const),
              prompt: data.item!.name,
              previewUrl: data.item!.url,
              thumbUrl: data.item!.kind === 'image' ? data.item!.url : undefined,
              sourceLabel: 'Tệp tải lên từ máy',
            }
          : s
      );
      updateScenesList(next, safeActiveIdx);
      setSceneEditStatus(`Đã tải ${data.item.name} thay cho cảnh #${safeActiveIdx + 1}.`);
    } catch (err) {
      setSceneEditStatus(err instanceof Error ? err.message : 'Không thể tải tệp cho cảnh này.');
    }
  };

  const handlePreviewVoice = async () => {
    setIsPreviewingTts(true);
    setTtsPreviewNote(null);
    try {
      const animeSampleBeat = isAnimeMode
        ? parsedAnimeStory.beats.find((b, idx) => idx >= safeActiveIdx && !b.isStageCue) ??
          parsedAnimeStory.beats.find((b) => !b.isStageCue)
        : undefined;
      const animeSampleChar = animeSampleBeat
        ? parsedAnimeStory.characters.find((c) => c.id === animeSampleBeat.speakerId)
        : undefined;
      const effectiveVoiceId = animeSampleBeat
        ? config.animeCharacterVoices?.[animeSampleBeat.speakerId] ??
          animeSampleChar?.defaultVoiceId ??
          config.voiceId
        : config.voiceId;
      const sampleText =
        animeSampleBeat?.spokenText ||
        previewLines[0] ||
        `Xin chào, đây là giọng đọc thử của chủ đề ${config.subject || 'MoneyPrinterTurbo Việt Nam'}.`;
      const res = await fetch('/api/tts-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: config.subject,
          text: sampleText,
          script: config.script,
          language: config.language,
          scriptStyle: config.scriptStyle,
          voiceId: effectiveVoiceId,
          dualVoiceEnabled:
            !isAnimeMode &&
            (Boolean(config.dualVoiceEnabled) || isBilingualLanguage(config.language)),
          secondaryVoiceId:
            config.secondaryVoiceId ?? getDefaultSecondaryVoiceForLanguage(config.language),
          pauseBetweenLinesSec: isAnimeMode ? 0 : config.pauseBetweenLinesSec ?? 0,
          clockTickEnabled: !isAnimeMode && config.clockTickEnabled !== false,
          targetRepeatCount: isAnimeMode ? 0 : config.targetRepeatCount ?? 0,
          targetRepeatPauseSec: config.targetRepeatPauseSec ?? 2,
          fullAnswerRecapMode: isAnimeMode ? 'off' : config.fullAnswerRecapMode ?? 'off',
          summarizeAtEnd: !isAnimeMode && Boolean(config.summarizeAtEnd),
          ttsProvider: config.ttsProvider,
          voiceRate: config.voiceRate,
          elevenLabsApiKey: config.elevenLabsApiKey,
        }),
      });
      const data = await safeParseJsonResponse<{
        audioUrl?: string;
        engineUsed?: string;
        recoveredFromEdgeError?: boolean;
        fallbackNote?: string;
        error?: string;
      }>(res, 'Không tạo được giọng đọc thử.');
      if (!res.ok || !data.audioUrl) {
        throw new Error(data.error || 'Không tạo được giọng đọc thử.');
      }
      setPreviewAudioUrl(data.audioUrl);
      setTtsPreviewNote(
        data.fallbackNote
          ? data.fallbackNote
          : data.recoveredFromEdgeError
          ? `Edge-TTS bị Microsoft chặn 403 -> Đã tự chuyển sang ${data.engineUsed}`
          : `Đang phát thử từ ${data.engineUsed}`
      );
    } catch (err) {
      setTtsPreviewNote(err instanceof Error ? err.message : 'Lỗi khi nghe thử giọng.');
    } finally {
      setIsPreviewingTts(false);
    }
  };

  const handleSuggestTermsAndScenes = () => {
    const nextTerms = extractEnglishSearchTerms(config.subject, config.script);
    const lines = splitScriptSentences(config.script);
    const nextPrompts = buildScenePromptsFromScript(lines, config.subject, nextTerms);
    setTermsInput(nextTerms.join(', '));
    onChangeConfig({ terms: nextTerms, scenePrompts: nextPrompts });
  };

  const updateSubtitle = (patch: Partial<RenderJobConfig['subtitle']>) => {
    onChangeConfig({
      subtitle: { ...config.subtitle, ...patch },
    });
  };

  const toDownloadUrl = (fileUrl: string, downloadName: string, savedPath?: string): string => {
    if (savedPath || fileUrl.startsWith('/files/output/')) {
      const targetPath = savedPath || fileUrl.replace(/^\//, '');
      return `/api/download-output?path=${encodeURIComponent(targetPath)}&name=${encodeURIComponent(downloadName)}`;
    }
    const filename = fileUrl.split('/').pop() || downloadName;
    return `/api/download/${encodeURIComponent(filename)}?name=${encodeURIComponent(downloadName)}`;
  };

  const resolvedOutputDir = normalizeOutputSubdir(config.outputDir);
  const customOutName = config.outputFilename?.trim();
  const expectedBaseFilename = slugifyOutputFilename(
    customOutName || config.subject,
    '🚀 Video học tập',
    {
      script: config.script,
      scriptStyle: config.scriptStyle,
      language: config.language,
      includeEmoji: !customOutName,
    }
  );

  const activeBgmUrl =
    config.bgmPreset === 'none'
      ? null
      : config.bgmPreset === 'custom' && config.customBgmFilename
      ? `/files/uploads/${encodeURIComponent(config.customBgmFilename)}`
      : builtinBgm.find((b) => b.id === config.bgmPreset)?.url ?? `/files/bgm/${config.bgmPreset}.mp3`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:flex-1 lg:min-h-0">
      {/* Left Column: Focused 3-Step Video Studio (independent scroll) */}
      <div
        data-testid="studio-left-pane"
        className="lg:col-span-7 space-y-5 lg:h-full lg:overflow-y-auto overscroll-contain lg:pr-2 pb-6"
      >
        {/* 1. Real HD Video B-Roll OR 2D Anime Scene & Cast */}
        <section id="sec-visuals" className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              {isAnimeMode
                ? '1. Bối cảnh Hoạt hình 2D & Phân vai Nhân vật'
                : '1. Nguồn cảnh quay HD & Nhịp chuyển cảnh'}
            </h2>
            {!isAnimeMode && (
              <button
                type="button"
                disabled={isLoadingScenes || !config.script.trim()}
                onClick={() => void handlePreviewScenes()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {isLoadingScenes ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isLoadingScenes ? 'Đang nạp B-roll...' : 'Tìm & xem trước cảnh quay'}</span>
              </button>
            )}
          </div>

          {scenesError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {scenesError}
            </div>
          )}

          {isAnimeMode && (
            <div data-testid="anime-scene-config-panel" className="space-y-4">
              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-700">
                  Phong cách bối cảnh hoạt hình
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        id: 'room_warm',
                        label: 'Phòng khách Ấm áp',
                        hint: 'Ánh nắng shoji, chiếu tatami & bàn trà',
                        swatch: 'from-amber-100 to-amber-300',
                      },
                      {
                        id: 'dramatic_anime',
                        label: 'Anime Kịch tính',
                        hint: 'Tương phản cao · đường tốc độ cảm xúc',
                        swatch: 'from-amber-200 to-rose-300',
                      },
                      {
                        id: 'pastel_slice',
                        label: 'Pastel Đời thường',
                        hint: 'Nhẹ nhàng kiểu Slice-of-Life',
                        swatch: 'from-indigo-100 to-sky-200',
                      },
                    ] as Array<{ id: AnimeSceneStyle; label: string; hint: string; swatch: string }>
                  ).map((st) => {
                    const selected = (config.animeSceneStyle ?? 'room_warm') === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        data-testid={`anime-style-${st.id}`}
                        onClick={() => onChangeConfig({ animeSceneStyle: st.id })}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          selected
                            ? 'border-indigo-600 ring-2 ring-indigo-200 bg-indigo-50/40'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        }`}
                      >
                        <div className={`w-full h-5 rounded bg-gradient-to-r ${st.swatch} mb-1.5 border border-black/10`} />
                        <div className="text-xs font-semibold text-slate-900">{st.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{st.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="mpt-anime-room" className="text-xs font-medium text-slate-700">
                    Bối cảnh câu chuyện (Tự động đổi theo ngữ cảnh &amp; lời dẫn （...）)
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    <span>
                      Đang hiển thị:{' '}
                      {getAnimeRoomMeta(activeAnimeBeat?.roomKind ?? 'room_living').label}
                    </span>
                  </span>
                </div>
                <select
                  id="mpt-anime-room"
                  data-testid="anime-room-select"
                  value={config.animeRoomOverride ?? 'auto'}
                  onChange={(e) =>
                    onChangeConfig({
                      animeRoomOverride: e.target.value as 'auto' | AnimeRoomKind,
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  <option value="auto">
                    Tự động khớp câu chuyện &amp; tự chuyển cảnh khi có lời dẫn （...）
                  </option>
                  {ANIME_ROOM_METAS.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.label} — {room.hint}
                    </option>
                  ))}
                </select>
              </div>

              <div
                data-testid="anime-cast-panel"
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Dàn nhân vật tự động nhận diện ({parsedAnimeStory.characters.length} vai)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    PixiJS + GSAP 60fps · chuyển động mượt, nhép miệng theo giọng &amp; hiệu ứng hạt
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {parsedAnimeStory.characters.map((ch) => (
                    <div
                      key={ch.id}
                      data-testid={`anime-cast-${ch.id}`}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: ch.nameBadgeHex }}
                          />
                          <span>{ch.displayName}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {ch.gender === 'female' ? 'Nữ' : 'Nam'} · {ch.pitchRatio.toFixed(2)}x
                        </span>
                      </div>
                      <select
                        data-testid={`anime-cast-voice-${ch.id}`}
                        aria-label={`Giọng đọc cho ${ch.displayName}`}
                        value={config.animeCharacterVoices?.[ch.id] ?? ch.defaultVoiceId}
                        onChange={(e) => {
                          const nextVoice = e.target.value as VoiceOptionId;
                          onChangeConfig({
                            animeCharacterVoices: {
                              ...(config.animeCharacterVoices ?? {}),
                              [ch.id]: nextVoice,
                            },
                            ...(isElevenLabsVoiceId(nextVoice) ? { ttsProvider: 'elevenlabs' } : {}),
                          });
                        }}
                        className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded bg-white text-slate-900"
                      >
                        {renderVoiceSelectOptions()}
                      </select>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    id="mpt-anime-read-cues"
                    type="checkbox"
                    checked={Boolean(config.animeReadStageDirections)}
                    onChange={(e) => onChangeConfig({ animeReadStageDirections: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span>
                    Đọc thành tiếng lời dẫn cảnh trong ngoặc （...）(Tắt để chỉ diễn cảnh tự nhiên bằng hoạt hình)
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isAnimeMode && (
              <div>
                <label htmlFor="mpt-material-source" className="block text-xs font-medium text-slate-700 mb-1">
                  Nguồn video B-roll
                </label>
                <select
                  id="mpt-material-source"
                  value={config.materialSource}
                  onChange={(e) => {
                    setPreviewScenes([]);
                    onChangeConfig({
                      materialSource: e.target.value as MaterialSource,
                      customScenes: undefined,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  <option value="studio_2411">
                    Thẻ học tập Component 2411 (14 layout: Hội thoại, Flashcard, Roadmap, Gauge, 3D...)
                  </option>
                  <option value="anime_cartoon">
                    Hoạt hình 2D Hội thoại nhiều nhân vật (Mở khóa cử động &amp; cảm xúc)
                  </option>
                  <option value="mixkit_video">Video B-roll HD chuyển động mượt (Mixkit Free)</option>
                  <option value="curated_preset">
                    Kho nền có sẵn (Học tập · Phỏng vấn · Đời sống — Không cần AI)
                  </option>
                  <option value="hybrid_real">B-roll HD + Cảnh minh họa chọn lọc</option>
                  <option value="neutral_css_bg">Nền Trung Tính Studio (CSS Tối giản — Chữ siêu nét)</option>
                  <option value="stock_free">Kho Video &amp; Ảnh Archive / Wikimedia</option>
                  <option value="local_upload">
                    Video/Ảnh tải lên từ máy ({uploadedVisuals.length} tệp)
                  </option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Mặc định dùng <strong>Component 2411</strong> với 14 mẫu thẻ thông minh (nhân vật hội thoại, ví dụ, gợi nhớ). Có thể đổi sang <strong>Kho nền có sẵn</strong> hoặc <strong>Mixkit / B-roll</strong> bất cứ lúc nào.
                </p>
              </div>
            )}

            {config.materialSource === 'curated_preset' && (
              <div
                data-testid="curated-bg-picker"
                className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                    <span>Kho Background có sẵn (Offline · Không cần AI)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    9 cảnh dựng sẵn · Xuất MP4 cực nhanh
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Nhóm chủ đề background có sẵn">
                  {(['all', 'study', 'interview', 'life'] as CuratedBackgroundCategory[]).map((cat) => {
                    const selected = activeCuratedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        data-testid={`curated-cat-${cat}`}
                        onClick={() => {
                          setPreviewScenes([]);
                          onChangeConfig({
                            curatedBgCategory: cat,
                            curatedBgId: 'auto',
                            customScenes: undefined,
                          });
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {CURATED_CATEGORY_LABELS[cat]}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    data-testid="curated-bg-auto"
                    onClick={() => {
                      setPreviewScenes([]);
                      onChangeConfig({
                        curatedBgId: 'auto',
                        customScenes: undefined,
                      });
                    }}
                    className={`p-2 rounded-lg border text-left transition-all flex flex-col ${
                      !config.curatedBgId || config.curatedBgId === 'auto'
                        ? 'border-indigo-600 ring-2 ring-indigo-200 bg-white'
                        : 'border-slate-200 bg-white/80 hover:border-slate-400'
                    }`}
                  >
                    <div className="w-full h-16 rounded overflow-hidden grid grid-cols-3 gap-0.5 bg-slate-900 mb-1.5">
                      {filteredCuratedBackgrounds.slice(0, 3).map((item) => (
                        <img
                          key={item.id}
                          src={item.previewUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-900 leading-tight line-clamp-2">
                      Xoay vòng tự động
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-auto pt-0.5">
                      Đổi nền mượt mỗi câu
                    </div>
                  </button>

                  {filteredCuratedBackgrounds.map((bg) => {
                    const selected = config.curatedBgId === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        data-testid={`curated-bg-${bg.id}`}
                        onClick={() => {
                          setPreviewScenes([]);
                          onChangeConfig({
                            curatedBgId: bg.id,
                            customScenes: undefined,
                          });
                        }}
                        className={`p-2 rounded-lg border text-left transition-all flex flex-col ${
                          selected
                            ? 'border-indigo-600 ring-2 ring-indigo-200 bg-white'
                            : 'border-slate-200 bg-white/80 hover:border-slate-400'
                        }`}
                      >
                        <img
                          src={bg.previewUrl}
                          alt={bg.title}
                          className="w-full h-16 object-cover rounded border border-black/10 mb-1.5 bg-slate-900"
                        />
                        <div className="text-[11px] font-semibold text-slate-900 leading-tight line-clamp-2">
                          {bg.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-auto pt-0.5">
                          {bg.categoryLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {config.materialSource === 'studio_2411' && (
              <div
                data-testid="studio-2411-theme-picker"
                className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                    <span>Chọn giao diện thẻ học Component 2411</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      14 layout (gồm Hội thoại 2 nhân vật)
                    </span>
                    <button
                      type="button"
                      data-testid="studio-2411-auto-plan"
                      onClick={() => {
                        const autoPlanned = buildContextualSceneComponentsForScript({
                          script: config.script,
                          scriptStyle: config.scriptStyle,
                          dualVoiceEnabled: isDualVoiceMode,
                          pauseBetweenLinesSec: config.pauseBetweenLinesSec ?? 5,
                        });
                        setPreviewScenes([]);
                        setCaptionReplayNonce((n) => n + 1);
                        onChangeConfig({
                          sceneComponents: autoPlanned,
                          customScenes: undefined,
                        });
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 whitespace-nowrap"
                    >
                      Phối tự động AI
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {STUDIO_2411_THEMES.map((theme) => {
                    const selected = (config.studio2411Theme ?? 'cards_pastel') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        data-testid={`studio-2411-theme-${theme.id}`}
                        onClick={() => {
                          setPreviewScenes([]);
                          onChangeConfig({
                            studio2411Theme: theme.id as Studio2411ThemeId,
                            customScenes: undefined,
                          });
                        }}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          selected
                            ? 'border-indigo-600 ring-2 ring-indigo-200 bg-white'
                            : 'border-slate-200 bg-white/80 hover:border-slate-400'
                        }`}
                      >
                        <div
                          className="w-full h-7 rounded border border-black/10 mb-1.5 flex items-center justify-between px-1.5"
                          style={{
                            background: `linear-gradient(135deg, ${theme.bgTopHex}, ${theme.bgBottomHex})`,
                          }}
                        >
                          <span
                            className="w-4 h-2.5 rounded-sm border"
                            style={{
                              backgroundColor: theme.cardBgHex,
                              borderColor: theme.cardBorderHex,
                            }}
                          />
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.accentHex }}
                          />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-900 truncate">
                          {theme.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{theme.subtitle}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                  <div>
                    <label
                      htmlFor="mpt-2411-scene-variant"
                      className="block text-[11px] font-medium text-slate-700 mb-1"
                    >
                      Kiểu Component 2411 cho câu đang xem (#{safeActiveIdx + 1})
                    </label>
                    <select
                      id="mpt-2411-scene-variant"
                      value={active2411Spec.variant}
                      onChange={(e) => {
                        const nextVariant = e.target.value as Studio2411ComponentVariant;
                        const nextList = [...(config.sceneComponents ?? [])];
                        nextList[activeComponentEditIdx] = {
                          ...(nextList[activeComponentEditIdx] ?? {}),
                          variant: nextVariant,
                        };
                        setPreviewScenes([]);
                        setCaptionReplayNonce((n) => n + 1);
                        onChangeConfig({
                          sceneComponents: nextList,
                          customScenes: undefined,
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900"
                    >
                      {STUDIO_2411_VARIANT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label} — {opt.hint}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label
                        htmlFor="mpt-2411-scene-anim"
                        className="block text-[11px] font-medium text-slate-700 mb-1"
                      >
                        Hiệu ứng xuất hiện thẻ
                      </label>
                      <select
                        id="mpt-2411-scene-anim"
                        value={config.sceneComponents?.[activeComponentEditIdx]?.animationIn ?? active2411Spec.animationIn}
                        onChange={(e) => {
                          const nextAnim = e.target.value as Studio2411AnimationIn;
                          const nextList = [...(config.sceneComponents ?? [])];
                          nextList[activeComponentEditIdx] = {
                            ...(nextList[activeComponentEditIdx] ?? {}),
                            animationIn: nextAnim,
                          };
                          setPreviewScenes([]);
                          setCaptionReplayNonce((n) => n + 1);
                          onChangeConfig({
                            sceneComponents: nextList,
                            customScenes: undefined,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900"
                      >
                        {STUDIO_2411_ANIMATION_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {config.sceneComponents?.[activeComponentEditIdx] && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextList = [...(config.sceneComponents ?? [])];
                          delete nextList[activeComponentEditIdx];
                          setPreviewScenes([]);
                          setCaptionReplayNonce((n) => n + 1);
                          onChangeConfig({
                            sceneComponents: nextList,
                            customScenes: undefined,
                          });
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 whitespace-nowrap shrink-0"
                      >
                        Tự động
                      </button>
                    )}
                  </div>
                </div>

                {(active2411Spec.variant === 'friends-chat' ||
                  active2411Spec.variant === 'avatar-speech' ||
                  active2411Spec.variant === 'dialogue-upgrade') && (
                  <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor="mpt-2411-speech-text"
                        className="block text-[11px] font-medium text-slate-700 mb-1"
                      >
                        Lời thoại bóng thoại (#{safeActiveIdx + 1})
                      </label>
                      <input
                        id="mpt-2411-speech-text"
                        type="text"
                        value={config.sceneComponents?.[activeComponentEditIdx]?.speechText ?? active2411Spec.speechText}
                        onChange={(e) => {
                          const nextList = [...(config.sceneComponents ?? [])];
                          nextList[activeComponentEditIdx] = {
                            ...(nextList[activeComponentEditIdx] ?? {}),
                            variant: active2411Spec.variant,
                            speechText: e.target.value,
                          };
                          setPreviewScenes([]);
                          onChangeConfig({
                            sceneComponents: nextList,
                            customScenes: undefined,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="mpt-2411-reaction-text"
                        className="block text-[11px] font-medium text-slate-700 mb-1"
                      >
                        Nhãn phản hồi / Sắc thái
                      </label>
                      <input
                        id="mpt-2411-reaction-text"
                        type="text"
                        value={config.sceneComponents?.[activeComponentEditIdx]?.reactionText ?? active2411Spec.reactionText}
                        onChange={(e) => {
                          const nextList = [...(config.sceneComponents ?? [])];
                          nextList[activeComponentEditIdx] = {
                            ...(nextList[activeComponentEditIdx] ?? {}),
                            variant: active2411Spec.variant,
                            reactionText: e.target.value,
                          };
                          setPreviewScenes([]);
                          onChangeConfig({
                            sceneComponents: nextList,
                            customScenes: undefined,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/80">
                  <label
                    htmlFor="mpt-2411-example-text"
                    className="block text-[11px] font-medium text-slate-700 mb-1"
                  >
                    Ví dụ / Ghi chú gợi nhớ trên thẻ (#{safeActiveIdx + 1})
                  </label>
                  <input
                    id="mpt-2411-example-text"
                    type="text"
                    value={config.sceneComponents?.[activeComponentEditIdx]?.exampleText ?? active2411Spec.exampleText ?? ''}
                    onChange={(e) => {
                      const nextList = [...(config.sceneComponents ?? [])];
                      nextList[activeComponentEditIdx] = {
                        ...(nextList[activeComponentEditIdx] ?? {}),
                        variant: active2411Spec.variant,
                        exampleText: e.target.value,
                      };
                      setPreviewScenes([]);
                      onChangeConfig({
                        sceneComponents: nextList,
                        customScenes: undefined,
                      });
                    }}
                    placeholder="Ví dụ giao tiếp hữu ích hoặc câu gợi nhớ..."
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900"
                  />
                </div>
              </div>
            )}

            {config.materialSource === 'neutral_css_bg' && (
              <div
                data-testid="neutral-bg-theme-picker"
                className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                    <span>Chọn tông Nền Trung Tính (CSS Studio)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Chữ &amp; icon nổi bật tối đa
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {NEUTRAL_BG_THEMES.map((theme) => {
                    const selected = (config.neutralBgTheme ?? 'slate_studio') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        data-testid={`neutral-theme-${theme.id}`}
                        onClick={() => {
                          setPreviewScenes([]);
                          onChangeConfig({
                            neutralBgTheme: theme.id as NeutralBgTheme,
                            customScenes: undefined,
                          });
                        }}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          selected
                            ? 'border-indigo-600 ring-2 ring-indigo-200 bg-white'
                            : 'border-slate-200 bg-white/80 hover:border-slate-400'
                        }`}
                      >
                        <div
                          className={`w-full h-7 rounded border border-black/10 mb-1.5 mpt-neutral-bg-${theme.id}`}
                        />
                        <div className="text-[11px] font-semibold text-slate-900 truncate">
                          {theme.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{theme.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isAnimeMode && (
              <>
                <div>
                  <label htmlFor="mpt-media-filter" className="block text-xs font-medium text-slate-700 mb-1">
                    Loại tư liệu nền (Chỉ Ảnh / Chỉ Video)
                  </label>
                  <select
                    id="mpt-media-filter"
                    value={config.mediaTypeFilter ?? 'all'}
                    onChange={(e) => {
                      setPreviewScenes([]);
                      onChangeConfig({
                        mediaTypeFilter: e.target.value as MediaTypeFilter,
                        customScenes: undefined,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                  >
                    <option value="all">Video + Ảnh kết hợp (Mặc định)</option>
                    <option value="video_only">Chỉ tìm Video chuyển động (MP4)</option>
                    <option value="image_only">Chỉ tìm Ảnh tĩnh / Minh họa (JPG/PNG)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mpt-visual-mood" className="block text-xs font-medium text-slate-700 mb-1">
                    Phong cách hình ảnh &amp; Màu sắc (Mood)
                  </label>
                  <select
                    id="mpt-visual-mood"
                    value={config.visualMood ?? 'auto'}
                    onChange={(e) => {
                      setPreviewScenes([]);
                      onChangeConfig({
                        visualMood: e.target.value as VisualMood,
                        customScenes: undefined,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                  >
                    <option value="auto">Tự động khớp ngữ cảnh nội dung</option>
                    <option value="bright">Tươi sáng · Rạng rỡ (Bright Daylight)</option>
                    <option value="moody">U tối · Sâu lắng · Kịch tính (Moody)</option>
                    <option value="vibrant">Sinh động · Giàu năng lượng (Vibrant)</option>
                    <option value="minimal">Tối giản · Hiện đại · Gọn gàng (Minimal)</option>
                    <option value="cinematic">Điện ảnh · Chiều sâu 35mm (Cinematic)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="mpt-video-quality" className="block text-xs font-medium text-slate-700 mb-1">
                Chất lượng video xuất (.MP4)
              </label>
              <select
                id="mpt-video-quality"
                value={config.videoQuality ?? '720p'}
                onChange={(e) =>
                  onChangeConfig({ videoQuality: e.target.value as VideoQuality })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                <option value="480p">480p — Tiết kiệm dung lượng (Nhanh)</option>
                <option value="720p">720p — HD Chuẩn (Khuyên dùng)</option>
                <option value="1080p">1080p — Full HD Sắc nét</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-1">
                Tỷ lệ khung hình
              </span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: '9:16', label: '9:16 Dọc' },
                    { id: '16:9', label: '16:9 Ngang' },
                    { id: '1:1', label: '1:1 Vuông' },
                  ] as Array<{ id: VideoAspectRatio; label: string }>
                ).map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => onChangeConfig({ aspectRatio: ratio.id })}
                    className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      config.aspectRatio === ratio.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {!isAnimeMode && (
              <>
                <div>
                  <label htmlFor="mpt-concat" className="block text-xs font-medium text-slate-700 mb-1">
                    Nhịp cắt cảnh (Pacing)
                  </label>
                  <select
                    id="mpt-concat"
                    value={config.concatMode}
                    onChange={(e) =>
                      onChangeConfig({ concatMode: e.target.value as VideoConcatMode })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                  >
                    <option value="sequential">Tự động cắt nhịp ~3s khớp từng câu thoại</option>
                    <option value="random">Cắt đảo ngẫu nhiên theo thời lượng cố định</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Pacing là tốc độ &amp; cách đổi cảnh: <strong>Khớp từng câu</strong> tự động đổi cảnh theo nhịp đọc; <strong>Đảo ngẫu nhiên</strong> cắt đều theo số giây cố định.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="mpt-transition" className="block text-xs font-medium text-slate-700 mb-1">
                    Hiệu ứng chuyển cảnh
                  </label>
                  <select
                    id="mpt-transition"
                    value={config.transitionMode}
                    onChange={(e) =>
                      onChangeConfig({ transitionMode: e.target.value as VideoTransitionMode })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                  >
                    <option value="random">Ngẫu nhiên đa dạng nhiều hiệu ứng (Mặc định)</option>
                    <option value="fade">Chuyển mượt (Crossfade 0.3s)</option>
                    <option value="dissolve">Tan biến mềm mại (Dissolve)</option>
                    <option value="slide">Trượt ngang (Slide)</option>
                    <option value="smoothleft">Trượt êm điện ảnh (Smooth Slide)</option>
                    <option value="wipeleft">Quét ngang chuyển cảnh (Wipe)</option>
                    <option value="circleopen">Mở vòng tròn (Circle Open)</option>
                    <option value="radial">Xoay tia tròn (Radial)</option>
                    <option value="pixelize">Chuyển cảnh điểm ảnh (Pixelize)</option>
                    <option value="fadeblack">Chuyển qua tối điện ảnh (Fade Black)</option>
                    <option value="none">Cắt thẳng (Jump Cut nhanh)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {!isAnimeMode && config.concatMode === 'random' && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label htmlFor="mpt-clip-dur" className="font-medium text-slate-700">
                  Thời lượng mỗi đoạn cảnh
                </label>
                <span className="font-mono tabular-nums text-slate-900">{config.clipDurationSec}s</span>
              </div>
              <input
                id="mpt-clip-dur"
                type="range"
                min={2}
                max={8}
                step={0.5}
                value={config.clipDurationSec}
                onChange={(e) => onChangeConfig({ clipDurationSec: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>
          )}

          {/* Compact inline local uploads manager when user uploads files or picks local_upload */}
          {(uploadedVisuals.length > 0 || config.materialSource === 'local_upload') && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700">
                  Video/Ảnh đã tải lên ({uploadedVisuals.length})
                </span>
                <button
                  type="button"
                  onClick={onTriggerUpload}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:underline whitespace-nowrap"
                >
                  <Upload className="w-3 h-3" aria-hidden="true" />
                  <span>Thêm video/ảnh</span>
                </button>
              </div>
              {uploadedVisuals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedVisuals.map((item) => (
                    <div
                      key={item.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-800"
                    >
                      <span className="truncate max-w-[160px]">{item.name}</span>
                      <button
                        type="button"
                        aria-label={`Xóa ${item.name}`}
                        onClick={() => onDeleteMedia(item.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Voiceover, BGM & Clean Subtitles */}
        <section id="sec-audio" className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              2. Giọng đọc, Nhạc nền &amp; Phụ đề
            </h2>
            <button
              type="button"
              disabled={isPreviewingTts}
              onClick={() => void handlePreviewVoice()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {isPreviewingTts ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{isPreviewingTts ? 'Đang tạo thử...' : 'Nghe thử giọng'}</span>
            </button>
          </div>

          {(previewAudioUrl || ttsPreviewNote) && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              {ttsPreviewNote && <div className="text-xs text-slate-700">{ttsPreviewNote}</div>}
              {previewAudioUrl && (
                <audio controls src={previewAudioUrl} className="w-full h-9" />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isAnimeMode && (
              <div>
                <label htmlFor="mpt-voice-id" className="block text-xs font-medium text-slate-700 mb-1">
                  Giọng đọc 1 (Chính / Câu hỏi)
                </label>
                <select
                  id="mpt-voice-id"
                  value={config.voiceId}
                  onChange={(e) => {
                    const nextVoice = e.target.value as VoiceOptionId;
                    onChangeConfig({
                      voiceId: nextVoice,
                      ...(isElevenLabsVoiceId(nextVoice) ? { ttsProvider: 'elevenlabs' } : {}),
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  {renderVoiceSelectOptions()}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="mpt-tts-provider" className="block text-xs font-medium text-slate-700 mb-1">
                Bộ tổng hợp giọng
              </label>
              <select
                id="mpt-tts-provider"
                value={config.ttsProvider}
                onChange={(e) => onChangeConfig({ ttsProvider: e.target.value as TtsProvider })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                <option value="google_free">Google TTS Miễn phí (Ổn định 100%)</option>
                <option value="edge_auto">Edge Neural TTS (Tự chuyển Google nếu lỗi)</option>
                <option value="elevenlabs">ElevenLabs AI (Đa ngôn ngữ · dùng Key nhập bên dưới)</option>
              </select>
            </div>

            <div
              data-testid="elevenlabs-key-panel"
              className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="mpt-elevenlabs-key"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span>ELEVENLABS_API_KEY (Lưu cục bộ trên trình duyệt · dùng chung mọi tab)</span>
                </label>
                {config.elevenLabsApiKey?.trim() ? (
                  <span className="text-[11px] font-medium text-emerald-700">
                    Đã nhập key cục bộ · Sẵn sàng phát ElevenLabs
                  </span>
                ) : config.ttsProvider === 'elevenlabs' ? (
                  <span className="text-[11px] font-medium text-amber-700">
                    Đang chọn ElevenLabs (Mặc định) — dán API key vào đây để kích hoạt giọng ElevenLabs
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Tùy chọn — cần khi chọn giọng ElevenLabs AI
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    id="mpt-elevenlabs-key"
                    data-testid="elevenlabs-key-input"
                    type={showElKey ? 'text' : 'password'}
                    autoComplete="off"
                    value={config.elevenLabsApiKey ?? ''}
                    onChange={(e) => {
                      setElKeyStatus(null);
                      onChangeConfig({ elevenLabsApiKey: e.target.value });
                    }}
                    placeholder="sk_... (Nhập trực tiếp ELEVENLABS_API_KEY để dùng giọng ElevenLabs)"
                    className="w-full pl-3 pr-9 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    aria-label={showElKey ? 'Ẩn API key' : 'Hiện API key'}
                    onClick={() => setShowElKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showElKey ? (
                      <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  data-testid="elevenlabs-verify-btn"
                  disabled={isCheckingElKey}
                  onClick={() => void handleVerifyElevenLabsKey()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg disabled:opacity-50 whitespace-nowrap"
                >
                  {isCheckingElKey ? (
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  )}
                  <span>Kiểm tra &amp; Tải giọng ElevenLabs</span>
                </button>
                {config.elevenLabsApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setElKeyStatus(null);
                      onChangeConfig({ elevenLabsApiKey: '' });
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg whitespace-nowrap"
                  >
                    Xóa key
                  </button>
                )}
              </div>
              {elKeyStatus && (
                <div
                  className={`text-[11px] font-medium ${
                    elKeyStatus.ok ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {elKeyStatus.message}
                </div>
              )}
            </div>

            {!isAnimeMode && (
              <>
                <div className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        id="mpt-dual-voice"
                        type="checkbox"
                        checked={
                          Boolean(config.dualVoiceEnabled) || isBilingualLanguage(config.language)
                        }
                        onChange={(e) => {
                          const nextDual = e.target.checked || isBilingualLanguage(config.language);
                          const nextComponents = buildContextualSceneComponentsForScript({
                            script: config.script,
                            scriptStyle: config.scriptStyle,
                            dualVoiceEnabled: nextDual,
                            pauseBetweenLinesSec: config.pauseBetweenLinesSec ?? 5,
                          });
                          setPreviewScenes([]);
                          setCaptionReplayNonce((n) => n + 1);
                          onChangeConfig({
                            dualVoiceEnabled: e.target.checked,
                            secondaryVoiceId:
                              config.secondaryVoiceId ??
                              getDefaultSecondaryVoiceForLanguage(config.language),
                            sceneComponents: nextComponents,
                            customScenes: undefined,
                          });
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>
                        Chế độ 2 giọng đọc (Tự tách theo ngôn ngữ Việt / Anh / Nhật hoặc thẻ [VI] [EN] [JA] [V1] [V2])
                      </span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mỗi dòng tự động nhận diện ngôn ngữ để đọc đúng giọng bản xứ. Thêm{' '}
                    <code className="px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-mono">
                      [PAUSE]
                    </code>{' '}
                    vào cuối câu hỏi để chèn khoảng chờ đếm ngược 5s kèm tiếng đồng hồ tick-tock trước đáp án.
                  </p>

                  {(Boolean(config.dualVoiceEnabled) || isBilingualLanguage(config.language) || studioTab === 'learning') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label
                          htmlFor="mpt-voice-id-2"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Giọng đọc 2 (Ngoại ngữ / Đáp án)
                        </label>
                        <select
                          id="mpt-voice-id-2"
                          value={
                            config.secondaryVoiceId ??
                            getDefaultSecondaryVoiceForLanguage(config.language)
                          }
                          onChange={(e) => {
                            const nextVoice = e.target.value as VoiceOptionId;
                            onChangeConfig({
                              secondaryVoiceId: nextVoice,
                              ...(isElevenLabsVoiceId(nextVoice) ? { ttsProvider: 'elevenlabs' } : {}),
                            });
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                        >
                          {renderVoiceSelectOptions()}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <label htmlFor="mpt-pause-sec" className="font-medium text-slate-700">
                            Thời gian chờ suy nghĩ
                          </label>
                          <span className="font-mono tabular-nums text-slate-900">
                            {Number.isInteger(config.pauseBetweenLinesSec ?? 0)
                              ? `${config.pauseBetweenLinesSec ?? 0}s`
                              : `${(config.pauseBetweenLinesSec ?? 0).toFixed(1)}s`}
                          </span>
                        </div>
                        <input
                          id="mpt-pause-sec"
                          type="range"
                          min={0}
                          max={10}
                          step={0.5}
                          value={config.pauseBetweenLinesSec ?? 0}
                          onChange={(e) =>
                            onChangeConfig({ pauseBetweenLinesSec: Number(e.target.value) })
                          }
                          className="w-full accent-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2 pt-0.5">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                          <input
                            id="mpt-clock-tick"
                            type="checkbox"
                            checked={config.clockTickEnabled !== false}
                            onChange={(e) => onChangeConfig({ clockTickEnabled: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span>
                            Phát tiếng đồng hồ Tick-Tock &amp; Hiện từng số đếm ngược (5 → 1) trong lúc chờ
                          </span>
                        </label>
                      </div>

                      <div>
                        <label
                          htmlFor="mpt-target-repeat-count"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Lặp lại khi đọc sang ngôn ngữ đích
                        </label>
                        <select
                          id="mpt-target-repeat-count"
                          value={config.targetRepeatCount ?? 0}
                          onChange={(e) =>
                            onChangeConfig({ targetRepeatCount: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                        >
                          <option value={0}>Đọc 1 lần (Không lặp)</option>
                          <option value={1}>Đọc 2 lần (Lặp thêm 1 lần · Khuyên dùng)</option>
                          <option value={2}>Đọc 3 lần (Lặp thêm 2 lần)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <label htmlFor="mpt-target-repeat-pause" className="font-medium text-slate-700">
                            Nghỉ giữa các lần lặp câu dịch
                          </label>
                          <span className="font-mono tabular-nums text-slate-900">
                            {(config.targetRepeatPauseSec ?? 2).toFixed(1).replace(/\.0$/, '')}s
                          </span>
                        </div>
                        <input
                          id="mpt-target-repeat-pause"
                          type="range"
                          min={0.5}
                          max={5}
                          step={0.5}
                          value={config.targetRepeatPauseSec ?? 2}
                          onChange={(e) =>
                            onChangeConfig({ targetRepeatPauseSec: Number(e.target.value) })
                          }
                          className="w-full accent-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="mpt-full-answer-recap"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Đọc lại cả đoạn câu trả lời (khi câu trả lời gồm nhiều câu ghép lại)
                        </label>
                        <select
                          id="mpt-full-answer-recap"
                          value={config.fullAnswerRecapMode ?? 'off'}
                          onChange={(e) =>
                            onChangeConfig({
                              fullAnswerRecapMode: e.target.value as FullAnswerRecapMode,
                            })
                          }
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                        >
                          <option value="off">Chỉ đọc từng câu (Không ghép lại cả đoạn)</option>
                          <option value="target_full">
                            Đọc liền mạch cả đoạn câu trả lời bằng ngôn ngữ đích (Phỏng vấn / Hội thoại)
                          </option>
                          <option value="both_full">
                            Đọc liền mạch cả đoạn ngôn ngữ gốc + ngôn ngữ đích
                          </option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 pt-0.5">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                          <input
                            id="mpt-sticky-dual-sub"
                            type="checkbox"
                            checked={config.stickyDualSubtitle !== false}
                            onChange={(e) =>
                              onChangeConfig({ stickyDualSubtitle: e.target.checked })
                            }
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span>
                            Giữ câu ngôn ngữ gốc ở dưới khi câu đích đọc (Câu đích ở trên · Ẩn gốc cũ khi sang câu gốc mới)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 px-3 py-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-900 cursor-pointer">
                    <input
                      id="mpt-summarize-end"
                      type="checkbox"
                      checked={Boolean(config.summarizeAtEnd)}
                      onChange={(e) => onChangeConfig({ summarizeAtEnd: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span>
                      Tóm tắt nội dung đã học trước khi kết thúc video (tóm tắt câu hỏi phỏng vấn / kiến thức chính)
                    </span>
                  </label>
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label htmlFor="mpt-voice-rate" className="font-medium text-slate-700">
                  Tốc độ đọc
                </label>
                <span className="font-mono tabular-nums text-slate-900">
                  {config.voiceRate.toFixed(2)}x
                </span>
              </div>
              <input
                id="mpt-voice-rate"
                type="range"
                min={0.85}
                max={1.35}
                step={0.05}
                value={config.voiceRate}
                onChange={(e) => onChangeConfig({ voiceRate: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label htmlFor="mpt-bgm-vol" className="font-medium text-slate-700">
                  Âm lượng nhạc nền
                </label>
                <span className="font-mono tabular-nums text-slate-900">
                  {Math.round(config.bgmVolume * 100)}%
                </span>
              </div>
              <input
                id="mpt-bgm-vol"
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={config.bgmVolume}
                onChange={(e) => onChangeConfig({ bgmVolume: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label htmlFor="mpt-bgm" className="block text-xs font-medium text-slate-700 mb-1">
                  Nhạc nền nhẹ miễn phí (BGM)
                </label>
                <select
                  id="mpt-bgm"
                  value={
                    config.bgmPreset === 'custom' && config.customBgmFilename
                      ? `custom:${config.customBgmFilename}`
                      : config.bgmPreset
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('custom:')) {
                      onChangeConfig({
                        bgmPreset: 'custom',
                        customBgmFilename: val.replace('custom:', ''),
                      });
                    } else {
                      onChangeConfig({
                        bgmPreset: val as BgmPreset,
                        customBgmFilename: undefined,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  <option value="lofi_chill">Nhạc nhẹ Lofi êm dịu (Mặc định · 3%)</option>
                  <option value="soft_piano">Nhạc nhẹ Piano sâu lắng</option>
                  <option value="cinema_ambient">Nhạc nhẹ không gian điện ảnh</option>
                  <option value="tech_upbeat">Công nghệ nhịp điệu sáng tạo</option>
                  <option value="none">Không dùng nhạc nền</option>
                  {uploadedAudios.map((aud) => (
                    <option key={aud.id} value={`custom:${aud.id}`}>
                      Nhạc tải lên: {aud.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeBgmUrl && (
                <div>
                  <audio controls src={activeBgmUrl} className="w-full h-9" aria-label="Nghe thử nhạc nền" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Phụ đề tự động (tách 1–2 dòng gọn gàng)
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    id="mpt-show-role-badges"
                    type="checkbox"
                    checked={config.subtitle.showRoleBadges === true}
                    onChange={(e) => updateSubtitle({ showRoleBadges: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span>Nhãn vai trò &amp; icon ngữ cảnh</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.subtitle.enabled}
                    onChange={(e) => updateSubtitle({ enabled: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Hiển thị phụ đề</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="mpt-sub-effect" className="block text-xs font-medium text-slate-700 mb-1">
                  Hiệu ứng chạy chữ
                </label>
                <select
                  id="mpt-sub-effect"
                  value={config.subtitle.effect}
                  onChange={(e) => {
                    updateSubtitle({ effect: e.target.value as SubtitleEffect });
                    setCaptionReplayNonce((n) => n + 1);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  <option value="karaoke">Karaoke chạy chữ theo lời đọc</option>
                  <option value="laser">Chữ chạy Laser phát sáng (Neon Sweep)</option>
                  <option value="typewriter">Gõ chữ từng từ (Typewriter)</option>
                  <option value="pop_zoom">Bật nảy phóng to (TikTok Pop)</option>
                  <option value="fade_slide">Trượt lên &amp; mờ dần (Fade Slide)</option>
                  <option value="static">Hiển thị tĩnh cổ điển</option>
                </select>
              </div>

              <div>
                <label htmlFor="mpt-sub-box" className="block text-xs font-medium text-slate-700 mb-1">
                  Kiểu hiển thị phụ đề
                </label>
                <select
                  id="mpt-sub-box"
                  value={config.subtitle.boxStyle}
                  onChange={(e) => updateSubtitle({ boxStyle: e.target.value as SubtitleBoxStyle })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  <option value="outline">Chữ viền đen sắc nét (Chuẩn Reels/Shorts)</option>
                  <option value="dark_box">Nền hộp tối mờ (Dễ đọc trên mọi nền)</option>
                </select>
              </div>

              <div>
                <label htmlFor="mpt-sub-font" className="block text-xs font-medium text-slate-700 mb-1">
                  Phông chữ (Việt / Anh / Nhật)
                </label>
                <select
                  id="mpt-sub-font"
                  value={config.subtitle.fontName}
                  onChange={(e) => updateSubtitle({ fontName: e.target.value as SubtitleFont })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  <option value="M PLUS 1p">M PLUS 1p (Tiếng Nhật nét tròn sắc nét · Khuyên dùng)</option>
                  <option value="BIZ UDPGothic">BIZ UDPGothic (Tiếng Nhật chuẩn công sở · Dễ đọc)</option>
                  <option value="Noto Sans">Noto Sans (Tiếng Việt / Anh chuẩn nét)</option>
                  <option value="DejaVu Sans">DejaVu Sans (Đậm nét, rõ dấu)</option>
                  <option value="Liberation Sans">Liberation Sans (Hiện đại, gọn)</option>
                  <option value="JetBrains Mono">JetBrains Mono (Kỹ thuật)</option>
                </select>
              </div>

              <div>
                <label htmlFor="mpt-sub-pos" className="block text-xs font-medium text-slate-700 mb-1">
                  Vị trí phụ đề
                </label>
                <select
                  id="mpt-sub-pos"
                  value={config.subtitle.position}
                  onChange={(e) => updateSubtitle({ position: e.target.value as SubtitlePosition })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  <option value="bottom">Phía dưới (~13.5% từ đáy — An toàn)</option>
                  <option value="center">Chính giữa</option>
                  <option value="top">Phía trên</option>
                  <option value="custom">Tùy chỉnh (% từ đỉnh)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="mpt-sub-size" className="font-medium text-slate-700">
                    Cỡ chữ chính / Ngôn ngữ đích (trên)
                  </label>
                  <span className="font-mono tabular-nums">{config.subtitle.fontSize}px</span>
                </div>
                <input
                  id="mpt-sub-size"
                  type="range"
                  min={28}
                  max={62}
                  value={config.subtitle.fontSize}
                  onChange={(e) => updateSubtitle({ fontSize: Number(e.target.value) })}
                  className="w-full accent-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="mpt-sub-source-size" className="font-medium text-slate-700">
                    Cỡ chữ ngôn ngữ gốc (dưới)
                  </label>
                  <span className="font-mono tabular-nums">
                    {config.subtitle.sourceFontSize ?? Math.round(config.subtitle.fontSize * 0.8)}px
                  </span>
                </div>
                <input
                  id="mpt-sub-source-size"
                  type="range"
                  min={18}
                  max={56}
                  value={config.subtitle.sourceFontSize ?? Math.round(config.subtitle.fontSize * 0.8)}
                  onChange={(e) => updateSubtitle({ sourceFontSize: Number(e.target.value) })}
                  className="w-full accent-slate-900"
                />
              </div>

              {config.subtitle.position === 'custom' && (
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="mpt-sub-pct" className="font-medium text-slate-700">
                      Vị trí theo chiều dọc
                    </label>
                    <span className="font-mono tabular-nums">{config.subtitle.customPositionPct}%</span>
                  </div>
                  <input
                    id="mpt-sub-pct"
                    type="range"
                    min={10}
                    max={90}
                    value={config.subtitle.customPositionPct}
                    onChange={(e) => updateSubtitle({ customPositionPct: Number(e.target.value) })}
                    className="w-full accent-slate-900"
                  />
                </div>
              )}

              <div className="sm:col-span-2 space-y-2">
                <span className="block text-xs font-medium text-slate-700">
                  Bảng màu chữ đẹp gợi ý (bấm chọn nhanh)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUBTITLE_COLOR_THEMES.map((theme) => {
                    const isActive =
                      config.subtitle.textColor.toUpperCase() === theme.textColor &&
                      (config.subtitle.highlightColor || '').toUpperCase() === theme.highlightColor;
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() =>
                          updateSubtitle({
                            textColor: theme.textColor,
                            highlightColor: theme.highlightColor,
                            strokeColor: theme.strokeColor,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: theme.textColor }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20 -ml-2"
                          style={{ backgroundColor: theme.highlightColor }}
                        />
                        <span>{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="mpt-sub-color" className="text-xs font-medium text-slate-700">
                  Màu chữ chính
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {TEXT_COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Chọn màu chữ ${c}`}
                      onClick={() => updateSubtitle({ textColor: c })}
                      className={`w-6 h-6 rounded border ${
                        config.subtitle.textColor.toUpperCase() === c
                          ? 'border-slate-900 ring-2 ring-slate-300'
                          : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    id="mpt-sub-color"
                    type="color"
                    value={config.subtitle.textColor}
                    onChange={(e) => updateSubtitle({ textColor: e.target.value })}
                    className="w-8 h-7 p-0 border border-slate-200 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label htmlFor="mpt-stroke-color" className="text-xs font-medium text-slate-700">
                  Màu viền chữ
                </label>
                <input
                  id="mpt-stroke-color"
                  type="color"
                  value={config.subtitle.strokeColor}
                  onChange={(e) => updateSubtitle({ strokeColor: e.target.value })}
                  className="w-8 h-7 p-0 border border-slate-200 rounded cursor-pointer"
                />
              </div>
              {(config.subtitle.effect === 'karaoke' || config.subtitle.effect === 'laser') && (
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label htmlFor="mpt-sub-highlight" className="text-xs font-medium text-slate-700">
                    {config.subtitle.effect === 'laser'
                      ? 'Màu tia Laser phát sáng'
                      : 'Màu chữ chạy Karaoke'}
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {KARAOKE_COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Chọn màu nổi bật ${c}`}
                        onClick={() => updateSubtitle({ highlightColor: c })}
                        className={`w-6 h-6 rounded border ${
                          (config.subtitle.highlightColor || '#FACC15').toUpperCase() === c
                            ? 'border-slate-900 ring-2 ring-slate-300'
                            : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      id="mpt-sub-highlight"
                      type="color"
                      value={config.subtitle.highlightColor || '#FACC15'}
                      onChange={(e) => updateSubtitle({ highlightColor: e.target.value })}
                      className="w-8 h-7 p-0 border border-slate-200 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Unified Subject, Script Input & External AI Web Prompt + JSON Sync (placed AFTER options 1 & 2) */}
        <section id="sec-script" className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                3. Chủ đề, Kịch bản &amp; Tạo Prompt AI Web (JSON)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập chủ đề / nội dung lời thoại tự do, tạo Prompt đồng bộ các tùy chọn ở trên cho ChatGPT/Gemini Web, rồi dán JSON trả về.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewScenes([]);
                setScriptSources([]);
                setScriptNote(null);
                setScriptError(null);
                setActiveSceneIdx(0);
                onResetForm();
              }}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 underline whitespace-nowrap shrink-0"
            >
              Đặt lại mặc định
            </button>
          </div>

          <div>
            <label htmlFor="mpt-subject" className="block text-xs font-medium text-slate-700 mb-1.5">
              Chủ đề video
            </label>
            <input
              id="mpt-subject"
              type="text"
              value={config.subject}
              onChange={(e) => onChangeConfig({ subject: e.target.value })}
              placeholder="VD: Khoa học đằng sau tách cà phê Espresso hoàn hảo..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
            />
            {isAnimeMode ? (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Kịch bản hoạt hình mẫu:</span>
                {ANIME_STORY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`anime-preset-${preset.id}`}
                    onClick={() => {
                      setActiveSceneIdx(0);
                      onChangeConfig({
                        subject: preset.subject,
                        language: preset.language,
                        script: preset.script,
                      });
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors text-left ${
                      config.script.trim() === preset.script.trim()
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Mẫu nhanh:</span>
                {topicPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeConfig({ subject: preset })}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isAnimeMode && (
            <TopicDiscoveryBar
              currentSubject={config.subject}
              language={config.language}
              onSelectTopic={(title) => onChangeConfig({ subject: title })}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="mpt-language" className="block text-xs font-medium text-slate-700 mb-1">
                Ngôn ngữ
              </label>
              <select
                id="mpt-language"
                value={config.language}
                onChange={(e) => {
                  const nextLang = e.target.value as LanguageCode;
                  const isBilingual = isBilingualLanguage(nextLang);
                  const isInteractiveStyle =
                    config.scriptStyle === 'language_challenge' ||
                    config.scriptStyle === 'bilingual_dialogue' ||
                    config.scriptStyle === 'quiz_riddle';
                  const keepElevenLabs =
                    config.ttsProvider === 'elevenlabs' ||
                    isElevenLabsVoiceId(config.voiceId) ||
                    isElevenLabsVoiceId(config.secondaryVoiceId ?? '');
                  const patch: Partial<RenderJobConfig> = {
                    language: nextLang,
                    customScenes: undefined,
                    dualVoiceEnabled: isBilingual || isInteractiveStyle,
                    secondaryVoiceId: keepElevenLabs
                      ? isElevenLabsVoiceId(config.secondaryVoiceId ?? '')
                        ? config.secondaryVoiceId
                        : config.voiceId === 'el-rachel'
                        ? 'el-adam'
                        : 'el-rachel'
                      : getDefaultSecondaryVoiceForLanguage(nextLang),
                    pauseBetweenLinesSec:
                      config.scriptStyle === 'language_challenge' ||
                      config.scriptStyle === 'quiz_riddle'
                        ? Math.max(1.0, config.pauseBetweenLinesSec || 5)
                        : config.pauseBetweenLinesSec ?? 0,
                    clockTickEnabled:
                      config.scriptStyle === 'language_challenge' ||
                      config.scriptStyle === 'quiz_riddle'
                        ? config.clockTickEnabled !== false
                        : config.clockTickEnabled,
                  };
                  if (!keepElevenLabs && (!doesVoiceMatchLanguage(config.voiceId, nextLang) || isBilingual)) {
                    patch.voiceId = getDefaultVoiceForLanguage(nextLang);
                  }
                  if (isKnownPresetSubject(config.subject)) {
                    const nextPreset = getPresetsForLanguage(nextLang)[0];
                    const starter = generateOfflineVietnameseScript(
                      nextPreset,
                      nextLang,
                      config.sentenceCount,
                      undefined,
                      config.scriptStyle
                    );
                    patch.subject = nextPreset;
                    patch.script = starter.script;
                    patch.terms = starter.terms;
                    patch.scenePrompts = starter.scenePrompts;
                    setTermsInput(starter.terms.join(', '));
                    setPreviewScenes([]);
                  }
                  patch.sceneComponents = buildContextualSceneComponentsForScript({
                    script: patch.script ?? config.script,
                    scriptStyle: config.scriptStyle,
                    dualVoiceEnabled: Boolean(patch.dualVoiceEnabled),
                    pauseBetweenLinesSec: patch.pauseBetweenLinesSec ?? config.pauseBetweenLinesSec ?? 5,
                  });
                  onChangeConfig(patch);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                {studioTab === 'learning' ? (
                  <>
                    <option value="ja_en">Song ngữ Nhật – Anh (瞬間英作文)</option>
                    <option value="bilingual">Song ngữ Việt – Anh (Học Tiếng Anh)</option>
                    <option value="vi_ja">Song ngữ Việt – Nhật (Học Tiếng Nhật)</option>
                    <option value="en">Tiếng Anh (English)</option>
                    <option value="ja">Tiếng Nhật (日本語)</option>
                    <option value="vi">Tiếng Việt</option>
                  </>
                ) : (
                  <>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">Tiếng Anh (English)</option>
                    <option value="ja">Tiếng Nhật (日本語)</option>
                    <option value="bilingual">Song ngữ Việt – Anh</option>
                    <option value="vi_ja">Song ngữ Việt – Nhật</option>
                    <option value="ja_en">Song ngữ Nhật – Anh (瞬間英作文)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="mpt-style" className="block text-xs font-medium text-slate-700 mb-1">
                Phong cách
              </label>
              <select
                id="mpt-style"
                value={config.scriptStyle}
                onChange={(e) => {
                  const nextStyle = e.target.value as ScriptStyle;
                  const wantsDual =
                    nextStyle === 'language_challenge' ||
                    nextStyle === 'bilingual_dialogue' ||
                    nextStyle === 'quiz_riddle' ||
                    isBilingualLanguage(config.language);
                  const defaultSec = getDefaultSecondaryVoiceForLanguage(config.language);
                  const isChallengeOrQuiz =
                    nextStyle === 'language_challenge' || nextStyle === 'quiz_riddle';
                  const patch: Partial<RenderJobConfig> = {
                    scriptStyle: nextStyle,
                    customScenes: undefined,
                    dualVoiceEnabled: wantsDual,
                    secondaryVoiceId:
                      wantsDual &&
                      (!config.secondaryVoiceId ||
                        config.secondaryVoiceId === config.voiceId ||
                        (!isBilingualLanguage(config.language) &&
                          config.secondaryVoiceId.slice(0, 2) !== config.voiceId.slice(0, 2)))
                        ? defaultSec
                        : config.secondaryVoiceId ?? defaultSec,
                    pauseBetweenLinesSec: isChallengeOrQuiz ? 5 : 0,
                    clockTickEnabled: isChallengeOrQuiz ? true : false,
                  };
                  if (isKnownPresetSubject(config.subject)) {
                    const starter = generateOfflineVietnameseScript(
                      config.subject,
                      config.language,
                      config.sentenceCount,
                      undefined,
                      nextStyle
                    );
                    patch.script = starter.script;
                    patch.terms = starter.terms;
                    patch.scenePrompts = starter.scenePrompts;
                    setTermsInput(starter.terms.join(', '));
                    setPreviewScenes([]);
                  }
                  patch.sceneComponents = buildContextualSceneComponentsForScript({
                    script: patch.script ?? config.script,
                    scriptStyle: nextStyle,
                    dualVoiceEnabled: Boolean(patch.dualVoiceEnabled),
                    pauseBetweenLinesSec: patch.pauseBetweenLinesSec ?? config.pauseBetweenLinesSec ?? 5,
                  });
                  onChangeConfig(patch);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                {studioTab === 'learning' ? (
                  <>
                    <option value="language_challenge">Học ngoại ngữ / Phản xạ 5s (2 giọng)</option>
                    <option value="bilingual_dialogue">Hội thoại / Podcast 2 người</option>
                    <option value="quiz_riddle">Đố vui / Thử thách đáp nhanh 5s</option>
                  </>
                ) : (
                  <>
                    <option value="curious_facts">Sự thật tò mò (Hook 3s)</option>
                    <option value="storytelling">Kể chuyện cuốn hút</option>
                    <option value="tips_howto">Mẹo nhanh &amp; Thực tế</option>
                    <option value="news_fast">Tin nhanh súc tích</option>
                    <option value="motivational">Truyền cảm hứng / Triết lý</option>
                    <option value="top_list">Top xếp hạng / Danh sách nổi bật</option>
                  </>
                )}
              </select>
              {!isBilingualLanguage(config.language) &&
                (config.scriptStyle === 'language_challenge' ||
                  config.scriptStyle === 'bilingual_dialogue' ||
                  config.scriptStyle === 'quiz_riddle') && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Đang dùng 2 giọng cùng ngôn ngữ (Giọng 1 hỏi / Giọng 2 trả lời luân phiên).
                  </p>
                )}
            </div>

            <div className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <label htmlFor="mpt-count" className="font-medium text-slate-700">
                  Độ dài kịch bản (Ngắn → Dài)
                </label>
                <span className="font-mono tabular-nums text-slate-900">
                  {config.sentenceCount} câu · {getScriptLengthSummary(config.sentenceCount).tierLabel} (~
                  {getScriptLengthSummary(config.sentenceCount).estSec}s)
                </span>
              </div>
              <input
                id="mpt-count"
                type="range"
                min={2}
                max={25}
                step={1}
                value={config.sentenceCount}
                onChange={(e) => onChangeConfig({ sentenceCount: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {[
                  { count: 3, label: 'Rất ngắn (3 câu)' },
                  { count: 5, label: 'Ngắn (5 câu)' },
                  { count: 9, label: 'Trung bình (9 câu)' },
                  { count: 14, label: 'Dài (14 câu)' },
                  { count: 20, label: 'Rất dài (20 câu)' },
                ].map((preset) => (
                  <button
                    key={preset.count}
                    type="button"
                    onClick={() => onChangeConfig({ sentenceCount: preset.count })}
                    className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                      config.sentenceCount === preset.count
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="mpt-llm" className="block text-xs font-medium text-slate-700 mb-1">
                Nguồn viết kịch bản
              </label>
              <select
                id="mpt-llm"
                value={config.llmProvider}
                onChange={(e) => onChangeConfig({ llmProvider: e.target.value as LlmProvider })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                <option value="pollinations">AI Tự động + Wikipedia (Việt / Anh / Nhật)</option>
                <option value="gemini_search">Gemini AI + Tìm kiếm Google</option>
                <option value="ollama">Ollama Local (11434)</option>
                <option value="offline_vi">Mẫu Offline (Tức thì · 0ms)</option>
              </select>
            </div>
          </div>

          {/* Primary Script Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingScript}
              onClick={() => void handleGenerateScript()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {isGeneratingScript ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{isGeneratingScript ? 'Đang tạo kịch bản...' : 'Tạo kịch bản AI'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleOneClickPaste()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ClipboardPaste className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dán kịch bản / JSON</span>
            </button>
          </div>

          {(scriptNote || scriptError) && (
            <div className={`text-xs ${scriptError ? 'text-rose-700' : 'text-emerald-700'}`}>
              {scriptError ?? scriptNote}
            </div>
          )}

          {scriptSources.length > 0 && (
            <div
              data-testid="script-grounding-sources"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-2"
            >
              <span className="font-medium text-emerald-900">Nguồn thực tế đối chiếu:</span>
              {scriptSources.slice(0, 4).map((src, idx) => (
                <a
                  key={`${src.url}_${idx}`}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-700 hover:underline max-w-[220px]"
                >
                  <span className="truncate">{src.title}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}

          {showQuickPaste && (
            <div
              data-testid="quick-paste-bar"
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="mpt-quick-paste" className="text-xs font-semibold text-slate-900">
                  Dán (Ctrl+V) văn bản kịch bản hoặc JSON vào đây — tự động tách lời thoại &amp; từ khóa
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickPaste(false)}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Đóng
                </button>
              </div>
              <textarea
                id="mpt-quick-paste"
                ref={quickPasteRef}
                rows={3}
                value={aiWebPasteText}
                onChange={(e) => setAiWebPasteText(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData?.getData('text');
                  if (pasted && pasted.trim().length > 4) {
                    e.preventDefault();
                    applyPastedContent(pasted, 'Paste');
                  }
                }}
                placeholder='Bấm Ctrl+V để dán văn bản hoặc {"script": "...", "terms": [...]}'
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={!aiWebPasteText.trim()}
                  onClick={() => applyPastedContent(aiWebPasteText, 'Paste')}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-45 whitespace-nowrap shrink-0"
                >
                  Áp dụng nội dung đã dán
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label htmlFor="mpt-script" className="text-xs font-medium text-slate-700">
                Nội dung lời thoại
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleOneClickPaste()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:underline whitespace-nowrap shrink-0"
                >
                  <ClipboardPaste className="w-3 h-3" aria-hidden="true" />
                  <span>Dán nhanh</span>
                </button>
                <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                  {previewLines.length} câu · {config.script.trim().length} ký tự
                </span>
              </div>
            </div>
            <textarea
              id="mpt-script"
              rows={6}
              value={config.script}
              onChange={(e) => {
                setPreviewScenes([]);
                onChangeConfig({
                  script: e.target.value,
                  sceneComponents: undefined,
                  customScenes: undefined,
                });
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData('text');
                if (!pasted) return;
                const trimmed = pasted.trim();
                const isReplacingAll =
                  e.currentTarget.value.trim() === '' ||
                  (e.currentTarget.selectionStart === 0 &&
                    e.currentTarget.selectionEnd === e.currentTarget.value.length);
                const looksLikeQaOrTagged =
                  trimmed.includes('\n') &&
                  trimmed
                    .split('\n')
                    .some((l) =>
                      /^\s*(?:Tiêu\s*đề(?:\s*nhỏ)?|Title|Subtitle|Subheading|Heading|Intro|Outro|Q|A|Question|Answer|English|Japanese|Vietnamese|\[VI\]|\[EN\]|\[JA\])\s*[:：]/i.test(
                        l
                      )
                    );
                if (
                  (trimmed.startsWith('{') && trimmed.includes('"script"')) ||
                  (isReplacingAll && looksLikeQaOrTagged)
                ) {
                  e.preventDefault();
                  applyPastedContent(pasted, 'Dán trực tiếp');
                }
              }}
              placeholder="Nhập hoặc dán lời thoại bất kỳ (đoạn văn, phỏng vấn, hội thoại...). Dùng mục Tạo Prompt AI Web ngay bên dưới để AI tự tách câu, gắn thẻ, chèn [PAUSE] 5s và xuất JSON."
              className="w-full px-3.5 py-2.5 text-sm leading-relaxed border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
            />

            {isAnimeMode && parsedAnimeStory.beats.length > 0 ? (
              <div
                data-testid="anime-storyboard-beats"
                className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                    <span>Phân cảnh Hoạt hình ({parsedAnimeStory.beats.length} nhịp · bấm để xem nhân vật diễn)</span>
                  </span>
                  <span className="text-slate-500 font-normal">
                    {parsedAnimeStory.characters.map((c) => c.displayName).join(' · ')}
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                  {parsedAnimeStory.beats.map((beat, bi) => {
                    const isSelected = safeActiveIdx === bi;
                    const charObj = parsedAnimeStory.characters.find((c) => c.id === beat.speakerId);
                    const prevBeatRoom = bi > 0 ? parsedAnimeStory.beats[bi - 1].roomKind : null;
                    const roomChanged = bi === 0 || prevBeatRoom !== beat.roomKind;
                    return (
                      <button
                        key={bi}
                        type="button"
                        data-testid={`anime-beat-${bi}`}
                        onClick={() => {
                          setActiveSceneIdx(bi);
                          setCaptionReplayNonce((n) => n + 1);
                        }}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`w-full py-1.5 px-2.5 flex items-center justify-between gap-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/90 text-slate-900 font-medium'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-slate-400 w-5 shrink-0">
                            #{bi + 1}
                          </span>
                          {roomChanged && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 text-[10px] font-semibold shrink-0">
                              {getAnimeRoomMeta(beat.roomKind).label}
                            </span>
                          )}
                          {beat.isStageCue ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold shrink-0">
                              {beat.enteringCharacterId ? `Vào cảnh: ${beat.enteringCharacterId}` : 'Chuyển cảnh'}
                            </span>
                          ) : (
                            <span
                              className="px-1.5 py-0.5 rounded text-white text-[10px] font-bold shrink-0"
                              style={{ backgroundColor: charObj?.nameBadgeHex ?? '#4F46E5' }}
                            >
                              {beat.speakerName}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            [{beat.action}]
                          </span>
                          <span className="truncate">{beat.rawText}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {beat.estDurationSec.toFixed(1)}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              rawNonEmptyLines.length > 0 && (
                <div
                  data-testid="script-presentation-breakdown"
                  className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Phân vai &amp; Ngữ cảnh từng câu (bấm để xem trước)</span>
                    </span>
                    <span className="text-slate-500 font-normal">
                      {rawNonEmptyLines.length} dòng
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                    {rawNonEmptyLines.map((line, lineIdx) => {
                      const segInfo = previewBaseSegments[lineIdx];
                      const pres = analyzeScriptLinePresentation(line, {
                        isSecondarySlot: segInfo?.voiceSlot === 'secondary',
                        isIntroOrOutro: segInfo?.isIntroOrOutro,
                        scriptStyle: config.scriptStyle,
                      });
                      const isSelectedLine = activeRawLineIdx === lineIdx;
                      return (
                        <button
                          key={lineIdx}
                          type="button"
                          onClick={() => {
                            const cleanTarget = stripNarrationTags(line);
                            const matchedPreviewIdx = previewLines.findIndex(
                              (pl) =>
                                pl === cleanTarget ||
                                (cleanTarget && (cleanTarget.startsWith(pl) || pl.includes(cleanTarget)))
                            );
                            const nextPreviewIdx =
                              matchedPreviewIdx >= 0
                                ? matchedPreviewIdx
                                : Math.min(lineIdx, Math.max(0, totalPreviewItems - 1));
                            setActiveSceneIdx(nextPreviewIdx);
                            setCaptionReplayNonce((n) => n + 1);
                          }}
                          aria-current={isSelectedLine ? 'true' : undefined}
                          className={`w-full py-1.5 px-2.5 flex items-center justify-between gap-2 text-left text-xs transition-colors ${
                            isSelectedLine
                              ? 'bg-indigo-50/90 text-slate-900 font-medium'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold shrink-0 ${
                                BREAKDOWN_TONE_CLASSES[pres.roleTone]
                              }`}
                            >
                              <PresentationIcon iconKey={pres.roleIconKey} className="w-3 h-3 shrink-0" />
                              <span>{pres.roleLabel}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 shrink-0">
                              <PresentationIcon iconKey={pres.contextIconKey} className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{pres.contextLabel}</span>
                            </span>
                            <span className="truncate">{pres.cleanText || line}</span>
                          </div>
                          {pres.hasPause && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-mono font-semibold shrink-0">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              <span>
                                {pres.pauseSec ?? Math.round(config.pauseBetweenLinesSec || 5)}s
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label htmlFor="mpt-terms" className="text-xs font-medium text-slate-700">
                Từ khóa tìm cảnh quay B-roll (tiếng Anh)
              </label>
              <button
                type="button"
                onClick={handleSuggestTermsAndScenes}
                className="text-xs font-medium text-indigo-700 hover:underline whitespace-nowrap shrink-0"
              >
                Tự gợi ý từ kịch bản
              </button>
            </div>
            <input
              id="mpt-terms"
              type="text"
              value={termsInput}
              onChange={(e) => {
                setTermsInput(e.target.value);
                onChangeConfig({
                  terms: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                });
              }}
              placeholder="coffee espresso, ocean waves, mountain sunset"
              className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Integrated AI Web Prompt Generator & JSON Importer */}
          <div
            id="sec-ai-prompt"
            data-testid="ai-web-prompt-panel"
            className="pt-4 border-t border-slate-200 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">
                  Tạo Prompt AI Web &amp; Đồng bộ JSON (ChatGPT / Gemini)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prompt tự động lấy Nội dung lời thoại ở trên + toàn bộ tùy chọn Bước 1–2 để AI Web phân tích, tách câu, gắn thẻ (Tiêu đề:, Q:, A:, English:, [VI]/[EN]/[JA]), chèn [PAUSE] 5s và xuất file JSON.
                </p>
              </div>
              <button
                type="button"
                aria-expanded={showAiWebPanel}
                onClick={() => setShowAiWebPanel((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0"
              >
                <span>{showAiWebPanel ? 'Thu gọn' : 'Mở rộng'}</span>
                {showAiWebPanel ? (
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>

            {showAiWebPanel && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAiWebPromptMode('from_user_script')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                        aiWebPromptMode === 'from_user_script'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Từ kịch bản đã nhập + Tùy chọn trên
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiWebPromptMode('from_subject')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                        aiWebPromptMode === 'from_subject'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Viết mới theo chủ đề
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiWebPromptMode('all_in_one')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                        aiWebPromptMode === 'all_in_one'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      All-in-One (AI tự chọn tất cả)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="https://chatgpt.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 whitespace-nowrap"
                    >
                      <span>ChatGPT</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                    <a
                      href="https://gemini.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 whitespace-nowrap"
                    >
                      <span>Gemini</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleCopyPromptForWeb()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 whitespace-nowrap"
                    >
                      {copiedPrompt ? (
                        <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3 h-3" aria-hidden="true" />
                      )}
                      <span>{copiedPrompt ? 'Đã copy Prompt' : 'Copy Prompt'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                  <span className="font-mono">
                    Đã đồng bộ: {config.aspectRatio} · {config.mediaTypeFilter ?? 'all'} · mood{' '}
                    {config.visualMood ?? 'auto'} · {config.subtitle.effect} · chờ{' '}
                    {config.pauseBetweenLinesSec ?? 0}s · lặp {config.targetRepeatCount ?? 0}x
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoFetchScenesOnPaste}
                      onChange={(e) => setAutoFetchScenesOnPaste(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span>Tự tìm ảnh/video khi dán JSON</span>
                  </label>
                </div>

                <textarea
                  id="mpt-generated-prompt"
                  readOnly
                  rows={5}
                  value={generatedPromptForWeb}
                  aria-label="Prompt chuẩn MoneyPrinterTurbo đồng bộ đầy đủ tùy chọn để dán vào ChatGPT hoặc Gemini Web"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                />

                <div className="space-y-1.5 pt-1">
                  <label htmlFor="mpt-ai-web-paste" className="block text-[11px] font-medium text-slate-700">
                    Dán kết quả JSON từ ChatGPT / Gemini Web vào đây để cập nhật Kịch bản &amp; Tìm Ảnh/Video:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                      id="mpt-ai-web-paste"
                      rows={2}
                      value={aiWebPasteText}
                      onChange={(e) => setAiWebPasteText(e.target.value)}
                      placeholder='{"subject": "...", "script": "...", "terms": [...], "scenePrompts": [...]}'
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      disabled={!aiWebPasteText.trim()}
                      onClick={() => applyPastedContent(aiWebPasteText, 'Web AI')}
                      className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-45 whitespace-nowrap self-end sm:self-stretch"
                    >
                      Áp dụng &amp; Tìm cảnh
                    </button>
                  </div>
                </div>
                {aiWebStatus && <div className="text-xs text-slate-700">{aiWebStatus}</div>}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Live Video Stage, Storyboard, Render & Completed Output (independent scroll) */}
      <div
        data-testid="studio-right-pane"
        className="lg:col-span-5 space-y-5 lg:h-full lg:overflow-y-auto overscroll-contain lg:pr-1 pb-6"
      >
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Xem trước khung hình &amp; phụ đề
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {config.aspectRatio} · {config.videoQuality ?? '720p'} · {config.subtitle.fontName} ·{' '}
                {config.subtitle.fontSize}px
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="preview-play-btn"
                onClick={isPlayingPreview ? stopPreviewPlayback : startPreviewPlayback}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border whitespace-nowrap ${
                  isPlayingPreview
                    ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                    : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {isPlayingPreview ? (
                  <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                )}
                <span>{isPlayingPreview ? 'Dừng phát' : 'Phát thử Preview'}</span>
              </button>
              {!isAnimeMode &&
                (config.materialSource === 'studio_2411' ||
                  studioTab === 'learning' ||
                  (config.pauseBetweenLinesSec ?? 0) >= 1.5) && (
                <button
                  type="button"
                  data-testid="preview-countdown-btn"
                  onClick={() =>
                    previewCountdown !== null
                      ? stopCountdownPreview()
                      : handleRunCountdownPreview()
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md whitespace-nowrap"
                >
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span>
                    {previewCountdown !== null
                      ? 'Dừng đếm ngược'
                      : `Đếm ngược ${Math.max(1, Math.min(10, Math.round(config.pauseBetweenLinesSec || 5)))}s`}
                  </span>
                </button>
              )}
              {config.subtitle.enabled && (
                <button
                  type="button"
                  onClick={() => setCaptionReplayNonce((n) => n + 1)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Chạy lại chữ</span>
                </button>
              )}
              {totalPreviewItems > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Câu xem trước trước"
                    onClick={() =>
                      setActiveSceneIdx((idx) =>
                        idx <= 0 ? totalPreviewItems - 1 : idx - 1
                      )
                    }
                    className="px-1.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    ‹
                  </button>
                  <span className="text-[11px] font-mono text-slate-600 tabular-nums">
                    {safeActiveIdx + 1}/{totalPreviewItems}
                  </span>
                  <button
                    type="button"
                    aria-label="Câu xem trước tiếp theo"
                    onClick={() =>
                      setActiveSceneIdx((idx) => (idx + 1) % totalPreviewItems)
                    }
                    className="px-1.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {ttsPreviewNote && (
            <div
              data-testid="stage-tts-engine-note"
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium ${
                ttsPreviewNote.includes('ElevenLabs') && !ttsPreviewNote.includes('Google TTS')
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {ttsPreviewNote}
            </div>
          )}

          <div className="bg-slate-950 rounded-xl border border-slate-200 p-4 flex justify-center">
            <div
              data-testid="studio-preview-stage"
              className={`relative overflow-hidden rounded-lg border border-slate-800 ${
                config.materialSource === 'neutral_css_bg' && !activeScene
                  ? `mpt-neutral-bg-${activeNeutralMeta.id}`
                  : 'bg-slate-900'
              } ${
                config.aspectRatio === '9:16'
                  ? 'aspect-[9/16] w-full max-w-[245px]'
                  : config.aspectRatio === '1:1'
                  ? 'aspect-square w-full max-w-[300px]'
                  : 'aspect-video w-full'
              }`}
            >
              {isAnimeMode ? (
                <AnimeStoryStage
                  story={parsedAnimeStory}
                  beatIndex={safeActiveIdx}
                  aspectRatio={config.aspectRatio}
                  sceneStyle={config.animeSceneStyle ?? 'room_warm'}
                  fontName={config.subtitle.fontName}
                  isPlaying={isPlayingPreview}
                  subtitleEffect={config.subtitle.effect}
                  highlightColor={config.subtitle.highlightColor}
                  replayNonce={captionReplayNonce}
                  speechLevelRef={speechLevelRef}
                />
              ) : activeScene ? (
                activeScene.kind === 'video' ? (
                  <video
                    key={activeScene.previewUrl}
                    src={activeScene.previewUrl}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="animate-mpt-scene-fade absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    key={activeScene.previewUrl}
                    src={activeScene.previewUrl}
                    alt={activeScene.sentence}
                    className="animate-mpt-scene-fade absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : config.materialSource === 'studio_2411' ? (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${active2411Meta.bgTopHex}, ${active2411Meta.bgBottomHex})`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-70 pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${active2411Meta.gridColorRgba} 1px, transparent 1px), linear-gradient(to bottom, ${active2411Meta.gridColorRgba} 1px, transparent 1px)`,
                      backgroundSize: '24px 24px',
                    }}
                  />
                  <div
                    className="absolute -top-10 -left-10 w-44 h-44 rounded-full blur-2xl opacity-55 pointer-events-none"
                    style={{ backgroundColor: active2411Meta.bgAccentHex }}
                  />
                  {exiting2411Card && (
                    <div key={`exit_${exiting2411Card.key}`} className="absolute inset-0 z-[5]">
                      <Studio2411StageCard
                        rawLine={exiting2411Card.rawLine}
                        lineIndex={exiting2411Card.lineIndex}
                        totalLines={exiting2411Card.totalLines}
                        isSecondarySlot={exiting2411Card.isSecondarySlot}
                        isIntroOrOutro={exiting2411Card.isIntroOrOutro}
                        scriptStyle={exiting2411Card.scriptStyle}
                        dualVoiceEnabled={exiting2411Card.dualVoiceEnabled}
                        themeId={exiting2411Card.themeId}
                        pauseBetweenLinesSec={exiting2411Card.pauseBetweenLinesSec}
                        aspectRatio={exiting2411Card.aspectRatio}
                        prevTargetText={exiting2411Card.prevTargetText}
                        promptPreviewText={exiting2411Card.promptPreviewText}
                        animationSeed={exiting2411Card.animationSeed}
                        fontName={exiting2411Card.fontName}
                        hideBackdrop
                        isExiting
                        override={exiting2411Card.override}
                      />
                    </div>
                  )}
                  <div key={active2411CardKey} className="absolute inset-0 z-[10]">
                    <Studio2411StageCard
                      rawLine={activeRawLine}
                      lineIndex={safeActiveIdx}
                      totalLines={Math.max(1, totalPreviewItems)}
                      isSecondarySlot={activeIsSecondarySlot}
                      isIntroOrOutro={activeIsIntroOrOutro}
                      scriptStyle={config.scriptStyle}
                      dualVoiceEnabled={isDualVoiceMode}
                      themeId={config.studio2411Theme}
                      pauseBetweenLinesSec={config.pauseBetweenLinesSec ?? 5}
                      aspectRatio={config.aspectRatio}
                      countdownActive={previewCountdown !== null}
                      prevTargetText={prevTargetForActive2411}
                      promptPreviewText={promptPreviewForActive2411}
                      animationSeed={captionReplayNonce}
                      fontName={config.subtitle.fontName}
                      hideBackdrop
                      override={active2411Override}
                    />
                  </div>
                </div>
              ) : config.materialSource === 'curated_preset' ? (
                <>
                  <img
                    key={activeCuratedBg.id}
                    src={activeCuratedBg.previewUrl}
                    alt={activeCuratedBg.title}
                    data-testid="curated-stage-preview-img"
                    className="animate-mpt-scene-fade absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45 pointer-events-none" />
                </>
              ) : config.materialSource === 'neutral_css_bg' ? (
                <div
                  data-testid="studio-neutral-bg-overlay"
                  className="absolute inset-0 flex flex-col items-center justify-between p-4 pointer-events-none"
                >
                  <div className="mt-7 w-full flex justify-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/75 border border-slate-500/40 text-white text-[9px] font-medium">
                      <LayoutGrid className="w-2.5 h-2.5 text-sky-300" aria-hidden="true" />
                      <span>{activeNeutralMeta.label} · CSS Studio</span>
                    </span>
                  </div>
                  <div className="w-full h-px bg-current opacity-10" />
                </div>
              ) : (
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-5 pb-20 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 transition-opacity ${
                    previewCountdown !== null ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <Film className="w-7 h-7 text-slate-500 mb-2.5" aria-hidden="true" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bấm &ldquo;Tìm &amp; xem trước cảnh quay&rdquo; để kiểm tra, sửa hoặc thay thế từng phân cảnh trước khi xuất MP4.
                  </p>
                </div>
              )}

              {config.materialSource !== 'studio_2411' && !isAnimeMode && (
                <div
                  className={`absolute left-2 right-2 flex items-center justify-between gap-1.5 text-white font-mono drop-shadow pointer-events-none ${
                    config.aspectRatio === '9:16' ? 'top-2.5 text-[10px]' : 'top-1.5 text-[9px]'
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-black/55 whitespace-nowrap shrink-0">
                    {config.aspectRatio} · {config.videoQuality ?? '720p'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/55 truncate max-w-[155px]">
                    {activeScene
                      ? activeScene.sourceLabel
                      : config.materialSource === 'curated_preset'
                      ? activeCuratedBg.title
                      : config.materialSource === 'neutral_css_bg'
                      ? activeNeutralMeta.label
                      : config.materialSource === 'mixkit_video'
                      ? 'Mixkit B-roll HD'
                      : config.materialSource === 'hybrid_real'
                      ? 'B-roll + Chọn lọc'
                      : 'Tư liệu chọn'}
                  </span>
                </div>
              )}

              {config.subtitle.enabled && (
                <SubtitlePreviewCaption
                  text={isAnimeMode ? activeAnimeSubtitleText || activePreviewCaption : activePreviewCaption}
                  subtitle={config.subtitle}
                  aspectRatio={config.aspectRatio}
                  replayNonce={captionReplayNonce}
                  countdownNumber={isAnimeMode ? null : previewCountdown}
                  countdownTotalSec={Math.max(1, Math.min(10, Math.round(config.pauseBetweenLinesSec || 5)))}
                  pinnedSourceText={isAnimeMode ? null : pinnedSourceForPreview}
                  rawLine={isAnimeMode ? activeAnimeRawLine : activeRawLine}
                  scriptStyle={config.scriptStyle}
                  isSecondarySlot={!isAnimeMode && activeIsSecondarySlot}
                  isIntroOrOutro={!isAnimeMode && activeIsIntroOrOutro}
                  isLightBackground={!isAnimeMode && isLightNeutralBg}
                  use2411CountdownStyle={!isAnimeMode && config.materialSource === 'studio_2411'}
                  studio2411Theme={config.studio2411Theme}
                />
              )}
            </div>
          </div>

          {!isAnimeMode && (editTargetLineIdx !== null || editSourceLineIdx !== null) && (
            <div
              data-testid="preview-inline-subtitle-editor"
              className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  Sửa nhanh phụ đề ngay tại Preview (đồng bộ thẳng vào kịch bản)
                </span>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  Dòng {safeActiveIdx + 1}/{Math.max(1, totalPreviewItems)}
                </span>
              </div>

              {editTargetLineIdx !== null && (
                <div>
                  <label
                    htmlFor="mpt-preview-edit-target"
                    className="block text-[11px] font-medium text-indigo-700 mb-1"
                  >
                    Ngôn ngữ đích (hiển thị bên trên)
                  </label>
                  <input
                    id="mpt-preview-edit-target"
                    type="text"
                    value={stripNarrationTags(rawNonEmptyLines[editTargetLineIdx] ?? '')}
                    onChange={(e) =>
                      handleInlineEditSubtitleLine(editTargetLineIdx, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              )}

              {editSourceLineIdx !== null && (
                <div>
                  <label
                    htmlFor="mpt-preview-edit-source"
                    className="block text-[11px] font-medium text-slate-700 mb-1"
                  >
                    {editTargetLineIdx !== null
                      ? 'Ngôn ngữ gốc (ghim bên dưới)'
                      : 'Nội dung phụ đề dòng đang xem'}
                  </label>
                  <input
                    id="mpt-preview-edit-source"
                    type="text"
                    value={stripNarrationTags(rawNonEmptyLines[editSourceLineIdx] ?? '')}
                    onChange={(e) =>
                      handleInlineEditSubtitleLine(editSourceLineIdx, e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              )}
            </div>
          )}

          <input
            ref={sceneFileInputRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            aria-label="Chọn ảnh hoặc video thay thế cho phân cảnh đang chọn"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleUploadSceneReplacement(file);
                e.target.value = '';
              }
            }}
          />

          {previewScenes.length > 0 && (
            <div data-testid="scene-storyboard-strip" className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-700">
                <span>Các phân cảnh B-roll ({previewScenes.length} cảnh quay)</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Chọn 1 cảnh để sửa / thay / xóa
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-0.5">
                {previewScenes.map((scene, idx) => (
                  <div
                    key={`${idx}_${scene.previewUrl}`}
                    className={`relative group rounded-lg overflow-hidden border transition-all ${
                      safeActiveIdx === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSceneIdx(idx)}
                      aria-label={`Xem cảnh ${idx + 1}: ${scene.prompt}`}
                      className="block w-full text-left"
                    >
                      {scene.thumbUrl || scene.kind === 'image' ? (
                        <img
                          src={scene.thumbUrl ?? scene.previewUrl}
                          alt={`Cảnh ${idx + 1}`}
                          className="w-full h-14 object-cover bg-slate-900"
                        />
                      ) : (
                        <video
                          src={`${scene.previewUrl}#t=1`}
                          muted
                          preload="metadata"
                          className="w-full h-14 object-cover bg-slate-900"
                        />
                      )}
                      <div className="px-1.5 py-0.5 bg-white text-[10px] font-mono text-slate-700 truncate">
                        #{idx + 1} · {scene.kind === 'video' ? 'MP4' : 'Ảnh'}
                      </div>
                    </button>
                    {previewScenes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(idx);
                        }}
                        aria-label={`Xóa cảnh ${idx + 1}`}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white hover:bg-rose-600 flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {activeScene && (
                <div
                  data-testid="scene-editor-panel"
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      Chỉnh sửa phân cảnh #{safeActiveIdx + 1}
                    </span>
                    {previewScenes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteScene(safeActiveIdx)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 hover:underline"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                        <span>Xóa cảnh này</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      id="mpt-scene-edit-query"
                      type="text"
                      value={sceneEditQuery}
                      onChange={(e) => setSceneEditQuery(e.target.value)}
                      placeholder="Nhập từ khóa cảnh mới (Anh hoặc Việt)..."
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      disabled={isLoadingSceneAlt}
                      onClick={() => void handleSearchSceneAlternatives()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isLoadingSceneAlt ? (
                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <Search className="w-3 h-3" aria-hidden="true" />
                      )}
                      <span>Tìm thay thế</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isGeneratingSceneAi}
                      onClick={() => void handleGenerateAiForActiveScene()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50"
                    >
                      {isGeneratingSceneAi ? (
                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <RefreshCw className="w-3 h-3" aria-hidden="true" />
                      )}
                      <span>Tạo ảnh AI mới</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sceneFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
                    >
                      <Upload className="w-3 h-3" aria-hidden="true" />
                      <span>Chọn ảnh/video từ máy</span>
                    </button>
                  </div>

                  {sceneEditStatus && (
                    <div className="text-[11px] text-emerald-700">{sceneEditStatus}</div>
                  )}

                  {sceneAltCandidates.length > 0 && (
                    <div data-testid="scene-alt-grid" className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-medium text-slate-600">
                        Bấm chọn mẫu bên dưới để thay thế cảnh #{safeActiveIdx + 1}:
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                        {sceneAltCandidates.map((cand, ci) => (
                          <button
                            key={`${ci}_${cand.previewUrl}`}
                            type="button"
                            onClick={() => handleReplaceSceneWithCandidate(cand)}
                            aria-label={`Chọn mẫu thay thế ${ci + 1}: ${cand.sourceLabel}`}
                            className="rounded overflow-hidden border border-slate-200 hover:border-indigo-600 text-left bg-white"
                          >
                            {cand.thumbUrl || cand.kind === 'image' ? (
                              <img
                                src={cand.thumbUrl ?? cand.previewUrl}
                                alt={cand.sourceLabel}
                                className="w-full h-11 object-cover bg-slate-900"
                              />
                            ) : (
                              <video
                                src={`${cand.previewUrl}#t=1`}
                                muted
                                preload="metadata"
                                className="w-full h-11 object-cover bg-slate-900"
                              />
                            )}
                            <div className="px-1 py-0.5 text-[9px] font-mono text-slate-700 truncate">
                              {cand.kind === 'video' ? 'MP4' : 'Ảnh'} · {cand.sourceLabel}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div
            data-testid="output-destination-panel"
            className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="mpt-output-dir" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Folder className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                <span>Thư mục xuất file (Output Folder)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowNewFolderInput((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 hover:underline"
              >
                <FolderPlus className="w-3 h-3" aria-hidden="true" />
                <span>Tạo thư mục con</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                id="mpt-output-dir"
                value={
                  outputFolders.includes(resolvedOutputDir) ? resolvedOutputDir : '__custom__'
                }
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    onChangeConfig({ outputDir: e.target.value });
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900"
              >
                {outputFolders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}/ {folder === 'output' ? '(Thư mục gốc dự án)' : ''}
                  </option>
                ))}
                {!outputFolders.includes(resolvedOutputDir) && (
                  <option value="__custom__">{resolvedOutputDir}/</option>
                )}
              </select>

              <input
                id="mpt-output-filename"
                type="text"
                value={config.outputFilename ?? ''}
                onChange={(e) => onChangeConfig({ outputFilename: e.target.value })}
                placeholder={`Tự đặt theo bài: ${expectedBaseFilename}`}
                aria-label="Tên file xuất (để trống để tự đặt theo nội dung bài)"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900"
              />
            </div>

            {showNewFolderInput && (
              <div className="flex items-center gap-1.5">
                <input
                  id="mpt-new-folder"
                  type="text"
                  value={newFolderInput}
                  onChange={(e) => setNewFolderInput(e.target.value)}
                  placeholder="VD: phong_van_nhat_anh hoặc bai_hoc_1"
                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateOutputFolder()}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 whitespace-nowrap"
                >
                  Tạo &amp; Chọn
                </button>
              </div>
            )}

            <div className="text-[11px] font-mono text-slate-600 truncate">
              Lưu tại: <span className="text-slate-900 font-medium">{resolvedOutputDir}/{expectedBaseFilename}.mp4</span>
              {outputRootAbsPath ? ` (${outputRootAbsPath})` : ''}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRendering || !config.script.trim()}
              onClick={onStartRender}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-45 transition-colors whitespace-nowrap"
            >
              {isRendering ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Film className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {isRendering ? 'Đang dựng video MP4 chuẩn HD...' : 'Tạo Video Hoàn Chỉnh (.MP4)'}
              </span>
            </button>

            {isRendering && (
              <button
                type="button"
                data-testid="cancel-render-btn"
                onClick={onCancelRender}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors whitespace-nowrap shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>Hủy xuất</span>
              </button>
            )}
          </div>

          {renderJob && (
            <div
              data-testid="render-status-panel"
              className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-900">
                <span className="truncate">{renderJob.stepLabel}</span>
                <span className="font-mono tabular-nums shrink-0">{renderJob.progressPct}%</span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    renderJob.status === 'error'
                      ? 'bg-rose-600'
                      : renderJob.status === 'cancelled'
                      ? 'bg-amber-500'
                      : renderJob.status === 'done'
                      ? 'bg-emerald-600'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${renderJob.progressPct}%` }}
                />
              </div>

              {renderJob.errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
                  {renderJob.errorMessage}
                </div>
              )}

              <div className="max-h-24 overflow-y-auto text-[11px] font-mono text-slate-600 space-y-1">
                {renderJob.logs.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </section>

        {renderJob?.status === 'done' && renderJob.videoUrl && (
          <section
            data-testid="completed-mp4-panel"
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900">Video MP4 đã xuất xong</h4>
                  <p className="text-xs text-slate-500 tabular-nums truncate">
                    {(renderJob.durationSec ?? 0).toFixed(1)}s ·{' '}
                    {((renderJob.fileSizeBytes ?? 0) / 1024).toFixed(0)} KB
                    {renderJob.savedOutputPath ? ` · ${renderJob.savedOutputPath}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {renderJob.srtUrl && (
                  <a
                    href={toDownloadUrl(
                      renderJob.srtUrl,
                      (renderJob.outputFilename || `${expectedBaseFilename}.mp4`).replace(/\.mp4$/i, '.srt'),
                      renderJob.savedSrtPath
                    )}
                    download={(renderJob.outputFilename || `${expectedBaseFilename}.mp4`).replace(/\.mp4$/i, '.srt')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
                  >
                    Tải .SRT
                  </a>
                )}
                <a
                  href={toDownloadUrl(
                    renderJob.videoUrl,
                    renderJob.outputFilename || `${expectedBaseFilename}.mp4`,
                    renderJob.savedOutputPath
                  )}
                  download={renderJob.outputFilename || `${expectedBaseFilename}.mp4`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tải về (.MP4)</span>
                </a>
              </div>
            </div>

            {videoPlaybackError && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {videoPlaybackError}
              </div>
            )}

            <div className="bg-slate-950 rounded-lg border border-slate-200 overflow-hidden flex justify-center">
              <video
                key={renderJob.videoUrl}
                src={renderJob.videoUrl}
                controls
                playsInline
                preload="metadata"
                onError={() =>
                  setVideoPlaybackError(
                    'Trình duyệt chưa phát trực tiếp được luồng video — hãy bấm "Tải về (.MP4)" để xem offline ngay.'
                  )
                }
                className={
                  config.aspectRatio === '9:16'
                    ? 'aspect-[9/16] w-full max-w-[235px] bg-black'
                    : config.aspectRatio === '1:1'
                    ? 'aspect-square w-full max-w-[280px] bg-black'
                    : 'w-full aspect-video bg-black'
                }
              />
            </div>
          </section>
        )}

        {recentHistory.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>Bản xuất gần đây ({recentHistory.length})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {recentHistory.slice(0, 4).map((rec) => {
                const dlName =
                  rec.outputFilename || `${slugifyOutputFilename(rec.subject, rec.jobId)}.mp4`;
                return (
                  <div key={rec.jobId} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{rec.subject}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums truncate">
                        {rec.aspectRatio} · {rec.durationSec.toFixed(1)}s
                        {rec.savedOutputPath ? ` · ${rec.savedOutputPath}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={toDownloadUrl(rec.videoUrl, dlName, rec.savedOutputPath)}
                        download={dlName}
                        className="text-indigo-700 font-medium hover:underline whitespace-nowrap"
                      >
                        Tải MP4
                      </a>
                      <button
                        type="button"
                        aria-label={`Xóa bản xuất ${rec.subject}`}
                        onClick={() => onDeleteHistory(rec.jobId)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
