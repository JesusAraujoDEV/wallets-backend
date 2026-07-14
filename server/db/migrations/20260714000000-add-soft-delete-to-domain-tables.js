'use strict';

const TABLES = [
  'accounts',
  'categories',
  'category_groups',
  'debts',
  'recurring_transactions',
  'budgets',
];

async function removeIndexIfExists(queryInterface, tableName, indexName) {
  try {
    await queryInterface.removeIndex(tableName, indexName);
  } catch (_error) {
    // Ignore when index does not exist.
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of TABLES) {
      await queryInterface.addColumn(table, 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // Budgets' unique indexes must ignore soft-deleted rows so a new budget
    // can reuse the same user/category/period/month key after the old one is deleted.
    await removeIndexIfExists(queryInterface, 'budgets', 'budgets_user_category_period_specmonth_unique');
    await removeIndexIfExists(queryInterface, 'budgets', 'budgets_user_period_specmonth_global_unique');

    await queryInterface.addIndex('budgets', ['user_id', 'category_id', 'period', 'specific_month'], {
      name: 'budgets_user_category_period_specmonth_unique',
      unique: true,
      where: {
        deleted_at: null,
      },
    });

    await queryInterface.addIndex('budgets', ['user_id', 'period', 'specific_month'], {
      name: 'budgets_user_period_specmonth_global_unique',
      unique: true,
      where: {
        category_id: null,
        deleted_at: null,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await removeIndexIfExists(queryInterface, 'budgets', 'budgets_user_category_period_specmonth_unique');
    await removeIndexIfExists(queryInterface, 'budgets', 'budgets_user_period_specmonth_global_unique');

    await queryInterface.addIndex('budgets', ['user_id', 'category_id', 'period', 'specific_month'], {
      name: 'budgets_user_category_period_specmonth_unique',
      unique: true,
    });

    await queryInterface.addIndex('budgets', ['user_id', 'period', 'specific_month'], {
      name: 'budgets_user_period_specmonth_global_unique',
      unique: true,
      where: {
        category_id: null,
      },
    });

    for (const table of TABLES) {
      await queryInterface.removeColumn(table, 'deleted_at');
    }
  },
};
