const { DataTypes } = require('sequelize');

function defineTransactionModel(sequelize) {
  const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    description: { type: DataTypes.STRING(255), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), allowNull: false },
    amountUsd: { type: DataTypes.DECIMAL(15, 2), allowNull: true, field: 'amount_usd' },
    exchangeRateUsed: { type: DataTypes.DECIMAL(10, 6), allowNull: true, field: 'exchange_rate_used' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: false, field: 'category_id' },
    accountId: { type: DataTypes.INTEGER, allowNull: false, field: 'account_id' },
    userId: { type: DataTypes.INTEGER, allowNull: true, field: 'user_id' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return Transaction;
}

module.exports = { defineTransactionModel };
