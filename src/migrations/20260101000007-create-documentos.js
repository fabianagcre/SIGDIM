'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documentos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      expediente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'expedientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      nombre_archivo: { type: Sequelize.STRING(255), allowNull: false },
      hash_sha256: { type: Sequelize.STRING(64), allowNull: false },
      tipo: {
        type: Sequelize.ENUM('IDENTIDAD', 'LABORAL', 'FINANCIERO', 'SALUD', 'OTROS'),
        allowNull: false,
      },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      tamano_bytes: { type: Sequelize.BIGINT, allowNull: false },
      ruta_almacenamiento: { type: Sequelize.STRING(500), allowNull: false },
      upload_por_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      valido: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('documentos', ['expediente_id']);
    await queryInterface.addIndex('documentos', ['hash_sha256']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('documentos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documentos_tipo";');
  },
};
