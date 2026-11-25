import React, { useEffect, useRef, useState } from 'react';
import {
  CompletedVideoRecord,
  MediaAssetItem,
  RenderJobConfig,
  RenderJobStatus,
  StudioTab,
} from './shared/types';
import { TopBar } from './components/TopBar';
import { VideoStudioView } from './components/VideoStudioView';
import { safeParseJsonResponse } from './shared/mptEngine';
import { DEFAULT_ANIME_DIALOGUE_SCRIPT } from './shared/animeStoryEngine';

const HISTORY_STORAGE_KEY = 'mpt_vn_history_v1';
const ELEVENLABS_KEY_STORAGE_KEY = 'mpt_vn_elevenlabs_key_v1';

function loadSavedElevenLabsKey(): string {
  try {
    return window.localStorage.getItem(ELEVENLABS_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

const DEFAULT_SHORT_CONFIG: RenderJobConfig = {
  subject: 'Bí ẩn đại dương sâu thẳm chưa từng được giải mã',
  language: 'vi',
  scriptStyle: 'curious_facts',
  sentenceCount: 4,
  llmProvider: 'pollinations',
  script: [
    'Hơn 80% đại dương sâu thẳm trên Trái Đất vẫn chưa từng được con người đặt chân tới.',
    'Ở độ sâu tối đen hàng nghìn mét, nhiều sinh vật biển tự phát sáng để săn mồi.',
    'Tại đáy rãnh Mariana, áp suất lớn gấp nghìn lần mặt đất nhưng sự sống vẫn tồn tại.',
    'Theo dõi kênh để khám phá thêm những bí ẩn kỳ vĩ của hành tinh xanh mỗi ngày nhé!',
  ].join('\n'),
  terms: ['deep ocean', 'underwater coral', 'jellyfish ocean', 'ocean waves'],
  scenePrompts: [
    'vast dark deep blue ocean abyss from above, underwater sunbeams, cinematic 8k',
    'glowing jellyfish floating in deep sea, macro underwater photography',
    'deep sea coral reef and ocean currents in dramatic light',
    'aerial view of turquoise ocean waves breaking at sunrise',
  ],
  materialSource: 'studio_2411',
  neutralBgTheme: 'slate_studio',
  studio2411Theme: 'cards_pastel',
  curatedBgCategory: 'all',
  curatedBgId: 'auto',
  mediaTypeFilter: 'all',
  visualMood: 'auto',
  selectedMediaIds: [],
  aspectRatio: '9:16',
  videoQuality: '720p',
  concatMode: 'sequential',
  transitionMode: 'random',
  clipDurationSec: 3,
  ttsProvider: 'elevenlabs',
  voiceId: 'el-rachel',
  dualVoiceEnabled: false,
  secondaryVoiceId: 'el-adam',
  pauseBetweenLinesSec: 0,
  clockTickEnabled: true,
  targetRepeatCount: 0,
  targetRepeatPauseSec: 2,
  fullAnswerRecapMode: 'off',
  summarizeAtEnd: true,
  stickyDualSubtitle: true,
  outputDir: 'output',
  voiceRate: 1.05,
  voiceVolume: 1.0,
  bgmPreset: 'lofi_chill',
  bgmVolume: 0.03,
  subtitle: {
    enabled: true,
    fontName: 'Noto Sans',
    position: 'bottom',
    customPositionPct: 84,
    fontSize: 38,
    sourceFontSize: 30,
    textColor: '#0F172A',
    highlightColor: '#4F46E5',
    strokeColor: '#FFFFFF',
    strokeWidth: 2.0,
    boxStyle: 'outline',
    effect: 'karaoke',
    showRoleBadges: false,
  },
};

const DEFAULT_LEARNING_CONFIG: RenderJobConfig = {
  subject: '【瞬間英作文】「彼女には気をつけて！」を英語で言えますか？',
  language: 'ja_en',
  scriptStyle: 'language_challenge',
  sentenceCount: 6,
  llmProvider: 'pollinations',
  script: [
    'Tiêu đề: 今から日本語を読み上げます。5秒以内に英語で言ってみましょう！',
    'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
    'English: Watch out for her!',
    'Q: 「無理しないでね」はどう言いますか？ [PAUSE]',
    'English: Take it easy and don’t push yourself too hard!',
    'Outro: いくつ言えましたか？気に入ったら保存して練習しましょう！',
  ].join('\n'),
  terms: ['japanese office conversation', 'city walk', 'coffee shop conversation', 'modern office'],
  scenePrompts: [
    'young person listening with headphones in cozy minimalist room, soft daylight, no text',
    'confident professional at bright modern desk, warm daylight, no text',
    'thinking person looking out sunlit window in modern cafe, shallow depth of field, no text',
    'confident speaker smiling in sunlit street, natural portrait cinematography, no text',
    'two colleagues talking in cozy coffee shop, cinematic lighting, no text',
    'professional typing on laptop at bright wooden desk, natural light, no text',
  ],
  materialSource: 'studio_2411',
  neutralBgTheme: 'slate_studio',
  studio2411Theme: 'cards_pastel',
  curatedBgCategory: 'all',
  curatedBgId: 'auto',
  mediaTypeFilter: 'all',
  visualMood: 'auto',
  selectedMediaIds: [],
  aspectRatio: '9:16',
  videoQuality: '720p',
  concatMode: 'sequential',
  transitionMode: 'random',
  clipDurationSec: 3,
  ttsProvider: 'elevenlabs',
  voiceId: 'el-elli',
  dualVoiceEnabled: true,
  secondaryVoiceId: 'el-rachel',
  pauseBetweenLinesSec: 5,
  clockTickEnabled: true,
  targetRepeatCount: 1,
  targetRepeatPauseSec: 2,
  fullAnswerRecapMode: 'target_full',
  summarizeAtEnd: true,
  stickyDualSubtitle: true,
  outputDir: 'output',
  voiceRate: 1.0,
  voiceVolume: 1.0,
  bgmPreset: 'lofi_chill',
  bgmVolume: 0.03,
  subtitle: {
    enabled: true,
    fontName: 'M PLUS 1p',
    position: 'bottom',
    customPositionPct: 84,
    fontSize: 38,
    sourceFontSize: 28,
    textColor: '#0F172A',
    highlightColor: '#4F46E5',
    strokeColor: '#FFFFFF',
    strokeWidth: 2.0,
    boxStyle: 'outline',
    effect: 'karaoke',
    showRoleBadges: false,
  },
};

const DEFAULT_ANIME_STORY_CONFIG: RenderJobConfig = {
  subject: '会話 1: 親しき中にも礼儀あり',
  language: 'ja',
  scriptStyle: 'bilingual_dialogue',
  sentenceCount: 16,
  llmProvider: 'pollinations',
  script: DEFAULT_ANIME_DIALOGUE_SCRIPT,
  terms: ['japanese apartment living room', 'anime conversation'],
  scenePrompts: [],
  materialSource: 'anime_cartoon',
  animeSceneStyle: 'room_warm',
  animeRoomOverride: 'auto',
  animeCharacterVoices: {
    先輩: 'el-adam',
    芳蘭: 'el-elli',
    日向: 'el-josh',
  },
  animeReadStageDirections: false,
  selectedMediaIds: [],
  aspectRatio: '9:16',
  videoQuality: '720p',
  concatMode: 'sequential',
  transitionMode: 'fade',
  clipDurationSec: 3,
  ttsProvider: 'elevenlabs',
  voiceId: 'el-adam',
  dualVoiceEnabled: true,
  secondaryVoiceId: 'el-elli',
  pauseBetweenLinesSec: 0,
  clockTickEnabled: false,
  targetRepeatCount: 0,
  targetRepeatPauseSec: 1.5,
  fullAnswerRecapMode: 'off',
  summarizeAtEnd: false,
  stickyDualSubtitle: false,
  outputDir: 'output',
  voiceRate: 1.04,
  voiceVolume: 1.0,
  bgmPreset: 'lofi_chill',
  bgmVolume: 0.03,
  subtitle: {
    enabled: true,
    fontName: 'M PLUS 1p',
    position: 'bottom',
    customPositionPct: 86,
    fontSize: 34,
    sourceFontSize: 26,
    textColor: '#FFFFFF',
    highlightColor: '#FACC15',
    strokeColor: '#0F172A',
    strokeWidth: 2.0,
    boxStyle: 'dark_box',
    effect: 'karaoke',
    showRoleBadges: false,
  },
};

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>('short_video');
  const [configsByTab, setConfigsByTab] = useState<Record<StudioTab, RenderJobConfig>>(() => {
    const savedKey = loadSavedElevenLabsKey();
    return {
      short_video: { ...DEFAULT_SHORT_CONFIG, elevenLabsApiKey: savedKey },
      learning: { ...DEFAULT_LEARNING_CONFIG, elevenLabsApiKey: savedKey },
      anime_story: { ...DEFAULT_ANIME_STORY_CONFIG, elevenLabsApiKey: savedKey },
    };
  });

  const [uploadedMedia, setUploadedMedia] = useState<MediaAssetItem[]>([]);
  const [builtinBgm, setBuiltinBgm] = useState<MediaAssetItem[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const [jobsByTab, setJobsByTab] = useState<Record<StudioTab, RenderJobStatus | null>>({
    short_video: null,
    learning: null,
    anime_story: null,
  });

  const [history, setHistory] = useState<CompletedVideoRecord[]>(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CompletedVideoRecord[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota errors safely
    }
  }, [history]);

  const loadMediaLibrary = async () => {
    try {
      const res = await fetch('/api/media/list');
      if (res.ok) {
        const data = await safeParseJsonResponse<{
          uploaded: MediaAssetItem[];
          builtinBgm: MediaAssetItem[];
        }>(res, 'Lỗi đọc thư viện tư liệu.');
        setUploadedMedia(data.uploaded);
        setBuiltinBgm(data.builtinBgm);
      }
    } catch {
      // Ignored safely
    }
  };

  useEffect(() => {
    void loadMediaLibrary();
  }, []);

  const config = configsByTab[activeTab];
  const renderJob = jobsByTab[activeTab];
  const isRendering = Boolean(
    renderJob && (renderJob.status === 'queued' || renderJob.status === 'running')
  );

  const updateActiveConfig = (patch: Partial<RenderJobConfig>) => {
    if (patch.elevenLabsApiKey !== undefined) {
      const nextKey = patch.elevenLabsApiKey;
      try {
        if (nextKey.trim()) {
          window.localStorage.setItem(ELEVENLABS_KEY_STORAGE_KEY, nextKey);
        } else {
          window.localStorage.removeItem(ELEVENLABS_KEY_STORAGE_KEY);
        }
      } catch {
        // Ignore storage quota errors safely
      }
      setConfigsByTab((prev) => ({
        short_video: {
          ...prev.short_video,
          ...(activeTab === 'short_video' ? patch : {}),
          elevenLabsApiKey: nextKey,
        },
        learning: {
          ...prev.learning,
          ...(activeTab === 'learning' ? patch : {}),
          elevenLabsApiKey: nextKey,
        },
        anime_story: {
          ...prev.anime_story,
          ...(activeTab === 'anime_story' ? patch : {}),
          elevenLabsApiKey: nextKey,
        },
      }));
      return;
    }

    setConfigsByTab((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...patch },
    }));
  };

  const announcedDoneJobsRef = useRef<Set<string>>(new Set());

  const playExportCompleteSound = () => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
      window.setTimeout(() => {
        void ctx.close().catch(() => {});
      }, 1200);
    } catch {
      // Ignore Web Audio autoplay restrictions gracefully
    }
  };

  useEffect(() => {
    const runningEntries = (Object.entries(jobsByTab) as Array<[StudioTab, RenderJobStatus | null]>).filter(
      ([, job]) =>
        job &&
        job.status !== 'done' &&
        job.status !== 'error' &&
        job.status !== 'cancelled'
    );
    if (runningEntries.length === 0) return;

    const timer = window.setInterval(async () => {
      for (const [tabKey, job] of runningEntries) {
        if (!job) continue;
        try {
          const res = await fetch(`/api/render-status/${job.jobId}`);
          if (!res.ok) continue;
          const latest = await safeParseJsonResponse<RenderJobStatus>(
            res,
            'Không đọc được trạng thái render.'
          );
          setJobsByTab((prev) => ({ ...prev, [tabKey]: latest }));

          if (latest.status === 'done' && latest.videoUrl && latest.srtUrl) {
            if (!announcedDoneJobsRef.current.has(latest.jobId)) {
              announcedDoneJobsRef.current.add(latest.jobId);
              playExportCompleteSound();
            }
            const tabCfg = configsByTab[tabKey];
            const record: CompletedVideoRecord = {
              jobId: latest.jobId,
              subject: tabCfg.subject,
              aspectRatio: tabCfg.aspectRatio,
              voiceId: tabCfg.voiceId,
              durationSec: latest.durationSec ?? 0,
              fileSizeBytes: latest.fileSizeBytes ?? 0,
              videoUrl: latest.videoUrl,
              srtUrl: latest.srtUrl,
              savedOutputPath: latest.savedOutputPath,
              outputFilename: latest.outputFilename,
              createdAtIso: latest.createdAtIso,
            };
            setHistory((prev) =>
              prev.some((r) => r.jobId === record.jobId) ? prev : [record, ...prev].slice(0, 12)
            );
          }
        } catch {
          // Retry next interval
        }
      }
    }, 700);

    return () => window.clearInterval(timer);
  }, [jobsByTab, configsByTab]);

  const handleUploadFile = async (file: File) => {
    setUploadNotice(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: form,
      });
      const data = await safeParseJsonResponse<{ item?: MediaAssetItem; error?: string }>(
        res,
        'Tải tệp lên thất bại.'
      );
      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Tải tệp lên thất bại.');
      }
      await loadMediaLibrary();
      setUploadNotice(`Đã nạp vào studio: ${data.item.name}`);
      if (data.item.kind === 'audio') {
        updateActiveConfig({
          bgmPreset: 'custom',
          customBgmFilename: data.item.id,
        });
      } else {
        updateActiveConfig({
          materialSource: 'local_upload',
        });
      }
    } catch (err) {
      setUploadNotice(err instanceof Error ? err.message : 'Lỗi tải tệp lên.');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    await fetch(`/api/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadMediaLibrary();
  };

  const handleStartRender = async () => {
    const targetTab = activeTab;
    const payload = configsByTab[targetTab];
    try {
      const res = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeParseJsonResponse<{
        jobId?: string;
        status?: RenderJobStatus;
        error?: string;
      }>(res, 'Không thể khởi tạo tác vụ dựng video.');
      if (!res.ok || !data.status) {
        throw new Error(data.error || 'Không thể khởi tạo tác vụ dựng video.');
      }
      setJobsByTab((prev) => ({ ...prev, [targetTab]: data.status! }));
    } catch (err) {
      setJobsByTab((prev) => ({
        ...prev,
        [targetTab]: {
          jobId: `err_${Date.now()}`,
          status: 'error',
          progressPct: 0,
          stepLabel: 'Không thể khởi tạo dựng video',
          logs: [],
          errorMessage: err instanceof Error ? err.message : 'Lỗi máy chủ.',
          createdAtIso: new Date().toISOString(),
        },
      }));
    }
  };

  const handleCancelRender = async () => {
    const targetTab = activeTab;
    const activeJob = jobsByTab[targetTab];
    if (!activeJob) return;
    try {
      const res = await fetch(`/api/render-cancel/${encodeURIComponent(activeJob.jobId)}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await safeParseJsonResponse<{ status?: RenderJobStatus }>(
          res,
          'Đã hủy render.'
        );
        if (data.status) {
          setJobsByTab((prev) => ({ ...prev, [targetTab]: data.status! }));
          return;
        }
      }
    } catch {
      // Fall back to optimistic cancelled state if network call interrupted
    }
    setJobsByTab((prev) =>
      prev[targetTab]
        ? {
            ...prev,
            [targetTab]: {
              ...prev[targetTab]!,
              status: 'cancelled',
              stepLabel: 'Đã hủy tác vụ xuất video.',
            },
          }
        : prev
    );
  };

  return (
    <div id="top" className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900 flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,audio/*"
        className="hidden"
        aria-label="Chọn video, ảnh hoặc nhạc nền từ máy"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleUploadFile(file);
            e.target.value = '';
          }
        }}
      />

      <TopBar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 lg:min-h-0 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
              {activeTab === 'anime_story'
                ? 'Studio Hoạt Hình Hội Thoại 2D — Nhân Vật Cử Động Mượt & Nhiều Giọng'
                : activeTab === 'learning'
                ? 'Studio Học Ngoại Ngữ & Đố Vui — 2 Giọng Đọc & Đếm Ngược 5s'
                : 'Tạo Video Ngắn Tự Động — Chuẩn B-Roll & Phụ Đề Chuyên Nghiệp'}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              {activeTab === 'anime_story'
                ? 'Chuyển kịch bản hội thoại nhiều nhân vật kèm lời dẫn cảnh thành phim hoạt hình 2D cử động tay chân, nháy mắt, nhép miệng đúng người nói, biểu cảm cảm xúc và xuất MP4 24fps.'
                : activeTab === 'learning'
                ? 'Tạo video phản xạ dịch câu Việt–Anh–Nhật, hội thoại 2 giọng và đố vui với khoảng chờ đếm ngược 5 giây kèm tiếng đồng hồ Tick-Tock.'
                : 'Nhập chủ đề hoặc dán kịch bản từ AI, tự động ghép cảnh quay HD chuyển động mượt từng nhịp, lồng giọng đọc và gắn phụ đề chuẩn TikTok / Reels / Shorts.'}
            </p>
          </div>
          {uploadNotice && (
            <div className="text-xs font-medium text-emerald-700 shrink-0">{uploadNotice}</div>
          )}
        </div>

        <VideoStudioView
          studioTab={activeTab}
          config={config}
          onChangeConfig={updateActiveConfig}
          uploadedMedia={uploadedMedia}
          builtinBgm={builtinBgm}
          onTriggerUpload={() => fileInputRef.current?.click()}
          onDeleteMedia={(id) => void handleDeleteMedia(id)}
          renderJob={renderJob}
          isRendering={isRendering}
          onStartRender={() => void handleStartRender()}
          onCancelRender={() => void handleCancelRender()}
          onResetForm={() => {
            setConfigsByTab((prev) => {
              const preservedKey = prev[activeTab].elevenLabsApiKey ?? loadSavedElevenLabsKey();
              const base =
                activeTab === 'anime_story'
                  ? DEFAULT_ANIME_STORY_CONFIG
                  : activeTab === 'learning'
                  ? DEFAULT_LEARNING_CONFIG
                  : DEFAULT_SHORT_CONFIG;
              return {
                ...prev,
                [activeTab]: { ...base, elevenLabsApiKey: preservedKey },
              };
            });
            setJobsByTab((prev) => ({ ...prev, [activeTab]: null }));
          }}
          recentHistory={history}
          onDeleteHistory={(jobId) =>
            setHistory((prev) => prev.filter((r) => r.jobId !== jobId))
          }
        />
      </main>
    </div>
  );
}
