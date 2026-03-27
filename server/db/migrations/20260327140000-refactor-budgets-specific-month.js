'use strict';

const { BUDGET_TABLE } = require('../../models/budget.model');

async function removeIndexIfExists(queryInterface, tableName, indexName) {
  try {
    await queryInterface.removeIndex(tableName, indexName);
  } catch (_error) {
    // Ignore when index does not exist.
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable(BUDGET_TABLE);

    await removeIndexIfExists(queryInterface, BUDGET_TABLE, 'budgets_user_period_month_global_unique');
    await removeIndexIfExists(queryInterface, BUDGET_TABLE, 'budgets_user_category_period_month_unique');
    await removeIndexIfExists(queryInterface, BUDGET_TABLE, 'budgets_user_period_specmonth_global_unique');
    await removeIndexIfExists(queryInterface, BUDGET_TABLE, 'budgets_user_category_period_specmonth_unique');

    if (tableInfo.month && !tableInfo.specific_month) {
      await queryInterface.renameColumn(BUDGET_TABLE, 'month', 'specific_month');
    }

    const refreshedInfo = await queryInterface.describeTable(BUDGET_TABLE);

    if (refreshedInfo.specific_month) {
      await queryInterface.changeColumn(BUDGET_TABLE, 'specific_month', {
        type: Sequelize.STRING(7),
        allowNull: true,
      });
    }

    if (refreshedInfo.period) {
      await queryInterface.changeColumn(BUDGET_TABLE, 'period', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'monthly',
      });
    } else {
      await queryInterface.addColumn(BUDGET_TABLE, 'period', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'monthly',
      });
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE ${BUDGET_TABLE}
      DROP CONSTRAINT IF EXISTS budgets_period_valid;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE ${BUDGET_TABLE}
      ADD CONSTRAINT budgets_period_valid
      CHECK (period IN ('monthly', 'yearly', 'one_time'));
    `);

    await queryInterface.addIndex(BUDGET_TABLE, ['user_id', 'category_id', 'period', 'specific_month'], {
      name: 'budgets_user_category_period_specmonth_unique',
      unique: true,
    });

    await queryInterface.addIndex(BUDGET_TABLE, ['user_id', 'period', 'specific_month'], {
      name: 'budgets_user_period_specmonth_global_unique',
      unique: true,
      where: {
        category_id: null,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable(BUDGET_TABLE);

    await removeIndexIfExists(queryInterface, BUDGET_TABLE, 'budgets_user_period_specmonth_global_unique');
    await removeIndexIfExists(queryInterface, BUDGET_TABLE, 'budgets_user_category_period_specmonth_unique');

    await queryInterface.sequelize.query(`
      ALTER TABLE ${BUDGET_TABLE}
      DROP CONSTRAINT IF EXISTS budgets_period_valid;
    `);

    if (tableInfo.specific_month) {
      await queryInterface.changeColumn(BUDGET_TABLE, 'specific_month', {
        type: Sequelize.STRING(7),
        allowNull: false,
      });

      await queryInterface.renameColumn(BUDGET_TABLE, 'specific_month', 'month');
    }

    await queryInterface.addIndex(BUDGET_TABLE, ['user_id', 'category_id', 'period', 'month'], {
      name: 'budgets_user_category_period_month_unique',
      unique: true,
    });

    await queryInterface.addIndex(BUDGET_TABLE, ['user_id', 'period', 'month'], {
      name: 'budgets_user_period_month_global_unique',
      unique: true,
      where: {
        category_id: null,
      },
    });
  },
};