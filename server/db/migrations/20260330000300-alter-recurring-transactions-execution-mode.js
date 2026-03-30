'use strict';

async function removeIndexIfExists(queryInterface, tableName, indexName) {
  try {
    await queryInterface.removeIndex(tableName, indexName);
  } catch (_error) {
    // Ignore if missing.
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('recurring_transactions');

    if (!tableInfo.execution_mode) {
      await queryInterface.addColumn('recurring_transactions', 'execution_mode', {
        allowNull: false,
        type: Sequelize.STRING(20),
        defaultValue: 'manual',
      });
    }

    if (tableInfo.auto_create) {
      await queryInterface.removeColumn('recurring_transactions', 'auto_create');
    }

    await removeIndexIfExists(queryInterface, 'recurring_transactions', 'recurring_transactions_due_idx');

    await queryInterface.addIndex('recurring_transactions', ['is_active', 'next_date'], {
      name: 'recurring_transactions_due_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('recurring_transactions');

    await removeIndexIfExists(queryInterface, 'recurring_transactions', 'recurring_transactions_due_idx');

    if (!tableInfo.auto_create) {
      await queryInterface.addColumn('recurring_transactions', 'auto_create', {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      });
    }

    if (tableInfo.execution_mode) {
      await queryInterface.removeColumn('recurring_transactions', 'execution_mode');
    }

    await queryInterface.addIndex('recurring_transactions', ['is_active', 'auto_create', 'next_date'], {
      name: 'recurring_transactions_due_idx',
    });
  },
};
