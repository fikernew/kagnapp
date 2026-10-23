import { Language } from '../types';

export const t = (key: string, lang: Language, params?: Record<string, string | number>): string => {
  const dictionary: Record<string, { am: string; en: string }> = {
    // App header & nav
    app_title: { am: 'ቃኝ', en: 'Kagn' },
    app_subtitle: { am: 'የክፍያ ማረጋገጫ እና የጉርሻ መከታተያ', en: 'Payment Verification & Tip Tracking' },
    tab_scan: { am: 'ቃኝ (ካሺየር)', en: 'Scan' },
    tab_sms_phone: { am: 'ኤስኤምኤስ ስልክ', en: 'SMS phone' },
    tab_admin_phone: { am: 'አድሚን ስልክ', en: 'Admin phone' },
    tab_admin_web: { am: 'አድሚን ድረ-ገጽ', en: 'Admin web' },
    tab_tip: { am: 'ጉርሻ', en: 'Tip' },
    tab_architecture: { am: 'ስነ-ህንፃ እና ኤፒአይ', en: 'Architecture & API' },

    // Device status
    phone_a_online: { am: 'ስልክ ሀ በመስመር ላይ', en: 'Phone A online' },
    phone_b_online: { am: 'ስልክ ለ በመስመር ላይ', en: 'Phone B online' },
    sample_screen: { am: 'የናሙና ስክሪን', en: 'Sample screen' },
    sample_data: { am: 'የናሙና መረጃ', en: 'Sample data' },

    // Scan Screen
    served_by: { am: 'አስተናጋጅ (የጠረጴዛ አገልጋይ)', en: 'Served by' },
    sale_amount: { am: 'የሽያጭ መጠን (ETB)', en: 'Sale amount (ETB)' },
    amount_received: { am: 'የተከፈለ መጠን (የሙከራ፡ ከባንክ ኤስኤምኤስ)', en: 'Amount received (test: from the bank SMS)' },
    amount_received_prod: { am: 'የተከፈለ መጠን', en: 'Amount received' },
    viewfinder_hint: { am: 'የደንበኛውን የQR ኮድ ወይም ደረሰኝ ስክሪን አሳይ', en: "Show the customer's QR or receipt screen" },
    scanning: { am: 'በመቃኘት ላይ…', en: 'Scanning…' },
    scan_btn: { am: 'ቃኝ (Scan)', en: 'Scan' },
    enter_ref_hand: { am: 'መለያ ቁጥር በእጅ አስገባ', en: 'Enter reference by hand' },
    txn_ref_placeholder: { am: 'የግብይት መለያ ቁጥር (ለምሳሌ DAL4839201)', en: 'Transaction reference (e.g. DAL4839201)' },
    verify_btn: { am: 'አረጋግጥ', en: 'Verify' },
    see_failed_scan: { am: 'ያልተሳካ ቅኝት ናሙና እይ', en: 'See a failed scan' },
    today_summary: { am: '{checks} ቼኮች · ጠቅላላ {total} ETB', en: '{checks} checks · {total} ETB' },

    // Results
    result_verified: { am: 'ተረጋግጧል', en: 'Verified' },
    result_duplicate_title: { am: 'ደረሰኙ ቀደም ሲል ጥቅም ላይ ውሏል', en: 'Receipt already used' },
    result_duplicate_desc: { am: 'ይህ ክፍያ ቀድሞ ተረጋግጧል። እባክዎ ሌላ ክፍያ ይጠይቁ።', en: 'This payment was already verified. Ask for another payment.' },
    result_delay_title: { am: 'የስርዓት መዘግየት', en: 'System delay' },
    result_delay_desc: { am: 'የባንኩ መልዕክት ገና አልደረሰም ወይም ሲስተሙ ዘግይቷል። ትንሽ ቆይተው እንደገና ይቃኙ።', en: 'The bank message has not arrived or the system is slow. Wait a moment, then scan again.' },
    result_mismatch_title: { am: 'የመጠን አለመጣጣም', en: 'Amount mismatch' },
    result_mismatch_desc: { am: 'የተከፈለው መጠን ከሽያጩ ያነሰ ነው። የቀረውን ልዩነት ይጠይቁ።', en: 'The paid amount is below the sale. Ask for the difference.' },
    btn_next_scan: { am: 'ቀጣይ ቃኝ', en: 'Next scan' },
    btn_back: { am: 'ተመለስ', en: 'Back' },
    waiter: { am: 'አስተናጋጅ', en: 'Waiter' },
    bank: { am: 'ባንክ', en: 'Bank' },
    reference: { am: 'መለያ ቁጥር', en: 'Reference' },
    verified_at: { am: 'የተረጋገጠበት ሰዓት', en: 'Verified at' },
    paid: { am: 'የተከፈለ', en: 'Paid' },

    // Tip prompt in scan
    extra_money_found: { am: 'ተጨማሪ ገንዘብ ተገኝቷል', en: 'Extra money found' },
    is_it_tip: { am: 'ጉርሻ ነው?', en: 'Is it a tip?' },
    btn_yes_tip: { am: 'አዎ፣ ጉርሻ ነው', en: "Yes, it's a tip" },
    btn_no_mistake: { am: 'አይ፣ በስህተት ነው', en: 'No, a mistake' },
    warning_extra_exceeds: { am: '⚠ ተጨማሪው {extra} ETB ከሽያጩ መጠን ({sale} ETB) ይበልጣል!', en: '⚠ The extra {extra} ETB is more than the sale amount ({sale} ETB)!' },
    tip_recorded_toast: { am: '✓ {extra} ETB ጉርሻ ለ{waiter} ተመዝግቧል', en: '✓ Tip {extra} ETB recorded for {waiter}' },
    refund_logged_toast: { am: '{extra} ETB ተመላሽ እንዲደረግ ተመዝግቧል', en: '{extra} ETB logged for refund' },
    confirm_large_tip_title: { am: 'እርግጠኛ ነዎት? ይህን ተጨማሪ ገንዘብ ለ{waiter} በጉርሻነት ለመመዝገብ ፍቃድ ይሰጣሉ?', en: 'Are you sure? Do you give permission to record this extra as a tip for {waiter}?' },
    btn_give_permission: { am: 'ፍቃድ እሰጣለሁ', en: 'I give permission' },
    tooltip_answer_first: { am: 'መጀመሪያ ጥያቄውን ይመልሱ', en: 'Answer the question first' },

    // SMS Phone screen
    sms_listener_title: { am: 'የኤስኤምኤስ አዳማጭ', en: 'SMS listener' },
    sms_listener_subtitle: { am: 'ስልክ ሀ · ዋና', en: 'Phone A · primary' },
    connected_to_server: { am: 'ከአገልጋዩ ጋር ተገናኝቷል', en: 'Connected to server' },
    last_sms_time: { am: 'የመጨረሻው ኤስኤምኤስ: {time}', en: 'Last SMS: {time}' },
    battery_heartbeat: { am: 'ባትሪ {battery}% · የልብ ምት በየ 60 ሰከንድ', en: 'Battery {battery}% · heartbeat every 60 s' },
    banks_to_listen: { am: 'የሚደመጡ ባንኮች', en: 'Banks to listen to' },
    all_banks: { am: 'ሁሉም ባንኮች', en: 'All banks' },
    n_selected: { am: '{count} / 14 ተመርጠዋል', en: '{count} / 14 selected' },
    parser_ready: { am: 'ፓርሰር ዝግጁ', en: 'Parser ready' },
    no_parser_holding: { am: 'ፓርሰር የለም · ኤስኤምኤስ ወደ ማቆያ ይሄዳል', en: 'No parser · SMS goes to holding' },
    admin_pin: { am: 'የአድሚን ፒን', en: 'Admin PIN' },
    save_btn: { am: 'አስቀምጥ', en: 'Save' },
    toast_saved: { am: '✓ ተቀምጧል', en: '✓ Saved' },
    sms_footnote: { am: 'ይህ ስክሪን በፒን የተጠበቀ ነው። የባንክ ዝርዝሩ ከአድሚን ገጽም ሊቀየር ይችላል፤ ሁሉም ስልኮች አንድ የጋራ ዝርዝር ይጠቀማሉ።', en: 'This screen is PIN-protected. The bank list can also be changed from the admin page; all phones share one list.' },
    invalid_pin: { am: 'የተሳሳተ ፒን (ትክክለኛ ፒን፡ 1234)', en: 'Invalid PIN (Default is 1234)' },

    // Admin Common
    today: { am: 'ዛሬ', en: 'Today' },
    month_to_date: { am: 'የወሩ ድምር', en: 'Month to date' },
    total_period: { am: 'ጠቅላላ · {period}', en: 'Total · {period}' },
    n_verified_checks: { am: '{count} የተረጋገጡ ቼኮች', en: '{count} verified checks' },
    by_waiter: { am: 'በየአስተናጋጁ', en: 'By waiter' },
    all_waiters: { am: 'ሁሉም አስተናጋጆች', en: 'All waiters' },
    recent_checks: { am: 'የቅርብ ጊዜ ቼኮች', en: 'Recent checks' },
    time_col: { am: 'ሰዓት', en: 'Time' },
    sale_col: { am: 'ሽያጭ', en: 'Sale' },
    tip_col: { am: 'ጉርሻ', en: 'Tip' },
    status_col: { am: 'ሁኔታ', en: 'Status' },
    total_row: { am: 'ድምር', en: 'Total' },
    count_col: { am: '#', en: '#' },
    status_verified: { am: 'ተረጋግጧል', en: 'Verified' },
    status_approved: { am: 'የጸደቀ', en: 'Approved' },
    status_failed: { am: 'ለግምገማ', en: 'For review' },

    // Admin Web specific
    by_bank: { am: 'በየባንኩ', en: 'By bank' },
    review_card: { am: 'የግምገማ ካርድ', en: 'Review' },
    failed_scans: { am: 'ያልተሳኩ ቃኛዎች', en: 'Failed scans' },
    approved_by_supervisor: { am: 'በተቆጣጣሪ የጸደቁ', en: 'Approved by supervisor' },
    unparsed_sms: { am: 'ያልተተነተነ ኤስኤምኤስ', en: 'Unparsed SMS' },
    daily_account: { am: 'የዕለታዊ ሂሳብ (የወሩ ድምር)', en: 'Daily account (month to date)' },
    date_col: { am: 'ቀን', en: 'Date' },

    // Tip screen
    tab_waiter_view: { am: 'የአስተናጋጅ እይታ', en: 'Waiter' },
    tab_admin_view: { am: 'የአድሚን እይታ', en: 'Admin' },
    stat_today_tips: { am: 'የዛሬ ጉርሻ', en: 'Today' },
    stat_month_tips: { am: 'የወሩ ጉርሻ', en: 'Month' },
    stat_tip_rate: { am: 'የጉርሻ ምጣኔ', en: 'Tip rate' },
    by_bank_verified: { am: 'በባንክ የተረጋገጠ', en: 'By bank (verified)' },
    cash_unverified: { am: 'በጥሬ ገንዘብ (ያልተረጋገጠ)', en: 'Cash (self-reported, unverified)' },
    add_cash_tip_btn: { am: 'የጥሬ ጉርሻ መዝግብ', en: 'Add cash tip' },
    latest_tipped_payments: { am: 'የቅርብ ጊዜ ጉርሻ የተከፈለባቸው', en: 'Latest tipped payments' },
    total_tips: { am: 'ጠቅላላ ጉርሻ', en: 'Total tips' },
    average_rate: { am: 'አማካይ ምጣኔ', en: 'Average rate' },
    check_tile: { am: 'ምርመራ የሚሹ', en: 'Check' },
    tip_percent: { am: 'ጉርሻ %', en: 'Tip %' },
    status_normal: { am: 'መደበኛ', en: 'Normal' },
    status_check_flag: { am: 'ይፈተሽ', en: 'Check' },
    to_refund: { am: 'ተመላሽ የሚደረጉ (በስህተት የተመዘገቡ)', en: 'To refund (marked as mistakes)' },
    nothing_here: { am: 'ምንም የለም', en: 'Nothing here' },
    tip_payout: { am: 'የጉርሻ ክፍፍል', en: 'Tip payout' },
    individual_payout: { am: 'የግል', en: 'Individual' },
    pool_payout: { am: 'የእኩል ድርሻ', en: 'Pool (equal)' },
    payout_col: { am: 'ድርሻ (ETB)', en: 'Payout' },
    tip_rule_footnote: {
      am: "ጉርሻ የሚመዘገበው ገንዘብ ተቀባዩ 'ጉርሻ ነው' ሲል ብቻ ነው። ከአማካይ ምጣኔ 1.5 እጥፍ በላይ የሆኑ አስተናጋጆች ምልክት ይደረግባቸዋል።",
      en: "A tip is recorded only when the cashier answers 'it's a tip'. Waiters over 1.5× the average rate are flagged.",
    },

    // Formatters
    currency_suffix: { am: ' ብር', en: ' ETB' },
  };

  const entry = dictionary[key];
  if (!entry) return key;

  let text = entry[lang] || entry['en'] || key;
  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }
  return text;
};

export const formatEtb = (amount: number, withDecimals: boolean = false): string => {
  if (withDecimals) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US').format(Math.round(amount));
};
