const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');

const CATEGORY_GROUP_TABLE = 'category_groups';

const CategoryGroupSchema = {
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
    type: DataTypes.STRING(10), // 'ingreso' | 'gasto' | 'neutral'
  },
  analyticsBehavior: {
    allowNull: false,
    type: DataTypes.STRING(10), // 'include' | 'exclude'
    field: 'analytics_behavior',
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

class CategoryGroup extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
    this.hasMany(models.Category, { foreignKey: 'group_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: CATEGORY_GROUP_TABLE,
      modelName: 'CategoryGroup',
      timestamps: true,
      paranoid: true,
    };
  }
}

module.exports = { CATEGORY_GROUP_TABLE, CategoryGroupSchema, CategoryGroup };
