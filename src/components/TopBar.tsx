import React from 'react';
import { Upload } from 'lucide-react';

interface TopBarProps {
  onTriggerUpload: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onTriggerUpload }) => {
  const anchorLinks = [
    { href: '#sec-script', label: '1. Kịch bản' },
    { href: '#sec-visuals', label: '2. Cảnh quay' },
    { href: '#sec-audio', label: '3. Giọng & Phụ đề' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 md:gap-8">
        <a
          href="#top"
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          MoneyPrinterTurbo VN
        </a>

        <nav aria-label="Điều hướng bước tạo video" className="hidden md:flex items-center gap-6">
          {anchorLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span className="sm:hidden">Tải tệp</span>
            <span className="hidden sm:inline">Tải video / nhạc lên</span>
          </button>
        </div>
      </div>
    </header>
  );
};
