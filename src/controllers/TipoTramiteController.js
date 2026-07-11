const db = require('../models');

// Obtener todos los tipos de trámite
exports.findAll = async (req, res) => {
  try {
    const tiposExpediente = await db.TipoTramite.findAll();

    res.status(200).json({
      message: 'Tipos de trámite obtenidos exitosamente',
      data: tiposExpediente,
      total: tiposExpediente.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener tipos de trámite',
      error: error.message
    });
  }
};

// Obtener tipo de trámite por ID
exports.findById = async (req, res) => {
  try {
    const tipoExpediente = await db.TipoTramite.findByPk(req.params.id);

    if (!tipoExpediente) {
      return res.status(404).json({ message: 'Tipo de trámite no encontrado' });
    }

    res.status(200).json({
      message: 'Tipo de trámite obtenido exitosamente',
      data: tipoExpediente
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener tipo de trámite',
      error: error.message
    });
  }
};

// Crear tipo de trámite (admin)
exports.create = async (req, res) => {
  try {
    const { nombre_tramite, descripcion } = req.body;

    if (!nombre_tramite) {
      return res.status(400).json({
        message: 'El nombre del trámite es requerido'
      });
    }

    const tipoTramite = await db.TipoTramite.create({
      nombre_tramite,
      descripcion
    });

    res.status(201).json({
      message: 'Tipo de trámite creado exitosamente',
      data: tipoTramite
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear tipo de trámite',
      error: error.message
    });
  }
};
