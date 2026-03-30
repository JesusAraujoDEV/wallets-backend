'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recurring_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      account_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING(10),
      },
      amount: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 2),
      },
      description: {
        allowNull: false,
        type: Sequelize.STRING(255),
      },
      frequency: {
        allowNull: false,
        type: Sequelize.STRING(20),
      },
      start_date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      next_date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      auto_create: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('recurring_transactions', ['user_id'], {
      name: 'recurring_transactions_user_id_idx',
    });

    await queryInterface.addIndex('recurring_transactions', ['is_active', 'auto_create', 'next_date'], {
      name: 'recurring_transactions_due_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('recurring_transactions', 'recurring_transactions_due_idx');
    await queryInterface.removeIndex('recurring_transactions', 'recurring_transactions_user_id_idx');
    await queryInterface.dropTable('recurring_transactions');
  },
};
