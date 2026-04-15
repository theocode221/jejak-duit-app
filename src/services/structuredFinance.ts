import type {
  StructuredFinanceRoot,
  StructuredMonthlyOT,
  StructuredOTEntry,
  StructuredMoneyPlanRow,
  StructuredGearRow,
  StructuredSideIncomeRow,
  StructuredEventBudget,
} from '@/types/structuredData';
import type {
  Bill,
  BillStatus,
  BudgetCategory,
  EventBreakdown,
  GearItem,
  GearPriority,
  GearStatus,
  OTEntry,
  SideIncomeTransaction,
  TripEvent,
} from '@/types';

export const REFERENCE_DATE_ISO = '2026-04-06';

/** App month selector → Excel sheet id in structured export */
export const MONTH_KEY_TO_SHEET: Record<string, string> = {
  '2026-03': 'mac26',
  '2026-04': 'apr26',
  '2026-05': 'may26',
};

export const MONTH_LABEL: Record<string, string> = {
  '2026-03': 'March 2026',
  '2026-04': 'April 2026',
  '2026-05': 'May 2026',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;

const META_ROW_LABELS = new Set(
  [
    'total hour',
    'earning',
    'basic',
    'petrol',
    'ot',
    'ioe',
    'medical',
    'deduct ',
    'deduct',
    'est:',
    'est',
    'total',
    'bal ',
    'bal',
  ].map((s) => s.toLowerCase().trim())
);

export function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function isIsoDateString(d: unknown): boolean {
  return typeof d === 'string' && ISO_DATE.test(d);
}

function normalizeKey(d: unknown): string {
  if (d === null || d === undefined) return '';
  return String(d).trim().toLowerCase();
}

/** Parse "27hb" / "8hb" → day of month */
export function parseDueDayHb(s: string): number {
  const m = s.match(/(\d+)\s*hb/i);
  if (m) return Math.min(31, Math.max(1, parseInt(m[1], 10)));
  return 15;
}

export function getSheet(root: StructuredFinanceRoot, monthKey: string): StructuredMonthlyOT | null {
  const id = MONTH_KEY_TO_SHEET[monthKey];
  if (!id) return root.monthlyOT[0] ?? null;
  return root.monthlyOT.find((m) => m.sheet === id) ?? null;
}

export function extractLineAmounts(entries: StructuredOTEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (isIsoDateString(e.date)) continue;
    const key = normalizeKey(e.date);
    if (!key || META_ROW_LABELS.has(key)) continue;
    const val = toNumber(e.hour) + toNumber(e.double);
    map.set(key, val);
  }
  return map;
}

export function extractOTSessions(entries: StructuredOTEntry[]): {
  sessions: OTEntry[];
  totalHours: number;
} {
  const sessions: OTEntry[] = [];
  let totalHours = 0;
  let idx = 0;
  for (const e of entries) {
    if (!isIsoDateString(e.date)) continue;
    const h = toNumber(e.hour) + toNumber(e.double);
    if (h <= 0) continue;
    totalHours += h;
    const iso = String(e.date).slice(0, 10);
    sessions.push({
      id: `ot-${iso}-${idx++}`,
      date: iso,
      hours: h,
      description: `OT session · ${h}h`,
      dayType: 'regular',
    });
  }
  return { sessions, totalHours };
}

export function extractSheetMetrics(entries: StructuredOTEntry[]): {
  totalHourBlock: number;
  earning: number;
  basic: number;
  otCash: number;
  impliedRate: number;
} {
  let totalHourBlock = 0;
  let earning = 0;
  let basic = 0;
  let otCash = 0;
  for (const e of entries) {
    const label = normalizeKey(e.date);
    const h = toNumber(e.hour) + toNumber(e.double);
    if (label === 'total hour') totalHourBlock = h;
    if (label === 'earning') earning = toNumber(e.hour) + toNumber(e.double);
    if (label === 'basic') basic = toNumber(e.hour);
    if (label === 'ot') otCash = toNumber(e.hour) + toNumber(e.double);
  }
  const impliedRate =
    totalHourBlock > 0 && earning > 0 ? earning / totalHourBlock : 19.71;
  return { totalHourBlock, earning, basic, otCash, impliedRate };
}

const CATEGORY_BUCKETS: {
  name: string;
  chartLabel?: string;
  keys: string[];
}[] = [
  {
    name: 'Commitments',
    chartLabel: 'Commit',
    keys: ['kereta', 'mara', 'cc', 'insuran', 'spay', 'hutang', 'atome'],
  },
  { name: 'Savings', chartLabel: 'Save', keys: ['saving'] },
  { name: 'Family', keys: ['parents', 'care'] },
  { name: 'Transport', keys: ['petrol'] },
  {
    name: 'Gear & events',
    chartLabel: 'Gear',
    keys: ['maint', 'hiking', 'gym', 'convo', 'finas', 'dispo', 'depo'],
  },
  { name: 'Telco', chartLabel: 'Telco', keys: ['digi', 'unifi', 'umobile', 'xox'] },
  { name: 'Housing', chartLabel: 'Bilik', keys: ['bilik', 'kereta acc'] },
  {
    name: 'Misc',
    keys: [
      'misc',
      'medical',
      'ioe',
      'rokok',
      'duit raya',
      'mic',
      'mic ',
      'speed electrofuel',
      'mic receiver',
    ],
  },
];

export function lineMapToBudgetCategories(
  lines: Map<string, number>,
  totalRow: number
): BudgetCategory[] {
  const consumed = new Set<string>();
  const categories: BudgetCategory[] = [];
  let id = 1;
  for (const bucket of CATEGORY_BUCKETS) {
    let actual = 0;
    for (const k of bucket.keys) {
      const v = lines.get(k);
      if (v !== undefined) {
        actual += v;
        consumed.add(k);
      }
    }
    const planned = actual > 0 ? Math.round(actual * 1.045) : 0;
    categories.push({
      id: String(id++),
      name: bucket.name,
      chartLabel: bucket.chartLabel,
      planned: planned || (actual > 0 ? actual : 0),
      actual,
    });
  }
  let remainder = 0;
  for (const [k, v] of lines) {
    if (consumed.has(k)) continue;
    if (META_ROW_LABELS.has(k)) continue;
    remainder += v;
  }
  if (remainder > 0) {
    categories.push({
      id: String(id++),
      name: 'Makan & other',
      chartLabel: 'Makan',
      planned: Math.round(remainder * 1.06),
      actual: remainder,
    });
  }
  if (totalRow > 0) {
    const sum = categories.reduce((s, c) => s + c.actual, 0);
    const gap = totalRow - sum;
    if (gap > 80 && gap < totalRow * 0.85) {
      const makan = categories.find((c) => c.name === 'Makan & other');
      if (makan) {
        makan.actual += gap;
        makan.planned = Math.round(makan.actual * 1.05);
      } else {
        categories.push({
          id: String(id++),
          name: 'Makan & other',
          chartLabel: 'Makan',
          planned: Math.round(gap * 1.06),
          actual: gap,
        });
      }
    }
  }
  return categories.filter((c) => c.planned > 0 || c.actual > 0);
}

export function budgetSummary(categories: BudgetCategory[]) {
  const planned = categories.reduce((s, c) => s + c.planned, 0);
  const actual = categories.reduce((s, c) => s + c.actual, 0);
  return { planned, actual, variance: planned - actual };
}

/** ---- Money plans 2026 → event budgets ---- */
export function parseEventMoneyBlocks(plans: StructuredMoneyPlanRow[]) {
  const doneI = plans.findIndex((p) => p.item === 'done');
  const balI = plans.findIndex((p) => p.item === 'bal');
  const planned = new Map<string, number>();
  const actual = new Map<string, number>();
  const variance = new Map<string, number>();
  if (doneI < 0 || balI < 0) {
    return { planned, actual, variance };
  }
  const absorb = (rows: StructuredMoneyPlanRow[], target: Map<string, number>) => {
    for (const r of rows) {
      if (!r.item || r.item === 'total' || r.item === 'mytax') continue;
      const n = toNumber(r.expenses);
      target.set(r.item.toLowerCase(), n);
    }
  };
  absorb(plans.slice(0, doneI), planned);
  absorb(plans.slice(doneI + 1, balI), actual);
  absorb(plans.slice(balI + 1), variance);
  return { planned, actual, variance };
}

function breakdownFromTwincity(
  rows: { item?: string | null; amount?: number | string | null }[] | undefined
): EventBreakdown | null {
  if (!rows?.length) return null;
  const b: EventBreakdown = {
    transport: 0,
    hotel: 0,
    makan: 0,
    registration: 0,
    shopping: 0,
    others: 0,
  };
  for (const r of rows) {
    const label = normalizeKey(r.item);
    const amt = toNumber(r.amount);
    if (label.includes('transport')) b.transport += amt;
    else if (label.includes('makan')) b.makan += amt;
    else if (label.includes('gambar') || label.includes('photo')) b.shopping += amt;
    else if (label === 'total') continue;
    else b.others += amt;
  }
  return b;
}

function defaultBreakdown(
  planned: number,
  actual: number
): EventBreakdown {
  const spend = actual > 0 ? actual : planned * 0.4;
  const p = planned > 0 ? planned : spend;
  return {
    transport: Math.round(p * 0.22 * 100) / 100,
    hotel: Math.round(p * 0.18 * 100) / 100,
    makan: Math.round(p * 0.2 * 100) / 100,
    registration: Math.round(p * 0.12 * 100) / 100,
    shopping: Math.round(p * 0.15 * 100) / 100,
    others: Math.max(0, spend - p * 0.67),
  };
}

function medanEventFromExport(eb: StructuredEventBudget): TripEvent {
  let transport = 0;
  let hotel = 0;
  let makan = 0;
  let shopping = 0;
  let othersBucket = 0;
  for (const row of eb.perHeadItems) {
    const it = normalizeKey(row.item);
    const a = toNumber(row.amount);
    if (it.includes('flight')) transport += a;
    else if (it.includes('accom')) hotel += a;
    else if (it.includes('transport')) transport += a;
    else if (it.includes('insur')) othersBucket += a;
    else if (it.includes('per head')) continue;
    else othersBucket += a;
  }
  const stayActual = eb.stayBreakdown.reduce((s, r) => s + toNumber(r.actual), 0);
  hotel += stayActual;
  const planned =
    toNumber(eb.totals.actualPerHeadTotal) +
    toNumber(eb.totals.actualStayTotal) +
    transport +
    hotel;
  const actualSpending =
    toNumber(eb.totals.actualStayTotal) +
    toNumber(eb.totals.actualPerHeadTotal) +
    transport * 0.3;
  return {
    id: 'ev-medan',
    name: 'Medan 2026 (export)',
    eventDate: '2026-05-02',
    plannedBudget: Math.round(planned * 100) / 100 || 3400,
    actualSpending: Math.round(actualSpending * 100) / 100,
    breakdown: {
      transport: Math.round(transport * 100) / 100,
      hotel: Math.round(hotel * 100) / 100,
      makan,
      registration: 0,
      shopping,
      others: Math.round(othersBucket * 100) / 100,
    },
  };
}

export function buildTripEvents(root: StructuredFinanceRoot): TripEvent[] {
  const { planned, actual } = parseEventMoneyBlocks(root.moneyPlans2026.plans ?? []);
  const twBreak = breakdownFromTwincity(root.moneyPlans2026.twincity);
  const list: TripEvent[] = [];

  for (const ev of root.events2026) {
    const key = ev.event.toLowerCase();
    const pB = planned.get(key) ?? 0;
    const aS = actual.get(key) ?? 0;
    const breakdown =
      key === 'twincity' && twBreak
        ? twBreak
        : defaultBreakdown(pB || aS || 400, aS || pB * 0.5);
    list.push({
      id: `ev-${key}`,
      name: titleCase(ev.event),
      eventDate: ev.date.slice(0, 10),
      plannedBudget: pB || aS || 400,
      actualSpending: aS,
      breakdown,
    });
  }
  for (const eb of root.eventBudgets) {
    list.push(medanEventFromExport(eb));
  }
  return list;
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** ---- Gear ---- */
const GEAR_SKIP = new Set([
  'done',
  'total',
  'technical gear',
  'trail run',
  'video',
  'others',
  'sleeping system',
]);

export function normalizeGear(rows: StructuredGearRow[]): GearItem[] {
  const out: GearItem[] = [];
  let id = 0;
  for (const r of rows) {
    const nameRaw = r.item;
    if (nameRaw === null || nameRaw === undefined) continue;
    if (typeof nameRaw === 'number') continue;
    const name = String(nameRaw).trim();
    if (!name || GEAR_SKIP.has(name.toLowerCase())) continue;
    const extraStr =
      r.extra !== null && r.extra !== undefined ? String(r.extra) : '';
    let addExtra = 0;
    if (typeof r.extra === 'number') addExtra = r.extra;
    else if (typeof r.extra === 'string' && /[\d.]/.test(extraStr))
      addExtra = toNumber(r.extra);
    const price = toNumber(r.amount) + addExtra;
    const status: GearStatus = /kiv/i.test(extraStr) ? 'kiv' : 'planned';
    if (price <= 0 && status !== 'kiv') continue;
    const priority: GearPriority =
      price > 400 ? 'high' : price > 120 ? 'medium' : 'low';
    out.push({
      id: `g-${id++}`,
      name,
      category: inferGearCategory(name),
      targetPrice: price > 0 ? Math.round(price * 100) / 100 : 0,
      status,
      priority,
      linkedPurpose: 'Excel gear list',
    });
  }
  const dedup = new Map<string, GearItem>();
  for (const g of out) {
    const k = g.name.toLowerCase();
    const prev = dedup.get(k);
    if (!prev || g.targetPrice > prev.targetPrice) dedup.set(k, g);
  }
  return [...dedup.values()].filter((g) => g.targetPrice > 0 || g.status === 'kiv');
}

function inferGearCategory(name: string): string {
  const n = name.toLowerCase();
  if (/kasut|shoe|trail|vest|flask|batt|stick|headlamp|glove|buff|topi|tent|sleep|mat|stove|bladder|carrier|backpack|daypack|drone/i.test(n))
    return 'Outdoor / tech';
  if (/monitor|meja|plywood|pvc|karpet|bilik/i.test(n)) return 'Space setup';
  return 'General';
}

/** ---- Side income ---- */
const SYNTH_MONTHS = ['2026-03', '2026-04', '2026-05'] as const;

export function normalizeSideIncome(rows: StructuredSideIncomeRow[]): SideIncomeTransaction[] {
  const out: SideIncomeTransaction[] = [];
  rows.forEach((r, i) => {
    const amt = toNumber(r.amount);
    if (amt === 0 && !r.description) return;
    const desc = (r.description ?? 'Entry').trim() || 'Entry';
    const type = amt >= 0 ? 'income' : 'expense';
    out.push({
      id: `s-${i}`,
      name: desc,
      type,
      amount: Math.abs(amt),
      month: SYNTH_MONTHS[i % SYNTH_MONTHS.length],
      source: type === 'income' ? 'Inflow' : 'Outflow',
    });
  });
  return out;
}

export function sideTotalsForMonth(
  txs: SideIncomeTransaction[],
  monthKey: string
) {
  const slice = txs.filter((t) => t.month === monthKey);
  const income = slice.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = slice.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, net: income - expense, items: slice };
}

/** ---- Bills ---- */
export function buildBills(
  root: StructuredFinanceRoot,
  monthKey: string
): Bill[] {
  const sheet = getSheet(root, monthKey);
  const lines = sheet ? extractLineAmounts(sheet.entries) : new Map<string, number>();
  const ref = new Date(REFERENCE_DATE_ISO + 'T12:00:00');
  const refDay = ref.getDate();

  return root.dueDates.map((d, i) => {
    const dueDay = parseDueDayHb(d.dueDate);
    const key = d.bill.toLowerCase();
    let amount = 0;
    let amountSource: Bill['amountSource'] | undefined;
    if (key.includes('kereta')) amount = lines.get('kereta') ?? 427;
    else if (key.includes('cc')) {
      amount = lines.get('cc') ?? 225;
      amountSource = 'credit_card';
    } else if (key.includes('spay')) {
      amount = lines.get('spay') ?? 217;
      amountSource = 'spaylater';
    } else if (key.includes('atome')) {
      amount = lines.get('atome') ?? 0;
      amountSource = 'atome';
    } else if (key.includes('asb')) amount = lines.get('mara') ?? 100;
    else if (key.includes('xox')) amount = lines.get('xox') ?? 35;
    else amount = 50;

    let status: BillStatus = 'unpaid';
    if (dueDay < refDay) status = 'paid';

    const row: Bill = {
      id: `b-${i}`,
      name: titleCase(d.bill),
      dueDay,
      amount: Math.round(amount * 100) / 100,
      status,
      reminder: d.dueDate,
      category: 'Fixed',
    };
    if (amountSource) {
      row.amountSource = amountSource;
    }
    return row;
  });
}

/** ---- Extra / bonus from export ---- */
export function extractExtraIncomeLines(root: StructuredFinanceRoot): {
  label: string;
  amount: number;
}[] {
  const lines: { label: string; amount: number }[] = [];
  const bonus = root.moneyPlans2026.bonus2026;
  if (bonus) {
    for (const b of bonus) {
      const a = toNumber(b.amount);
      if (a === 0 || String(b.amount) === 'BAL') continue;
      lines.push({
        label: b.item ? `${b.item} (bonus pool)` : 'Bonus pool movement',
        amount: Math.abs(a),
      });
    }
  }
  const sell = root.moneyPlans2026.sellFonLaptop;
  if (sell) {
    for (const s of sell) {
      const a = toNumber(s.amount);
      if (a <= 0) continue;
      lines.push({
        label: s.item ?? 'Resale',
        amount: a,
      });
    }
  }
  return lines.slice(0, 8);
}

export function bonusAllocationFromExport(root: StructuredFinanceRoot) {
  const first = root.moneyPlans2026.bonus2026?.[0];
  const amt = toNumber(first?.amount);
  return {
    label: 'Bonus / windfall (from workbook)',
    amount: amt || 3000,
    allocatedTo: 'Split across savings & trips (see money plan)',
  };
}
