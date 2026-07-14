const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');

const ACCOUNT_TABLE = 'accounts';

const AccountSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  name: {
    allowNull: false,
    type: DataTypes.STRING(120),
  },
  type: {
    allowNull: false,
    type: DataTypes.STRING(50),
  },
  currency: {
    allowNull: false,
    type: DataTypes.STRING(10),
  },
  balance: {
    allowNull: false,
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
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

class Account extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
    this.hasMany(models.Transaction, { foreignKey: 'account_id' });
    this.hasMany(models.RecurringTransaction, { foreignKey: 'account_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: ACCOUNT_TABLE,
      modelName: 'Account',
      timestamps: true,
      paranoid: true,
    };
  }
}

module.exports = { ACCOUNT_TABLE, AccountSchema, Account };