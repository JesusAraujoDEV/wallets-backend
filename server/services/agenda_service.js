const dayjs = require('dayjs');
const { Op, literal } = require('sequelize');
const { models } = require('../libs/sequelize');
const { calculateNextDate } = require('./recurring_worker_service');

function parseDecimal(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDirectionFromDebtType(type) {
  return type === 'receivable' ? 'ingreso' : 'gasto';
}

function sortAgendaItems(a, b) {
  return (
    a.date.localeCompare(b.date)
    || a.type.localeCompare(b.type)
    || a.description.localeCompare(b.description)
  );
}

async function buildRecurringForecast(userId, startDate, endDate) {
  const rows = await models.RecurringTransaction.findAll({
    where: {
      userId,
      isActive: true,
      nextDate: { [Op.lte]: endDate },
    },
    attributes: ['id', 'type', 'nextDate', 'amount', 'description', 'frequency'],
    order: [['nextDate', 'ASC'], ['id', 'ASC']],
    raw: true,
  });

  const result = [];
  for (const recurring of rows) {
    let cursorDate = recurring.nextDate;

    while (cursorDate && cursorDate <= endDate) {
      if (cursorDate >= startDate) {
        result.push({
          type: 'subscription',
          date: cursorDate,
          amount: parseDecimal(recurring.amount),
          description: recurring.description || 'Transaccion recurrente',
          direction: recurring.type,
        });
      }

      cursorDate = calculateNextDate(cursorDate, recurring.frequency);
    }
  }

  return result;
}

async function buildDebtForecast(userId, startDate, endDate) {
  const rows = await models.Debt.findAll({
    where: {
      userId,
      status: { [Op.ne]: 'paid' },
      dueDate: { [Op.between]: [startDate, endDate] },
    },
    attributes: [
      'id',
      'type',
      'description',
      'contactName',
      'totalAmount',
      'currency',
      'dueDate',
      [
        literal(`(
          SELECT COALESCE(SUM(
            CASE
              WHEN "Debt".currency = 'USD' THEN
                CASE WHEN t.currency = 'USD' THEN t.amount ELSE COALESCE(t.amount_usd, 0) END
              WHEN "Debt".currency = 'VES' THEN
                CASE WHEN t.currency = 'VES' THEN t.amount ELSE 0 END
              ELSE
                CASE WHEN t.currency = "Debt".currency THEN t.amount ELSE COALESCE(t.amount_usd, 0) END
            END
          ), 0)
          FROM transactions t
          WHERE t.debt_id = "Debt".id AND t.status = 'completed'
        )`),
        'paidAmount',
      ],
    ],
    raw: true,
  });

  return rows.map((debt) => {
    const totalAmount = parseDecimal(debt.totalAmount);
    const paidAmount = parseDecimal(debt.paidAmount);
    const remaining = Math.max(0, totalAmount - paidAmount);

    return {
      type: 'debt',
      date: debt.dueDate,
      amount: remaining,
      description: debt.description || `Deuda ${debt.contactName}`,
      direction: normalizeDirectionFromDebtType(debt.type),
    };
  });
}

async function getAgendaForecast(userId) {
  const startDate = dayjs().format('YYYY-MM-DD');
  const endDate = dayjs(startDate).add(60, 'day').format('YYYY-MM-DD');

  const [recurringItems, debtItems] = await Promise.all([
    buildRecurringForecast(userId, startDate, endDate),
    buildDebtForecast(userId, startDate, endDate),
  ]);

  return [...recurringItems, ...debtItems].sort(sortAgendaItems);
}

module.exports = {
  getAgendaForecast,
};
