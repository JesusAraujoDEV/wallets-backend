'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transactions', 'debt_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'debts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('transactions', ['debt_id'], {
      name: 'transactions_debt_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('transactions', 'transactions_debt_id_idx');
    await queryInterface.removeColumn('transactions', 'debt_id');
  },
};
