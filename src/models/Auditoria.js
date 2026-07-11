'use strict';

module.exports = (sequelize, DataTypes) => {
  // NOTA: inmutable, retención mínima 7 años (RNF-07). Solo INSERT.
  const Auditoria = sequelize.define(
    'Auditoria',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      accion: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entidad: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entidadId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'entidad_id',
      },
      ejecutadoPorId: {
        type: DataTypes.UUID,
        allowNull: true, // null para acciones anónimas (ej. intento fallido de portal público)
        field: 'ejecutado_por_id',
      },
      detalle: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'auditoria',
      underscored: true,
      timestamps: false,
    }
  );

  Auditoria.associate = (models) => {
    Auditoria.belongsTo(models.Usuario, {
      foreignKey: 'ejecutadoPorId',
      as: 'ejecutadoPor',
    });
  };

  return Auditoria;
};
