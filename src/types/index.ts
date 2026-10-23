/**
 * Type definitions for ቃኝ (Kagn) Payment Verification & Tip Tracking
 */

export type Language = 'am' | 'en';

export type ScreenTab = 'scan' | 'sms_phone' | 'admin_phone' | 'admin_web' | 'tip' | 'architecture';

export type PaymentStatus = 'verified' | 'approved' | 'failed';

export interface Waiter {
  id: string;
  nameEn: string;
  nameAm: string;
}

export interface Bank {
  id: string;
  nameEn: string;
  nameAm: string;
  hasParser: boolean;
  codePrefix: string;
}

export interface ParsedSms {
  id: string;
  phoneId: 'phone_a' | 'phone_b';
  bankId: string;
  rawBody: string;
  sender: string;
  amount: number;
  reference: string;
  timestamp: string; // ISO
  timeStr: string; // HH:MM
  isHolding: boolean;
  parsedSuccessfully: boolean;
}

export interface PaymentCheck {
  id: string;
  waiterId: string;
  bankId: string;
  reference: string;
  saleAmount: number;
  paidAmount: number;
  tipAmount: number;
  status: PaymentStatus;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  createdAt: string; // ISO
  failureReason?: string;
  approvedBy?: string;
}

export interface RefundItem {
  id: string;
  waiterId: string;
  amount: number;
  reference: string;
  dateStr: string;
  createdAt: string;
  resolved: boolean;
}

export interface CashTipItem {
  id: string;
  waiterId: string;
  amount: number;
  dateStr: string;
  createdAt: string;
}

export interface PhoneStatus {
  id: 'phone_a' | 'phone_b';
  nameEn: string;
  nameAm: string;
  isPrimary: boolean;
  online: boolean;
  battery: number;
  lastHeartbeat: string; // ISO
  lastSmsTime: string; // ISO
}

export interface AdminSettings {
  adminPin: string;
  selectedBanks: string[];
  tipFlagMultiplier: number; // default 1.5
  minChecksForFlag: number; // default 3
}

export type ScanResultType = 'success' | 'duplicate' | 'delay' | 'mismatch';

export interface ScanResultData {
  type: ScanResultType;
  check?: PaymentCheck;
  bank?: Bank;
  extraAmount?: number;
  waiter?: Waiter;
}
