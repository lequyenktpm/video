export type LlmProvider = 'pollinations' | 'ollama' | 'offline_vi';

export type ScriptStyle = 'curious_facts' | 'storytelling' | 'tips_howto' | 'news_fast';

export type TtsProvider = 'google_free' | 'edge_auto';

export type VoiceOptionId =
  | 'vi-VN-HoaiMyNeural'
  | 'vi-VN-NamMinhNeural'
  | 'en-US-JennyNeural'
  | 'en-US-GuyNeural';

export type MaterialSource =
  | 'mixkit_video'
  | 'hybrid_real'
  | 'pollinations_scene'
  | 'stock_free'
  | 'local_upload';

export type VideoAspectRatio = '9:16' | '16:9' | '1:1';

export type VideoConcatMode = 'sequential' | 'random';

export type VideoTransitionMode = 'fade' | 'slide' | 'none';

export type SubtitlePosition = 'bottom' | 'center' | 'top' | 'custom';

export type SubtitleFont = 'DejaVu Sans' | 'Liberation Sans' | 'JetBrains Mono';

export type SubtitleBoxStyle = 'outline' | 'dark_box';

export type BgmPreset = 'none' | 'lofi_chill' | 'tech_upbeat' | 'cinema_ambient' | 'custom';

export interface SubtitleCue {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
}

export interface SubtitleConfig {
  enabled: boolean;
  fontName: SubtitleFont;
  position: SubtitlePosition;
  customPositionPct: number;
  fontSize: number;
  textColor: string;
  strokeColor: string;
  strokeWidth: number;
  boxStyle: SubtitleBoxStyle;
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
  language: 'vi' | 'en' | 'bilingual';
  scriptStyle: ScriptStyle;
  sentenceCount: number;
  llmProvider: LlmProvider;
  script: string;
  terms: string[];
  scenePrompts: string[];
  materialSource: MaterialSource;
  selectedMediaIds: string[];
  aspectRatio: VideoAspectRatio;
  concatMode: VideoConcatMode;
  transitionMode: VideoTransitionMode;
  clipDurationSec: number;
  ttsProvider: TtsProvider;
  voiceId: VoiceOptionId;
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
  createdAtIso: string;
}
