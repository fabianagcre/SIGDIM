'use strict';

module.exports = (sequelize, DataTypes) => {
  const Solicitud = sequelize.define(
    'Solicitud',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      numero: {
        type: DataTypes.STRING(20), // SOL-YYYY-NNN
        allowNull: false,
        unique: true,
      },
      representacionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'representacion_id',
      },
      estado: {
        type: DataTypes.ENUM(
          'BORRADOR',
          'EN_REVISION',
          'DOCUMENTOS_FALTANTES',
          'APROBADO',
          'RECHAZADO',
          'CANCELADO'
        ),
        allowNull: false,
        defaultValue: 'BORRADOR',
      },
      motivoSolicitud: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'motivo_solicitud',
      },
      fechaEstimadaIngreso: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'fecha_estimada_ingreso',
      },
      duracionEstadiaDias: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'duracion_estadia_dias',
      },
      numeroEntradas: {
        type: DataTypes.ENUM('UNICA', 'MULTIPLE'),
        allowNull: true,
        field: 'numero_entradas',
      },
      fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'fecha_creacion',
      },
    },
    {
      tableName: 'solicitudes',
      underscored: true,
      timestamps: true,
    }
  );

  Solicitud.associate = (models) => {
    Solicitud.belongsTo(models.Representacion, {
      foreignKey: 'representacionId',
      as: 'representacion',
    });
    Solicitud.hasOne(models.Expediente, {
      foreignKey: 'solicitudId',
      as: 'expediente',
    });
  };

  return Solicitud;
};
