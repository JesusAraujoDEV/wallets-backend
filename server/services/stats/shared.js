function parseIdFilter(input) {
  if (!input) return null;
  const parts = Array.isArray(input) ? input : String(input).split(',');
  const ids = parts.map((s) => parseInt(String(s).trim(), 10)).filter((n) => Number.isInteger(n) && n > 0);
  return ids.length ? Array.from(new Set(ids)) : null;
}

function parseSinglePositiveId(input) {
  if (input === undefined || input === null || input === '') return null;
  const parsed = parseInt(input, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function assertDateStr(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s))) throw new Error('Fecha inválida. Use YYYY-MM-DD');
  return s;
}

function formatPeriod(dt, unit) {
  const d = dt instanceof Date ? dt : new Date(dt);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  if (unit === 'month') return `${y}-${m}`;
  // week: use ISO week number approximation (Monday-based)
  const date = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // 0=Mon..6=Sun
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const week1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - week1) / 86400000 - 3) / 7);
  const wy = date.getUTCFullYear();
  return `${wy}-W${String(week).padStart(2, '0')}`;
}

function quantiles(sortedVals) {
  const n = sortedVals.length;
  if (n === 0) return { q1: 0, median: 0, q3: 0 };
  const pos = (p) => (p * (n - 1));
  const interp = (idx) => {
    const i = Math.floor(idx), f = idx - i;
    if (i + 1 < n) return sortedVals[i] * (1 - f) + sortedVals[i + 1] * f;
    return sortedVals[i];
  };
  return { q1: interp(pos(0.25)), median: interp(pos(0.5)), q3: interp(pos(0.75)) };
}

function firstOfMonth(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function daysInMonth(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); }

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEKDAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

module.exports = {
  parseIdFilter,
  parseSinglePositiveId,
  assertDateStr,
  formatPeriod,
  quantiles,
  firstOfMonth,
  daysInMonth,
  MONTH_NAMES,
  WEEKDAYS,
};
