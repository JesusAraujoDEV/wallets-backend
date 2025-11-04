const { PassThrough, Readable } = require('stream');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');
const txService = require('./transaction_service');
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

module.exports = { buildTransfersExport };
