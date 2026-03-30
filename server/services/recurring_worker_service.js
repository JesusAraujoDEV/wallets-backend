const cron = require('node-cron');
const dayjs = require('dayjs');
const { Op } = require('sequelize');

const { sequelize, models } = require('../libs/sequelize');
const transactionService = require('./transaction_service');

let recurringWorkerTask = null;

function calculateNextDate(currentDate, frequency) {
  const base = dayjs(currentDate);
  if (!base.isValid()) {
    throw new Error('Fecha recurrente invalida.');
  }

  if (frequency === 'weekly') {
    return base.add(1, 'week').format('YYYY-MM-DD');
  }
  if (frequency === 'monthly') {
    return base.add(1, 'month').format('YYYY-MM-DD');
  }
  if (frequency === 'yearly') {
    return base.add(1, 'year').format('YYYY-MM-DD');
  }

  throw new Error('Frecuencia recurrente invalida.');
}

async function processRecurringTransaction(recurringId, userIdFilter, today) {
  return await sequelize.transaction(async (transaction) => {
    const where = {
      id: recurringId,
      isActive: true,
      nextDate: { [Op.lte]: today },
    };
    if (userIdFilter != null) where.userId = userIdFilter;

    const recurring = await models.RecurringTransaction.findOne({
      where,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!recurring) return false;

    const isAutoMode = recurring.executionMode === 'auto';
    if (isAutoMode && recurring.accountId == null) {
      throw new Error('Las recurrencias en modo auto requieren accountId.');
    }

    if (recurring.accountId != null) {
      const account = await models.Account.findOne({
        where: { id: recurring.accountId, userId: recurring.userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!account) {
        throw new Error('Cuenta de transaccion recurrente no valida.');
      }
    }

    await transactionService.createTransactionInT(transaction, recurring.userId, {
      description: recurring.description,
      amount: recurring.amount,
      currency: recurring.currency,
      date: recurring.nextDate,
      categoryId: recurring.categoryId,
      accountId: recurring.accountId,
      status: isAutoMode ? 'completed' : 'pending',
      applyBalance: isAutoMode,
    });

    const newNextDate = calculateNextDate(recurring.nextDate, recurring.frequency);
    await recurring.update({ nextDate: newNextDate }, { transaction });

    return true;
  });
}

async function processDueTransactions(userId = null) {
  const today = dayjs().format('YYYY-MM-DD');

  const where = {
    isActive: true,
    nextDate: { [Op.lte]: today },
  };
  if (userId != null) where.userId = userId;

  const dueRecords = await models.RecurringTransaction.findAll({
    attributes: ['id'],
    where,
    order: [['nextDate', 'ASC'], ['id', 'ASC']],
    raw: true,
  });

  let processedCount = 0;
  const failures = [];

  for (const record of dueRecords) {
    try {
      // Each recurring record runs in an independent DB transaction.
      const processed = await processRecurringTransaction(record.id, userId, today);
      if (processed) processedCount += 1;
    } catch (error) {
      failures.push({ recurringTransactionId: record.id, reason: error.message });
    }
  }

  return {
    processedCount,
    failedCount: failures.length,
    failures,
  };
}

function startRecurringWorkerCron() {
  if (recurringWorkerTask) return recurringWorkerTask;

  recurringWorkerTask = cron.schedule('1 0 * * *', async () => {
    try {
      const summary = await processDueTransactions();
      console.log('[RecurringWorker] Daily run complete:', summary);
    } catch (error) {
      console.error('[RecurringWorker] Daily run failed:', error.message);
    }
  });

  return recurringWorkerTask;
}

module.exports = {
  processDueTransactions,
  startRecurringWorkerCron,
  calculateNextDate,
};
