const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');
const { ACCOUNT_TABLE } = require('./account.model');
const { CATEGORY_TABLE } = require('./category.model');
const { DEBT_TABLE } = require('./debt.model');

const RECURRING_TRANSACTION_TABLE = 'recurring_transactions';

const RecurringTransactionSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  userId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'user_id',
    references: {
      model: USER_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  accountId: {
    allowNull: true,
    type: DataTypes.INTEGER,
    field: 'account_id',
    references: {
      model: ACCOUNT_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  categoryId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'category_id',
    references: {
      model: CATEGORY_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  type: {
    allowNull: false,
    type: DataTypes.STRING(10),
  },
  amount: {
    allowNull: false,
    type: DataTypes.DECIMAL(15, 2),
  },
  currency: {
    allowNull: false,
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  description: {
    allowNull: false,
    type: DataTypes.STRING(255),
  },
  frequency: {
    allowNull: false,
    type: DataTypes.STRING(20),
  },
  startDate: {
    allowNull: false,
    type: DataTypes.DATEONLY,
    field: 'start_date',
  },
  nextDate: {
    allowNull: false,
    type: DataTypes.DATEONLY,
    field: 'next_date',
  },
  executionMode: {
    allowNull: false,
    type: DataTypes.STRING(20),
    field: 'execution_mode',
    defaultValue: 'manual',
  },
  debtId: {
    allowNull: true,
    type: DataTypes.INTEGER,
    field: 'debt_id',
    references: { model: DEBT_TABLE, key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  isActive: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    defaultValue: true,
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
  deletedAt: {
    allowNull: true,
    type: DataTypes.DATE,
    field: 'deleted_at',
  },
};

class RecurringTransaction extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
    this.belongsTo(models.Account, { foreignKey: 'account_id' });
    this.belongsTo(models.Category, { foreignKey: 'category_id' });
    this.belongsTo(models.Debt, { foreignKey: 'debt_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: RECURRING_TRANSACTION_TABLE,
      modelName: 'RecurringTransaction',
      timestamps: true,
      paranoid: true,
    };
  }
}

module.exports = {
  RECURRING_TRANSACTION_TABLE,
  RecurringTransactionSchema,
  RecurringTransaction,
};
