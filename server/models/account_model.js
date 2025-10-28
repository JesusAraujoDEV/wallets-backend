const { DataTypes } = require('sequelize');

function defineAccountModel(sequelize) {
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
  return Account;
}

module.exports = { defineAccountModel };
