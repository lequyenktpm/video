import React from 'react';
import { StudioTab } from '../shared/types';

interface TopBarProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onSelectTab }) => {
  const anchorLinks = [
    { href: '#sec-visuals', label: '1. Cảnh quay' },
    { href: '#sec-audio', label: '2. Giọng & Phụ đề' },
    { href: '#sec-script', label: '3. Kịch bản & Prompt AI' },
  ];

  const tabs: Array<{ id: StudioTab; label: string }> = [
    { id: 'short_video', label: 'Tạo Video Ngắn' },
    { id: 'learning', label: 'Học Ngoại Ngữ & Đố Vui (5s)' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 min-h-14 py-2 sm:py-0 sm:h-16 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 md:gap-6">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2 sm:gap-4 min-w-0 w-full md:w-auto">
          <a
            href="#top"
            className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            MoneyPrinterTurbo VN
          </a>

          <div
            role="tablist"
            aria-label="Chế độ Studio"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 max-w-full"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`studio-tab-${tab.id}`}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <nav
          aria-label="Điều hướng bước tạo video"
          className="hidden md:flex items-center gap-5 lg:gap-7"
        >
          {anchorLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
};
