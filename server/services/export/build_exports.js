'use strict';

const { PassThrough } = require('stream');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');
const txService = require('../transaction_service');
const { models } = require('../../libs/sequelize');
const { config } = require('../../config/config');
const { createTransfersPdfBuffer, reactPdf } = require('./transfers_pdf');
const { createTransactionsListPdfBuffer } = require('./transactions_pdf');

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
    workbook.commit().catch(() => {});
    return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename, stream };
  }

  if (format === 'pdf') {
    const useReactPdf = config.exportPdfEngine === 'react-pdf' && reactPdf;
    if (useReactPdf) {
      const pdfBuffer = await createTransfersPdfBuffer({ rows });
      const stream = new PassThrough();
      stream.end(pdfBuffer);
      return { contentType: 'application/pdf', filename, stream };
    }

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

async function buildTransactionsListExport({ data, format = 'pdf' }) {
  const filename = `transactions_${dayjs().format('YYYY-MM-DD')}.${format}`;

  const items = data?.items || [];
  const accounts = data?.accounts || data?.accountsData || [];
  const categories = data?.categories || data?.categoriesData || [];
  const title = data?.title || 'Mis Transacciones';
  const createdBy = data?.createdBy || '';

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

  const useReactPdf = config.exportPdfEngine === 'react-pdf' && reactPdf;
  if (useReactPdf) {
    const pdfBuffer = await createTransactionsListPdfBuffer({ items, accounts, categories, title, createdBy });
    const stream = new PassThrough();
    stream.end(pdfBuffer);
    return { contentType: 'application/pdf', filename, stream };
  }

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

async function buildTransactionsExportFromDb({ userId, format = 'pdf', filters = {}, createdBy }) {
  const items = await txService.getAllTransactions({ userId, ...filters });
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

module.exports = { buildTransfersExport, buildTransactionsListExport, buildTransactionsExportFromDb };
