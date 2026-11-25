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

const HISTORY_STORAGE_KEY = 'mpt_vn_history_v1';

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
  materialSource: 'mixkit_video',
  mediaTypeFilter: 'all',
  visualMood: 'auto',
  selectedMediaIds: [],
  aspectRatio: '9:16',
  videoQuality: '720p',
  concatMode: 'sequential',
  transitionMode: 'random',
  clipDurationSec: 3,
  ttsProvider: 'google_free',
  voiceId: 'vi-VN-HoaiMyNeural',
  dualVoiceEnabled: false,
  secondaryVoiceId: 'en-US-JennyNeural',
  pauseBetweenLinesSec: 0,
  clockTickEnabled: false,
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
    textColor: '#FFFFFF',
    highlightColor: '#FACC15',
    strokeColor: '#0F172A',
    strokeWidth: 2.0,
    boxStyle: 'outline',
    effect: 'karaoke',
  },
};

const DEFAULT_LEARNING_CONFIG: RenderJobConfig = {
  subject: '【瞬間英作文】「彼女には気をつけて！」を英語で言えますか？',
  language: 'ja_en',
  scriptStyle: 'language_challenge',
  sentenceCount: 6,
  llmProvider: 'pollinations',
  script: [
    'Tiêu đề: 1分瞬間英作文チャレンジ！',
    'English: 1-Minute Instant Translation Challenge!',
    'Q: 「彼女には気をつけて！」を英語で言えますか？ [PAUSE]',
    'English: Watch out for her!',
    'Q: 「無理しないでね」はどう言いますか？ [PAUSE]',
    'English: Take it easy and don’t push yourself too hard!',
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
  materialSource: 'mixkit_video',
  mediaTypeFilter: 'all',
  visualMood: 'auto',
  selectedMediaIds: [],
  aspectRatio: '9:16',
  videoQuality: '720p',
  concatMode: 'sequential',
  transitionMode: 'random',
  clipDurationSec: 3,
  ttsProvider: 'google_free',
  voiceId: 'ja-JP-NanamiNeural',
  dualVoiceEnabled: true,
  secondaryVoiceId: 'en-US-JennyNeural',
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
    textColor: '#FFFFFF',
    highlightColor: '#2DD4BF',
    strokeColor: '#0F172A',
    strokeWidth: 2.0,
    boxStyle: 'outline',
    effect: 'karaoke',
  },
};

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>('short_video');
  const [configsByTab, setConfigsByTab] = useState<Record<StudioTab, RenderJobConfig>>({
    short_video: DEFAULT_SHORT_CONFIG,
    learning: DEFAULT_LEARNING_CONFIG,
  });

  const [uploadedMedia, setUploadedMedia] = useState<MediaAssetItem[]>([]);
  const [builtinBgm, setBuiltinBgm] = useState<MediaAssetItem[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const [jobsByTab, setJobsByTab] = useState<Record<StudioTab, RenderJobStatus | null>>({
    short_video: null,
    learning: null,
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
    setConfigsByTab((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...patch },
    }));
  };

  useEffect(() => {
    const runningEntries = (Object.entries(jobsByTab) as Array<[StudioTab, RenderJobStatus | null]>).filter(
      ([, job]) => job && job.status !== 'done' && job.status !== 'error'
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

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
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

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
              {activeTab === 'learning'
                ? 'Studio Học Ngoại Ngữ & Đố Vui — 2 Giọng Đọc & Đếm Ngược 5s'
                : 'Tạo Video Ngắn Tự Động — Chuẩn B-Roll & Phụ Đề Chuyên Nghiệp'}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              {activeTab === 'learning'
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
          onResetForm={() => {
            setConfigsByTab((prev) => ({
              ...prev,
              [activeTab]:
                activeTab === 'learning' ? DEFAULT_LEARNING_CONFIG : DEFAULT_SHORT_CONFIG,
            }));
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
