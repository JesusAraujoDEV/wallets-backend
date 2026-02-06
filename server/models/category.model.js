const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');

const CATEGORY_TABLE = 'categories';

const CategorySchema = {
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
    type: DataTypes.STRING(10), // 'ingreso' o 'gasto'
  },
  includeInStats: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'include_in_stats',
  },
  icon: {
    allowNull: true,
    type: DataTypes.STRING(60),
  },
  color: {
    allowNull: true,
    type: DataTypes.STRING(32),
  },
  colorName: {
    allowNull: true,
    type: DataTypes.STRING(64),
    field: 'color_name',
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
};

class Category extends Model {
  static associate(models) {
    this.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' });
    this.hasMany(models.Transaction, { as: 'transactions', foreignKey: 'category_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: CATEGORY_TABLE,
      modelName: 'Category',
      timestamps: true,
    };
  }
}

module.exports = { CATEGORY_TABLE, CategorySchema, Category };