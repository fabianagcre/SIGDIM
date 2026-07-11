'use strict';

module.exports = (sequelize, DataTypes) => {
  const Documento = sequelize.define(
    'Documento',
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
      nombreArchivo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'nombre_archivo',
      },
      hashSHA256: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'hash_sha256',
      },
      tipo: {
        type: DataTypes.ENUM('IDENTIDAD', 'LABORAL', 'FINANCIERO', 'SALUD', 'OTROS'),
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'mime_type',
      },
      tamañoBytes: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'tamano_bytes',
      },
      rutaAlmacenamiento: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'ruta_almacenamiento',
      },
      uploadPorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'upload_por_id',
      },
      valido: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'documentos',
      underscored: true,
      timestamps: true,
    }
  );

  Documento.associate = (models) => {
    Documento.belongsTo(models.Expediente, {
      foreignKey: 'expedienteId',
      as: 'expediente',
    });
    Documento.belongsTo(models.Usuario, {
      foreignKey: 'uploadPorId',
      as: 'uploadPor',
    });
  };

  return Documento;
};
