'use strict';

module.exports = (sequelize, DataTypes) => {
  const Representacion = sequelize.define(
    'Representacion',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      solicitanteId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'solicitante_id',
      },
      abogadoId: {
        type: DataTypes.UUID,
        allowNull: true, // puede asignarse después de creada
        field: 'abogado_id',
      },
      tipoTramiteId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'tipo_tramite_id',
      },
      tipoVisaId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'tipo_visa_id',
      },
      estado: {
        type: DataTypes.ENUM('ACTIVA', 'REVOCADA', 'VENCIDA'),
        allowNull: false,
        defaultValue: 'ACTIVA',
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requisitos: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      permisos: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'fecha_inicio',
      },
      fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'fecha_fin',
      },
      revocadaEn: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'revocada_en',
      },
      motivoRevocacion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'motivo_revocacion',
      },
      revocadaPorId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'revocada_por_id',
      },
    },
    {
      tableName: 'representaciones',
      underscored: true,
      timestamps: true,
    }
  );

  Representacion.associate = (models) => {
    Representacion.belongsTo(models.Usuario, {
      foreignKey: 'solicitanteId',
      as: 'solicitante',
    });
    Representacion.belongsTo(models.Usuario, {
      foreignKey: 'abogadoId',
      as: 'abogado',
    });
    Representacion.belongsTo(models.Usuario, {
      foreignKey: 'revocadaPorId',
      as: 'revocadaPor',
    });
    Representacion.belongsTo(models.TipoTramite, {
      foreignKey: 'tipoTramiteId',
      as: 'tipoTramite',
    });
    Representacion.belongsTo(models.TipoVisa, {
      foreignKey: 'tipoVisaId',
      as: 'tipoVisa',
    });
    Representacion.hasMany(models.Solicitud, {
      foreignKey: 'representacionId',
      as: 'solicitudes',
    });
  };

  return Representacion;
};
