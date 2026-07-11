'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      pwd_hash: { type: Sequelize.STRING(255), allowNull: false },
      rol: {
        type: Sequelize.ENUM('solicitante', 'abogado', 'administrador'),
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM('activo', 'inactivo', 'bloqueado'),
        allowNull: false,
        defaultValue: 'activo',
      },
      intentos_fallidos: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      bloqueado_hasta: { type: Sequelize.DATE, allowNull: true },
      nombre_completo: { type: Sequelize.STRING(100), allowNull: false },
      primer_apellido: { type: Sequelize.STRING(50), allowNull: true },
      segundo_apellido: { type: Sequelize.STRING(50), allowNull: true },
      fecha_nacimiento: { type: Sequelize.DATEONLY, allowNull: true },
      lugar_nacimiento: { type: Sequelize.STRING(100), allowNull: true },
      nacionalidad: { type: Sequelize.STRING(3), allowNull: true },
      numero_pasaporte: { type: Sequelize.STRING(15), allowNull: true, unique: true },
      fecha_exp_pasaporte: { type: Sequelize.DATEONLY, allowNull: true },
      pais_emisor_pasaporte: { type: Sequelize.STRING(3), allowNull: true },
      genero: {
        type: Sequelize.ENUM('masculino', 'femenino', 'otro'),
        allowNull: true,
      },
      estado_civil: {
        type: Sequelize.ENUM('soltero', 'casado', 'viudo', 'divorciado', 'union_libre'),
        allowNull: true,
      },
      direccion_origen: { type: Sequelize.STRING(200), allowNull: true },
      telefono: { type: Sequelize.STRING(20), allowNull: true },
      fotografia_url: { type: Sequelize.STRING(255), allowNull: true },
      contacto_emergencia: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('usuarios', ['rol']);
    await queryInterface.addIndex('usuarios', ['numero_pasaporte']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('usuarios');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_rol";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_estado";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_genero";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_estado_civil";');
  },
};
