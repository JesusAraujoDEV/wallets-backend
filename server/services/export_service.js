const { PassThrough, Readable } = require('stream');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');
const txService = require('./transaction_service');
const { models } = require('../libs/sequelize');
const { config } = require('../config/config');
let reactPdf; try { reactPdf = require('@react-pdf/renderer'); } catch (_) { reactPdf = null; }
const React = reactPdf ? require('react') : null;

const createTransfersPdfBuffer = async ({ rows }) => {
  const { pdf, Document, Page, Text, View, StyleSheet } = reactPdf;
  const h = React.createElement;
  const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 9, color: '#111827', fontFamily: 'Helvetica' },
    title: { fontSize: 16, textAlign: 'center', marginBottom: 6, fontWeight: 700 },
    meta: { fontSize: 9, textAlign: 'center', color: '#6B7280', marginBottom: 12 },
    table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6 },
    headerRow: { flexDirection: 'row', backgroundColor: '#111827', color: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 6 },
    row: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    rowAlt: { backgroundColor: '#F9FAFB' },
    cell: { paddingRight: 4 },
    colId: { width: 30 },
    colDate: { width: 50 },
    colFrom: { width: 70 },
    colTo: { width: 70 },
    colCurr: { width: 26 },
    colAmount: { width: 55, textAlign: 'right' },
    colCommission: { width: 55, textAlign: 'right' },
    colConcept: { width: 90 },
    colCreated: { width: 70 },
  });

  const headerCells = [
    h(Text, { style: [styles.cell, styles.colId] }, 'id'),
    h(Text, { style: [styles.cell, styles.colDate] }, 'date'),
    h(Text, { style: [styles.cell, styles.colFrom] }, 'from'),
    h(Text, { style: [styles.cell, styles.colTo] }, 'to'),
    h(Text, { style: [styles.cell, styles.colCurr] }, 'curr'),
    h(Text, { style: [styles.cell, styles.colAmount] }, 'amount'),
    h(Text, { style: [styles.cell, styles.colCommission] }, 'commission'),
    h(Text, { style: [styles.cell, styles.colConcept] }, 'concept'),
    h(Text, { style: [styles.cell, styles.colCreated] }, 'created_by'),
  ];

  const rowsElements = rows.map((r, idx) => h(View, { key: String(r.id ?? idx), style: [styles.row, idx % 2 ? styles.rowAlt : null] }, [
    h(Text, { style: [styles.cell, styles.colId] }, String(r.id ?? '')),
    h(Text, { style: [styles.cell, styles.colDate] }, String(r.date ?? '')),
    h(Text, { style: [styles.cell, styles.colFrom] }, String(r.from_account ?? '')),
    h(Text, { style: [styles.cell, styles.colTo] }, String(r.to_account ?? '')),
    h(Text, { style: [styles.cell, styles.colCurr] }, String(r.currency ?? '')),
    h(Text, { style: [styles.cell, styles.colAmount] }, String(r.amount ?? '')),
    h(Text, { style: [styles.cell, styles.colCommission] }, r.commission ? String(r.commission) : '-'),
    h(Text, { style: [styles.cell, styles.colConcept] }, String(r.concept ?? '')),
    h(Text, { style: [styles.cell, styles.colCreated] }, String(r.created_by ?? '')),
  ]));

  const doc = h(Document, null,
    h(Page, { size: 'A4', style: styles.page }, [
      h(Text, { style: styles.title }, 'Transfers Report'),
      h(Text, { style: styles.meta }, `Generado ${dayjs().format('YYYY-MM-DD HH:mm')}`),
      h(View, { style: styles.table }, [
        h(View, { style: styles.headerRow }, headerCells),
        ...rowsElements,
      ]),
    ]),
  );

  const buffer = await pdf(doc).toBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
};

const buildTransactionsListModel = ({ items = [], accounts = [], categories = [] }) => {
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
};

const createTransactionsListPdfBuffer = async ({ items = [], accounts = [], categories = [], title = 'Mis Transacciones', createdBy = '' }) => {
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
};

async function buildTransfersExport({ userId, fromDate, toDate, accountId, includeCommission, createdBy, format }) {
  const rows = await txService.getTransferExportRows({ userId, fromDate, toDate, accountId, includeCommission, createdBy });
  const filename = `transfers_${dayjs().format('YYYY-MM-DD')}.${format}`;

  if (format === 'xlsx') {
    const stream = new PassThrough();
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream });
    const sheet = workbook.addWorksheet('Transfers');
    sheet.columns = [
      { header: 'id', key: 'id', width: 10 },
      { header: 'date', key: 'date', width: 12 },
      { header: 'from_account', key: 'from_account', width: 32 },
      { header: 'to_account', key: 'to_account', width: 32 },
      { header: 'currency', key: 'currency', width: 8 },
      { header: 'amount', key: 'amount', width: 12 },
      { header: 'commission', key: 'commission', width: 12 },
      { header: 'concept', key: 'concept', width: 60 },
      { header: 'created_by', key: 'created_by', width: 24 },
    ];
    for (const r of rows) sheet.addRow(r).commit();
    await sheet.commit();
    // workbook.commit will end the stream
    workbook.commit().catch(() => {});
    return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename, stream };
  }

  if (format === 'pdf') {
    // Prefer React-PDF for server-side rendering; fallback to PDFKit if missing/disabled
    const useReactPdf = config.exportPdfEngine === 'react-pdf' && reactPdf;
    if (useReactPdf) {
      const pdfBuffer = await createTransfersPdfBuffer({ rows });
      const stream = new PassThrough();
      stream.end(pdfBuffer);
      return { contentType: 'application/pdf', filename, stream };
    }

    // Fallback: simple PDFKit layout
    const stream = new PassThrough();
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(stream);
    doc.fontSize(14).text('Transfers Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10);
    const colWidths = { id: 40, date: 70, from: 110, to: 110, curr: 40, amt: 70 };
    doc.text('id', { continued: true, width: colWidths.id });
    doc.text('date', { continued: true, width: colWidths.date });
    doc.text('from', { continued: true, width: colWidths.from });
    doc.text('to', { continued: true, width: colWidths.to });
    doc.text('curr', { continued: true, width: colWidths.curr });
    doc.text('amount', { continued: true, width: colWidths.amt });
    doc.text('commission');
    doc.moveDown(0.5);
    for (const r of rows) {
      doc.text(String(r.id), { continued: true, width: colWidths.id });
      doc.text(r.date, { continued: true, width: colWidths.date });
      doc.text(r.from_account || '', { continued: true, width: colWidths.from });
      doc.text(r.to_account || '', { continued: true, width: colWidths.to });
      doc.text(r.currency || '', { continued: true, width: colWidths.curr });
      doc.text(String(r.amount), { continued: true, width: colWidths.amt });
      doc.text(String(r.commission || ''));
      doc.moveDown(0.1);
      if (doc.y > doc.page.height - 80) doc.addPage();
    }
    doc.end();
    return { contentType: 'application/pdf', filename, stream };
  }

  throw new Error('Formato no soportado');
}

// New: Build export for transactions list (PDF or XLSX) from provided JSON body
async function buildTransactionsListExport({ data, format = 'pdf' }) {
  const filename = `transactions_${dayjs().format('YYYY-MM-DD')}.${format}`;

  const items = data?.items || [];
  const accounts = data?.accounts || data?.accountsData || [];
  const categories = data?.categories || data?.categoriesData || [];
  const title = data?.title || 'Mis Transacciones';
  const createdBy = data?.createdBy || '';

  // XLSX path
  if (format === 'xlsx') {
    const accById = new Map(accounts.map(a => [Number(a.id), a]));
    const catById = new Map(categories.map(c => [Number(c.id), c]));

    const stream = new PassThrough();
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream });
    const sheet = workbook.addWorksheet('Transactions');
    sheet.columns = [
      { header: 'date', key: 'date', width: 12 },
      { header: 'description', key: 'description', width: 60 },
      { header: 'amount', key: 'amount', width: 12 },
      { header: 'currency', key: 'currency', width: 8 },
      { header: 'amount_usd', key: 'amount_usd', width: 12 },
      { header: 'exchange_rate', key: 'exchange_rate', width: 14 },
      { header: 'category', key: 'category', width: 28 },
      { header: 'category_type', key: 'category_type', width: 14 },
      { header: 'account', key: 'account', width: 28 },
      { header: 'account_currency', key: 'account_currency', width: 8 },
    ];

    for (const it of items) {
      const acc = accById.get(Number(it.accountId));
      const cat = catById.get(Number(it.categoryId));
      sheet.addRow({
        date: it.date || '',
        description: it.description || '',
        amount: Number(it.amount ?? 0),
        currency: it.currency || acc?.currency || '',
        amount_usd: Number(it.amountUsd ?? 0),
        exchange_rate: it.exchangeRateUsed || '',
        category: cat?.name || '',
        category_type: (it.type === 'ingreso' || it.type === 'income') ? 'income' : 'expense',
        account: acc?.name || '',
        account_currency: acc?.currency || '',
      }).commit();
    }
    await sheet.commit();
    workbook.commit().catch(() => {});
    return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename, stream };
  }

  // Prefer React-PDF for fidelity, fallback to PDFKit minimal
  const useReactPdf = config.exportPdfEngine === 'react-pdf' && reactPdf;
  if (useReactPdf) {
    const pdfBuffer = await createTransactionsListPdfBuffer({ items, accounts, categories, title, createdBy });
    const stream = new PassThrough();
    stream.end(pdfBuffer);
    return { contentType: 'application/pdf', filename, stream };
  }

  // Fallback basic layout with PDFKit
  const stream = new PassThrough();
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(stream);
  doc.fontSize(14).text(title || 'Mis Transacciones', { align: 'center' });
  doc.moveDown(0.5);
  const nfUS = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfVE = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let currentDate = null;
  for (const it of items) {
    if (it.date !== currentDate) {
      currentDate = it.date;
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor('#374151').text(`${currentDate}  Tasa: ${it.exchangeRateUsed || ''}`);
      doc.moveDown(0.2).strokeColor('#E5E7EB').moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
      doc.moveDown(0.2).fillColor('#111827');
    }
    const sign = (it.type === 'ingreso' || it.type === 'income') ? '+' : '-';
    const currLabel = it.currency === 'VES' ? 'Bs.' : '$';
    const mainAmount = `${sign}${currLabel}${it.currency==='VES'? nfVE.format(Number(it.amount||0)) : nfUS.format(Number(it.amount||0))}`;
    const usdTxt = `≈ ${sign}$${nfUS.format(Number(it.amountUsd||0))} USD`;
    doc.fontSize(10).text(it.description || '', { continued: true, width: 280 });
    doc.text(mainAmount, { continued: true, align: 'right', width: 120 });
    doc.text(usdTxt, { align: 'right', width: 100 });
    doc.moveDown(0.1);
    if (doc.y > doc.page.height - 80) doc.addPage();
  }
  doc.end();
  return { contentType: 'application/pdf', filename, stream };
}

module.exports = { buildTransfersExport, buildTransactionsListExport };

// Build export directly from DB using the same template as EPIC body-based export
async function buildTransactionsExportFromDb({ userId, format = 'pdf', filters = {}, createdBy }) {
  // 1) Fetch items based on filters used in list endpoints
  const items = await txService.getAllTransactions({ userId, ...filters });
  // 2) Fetch accounts and categories for name/currency/type resolutions
  const [accounts, categories] = await Promise.all([
    models.Account.findAll({
      attributes: ['id', 'name', 'currency'],
      where: { userId },
      raw: true,
    }),
    models.Category.findAll({
      attributes: ['id', 'name', 'type', 'icon', 'color', ['color_name', 'colorName']],
      where: { userId },
      raw: true,
    }),
  ]);

  return buildTransactionsListExport({
    data: { items, accounts, categories, title: 'Transactions Export', createdBy },
    format,
  });
}

module.exports.buildTransactionsExportFromDb = buildTransactionsExportFromDb;
