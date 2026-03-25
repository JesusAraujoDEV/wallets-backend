'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('categories', 'include_in_stats');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('categories', 'include_in_stats', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },
};
