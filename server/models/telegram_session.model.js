const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');

const TELEGRAM_SESSION_TABLE = 'telegram_sessions';

const TelegramSessionSchema = {
  chatId: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.BIGINT, // ⚠️ Importante: Los IDs de Telegram son números gigantes
    field: 'chat_id' // Mapeo a la columna de la DB
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
  username: {
    allowNull: true,
    type: DataTypes.STRING(100),
  },
  jwtToken: {
    allowNull: false,
    type: DataTypes.TEXT, // Los tokens JWT son largos
    field: 'jwt_token'
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

class TelegramSession extends Model {
  static associate(models) {
    // Relación: Una sesión de Telegram pertenece a un Usuario
    this.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: TELEGRAM_SESSION_TABLE,
      modelName: 'TelegramSession',
      timestamps: true,
    };
  }
}

module.exports = { TELEGRAM_SESSION_TABLE, TelegramSessionSchema, TelegramSession };