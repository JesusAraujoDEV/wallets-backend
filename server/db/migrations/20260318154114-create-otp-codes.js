'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('otp_codes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      code: {
        type: Sequelize.STRING(6),
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('otp_codes', ['user_id', 'type'], {
      name: 'otp_codes_user_id_type_idx',
    });

    await queryInterface.addIndex('otp_codes', ['user_id', 'type', 'code'], {
      name: 'otp_codes_user_id_type_code_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('otp_codes');
  },
};
