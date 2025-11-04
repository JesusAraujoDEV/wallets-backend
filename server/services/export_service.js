const { PassThrough, Readable } = require('stream');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');
const txService = require('./transaction_service');
const { models } = require('../libs/sequelize');
const { config } = require('../config/config');
let puppeteer; try { puppeteer = require('puppeteer'); } catch (_) { puppeteer = null; }

function renderTransfersHtml(rows) {
  const css = `
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 24px; }
    h1 { text-align: center; font-size: 20px; margin-bottom: 16px; color: #111827; }
    .meta { font-size: 12px; color: #6B7280; text-align: center; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { background: #111827; color: white; text-align: left; padding: 8px; }
    tbody td { padding: 8px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
    tbody tr:nth-child(odd) { background: #F9FAFB; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: #6B7280; }
  `;
  const escape = (s) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const rowsHtml = rows.map(r => `
      <tr>
        <td>${escape(r.id)}</td>
        <td>${escape(r.date)}</td>
        <td>${escape(r.from_account || '')}</td>
        <td>${escape(r.to_account || '')}</td>
        <td>${escape(r.currency || '')}</td>
        <td class="num">${escape(r.amount)}</td>
        <td class="num">${r.commission ? escape(r.commission) : '<span class="muted">-</span>'}</td>
        <td>${escape(r.concept || '')}</td>
        <td>${escape(r.created_by || '')}</td>
      </tr>
    `).join('');
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>${css}</style>
      <title>Transfers Report</title>
    </head>
    <body>
      <h1>Transfers Report</h1>
      <div class="meta">Generado ${dayjs().format('YYYY-MM-DD HH:mm')}</div>
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>date</th>
            <th>from</th>
            <th>to</th>
            <th>curr</th>
            <th>amount</th>
            <th>commission</th>
            <th>concept</th>
            <th>created_by</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
  </html>`;
}

// --- New: Transactions List (EPIC) HTML ---
function renderTransactionsListHtml({ items = [], accounts = [], categories = [], title = 'Transactions', createdBy = '' }) {
  const css = `
    * { box-sizing: border-box; }
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji','Segoe UI Emoji'; color: #111827; margin: 24px; }
    header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    h1 { font-size: 20px; margin: 0; color: #111827; }
    .meta { font-size: 12px; color: #6B7280; }
    .day { display:flex; align-items:center; gap:8px; margin: 22px 0 10px; color:#374151; }
    .day .line { flex:1; height:1px; background:#E5E7EB; }
    .badge { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; background:#F3F4F6; color:#374151; font-size:11px; }
    .list { display:flex; flex-direction:column; gap:10px; }
    .item { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px; border:1px solid #E5E7EB; background:#FFFFFF; }
    .icon { width:28px; height:28px; border-radius:999px; display:flex; align-items:center; justify-content:center; font-size:14px; }
    .icon.income { background:#ECFDF5; color:#059669; }
    .icon.expense { background:#FEF2F2; color:#DC2626; }
    .stack { flex:1; }
    .title { font-size:13px; color:#111827; margin:0 0 2px 0; }
    .sub { display:flex; gap:8px; align-items:center; color:#6B7280; font-size:11px; }
    .pill { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; font-size:11px; border:1px solid #E5E7EB; color:#374151; }
    .category { border:1px solid #E5E7EB; }
    .amount { text-align:right; }
    .amount .main { font-weight:600; font-variant-numeric: tabular-nums; }
    .amount .usd { color:#6B7280; font-size:11px; }
  `;
  const escape = (s) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const nfVE = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfUS = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const accById = new Map(accounts.map(a => [Number(a.id), a]));
  const catById = new Map(categories.map(c => [Number(c.id), c]));

  // group items by date desc
  const groups = new Map();
  for (const it of items) {
    const d = it.date;
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d).push(it);
  }
  const sortedDates = Array.from(groups.keys()).sort((a,b)=> a<b ? 1 : (a>b ? -1 : 0));

  const fmtDateLong = (iso) => {
    const dt = new Date(iso);
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${weekdays[dt.getUTCDay()]}, ${months[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
  };

  const dayBlocks = sortedDates.map(date => {
    const dayItems = groups.get(date) || [];
    // if mixed rates in same day, take median
    const rates = dayItems.map(i => Number(i.exchangeRateUsed)).filter(v => Number.isFinite(v) && v>0).sort((a,b)=>a-b);
    const rate = rates.length ? (rates[Math.floor(rates.length/2)]) : null;
    const itemsHtml = dayItems.map(it => {
      const typeKey = (it.type === 'ingreso' || it.type === 'income') ? 'income' : 'expense';
      const acc = accById.get(Number(it.accountId));
      const cat = catById.get(Number(it.categoryId));
      const amountNum = Number(it.amount || 0);
      const amountUsdNum = Number(it.amountUsd || 0);
      const sign = typeKey === 'expense' ? '-' : '+';
      const curr = it.currency || (acc?.currency) || '';
      const currLabel = curr === 'VES' ? 'Bs.' : '$';
      const mainAmount = `${sign}${currLabel}${curr==='VES'? nfVE.format(amountNum) : nfUS.format(amountNum)}`;
      const usdTxt = `≈ ${sign}$${nfUS.format(amountUsdNum)} USD`;
      const catColor = cat?.color || '#E5E7EB';
      const catName = cat?.name || 'Sin categoría';
      const accName = acc?.name || `#${it.accountId}`;
      return `
        <div class="item">
          <div class="icon ${typeKey}">${typeKey==='income'?'⬆':'⬇'}</div>
          <div class="stack">
            <div class="title">${escape(it.description)}</div>
            <div class="sub">
              <span class="pill" style="background:${catColor}22; border-color:${catColor}55; color:#111827">${escape(catName)}</span>
              <span class="pill">${escape(accName)} <span class="meta">${escape(curr)}</span></span>
            </div>
          </div>
          <div class="amount">
            <div class="main">${mainAmount}</div>
            <div class="usd">${usdTxt}</div>
          </div>
        </div>`;
    }).join('');
    return `
      <div class="day">
        <div class="line"></div>
        <div class="badge">${escape(fmtDateLong(date))}${rate?` • Tasa: ${nfUS.format(rate)}`:''}</div>
        <div class="line"></div>
      </div>
      <div class="list">${itemsHtml}</div>`;
  }).join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>${css}</style>
      <title>${escape(title)}</title>
    </head>
    <body>
      <header>
        <h1>${escape(title)}</h1>
        <div class="meta">Generado ${dayjs().format('YYYY-MM-DD HH:mm')} ${createdBy?`• ${escape(createdBy)}`:''}</div>
      </header>
      ${dayBlocks}
    </body>
  </html>`;
}

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
    // Prefer Puppeteer (HTML->PDF) for better design; fallback to PDFKit if missing/disabled
    const usePuppeteer = config.exportPdfEngine === 'puppeteer' && puppeteer;
    if (usePuppeteer) {
      const html = renderTransfersHtml(rows);
      const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' },
        });
        const stream = new PassThrough();
        stream.end(pdfBuffer);
        return { contentType: 'application/pdf', filename, stream };
      } finally {
        await browser.close();
      }
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

  const html = renderTransactionsListHtml({
    items: data?.items || [],
    accounts: data?.accounts || data?.accountsData || [],
    categories: data?.categories || data?.categoriesData || [],
    title: data?.title || 'Mis Transacciones',
    createdBy: data?.createdBy || '',
  });

  // XLSX path
  if (format === 'xlsx') {
    const items = data?.items || [];
    const accounts = data?.accounts || data?.accountsData || [];
    const categories = data?.categories || data?.categoriesData || [];
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

  // Prefer puppeteer for fidelity, fallback to PDFKit minimal
  const usePuppeteer = config.exportPdfEngine === 'puppeteer' && puppeteer;
  if (usePuppeteer) {
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '12mm', left: '10mm' } });
      const stream = new PassThrough();
      stream.end(pdfBuffer);
      return { contentType: 'application/pdf', filename, stream };
    } finally {
      await browser.close();
    }
  }

  // Fallback basic layout with PDFKit
  const stream = new PassThrough();
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(stream);
  doc.fontSize(14).text(data?.title || 'Mis Transacciones', { align: 'center' });
  doc.moveDown(0.5);
  const items = data?.items || [];
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
