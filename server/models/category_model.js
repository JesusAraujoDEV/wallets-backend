const { DataTypes } = require('sequelize');

function defineCategoryModel(sequelize) {
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
  return Category;
}

module.exports = { defineCategoryModel };
