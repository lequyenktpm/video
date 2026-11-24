import React from 'react';

export const TopBar: React.FC = () => {
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

        <nav aria-label="Điều hướng bước tạo video" className="flex items-center gap-5 sm:gap-7">
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
