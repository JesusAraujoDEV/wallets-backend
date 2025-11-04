const { PassThrough } = require('stream');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');
const txService = require('./transaction_service');

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
