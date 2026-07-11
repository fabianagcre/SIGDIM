'use strict';

module.exports = (sequelize, DataTypes) => {
  // NOTA: esta tabla es INMUTABLE por diseño (Ley 38/2000 y trazabilidad
  // legal del Decreto Ley 3/2008). Solo se permite INSERT; nunca UPDATE ni
  // DELETE. No exponer rutas de edición/borrado sobre este modelo.
  const EstadoTramite = sequelize.define(
    'EstadoTramite',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      expedienteId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'expediente_id',
      },
      estadoAnterior: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: 'estado_anterior',
      },
      estadoNuevo: {
        type: DataTypes.STRING(30),
        allowNull: false,
        field: 'estado_nuevo',
      },
      usuarioId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'usuario_id',
      },
      motivo: {
        type: DataTypes.STRING(1000),
        allowNull: true, // ej. artículo legal del rechazo
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'estados_tramite',
      underscored: true,
      timestamps: false,
    }
  );

  EstadoTramite.associate = (models) => {
    EstadoTramite.belongsTo(models.Expediente, {
      foreignKey: 'expedienteId',
      as: 'expediente',
    });
    EstadoTramite.belongsTo(models.Usuario, {
      foreignKey: 'usuarioId',
      as: 'usuario',
    });
  };

  return EstadoTramite;
};
