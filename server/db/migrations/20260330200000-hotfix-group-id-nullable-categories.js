'use strict';

/**
 * Hotfix: Garantiza que group_id en categories sea nullable.
 * La migración original (20260325111000) ya lo definía como allowNull: true,
 * pero esta migración es idempotente para asegurar consistencia en todos los entornos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('categories', 'group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'category_groups', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir no cambia nada porque ya era nullable
    await queryInterface.changeColumn('categories', 'group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'category_groups', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};
