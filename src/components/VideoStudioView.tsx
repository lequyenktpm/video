import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Copy,
  Download,
  ExternalLink,
  Film,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import {
  BgmPreset,
  CompletedVideoRecord,
  FullAnswerRecapMode,
  GroundingSource,
  LanguageCode,
  LlmProvider,
  MaterialSource,
  MediaAssetItem,
  MediaTypeFilter,
  RenderJobConfig,
  RenderJobStatus,
  ScenePreviewItem,
  ScriptStyle,
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
  buildMoneyPrinterPrompt,
  buildScenePromptsFromScript,
  doesVoiceMatchLanguage,
  extractEnglishSearchTerms,
  generateOfflineVietnameseScript,
  getDefaultSecondaryVoiceForLanguage,
  getDefaultVoiceForLanguage,
  getPresetsForLanguage,
  getScriptLengthSummary,
  hasCjkChars,
  hasVietnameseDiacritics,
  isBilingualLanguage,
  isKnownPresetSubject,
  normalizeOutputSubdir,
  parseAiWebOrJsonOutput,
  planNarrationSegments,
  safeParseJsonResponse,
  slugifyOutputFilename,
  splitScriptSentences,
  stripNarrationTags,
  updateScriptLinePreservingTag,
} from '../shared/mptEngine';
import { TopicDiscoveryBar } from './TopicDiscoveryBar';
import { SubtitlePreviewCaption } from './SubtitlePreviewCaption';

const SUBTITLE_COLOR_THEMES: Array<{
  name: string;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
}> = [
  { name: 'Trắng Vàng Điện Ảnh', textColor: '#FFFFFF', highlightColor: '#FACC15', strokeColor: '#0F172A' },
  { name: 'Xanh Ngọc Hiện Đại', textColor: '#F8FAFC', highlightColor: '#2DD4BF', strokeColor: '#0F172A' },
  { name: 'Hồng San Hô Nổi Bật', textColor: '#FFF1F2', highlightColor: '#FB7185', strokeColor: '#1E1B4B' },
  { name: 'Kem Ấm Hoàng Hôn', textColor: '#FEF3C7', highlightColor: '#FB923C', strokeColor: '#1C1917' },
  { name: 'Tím Lavender Sáng Tạo', textColor: '#F5F3FF', highlightColor: '#C084FC', strokeColor: '#1E1B4B' },
  { name: 'Xanh Bầu Trời Tươi Mát', textColor: '#F0F9FF', highlightColor: '#38BDF8', strokeColor: '#0C4A6E' },
];

const TEXT_COLOR_SWATCHES = [
  '#FFFFFF',
  '#FEF3C7',
  '#FACC15',
  '#38BDF8',
  '#2DD4BF',
  '#4ADE80',
  '#FB7185',
  '#C084FC',
];

const KARAOKE_COLOR_SWATCHES = [
  '#FACC15',
  '#2DD4BF',
  '#38BDF8',
  '#4ADE80',
  '#FB7185',
  '#C084FC',
  '#FB923C',
  '#F472B6',
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
  onResetForm,
  recentHistory,
  onDeleteHistory,
}) => {
  const quickPasteRef = useRef<HTMLTextAreaElement | null>(null);
  const sceneFileInputRef = useRef<HTMLInputElement | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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
  const [captionReplayNonce, setCaptionReplayNonce] = useState(0);
  const [previewCountdown, setPreviewCountdown] = useState<number | null>(null);
  const [videoPlaybackError, setVideoPlaybackError] = useState<string | null>(null);

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

  const handleRunCountdownPreview = () => {
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
        return;
      }
      setPreviewCountdown(current);
      playClockTickInBrowser(tickStep % 2 === 0);
      tickStep += 1;
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    stopCountdownPreview();
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

  const previewLines = splitScriptSentences(config.script, 140)
    .map((l) => stripNarrationTags(l))
    .filter(Boolean);
  const totalPreviewItems =
    previewScenes.length > 0 ? previewScenes.length : previewLines.length;
  const safeActiveIdx =
    totalPreviewItems > 0 ? Math.min(activeSceneIdx, totalPreviewItems - 1) : 0;
  const activeScene = previewScenes[safeActiveIdx] ?? null;

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
        'Phụ đề trắng viền đen sắc nét hiển thị tại đây.'
    ) || 'Phụ đề trắng viền đen sắc nét hiển thị tại đây.';

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
  let activeSegIdx =
    previewBaseSegments[safeActiveIdx]?.text === rawActiveSentence
      ? safeActiveIdx
      : previewBaseSegments.findIndex((s) => s.text === rawActiveSentence);
  if (activeSegIdx < 0 && previewBaseSegments.length > 0) {
    activeSegIdx = Math.min(safeActiveIdx, previewBaseSegments.length - 1);
  }

  let editTargetLineIdx: number | null = null;
  let editSourceLineIdx: number | null = null;
  const activeRawLineIdx = findNonEmptyLineIndex(rawActiveSentence, safeActiveIdx);

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
      if (hasJa && !hasVi) {
        autoLangPatch.language = 'ja_en';
        autoLangPatch.voiceId = 'ja-JP-NanamiNeural';
        autoLangPatch.secondaryVoiceId = 'en-US-JennyNeural';
      } else if (hasVi && hasJa) {
        autoLangPatch.language = 'vi_ja';
        autoLangPatch.voiceId = 'vi-VN-HoaiMyNeural';
        autoLangPatch.secondaryVoiceId = 'ja-JP-NanamiNeural';
      } else if (hasVi && hasEnTarget) {
        autoLangPatch.language = 'bilingual';
        autoLangPatch.voiceId = 'vi-VN-HoaiMyNeural';
        autoLangPatch.secondaryVoiceId = 'en-US-JennyNeural';
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
        }),
      });
      const data = await safeParseJsonResponse<{
        script?: string;
        terms?: string[];
        scenePrompts?: string[];
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

      setTermsInput(nextTerms.join(', '));
      setScriptSources(Array.isArray(data.groundingSources) ? data.groundingSources : []);
      setPreviewScenes([]);
      setActiveSceneIdx(0);
      onChangeConfig({
        script: data.script,
        terms: nextTerms,
        scenePrompts: nextScenePrompts,
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
          materialSource: config.materialSource,
          mediaTypeFilter: config.mediaTypeFilter ?? 'all',
          visualMood: config.visualMood ?? 'auto',
          aspectRatio: config.aspectRatio,
          videoQuality: config.videoQuality ?? '720p',
          selectedMediaIds: config.selectedMediaIds,
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
      const sampleText =
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
          voiceId: config.voiceId,
          dualVoiceEnabled:
            Boolean(config.dualVoiceEnabled) || isBilingualLanguage(config.language),
          secondaryVoiceId:
            config.secondaryVoiceId ?? getDefaultSecondaryVoiceForLanguage(config.language),
          pauseBetweenLinesSec: config.pauseBetweenLinesSec ?? 0,
          clockTickEnabled: config.clockTickEnabled !== false,
          targetRepeatCount: config.targetRepeatCount ?? 0,
          targetRepeatPauseSec: config.targetRepeatPauseSec ?? 2,
          fullAnswerRecapMode: config.fullAnswerRecapMode ?? 'off',
          summarizeAtEnd: Boolean(config.summarizeAtEnd),
          ttsProvider: config.ttsProvider,
          voiceRate: config.voiceRate,
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Focused 3-Step Video Studio */}
      <div className="lg:col-span-7 space-y-5">
        {/* 1. Real HD Video B-Roll & Framing Settings */}
        <section id="sec-visuals" className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              1. Nguồn cảnh quay HD &amp; Nhịp chuyển cảnh
            </h2>
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
          </div>

          {scenesError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {scenesError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="mixkit_video">Video B-roll HD chuyển động mượt (Mixkit Free)</option>
                <option value="hybrid_real">B-roll HD + Cảnh AI minh họa</option>
                <option value="stock_free">Kho Video &amp; Ảnh Archive / Wikimedia</option>
                <option value="local_upload">
                  Video/Ảnh tải lên từ máy ({uploadedVisuals.length} tệp)
                </option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                B-roll là video/ảnh nền minh họa chạy sau chữ. Nên chọn <strong>Mixkit Free</strong> để có video thật chuyển động mượt, hoặc <strong>B-roll HD + AI</strong> khi cần ảnh sát nội dung từng câu.
              </p>
            </div>

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
          </div>

          {config.concatMode === 'random' && (
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
            <div>
              <label htmlFor="mpt-voice-id" className="block text-xs font-medium text-slate-700 mb-1">
                Giọng đọc 1 (Chính / Câu hỏi)
              </label>
              <select
                id="mpt-voice-id"
                value={config.voiceId}
                onChange={(e) => onChangeConfig({ voiceId: e.target.value as VoiceOptionId })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                <option value="vi-VN-HoaiMyNeural">Nữ Tiếng Việt (Hoài My · Tự nhiên)</option>
                <option value="vi-VN-NamMinhNeural">Nam Tiếng Việt (Nam Minh · Trầm ấm)</option>
                <option value="en-US-JennyNeural">Nữ Tiếng Anh (Jenny · US)</option>
                <option value="en-US-GuyNeural">Nam Tiếng Anh (Guy · US)</option>
                <option value="ja-JP-NanamiNeural">Nữ Tiếng Nhật (Nanami · 日本語)</option>
                <option value="ja-JP-KeitaNeural">Nam Tiếng Nhật (Keita · 日本語)</option>
              </select>
            </div>

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
                <option value="elevenlabs">ElevenLabs AI (Đa ngôn ngữ · cần Key trên Server)</option>
              </select>
            </div>

            <div className="sm:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    id="mpt-dual-voice"
                    type="checkbox"
                    checked={
                      Boolean(config.dualVoiceEnabled) || isBilingualLanguage(config.language)
                    }
                    onChange={(e) =>
                      onChangeConfig({
                        dualVoiceEnabled: e.target.checked,
                        secondaryVoiceId:
                          config.secondaryVoiceId ??
                          getDefaultSecondaryVoiceForLanguage(config.language),
                      })
                    }
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
                      onChange={(e) =>
                        onChangeConfig({ secondaryVoiceId: e.target.value as VoiceOptionId })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                    >
                      <option value="en-US-JennyNeural">Nữ Tiếng Anh (Jenny · US)</option>
                      <option value="en-US-GuyNeural">Nam Tiếng Anh (Guy · US)</option>
                      <option value="ja-JP-NanamiNeural">Nữ Tiếng Nhật (Nanami · 日本語)</option>
                      <option value="ja-JP-KeitaNeural">Nam Tiếng Nhật (Keita · 日本語)</option>
                      <option value="vi-VN-HoaiMyNeural">Nữ Tiếng Việt (Hoài My · Tự nhiên)</option>
                      <option value="vi-VN-NamMinhNeural">Nam Tiếng Việt (Nam Minh · Trầm ấm)</option>
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
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Phụ đề tự động (tách 1–2 dòng gọn gàng)
              </h3>
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
          </div>

          <TopicDiscoveryBar
            currentSubject={config.subject}
            language={config.language}
            onSelectTopic={(title) => onChangeConfig({ subject: title })}
          />

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
                  const patch: Partial<RenderJobConfig> = {
                    language: nextLang,
                    customScenes: undefined,
                    dualVoiceEnabled: isBilingual || isInteractiveStyle,
                    secondaryVoiceId: getDefaultSecondaryVoiceForLanguage(nextLang),
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
                  if (!doesVoiceMatchLanguage(config.voiceId, nextLang) || isBilingual) {
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
              onChange={(e) => onChangeConfig({ script: e.target.value })}
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

      {/* Right Column: Live Video Stage, Storyboard, Render & Completed Output */}
      <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
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
              {(studioTab === 'learning' || (config.pauseBetweenLinesSec ?? 0) >= 1.5) && (
                <button
                  type="button"
                  data-testid="preview-countdown-btn"
                  onClick={
                    previewCountdown !== null ? stopCountdownPreview : handleRunCountdownPreview
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md whitespace-nowrap"
                >
                  <Timer className="w-3 h-3" aria-hidden="true" />
                  <span>
                    {previewCountdown !== null
                      ? 'Dừng đếm ngược'
                      : `Chạy thử đếm ngược ${Math.max(1, Math.min(10, Math.round(config.pauseBetweenLinesSec || 5)))}s`}
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

          <div className="bg-slate-950 rounded-xl border border-slate-200 p-4 flex justify-center">
            <div
              data-testid="studio-preview-stage"
              className={`relative overflow-hidden rounded-lg bg-slate-900 border border-slate-800 ${
                config.aspectRatio === '9:16'
                  ? 'aspect-[9/16] w-full max-w-[245px]'
                  : config.aspectRatio === '1:1'
                  ? 'aspect-square w-full max-w-[300px]'
                  : 'aspect-video w-full'
              }`}
            >
              {activeScene ? (
                activeScene.kind === 'video' ? (
                  <video
                    key={activeScene.previewUrl}
                    src={activeScene.previewUrl}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    key={activeScene.previewUrl}
                    src={activeScene.previewUrl}
                    alt={activeScene.sentence}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : (
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 transition-opacity ${
                    previewCountdown !== null ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <Film className="w-7 h-7 text-slate-500 mb-2.5" aria-hidden="true" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bấm &ldquo;Tìm &amp; xem trước cảnh quay&rdquo; để kiểm tra, sửa hoặc thay thế từng phân cảnh trước khi xuất MP4.
                  </p>
                </div>
              )}

              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white font-mono drop-shadow">
                <span className="px-1.5 py-0.5 rounded bg-black/55">
                  {config.aspectRatio} · {config.videoQuality ?? '720p'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-black/55 truncate max-w-[150px]">
                  {activeScene
                    ? activeScene.sourceLabel
                    : config.materialSource === 'mixkit_video'
                    ? 'Mixkit B-roll HD'
                    : config.materialSource === 'hybrid_real'
                    ? 'B-roll + AI Scene'
                    : 'Tư liệu chọn'}
                </span>
              </div>

              {config.subtitle.enabled && (
                <SubtitlePreviewCaption
                  text={activePreviewCaption}
                  subtitle={config.subtitle}
                  aspectRatio={config.aspectRatio}
                  replayNonce={captionReplayNonce}
                  countdownNumber={previewCountdown}
                  pinnedSourceText={pinnedSourceForPreview}
                />
              )}
            </div>
          </div>

          {(editTargetLineIdx !== null || editSourceLineIdx !== null) && (
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

          <button
            type="button"
            disabled={isRendering || !config.script.trim()}
            onClick={onStartRender}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-45 transition-colors whitespace-nowrap"
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
