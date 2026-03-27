'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('budgets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'USD',
      },
      period: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'monthly',
      },
      month: {
        type: Sequelize.STRING(7),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('budgets', ['user_id', 'category_id', 'period', 'month'], {
      name: 'budgets_user_category_period_month_unique',
      unique: true,
    });

    await queryInterface.addIndex('budgets', ['user_id', 'period', 'month'], {
      name: 'budgets_user_period_month_global_unique',
      unique: true,
      where: {
        category_id: null,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('budgets', 'budgets_user_period_month_global_unique');
    await queryInterface.removeIndex('budgets', 'budgets_user_category_period_month_unique');
    await queryInterface.dropTable('budgets');
  },
};