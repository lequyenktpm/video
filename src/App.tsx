import React, { useEffect, useRef, useState } from 'react';
import {
  CompletedVideoRecord,
  MediaAssetItem,
  RenderJobConfig,
  RenderJobStatus,
} from './shared/types';
import { TopBar } from './components/TopBar';
import { VideoStudioView } from './components/VideoStudioView';

const HISTORY_STORAGE_KEY = 'mpt_vn_history_v1';

const DEFAULT_CONFIG: RenderJobConfig = {
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
  selectedMediaIds: [],
  aspectRatio: '9:16',
  concatMode: 'sequential',
  transitionMode: 'fade',
  clipDurationSec: 3,
  ttsProvider: 'google_free',
  voiceId: 'vi-VN-HoaiMyNeural',
  voiceRate: 1.05,
  voiceVolume: 1.0,
  bgmPreset: 'lofi_chill',
  bgmVolume: 0.22,
  subtitle: {
    enabled: true,
    fontName: 'DejaVu Sans',
    position: 'bottom',
    customPositionPct: 84,
    fontSize: 42,
    textColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2.2,
    boxStyle: 'outline',
  },
};

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [config, setConfig] = useState<RenderJobConfig>(DEFAULT_CONFIG);

  const [uploadedMedia, setUploadedMedia] = useState<MediaAssetItem[]>([]);
  const [builtinBgm, setBuiltinBgm] = useState<MediaAssetItem[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const [renderJob, setRenderJob] = useState<RenderJobStatus | null>(null);
  const [isRendering, setIsRendering] = useState(false);

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
        const data = (await res.json()) as {
          uploaded: MediaAssetItem[];
          builtinBgm: MediaAssetItem[];
        };
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

  useEffect(() => {
    if (!renderJob || renderJob.status === 'done' || renderJob.status === 'error') {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/render-status/${renderJob.jobId}`);
        if (!res.ok) return;
        const latest = (await res.json()) as RenderJobStatus;
        setRenderJob(latest);

        if (latest.status === 'done' || latest.status === 'error') {
          setIsRendering(false);
          if (latest.status === 'done' && latest.videoUrl && latest.srtUrl) {
            const record: CompletedVideoRecord = {
              jobId: latest.jobId,
              subject: config.subject,
              aspectRatio: config.aspectRatio,
              voiceId: config.voiceId,
              durationSec: latest.durationSec ?? 0,
              fileSizeBytes: latest.fileSizeBytes ?? 0,
              videoUrl: latest.videoUrl,
              srtUrl: latest.srtUrl,
              createdAtIso: latest.createdAtIso,
            };
            setHistory((prev) =>
              prev.some((r) => r.jobId === record.jobId) ? prev : [record, ...prev].slice(0, 12)
            );
          }
        }
      } catch {
        // Retry next interval
      }
    }, 700);

    return () => window.clearInterval(timer);
  }, [renderJob?.jobId, renderJob?.status, config.subject, config.aspectRatio, config.voiceId]);

  const handleUploadFile = async (file: File) => {
    setUploadNotice(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: form,
      });
      const data = (await res.json()) as { item?: MediaAssetItem; error?: string };
      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Tải tệp lên thất bại.');
      }
      await loadMediaLibrary();
      setUploadNotice(`Đã nạp vào studio: ${data.item.name}`);
      if (data.item.kind === 'audio') {
        setConfig((prev) => ({
          ...prev,
          bgmPreset: 'custom',
          customBgmFilename: data.item?.id,
        }));
      } else {
        setConfig((prev) => ({
          ...prev,
          materialSource: 'local_upload',
        }));
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
    setIsRendering(true);
    try {
      const res = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = (await res.json()) as {
        jobId?: string;
        status?: RenderJobStatus;
        error?: string;
      };
      if (!res.ok || !data.status) {
        throw new Error(data.error || 'Không thể khởi tạo tác vụ dựng video.');
      }
      setRenderJob(data.status);
    } catch (err) {
      setIsRendering(false);
      setRenderJob({
        jobId: `err_${Date.now()}`,
        status: 'error',
        progressPct: 0,
        stepLabel: 'Không thể khởi tạo dựng video',
        logs: [],
        errorMessage: err instanceof Error ? err.message : 'Lỗi máy chủ.',
        createdAtIso: new Date().toISOString(),
      });
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

      <TopBar onTriggerUpload={() => fileInputRef.current?.click()} />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
              Tạo Video Ngắn Tự Động — Chuẩn B-Roll &amp; Phụ Đề Chuyên Nghiệp
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Nhập chủ đề hoặc dán kịch bản từ AI, tự động ghép cảnh quay HD chuyển động mượt từng nhịp, lồng giọng đọc và gắn phụ đề chuẩn TikTok / Reels / Shorts.
            </p>
          </div>
          {uploadNotice && (
            <div className="text-xs font-medium text-emerald-700 shrink-0">{uploadNotice}</div>
          )}
        </div>

        <VideoStudioView
          config={config}
          onChangeConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
          uploadedMedia={uploadedMedia}
          builtinBgm={builtinBgm}
          onTriggerUpload={() => fileInputRef.current?.click()}
          onDeleteMedia={(id) => void handleDeleteMedia(id)}
          renderJob={renderJob}
          isRendering={isRendering}
          onStartRender={() => void handleStartRender()}
          onResetForm={() => {
            setConfig(DEFAULT_CONFIG);
            setRenderJob(null);
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
