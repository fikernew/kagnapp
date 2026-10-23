import React from 'react';

interface Props {
  children: React.ReactNode;
  enabled: boolean;
  maxWidth?: string;
}

export const PhoneFrame: React.FC<Props> = ({ children, enabled, maxWidth = 'max-w-[400px]' }) => {
  if (!enabled) {
    return <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">{children}</div>;
  }

  return (
    <div className="flex justify-center items-start py-3 sm:py-6 px-2 min-h-[calc(100vh-3.5rem)]">
      <div
        className={`w-full ${maxWidth} bg-[#ffffff] dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-3xl shadow-xl overflow-hidden flex flex-col transition-all`}
        style={{ minHeight: '680px' }}
      >
        {/* Mock phone speaker & camera bezel */}
        <div className="w-full bg-[#f5f3ee] dark:bg-[#14181a] px-6 pt-2 pb-1.5 flex items-center justify-between text-[11px] font-mono text-[#646b67] dark:text-[#9aa29e] border-b border-[#e4e1d8] dark:border-[#2b3438]">
          <span>14:30</span>
          <div className="w-16 h-3.5 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-black/20 dark:bg-white/20"></div>
          </div>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-4 h-2.5 border border-current rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-current rounded-xs"></div>
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
