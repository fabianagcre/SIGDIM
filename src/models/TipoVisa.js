'use strict';

module.exports = (sequelize, DataTypes) => {
  const TipoVisa = sequelize.define(
    'TipoVisa',
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
      duracionMaxDias: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'duracion_max_dias',
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
      tableName: 'tipos_visa',
      underscored: true,
      timestamps: true,
    }
  );

  TipoVisa.associate = (models) => {
    TipoVisa.hasMany(models.Representacion, {
      foreignKey: 'tipoVisaId',
      as: 'representaciones',
    });
  };

  return TipoVisa;
};
