'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'auth_provider', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'local',
    });

    await queryInterface.addColumn('users', 'auth_provider_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'auth_provider_id');
    await queryInterface.removeColumn('users', 'auth_provider');
  },
};
