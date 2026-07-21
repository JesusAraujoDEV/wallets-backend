'use strict';

const { listDebts, getDebtById, createDebt, updateDebt, deleteDebt } = require('./debts/crud');
const { payDebt } = require('./debts/pay');
const { linkTransactions } = require('./debts/link_transactions');

module.exports = {
  listDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  payDebt,
  linkTransactions,
};
