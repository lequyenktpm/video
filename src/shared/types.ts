export type LanguageCode = 'vi' | 'en' | 'ja' | 'bilingual' | 'vi_ja' | 'ja_en';

export type StudioTab = 'short_video' | 'learning' | 'anime_story';

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
  | 'studio_2411'
  | 'anime_cartoon'
  | 'curated_preset'
  | 'mixkit_video'
  | 'hybrid_real'
  | 'neutral_css_bg'
  | 'pollinations_scene'
  | 'stock_free'
  | 'local_upload';

export type AnimeSceneStyle = 'room_warm' | 'dramatic_anime' | 'pastel_slice';

export type CuratedBackgroundCategory = 'all' | 'study' | 'interview' | 'life';

export type Studio2411ThemeId =
  | 'cards_pastel'
  | 'word_reveal_dark'
  | 'clean_sky'
  | 'mint_fresh'
  | 'warm_editorial';

export type Studio2411ComponentVariant =
  | 'bs-card-header'
  | 'css-compare'
  | 'css-roadmap'
  | 'css-glass-quote'
  | 'css-equation'
  | 'css-flashcard'
  | 'bs-progress-meter'
  | 'bs-alert-callout'
  | 'css-browser-mockup'
  | 'gauge-tone'
  | 'staircase-3d'
  | 'friends-chat'
  | 'avatar-speech'
  | 'dialogue-upgrade';

export type Studio2411AnimationIn = 'random' | 'pop-up' | 'slide-up' | 'drop-in' | 'fade-scale';

export interface Studio2411SceneComponentOverride {
  variant?: Studio2411ComponentVariant;
  animationIn?: Studio2411AnimationIn;
  title?: string;
  subtitle?: string;
  labels?: string[];
  highlightWord?: string;
  formula?: string;
  speechText?: string;
  reactionText?: string;
  exampleText?: string;
  prevTargetText?: string;
  promptPreviewText?: string;
  accentColor?: string;
  progressPct?: number;
}

export type NeutralBgTheme =
  | 'slate_studio'
  | 'charcoal_pro'
  | 'soft_indigo'
  | 'warm_paper'
  | 'clean_grid';

export type MediaTypeFilter = 'all' | 'video_only' | 'image_only';

export type VisualMood = 'auto' | 'bright' | 'moody' | 'vibrant' | 'minimal' | 'cinematic';

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

export type SubtitleFont =
  | 'DejaVu Sans'
  | 'Liberation Sans'
  | 'JetBrains Mono'
  | 'Noto Sans'
  | 'M PLUS 1p'
  | 'BIZ UDPGothic';

export type SubtitleBoxStyle = 'outline' | 'dark_box';

export type SubtitleEffect =
  | 'karaoke'
  | 'laser'
  | 'pop_zoom'
  | 'fade_slide'
  | 'typewriter'
  | 'static';

export type BgmPreset =
  | 'none'
  | 'lofi_chill'
  | 'soft_piano'
  | 'tech_upbeat'
  | 'cinema_ambient'
  | 'custom';

export type FullAnswerRecapMode = 'off' | 'target_full' | 'both_full';

export type ScriptRoleKind = 'title' | 'question' | 'answer' | 'narration' | 'outro';

export interface SubtitleCue {
  index: number;
  startSec: number;
  endSec: number;
  animDurationSec?: number;
  text: string;
  voiceSlot?: 'primary' | 'secondary';
  isCountdown?: boolean;
  countdownTotalSteps?: number;
  isStickySource?: boolean;
  isStaticHold?: boolean;
  isIntroOrOutro?: boolean;
  companionSourceLines?: number;
  companionTargetLines?: number;
  roleKind?: ScriptRoleKind;
  roleLabel?: string;
  contextLabel?: string;
}

export interface SubtitleConfig {
  enabled: boolean;
  fontName: SubtitleFont;
  position: SubtitlePosition;
  customPositionPct: number;
  fontSize: number;
  sourceFontSize?: number;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  boxStyle: SubtitleBoxStyle;
  effect: SubtitleEffect;
  showRoleBadges?: boolean;
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
  componentSpec?: Studio2411SceneComponentOverride;
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
  sceneComponents?: Studio2411SceneComponentOverride[];
  materialSource: MaterialSource;
  neutralBgTheme?: NeutralBgTheme;
  studio2411Theme?: Studio2411ThemeId;
  animeSceneStyle?: AnimeSceneStyle;
  animeCharacterVoices?: Record<string, VoiceOptionId>;
  animeReadStageDirections?: boolean;
  curatedBgCategory?: CuratedBackgroundCategory;
  curatedBgId?: string;
  mediaTypeFilter?: MediaTypeFilter;
  visualMood?: VisualMood;
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
  stickyDualSubtitle?: boolean;
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
  status: 'queued' | 'running' | 'done' | 'error' | 'cancelled';
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
