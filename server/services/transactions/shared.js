const { Op, col, where: sqWhere } = require('sequelize');

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function fromCents(valueInCents) {
  return Number((Number(valueInCents) / 100).toFixed(2));
}

function parseIdFilter(input) {
  if (!input) return null;
  const parts = Array.isArray(input) ? input : String(input).split(',');
  const ids = parts
    .map((s) => parseInt(String(s).trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return null;
  // unique
  return Array.from(new Set(ids));
}

function parseDebtIdFilter(input) {
  if (input === undefined || input === '') return undefined; // no filtrar
  if (input === null || input === 'null') return null; // IS NULL
  const parsed = parseInt(input, 10);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return undefined; // valor inválido, no filtrar
}

function monthToRange(monthStr) {
  // monthStr expected 'YYYY-MM'
  if (!monthStr || typeof monthStr !== 'string') return null;
  const [y, m] = monthStr.split('-').map((v) => parseInt(v, 10));
  if (!y || !m || m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // last day of month
  const toISO = (d) => d.toISOString().slice(0, 10);
  return { from: toISO(start), to: toISO(end) };
}

function parseAnalyticsBehavior(val) {
  if (val === undefined || val === null || val === '') return null;
  const v = String(val).toLowerCase();
  if (v === 'include') return 'include';
  if (v === 'exclude') return 'exclude';
  return null;
}

function parseSinglePositiveId(input) {
  if (input === undefined || input === null || input === '') return null;
  const parsed = parseInt(input, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function buildTxFilterWhere({ userId, q, categoryId, accountId, debtId, date, dateFrom, dateTo, month }) {
  const whereTx = { userId };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];
  const parsedDebtId = parseDebtIdFilter(debtId);
  if (parsedDebtId !== undefined) whereTx.debtId = parsedDebtId;

  const monthRange = monthToRange(month);
  const from = dateFrom || monthRange?.from || null;
  const to = dateTo || monthRange?.to || null;
  if (from || to) {
    whereTx.date = {};
    if (from) whereTx.date[Op.gte] = from;
    if (to) whereTx.date[Op.lte] = to;
  } else if (date) {
    whereTx.date = date;
  }
  if (q) {
    whereTx[Op.or] = [
      { description: { [Op.iLike]: `%${q}%` } },
      sqWhere(col('Category.name'), { [Op.iLike]: `%${q}%` })
    ];
  }
  return whereTx;
}

function parseMonthStr(m) {
  if (!m || typeof m !== 'string') return null;
  const m2 = m.trim();
  const match = m2.match(/^\d{4}-\d{2}$/);
  if (!match) return null;
  const [y, mo] = m2.split('-').map(n => parseInt(n, 10));
  if (mo < 1 || mo > 12) return null;
  return { y, mo };
}

function monthRangeInclusive(fromMonth, toMonth) {
  const a = parseMonthStr(fromMonth);
  const b = toMonth ? parseMonthStr(toMonth) : a;
  if (!a || !b) return null;
  const fromDate = new Date(Date.UTC(a.y, a.mo - 1, 1));
  const toDate = new Date(Date.UTC(b.y, b.mo, 0));
  if (toDate < fromDate) return null;
  return { from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10) };
}

function monthsBetweenList(fromMonth, toMonth) {
  const a = parseMonthStr(fromMonth);
  const b = toMonth ? parseMonthStr(toMonth) : a;
  if (!a || !b) return [];
  const out = [];
  let y = a.y, m = a.mo;
  while (y < b.y || (y === b.y && m <= b.mo)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

module.exports = {
  toCents,
  fromCents,
  parseIdFilter,
  parseDebtIdFilter,
  monthToRange,
  parseAnalyticsBehavior,
  parseSinglePositiveId,
  buildTxFilterWhere,
  parseMonthStr,
  monthRangeInclusive,
  monthsBetweenList,
};
