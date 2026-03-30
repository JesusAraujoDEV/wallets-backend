const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');
const { ACCOUNT_TABLE } = require('./account.model');
const { CATEGORY_TABLE } = require('./category.model');

const TRANSACTION_TABLE = 'transactions';

const TransactionSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  description: {
    allowNull: false,
    type: DataTypes.STRING(255),
  },
  amount: {
    allowNull: false,
    type: DataTypes.DECIMAL(15, 2),
  },
  currency: {
    allowNull: false,
    type: DataTypes.STRING(10),
  },
  amountUsd: {
    allowNull: true,
    type: DataTypes.DECIMAL(15, 2),
    field: 'amount_usd',
  },
  exchangeRateUsed: {
    allowNull: true,
    type: DataTypes.DECIMAL(10, 6),
    field: 'exchange_rate_used',
  },
  date: {
    allowNull: false,
    type: DataTypes.DATEONLY, // Importante: DATEONLY para YYYY-MM-DD
  },
  status: {
    allowNull: false,
    type: DataTypes.STRING(20),
    defaultValue: 'completed',
  },
  userId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'user_id',
    references: { model: USER_TABLE, key: 'id' },
  },
  accountId: {
    allowNull: true,
    type: DataTypes.INTEGER,
    field: 'account_id',
    references: { model: ACCOUNT_TABLE, key: 'id' },
  },
  categoryId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'category_id',
    references: { model: CATEGORY_TABLE, key: 'id' },
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: Sequelize.NOW,
  },
};

class Transaction extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
    this.belongsTo(models.Account, { foreignKey: 'account_id' });
    this.belongsTo(models.Category, { foreignKey: 'category_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: TRANSACTION_TABLE,
      modelName: 'Transaction',
      timestamps: true,
    };
  }
}

module.exports = { TRANSACTION_TABLE, TransactionSchema, Transaction };