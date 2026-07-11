'use strict';

module.exports = (sequelize, DataTypes) => {
  const Expediente = sequelize.define(
    'Expediente',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      numero: {
        type: DataTypes.STRING(25), // EXP-YYYY-MM-N
        allowNull: false,
        unique: true,
      },
      solicitudId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, // 1:1 con Solicitud
        field: 'solicitud_id',
      },
      riesgoScorePais: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'riesgo_score_pais',
      },
      riesgoScoreHistorial: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'riesgo_score_historial',
      },
      riesgoScoreTipoTramite: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'riesgo_score_tipo_tramite',
      },
      riesgoScoreTotal: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'riesgo_score_total',
      },
      riesgoNivel: {
        type: DataTypes.ENUM('BAJO', 'MEDIO', 'ALTO'),
        allowNull: true,
        field: 'riesgo_nivel',
      },
      riesgoScoreManual: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'riesgo_score_manual',
      },
      riesgoJustificacionManual: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        field: 'riesgo_justificacion_manual',
      },
      notasInternas: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'notas_internas',
      },
    },
    {
      tableName: 'expedientes',
      underscored: true,
      timestamps: true,
    }
  );

  Expediente.associate = (models) => {
    Expediente.belongsTo(models.Solicitud, {
      foreignKey: 'solicitudId',
      as: 'solicitud',
    });
    Expediente.hasMany(models.Documento, {
      foreignKey: 'expedienteId',
      as: 'documentos',
    });
    Expediente.hasMany(models.EstadoTramite, {
      foreignKey: 'expedienteId',
      as: 'historialEstados',
    });
  };

  return Expediente;
};
