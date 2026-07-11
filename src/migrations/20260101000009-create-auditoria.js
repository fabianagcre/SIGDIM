'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auditoria', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      accion: { type: Sequelize.STRING(100), allowNull: false },
      entidad: { type: Sequelize.STRING(50), allowNull: false },
      entidad_id: { type: Sequelize.UUID, allowNull: true },
      ejecutado_por_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      detalle: { type: Sequelize.JSONB, allowNull: true },
      ip: { type: Sequelize.STRING(45), allowNull: true },
      fecha: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('auditoria', ['entidad', 'entidad_id']);
    await queryInterface.addIndex('auditoria', ['fecha']);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION prevent_auditoria_mutation()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'auditoria es de solo inserción (immutable log)';
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_auditoria_no_update
      BEFORE UPDATE OR DELETE ON auditoria
      FOR EACH ROW EXECUTE FUNCTION prevent_auditoria_mutation();
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP TRIGGER IF EXISTS trg_auditoria_no_update ON auditoria;'
    );
    await queryInterface.sequelize.query(
      'DROP FUNCTION IF EXISTS prevent_auditoria_mutation();'
    );
    await queryInterface.dropTable('auditoria');
  },
};
