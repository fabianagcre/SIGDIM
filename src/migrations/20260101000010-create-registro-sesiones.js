'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registro_sesiones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ip: { type: Sequelize.STRING(45), allowNull: false },
      dispositivo: { type: Sequelize.STRING(255), allowNull: true },
      inicio_sesion: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      fin_sesion: { type: Sequelize.DATE, allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      es_dispositivo_nuevo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    });

    await queryInterface.addIndex('registro_sesiones', ['usuario_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('registro_sesiones');
  },
};
