'use strict';

module.exports = (sequelize, DataTypes) => {
  const TipoTramite = sequelize.define(
    'TipoTramite',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      codigo: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      docsRequeridos: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'docs_requeridos',
      },
      tiempoEstDias: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'tiempo_est_dias',
      },
      baseLegal: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'base_legal',
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'tipos_tramite',
      underscored: true,
      timestamps: true,
    }
  );

  TipoTramite.associate = (models) => {
    TipoTramite.hasMany(models.Representacion, {
      foreignKey: 'tipoTramiteId',
      as: 'representaciones',
    });
  };

  return TipoTramite;
};
