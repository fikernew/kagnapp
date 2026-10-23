import React, { useState, useId } from 'react';
import {
  AdminSettings,
  Bank,
  Language,
  PaymentCheck,
  PhoneStatus,
  RefundItem,
  ScanResultType,
  Waiter,
} from '../types';
import { WAITERS, BANKS } from '../data/constants';
import { formatEtb, t } from '../i18n/translations';
import { Check, X, Clock, HelpCircle, ArrowRight, CornerDownLeft, Sparkles, AlertTriangle } from 'lucide-react';

interface Props {
  lang: Language;
  phones: PhoneStatus[];
  settings: AdminSettings;
  checks: PaymentCheck[];
  onAddCheck: (check: PaymentCheck) => void;
  onAddRefund: (refund: RefundItem) => void;
  onAddTip: (checkId: string, tipAmount: number) => void;
}

export const ScanScreen: React.FC<Props> = ({
  lang,
  phones,
  settings,
  checks,
  onAddCheck,
  onAddRefund,
  onAddTip,
}) => {
  const saleAmountInputId = useId();
  const amountReceivedInputId = useId();
  const manualRefInputId = useId();

  // Selection & Input States
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>(WAITERS[0].id);
  const [saleAmount, setSaleAmount] = useState<number>(850);
  const [amountReceived, setAmountReceived] = useState<string>(''); // empty by default; placeholder is saleAmount
  const [showManualRef, setShowManualRef] = useState<boolean>(false);
  const [manualRef, setManualRef] = useState<string>('');

  // Scanning & Result States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [resultType, setResultType] = useState<ScanResultType | null>(null);
  const [currentCheck, setCurrentCheck] = useState<PaymentCheck | null>(null);
  const [currentBank, setCurrentBank] = useState<Bank | null>(null);

  // Tip question state within success card
  // 'unanswered' | 'answered_tip' | 'answered_refund' | 'confirm_large'
  const [tipDecisionState, setTipDecisionState] = useState<
    'unanswered' | 'answered_tip' | 'answered_refund' | 'confirm_large'
  >('unanswered');
  const [recordedTipToast, setRecordedTipToast] = useState<string | null>(null);

  // Compute selected waiter & today's stats
  const selectedWaiter = WAITERS.find((w) => w.id === selectedWaiterId) || WAITERS[0];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const waiterTodayChecks = checks.filter(
    (c) => c.waiterId === selectedWaiterId && c.dateStr === todayStr && c.status === 'verified'
  );
  const waiterTodayChecksCount = waiterTodayChecks.length;
  const waiterTodayTotal = waiterTodayChecks.reduce((sum, c) => sum + c.saleAmount, 0);

  // Start verification process
  const triggerVerification = (forceOutcome?: ScanResultType, customReference?: string) => {
    if (isScanning) return;
    setIsScanning(true);
    setResultType(null);
    setCurrentCheck(null);
    setCurrentBank(null);
    setTipDecisionState('unanswered');
    setRecordedTipToast(null);

    // Prompt rule: scanning takes about 1.3 s
    setTimeout(() => {
      setIsScanning(false);

      // Check force outcomes for testing
      if (forceOutcome === 'delay') {
        setResultType('delay');
        return;
      }

      // Check if any selected bank has a parser
      const selectedBanksWithParsers = settings.selectedBanks
        .map((id) => BANKS.find((b) => b.id === id))
        .filter((b) => b && b.hasParser);

      if (selectedBanksWithParsers.length === 0) {
        setResultType('delay');
        return;
      }

      // Determine paid amount: input value if typed, otherwise equal to saleAmount
      const paid = amountReceived !== '' ? parseFloat(amountReceived) || 0 : saleAmount;

      // Check amount mismatch: Paid < sale gives Mismatch
      if (paid < saleAmount) {
        setResultType('mismatch');
        return;
      }

      // Determine reference
      let ref = customReference?.trim().toUpperCase();
      if (!ref) {
        // pick from selected parsed banks
        const candidateBanks = selectedBanksWithParsers as Bank[];
        const chosenBank = candidateBanks[Math.floor(Math.random() * candidateBanks.length)];
        const randomNum = Math.floor(1000000 + Math.random() * 9000000);
        ref = `${chosenBank.codePrefix}${randomNum}`;
      }

      // Check duplicate reference: A reference can be used once
      const isDuplicate = checks.some(
        (c) => c.reference.toUpperCase() === ref?.toUpperCase() && c.status !== 'failed'
      );
      if (isDuplicate || forceOutcome === 'duplicate') {
        setResultType('duplicate');
        return;
      }

      // Determine matching bank
      let matchingBank = BANKS.find((b) => ref!.startsWith(b.codePrefix));
      if (!matchingBank) {
        matchingBank = selectedBanksWithParsers[0] as Bank;
      }
      setCurrentBank(matchingBank);

      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      const newCheck: PaymentCheck = {
        id: `chk_${Date.now()}_${ref}`,
        waiterId: selectedWaiterId,
        bankId: matchingBank.id,
        reference: ref!,
        saleAmount,
        paidAmount: paid,
        tipAmount: 0, // initially 0 until tip answered
        status: 'verified',
        dateStr: todayStr,
        timeStr,
        createdAt: now.toISOString(),
      };

      setCurrentCheck(newCheck);
      onAddCheck(newCheck);
      setResultType('success');
    }, 1300);
  };

  const handleNextScan = () => {
    setResultType(null);
    setCurrentCheck(null);
    setCurrentBank(null);
    setAmountReceived('');
    setManualRef('');
    setShowManualRef(false);
    setTipDecisionState('unanswered');
    setRecordedTipToast(null);
  };

  // Extra money calculations
  const extraAmount = currentCheck ? Math.max(0, currentCheck.paidAmount - currentCheck.saleAmount) : 0;
  const isLargeTip = currentCheck ? extraAmount > currentCheck.saleAmount : false;

  // Handle Tip Answers
  const handleTipYes = () => {
    if (isLargeTip) {
      setTipDecisionState('confirm_large');
    } else {
      executeRecordTip();
    }
  };

  const executeRecordTip = () => {
    if (!currentCheck) return;
    onAddTip(currentCheck.id, extraAmount);
    setTipDecisionState('answered_tip');
    setRecordedTipToast(
      t('tip_recorded_toast', lang, {
        extra: extraAmount,
        waiter: lang === 'am' ? selectedWaiter.nameAm : selectedWaiter.nameEn,
      })
    );
  };

  const handleTipNo = () => {
    if (!currentCheck) return;
    onAddRefund({
      id: `ref_${Date.now()}`,
      waiterId: currentCheck.waiterId,
      amount: extraAmount,
      reference: currentCheck.reference,
      dateStr: currentCheck.dateStr,
      createdAt: new Date().toISOString(),
      resolved: false,
    });
    setTipDecisionState('answered_refund');
    setRecordedTipToast(t('refund_logged_toast', lang, { extra: extraAmount }));
  };

  // If result screen is active, render full-card colored result view
  if (resultType) {
    if (resultType === 'success' && currentCheck) {
      const waiterObj = WAITERS.find((w) => w.id === currentCheck.waiterId) || selectedWaiter;
      const bankObj = currentBank || BANKS.find((b) => b.id === currentCheck.bankId) || BANKS[0];
      const hasExtra = extraAmount > 0;
      const canProceed = !hasExtra || tipDecisionState === 'answered_tip' || tipDecisionState === 'answered_refund';

      return (
        <div className="flex-1 flex flex-col justify-between bg-[#0f6e4f] text-white rounded-2xl p-6 transition-all duration-200">
          <div className="space-y-4">
            {/* Top Icon & Badge */}
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-9 h-9 text-white stroke-[3]" />
              </div>
              <span className="text-xs uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full font-semibold">
                {t('result_verified', lang)}
              </span>
            </div>

            {/* Huge Amount */}
            <div>
              <p className="text-xs text-white/80 font-medium">{t('sale_col', lang)}</p>
              <h1 className="text-4xl font-extrabold tracking-tight tabular-nums">
                {formatEtb(currentCheck.saleAmount, true)} <span className="text-2xl font-normal">ETB</span>
              </h1>
            </div>

            {/* Details Card */}
            <div className="bg-black/20 backdrop-blur-xs rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                <span className="text-white/70">{t('waiter', lang)}</span>
                <span className="font-semibold">{lang === 'am' ? waiterObj.nameAm : waiterObj.nameEn}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                <span className="text-white/70">{t('bank', lang)}</span>
                <span className="font-semibold">{lang === 'am' ? bankObj.nameAm : bankObj.nameEn}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                <span className="text-white/70">{t('reference', lang)}</span>
                <span className="font-mono font-semibold tracking-wider">{currentCheck.reference}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                <span className="text-white/70">{t('verified_at', lang)}</span>
                <span className="font-semibold tabular-nums">{currentCheck.timeStr}</span>
              </div>
              {currentCheck.paidAmount > currentCheck.saleAmount && (
                <div className="flex justify-between items-center py-0.5 text-emerald-200 font-bold">
                  <span>{t('paid', lang)}</span>
                  <span className="tabular-nums">{formatEtb(currentCheck.paidAmount, true)} ETB</span>
                </div>
              )}
            </div>

            {/* Tip Prompt Section (when paid > sale) */}
            {hasExtra && (
              <div className="bg-white/15 border border-white/20 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {t('extra_money_found', lang)}
                  </span>
                  <span className="text-base font-bold text-amber-300 tabular-nums">
                    +{formatEtb(extraAmount, true)} ETB
                  </span>
                </div>

                {/* State: Large tip confirmation dialog */}
                {tipDecisionState === 'confirm_large' ? (
                  <div className="space-y-3 p-2 bg-black/20 rounded-lg">
                    <p className="text-xs font-semibold text-amber-200">
                      {t('confirm_large_tip_title', lang, {
                        waiter: lang === 'am' ? waiterObj.nameAm : waiterObj.nameEn,
                      })}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={executeRecordTip}
                        className="py-2 px-3 bg-amber-400 text-slate-900 font-bold text-xs rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
                      >
                        {t('btn_give_permission', lang)}
                      </button>
                      <button
                        onClick={() => setTipDecisionState('unanswered')}
                        className="py-2 px-3 bg-white/20 text-white font-semibold text-xs rounded-lg hover:bg-white/30 transition-colors cursor-pointer"
                      >
                        {t('btn_back', lang)}
                      </button>
                    </div>
                  </div>
                ) : tipDecisionState === 'unanswered' ? (
                  <div className="space-y-2.5">
                    {isLargeTip && (
                      <div className="p-2 bg-amber-500/30 border border-amber-400/50 rounded-lg flex items-start gap-1.5 text-[11px] text-amber-200 font-semibold leading-tight">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
                        <span>
                          {t('warning_extra_exceeds', lang, {
                            extra: extraAmount,
                            sale: currentCheck.saleAmount,
                          })}
                        </span>
                      </div>
                    )}
                    <p className="text-xs font-medium text-white/90">{t('is_it_tip', lang)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleTipYes}
                        className="py-2 px-3 bg-emerald-300 hover:bg-emerald-200 text-slate-900 font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        {t('btn_yes_tip', lang)}
                      </button>
                      <button
                        onClick={handleTipNo}
                        className="py-2 px-3 bg-white/20 hover:bg-white/30 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        {t('btn_no_mistake', lang)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-black/20 rounded-lg text-xs font-semibold text-emerald-200">
                    {recordedTipToast}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Big Action Button */}
          <div className="pt-4">
            <button
              onClick={handleNextScan}
              disabled={!canProceed}
              title={!canProceed ? t('tooltip_answer_first', lang) : ''}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                canProceed
                  ? 'bg-white text-[#0f6e4f] hover:bg-slate-100 active:scale-[0.99]'
                  : 'bg-white/40 text-white/60 cursor-not-allowed opacity-60'
              }`}
            >
              <span>{t('btn_next_scan', lang)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!canProceed && (
              <p className="text-[11px] text-center text-white/70 mt-1.5 font-medium">
                {t('tooltip_answer_first', lang)}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (resultType === 'duplicate') {
      return (
        <div className="flex-1 flex flex-col justify-between bg-[#b3261e] text-white rounded-2xl p-6 transition-all duration-200">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <X className="w-9 h-9 text-white stroke-[3]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('result_duplicate_title', lang)}</h2>
              <p className="text-xs text-white/80 mt-2 leading-relaxed">
                {t('result_duplicate_desc', lang)}
              </p>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={handleNextScan}
              className="w-full py-3.5 px-4 rounded-xl bg-white text-[#b3261e] font-bold text-sm flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shadow-md"
            >
              {t('btn_back', lang)}
            </button>
          </div>
        </div>
      );
    }

    if (resultType === 'delay') {
      return (
        <div className="flex-1 flex flex-col justify-between bg-[#5f6368] text-white rounded-2xl p-6 transition-all duration-200">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Clock className="w-9 h-9 text-white stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('result_delay_title', lang)}</h2>
              <p className="text-xs text-white/80 mt-2 leading-relaxed">
                {t('result_delay_desc', lang)}
              </p>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={handleNextScan}
              className="w-full py-3.5 px-4 rounded-xl bg-white text-[#5f6368] font-bold text-sm flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shadow-md"
            >
              {t('btn_back', lang)}
            </button>
          </div>
        </div>
      );
    }

    if (resultType === 'mismatch') {
      return (
        <div className="flex-1 flex flex-col justify-between bg-[#8a5a00] text-white rounded-2xl p-6 transition-all duration-200">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              ≠
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('result_mismatch_title', lang)}</h2>
              <p className="text-xs text-white/80 mt-2 leading-relaxed">
                {t('result_mismatch_desc', lang)}
              </p>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={handleNextScan}
              className="w-full py-3.5 px-4 rounded-xl bg-white text-[#8a5a00] font-bold text-sm flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shadow-md"
            >
              {t('btn_back', lang)}
            </button>
          </div>
        </div>
      );
    }
  }

  // Primary Scan Interface (Cashier View)
  return (
    <div className="flex-1 flex flex-col justify-between space-y-4">
      {/* Top Header & Status Dots */}
      <div className="flex items-center justify-between border-b border-[#e4e1d8] dark:border-[#2b3438] pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-[#0f6e4f] dark:text-[#3fae86]">
            {t('app_title', lang)}
          </h1>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {t('sample_screen', lang)}
          </span>
        </div>

        {/* Status Dots */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-[#646b67] dark:text-[#9aa29e]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t('phone_a_online', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t('phone_b_online', lang)}</span>
          </div>
        </div>
      </div>

      {/* Waiter 4x2 Grid */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#646b67] dark:text-[#9aa29e]">
          {t('served_by', lang)}
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {WAITERS.map((waiter) => {
            const isSelected = waiter.id === selectedWaiterId;
            return (
              <button
                key={waiter.id}
                onClick={() => setSelectedWaiterId(waiter.id)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f6e4f] text-white shadow-sm ring-2 ring-[#0f6e4f]/30'
                    : 'bg-[#f5f3ee] dark:bg-[#14181a] text-[#1b1f1d] dark:text-[#f1f3f2] hover:bg-[#eae7df] dark:hover:bg-[#1a2022] border border-[#e4e1d8] dark:border-[#2b3438]'
                }`}
              >
                {lang === 'am' ? waiter.nameAm : waiter.nameEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sale Amount & Amount Received Inputs */}
      <div className="space-y-2">
        <div>
          <label htmlFor={saleAmountInputId} className="text-xs font-medium text-[#646b67] dark:text-[#9aa29e] block mb-1">
            {t('sale_amount', lang)}
          </label>
          <div className="relative">
            <input
              id={saleAmountInputId}
              type="number"
              value={saleAmount}
              onChange={(e) => setSaleAmount(parseFloat(e.target.value) || 0)}
              className="w-full text-2xl font-bold p-3 rounded-xl bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438] text-[#1b1f1d] dark:text-[#f1f3f2] tabular-nums focus:ring-2 focus:ring-[#0f6e4f]"
            />
            <span className="absolute right-3.5 top-3.5 text-xs font-bold text-[#646b67] dark:text-[#9aa29e]">
              ETB
            </span>
          </div>
        </div>

        {/* Test Amount Received Input */}
        <div>
          <label htmlFor={amountReceivedInputId} className="text-[11px] font-medium text-[#646b67] dark:text-[#9aa29e] block mb-0.5">
            {t('amount_received', lang)}
          </label>
          <div className="relative">
            <input
              id={amountReceivedInputId}
              type="number"
              placeholder={String(saleAmount)}
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full text-sm font-semibold p-2 rounded-lg bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438] text-[#1b1f1d] dark:text-[#f1f3f2] tabular-nums"
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#646b67] dark:text-[#9aa29e]">
              ETB
            </span>
          </div>
        </div>
      </div>

      {/* Viewfinder (200px rounded box with white corner brackets and laser line) */}
      <div className="relative w-full h-[190px] bg-[#14181a] rounded-2xl flex flex-col items-center justify-center overflow-hidden border border-slate-700 shadow-inner">
        {/* 4 White Corner Brackets */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-sm pointer-events-none"></div>
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-sm pointer-events-none"></div>
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-sm pointer-events-none"></div>
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-sm pointer-events-none"></div>

        {/* Laser Line */}
        <div
          className={`absolute left-4 right-4 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] ${
            isScanning ? 'animate-laser' : 'top-1/2 opacity-70'
          }`}
        ></div>

        {/* Status text */}
        <div className="z-10 text-center px-4">
          <p className="text-xs font-medium text-white/90">
            {isScanning ? t('scanning', lang) : t('viewfinder_hint', lang)}
          </p>
        </div>
      </div>

      {/* Manual Reference Input (Toggled) */}
      {showManualRef ? (
        <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-xl border border-[#e4e1d8] dark:border-[#2b3438] space-y-2">
          <div className="flex gap-2">
            <input
              id={manualRefInputId}
              type="text"
              aria-label={t('reference', lang)}
              placeholder={t('txn_ref_placeholder', lang)}
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              className="flex-1 text-xs font-mono p-2 rounded-lg bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] uppercase"
            />
            <button
              onClick={() => triggerVerification(undefined, manualRef)}
              disabled={isScanning || !manualRef.trim()}
              className="px-3 py-2 bg-[#0f6e4f] text-white rounded-lg text-xs font-bold hover:bg-[#0c573e] disabled:opacity-50 cursor-pointer"
            >
              {t('verify_btn', lang)}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowManualRef(true)}
          className="text-xs text-[#0f6e4f] dark:text-[#3fae86] font-semibold py-1 hover:underline text-center cursor-pointer"
        >
          {t('enter_ref_hand', lang)}
        </button>
      )}

      {/* Main Scan Action Button */}
      <button
        onClick={() => triggerVerification()}
        disabled={isScanning}
        className="w-full py-3.5 px-4 rounded-xl bg-[#0f6e4f] hover:bg-[#0c573e] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        <span>{isScanning ? t('scanning', lang) : t('scan_btn', lang)}</span>
      </button>

      {/* Demo Test Links: "See a failed scan" & sample simulation shortcuts */}
      <div className="flex items-center justify-between text-[11px] text-[#646b67] dark:text-[#9aa29e] pt-1">
        <button
          onClick={() => triggerVerification('delay')}
          className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
        >
          {t('see_failed_scan', lang)} (⏱ Delay)
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setAmountReceived(String(saleAmount - 100));
              triggerVerification();
            }}
            className="hover:underline cursor-pointer"
          >
            ≠ Mismatch
          </button>
          <button
            onClick={() => triggerVerification('duplicate')}
            className="hover:underline cursor-pointer"
          >
            ✕ Duplicate
          </button>
          <button
            onClick={() => {
              setAmountReceived(String(saleAmount + 50));
              triggerVerification();
            }}
            className="hover:underline cursor-pointer text-emerald-600 dark:text-emerald-400 font-semibold"
          >
            +50 Tip
          </button>
        </div>
      </div>

      {/* Footer Strip: "[Waiter] · Today" on left, "N checks · total ETB" on right */}
      <div className="border-t border-[#e4e1d8] dark:border-[#2b3438] pt-3 flex items-center justify-between text-xs text-[#646b67] dark:text-[#9aa29e]">
        <div className="font-medium text-[#1b1f1d] dark:text-[#f1f3f2]">
          <span>{lang === 'am' ? selectedWaiter.nameAm : selectedWaiter.nameEn}</span>
          <span className="mx-1">·</span>
          <span>{t('today', lang)}</span>
        </div>
        <div className="font-semibold tabular-nums">
          {t('today_summary', lang, {
            checks: waiterTodayChecksCount,
            total: formatEtb(waiterTodayTotal),
          })}
        </div>
      </div>
    </div>
  );
};
