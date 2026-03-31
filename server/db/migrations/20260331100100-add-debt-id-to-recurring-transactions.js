'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('recurring_transactions', 'debt_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'debts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('recurring_transactions', ['debt_id'], {
      name: 'recurring_transactions_debt_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('recurring_transactions', 'recurring_transactions_debt_id_idx');
    await queryInterface.removeColumn('recurring_transactions', 'debt_id');
  },
};
