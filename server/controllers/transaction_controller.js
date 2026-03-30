const txService = require('../services/transaction_service');
const { buildTransfersExport, buildTransactionsListExport, buildTransactionsExportFromDb } = require('../services/export_service');
const { BadRequestError, NotFoundError } = require('../utils/errors');

async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const { grouped, pageSize, cursorDate, q, type, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior } = req.query;
    if (typeof analyticsBehavior !== 'undefined') {
      const v = String(analyticsBehavior).toLowerCase();
      if (v !== 'include' && v !== 'exclude') throw new BadRequestError('analyticsBehavior must be include|exclude');
    }
    if (grouped === '1') {
      const result = await txService.getGroupedTransactions({
        userId,
        pageSize: parseInt(pageSize) || 20,
        cursorDate,
        q,
        type,
        categoryId,
        accountId,
        date,
        dateFrom,
        dateTo,
        month,
        analyticsBehavior,
      });
      return res.json(result);
    }
    const rows = await txService.getAllTransactions({ userId, q, type, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior });
    return res.json(rows);
  } catch (e) { return next(e); }
}

async function create(req, res, next) {
  try {
    const result = await txService.createTransaction(req.user.id, req.body);
    return res.status(201).json({ ok: true, newId: result.tx.id, tx: result.tx, commissionTx: result.commissionTx || null });
  } catch (e) { return next(e); }
}

async function transfer(req, res, next) {
  try {
    const result = await txService.createTransfer(req.user.id, req.body);
    return res.status(201).json({ ok: true, transfer: result });
  } catch (e) { return next(e); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.query.id, 10);
    if (!id || Number.isNaN(id)) throw new BadRequestError('Parámetro id inválido.');
    const result = await txService.updateTransaction(id, req.user.id, req.body);
    if (!result) throw new NotFoundError('Transacción no encontrada o no pertenece al usuario.');
    return res.json({ ok: true, tx: result.tx, message: 'Transacción actualizada' });
  } catch (e) { return next(e); }
}

async function remove(req, res, next) {
  try {
    const id = parseInt(req.query.id, 10);
    const result = await txService.deleteTransaction(id, req.user.id);
    if (!result.rowCount) throw new NotFoundError('Transacción no encontrada o no pertenece al usuario.');
    return res.json({ ok: true });
  } catch (e) { return next(e); }
}

async function confirm(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) throw new BadRequestError('Parámetro id inválido.');

    const result = await txService.confirmPendingTransaction(id, req.user.id, req.body || {});
    if (!result) throw new NotFoundError('Transacción no encontrada o no pertenece al usuario.');

    return res.json({ ok: true, tx: result.tx, message: 'Transacción confirmada' });
  } catch (e) { return next(e); }
}

async function exportTransfers(req, res, next) {
  try {
    const userId = req.user.id;
    const payload = req.method === 'GET' ? req.query : req.body;
  const format = String((payload && payload.format) || (req.query && req.query.format) || 'xlsx').toLowerCase();
    const fromDate = payload.from_date;
    const toDate = payload.to_date;
    const accountId = payload.account_id || payload.accountId;
    const includeCommission = String(payload.include_commission || payload.includeCommission || 'false').toLowerCase() === 'true';

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (format !== 'xlsx' && format !== 'pdf') throw new BadRequestError('Formato inválido. Use pdf o xlsx');

    // EPIC: if the client posts a transactions JSON (items, accounts, categories), render a fancy export (PDF or XLSX)
    if (req.method === 'POST' && Array.isArray(payload?.items)) {
      const { contentType, filename, stream } = await buildTransactionsListExport({ data: payload, format });
      res.set('Cache-Control', 'no-store');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      stream.on('error', () => { if (!res.headersSent) res.status(500); res.end(); });
      return stream.pipe(res);
    }

    // Default transfers export flow
    if (fromDate && !dateRe.test(fromDate)) throw new BadRequestError('from_date inválida. Use YYYY-MM-DD');
    if (toDate && !dateRe.test(toDate)) throw new BadRequestError('to_date inválida. Use YYYY-MM-DD');

    const { contentType, filename, stream } = await buildTransfersExport({
      userId,
      fromDate,
      toDate,
      accountId,
      includeCommission,
      createdBy: req.user.email || req.user.id,
      format,
    });

    res.set('Cache-Control', 'no-store');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    stream.on('error', () => {
      if (!res.headersSent) res.status(500);
      res.end();
    });
    return stream.pipe(res);
  } catch (e) {
    if (res.headersSent) return req.socket.destroy();
    return next(e);
  }
}

async function exportAll(req, res, next) {
  try {
    const userId = req.user.id;
    const payload = req.query;
    const format = String((payload && payload.format) || 'pdf').toLowerCase();
    if (format !== 'pdf' && format !== 'xlsx') throw new BadRequestError('Formato inválido. Use pdf o xlsx');

    const { q, type, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior } = payload;
    if (typeof analyticsBehavior !== 'undefined') {
      const v = String(analyticsBehavior).toLowerCase();
      if (v !== 'include' && v !== 'exclude') throw new BadRequestError('analyticsBehavior must be include|exclude');
    }
    const filters = { q, type, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior };

    const { contentType, filename, stream } = await buildTransactionsExportFromDb({
      userId,
      format,
      filters,
      createdBy: req.user.email || req.user.id,
    });

    res.set('Cache-Control', 'no-store');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    stream.on('error', () => { if (!res.headersSent) res.status(500); res.end(); });
    return stream.pipe(res);
  } catch (e) { return next(e); }
}

module.exports = { list, create, transfer, update, remove, confirm, exportTransfers, exportAll };