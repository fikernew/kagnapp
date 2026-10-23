import React, { useState } from 'react';
import { Language } from '../types';
import { runParserTests, BankSmsParser, PARSER_TEST_CASES } from '../services/smsParser';

interface Props {
  lang: Language;
}

export const ArchitectureDoc: React.FC<Props> = ({ lang }) => {
  const [testResults, setTestResults] = useState<ReturnType<typeof runParserTests> | null>(null);
  const [customSms, setCustomSms] = useState(
    'Dear customer, you have received ETB 850.00 from KEBEDE ALEM on 23/10/2026 14:15:22. Transaction ID: DAL4839201. Your current balance is ETB 12,450.00.'
  );
  const [parsedCustom, setParsedCustom] = useState<any>(null);

  const handleRunTests = () => {
    setTestResults(runParserTests());
  };

  const handleParseCustom = () => {
    setParsedCustom(BankSmsParser.parse(customSms));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 text-[#1b1f1d] dark:text-[#f1f3f2]">
      {/* Header */}
      <div className="border-b border-[#e4e1d8] dark:border-[#2b3438] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f6e4f] dark:text-[#3fae86]">
          {lang === 'am' ? 'ቃኝ፡ የስነ-ህንፃ፣ የዳታቤዝ እና የኤፒአይ (API) ሰነድ' : 'ቃኝ (Kagn): Architecture, Data Models & API Specifications'}
        </h1>
        <p className="text-sm text-[#646b67] dark:text-[#9aa29e] mt-1">
          {lang === 'am'
            ? 'ለኢትዮጵያ ምግብ ቤቶች የሞባይል ክፍያ ማረጋገጫ፣ የባንክ ኤስኤምኤስ ትንተና እና የአስተናጋጆች ጉርሻ አያያዝ ሙሉ መመሪያ።'
            : 'Complete production architecture proposal, schema specifications, parser test suites, and assumptions.'}
        </p>
      </div>

      {/* Section 1: Inferred Architecture & Data Flow */}
      <section className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0f6e4f] dark:bg-[#3fae86]"></span>
          {lang === 'am' ? '1. የስርዓቱ ስነ-ህንፃ እና የውሂብ ፍሰት' : '1. System Architecture & Dual-Listener Pipeline'}
        </h2>
        <div className="text-xs sm:text-sm text-[#646b67] dark:text-[#9aa29e] space-y-2 leading-relaxed">
          <p>
            <strong>Dual Android Forwarders:</strong> Two physical Android devices (Phone A as primary and Phone B as failover) run a background SMS-forwarding service. When a bank SMS arrives on either SIM card, the app pushes the payload over HTTPS to <code className="bg-[#f5f3ee] dark:bg-[#14181a] px-1.5 py-0.5 rounded font-mono">POST /api/sms/inbound</code>.
          </p>
          <p>
            <strong>Parsing & Deduplication:</strong> The server parses SMS from Telebirr, CBE, and Awash in &lt;10ms. A 24-hour idempotent cache keys on <code className="font-mono">bankId:reference</code> to discard duplicate arrivals from Phone A and Phone B.
          </p>
          <p>
            <strong>Holding Queue:</strong> SMS from unsupported banks (e.g., Abyssinia, Dashen, Zemen) or unparseable messages route to the <code className="font-mono">holding_sms</code> table for supervisor inspection.
          </p>
          <p>
            <strong>Cashier Verification:</strong> When a cashier scans a customer payment receipt (or enters the reference manually), the cashier client queries <code className="font-mono">POST /api/payments/verify</code>. If matched with verified bank SMS, it attributes the sale and tip to the designated waiter.
          </p>
        </div>
      </section>

      {/* Section 2: Data Models & Tables Proposal */}
      <section className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0f6e4f] dark:bg-[#3fae86]"></span>
          {lang === 'am' ? '2. የዳታቤዝ ሰንጠረዦች ዝርዝር (Database Schema Proposal)' : '2. Relational Database Schema & Entities'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Table: payments */}
          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg border border-[#e4e1d8] dark:border-[#2b3438]">
            <p className="font-bold text-[#0f6e4f] dark:text-[#3fae86] mb-1">TABLE: payments</p>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li>id: UUID PRIMARY KEY</li>
              <li>waiter_id: UUID FK -&gt; waiters</li>
              <li>bank_id: VARCHAR(30) FK -&gt; banks</li>
              <li>reference: VARCHAR(64) UNIQUE</li>
              <li>sale_amount: NUMERIC(10, 2)</li>
              <li>paid_amount: NUMERIC(10, 2)</li>
              <li>tip_amount: NUMERIC(10, 2) DEFAULT 0</li>
              <li>status: ENUM(&apos;verified&apos;, &apos;approved&apos;, &apos;failed&apos;)</li>
              <li>verified_at: TIMESTAMPTZ</li>
              <li>approved_by: VARCHAR(100) NULL</li>
            </ul>
          </div>

          {/* Table: sms_messages */}
          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg border border-[#e4e1d8] dark:border-[#2b3438]">
            <p className="font-bold text-[#0f6e4f] dark:text-[#3fae86] mb-1">TABLE: sms_messages</p>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li>id: UUID PRIMARY KEY</li>
              <li>phone_id: VARCHAR(20)</li>
              <li>bank_id: VARCHAR(30)</li>
              <li>raw_body: TEXT</li>
              <li>sender_address: VARCHAR(50)</li>
              <li>parsed_amount: NUMERIC(10, 2) NULL</li>
              <li>parsed_reference: VARCHAR(64) NULL</li>
              <li>is_holding: BOOLEAN DEFAULT FALSE</li>
              <li>received_at: TIMESTAMPTZ</li>
            </ul>
          </div>

          {/* Table: refunds & cash_tips */}
          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg border border-[#e4e1d8] dark:border-[#2b3438]">
            <p className="font-bold text-[#0f6e4f] dark:text-[#3fae86] mb-1">TABLES: refunds &amp; cash_tips</p>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong>refunds:</strong> id, waiter_id, amount, reference, resolved: BOOL, created_at</li>
              <li><strong>cash_tips:</strong> id, waiter_id, amount, self_reported_at: TIMESTAMPTZ</li>
              <li><em>*Rule: Cash tips are always isolated from verified bank tips.</em></li>
            </ul>
          </div>

          {/* Table: phones & settings */}
          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg border border-[#e4e1d8] dark:border-[#2b3438]">
            <p className="font-bold text-[#0f6e4f] dark:text-[#3fae86] mb-1">TABLES: phones &amp; settings</p>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong>phones:</strong> id, role (&apos;primary&apos;|&apos;backup&apos;), battery: INT, last_heartbeat, last_sms_time</li>
              <li><strong>settings:</strong> admin_pin_hash, selected_banks: JSONB, tip_flag_multiplier: 1.5, min_checks: 3</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: Bank SMS Parsers & Interactive Tester */}
      <section className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0f6e4f] dark:bg-[#3fae86]"></span>
            {lang === 'am' ? '3. የባንክ ኤስኤምኤስ ተንታኝ ፈተና (Parsers & Unit Tests)' : '3. Bank SMS Parsers & Test Suite'}
          </h2>
          <button
            onClick={handleRunTests}
            className="px-3 py-1.5 text-xs font-semibold bg-[#0f6e4f] hover:bg-[#0c573e] text-white rounded-lg transition-colors cursor-pointer"
          >
            {lang === 'am' ? 'የፓርሰር የሙከራ ፈተናዎችን አሂድ (Run 7 Tests)' : 'Run Built-in Parser Tests'}
          </button>
        </div>

        {testResults && (
          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg border border-[#e4e1d8] dark:border-[#2b3438] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={testResults.allPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600'}>
                {testResults.allPassed ? '✓ All 7 Parser Test Cases Passed!' : '⚠ Some tests failed'}
              </span>
              <span className="text-[#646b67] dark:text-[#9aa29e]">Telebirr (EN/AM), CBE, CBE Birr, Awash, Holding</span>
            </div>
            <div className="divide-y divide-[#e4e1d8] dark:divide-[#2b3438] text-xs">
              {testResults.results.map((r, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-slate-800 dark:text-slate-200">{r.test.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#646b67] dark:text-[#9aa29e]">
                      Amt: {r.actualAmount ?? 'null'} | Ref: {r.actualRef ?? 'null'} | Holding: {String(r.actualHolding)}
                    </span>
                    <span className={r.passed ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {r.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Interactive Parser Sandbox */}
        <div className="border-t border-[#e4e1d8] dark:border-[#2b3438] pt-3 space-y-2">
          <label className="text-xs font-semibold block">
            {lang === 'am' ? 'የሙከራ ኤስኤምኤስ መልዕክት እዚህ ይለጥፉ፡' : 'Interactive SMS Parser Sandbox (Paste real SMS to test):'}
          </label>
          <textarea
            value={customSms}
            onChange={(e) => setCustomSms(e.target.value)}
            rows={3}
            className="w-full text-xs p-2 rounded border border-[#e4e1d8] dark:border-[#2b3438] bg-[#f5f3ee] dark:bg-[#14181a] font-mono focus:ring-1 focus:ring-[#0f6e4f]"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setCustomSms(PARSER_TEST_CASES[0].rawSms)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80"
              >
                Telebirr EN
              </button>
              <button
                onClick={() => setCustomSms(PARSER_TEST_CASES[1].rawSms)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80"
              >
                Telebirr AM
              </button>
              <button
                onClick={() => setCustomSms(PARSER_TEST_CASES[2].rawSms)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80"
              >
                CBE Credit
              </button>
              <button
                onClick={() => setCustomSms(PARSER_TEST_CASES[4].rawSms)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:opacity-80"
              >
                Awash Bank
              </button>
              <button
                onClick={() => setCustomSms(PARSER_TEST_CASES[5].rawSms)}
                className="text-[11px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
              >
                Abyssinia (Holding)
              </button>
            </div>
            <button
              onClick={handleParseCustom}
              className="px-3 py-1 text-xs font-medium bg-[#0f6e4f] text-white rounded hover:bg-[#0c573e]"
            >
              Parse
            </button>
          </div>

          {parsedCustom && (
            <div className="mt-2 p-3 rounded bg-slate-50 dark:bg-[#14181a] border border-[#e4e1d8] dark:border-[#2b3438] text-xs font-mono space-y-1">
              <div className="flex justify-between font-bold">
                <span>Bank: {parsedCustom.bankName} ({parsedCustom.bankId})</span>
                <span className={parsedCustom.parsedSuccessfully ? 'text-green-600' : 'text-amber-600'}>
                  {parsedCustom.parsedSuccessfully ? 'Parsed Successfully' : 'Routed to Holding'}
                </span>
              </div>
              <div>Amount: <strong className="text-[#0f6e4f] dark:text-[#3fae86]">{parsedCustom.amount !== null ? `${parsedCustom.amount} ETB` : 'null'}</strong></div>
              <div>Reference: <strong>{parsedCustom.reference ?? 'null'}</strong></div>
              <div>Time: <span>{parsedCustom.timeStr ?? 'N/A'}</span></div>
              <div className="text-slate-500">{parsedCustom.notes}</div>
            </div>
          )}
        </div>
      </section>

      {/* Section 4: REST API Specifications */}
      <section className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0f6e4f] dark:bg-[#3fae86]"></span>
          {lang === 'am' ? '4. የኤፒአይ (REST API) ዝርዝር ሰነድ' : '4. REST API Endpoint Documentation'}
        </h2>
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg">
            <div className="flex items-center gap-2 font-mono font-bold text-blue-600 dark:text-blue-400">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50">POST</span>
              <span>/api/sms/inbound</span>
            </div>
            <p className="mt-1 text-[#646b67] dark:text-[#9aa29e]">
              Invoked by dedicated listener phones whenever an SMS is received. Body: <code className="font-mono">&#123; phoneId, sender, rawBody, receivedAt &#125;</code>. Returns parsed payload or holding status.
            </p>
          </div>

          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg">
            <div className="flex items-center gap-2 font-mono font-bold text-green-600 dark:text-green-400">
              <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/50">POST</span>
              <span>/api/payments/verify</span>
            </div>
            <p className="mt-1 text-[#646b67] dark:text-[#9aa29e]">
              Called by Cashier Scan app. Body: <code className="font-mono">&#123; waiterId, saleAmount, reference, paidAmount &#125;</code>.
              Returns: <code className="font-mono">status: &apos;verified&apos; | &apos;duplicate&apos; | &apos;delay&apos; | &apos;mismatch&apos;</code>.
            </p>
          </div>

          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg">
            <div className="flex items-center gap-2 font-mono font-bold text-amber-600 dark:text-amber-400">
              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50">POST</span>
              <span>/api/heartbeat</span>
            </div>
            <p className="mt-1 text-[#646b67] dark:text-[#9aa29e]">
              Sent every 60 seconds by listener phones. Body: <code className="font-mono">&#123; phoneId, batteryLevel, timestamp &#125;</code>.
            </p>
          </div>

          <div className="p-3 bg-[#f5f3ee] dark:bg-[#14181a] rounded-lg">
            <div className="flex items-center gap-2 font-mono font-bold text-purple-600 dark:text-purple-400">
              <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50">POST</span>
              <span>/api/supervisor/approve</span>
            </div>
            <p className="mt-1 text-[#646b67] dark:text-[#9aa29e]">
              Overrides a failed or delayed check. Requires admin/supervisor PIN. Sets status to <code className="font-mono">&apos;approved&apos;</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Out of Scope Assumptions (Section 9 of Prompt) */}
      <section className="bg-white dark:bg-[#1d2326] border border-[#e4e1d8] dark:border-[#2b3438] rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8a5a00]"></span>
          {lang === 'am' ? '5. ግምቶች እና የማስፋፊያ ወሰኖች (Assumptions & Scope Choices)' : '5. Assumptions & Production Scope Choices (Section 9)'}
        </h2>
        <ul className="text-xs sm:text-sm text-[#646b67] dark:text-[#9aa29e] space-y-2 list-disc pl-5 leading-relaxed">
          <li>
            <strong>QR/Receipt Capture:</strong> Camera viewfinder is simulated with active optical scanning and manual reference entry fallback (supports direct OCR integration via Tesseract / MLKit in mobile wrapper).
          </li>
          <li>
            <strong>Authentication:</strong> Lightweight restaurant workflow with 4-digit Admin PIN (default <code className="font-mono">1234</code>) for settings and listener configuration; waiter selector without individual PIN friction for high-speed cashier throughput.
          </li>
          <li>
            <strong>Supervisor Workflow:</strong> Supervisors can view &quot;Failed scans&quot; in Admin and approve legitimate exceptions with supervisor attribution.
          </li>
          <li>
            <strong>SMS Forwarder:</strong> Listener phones run a lightweight Android background service listening to <code className="font-mono">SMS_RECEIVED</code> broadcasts with HTTP retry queues.
          </li>
          <li>
            <strong>Offline Resilience:</strong> If internet disconnects, SMS forwarders store incoming texts in local SQLite and drain the queue once connectivity resumes.
          </li>
          <li>
            <strong>Payout Export:</strong> Admin Tip screen supports both Individual and Pooled tip calculation models with CSV-ready tabulations.
          </li>
        </ul>
      </section>
    </div>
  );
};
