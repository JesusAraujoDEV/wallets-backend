'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('transactions');
    if (!tableInfo.status) {
      await queryInterface.addColumn('transactions', 'status', {
        allowNull: false,
        type: Sequelize.STRING(20),
        defaultValue: 'completed',
      });
    }

    await queryInterface.addIndex('transactions', ['user_id', 'status'], {
      name: 'transactions_user_status_idx',
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('transactions', 'transactions_user_status_idx');
    } catch (_error) {
      // Ignore if missing.
    }

    const tableInfo = await queryInterface.describeTable('transactions');
    if (tableInfo.status) {
      await queryInterface.removeColumn('transactions', 'status');
    }
  },
};
