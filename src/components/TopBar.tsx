import React from 'react';
import { Language, ScreenTab } from '../types';
import { t } from '../i18n/translations';
import { Smartphone, Monitor, Globe, Moon, Sun, Info } from 'lucide-react';

interface Props {
  activeTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  lang: Language;
  onToggleLang: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  showPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
}

export const TopBar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  lang,
  onToggleLang,
  isDark,
  onToggleTheme,
  showPhoneFrame,
  onTogglePhoneFrame,
}) => {
  const tabs: { id: ScreenTab; label: string; isMobile: boolean }[] = [
    { id: 'scan', label: t('tab_scan', lang), isMobile: true },
    { id: 'sms_phone', label: t('tab_sms_phone', lang), isMobile: true },
    { id: 'admin_phone', label: t('tab_admin_phone', lang), isMobile: true },
    { id: 'admin_web', label: t('tab_admin_web', lang), isMobile: false },
    { id: 'tip', label: t('tab_tip', lang), isMobile: true },
    { id: 'architecture', label: t('tab_architecture', lang), isMobile: false },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#ffffff]/90 dark:bg-[#1d2326]/90 backdrop-blur-md border-b border-[#e4e1d8] dark:border-[#2b3438] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onSelectTab('scan')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0f6e4f] dark:bg-[#3fae86] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ቃ
            </div>
            <div className="leading-tight">
              <span className="font-bold text-base tracking-tight text-[#1b1f1d] dark:text-[#f1f3f2]">
                ቃኝ
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-xs text-[#646b67] dark:text-[#9aa29e]">
                (Kagn)
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (5 core tabs + docs) */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0f6e4f] text-white shadow-sm font-semibold'
                    : 'text-[#646b67] dark:text-[#9aa29e] hover:text-[#1b1f1d] dark:hover:text-[#f1f3f2] hover:bg-[#f5f3ee] dark:hover:bg-[#14181a]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls: Phone Frame Toggle, Language Toggle, Dark Mode */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Frame Toggle */}
          <button
            onClick={onTogglePhoneFrame}
            title={showPhoneFrame ? 'Switch to fluid full layout' : 'Fit inside 390px mobile frame'}
            className="p-1.5 rounded-lg border border-[#e4e1d8] dark:border-[#2b3438] text-[#646b67] dark:text-[#9aa29e] hover:bg-[#f5f3ee] dark:hover:bg-[#14181a] transition-colors cursor-pointer"
            aria-label="Toggle Phone Frame"
          >
            {showPhoneFrame ? (
              <Monitor className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </button>

          {/* Language Toggle (አማርኛ / English) */}
          <button
            onClick={onToggleLang}
            className="px-2 py-1 rounded-lg border border-[#e4e1d8] dark:border-[#2b3438] text-xs font-semibold text-[#1b1f1d] dark:text-[#f1f3f2] hover:bg-[#f5f3ee] dark:hover:bg-[#14181a] flex items-center gap-1 transition-colors cursor-pointer"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-[#0f6e4f] dark:text-[#3fae86]" />
            <span>{lang === 'am' ? 'English' : 'አማርኛ'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-[#e4e1d8] dark:border-[#2b3438] text-[#646b67] dark:text-[#9aa29e] hover:bg-[#f5f3ee] dark:hover:bg-[#14181a] transition-colors cursor-pointer"
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
