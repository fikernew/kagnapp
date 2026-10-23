import React, { useState, useEffect, useId } from 'react';
import { AdminSettings, Language, PhoneStatus } from '../types';
import { BANKS } from '../data/constants';
import { t } from '../i18n/translations';
import { Check, ShieldAlert, Smartphone, CheckSquare, Square, Battery, Wifi } from 'lucide-react';

interface Props {
  lang: Language;
  phones: PhoneStatus[];
  settings: AdminSettings;
  onUpdateSettings: (settings: AdminSettings) => void;
  onTriggerHeartbeat?: (phoneId: 'phone_a' | 'phone_b') => void;
}

export const SmsPhoneScreen: React.FC<Props> = ({
  lang,
  phones,
  settings,
  onUpdateSettings,
  onTriggerHeartbeat,
}) => {
  const adminPinInputId = useId();
  const [selectedPhoneId, setSelectedPhoneId] = useState<'phone_a' | 'phone_b'>('phone_a');
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>(settings.selectedBanks);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Sync with settings prop
  useEffect(() => {
    setSelectedBankIds(settings.selectedBanks);
  }, [settings.selectedBanks]);

  const activePhone = phones.find((p) => p.id === selectedPhoneId) || phones[0];

  // All Banks toggle
  const allSelected = selectedBankIds.length === BANKS.length;
  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedBankIds([]);
    } else {
      setSelectedBankIds(BANKS.map((b) => b.id));
    }
  };

  const handleToggleBank = (bankId: string) => {
    setSelectedBankIds((prev) =>
      prev.includes(bankId) ? prev.filter((id) => id !== bankId) : [...prev, bankId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    // Verify Admin PIN (default 1234)
    if (pinInput !== settings.adminPin) {
      setPinError(t('invalid_pin', lang));
      return;
    }

    onUpdateSettings({
      ...settings,
      selectedBanks: selectedBankIds,
    });

    setPinInput('');
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 1600);
  };

  return (
    <div className="flex-1 flex flex-col justify-between space-y-4">
      {/* Toast Overlay */}
      {showSavedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#0f6e4f] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{t('toast_saved', lang)}</span>
        </div>
      )}

      {/* Screen Title & Subtitle */}
      <div className="border-b border-[#e4e1d8] dark:border-[#2b3438] pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1b1f1d] dark:text-[#f1f3f2]">
            {t('sms_listener_title', lang)}
          </h1>
          <p className="text-xs text-[#646b67] dark:text-[#9aa29e] mt-0.5">
            {lang === 'am' ? activePhone.nameAm : activePhone.nameEn}
          </p>
        </div>

        {/* Switcher between Phone A & B */}
        <div className="flex items-center gap-1 bg-[#f5f3ee] dark:bg-[#14181a] p-1 rounded-lg border border-[#e4e1d8] dark:border-[#2b3438]">
          <button
            onClick={() => setSelectedPhoneId('phone_a')}
            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
              selectedPhoneId === 'phone_a'
                ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                : 'text-[#646b67] dark:text-[#9aa29e]'
            }`}
          >
            A
          </button>
          <button
            onClick={() => setSelectedPhoneId('phone_b')}
            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
              selectedPhoneId === 'phone_b'
                ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                : 'text-[#646b67] dark:text-[#9aa29e]'
            }`}
          >
            B
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438] rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{t('connected_to_server', lang)}</span>
          </div>
          <span className="text-[11px] font-mono text-[#646b67] dark:text-[#9aa29e] flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5" /> 5G LTE
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-[#646b67] dark:text-[#9aa29e] pt-1 border-t border-[#e4e1d8] dark:border-[#2b3438]">
          <span>
            {t('last_sms_time', lang, {
              time: selectedPhoneId === 'phone_a' ? '2 min ago' : '12 min ago',
            })}
          </span>
          <span className="flex items-center gap-1 tabular-nums font-medium">
            <Battery className="w-3.5 h-3.5 text-emerald-600" />
            {t('battery_heartbeat', lang, { battery: activePhone.battery })}
          </span>
        </div>
      </div>

      {/* Banks to listen to */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
            {t('banks_to_listen', lang)}
          </label>
        </div>

        {/* All Banks Toggle Row */}
        <button
          type="button"
          onClick={handleToggleAll}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] hover:bg-[#f9f8f5] dark:hover:bg-[#171b1d] transition-colors cursor-pointer"
        >
          <span className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
            {t('all_banks', lang)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#646b67] dark:text-[#9aa29e] font-semibold">
              {t('n_selected', lang, { count: selectedBankIds.length })}
            </span>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                allSelected ? 'bg-[#0f6e4f] text-white' : 'border border-[#c8c4b7] text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        </button>

        {/* Scrollable list of 14 banks (max-h ~330px) */}
        <div className="max-h-[310px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-transparent">
          {BANKS.map((bank) => {
            const isChecked = selectedBankIds.includes(bank.id);
            return (
              <div
                key={bank.id}
                onClick={() => handleToggleBank(bank.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                  isChecked
                    ? 'bg-[#e6f4ee] dark:bg-[#163629] border-[#0f6e4f]/40 dark:border-[#3fae86]/40'
                    : 'bg-white dark:bg-[#1d2326] border-[#e4e1d8] dark:border-[#2b3438] hover:bg-[#f9f8f5] dark:hover:bg-[#171b1d]'
                }`}
              >
                <div className="pr-2">
                  <div className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
                    {lang === 'am' ? bank.nameAm : bank.nameEn}
                  </div>
                  <div
                    className={`text-[11px] font-medium mt-0.5 ${
                      bank.hasParser
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {bank.hasParser ? t('parser_ready', lang) : t('no_parser_holding', lang)}
                  </div>
                </div>

                {/* 30px Checkbox Target */}
                <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-[#0f6e4f] text-white shadow-xs'
                        : 'border border-[#c8c4b7] dark:border-[#3f4c52] bg-transparent'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin PIN Password Field & Save Form */}
      <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-[#e4e1d8] dark:border-[#2b3438]">
        <div>
          <label htmlFor={adminPinInputId} className="text-xs font-semibold text-[#646b67] dark:text-[#9aa29e] block mb-1">
            {t('admin_pin', lang)}
          </label>
          <div className="flex gap-2">
            <input
              id={adminPinInputId}
              type="password"
              placeholder="••••"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(null);
              }}
              className="flex-1 p-2.5 rounded-xl bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438] text-sm font-mono tracking-widest text-center"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0f6e4f] text-white text-xs font-bold hover:bg-[#0c573e] transition-colors cursor-pointer shadow-sm"
            >
              {t('save_btn', lang)}
            </button>
          </div>
          {pinError && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1">
              {pinError}
            </p>
          )}
        </div>

        {/* Footnote */}
        <p className="text-[11px] text-[#646b67] dark:text-[#9aa29e] leading-relaxed italic">
          {t('sms_footnote', lang)}
        </p>
      </form>
    </div>
  );
};
