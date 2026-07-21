'use strict';

const dayjs = require('dayjs');
const { reactPdf, React } = require('./transfers_pdf');

function buildTransactionsListModel({ items = [], accounts = [], categories = [] }) {
  const accById = new Map(accounts.map(a => [Number(a.id), a]));
  const catById = new Map(categories.map(c => [Number(c.id), c]));

  const groups = new Map();
  for (const it of items) {
    const d = it.date;
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d).push(it);
  }
  const sortedDates = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : (a > b ? -1 : 0)));

  return { accById, catById, groups, sortedDates };
}

async function createTransactionsListPdfBuffer({ items = [], accounts = [], categories = [], title = 'Mis Transacciones', createdBy = '' }) {
  const { pdf, Document, Page, Text, View, StyleSheet } = reactPdf;
  const h = React.createElement;
  const nfVE = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfUS = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const { accById, catById, groups, sortedDates } = buildTransactionsListModel({ items, accounts, categories });

  const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 10, color: '#111827', fontFamily: 'Helvetica' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 16, fontWeight: 700 },
    meta: { fontSize: 9, color: '#6B7280' },
    dayHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 6 },
    line: { flexGrow: 1, height: 1, backgroundColor: '#E5E7EB' },
    badge: { paddingVertical: 2, paddingHorizontal: 8, backgroundColor: '#F3F4F6', borderRadius: 10, marginHorizontal: 8, fontSize: 9, color: '#374151' },
    list: { flexDirection: 'column' },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', marginBottom: 6 },
    icon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8, fontSize: 10 },
    iconIncome: { backgroundColor: '#ECFDF5', color: '#059669' },
    iconExpense: { backgroundColor: '#FEF2F2', color: '#DC2626' },
    stack: { flexGrow: 1 },
    titleText: { fontSize: 10, marginBottom: 2 },
    subRow: { flexDirection: 'row', alignItems: 'center' },
    pill: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 1, paddingHorizontal: 6, fontSize: 8, color: '#374151', marginRight: 6 },
    amount: { textAlign: 'right' },
    amountMain: { fontSize: 10, fontWeight: 600 },
    amountUsd: { fontSize: 8, color: '#6B7280' },
  });

  const fmtDateLong = (iso) => {
    const dt = new Date(iso);
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${weekdays[dt.getUTCDay()]}, ${months[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
  };

  const dayBlocks = sortedDates.flatMap(date => {
    const dayItems = groups.get(date) || [];
    const rates = dayItems.map(i => Number(i.exchangeRateUsed)).filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
    const rate = rates.length ? rates[Math.floor(rates.length / 2)] : null;
    const header = h(View, { key: `day-${date}`, style: styles.dayHeader }, [
      h(View, { style: styles.line }),
      h(Text, { style: styles.badge }, `${fmtDateLong(date)}${rate ? ` • Tasa: ${nfUS.format(rate)}` : ''}`),
      h(View, { style: styles.line }),
    ]);

    const itemsEls = dayItems.map((it, idx) => {
      const typeKey = (it.type === 'ingreso' || it.type === 'income') ? 'income' : 'expense';
      const acc = accById.get(Number(it.accountId));
      const cat = catById.get(Number(it.categoryId));
      const amountNum = Number(it.amount || 0);
      const amountUsdNum = Number(it.amountUsd || 0);
      const sign = typeKey === 'expense' ? '-' : '+';
      const curr = it.currency || (acc?.currency) || '';
      const currLabel = curr === 'VES' ? 'Bs.' : '$';
      const mainAmount = `${sign}${currLabel}${curr === 'VES' ? nfVE.format(amountNum) : nfUS.format(amountNum)}`;
      const usdTxt = `≈ ${sign}$${nfUS.format(amountUsdNum)} USD`;
      const catName = cat?.name || 'Sin categoría';
      const accName = acc?.name || `#${it.accountId}`;

      return h(View, { key: `item-${date}-${idx}`, style: styles.item, wrap: false }, [
        h(View, { style: [styles.icon, typeKey === 'income' ? styles.iconIncome : styles.iconExpense] },
          h(Text, null, typeKey === 'income' ? '↑' : '↓')
        ),
        h(View, { style: styles.stack }, [
          h(Text, { style: styles.titleText }, String(it.description || '')),
          h(View, { style: styles.subRow }, [
            h(Text, { style: [styles.pill, { borderColor: '#E5E7EB' }] }, catName),
            h(Text, { style: [styles.pill, { marginRight: 0 }] }, `${accName} ${curr ? `• ${curr}` : ''}`),
          ]),
        ]),
        h(View, { style: styles.amount }, [
          h(Text, { style: styles.amountMain }, mainAmount),
          h(Text, { style: styles.amountUsd }, usdTxt),
        ]),
      ]);
    });

    const list = h(View, { key: `list-${date}`, style: styles.list }, itemsEls);
    return [header, list];
  });

  const doc = h(Document, null,
    h(Page, { size: 'A4', style: styles.page }, [
      h(View, { style: styles.header }, [
        h(Text, { style: styles.title }, String(title)),
        h(Text, { style: styles.meta }, `Generado ${dayjs().format('YYYY-MM-DD HH:mm')}${createdBy ? ` • ${createdBy}` : ''}`),
      ]),
      ...dayBlocks,
    ]),
  );

  const buffer = await pdf(doc).toBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

module.exports = { createTransactionsListPdfBuffer, buildTransactionsListModel };
