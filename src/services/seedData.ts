import { BANKS, WAITERS } from '../data/constants';
import {
  AdminSettings,
  CashTipItem,
  ParsedSms,
  PaymentCheck,
  PhoneStatus,
  RefundItem,
} from '../types';

export interface SeedDataResult {
  checks: PaymentCheck[];
  smsList: ParsedSms[];
  refunds: RefundItem[];
  cashTips: CashTipItem[];
  phones: PhoneStatus[];
  settings: AdminSettings;
}

export function generateSeedData(): SeedDataResult {
  const checks: PaymentCheck[] = [];
  const smsList: ParsedSms[] = [];
  const refunds: RefundItem[] = [];
  const cashTips: CashTipItem[] = [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper for formatting reference
  let refCounter = 1000;
  const generateRef = (bankId: string): string => {
    refCounter++;
    if (bankId === 'telebirr') {
      return `DAL${4830000 + refCounter}`;
    } else if (bankId === 'cbe') {
      return `FT2629${680000 + refCounter}`;
    } else if (bankId === 'awash') {
      return `AW9847${2900 + refCounter}`;
    }
    return `BOA77${1000 + refCounter}`;
  };

  // Helper for random choice with weights (Telebirr 50%, CBE 35%, Awash 15%)
  const pickBankId = (): string => {
    const r = Math.random();
    if (r < 0.5) return 'telebirr';
    if (r < 0.85) return 'cbe';
    return 'awash';
  };

  // Generate 22 days of history, plus today
  // Days: day 21 down to 0 (where 0 is today)
  for (let dayOffset = 21; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - dayOffset);
    const dateStr = targetDate.toISOString().split('T')[0];
    const isToday = dayOffset === 0;

    // 18 checks for today, ~22 for past days
    const checkCount = isToday ? 18 : 20 + Math.floor(Math.random() * 5);

    for (let c = 0; c < checkCount; c++) {
      const waiter = WAITERS[c % WAITERS.length];
      const bankId = pickBankId();
      const ref = generateRef(bankId);

      // Sale amount 300 - 1600 in steps of 10
      const stepCount = Math.floor(Math.random() * 131); // 0 to 130 * 10 = 0 to 1300
      const saleAmount = 300 + stepCount * 10;

      // Status: ~7% failed, ~5% approved, ~88% verified
      const statusRoll = Math.random();
      let status: 'verified' | 'approved' | 'failed' = 'verified';
      let failureReason: string | undefined = undefined;
      let approvedBy: string | undefined = undefined;

      if (statusRoll < 0.07) {
        status = 'failed';
        failureReason = 'Amount mismatch or unparsed receipt';
      } else if (statusRoll < 0.12) {
        status = 'approved';
        approvedBy = 'Shift Supervisor (Abebe)';
      }

      // Tip generation
      // Rule 7: One waiter (Hiwot w4) has a tip on every check, so the flag rule is visibly triggered!
      // Other waiters: ~25% carry a tip of 20, 50, or 100 ETB.
      let tipAmount = 0;
      if (status !== 'failed') {
        if (waiter.id === 'w4') {
          // Hiwot: tip on every check
          const tipChoices = [50, 70, 100, 150];
          tipAmount = tipChoices[Math.floor(Math.random() * tipChoices.length)];
        } else {
          // Other waiters: 25% chance of tip
          if (Math.random() < 0.25) {
            const tipChoices = [20, 50, 100];
            tipAmount = tipChoices[Math.floor(Math.random() * tipChoices.length)];
          }
        }
      }

      const paidAmount = saleAmount + tipAmount;

      const hour = 11 + Math.floor((c / checkCount) * 11); // 11:00 to 22:00
      const minute = Math.floor(Math.random() * 60);
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const createdAt = `${dateStr}T${timeStr}:00.000Z`;

      const check: PaymentCheck = {
        id: `chk_${dateStr}_${c}_${ref}`,
        waiterId: waiter.id,
        bankId,
        reference: ref,
        saleAmount,
        paidAmount,
        tipAmount,
        status,
        dateStr,
        timeStr,
        createdAt,
        failureReason,
        approvedBy,
      };

      checks.push(check);

      // Generate corresponding SMS for the listener phones
      if (status !== 'failed') {
        const phoneId = Math.random() < 0.8 ? 'phone_a' : 'phone_b';
        let rawBody = '';
        if (bankId === 'telebirr') {
          rawBody = `Dear customer, you have received ETB ${paidAmount.toFixed(2)} from GUEST on ${dateStr} ${timeStr}. Transaction ID: ${ref}.`;
        } else if (bankId === 'cbe') {
          rawBody = `Your CBE account 1000****1234 credited with ETB ${paidAmount.toFixed(2)} on ${dateStr} ${timeStr}. Txn Ref: ${ref}.`;
        } else {
          rawBody = `Awash Bank: Your A/C 0132***** has been credited with ETB ${paidAmount.toFixed(2)} on ${dateStr} ${timeStr}. Ref: ${ref}.`;
        }

        smsList.push({
          id: `sms_${ref}`,
          phoneId,
          bankId,
          rawBody,
          sender: bankId.toUpperCase(),
          amount: paidAmount,
          reference: ref,
          timestamp: createdAt,
          timeStr,
          isHolding: false,
          parsedSuccessfully: true,
        });
      }
    }
  }

  // Preload cash tips: Section 7: "Birhan-style example (waiter 5: 80, waiter 0: 40)"
  // Waiter 5 is Senait (index 5) or Tigist, Waiter 0 is Selam (index 0)
  cashTips.push(
    {
      id: 'ct_1',
      waiterId: 'w6', // Senait (waiter 5 in 0-indexed)
      amount: 80,
      dateStr: todayStr,
      createdAt: `${todayStr}T13:45:00.000Z`,
    },
    {
      id: 'ct_2',
      waiterId: 'w1', // Selam (waiter 0 in 0-indexed)
      amount: 40,
      dateStr: todayStr,
      createdAt: `${todayStr}T14:10:00.000Z`,
    },
    {
      id: 'ct_3',
      waiterId: 'w3', // Birhan
      amount: 60,
      dateStr: todayStr,
      createdAt: `${todayStr}T15:20:00.000Z`,
    }
  );

  // Preload sample "To refund (marked as mistakes)" list
  refunds.push(
    {
      id: 'ref_1',
      waiterId: 'w2', // Marta
      amount: 150,
      reference: 'DAL4832910',
      dateStr: todayStr,
      createdAt: `${todayStr}T12:30:00.000Z`,
      resolved: false,
    },
    {
      id: 'ref_2',
      waiterId: 'w5', // Tigist
      amount: 75,
      reference: 'FT262961820',
      dateStr: todayStr,
      createdAt: `${todayStr}T14:05:00.000Z`,
      resolved: false,
    }
  );

  // Preload Listener Phones (Phone A & Phone B)
  const phones: PhoneStatus[] = [
    {
      id: 'phone_a',
      nameEn: 'Phone A · primary',
      nameAm: 'ስልክ ሀ · ዋና',
      isPrimary: true,
      online: true,
      battery: 87,
      lastHeartbeat: new Date(Date.now() - 25000).toISOString(),
      lastSmsTime: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    },
    {
      id: 'phone_b',
      nameEn: 'Phone B · backup',
      nameAm: 'ስልክ ለ · ተቀባይ',
      isPrimary: false,
      online: true,
      battery: 94,
      lastHeartbeat: new Date(Date.now() - 42000).toISOString(),
      lastSmsTime: new Date(Date.now() - 720000).toISOString(), // 12 min ago
    },
  ];

  // Default Admin Settings (PIN: 1234, all 3 parsed banks selected by default)
  const settings: AdminSettings = {
    adminPin: '1234',
    selectedBanks: ['telebirr', 'cbe', 'awash'],
    tipFlagMultiplier: 1.5,
    minChecksForFlag: 3,
  };

  return {
    checks,
    smsList,
    refunds,
    cashTips,
    phones,
    settings,
  };
}
