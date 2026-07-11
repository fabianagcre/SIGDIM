'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('estados_tramite', {
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
      estado_anterior: { type: Sequelize.STRING(30), allowNull: true },
      estado_nuevo: { type: Sequelize.STRING(30), allowNull: false },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      motivo: { type: Sequelize.STRING(1000), allowNull: true },
      timestamp: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('estados_tramite', ['expediente_id']);

    // Refuerzo de inmutabilidad a nivel de base de datos: bloquea UPDATE y DELETE.
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION prevent_estados_tramite_mutation()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'estados_tramite es de solo inserción (immutable log)';
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_estados_tramite_no_update
      BEFORE UPDATE OR DELETE ON estados_tramite
      FOR EACH ROW EXECUTE FUNCTION prevent_estados_tramite_mutation();
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP TRIGGER IF EXISTS trg_estados_tramite_no_update ON estados_tramite;'
    );
    await queryInterface.sequelize.query(
      'DROP FUNCTION IF EXISTS prevent_estados_tramite_mutation();'
    );
    await queryInterface.dropTable('estados_tramite');
  },
};
