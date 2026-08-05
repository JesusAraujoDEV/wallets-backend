const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');

const TAG_TABLE = 'tags';

const TagSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  name: {
    allowNull: false,
    type: DataTypes.STRING(60),
  },
  color: {
    allowNull: true,
    type: DataTypes.STRING(20),
  },
  icon: {
    allowNull: true,
    type: DataTypes.STRING(40),
  },
  userId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'user_id',
    references: { model: USER_TABLE, key: 'id' },
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

class Tag extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
    this.belongsToMany(models.Transaction, {
      through: models.TransactionTag,
      foreignKey: 'tag_id',
      otherKey: 'transaction_id',
      as: 'transactions',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: TAG_TABLE,
      modelName: 'Tag',
      timestamps: true,
    };
  }
}

module.exports = { TAG_TABLE, TagSchema, Tag };
