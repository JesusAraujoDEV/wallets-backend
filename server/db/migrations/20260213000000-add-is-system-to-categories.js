'use strict';

const { CATEGORY_TABLE } = require('../../models/category.model');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(CATEGORY_TABLE, 'is_system', {
      allowNull: false,
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(CATEGORY_TABLE, 'is_system');
  },
};
