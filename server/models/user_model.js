const { DataTypes } = require('sequelize');

function defineUserModel(sequelize) {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: true },
    name: { type: DataTypes.STRING(120), allowNull: true },
    passwordHash: { type: DataTypes.TEXT, allowNull: false, field: 'password_hash' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return User;
}

module.exports = { defineUserModel };
