const db = require('../models');

// Crear representación
exports.create = async (req, res) => {
  try {
    const { id_abogado, id_solicitante, id_tipo_tramite, id_tipo_visa } = req.body;

    if (!id_abogado || !id_solicitante) {
      return res.status(400).json({
        message: 'ID de abogado e ID de solicitante son requeridos'
      });
    }

    const representacion = await db.Representacion.create({
      id_abogado,
      id_solicitante,
      id_tipo_tramite,
      id_tipo_visa,
      estado: 'activo'
    });

    res.status(201).json({
      message: 'Representación creada exitosamente',
      data: representacion
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear representación',
      error: error.message
    });
  }
};

// Obtener todas las representaciones
exports.findAll = async (req, res) => {
  try {
    const representaciones = await db.Representacion.findAll({
      include: [
        { model: db.Usuario, as: 'abogado' },
        { model: db.Usuario, as: 'solicitante' },
        { model: db.TipoTramite, as: 'tipoTramite' },
        { model: db.TipoVisa, as: 'tipoVisa' }
      ]
    });

    res.status(200).json({
      message: 'Representaciones obtenidas exitosamente',
      data: representaciones,
      total: representaciones.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener representaciones',
      error: error.message
    });
  }
};

// Obtener representación por ID
exports.findById = async (req, res) => {
  try {
    const representacion = await db.Representacion.findByPk(req.params.id, {
      include: [
        { model: db.Usuario, as: 'abogado' },
        { model: db.Usuario, as: 'solicitante' },
        { model: db.TipoTramite, as: 'tipoTramite' },
        { model: db.TipoVisa, as: 'tipoVisa' },
        { model: db.Solicitud, as: 'solicitudes' }
      ]
    });

    if (!representacion) {
      return res.status(404).json({ message: 'Representación no encontrada' });
    }

    res.status(200).json({
      message: 'Representación obtenida exitosamente',
      data: representacion
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener representación',
      error: error.message
    });
  }
};

// Revocar representación
exports.revoke = async (req, res) => {
  try {
    const representacion = await db.Representacion.findByPk(req.params.id);

    if (!representacion) {
      return res.status(404).json({ message: 'Representación no encontrada' });
    }

    await representacion.update({ estado: 'revocado' });

    res.status(200).json({
      message: 'Representación revocada exitosamente',
      data: representacion
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al revocar representación',
      error: error.message
    });
  }
};
