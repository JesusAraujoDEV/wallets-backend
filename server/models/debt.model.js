const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');
const { CATEGORY_TABLE } = require('./category.model');

const DEBT_TABLE = 'debts';

const DebtSchema = {
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
    references: { model: USER_TABLE, key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  type: {
    allowNull: false,
    type: DataTypes.STRING(20),
    validate: { isIn: [['payable', 'receivable']] },
  },
  contactName: {
    allowNull: false,
    type: DataTypes.STRING(255),
    field: 'contact_name',
  },
  description: {
    allowNull: true,
    type: DataTypes.STRING(255),
  },
  totalAmount: {
    allowNull: false,
    type: DataTypes.DECIMAL(15, 2),
    field: 'total_amount',
  },
  currency: {
    allowNull: false,
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  dueDate: {
    allowNull: true,
    type: DataTypes.DATEONLY,
    field: 'due_date',
  },
  categoryId: {
    allowNull: true,
    type: DataTypes.INTEGER,
    field: 'category_id',
    references: { model: CATEGORY_TABLE, key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  status: {
    allowNull: false,
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'partial', 'paid']] },
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

class Debt extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
    this.belongsTo(models.Category, { foreignKey: 'category_id' });
    this.hasMany(models.Transaction, { foreignKey: 'debt_id' });
    this.hasMany(models.RecurringTransaction, { foreignKey: 'debt_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: DEBT_TABLE,
      modelName: 'Debt',
      timestamps: true,
      paranoid: true,
    };
  }
}

module.exports = { DEBT_TABLE, DebtSchema, Debt };
