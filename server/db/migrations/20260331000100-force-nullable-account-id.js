'use strict';

/**
 * Migración forzada para resolver desync entre SequelizeMeta y el estado real de la BD.
 *
 * La migración 20260330000400 usaba describeTable con lógica condicional que pudo
 * no ejecutar el ALTER TABLE, mientras Sequelize la marcó como aplicada.
 * Esta migración aplica el cambio de forma incondicional usando ALTER TABLE directo.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE recurring_transactions
        ALTER COLUMN account_id DROP NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM recurring_transactions WHERE account_id IS NULL;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE recurring_transactions
        ALTER COLUMN account_id SET NOT NULL;
    `);
  },
};
