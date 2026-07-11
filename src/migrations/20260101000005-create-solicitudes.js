'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('solicitudes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      numero: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      representacion_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'representaciones', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      estado: {
        type: Sequelize.ENUM(
          'BORRADOR',
          'EN_REVISION',
          'DOCUMENTOS_FALTANTES',
          'APROBADO',
          'RECHAZADO',
          'CANCELADO'
        ),
        allowNull: false,
        defaultValue: 'BORRADOR',
      },
      motivo_solicitud: { type: Sequelize.STRING(500), allowNull: true },
      fecha_estimada_ingreso: { type: Sequelize.DATEONLY, allowNull: true },
      duracion_estadia_dias: { type: Sequelize.INTEGER, allowNull: true },
      numero_entradas: {
        type: Sequelize.ENUM('UNICA', 'MULTIPLE'),
        allowNull: true,
      },
      fecha_creacion: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('solicitudes', ['representacion_id']);
    await queryInterface.addIndex('solicitudes', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('solicitudes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_solicitudes_estado";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_solicitudes_numero_entradas";');
  },
};
