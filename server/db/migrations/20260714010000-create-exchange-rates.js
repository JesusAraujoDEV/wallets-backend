'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exchange_rates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
        unique: true,
      },
      usd_rate: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 6),
      },
      eur_rate: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 6),
      },
      usdt_rate: {
        allowNull: true,
        type: Sequelize.DECIMAL(15, 6),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('exchange_rates');
  },
};
