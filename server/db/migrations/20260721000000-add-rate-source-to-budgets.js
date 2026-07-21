'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('budgets', 'rate_source', {
      allowNull: true,
      type: Sequelize.STRING(20),
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('budgets', 'rate_source');
  },
};
