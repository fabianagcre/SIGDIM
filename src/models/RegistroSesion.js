'use strict';

module.exports = (sequelize, DataTypes) => {
  const RegistroSesion = sequelize.define(
    'RegistroSesion',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      usuarioId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'usuario_id',
      },
      ip: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      dispositivo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      inicioSesion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'inicio_sesion',
      },
      finSesion: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'fin_sesion',
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      esDispositivoNuevo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'es_dispositivo_nuevo',
      },
    },
    {
      tableName: 'registro_sesiones',
      underscored: true,
      timestamps: false,
    }
  );

  RegistroSesion.associate = (models) => {
    RegistroSesion.belongsTo(models.Usuario, {
      foreignKey: 'usuarioId',
      as: 'usuario',
    });
  };

  return RegistroSesion;
};
