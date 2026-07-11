'use strict';

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // --- Autenticación / rol ---
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      pwdHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'pwd_hash',
      },
      rol: {
        type: DataTypes.ENUM('solicitante', 'abogado', 'administrador'),
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo', 'bloqueado'),
        allowNull: false,
        defaultValue: 'activo',
      },
      intentosFallidos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'intentos_fallidos',
      },
      bloqueadoHasta: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'bloqueado_hasta',
      },
      // --- Datos personales (SIGDLE.docx 1.2.1) ---
      nombreCompleto: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'nombre_completo',
      },
      primerApellido: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'primer_apellido',
      },
      segundoApellido: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'segundo_apellido',
      },
      fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'fecha_nacimiento',
      },
      lugarNacimiento: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'lugar_nacimiento',
      },
      nacionalidad: {
        type: DataTypes.STRING(3), // ISO-3166 alpha-3
        allowNull: true,
      },
      numeroPasaporte: {
        type: DataTypes.STRING(15),
        allowNull: true,
        unique: true,
        field: 'numero_pasaporte',
      },
      fechaExpPasaporte: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'fecha_exp_pasaporte',
      },
      paisEmisorPasaporte: {
        type: DataTypes.STRING(3),
        allowNull: true,
        field: 'pais_emisor_pasaporte',
      },
      genero: {
        type: DataTypes.ENUM('masculino', 'femenino', 'otro'),
        allowNull: true,
      },
      estadoCivil: {
        type: DataTypes.ENUM(
          'soltero',
          'casado',
          'viudo',
          'divorciado',
          'union_libre'
        ),
        allowNull: true,
        field: 'estado_civil',
      },
      direccionOrigen: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'direccion_origen',
      },
      telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      fotografiaUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'fotografia_url',
      },
      contactoEmergencia: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'contacto_emergencia',
      },
    },
    {
      tableName: 'usuarios',
      underscored: true,
      timestamps: true,
    }
  );

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Representacion, {
      foreignKey: 'solicitanteId',
      as: 'representacionesComoSolicitante',
    });
    Usuario.hasMany(models.Representacion, {
      foreignKey: 'abogadoId',
      as: 'representacionesComoAbogado',
    });
    Usuario.hasMany(models.Documento, {
      foreignKey: 'uploadPorId',
      as: 'documentosCargados',
    });
    Usuario.hasMany(models.EstadoTramite, {
      foreignKey: 'usuarioId',
      as: 'transicionesRealizadas',
    });
    Usuario.hasMany(models.Auditoria, {
      foreignKey: 'ejecutadoPorId',
      as: 'accionesAuditadas',
    });
    Usuario.hasMany(models.RegistroSesion, {
      foreignKey: 'usuarioId',
      as: 'sesiones',
    });
    Usuario.hasOne(models.ConfigNotificacion, {
      foreignKey: 'usuarioId',
      as: 'configNotificacion',
    });
  };

  return Usuario;
};
