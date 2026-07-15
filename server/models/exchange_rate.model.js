const { Model, DataTypes, Sequelize } = require('sequelize');

const EXCHANGE_RATE_TABLE = 'exchange_rates';

const ExchangeRateSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  date: {
    allowNull: false,
    type: DataTypes.DATEONLY,
    unique: true,
  },
  usdRate: {
    allowNull: false,
    type: DataTypes.DECIMAL(15, 6),
    field: 'usd_rate',
  },
  eurRate: {
    allowNull: false,
    type: DataTypes.DECIMAL(15, 6),
    field: 'eur_rate',
  },
  usdtRate: {
    allowNull: true,
    type: DataTypes.DECIMAL(15, 6),
    field: 'usdt_rate',
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

class ExchangeRate extends Model {
  static associate(_models) {}

  static config(sequelize) {
    return {
      sequelize,
      tableName: EXCHANGE_RATE_TABLE,
      modelName: 'ExchangeRate',
      timestamps: true,
    };
  }
}

module.exports = { EXCHANGE_RATE_TABLE, ExchangeRateSchema, ExchangeRate };
