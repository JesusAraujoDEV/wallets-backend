'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transactions', 'usdt_rate_used', {
      type: Sequelize.DECIMAL(15, 6),
      allowNull: true,
    });
    await queryInterface.addColumn('transactions', 'amount_usdt', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('transactions', 'amount_usdt');
    await queryInterface.removeColumn('transactions', 'usdt_rate_used');
  },
};
