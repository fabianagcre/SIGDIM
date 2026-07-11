'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expedientes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      numero: { type: Sequelize.STRING(25), allowNull: false, unique: true },
      solicitud_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'solicitudes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      riesgo_score_pais: { type: Sequelize.INTEGER, allowNull: true },
      riesgo_score_historial: { type: Sequelize.INTEGER, allowNull: true },
      riesgo_score_tipo_tramite: { type: Sequelize.INTEGER, allowNull: true },
      riesgo_score_total: { type: Sequelize.INTEGER, allowNull: true },
      riesgo_nivel: {
        type: Sequelize.ENUM('BAJO', 'MEDIO', 'ALTO'),
        allowNull: true,
      },
      riesgo_score_manual: { type: Sequelize.INTEGER, allowNull: true },
      riesgo_justificacion_manual: { type: Sequelize.STRING(1000), allowNull: true },
      notas_internas: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('expedientes', ['riesgo_nivel']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('expedientes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_expedientes_riesgo_nivel";');
  },
};
