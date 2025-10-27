const { Sequelize, DataTypes } = require('sequelize');

function setupModels(sequelize) {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(120), allowNull: false },
    passwordHash: { type: DataTypes.TEXT, allowNull: false, field: 'password_hash' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  const Account = sequelize.define('Account', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false, field: 'name' },
    type: { type: DataTypes.STRING(50), allowNull: false },
    currency: { type: DataTypes.STRING(10), allowNull: false },
    balance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    userId: { type: DataTypes.INTEGER, field: 'user_id' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName: 'accounts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  const Category = sequelize.define('Category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false, field: 'name' },
    type: { type: DataTypes.STRING(10), allowNull: false },
    includeInStats: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'include_in_stats' },
    userId: { type: DataTypes.INTEGER, field: 'user_id' },
    icon: { type: DataTypes.STRING(60), allowNull: true },
    color: { type: DataTypes.STRING(32), allowNull: true },
    colorName: { type: DataTypes.STRING(64), allowNull: true, field: 'color_name' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

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

  // Associations
  User.hasMany(Account, { foreignKey: 'user_id' });
  Account.belongsTo(User, { foreignKey: 'user_id' });

  User.hasMany(Category, { foreignKey: 'user_id' });
  Category.belongsTo(User, { foreignKey: 'user_id' });

  User.hasMany(Transaction, { foreignKey: 'user_id' });
  Transaction.belongsTo(User, { foreignKey: 'user_id' });

  Account.hasMany(Transaction, { foreignKey: 'account_id' });
  Transaction.belongsTo(Account, { foreignKey: 'account_id' });

  Category.hasMany(Transaction, { foreignKey: 'category_id' });
  Transaction.belongsTo(Category, { foreignKey: 'category_id' });

  return { User, Account, Category, Transaction };
}

module.exports = { setupModels };