import React, { useState, useEffect } from 'react';
import {
  AdminSettings,
  CashTipItem,
  Language,
  ParsedSms,
  PaymentCheck,
  PhoneStatus,
  RefundItem,
  ScreenTab,
} from './types';
import { generateSeedData } from './services/seedData';
import { TopBar } from './components/TopBar';
import { PhoneFrame } from './components/PhoneFrame';
import { ScanScreen } from './components/ScanScreen';
import { SmsPhoneScreen } from './components/SmsPhoneScreen';
import { AdminPhoneScreen } from './components/AdminPhoneScreen';
import { AdminWebScreen } from './components/AdminWebScreen';
import { TipScreen } from './components/TipScreen';
import { ArchitectureDoc } from './components/ArchitectureDoc';

export default function App() {
  // Initialize state with seed data
  const [data, setData] = useState(() => generateSeedData());
  const [checks, setChecks] = useState<PaymentCheck[]>(data.checks);
  const [smsList, setSmsList] = useState<ParsedSms[]>(data.smsList);
  const [refunds, setRefunds] = useState<RefundItem[]>(data.refunds);
  const [cashTips, setCashTips] = useState<CashTipItem[]>(data.cashTips);
  const [phones, setPhones] = useState<PhoneStatus[]>(data.phones);
  const [settings, setSettings] = useState<AdminSettings>(data.settings);

  // Active Screen & Settings
  const [activeTab, setActiveTab] = useState<ScreenTab>('scan');
  const [lang, setLang] = useState<Language>('am'); // Default: Amharic as required
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [showPhoneFrame, setShowPhoneFrame] = useState<boolean>(true);

  // Sync HTML lang and theme attributes
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Periodic heartbeat timer (every 60s as specified in prompt section 3)
  useEffect(() => {
    const interval = setInterval(() => {
      setPhones((prev) =>
        prev.map((phone) => ({
          ...phone,
          lastHeartbeat: new Date().toISOString(),
          // subtle battery drain or live heartbeat update
          battery: Math.max(10, phone.battery - (Math.random() < 0.05 ? 1 : 0)),
        }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for payments, tips, refunds
  const handleAddCheck = (newCheck: PaymentCheck) => {
    setChecks((prev) => [newCheck, ...prev]);

    // Also add incoming simulated bank SMS to listener phone log
    const matchingSms: ParsedSms = {
      id: `sms_${newCheck.reference}`,
      phoneId: 'phone_a',
      bankId: newCheck.bankId,
      rawBody: `Credit alert: ETB ${newCheck.paidAmount.toFixed(2)} received. Ref: ${newCheck.reference}`,
      sender: newCheck.bankId.toUpperCase(),
      amount: newCheck.paidAmount,
      reference: newCheck.reference,
      timestamp: new Date().toISOString(),
      timeStr: newCheck.timeStr,
      isHolding: false,
      parsedSuccessfully: true,
    };
    setSmsList((prev) => [matchingSms, ...prev]);

    // Update phone A lastSmsTime
    setPhones((prev) =>
      prev.map((p) =>
        p.id === 'phone_a' ? { ...p, lastSmsTime: new Date().toISOString() } : p
      )
    );
  };

  const handleAddTip = (checkId: string, tipAmount: number) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === checkId ? { ...c, tipAmount } : c))
    );
  };

  const handleAddRefund = (refund: RefundItem) => {
    setRefunds((prev) => [refund, ...prev]);
  };

  const handleResolveRefund = (refundId: string) => {
    setRefunds((prev) =>
      prev.map((r) => (r.id === refundId ? { ...r, resolved: true } : r))
    );
  };

  const handleAddCashTip = (waiterId: string, amount: number) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const newCashTip: CashTipItem = {
      id: `ct_${Date.now()}`,
      waiterId,
      amount,
      dateStr: todayStr,
      createdAt: now.toISOString(),
    };
    setCashTips((prev) => [newCashTip, ...prev]);
  };

  const handleApproveCheck = (checkId: string) => {
    setChecks((prev) =>
      prev.map((c) =>
        c.id === checkId
          ? {
              ...c,
              status: 'approved',
              approvedBy: 'Shift Supervisor (Abebe)',
              failureReason: undefined,
            }
          : c
      )
    );
  };

  const handleUpdateSettings = (newSettings: AdminSettings) => {
    setSettings(newSettings);
  };

  // Determine if active screen is a mobile screen
  const isMobileScreen = ['scan', 'sms_phone', 'admin_phone', 'tip'].includes(activeTab);

  return (
    <div className="min-h-screen bg-[#f5f3ee] dark:bg-[#14181a] text-[#1b1f1d] dark:text-[#f1f3f2] flex flex-col transition-colors selection:bg-[#0f6e4f] selection:text-white">
      {/* Top Bar with 5 tabs + language/theme controls */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'am' ? 'en' : 'am'))}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        showPhoneFrame={showPhoneFrame}
        onTogglePhoneFrame={() => setShowPhoneFrame((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'scan' && (
          <PhoneFrame enabled={showPhoneFrame}>
            <ScanScreen
              lang={lang}
              phones={phones}
              settings={settings}
              checks={checks}
              onAddCheck={handleAddCheck}
              onAddRefund={handleAddRefund}
              onAddTip={handleAddTip}
            />
          </PhoneFrame>
        )}

        {activeTab === 'sms_phone' && (
          <PhoneFrame enabled={showPhoneFrame}>
            <SmsPhoneScreen
              lang={lang}
              phones={phones}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          </PhoneFrame>
        )}

        {activeTab === 'admin_phone' && (
          <PhoneFrame enabled={showPhoneFrame}>
            <AdminPhoneScreen lang={lang} checks={checks} />
          </PhoneFrame>
        )}

        {activeTab === 'admin_web' && (
          <div className="py-6 px-3 sm:px-6">
            <AdminWebScreen
              lang={lang}
              checks={checks}
              smsList={smsList}
              onApproveCheck={handleApproveCheck}
            />
          </div>
        )}

        {activeTab === 'tip' && (
          <PhoneFrame enabled={showPhoneFrame}>
            <TipScreen
              lang={lang}
              checks={checks}
              cashTips={cashTips}
              refunds={refunds}
              onAddCashTip={handleAddCashTip}
              onResolveRefund={handleResolveRefund}
            />
          </PhoneFrame>
        )}

        {activeTab === 'architecture' && (
          <div className="py-6 px-3 sm:px-6">
            <ArchitectureDoc lang={lang} />
          </div>
        )}
      </main>
    </div>
  );
}
