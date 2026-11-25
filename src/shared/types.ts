export type LanguageCode = 'vi' | 'en' | 'ja' | 'bilingual' | 'vi_ja' | 'ja_en';

export type StudioTab = 'short_video' | 'learning';

export type LlmProvider = 'gemini_search' | 'pollinations' | 'ollama' | 'offline_vi';

export type ScriptStyle =
  | 'curious_facts'
  | 'storytelling'
  | 'tips_howto'
  | 'news_fast'
  | 'language_challenge'
  | 'bilingual_dialogue'
  | 'quiz_riddle'
  | 'motivational'
  | 'top_list';

export type TtsProvider = 'google_free' | 'edge_auto' | 'elevenlabs';

export type VoiceOptionId =
  | 'vi-VN-HoaiMyNeural'
  | 'vi-VN-NamMinhNeural'
  | 'en-US-JennyNeural'
  | 'en-US-GuyNeural'
  | 'ja-JP-NanamiNeural'
  | 'ja-JP-KeitaNeural';

export type MaterialSource =
  | 'mixkit_video'
  | 'hybrid_real'
  | 'pollinations_scene'
  | 'stock_free'
  | 'local_upload';

export type VideoAspectRatio = '9:16' | '16:9' | '1:1';

export type VideoQuality = '480p' | '720p' | '1080p';

export type VideoConcatMode = 'sequential' | 'random';

export type VideoTransitionMode =
  | 'random'
  | 'fade'
  | 'dissolve'
  | 'slide'
  | 'wipeleft'
  | 'smoothleft'
  | 'circleopen'
  | 'radial'
  | 'pixelize'
  | 'fadeblack'
  | 'none';

export type SubtitlePosition = 'bottom' | 'center' | 'top' | 'custom';

export type SubtitleFont = 'DejaVu Sans' | 'Liberation Sans' | 'JetBrains Mono' | 'Noto Sans';

export type SubtitleBoxStyle = 'outline' | 'dark_box';

export type SubtitleEffect = 'karaoke' | 'pop_zoom' | 'fade_slide' | 'typewriter' | 'static';

export type BgmPreset =
  | 'none'
  | 'lofi_chill'
  | 'soft_piano'
  | 'tech_upbeat'
  | 'cinema_ambient'
  | 'custom';

export type FullAnswerRecapMode = 'off' | 'target_full' | 'both_full';

export interface SubtitleCue {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
  voiceSlot?: 'primary' | 'secondary';
  isCountdown?: boolean;
}

export interface SubtitleConfig {
  enabled: boolean;
  fontName: SubtitleFont;
  position: SubtitlePosition;
  customPositionPct: number;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  boxStyle: SubtitleBoxStyle;
  effect: SubtitleEffect;
}

export interface TopicSuggestion {
  title: string;
  angle: string;
  sourceType: 'ai' | 'google_search';
  sourceUrl?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ScenePreviewItem {
  index: number;
  sentence: string;
  prompt: string;
  kind: 'video' | 'image';
  previewUrl: string;
  thumbUrl?: string;
  sourceLabel: string;
}

export interface RenderJobConfig {
  subject: string;
  language: LanguageCode;
  scriptStyle: ScriptStyle;
  sentenceCount: number;
  llmProvider: LlmProvider;
  script: string;
  terms: string[];
  scenePrompts: string[];
  materialSource: MaterialSource;
  selectedMediaIds: string[];
  customScenes?: ScenePreviewItem[];
  aspectRatio: VideoAspectRatio;
  videoQuality?: VideoQuality;
  concatMode: VideoConcatMode;
  transitionMode: VideoTransitionMode;
  clipDurationSec: number;
  ttsProvider: TtsProvider;
  voiceId: VoiceOptionId;
  dualVoiceEnabled?: boolean;
  secondaryVoiceId?: VoiceOptionId;
  pauseBetweenLinesSec?: number;
  clockTickEnabled?: boolean;
  targetRepeatCount?: number;
  targetRepeatPauseSec?: number;
  fullAnswerRecapMode?: FullAnswerRecapMode;
  summarizeAtEnd?: boolean;
  outputDir?: string;
  outputFilename?: string;
  voiceRate: number;
  voiceVolume: number;
  bgmPreset: BgmPreset;
  customBgmFilename?: string;
  bgmVolume: number;
  subtitle: SubtitleConfig;
}

export interface RenderJobStatus {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progressPct: number;
  stepLabel: string;
  logs: string[];
  scenes?: ScenePreviewItem[];
  videoUrl?: string;
  srtUrl?: string;
  savedOutputPath?: string;
  savedSrtPath?: string;
  outputFilename?: string;
  durationSec?: number;
  fileSizeBytes?: number;
  errorMessage?: string;
  createdAtIso: string;
}

export interface MediaAssetItem {
  id: string;
  name: string;
  kind: 'video' | 'image' | 'audio';
  source: 'local_upload' | 'mixkit_free' | 'wikimedia_free' | 'archive_free' | 'builtin_bgm';
  url: string;
  previewThumbUrl?: string;
  localPath?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface CompletedVideoRecord {
  jobId: string;
  subject: string;
  aspectRatio: VideoAspectRatio;
  voiceId: VoiceOptionId;
  durationSec: number;
  fileSizeBytes: number;
  videoUrl: string;
  srtUrl: string;
  savedOutputPath?: string;
  outputFilename?: string;
  createdAtIso: string;
}
