'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const recurringTableInfo = await queryInterface.describeTable('recurring_transactions');

    if (recurringTableInfo.account_id?.allowNull === false) {
      await queryInterface.changeColumn('recurring_transactions', 'account_id', {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    if (!recurringTableInfo.currency) {
      await queryInterface.addColumn('recurring_transactions', 'currency', {
        allowNull: false,
        type: Sequelize.STRING(10),
        defaultValue: 'USD',
      });
    }

    const transactionsTableInfo = await queryInterface.describeTable('transactions');

    if (transactionsTableInfo.account_id?.allowNull === false) {
      await queryInterface.changeColumn('transactions', 'account_id', {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }

    await queryInterface.sequelize.query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_account_id_pending_check;');
    await queryInterface.sequelize.query(
      `ALTER TABLE transactions
       ADD CONSTRAINT transactions_account_id_pending_check
       CHECK (status = 'pending' OR account_id IS NOT NULL);`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_account_id_pending_check;');

    const recurringTableInfo = await queryInterface.describeTable('recurring_transactions');
    if (recurringTableInfo.currency) {
      await queryInterface.removeColumn('recurring_transactions', 'currency');
    }

    await queryInterface.sequelize.query('DELETE FROM transactions WHERE account_id IS NULL;');
    await queryInterface.sequelize.query('DELETE FROM recurring_transactions WHERE account_id IS NULL;');

    await queryInterface.changeColumn('transactions', 'account_id', {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: { model: 'accounts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.changeColumn('recurring_transactions', 'account_id', {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: { model: 'accounts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },
};
