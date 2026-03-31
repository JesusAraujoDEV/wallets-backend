'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('debts', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'categories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('debts', ['category_id'], {
      name: 'debts_category_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('debts', 'debts_category_id_idx');
    await queryInterface.removeColumn('debts', 'category_id');
  },
};
