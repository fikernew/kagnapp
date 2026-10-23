import React, { useState, useId } from 'react';
import { CashTipItem, Language, PaymentCheck, RefundItem, Waiter } from '../types';
import { WAITERS, BANKS } from '../data/constants';
import { formatEtb, t } from '../i18n/translations';
import { Check, Coins, AlertCircle, Sparkles, Plus, Users, User, ArrowDownCircle } from 'lucide-react';

interface Props {
  lang: Language;
  checks: PaymentCheck[];
  cashTips: CashTipItem[];
  refunds: RefundItem[];
  onAddCashTip: (waiterId: string, amount: number) => void;
  onResolveRefund: (refundId: string) => void;
}

export const TipScreen: React.FC<Props> = ({
  lang,
  checks,
  cashTips,
  refunds,
  onAddCashTip,
  onResolveRefund,
}) => {
  const cashTipInputId = useId();
  const [subTab, setSubTab] = useState<'waiter' | 'admin'>('waiter');
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>(WAITERS[0].id);
  const [cashTipInput, setCashTipInput] = useState<number>(50);
  const [adminPeriod, setAdminPeriod] = useState<'today' | 'month'>('today');
  const [payoutMode, setPayoutMode] = useState<'individual' | 'pool'>('individual');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7);

  // Selected waiter
  const selectedWaiter = WAITERS.find((w) => w.id === selectedWaiterId) || WAITERS[0];

  // Verified checks for this waiter (today vs month)
  const waiterChecksToday = checks.filter(
    (c) =>
      c.waiterId === selectedWaiterId &&
      c.dateStr === todayStr &&
      (c.status === 'verified' || c.status === 'approved')
  );
  const waiterChecksMonth = checks.filter(
    (c) =>
      c.waiterId === selectedWaiterId &&
      c.dateStr.startsWith(currentMonthPrefix) &&
      (c.status === 'verified' || c.status === 'approved')
  );

  // Waiter Tips: Bank tips
  const waiterBankTipsToday = waiterChecksToday.reduce((sum, c) => sum + c.tipAmount, 0);
  const waiterBankTipsMonth = waiterChecksMonth.reduce((sum, c) => sum + c.tipAmount, 0);

  // Waiter Tips: Cash tips
  const waiterCashTipsToday = cashTips
    .filter((ct) => ct.waiterId === selectedWaiterId && ct.dateStr === todayStr)
    .reduce((sum, ct) => sum + ct.amount, 0);
  const waiterCashTipsMonth = cashTips
    .filter((ct) => ct.waiterId === selectedWaiterId && ct.dateStr.startsWith(currentMonthPrefix))
    .reduce((sum, ct) => sum + ct.amount, 0);

  // Total Tips for stats
  const waiterTotalTipsToday = waiterBankTipsToday + waiterCashTipsToday;
  const waiterTotalTipsMonth = waiterBankTipsMonth + waiterCashTipsMonth;

  // Tip rate: tips / sales percentage
  const waiterSalesMonth = waiterChecksMonth.reduce((sum, c) => sum + c.saleAmount, 0);
  const waiterTipRate =
    waiterSalesMonth > 0 ? ((waiterBankTipsMonth / waiterSalesMonth) * 100).toFixed(1) : '0.0';

  // Latest tipped payments (last 5, newest first)
  const tippedPayments = checks
    .filter(
      (c) =>
        c.waiterId === selectedWaiterId &&
        c.tipAmount > 0 &&
        (c.status === 'verified' || c.status === 'approved')
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const handleAddCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashTipInput <= 0) return;
    onAddCashTip(selectedWaiterId, cashTipInput);
    setToastMessage(`✓ Added ${cashTipInput} ETB cash tip`);
    setTimeout(() => setToastMessage(null), 1500);
  };

  // ---------------- ADMIN TAB CALCULATIONS ----------------
  const adminPeriodChecks = checks.filter((c) => {
    const isPeriod = adminPeriod === 'today' ? c.dateStr === todayStr : c.dateStr.startsWith(currentMonthPrefix);
    return isPeriod && (c.status === 'verified' || c.status === 'approved');
  });

  const totalAdminSales = adminPeriodChecks.reduce((sum, c) => sum + c.saleAmount, 0);
  const totalAdminBankTips = adminPeriodChecks.reduce((sum, c) => sum + c.tipAmount, 0);

  // Overall average tip rate
  const overallAvgRate = totalAdminSales > 0 ? (totalAdminBankTips / totalAdminSales) * 100 : 0;

  // By Waiter Table & Flag Rule:
  // "A waiter is flagged if they have at least 3 checks AND their tip % is more than 1.5x the overall average."
  const waiterAdminStats = WAITERS.map((w) => {
    const wChecks = adminPeriodChecks.filter((c) => c.waiterId === w.id);
    const count = wChecks.length;
    const sales = wChecks.reduce((sum, c) => sum + c.saleAmount, 0);
    const tips = wChecks.reduce((sum, c) => sum + c.tipAmount, 0);
    const tipPercent = sales > 0 ? (tips / sales) * 100 : 0;
    const isFlagged = count >= 3 && tipPercent > overallAvgRate * 1.5 && overallAvgRate > 0;
    return {
      waiter: w,
      count,
      sales,
      tips,
      tipPercent,
      isFlagged,
    };
  });

  const flaggedCount = waiterAdminStats.filter((ws) => ws.isFlagged).length;

  // Refunds list
  const activeRefunds = refunds.filter((r) => !r.resolved);

  // Payout calculation: Individual vs Pool (equal 8-way split)
  const poolPerWaiter = totalAdminBankTips / (WAITERS.length || 1);

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#0f6e4f] text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 animate-fade-in">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Title & Waiter/Admin Tabs */}
      <div className="flex items-center justify-between border-b border-[#e4e1d8] dark:border-[#2b3438] pb-3">
        <h1 className="text-xl font-bold tracking-tight text-[#1b1f1d] dark:text-[#f1f3f2]">
          {t('tab_tip', lang)}
        </h1>

        {/* Waiter vs Admin Sub-tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438]">
          <button
            onClick={() => setSubTab('waiter')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'waiter'
                ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                : 'text-[#646b67] dark:text-[#9aa29e]'
            }`}
          >
            {t('tab_waiter_view', lang)}
          </button>
          <button
            onClick={() => setSubTab('admin')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'admin'
                ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                : 'text-[#646b67] dark:text-[#9aa29e]'
            }`}
          >
            {t('tab_admin_view', lang)}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: WAITER VIEW */}
      {subTab === 'waiter' && (
        <div className="space-y-4">
          {/* Pick Waiter (4x2 Grid) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#646b67] dark:text-[#9aa29e]">
              {t('served_by', lang)}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {WAITERS.map((w) => {
                const isSelected = w.id === selectedWaiterId;
                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWaiterId(w.id)}
                    className={`py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0f6e4f] text-white shadow-xs'
                        : 'bg-[#f5f3ee] dark:bg-[#14181a] text-[#1b1f1d] dark:text-[#f1f3f2] border border-[#e4e1d8] dark:border-[#2b3438]'
                    }`}
                  >
                    {lang === 'am' ? w.nameAm : w.nameEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Three Stat Tiles (Today, Month, Tip Rate) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438]">
              <span className="text-[11px] font-semibold text-[#646b67] dark:text-[#9aa29e] block">
                {t('stat_today_tips', lang)}
              </span>
              <span className="text-base font-extrabold text-[#0f6e4f] dark:text-[#3fae86] tabular-nums mt-0.5 block">
                {formatEtb(waiterTotalTipsToday)} ETB
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438]">
              <span className="text-[11px] font-semibold text-[#646b67] dark:text-[#9aa29e] block">
                {t('stat_month_tips', lang)}
              </span>
              <span className="text-base font-extrabold text-[#1b1f1d] dark:text-[#f1f3f2] tabular-nums mt-0.5 block">
                {formatEtb(waiterTotalTipsMonth)} ETB
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438]">
              <span className="text-[11px] font-semibold text-[#646b67] dark:text-[#9aa29e] block">
                {t('stat_tip_rate', lang)}
              </span>
              <span className="text-base font-extrabold text-[#8a5a00] dark:text-amber-400 tabular-nums mt-0.5 block">
                {waiterTipRate}%
              </span>
            </div>
          </div>

          {/* Card with Two Lines: Bank (Verified) & Cash (Self-reported, unverified) */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#e4e1d8] dark:border-[#2b3438]">
                <span className="text-[#646b67] dark:text-[#9aa29e] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  {t('by_bank_verified', lang)}
                </span>
                <span className="font-bold text-[#1b1f1d] dark:text-[#f1f3f2] tabular-nums">
                  {formatEtb(waiterBankTipsMonth, true)} ETB
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#646b67] dark:text-[#9aa29e] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  {t('cash_unverified', lang)}
                </span>
                <span className="font-bold text-[#8a5a00] dark:text-amber-400 tabular-nums">
                  {formatEtb(waiterCashTipsMonth, true)} ETB
                </span>
              </div>
            </div>

            {/* Input + Add Cash Tip Button (default 50) */}
            <form onSubmit={handleAddCash} className="flex gap-2 pt-1">
              <input
                id={cashTipInputId}
                type="number"
                aria-label={t('cash_unverified', lang)}
                value={cashTipInput}
                onChange={(e) => setCashTipInput(parseFloat(e.target.value) || 0)}
                className="w-24 p-2 rounded-lg bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438] text-xs font-bold tabular-nums text-center"
              />
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-lg bg-[#0f6e4f] text-white text-xs font-bold hover:bg-[#0c573e] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add_cash_tip_btn', lang)}</span>
              </button>
            </form>
          </div>

          {/* Latest Tipped Payments (Last 5, newest first) */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
              {t('latest_tipped_payments', lang)} (5)
            </label>
            <div className="space-y-1.5">
              {tippedPayments.map((chk) => {
                const bank = BANKS.find((b) => b.id === chk.bankId);
                const parts = chk.dateStr.split('-');
                const dayMonth = `${parseInt(parts[2], 10)} / ${parseInt(parts[1], 10)}`;
                return (
                  <div
                    key={chk.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2] tabular-nums">
                        {formatEtb(chk.saleAmount)} + {formatEtb(chk.tipAmount)} ETB
                      </div>
                      <div className="text-[11px] text-[#646b67] dark:text-[#9aa29e] mt-0.5">
                        <span>{dayMonth}</span>
                        <span className="mx-1">·</span>
                        <span>{chk.timeStr}</span>
                        <span className="mx-1">·</span>
                        <span>{lang === 'am' ? bank?.nameAm : bank?.nameEn}</span>
                      </div>
                    </div>
                    {/* Tip pill */}
                    <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold tabular-nums">
                      Tip {formatEtb(chk.tipAmount)}
                    </div>
                  </div>
                );
              })}
              {tippedPayments.length === 0 && (
                <div className="text-center py-4 text-xs text-[#646b67] dark:text-[#9aa29e] italic">
                  {t('nothing_here', lang)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ADMIN VIEW */}
      {subTab === 'admin' && (
        <div className="space-y-4">
          {/* Today / Month Toggle */}
          <div className="flex justify-end">
            <div className="flex items-center p-0.5 rounded-lg bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438]">
              <button
                onClick={() => setAdminPeriod('today')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  adminPeriod === 'today'
                    ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                    : 'text-[#646b67] dark:text-[#9aa29e]'
                }`}
              >
                {t('today', lang)}
              </button>
              <button
                onClick={() => setAdminPeriod('month')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  adminPeriod === 'month'
                    ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                    : 'text-[#646b67] dark:text-[#9aa29e]'
                }`}
              >
                {t('month_to_date', lang)}
              </button>
            </div>
          </div>

          {/* Three Tiles: Total Tips, Average Rate, Check (flagged waiters count) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438]">
              <span className="text-[11px] font-semibold text-[#646b67] dark:text-[#9aa29e] block">
                {t('total_tips', lang)}
              </span>
              <span className="text-base font-extrabold text-[#0f6e4f] dark:text-[#3fae86] tabular-nums mt-0.5 block">
                {formatEtb(totalAdminBankTips)} ETB
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438]">
              <span className="text-[11px] font-semibold text-[#646b67] dark:text-[#9aa29e] block">
                {t('average_rate', lang)}
              </span>
              <span className="text-base font-extrabold text-[#1b1f1d] dark:text-[#f1f3f2] tabular-nums mt-0.5 block">
                {overallAvgRate.toFixed(1)}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438]">
              <span className="text-[11px] font-semibold text-[#646b67] dark:text-[#9aa29e] block">
                {t('check_tile', lang)}
              </span>
              <span
                className={`text-base font-extrabold tabular-nums mt-0.5 block ${
                  flaggedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                }`}
              >
                {flaggedCount}
              </span>
            </div>
          </div>

          {/* By Waiter Table */}
          <div className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#f5f3ee] dark:bg-[#14181a] border-b border-[#e4e1d8] dark:border-[#2b3438] text-[11px] text-[#646b67] dark:text-[#9aa29e]">
                <tr>
                  <th className="p-2.5 font-semibold">{t('waiter', lang)}</th>
                  <th className="p-2.5 text-right font-semibold">{t('sale_col', lang)}</th>
                  <th className="p-2.5 text-right font-semibold">{t('tip_col', lang)}</th>
                  <th className="p-2.5 text-center font-semibold">{t('tip_percent', lang)}</th>
                  <th className="p-2.5 text-center font-semibold">{t('status_col', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e1d8] dark:divide-[#2b3438]">
                {waiterAdminStats.map((row) => (
                  <tr key={row.waiter.id} className="hover:bg-[#fcfbf9] dark:hover:bg-[#181d1f]">
                    <td className="p-2.5 font-bold">
                      {lang === 'am' ? row.waiter.nameAm : row.waiter.nameEn}
                    </td>
                    <td className="p-2.5 text-right tabular-nums">{formatEtb(row.sales)}</td>
                    <td className="p-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatEtb(row.tips)}
                    </td>
                    <td className="p-2.5 text-center tabular-nums font-semibold">
                      {row.tipPercent.toFixed(1)}%
                    </td>
                    <td className="p-2.5 text-center">
                      {row.isFlagged ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                          {t('status_check_flag', lang)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t('status_normal', lang)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* To Refund (Marked as Mistakes) */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] space-y-2">
            <h3 className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>{t('to_refund', lang)}</span>
            </h3>

            {activeRefunds.length === 0 ? (
              <p className="text-xs text-[#646b67] dark:text-[#9aa29e] italic py-1">
                {t('nothing_here', lang)}
              </p>
            ) : (
              <div className="space-y-1.5">
                {activeRefunds.map((ref) => {
                  const waiter = WAITERS.find((w) => w.id === ref.waiterId);
                  return (
                    <div
                      key={ref.id}
                      className="p-2 rounded-lg bg-[#fce8e6] dark:bg-[#3d1c1a] border border-red-200 dark:border-red-900 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-red-900 dark:text-red-200">
                          {lang === 'am' ? waiter?.nameAm : waiter?.nameEn}
                        </span>
                        <span className="mx-1 text-red-700 dark:text-red-300">·</span>
                        <span className="font-extrabold text-red-800 dark:text-red-200 tabular-nums">
                          {formatEtb(ref.amount, true)} ETB
                        </span>
                        <div className="text-[10px] text-red-700 dark:text-red-300 font-mono mt-0.5">
                          Ref: {ref.reference}
                        </div>
                      </div>
                      <button
                        onClick={() => onResolveRefund(ref.id)}
                        className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        Refunded
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tip Payout: Individual / Pool (equal) Toggle & Table */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
                {t('tip_payout', lang)}
              </h3>
              <div className="flex items-center p-0.5 rounded-lg bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438]">
                <button
                  onClick={() => setPayoutMode('individual')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    payoutMode === 'individual'
                      ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                      : 'text-[#646b67] dark:text-[#9aa29e]'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{t('individual_payout', lang)}</span>
                </button>
                <button
                  onClick={() => setPayoutMode('pool')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    payoutMode === 'pool'
                      ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                      : 'text-[#646b67] dark:text-[#9aa29e]'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>{t('pool_payout', lang)}</span>
                </button>
              </div>
            </div>

            {/* Payout Table */}
            <div className="border border-[#e4e1d8] dark:border-[#2b3438] rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#f5f3ee] dark:bg-[#14181a] border-b border-[#e4e1d8] dark:border-[#2b3438] text-[11px] text-[#646b67] dark:text-[#9aa29e]">
                  <tr>
                    <th className="p-2 font-semibold">{t('waiter', lang)}</th>
                    <th className="p-2 text-right font-semibold">{t('payout_col', lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e1d8] dark:divide-[#2b3438]">
                  {waiterAdminStats.map((row) => {
                    const payout = payoutMode === 'individual' ? row.tips : poolPerWaiter;
                    return (
                      <tr key={row.waiter.id} className="hover:bg-[#fcfbf9] dark:hover:bg-[#181d1f]">
                        <td className="p-2 font-medium">
                          {lang === 'am' ? row.waiter.nameAm : row.waiter.nameEn}
                        </td>
                        <td className="p-2 text-right font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {formatEtb(payout, true)} ETB
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="bg-[#f5f3ee]/60 dark:bg-[#14181a]/60 font-bold border-t border-[#e4e1d8] dark:border-[#2b3438]">
                    <td className="p-2">{t('total_row', lang)}</td>
                    <td className="p-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatEtb(totalAdminBankTips, true)} ETB
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rule Note Footnote */}
          <p className="text-[11px] text-[#646b67] dark:text-[#9aa29e] leading-relaxed italic border-t border-[#e4e1d8] dark:border-[#2b3438] pt-2">
            {t('tip_rule_footnote', lang)}
          </p>
        </div>
      )}
    </div>
  );
};
