import React, { useState } from 'react';
import { Language, PaymentCheck, PaymentStatus, Waiter } from '../types';
import { WAITERS, BANKS } from '../data/constants';
import { formatEtb, t } from '../i18n/translations';

interface Props {
  lang: Language;
  checks: PaymentCheck[];
}

export const AdminPhoneScreen: React.FC<Props> = ({ lang, checks }) => {
  const [period, setPeriod] = useState<'today' | 'month'>('today');
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>(WAITERS[0].id);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

  // Filter checks by period: today vs month to date
  const periodChecks = checks.filter((c) => {
    if (period === 'today') {
      return c.dateStr === todayStr;
    }
    return c.dateStr.startsWith(currentMonthPrefix);
  });

  // Rule 1: Only verified and approved payments count toward totals. Failed checks are excluded.
  const validChecks = periodChecks.filter((c) => c.status === 'verified' || c.status === 'approved');
  const totalVerifiedCount = validChecks.length;
  const totalSalesAmount = validChecks.reduce((sum, c) => sum + c.saleAmount, 0);

  // Bank stats for top 3 banks (Telebirr, CBE, Awash)
  const topBankIds = ['telebirr', 'cbe', 'awash'];
  const bankStats = topBankIds.map((bankId) => {
    const bankObj = BANKS.find((b) => b.id === bankId)!;
    const bChecks = validChecks.filter((c) => c.bankId === bankId);
    const count = bChecks.length;
    const amount = bChecks.reduce((sum, c) => sum + c.saleAmount, 0);
    return {
      bank: bankObj,
      count,
      amount,
    };
  });

  // Waiter selector & bank breakdown
  const selectedWaiter = WAITERS.find((w) => w.id === selectedWaiterId) || WAITERS[0];
  const waiterChecks = validChecks.filter((c) => c.waiterId === selectedWaiterId);

  const waiterBankBreakdown = topBankIds.map((bankId) => {
    const bankObj = BANKS.find((b) => b.id === bankId)!;
    const wbChecks = waiterChecks.filter((c) => c.bankId === bankId);
    const count = wbChecks.length;
    const sale = wbChecks.reduce((sum, c) => sum + c.saleAmount, 0);
    const tip = wbChecks.reduce((sum, c) => sum + c.tipAmount, 0);
    return {
      bank: bankObj,
      count,
      sale,
      tip,
    };
  });

  const waiterTotalSale = waiterChecks.reduce((sum, c) => sum + c.saleAmount, 0);
  const waiterTotalTip = waiterChecks.reduce((sum, c) => sum + c.tipAmount, 0);
  const waiterTotalCount = waiterChecks.length;

  // Recent checks (latest 4)
  const recentChecks = [...periodChecks]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const renderStatusPill = (status: PaymentStatus) => {
    if (status === 'verified') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          {t('status_verified', lang)}
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
          {t('status_approved', lang)}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
        {t('status_failed', lang)}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Header & Sample Data Tag */}
      <div className="flex items-center justify-between border-b border-[#e4e1d8] dark:border-[#2b3438] pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-[#1b1f1d] dark:text-[#f1f3f2]">
            {t('tab_admin_phone', lang)}
          </h1>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {t('sample_data', lang)}
          </span>
        </div>

        {/* Today / Month to date toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438]">
          <button
            onClick={() => setPeriod('today')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              period === 'today'
                ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                : 'text-[#646b67] dark:text-[#9aa29e]'
            }`}
          >
            {t('today', lang)}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              period === 'month'
                ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                : 'text-[#646b67] dark:text-[#9aa29e]'
            }`}
          >
            {t('month_to_date', lang)}
          </button>
        </div>
      </div>

      {/* Hero Card (Green) */}
      <div className="bg-[#0f6e4f] text-white rounded-2xl p-4 shadow-md space-y-1">
        <p className="text-xs text-white/80 font-medium">
          {t('total_period', lang, {
            period: period === 'today' ? t('today', lang) : t('month_to_date', lang),
          })}
        </p>
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
          {formatEtb(totalSalesAmount, true)}{' '}
          <span className="text-xl font-normal">ETB</span>
        </div>
        <p className="text-xs text-emerald-100 pt-1">
          {t('n_verified_checks', lang, { count: totalVerifiedCount })}
        </p>
      </div>

      {/* Three Bank Tiles (Telebirr, CBE, Awash) */}
      <div className="grid grid-cols-3 gap-2">
        {bankStats.map((item) => (
          <div
            key={item.bank.id}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] space-y-1"
          >
            <div className="text-[11px] font-bold text-[#646b67] dark:text-[#9aa29e] truncate">
              {lang === 'am' ? item.bank.nameAm : item.bank.nameEn}
            </div>
            <div className="text-sm font-bold text-[#1b1f1d] dark:text-[#f1f3f2] tabular-nums">
              {formatEtb(item.amount)}
            </div>
            <div className="text-[10px] text-[#646b67] dark:text-[#9aa29e]">
              {item.count} ×
            </div>
          </div>
        ))}
      </div>

      {/* By Waiter: 4x2 selector + Bank breakdown table */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
          {t('by_waiter', lang)}
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {WAITERS.map((waiter) => {
            const isSelected = waiter.id === selectedWaiterId;
            return (
              <button
                key={waiter.id}
                onClick={() => setSelectedWaiterId(waiter.id)}
                className={`py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f6e4f] text-white shadow-xs'
                    : 'bg-[#f5f3ee] dark:bg-[#14181a] text-[#1b1f1d] dark:text-[#f1f3f2] border border-[#e4e1d8] dark:border-[#2b3438]'
                }`}
              >
                {lang === 'am' ? waiter.nameAm : waiter.nameEn}
              </button>
            );
          })}
        </div>

        {/* Bank Breakdown Table for Selected Waiter */}
        <div className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#f5f3ee] dark:bg-[#14181a] border-b border-[#e4e1d8] dark:border-[#2b3438] text-[11px] text-[#646b67] dark:text-[#9aa29e]">
              <tr>
                <th className="p-2 font-semibold">{t('bank', lang)}</th>
                <th className="p-2 text-center font-semibold">{t('count_col', lang)}</th>
                <th className="p-2 text-right font-semibold">{t('sale_col', lang)}</th>
                <th className="p-2 text-right font-semibold">{t('tip_col', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e1d8] dark:divide-[#2b3438]">
              {waiterBankBreakdown.map((row) => (
                <tr key={row.bank.id} className="hover:bg-[#fcfbf9] dark:hover:bg-[#181d1f]">
                  <td className="p-2 font-medium truncate max-w-[90px]">
                    {lang === 'am' ? row.bank.nameAm : row.bank.nameEn}
                  </td>
                  <td className="p-2 text-center tabular-nums">{row.count}</td>
                  <td className="p-2 text-right tabular-nums">{formatEtb(row.sale, true)}</td>
                  <td className="p-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatEtb(row.tip, true)}
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-[#f5f3ee]/60 dark:bg-[#14181a]/60 font-bold border-t border-[#e4e1d8] dark:border-[#2b3438]">
                <td className="p-2">{t('total_row', lang)}</td>
                <td className="p-2 text-center tabular-nums">{waiterTotalCount}</td>
                <td className="p-2 text-right tabular-nums">{formatEtb(waiterTotalSale, true)}</td>
                <td className="p-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatEtb(waiterTotalTip, true)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Checks (Latest 4) */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
          {t('recent_checks', lang)}
        </label>
        <div className="space-y-2">
          {recentChecks.map((chk) => {
            const waiter = WAITERS.find((w) => w.id === chk.waiterId);
            const bank = BANKS.find((b) => b.id === chk.bankId);
            return (
              <div
                key={chk.id}
                className="p-2.5 rounded-xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
                    <span>{lang === 'am' ? waiter?.nameAm : waiter?.nameEn}</span>
                    <span className="mx-1">·</span>
                    <span className="tabular-nums">{formatEtb(chk.saleAmount, true)} ETB</span>
                  </div>
                  <div className="text-[11px] text-[#646b67] dark:text-[#9aa29e] mt-0.5">
                    <span>{chk.timeStr}</span>
                    <span className="mx-1">·</span>
                    <span>{lang === 'am' ? bank?.nameAm : bank?.nameEn}</span>
                    <span className="mx-1">·</span>
                    <span className="font-mono">{chk.reference}</span>
                  </div>
                </div>
                <div>{renderStatusPill(chk.status)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
