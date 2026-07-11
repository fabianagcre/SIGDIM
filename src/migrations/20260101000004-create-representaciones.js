'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('representaciones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      solicitante_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      abogado_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tipo_tramite_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tipos_tramite', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo_visa_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'tipos_visa', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      estado: {
        type: Sequelize.ENUM('ACTIVA', 'REVOCADA', 'VENCIDA'),
        allowNull: false,
        defaultValue: 'ACTIVA',
      },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      requisitos: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      permisos: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      fecha_inicio: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_fin: { type: Sequelize.DATEONLY, allowNull: true },
      revocada_en: { type: Sequelize.DATE, allowNull: true },
      motivo_revocacion: { type: Sequelize.STRING(500), allowNull: true },
      revocada_por_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('representaciones', ['solicitante_id']);
    await queryInterface.addIndex('representaciones', ['abogado_id']);
    await queryInterface.addIndex('representaciones', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('representaciones');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_representaciones_estado";');
  },
};
