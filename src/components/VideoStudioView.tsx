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
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  BgmPreset,
  CompletedVideoRecord,
  LlmProvider,
  MaterialSource,
  MediaAssetItem,
  RenderJobConfig,
  RenderJobStatus,
  ScenePreviewItem,
  ScriptStyle,
  SubtitleBoxStyle,
  SubtitleFont,
  SubtitlePosition,
  TtsProvider,
  VideoAspectRatio,
  VideoConcatMode,
  VideoTransitionMode,
  VoiceOptionId,
} from '../shared/types';
import {
  buildMoneyPrinterPrompt,
  buildScenePromptsFromScript,
  extractEnglishSearchTerms,
  parseAiWebOrJsonOutput,
  splitCueIntoShortSubCues,
  splitScriptSentences,
} from '../shared/mptEngine';

interface VideoStudioViewProps {
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

const TOPIC_PRESETS = [
  'Bí ẩn đại dương sâu thẳm chưa từng được giải mã',
  'Khoa học đằng sau tách cà phê Espresso hoàn hảo',
  '3 thói quen nhỏ buổi sáng giúp tập trung làm việc hiệu quả',
];

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
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

  const [termsInput, setTermsInput] = useState(config.terms.join(', '));
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptNote, setScriptNote] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [showAiWebPanel, setShowAiWebPanel] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [aiWebPasteText, setAiWebPasteText] = useState('');
  const [aiWebStatus, setAiWebStatus] = useState<string | null>(null);

  const [previewScenes, setPreviewScenes] = useState<ScenePreviewItem[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [scenesError, setScenesError] = useState<string | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const [isPreviewingTts, setIsPreviewingTts] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [ttsPreviewNote, setTtsPreviewNote] = useState<string | null>(null);

  useEffect(() => {
    setTermsInput(config.terms.join(', '));
  }, [config.terms]);

  useEffect(() => {
    if (renderJob?.scenes && renderJob.scenes.length > 0) {
      setPreviewScenes(renderJob.scenes);
    }
  }, [renderJob?.scenes]);

  const uploadedVisuals = uploadedMedia.filter((m) => m.kind === 'video' || m.kind === 'image');
  const uploadedAudios = uploadedMedia.filter((m) => m.kind === 'audio');

  const previewLines = splitScriptSentences(config.script, 140);
  const safeActiveIdx =
    previewScenes.length > 0 ? Math.min(activeSceneIdx, previewScenes.length - 1) : 0;
  const activeScene = previewScenes[safeActiveIdx] ?? null;

  const rawActiveSentence =
    activeScene?.sentence ??
    previewLines[safeActiveIdx] ??
    previewLines[0] ??
    'Phụ đề trắng viền đen sắc nét hiển thị tại đây.';

  const previewSubChunks = splitCueIntoShortSubCues(
    [{ index: 1, startSec: 0, endSec: 4, text: rawActiveSentence }],
    config.aspectRatio === '9:16' ? 38 : 52
  );
  const activePreviewCaption = previewSubChunks[0]?.text ?? rawActiveSentence;

  const generatedPromptForWeb = buildMoneyPrinterPrompt({
    subject: config.subject || 'Chủ đề video ngắn hấp dẫn',
    language: config.language,
    scriptStyle: config.scriptStyle,
    sentenceCount: config.sentenceCount,
  });

  const applyPastedContent = (rawText: string, sourceHint = 'Clipboard') => {
    setScriptError(null);
    setAiWebStatus(null);
    const parsed = parseAiWebOrJsonOutput(rawText, config.subject);
    if (!parsed) {
      setScriptError('Nội dung dán chưa hợp lệ — hãy dán văn bản kịch bản hoặc JSON.');
      return false;
    }
    setTermsInput(parsed.terms.join(', '));
    setPreviewScenes([]);
    setActiveSceneIdx(0);
    onChangeConfig({
      script: parsed.script,
      terms: parsed.terms,
      scenePrompts: parsed.scenePrompts,
    });
    const count = splitScriptSentences(parsed.script).length;
    setScriptNote(`Đã dán ${count} câu kịch bản & ${parsed.terms.length} từ khóa từ ${sourceHint}.`);
    setAiWebPasteText('');
    setShowQuickPaste(false);
    return true;
  };

  const handleOneClickPaste = async () => {
    setScriptError(null);
    try {
      if (navigator.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim().length > 4) {
          applyPastedContent(clipText, 'Clipboard');
          return;
        }
      }
    } catch {
      // Clipboard API blocked or denied; open sleek inline paste drawer
    }
    setShowQuickPaste(true);
    window.setTimeout(() => quickPasteRef.current?.focus(), 60);
  };

  const handleGenerateScript = async () => {
    setScriptError(null);
    setScriptNote(null);
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
      const data = (await res.json()) as {
        script?: string;
        terms?: string[];
        scenePrompts?: string[];
        providerUsed?: string;
        error?: string;
      };
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
      setPreviewScenes([]);
      setActiveSceneIdx(0);
      onChangeConfig({
        script: data.script,
        terms: nextTerms,
        scenePrompts: nextScenePrompts,
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

  const handlePreviewScenes = async () => {
    setScenesError(null);
    setIsLoadingScenes(true);
    try {
      const sentences = splitScriptSentences(config.script);
      const nextScenePrompts =
        config.scenePrompts.length >= sentences.length
          ? config.scenePrompts
          : buildScenePromptsFromScript(sentences, config.subject, config.terms);

      const res = await fetch('/api/preview-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: config.subject,
          script: config.script,
          terms: config.terms,
          scenePrompts: nextScenePrompts,
          materialSource: config.materialSource,
          aspectRatio: config.aspectRatio,
          selectedMediaIds: config.selectedMediaIds,
        }),
      });
      const data = (await res.json()) as { scenes?: ScenePreviewItem[]; error?: string };
      if (!res.ok || !data.scenes) {
        throw new Error(data.error || 'Không thể tải xem trước cảnh quay.');
      }
      setPreviewScenes(data.scenes);
      setActiveSceneIdx(0);
    } catch (err) {
      setScenesError(err instanceof Error ? err.message : 'Lỗi tải xem trước cảnh quay.');
    } finally {
      setIsLoadingScenes(false);
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
          text: sampleText,
          voiceId: config.voiceId,
          ttsProvider: config.ttsProvider,
          voiceRate: config.voiceRate,
        }),
      });
      const data = (await res.json()) as {
        audioUrl?: string;
        engineUsed?: string;
        recoveredFromEdgeError?: boolean;
        error?: string;
      };
      if (!res.ok || !data.audioUrl) {
        throw new Error(data.error || 'Không tạo được giọng đọc thử.');
      }
      setPreviewAudioUrl(data.audioUrl);
      setTtsPreviewNote(
        data.recoveredFromEdgeError
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
        {/* 1. Script, One-Click Paste & AI Web Prompt */}
        <section id="sec-script" className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                1. Chủ đề, Kịch bản &amp; Từ khóa cảnh quay
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo tự động bằng AI, hoặc dán trực tiếp kịch bản / JSON từ ChatGPT &amp; Gemini.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewScenes([]);
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
              {TOPIC_PRESETS.map((preset) => (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="mpt-language" className="block text-xs font-medium text-slate-700 mb-1">
                Ngôn ngữ
              </label>
              <select
                id="mpt-language"
                value={config.language}
                onChange={(e) =>
                  onChangeConfig({ language: e.target.value as RenderJobConfig['language'] })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">Tiếng Anh</option>
                <option value="bilingual">Song ngữ Việt-Anh</option>
              </select>
            </div>

            <div>
              <label htmlFor="mpt-style" className="block text-xs font-medium text-slate-700 mb-1">
                Phong cách
              </label>
              <select
                id="mpt-style"
                value={config.scriptStyle}
                onChange={(e) =>
                  onChangeConfig({ scriptStyle: e.target.value as ScriptStyle })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                <option value="curious_facts">Sự thật tò mò (Hook 3s)</option>
                <option value="storytelling">Kể chuyện cuốn hút</option>
                <option value="tips_howto">Mẹo nhanh &amp; Thực tế</option>
                <option value="news_fast">Tin nhanh súc tích</option>
              </select>
            </div>

            <div>
              <label htmlFor="mpt-count" className="block text-xs font-medium text-slate-700 mb-1">
                Số câu lời thoại
              </label>
              <select
                id="mpt-count"
                value={config.sentenceCount}
                onChange={(e) =>
                  onChangeConfig({ sentenceCount: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                <option value={3}>3 câu (~15s · 6 cảnh quay)</option>
                <option value={4}>4 câu (~22s · 8 cảnh quay)</option>
                <option value={5}>5 câu (~28s · 10 cảnh quay)</option>
                <option value={6}>6 câu (~35s · 12 cảnh quay)</option>
              </select>
            </div>

            <div>
              <label htmlFor="mpt-llm" className="block text-xs font-medium text-slate-700 mb-1">
                Nguồn viết kịch bản
              </label>
              <select
                id="mpt-llm"
                value={config.llmProvider}
                onChange={(e) => onChangeConfig({ llmProvider: e.target.value as LlmProvider })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
              >
                <option value="pollinations">AI Tự động + Wikipedia Tiếng Việt</option>
                <option value="ollama">Ollama Local (11434)</option>
                <option value="offline_vi">Mẫu Tiếng Việt Offline (Tức thì)</option>
              </select>
            </div>
          </div>

          {/* Primary Script Actions Toolbar with Prominent Paste Button */}
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

            <button
              type="button"
              aria-expanded={showAiWebPanel}
              onClick={() => setShowAiWebPanel((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>Copy Prompt ChatGPT / Gemini</span>
              {showAiWebPanel ? (
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>

          {(scriptNote || scriptError) && (
            <div className={`text-xs ${scriptError ? 'text-rose-700' : 'text-emerald-700'}`}>
              {scriptError ?? scriptNote}
            </div>
          )}

          {/* Quick Inline Paste Box (triggers cleanly if browser clipboard requires manual Ctrl+V) */}
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

          {/* Collapsible External AI Web Prompt & JSON Importer */}
          {showAiWebPanel && (
            <div
              data-testid="ai-web-prompt-panel"
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-900">
                  Copy Prompt sang ChatGPT / Gemini Web, rồi bấm &ldquo;Dán kịch bản / JSON&rdquo; ở trên
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

              <textarea
                readOnly
                rows={4}
                value={generatedPromptForWeb}
                aria-label="Prompt chuẩn MoneyPrinterTurbo để dán vào ChatGPT hoặc Gemini Web"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-700"
              />
              {aiWebStatus && <div className="text-xs text-slate-700">{aiWebStatus}</div>}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label htmlFor="mpt-script" className="text-xs font-medium text-slate-700">
                Nội dung lời thoại (mỗi dòng là 1 nhịp đọc)
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
              rows={4}
              value={config.script}
              onChange={(e) => onChangeConfig({ script: e.target.value })}
              placeholder="Mỗi câu nằm trên 1 dòng để đồng bộ giọng đọc và cắt cảnh quay mượt mà..."
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
        </section>

        {/* 2. Real HD Video B-Roll & Framing Settings */}
        <section id="sec-visuals" className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              2. Nguồn cảnh quay HD &amp; Nhịp chuyển cảnh
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
                  onChangeConfig({ materialSource: e.target.value as MaterialSource });
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
            </div>

            <div>
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
                <option value="fade">Chuyển mượt (Crossfade 0.3s)</option>
                <option value="slide">Trượt ngang (Slide)</option>
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

        {/* 3. Voiceover, BGM & Clean Subtitles */}
        <section id="sec-audio" className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              3. Giọng đọc, Nhạc nền &amp; Phụ đề
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
                Giọng đọc AI
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
              </select>
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
                max={0.7}
                step={0.05}
                value={config.bgmVolume}
                onChange={(e) => onChangeConfig({ bgmVolume: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label htmlFor="mpt-bgm" className="block text-xs font-medium text-slate-700 mb-1">
                  Nhạc nền miễn phí (BGM)
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
                  <option value="lofi_chill">Lofi Chill nhẹ nhàng</option>
                  <option value="tech_upbeat">Công nghệ nhịp điệu nhanh</option>
                  <option value="cinema_ambient">Điện ảnh sâu lắng</option>
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
                <label htmlFor="mpt-sub-box" className="block text-xs font-medium text-slate-700 mb-1">
                  Kiểu hiển thị phụ đề
                </label>
                <select
                  id="mpt-sub-box"
                  value={config.subtitle.boxStyle}
                  onChange={(e) => updateSubtitle({ boxStyle: e.target.value as SubtitleBoxStyle })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
                  <option value="outline">Chữ trắng viền đen sắc nét (Chuẩn Reels/Shorts)</option>
                  <option value="dark_box">Nền hộp tối mờ (Dễ đọc trên mọi nền)</option>
                </select>
              </div>

              <div>
                <label htmlFor="mpt-sub-font" className="block text-xs font-medium text-slate-700 mb-1">
                  Phông chữ (đủ dấu tiếng Việt)
                </label>
                <select
                  id="mpt-sub-font"
                  value={config.subtitle.fontName}
                  onChange={(e) => updateSubtitle({ fontName: e.target.value as SubtitleFont })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
                >
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
                  <option value="bottom">Phía dưới (~11% từ đáy)</option>
                  <option value="center">Chính giữa</option>
                  <option value="top">Phía trên</option>
                  <option value="custom">Tùy chỉnh (% từ đỉnh)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="mpt-sub-size" className="font-medium text-slate-700">
                    Cỡ chữ phụ đề
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

              <div className="flex items-center justify-between gap-3">
                <label htmlFor="mpt-sub-color" className="text-xs font-medium text-slate-700">
                  Màu chữ
                </label>
                <div className="flex items-center gap-2">
                  {['#FFFFFF', '#FACC15', '#38BDF8'].map((c) => (
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
            </div>
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
                {config.aspectRatio} · {config.subtitle.fontName} · {config.subtitle.fontSize}px
              </p>
            </div>
            {previewScenes.length > 0 && (
              <span className="text-xs font-mono text-emerald-700 tabular-nums">
                Cảnh {safeActiveIdx + 1}/{previewScenes.length}
              </span>
            )}
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
                <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
                  <Film className="w-7 h-7 text-slate-500 mb-2.5" aria-hidden="true" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bấm &ldquo;Tìm &amp; xem trước cảnh quay&rdquo; để kiểm tra các đoạn video B-roll HD trước khi xuất MP4.
                  </p>
                </div>
              )}

              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white font-mono drop-shadow">
                <span className="px-1.5 py-0.5 rounded bg-black/55">{config.aspectRatio}</span>
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
                <div
                  data-testid="studio-preview-subtitle"
                  className="absolute left-3 right-3 flex justify-center pointer-events-none"
                  style={
                    config.subtitle.position === 'top'
                      ? { top: '10%' }
                      : config.subtitle.position === 'center'
                      ? { top: '50%', transform: 'translateY(-50%)' }
                      : config.subtitle.position === 'custom'
                      ? { top: `${config.subtitle.customPositionPct}%`, transform: 'translateY(-50%)' }
                      : { bottom: '11%' }
                  }
                >
                  <p
                    className={`text-center font-bold leading-snug max-w-[92%] ${
                      config.subtitle.boxStyle === 'dark_box'
                        ? 'px-2.5 py-1 rounded bg-black/65'
                        : ''
                    }`}
                    style={{
                      fontFamily:
                        config.subtitle.fontName === 'JetBrains Mono'
                          ? 'var(--font-mono)'
                          : 'var(--font-display)',
                      fontSize: `${Math.max(12, Math.round(config.subtitle.fontSize * 0.34))}px`,
                      color: config.subtitle.textColor,
                      paintOrder: 'stroke fill',
                      WebkitTextStroke:
                        config.subtitle.boxStyle === 'outline' && config.subtitle.strokeWidth > 0
                          ? `${Math.max(1.5, config.subtitle.strokeWidth * 0.9)}px ${config.subtitle.strokeColor}`
                          : undefined,
                      textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                    }}
                  >
                    {activePreviewCaption}
                  </p>
                </div>
              )}
            </div>
          </div>

          {previewScenes.length > 0 && (
            <div data-testid="scene-storyboard-strip" className="space-y-2">
              <div className="text-xs font-medium text-slate-700">
                Các phân cảnh B-roll ({previewScenes.length} cảnh quay)
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-0.5">
                {previewScenes.map((scene, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSceneIdx(idx)}
                    aria-label={`Xem cảnh ${idx + 1}: ${scene.prompt}`}
                    className={`relative rounded-lg overflow-hidden border text-left transition-all ${
                      safeActiveIdx === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
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
                ))}
              </div>
            </div>
          )}

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
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Video MP4 đã xuất xong</h4>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {(renderJob.durationSec ?? 0).toFixed(1)}s ·{' '}
                    {((renderJob.fileSizeBytes ?? 0) / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {renderJob.srtUrl && (
                  <a
                    href={renderJob.srtUrl}
                    download={`phu_de_${renderJob.jobId}.srt`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
                  >
                    Tải .SRT
                  </a>
                )}
                <a
                  href={renderJob.videoUrl}
                  download={`moneyprinter_vn_${renderJob.jobId}.mp4`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tải về (.MP4)</span>
                </a>
              </div>
            </div>

            <div className="bg-slate-950 rounded-lg border border-slate-200 overflow-hidden flex justify-center">
              <video
                src={renderJob.videoUrl}
                controls
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
              {recentHistory.slice(0, 4).map((rec) => (
                <div key={rec.jobId} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{rec.subject}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {rec.aspectRatio} · {rec.durationSec.toFixed(1)}s
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={rec.videoUrl}
                      download={`moneyprinter_${rec.jobId}.mp4`}
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
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
