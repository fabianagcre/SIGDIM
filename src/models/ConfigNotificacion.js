'use strict';

module.exports = (sequelize, DataTypes) => {
  const ConfigNotificacion = sequelize.define(
    'ConfigNotificacion',
    {
      usuarioId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'usuario_id',
      },
      alertaExpAsignado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'alerta_exp_asignado',
      },
      alertaCambioEstado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'alerta_cambio_estado',
      },
      alertaCritica: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // no se puede desactivar en la lógica de negocio
        field: 'alerta_critica',
      },
      resumenDiario: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'resumen_diario',
      },
      horaResumenDiario: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'hora_resumen_diario',
      },
    },
    {
      tableName: 'config_notificaciones',
      underscored: true,
      timestamps: true,
    }
  );

  ConfigNotificacion.associate = (models) => {
    ConfigNotificacion.belongsTo(models.Usuario, {
      foreignKey: 'usuarioId',
      as: 'usuario',
    });
  };

  return ConfigNotificacion;
};
