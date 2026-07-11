'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('config_notificaciones', {
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      alerta_exp_asignado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      alerta_cambio_estado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      alerta_critica: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      resumen_diario: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      hora_resumen_diario: { type: Sequelize.TIME, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('config_notificaciones');
  },
};
