const db = require('../models');

// Crear solicitud
exports.create = async (req, res) => {
  try {
    const { id_representacion, id_tipo_tramite } = req.body;

    if (!id_representacion || !id_tipo_tramite) {
      return res.status(400).json({
        message: 'ID de representación y tipo de trámite son requeridos'
      });
    }

    const solicitud = await db.Solicitud.create({
      id_representacion,
      id_tipo_tramite,
      estado: 'pendiente'
    });

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      data: solicitud
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear solicitud',
      error: error.message
    });
  }
};

// Obtener todas las solicitudes
exports.findAll = async (req, res) => {
  try {
    const solicitudes = await db.Solicitud.findAll({
      include: [
        { model: db.Representacion, as: 'representacion' },
        { model: db.TipoTramite, as: 'tipoTramite' },
        { model: db.Expediente, as: 'expediente' }
      ]
    });

    res.status(200).json({
      message: 'Solicitudes obtenidas exitosamente',
      data: solicitudes,
      total: solicitudes.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};

// Obtener solicitud por ID
exports.findById = async (req, res) => {
  try {
    const solicitud = await db.Solicitud.findByPk(req.params.id, {
      include: [
        { model: db.Representacion, as: 'representacion' },
        { model: db.TipoTramite, as: 'tipoTramite' },
        { model: db.Expediente, as: 'expediente' }
      ]
    });

    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    res.status(200).json({
      message: 'Solicitud obtenida exitosamente',
      data: solicitud
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener solicitud',
      error: error.message
    });
  }
};

// Actualizar solicitud
exports.update = async (req, res) => {
  try {
    const solicitud = await db.Solicitud.findByPk(req.params.id);

    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    await solicitud.update(req.body);

    res.status(200).json({
      message: 'Solicitud actualizada exitosamente',
      data: solicitud
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar solicitud',
      error: error.message
    });
  }
};
