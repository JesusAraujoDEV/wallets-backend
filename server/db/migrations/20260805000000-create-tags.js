'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(60),
      },
      color: {
        allowNull: true,
        type: Sequelize.STRING(20),
      },
      icon: {
        allowNull: true,
        type: Sequelize.STRING(40),
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    // Unique tag name per user
    await queryInterface.addIndex('tags', ['user_id', 'name'], {
      unique: true,
      name: 'tags_user_id_name_unique',
    });

    await queryInterface.createTable('transaction_tags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      transaction_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'transactions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tag_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'tags', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Prevent duplicate tag assignments
    await queryInterface.addIndex('transaction_tags', ['transaction_id', 'tag_id'], {
      unique: true,
      name: 'transaction_tags_tx_tag_unique',
    });

    // Fast lookup: all transactions for a given tag
    await queryInterface.addIndex('transaction_tags', ['tag_id'], {
      name: 'transaction_tags_tag_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transaction_tags');
    await queryInterface.dropTable('tags');
  },
};
