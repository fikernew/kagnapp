import React, { useState } from 'react';
import { Language, ParsedSms, PaymentCheck, PaymentStatus, Waiter } from '../types';
import { WAITERS, BANKS } from '../data/constants';
import { formatEtb, t } from '../i18n/translations';
import { AlertCircle, CheckCircle2, FileQuestion, Filter, ShieldCheck } from 'lucide-react';

interface Props {
  lang: Language;
  checks: PaymentCheck[];
  smsList: ParsedSms[];
  onApproveCheck?: (checkId: string) => void;
}

export const AdminWebScreen: React.FC<Props> = ({
  lang,
  checks,
  smsList,
  onApproveCheck,
}) => {
  const [period, setPeriod] = useState<'today' | 'month'>('today');
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | 'all'>('all');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7);

  // Period checks
  const periodChecks = checks.filter((c) => {
    if (period === 'today') {
      return c.dateStr === todayStr;
    }
    return c.dateStr.startsWith(currentMonthPrefix);
  });

  // Valid checks (verified or supervisor approved)
  const validChecks = periodChecks.filter((c) => c.status === 'verified' || c.status === 'approved');
  const totalAmount = validChecks.reduce((sum, c) => sum + c.saleAmount, 0);
  const totalVerifiedCount = validChecks.length;

  // Review card counts
  const failedCount = periodChecks.filter((c) => c.status === 'failed').length;
  const approvedCount = periodChecks.filter((c) => c.status === 'approved').length;
  const unparsedCount = smsList.filter((s) => s.isHolding).length;

  // By Bank stats with progress bars
  const activeBankIds = ['telebirr', 'cbe', 'awash'];
  const bankStats = activeBankIds.map((bankId) => {
    const bankObj = BANKS.find((b) => b.id === bankId)!;
    const bChecks = validChecks.filter((c) => c.bankId === bankId);
    const amount = bChecks.reduce((sum, c) => sum + c.saleAmount, 0);
    const count = bChecks.length;
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    return {
      bank: bankObj,
      count,
      amount,
      percentage,
    };
  });

  // Waiter calculations for left list
  const waiterStats = WAITERS.map((w) => {
    const wChecks = validChecks.filter((c) => c.waiterId === w.id);
    const count = wChecks.length;
    const amount = wChecks.reduce((sum, c) => sum + c.saleAmount, 0);
    return {
      waiter: w,
      count,
      amount,
    };
  });

  const maxWaiterAmount = Math.max(1, ...waiterStats.map((ws) => ws.amount));

  // Filtered checks for selected waiter (or all)
  const filteredValidChecks =
    selectedWaiterId === 'all'
      ? validChecks
      : validChecks.filter((c) => c.waiterId === selectedWaiterId);

  // Bank breakdown table for right side
  const breakdownRows = activeBankIds.map((bankId) => {
    const bankObj = BANKS.find((b) => b.id === bankId)!;
    const bChecks = filteredValidChecks.filter((c) => c.bankId === bankId);
    const count = bChecks.length;
    const sale = bChecks.reduce((sum, c) => sum + c.saleAmount, 0);
    const tip = bChecks.reduce((sum, c) => sum + c.tipAmount, 0);
    return {
      bank: bankObj,
      count,
      sale,
      tip,
    };
  });

  const breakdownTotalCount = filteredValidChecks.length;
  const breakdownTotalSale = filteredValidChecks.reduce((sum, c) => sum + c.saleAmount, 0);
  const breakdownTotalTip = filteredValidChecks.reduce((sum, c) => sum + c.tipAmount, 0);

  // Recent checks (latest 10)
  const recentTableChecks = [...periodChecks]
    .filter((c) => (selectedWaiterId === 'all' ? true : c.waiterId === selectedWaiterId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  // Month view: Daily account table
  // Group checks by date
  const dailyGroups: Record<string, PaymentCheck[]> = {};
  if (period === 'month') {
    periodChecks.forEach((c) => {
      if (!dailyGroups[c.dateStr]) {
        dailyGroups[c.dateStr] = [];
      }
      dailyGroups[c.dateStr].push(c);
    });
  }

  const sortedDates = Object.keys(dailyGroups).sort((a, b) => b.localeCompare(a));
  const dailyRows = sortedDates.map((dateStr) => {
    const dayChecks = dailyGroups[dateStr].filter((c) => c.status === 'verified' || c.status === 'approved');
    const parts = dateStr.split('-');
    const dayNum = parseInt(parts[2], 10);
    const monthNum = parseInt(parts[1], 10);
    const formattedDate = `${dayNum} / ${monthNum}`;
    const count = dayChecks.length;
    const sale = dayChecks.reduce((sum, c) => sum + c.saleAmount, 0);
    const tip = dayChecks.reduce((sum, c) => sum + c.tipAmount, 0);
    return {
      dateStr,
      formattedDate,
      count,
      sale,
      tip,
    };
  });

  const dailyTotalCount = dailyRows.reduce((sum, r) => sum + r.count, 0);
  const dailyTotalSale = dailyRows.reduce((sum, r) => sum + r.sale, 0);
  const dailyTotalTip = dailyRows.reduce((sum, r) => sum + r.tip, 0);

  const renderStatusPill = (status: PaymentStatus) => {
    if (status === 'verified') {
      return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          {t('status_verified', lang)}
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
          {t('status_approved', lang)}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
        {t('status_failed', lang)}
      </span>
    );
  };

  return (
    <div className="w-full max-w-[1180px] mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Sample Data Tag & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e4e1d8] dark:border-[#2b3438] pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1b1f1d] dark:text-[#f1f3f2]">
            {t('tab_admin_web', lang)}
          </h1>
          <span className="text-xs uppercase font-semibold px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {t('sample_data', lang)}
          </span>
        </div>

        {/* Today / Month to date toggle */}
        <div className="flex items-center p-1 rounded-xl bg-[#f5f3ee] dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438]">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              period === 'today'
                ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                : 'text-[#646b67] dark:text-[#9aa29e]'
            }`}
          >
            {t('today', lang)}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              period === 'month'
                ? 'bg-white dark:bg-[#1d2326] text-[#0f6e4f] shadow-xs'
                : 'text-[#646b67] dark:text-[#9aa29e]'
            }`}
          >
            {t('month_to_date', lang)}
          </button>
        </div>
      </div>

      {/* Top Row: 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Hero Total */}
        <div className="p-5 rounded-2xl bg-[#0f6e4f] text-white shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs text-white/80 font-medium">
              {t('total_period', lang, {
                period: period === 'today' ? t('today', lang) : t('month_to_date', lang),
              })}
            </p>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight tabular-nums mt-1">
              {formatEtb(totalAmount, true)} <span className="text-xl font-normal">ETB</span>
            </h2>
          </div>
          <p className="text-xs text-emerald-100 font-medium">
            {t('n_verified_checks', lang, { count: totalVerifiedCount })}
          </p>
        </div>

        {/* Card 2: By Bank */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] shadow-xs space-y-3">
          <p className="text-xs font-bold text-[#646b67] dark:text-[#9aa29e] uppercase tracking-wider">
            {t('by_bank', lang)}
          </p>
          <div className="space-y-2.5">
            {bankStats.map((item) => (
              <div key={item.bank.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1b1f1d] dark:text-[#f1f3f2]">
                    {lang === 'am' ? item.bank.nameAm : item.bank.nameEn}
                  </span>
                  <span className="tabular-nums font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
                    {formatEtb(item.amount)} ETB{' '}
                    <span className="text-[11px] font-normal text-[#646b67] dark:text-[#9aa29e]">
                      ({item.count}×)
                    </span>
                  </span>
                </div>
                {/* Proportional Progress Bar */}
                <div className="w-full h-2 bg-[#f5f3ee] dark:bg-[#14181a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0f6e4f] dark:bg-[#3fae86] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(4, Math.min(100, item.percentage))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Review Card (Failed, Approved, Unparsed) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] shadow-xs space-y-3">
          <p className="text-xs font-bold text-[#646b67] dark:text-[#9aa29e] uppercase tracking-wider">
            {t('review_card', lang)}
          </p>
          <div className="divide-y divide-[#e4e1d8] dark:divide-[#2b3438] text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-[#646b67] dark:text-[#9aa29e]">{t('failed_scans', lang)}</span>
              <span className="font-bold tabular-nums text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                {failedCount}
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-[#646b67] dark:text-[#9aa29e]">
                {t('approved_by_supervisor', lang)}
              </span>
              <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                {approvedCount}
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-[#646b67] dark:text-[#9aa29e]">{t('unparsed_sms', lang)}</span>
              <span className="font-bold tabular-nums text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {unparsedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Left 300px, Right remaining (stacks under 900px) */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* Left Column: By Waiter List */}
        <div className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#646b67] dark:text-[#9aa29e]">
              {t('by_waiter', lang)}
            </h2>
            <span className="text-[11px] text-[#646b67] dark:text-[#9aa29e]">8 {t('waiter', lang)}</span>
          </div>

          <div className="space-y-1">
            {/* All Waiters Row */}
            <div
              onClick={() => setSelectedWaiterId('all')}
              className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                selectedWaiterId === 'all'
                  ? 'bg-[#0f6e4f] text-white border-[#0f6e4f] shadow-xs'
                  : 'bg-[#f5f3ee] dark:bg-[#14181a] border-[#e4e1d8] dark:border-[#2b3438] hover:bg-[#eae7df] dark:hover:bg-[#1a2022]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{t('all_waiters', lang)}</span>
                <span className="tabular-nums">{formatEtb(totalAmount)} ETB</span>
              </div>
              <div
                className={`text-[11px] mt-0.5 ${
                  selectedWaiterId === 'all' ? 'text-emerald-100' : 'text-[#646b67] dark:text-[#9aa29e]'
                }`}
              >
                {totalVerifiedCount} checks
              </div>
            </div>

            {/* Individual Waiters with Scaled Bar */}
            {waiterStats.map((item) => {
              const isSelected = selectedWaiterId === item.waiter.id;
              const barPercent = (item.amount / maxWaiterAmount) * 100;
              return (
                <div
                  key={item.waiter.id}
                  onClick={() => setSelectedWaiterId(item.waiter.id)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#0f6e4f] text-white border-[#0f6e4f] shadow-xs'
                      : 'bg-white dark:bg-[#1d2326] border-[#e4e1d8] dark:border-[#2b3438] hover:bg-[#f9f8f5] dark:hover:bg-[#171b1d]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{lang === 'am' ? item.waiter.nameAm : item.waiter.nameEn}</span>
                    <span className="tabular-nums">{formatEtb(item.amount)} ETB</span>
                  </div>
                  <div
                    className={`flex items-center justify-between text-[11px] mt-0.5 ${
                      isSelected ? 'text-emerald-100' : 'text-[#646b67] dark:text-[#9aa29e]'
                    }`}
                  >
                    <span>{item.count} checks</span>
                    <span className="tabular-nums">{Math.round(barPercent)}%</span>
                  </div>
                  {/* Scaled bar */}
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#0f6e4f] dark:bg-[#3fae86]'
                      }`}
                      style={{ width: `${Math.max(4, barPercent)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tables */}
        <div className="space-y-6">
          {/* Table 1: Bank Breakdown for selected waiter (or all) */}
          <div className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#e4e1d8] dark:border-[#2b3438] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
                {t('by_bank', lang)} ·{' '}
                {selectedWaiterId === 'all'
                  ? t('all_waiters', lang)
                  : lang === 'am'
                  ? WAITERS.find((w) => w.id === selectedWaiterId)?.nameAm
                  : WAITERS.find((w) => w.id === selectedWaiterId)?.nameEn}
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f3ee] dark:bg-[#14181a] border-b border-[#e4e1d8] dark:border-[#2b3438] text-[11px] text-[#646b67] dark:text-[#9aa29e]">
                <tr>
                  <th className="p-3 font-semibold">{t('bank', lang)}</th>
                  <th className="p-3 text-center font-semibold">{t('count_col', lang)}</th>
                  <th className="p-3 text-right font-semibold">{t('sale_col', lang)}</th>
                  <th className="p-3 text-right font-semibold">{t('tip_col', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e1d8] dark:divide-[#2b3438]">
                {breakdownRows.map((row) => (
                  <tr key={row.bank.id} className="hover:bg-[#fcfbf9] dark:hover:bg-[#181d1f]">
                    <td className="p-3 font-medium">
                      {lang === 'am' ? row.bank.nameAm : row.bank.nameEn}
                    </td>
                    <td className="p-3 text-center tabular-nums">{row.count}</td>
                    <td className="p-3 text-right tabular-nums">{formatEtb(row.sale, true)}</td>
                    <td className="p-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatEtb(row.tip, true)}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-[#f5f3ee]/60 dark:bg-[#14181a]/60 font-bold border-t border-[#e4e1d8] dark:border-[#2b3438]">
                  <td className="p-3">{t('total_row', lang)}</td>
                  <td className="p-3 text-center tabular-nums">{breakdownTotalCount}</td>
                  <td className="p-3 text-right tabular-nums">{formatEtb(breakdownTotalSale, true)}</td>
                  <td className="p-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatEtb(breakdownTotalTip, true)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2: Recent Checks (Latest 10 with columns: Time, Waiter, Bank, Reference, Sale (X.00), Status) */}
          <div className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#e4e1d8] dark:border-[#2b3438] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
                {t('recent_checks', lang)} (10)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#f5f3ee] dark:bg-[#14181a] border-b border-[#e4e1d8] dark:border-[#2b3438] text-[11px] text-[#646b67] dark:text-[#9aa29e]">
                  <tr>
                    <th className="p-3 font-semibold">{t('time_col', lang)}</th>
                    <th className="p-3 font-semibold">{t('waiter', lang)}</th>
                    <th className="p-3 font-semibold">{t('bank', lang)}</th>
                    <th className="p-3 font-semibold">{t('reference', lang)}</th>
                    <th className="p-3 text-right font-semibold">{t('sale_col', lang)}</th>
                    <th className="p-3 text-center font-semibold">{t('status_col', lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e1d8] dark:divide-[#2b3438]">
                  {recentTableChecks.map((chk) => {
                    const waiter = WAITERS.find((w) => w.id === chk.waiterId);
                    const bank = BANKS.find((b) => b.id === chk.bankId);
                    return (
                      <tr key={chk.id} className="hover:bg-[#fcfbf9] dark:hover:bg-[#181d1f]">
                        <td className="p-3 tabular-nums text-[#646b67] dark:text-[#9aa29e]">
                          {chk.timeStr}
                        </td>
                        <td className="p-3 font-medium">
                          {lang === 'am' ? waiter?.nameAm : waiter?.nameEn}
                        </td>
                        <td className="p-3 text-[#646b67] dark:text-[#9aa29e]">
                          {lang === 'am' ? bank?.nameAm : bank?.nameEn}
                        </td>
                        <td className="p-3 font-mono font-medium">{chk.reference}</td>
                        <td className="p-3 text-right tabular-nums font-bold">
                          {formatEtb(chk.saleAmount, true)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {renderStatusPill(chk.status)}
                            {chk.status === 'failed' && onApproveCheck && (
                              <button
                                onClick={() => onApproveCheck(chk.id)}
                                className="px-2 py-0.5 text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold rounded cursor-pointer"
                                title="Approve as supervisor"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Daily account (month to date) table - Shown in MONTH view only! */}
          {period === 'month' && (
            <div className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#e4e1d8] dark:border-[#2b3438]">
                <h3 className="text-sm font-bold text-[#1b1f1d] dark:text-[#f1f3f2]">
                  {t('daily_account', lang)}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f5f3ee] dark:bg-[#14181a] border-b border-[#e4e1d8] dark:border-[#2b3438] text-[11px] text-[#646b67] dark:text-[#9aa29e]">
                    <tr>
                      <th className="p-3 font-semibold">{t('date_col', lang)} (D / M)</th>
                      <th className="p-3 text-center font-semibold">{t('count_col', lang)}</th>
                      <th className="p-3 text-right font-semibold">{t('sale_col', lang)}</th>
                      <th className="p-3 text-right font-semibold">{t('tip_col', lang)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e1d8] dark:divide-[#2b3438]">
                    {dailyRows.map((dRow) => (
                      <tr key={dRow.dateStr} className="hover:bg-[#fcfbf9] dark:hover:bg-[#181d1f]">
                        <td className="p-3 font-medium tabular-nums">{dRow.formattedDate}</td>
                        <td className="p-3 text-center tabular-nums">{dRow.count}</td>
                        <td className="p-3 text-right tabular-nums">{formatEtb(dRow.sale, true)}</td>
                        <td className="p-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatEtb(dRow.tip, true)}
                        </td>
                      </tr>
                    ))}
                    {/* Final Total row */}
                    <tr className="bg-[#f5f3ee]/60 dark:bg-[#14181a]/60 font-bold border-t border-[#e4e1d8] dark:border-[#2b3438]">
                      <td className="p-3">{t('total_row', lang)}</td>
                      <td className="p-3 text-center tabular-nums">{dailyTotalCount}</td>
                      <td className="p-3 text-right tabular-nums">{formatEtb(dailyTotalSale, true)}</td>
                      <td className="p-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatEtb(dailyTotalTip, true)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
