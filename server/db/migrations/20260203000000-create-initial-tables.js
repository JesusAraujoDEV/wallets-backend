'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      username: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(160), allowNull: true },
      name: { type: Sequelize.STRING(120), allowNull: true },
      password_hash: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_unique' });

    await queryInterface.createTable('accounts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      type: { type: Sequelize.STRING(50), allowNull: false },
      currency: { type: Sequelize.STRING(10), allowNull: false },
      balance: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.createTable('categories', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      type: { type: Sequelize.STRING(10), allowNull: false },
      include_in_stats: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      icon: { type: Sequelize.STRING(60), allowNull: true },
      color: { type: Sequelize.STRING(32), allowNull: true },
      color_name: { type: Sequelize.STRING(64), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: false },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      currency: { type: Sequelize.STRING(10), allowNull: false },
      amount_usd: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      exchange_rate_used: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('accounts');
    await queryInterface.dropTable('users');
  },
};
