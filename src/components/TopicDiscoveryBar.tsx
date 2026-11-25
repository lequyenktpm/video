import React, { useState } from 'react';
import { ExternalLink, Globe, Loader2, Sparkles } from 'lucide-react';
import { GroundingSource, LanguageCode, TopicSuggestion } from '../shared/types';
import { safeParseJsonResponse } from '../shared/mptEngine';

interface TopicDiscoveryBarProps {
  currentSubject: string;
  language: LanguageCode;
  onSelectTopic: (title: string) => void;
}

export const TopicDiscoveryBar: React.FC<TopicDiscoveryBarProps> = ({
  currentSubject,
  language,
  onSelectTopic,
}) => {
  const [seedQuery, setSeedQuery] = useState('');
  const [loadingMode, setLoadingMode] = useState<'ai' | 'google_search' | null>(null);
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [providerLabel, setProviderLabel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setTopics([]);
    setSources([]);
    setProviderLabel(null);
    setErrorMsg(null);
  }, [language]);

  const handleDiscover = async (mode: 'ai' | 'google_search') => {
    setErrorMsg(null);
    setLoadingMode(mode);
    try {
      const effectiveQuery = seedQuery.trim();
      const res = await fetch('/api/topics/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          query: effectiveQuery,
          language,
        }),
      });
      const data = await safeParseJsonResponse<{
        topics?: TopicSuggestion[];
        sources?: GroundingSource[];
        providerUsed?: string;
        error?: string;
      }>(res, 'Không thể tìm gợi ý chủ đề lúc này.');
      if (!res.ok || !data.topics) {
        throw new Error(data.error || 'Không thể tìm gợi ý chủ đề lúc này.');
      }
      setTopics(data.topics);
      setSources(data.sources ?? []);
      setProviderLabel(data.providerUsed ?? null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi tìm gợi ý chủ đề.');
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div
      data-testid="topic-discovery-bar"
      className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          id="mpt-topic-seed"
          type="text"
          value={seedQuery}
          onChange={(e) => setSeedQuery(e.target.value)}
          placeholder="Nhập từ khóa ngách (hoặc để trống để AI tự gợi ý kiến thức mới)..."
          aria-label="Từ khóa gợi ý chủ đề AI hoặc tìm kiếm Google"
          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-slate-900"
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={loadingMode !== null}
            onClick={() => void handleDiscover('ai')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 disabled:opacity-50 whitespace-nowrap"
          >
            {loadingMode === 'ai' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>Gợi ý chủ đề AI</span>
          </button>

          <button
            type="button"
            disabled={loadingMode !== null}
            onClick={() => void handleDiscover('google_search')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap"
          >
            {loadingMode === 'google_search' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>Tìm xu hướng Google</span>
          </button>
        </div>
      </div>

      {errorMsg && <div className="text-xs text-rose-700">{errorMsg}</div>}

      {topics.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>Chọn 1 chủ đề bên dưới để điền nhanh:</span>
            {providerLabel && <span className="font-medium text-slate-700">{providerLabel}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {topics.map((topic, idx) => {
              const isSelected = currentSubject.trim() === topic.title.trim();
              return (
                <button
                  key={`${topic.title}_${idx}`}
                  type="button"
                  onClick={() => onSelectTopic(topic.title)}
                  aria-label={`Chọn chủ đề: ${topic.title}`}
                  className={`p-2 rounded-md border text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-400 text-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'
                  }`}
                >
                  <div className="text-xs font-medium leading-snug break-words">{topic.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug break-words">{topic.angle}</div>
                </button>
              );
            })}
          </div>
          {sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-slate-500">
              <span>Nguồn thực tế:</span>
              {sources.slice(0, 3).map((src, i) => (
                <a
                  key={`${src.url}_${i}`}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-700 hover:underline break-words"
                >
                  <span>{src.title}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
