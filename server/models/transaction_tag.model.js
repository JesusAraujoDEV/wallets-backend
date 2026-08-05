const { Model, DataTypes, Sequelize } = require('sequelize');
const { TRANSACTION_TABLE } = require('./transaction.model');
const { TAG_TABLE } = require('./tag.model');

const TRANSACTION_TAG_TABLE = 'transaction_tags';

const TransactionTagSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  transactionId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'transaction_id',
    references: { model: TRANSACTION_TABLE, key: 'id' },
  },
  tagId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'tag_id',
    references: { model: TAG_TABLE, key: 'id' },
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: Sequelize.NOW,
  },
};

class TransactionTag extends Model {
  static associate() {}

  static config(sequelize) {
    return {
      sequelize,
      tableName: TRANSACTION_TAG_TABLE,
      modelName: 'TransactionTag',
      timestamps: false,
    };
  }
}

module.exports = { TRANSACTION_TAG_TABLE, TransactionTagSchema, TransactionTag };
