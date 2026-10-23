/**
 * Bank SMS Parser Engine for Ethiopian Banks: Telebirr, CBE, and Awash.
 * Handles both English and Amharic SMS formats.
 * SMS from banks without parsers are routed to holding.
 */

export interface ParseResult {
  bankId: string;
  bankName: string;
  amount: number | null;
  reference: string | null;
  timestamp: string | null;
  timeStr: string | null;
  sender: string | null;
  isHolding: boolean;
  parsedSuccessfully: boolean;
  notes?: string;
}

export class BankSmsParser {
  /**
   * Parse an incoming SMS message based on text patterns
   */
  public static parse(rawSms: string, senderAddress?: string): ParseResult {
    const text = rawSms.trim();
    const normalized = text.toLowerCase();

    // 1. Telebirr Detection & Parsing
    if (
      normalized.includes('telebirr') ||
      normalized.includes('ቴሌብር') ||
      senderAddress?.toLowerCase().includes('telebirr') ||
      senderAddress?.toLowerCase().includes('127') ||
      /txn\s*id:\s*dal/i.test(text) ||
      /transaction\s*id:\s*dal/i.test(text) ||
      /የግብይት\s*መለያ/i.test(text)
    ) {
      return this.parseTelebirr(text);
    }

    // 2. Commercial Bank of Ethiopia (CBE) Detection & Parsing
    if (
      normalized.includes('cbe') ||
      normalized.includes('ንግድ ባንክ') ||
      senderAddress?.toLowerCase().includes('cbe') ||
      senderAddress?.toLowerCase().includes('cbebirr') ||
      /txn\s*ref:\s*ft/i.test(text) ||
      /trans\s*ref\s*ft/i.test(text) ||
      /ft2\d{8,}/i.test(text)
    ) {
      return this.parseCbe(text);
    }

    // 3. Awash Bank Detection & Parsing
    if (
      normalized.includes('awash') ||
      normalized.includes('አዋሽ') ||
      senderAddress?.toLowerCase().includes('awash') ||
      /ref:\s*aw/i.test(text) ||
      /aw9\d{6,}/i.test(text)
    ) {
      return this.parseAwash(text);
    }

    // 4. Other known Ethiopian banks without dedicated parsers -> Route to holding
    const otherBanks: { [key: string]: { id: string; name: string } } = {
      abyssinia: { id: 'abyssinia', name: 'Bank of Abyssinia' },
      አቢሲኒያ: { id: 'abyssinia', name: 'Bank of Abyssinia' },
      dashen: { id: 'dashen', name: 'Dashen Bank' },
      ዳሽን: { id: 'dashen', name: 'Dashen Bank' },
      wegagen: { id: 'wegagen', name: 'Wegagen Bank' },
      ወጋገን: { id: 'wegagen', name: 'Wegagen Bank' },
      zemen: { id: 'zemen', name: 'Zemen Bank' },
      ዘመን: { id: 'zemen', name: 'Zemen Bank' },
      nib: { id: 'nib', name: 'Nib International Bank' },
      ንብ: { id: 'nib', name: 'Nib International Bank' },
      hibret: { id: 'hibret', name: 'Hibret Bank' },
      ህብረት: { id: 'hibret', name: 'Hibret Bank' },
      bunna: { id: 'bunna', name: 'Bunna Bank' },
      ቡና: { id: 'bunna', name: 'Bunna Bank' },
      oromia: { id: 'oromia', name: 'Cooperative Bank of Oromia' },
      ኦሮሚያ: { id: 'oromia', name: 'Cooperative Bank of Oromia' },
      lion: { id: 'anbessa', name: 'Lion International Bank' },
      anbessa: { id: 'anbessa', name: 'Lion International Bank' },
      አንበሳ: { id: 'anbessa', name: 'Lion International Bank' },
      enat: { id: 'enat', name: 'Enat Bank' },
      እናት: { id: 'enat', name: 'Enat Bank' },
      amhara: { id: 'amhara', name: 'Amhara Bank' },
      አማራ: { id: 'amhara', name: 'Amhara Bank' },
    };

    for (const [token, bankInfo] of Object.entries(otherBanks)) {
      if (normalized.includes(token)) {
        return {
          bankId: bankInfo.id,
          bankName: bankInfo.name,
          amount: null,
          reference: null,
          timestamp: null,
          timeStr: null,
          sender: senderAddress || null,
          isHolding: true,
          parsedSuccessfully: false,
          notes: 'No parser · SMS routed to holding area for manual inspection',
        };
      }
    }

    // 5. Unknown SMS format
    return {
      bankId: 'unknown',
      bankName: 'Unrecognized Bank',
      amount: null,
      reference: null,
      timestamp: null,
      timeStr: null,
      sender: senderAddress || null,
      isHolding: true,
      parsedSuccessfully: false,
      notes: 'Unrecognized SMS template · Routed to holding',
    };
  }

  /**
   * Telebirr Parser
   * Supports English:
   * "Dear customer, you have received ETB 850.00 from KEBEDE ALEM on 23/10/2026 14:15:22. Transaction ID: DAL4839201. Your current balance is ETB 12,450.00."
   * And Amharic:
   * "ውድ ደንበኛ፣ በ 23/10/2026 14:15:22 ከ ከበደ አለም 850.00 ብር ገቢ ተደርጓል። የግብይት መለያ ቁጥር፡ DAL4839201። ቀሪ ሂሳብ 12,450.00 ብር።"
   */
  private static parseTelebirr(text: string): ParseResult {
    // Extract Amount: e.g. "ETB 850.00", "850.00 ETB", "850.00 ብር"
    let amount: number | null = null;
    const amountMatch =
      text.match(/(?:ETB|ብር)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
      text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:ETB|ብር)/i) ||
      text.match(/received\s+([\d,]+(?:\.\d{1,2})?)/i);

    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract Transaction Reference: DAL...
    let reference: string | null = null;
    const refMatch =
      text.match(/(?:Transaction\s*ID|Txn\s*ID|መለያ\s*ቁጥር)[\s:：]+([A-Z0-9]+)/i) ||
      text.match(/\b(DAL[A-Z0-9]{5,})\b/i);

    if (refMatch) {
      reference = refMatch[1].toUpperCase();
    }

    // Extract Timestamp: DD/MM/YYYY HH:MM:SS or HH:MM
    const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    const timeStr = timeMatch ? timeMatch[1].substring(0, 5) : '14:15';

    // Extract Sender if present: e.g. "from KEBEDE ALEM on" or "ከ ከበደ አለም"
    let sender: string | null = null;
    const senderMatch =
      text.match(/from\s+([A-Z\s]+?)\s+on/i) ||
      text.match(/ከ\s+([\u1200-\u137F\s]+?)\s+(?:ብር|በ)/);
    if (senderMatch) {
      sender = senderMatch[1].trim();
    }

    const success = Boolean(amount && reference);

    return {
      bankId: 'telebirr',
      bankName: 'Telebirr',
      amount,
      reference,
      timestamp: new Date().toISOString(),
      timeStr,
      sender,
      isHolding: !success,
      parsedSuccessfully: success,
      notes: success ? 'Parsed successfully via Telebirr rule engine' : 'Partial parse failure · Missing amount or reference',
    };
  }

  /**
   * Commercial Bank of Ethiopia (CBE) Parser
   * Supports:
   * "Your CBE account 1000****1234 credited with ETB 1,200.00 on 23-10-2026 11:42:10 by ABEBE BIKILA. Txn Ref: FT2629683920. New Bal ETB 45,300.00"
   * CBE Birr:
   * "You have received ETB 850.00 from 251911223344. Trans Ref FT2629683920 at 11:42."
   * Amharic:
   * "የኢትዮጵያ ንግድ ባንክ ሒሳብ ቁጥር 1000****1234 በ 23-10-2026 11:42 በ አበበ ቢቂላ 1,200.00 ብር ገቢ ሆኗል። የግብይት ቁጥር FT2629683920።"
   */
  private static parseCbe(text: string): ParseResult {
    let amount: number | null = null;
    const amountMatch =
      text.match(/(?:ETB|ብር|with\s+ETB)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
      text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:ETB|ብር)/i) ||
      text.match(/credited\s+with\s*([\d,]+(?:\.\d{1,2})?)/i);

    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract Transaction Reference: FT2... or Txn Ref: ...
    let reference: string | null = null;
    const refMatch =
      text.match(/(?:Txn\s*Ref|Trans\s*Ref|Transaction\s*No|የግብይት\s*ቁጥር)[\s:：]+([A-Z0-9]+)/i) ||
      text.match(/\b(FT[A-Z0-9]{8,})\b/i);

    if (refMatch) {
      reference = refMatch[1].toUpperCase();
    }

    const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    const timeStr = timeMatch ? timeMatch[1].substring(0, 5) : '11:42';

    let sender: string | null = null;
    const senderMatch =
      text.match(/by\s+([A-Z\s]+?)\.\s+Txn/i) ||
      text.match(/from\s+([A-Z0-9\s]+?)\.\s+Trans/i) ||
      text.match(/በ\s+([\u1200-\u137F\s]+?)\s+[\d,]/);
    if (senderMatch) {
      sender = senderMatch[1].trim();
    }

    const success = Boolean(amount && reference);

    return {
      bankId: 'cbe',
      bankName: 'Commercial Bank of Ethiopia',
      amount,
      reference,
      timestamp: new Date().toISOString(),
      timeStr,
      sender,
      isHolding: !success,
      parsedSuccessfully: success,
      notes: success ? 'Parsed successfully via CBE rule engine' : 'Partial parse failure · Missing amount or reference',
    };
  }

  /**
   * Awash Bank Parser
   * Supports:
   * "Awash Bank: Your A/C 0132***** has been credited with ETB 650.00 on 23/10/2026 12:05 PM. Ref: AW98472910. Thank you for banking with us."
   * Amharic:
   * "አዋሽ ባንክ፡ የቁጠባ ሒሳብዎ በ 23/10/2026 12:05 650.00 ብር ገቢ ተደርጓል። መለያ ቁጥር AW98472910። እናመሰግናለን።"
   */
  private static parseAwash(text: string): ParseResult {
    let amount: number | null = null;
    const amountMatch =
      text.match(/(?:ETB|ብር|with\s+ETB)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
      text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:ETB|ብር)/i) ||
      text.match(/credited\s+with\s*([\d,]+(?:\.\d{1,2})?)/i);

    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract Ref: AW...
    let reference: string | null = null;
    const refMatch =
      text.match(/(?:Ref|Reference|መለያ\s*ቁጥር)[\s:：]+([A-Z0-9]+)/i) ||
      text.match(/\b(AW[A-Z0-9]{6,})\b/i);

    if (refMatch) {
      reference = refMatch[1].toUpperCase();
    }

    const timeMatch = text.match(/(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i);
    const timeStr = timeMatch ? timeMatch[1].substring(0, 5) : '12:05';

    const success = Boolean(amount && reference);

    return {
      bankId: 'awash',
      bankName: 'Awash',
      amount,
      reference,
      timestamp: new Date().toISOString(),
      timeStr,
      sender: null,
      isHolding: !success,
      parsedSuccessfully: success,
      notes: success ? 'Parsed successfully via Awash rule engine' : 'Partial parse failure · Missing amount or reference',
    };
  }
}

/**
 * Built-in Unit Test Suite for Bank SMS Parsers (Telebirr, CBE, Awash, & Holding)
 * Can be run in-browser or imported into tests.
 */
export interface ParserTestCase {
  id: string;
  name: string;
  bankId: string;
  rawSms: string;
  expectedAmount: number | null;
  expectedRef: string | null;
  expectedHolding: boolean;
}

export const PARSER_TEST_CASES: ParserTestCase[] = [
  {
    id: 'test_telebirr_en',
    name: 'Telebirr (English Standard)',
    bankId: 'telebirr',
    rawSms: 'Dear customer, you have received ETB 850.00 from KEBEDE ALEM on 23/10/2026 14:15:22. Transaction ID: DAL4839201. Your current balance is ETB 12,450.00.',
    expectedAmount: 850,
    expectedRef: 'DAL4839201',
    expectedHolding: false,
  },
  {
    id: 'test_telebirr_am',
    name: 'Telebirr (Amharic Standard)',
    bankId: 'telebirr',
    rawSms: 'ውድ ደንበኛችን፣ በ 23/10/2026 14:15:22 ከ ከበደ አለም 1,350.00 ብር ገቢ ተደርጓል። የግብይት መለያ ቁጥር፡ DAL9023812። ቀሪ ሂሳብ 18,200.00 ብር።',
    expectedAmount: 1350,
    expectedRef: 'DAL9023812',
    expectedHolding: false,
  },
  {
    id: 'test_cbe_account_en',
    name: 'CBE Account Credit (English)',
    bankId: 'cbe',
    rawSms: 'Your CBE account 1000****1234 credited with ETB 1,200.00 on 23-10-2026 11:42:10 by ABEBE BIKILA. Txn Ref: FT2629683920. New Bal ETB 45,300.00',
    expectedAmount: 1200,
    expectedRef: 'FT2629683920',
    expectedHolding: false,
  },
  {
    id: 'test_cbe_birr',
    name: 'CBE Birr Instant P2P',
    bankId: 'cbe',
    rawSms: 'You have received ETB 420.00 from 251911223344. Trans Ref FT2684920193 at 13:10. Thank you for using CBE Birr.',
    expectedAmount: 420,
    expectedRef: 'FT2684920193',
    expectedHolding: false,
  },
  {
    id: 'test_awash_standard',
    name: 'Awash Bank Credit SMS',
    bankId: 'awash',
    rawSms: 'Awash Bank: Your A/C 0132***** has been credited with ETB 650.00 on 23/10/2026 12:05 PM. Ref: AW98472910. Thank you for banking with us.',
    expectedAmount: 650,
    expectedRef: 'AW98472910',
    expectedHolding: false,
  },
  {
    id: 'test_abyssinia_holding',
    name: 'Abyssinia (Unparsed -> Holding)',
    bankId: 'abyssinia',
    rawSms: 'Bank of Abyssinia: Account *8291 has received ETB 900.00. Ref BOA83921. Contact your branch for inquiries.',
    expectedAmount: null,
    expectedRef: null,
    expectedHolding: true,
  },
  {
    id: 'test_dashen_holding',
    name: 'Dashen Bank (Unparsed -> Holding)',
    bankId: 'dashen',
    rawSms: 'Dashen Amole: Received ETB 750.00 from customer. Transaction ref DSH82910.',
    expectedAmount: null,
    expectedRef: null,
    expectedHolding: true,
  },
];

export function runParserTests(): {
  allPassed: boolean;
  results: {
    test: ParserTestCase;
    passed: boolean;
    actualAmount: number | null;
    actualRef: string | null;
    actualHolding: boolean;
    notes?: string;
  }[];
} {
  const results = PARSER_TEST_CASES.map((tc) => {
    const parsed = BankSmsParser.parse(tc.rawSms);
    const amountMatch = tc.expectedAmount === null ? parsed.amount === null : parsed.amount === tc.expectedAmount;
    const refMatch = tc.expectedRef === null ? parsed.reference === null : parsed.reference === tc.expectedRef;
    const holdingMatch = parsed.isHolding === tc.expectedHolding;
    const passed = amountMatch && refMatch && holdingMatch;

    return {
      test: tc,
      passed,
      actualAmount: parsed.amount,
      actualRef: parsed.reference,
      actualHolding: parsed.isHolding,
      notes: parsed.notes,
    };
  });

  return {
    allPassed: results.every((r) => r.passed),
    results,
  };
}
