const { Model, DataTypes, Sequelize } = require('sequelize');

const USER_TABLE = 'users';

const UserSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  username: {
    allowNull: false,
    type: DataTypes.STRING(120),
    unique: true,
  },
  email: {
    allowNull: true,
    type: DataTypes.STRING(160),
    unique: true,
  },
  name: {
    allowNull: true,
    type: DataTypes.STRING(120),
  },
  authProvider: {
    allowNull: false,
    type: DataTypes.STRING(50),
    field: 'auth_provider',
    defaultValue: 'local',
  },
  authProviderId: {
    allowNull: true,
    type: DataTypes.STRING(255),
    field: 'auth_provider_id',
  },
  passwordHash: {
    allowNull: false,
    type: DataTypes.TEXT,
    field: 'password_hash', // Mantiene compatibilidad con tu DB actual
  },
  resetPasswordToken: {
    allowNull: true,
    type: DataTypes.TEXT,
    field: 'reset_password_token',
  },
  resetPasswordExpires: {
    allowNull: true,
    type: DataTypes.DATE,
    field: 'reset_password_expires',
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

class User extends Model {
  static associate(models) {
    // Definimos las relaciones aquí
    this.hasMany(models.Account, { foreignKey: 'user_id' });
    this.hasMany(models.Category, { foreignKey: 'user_id' });
    this.hasMany(models.Transaction, { foreignKey: 'user_id' });
    // Aquí agregaremos la sesión de telegram cuando la crees
    this.hasOne(models.TelegramSession, { as: 'telegramSession', foreignKey: 'user_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: USER_TABLE,
      modelName: 'User',
      timestamps: true,
    };
  }
}

module.exports = { USER_TABLE, UserSchema, User };