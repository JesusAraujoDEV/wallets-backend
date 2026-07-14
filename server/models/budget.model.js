const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');
const { CATEGORY_TABLE } = require('./category.model');

const BUDGET_TABLE = 'budgets';

const BudgetSchema = {
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
  categoryId: {
    allowNull: true,
    type: DataTypes.INTEGER,
    field: 'category_id',
    references: {
      model: CATEGORY_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
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
  period: {
    allowNull: false,
    type: DataTypes.STRING(20),
    defaultValue: 'monthly',
  },
  specificMonth: {
    allowNull: true,
    type: DataTypes.STRING(7),
    field: 'specific_month',
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

class Budget extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
    this.belongsTo(models.Category, { foreignKey: 'category_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: BUDGET_TABLE,
      modelName: 'Budget',
      timestamps: true,
      paranoid: true,
    };
  }
}

module.exports = { BUDGET_TABLE, BudgetSchema, Budget };