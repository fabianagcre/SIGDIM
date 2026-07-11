const db = require('../models');

// Obtener expediente por ID
exports.findById = async (req, res) => {
  try {
    const expediente = await db.Expediente.findByPk(req.params.id, {
      include: [
        { model: db.Solicitud, as: 'solicitud' },
        { model: db.Documento, as: 'documentos' },
        { model: db.EstadoTramite, as: 'estadosTramite' }
      ]
    });

    if (!expediente) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    res.status(200).json({
      message: 'Expediente obtenido exitosamente',
      data: expediente
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener expediente',
      error: error.message
    });
  }
};

// Obtener todos los expedientes
exports.findAll = async (req, res) => {
  try {
    const expedientes = await db.Expediente.findAll({
      include: [
        { model: db.Solicitud, as: 'solicitud' },
        { model: db.Documento, as: 'documentos' }
      ]
    });

    res.status(200).json({
      message: 'Expedientes obtenidos exitosamente',
      data: expedientes,
      total: expedientes.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener expedientes',
      error: error.message
    });
  }
};

// Actualizar expediente
exports.update = async (req, res) => {
  try {
    const expediente = await db.Expediente.findByPk(req.params.id);

    if (!expediente) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    await expediente.update(req.body);

    res.status(200).json({
      message: 'Expediente actualizado exitosamente',
      data: expediente
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar expediente',
      error: error.message
    });
  }
};
