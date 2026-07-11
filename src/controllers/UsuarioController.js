const db = require('../models');

// Crear un nuevo usuario
exports.create = async (req, res) => {
  try {
    const { email, contrasena, tipo_usuario } = req.body;

    if (!email || !contrasena || !tipo_usuario) {
      return res.status(400).json({
        message: 'Email, contraseña y tipo de usuario son requeridos'
      });
    }

    const usuario = await db.Usuario.create({
      email,
      contrasena,
      tipo_usuario,
      estado: 'activo'
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

// Obtener todos los usuarios
exports.findAll = async (req, res) => {
  try {
    const usuarios = await db.Usuario.findAll({
      attributes: ['id_usuario', 'email', 'tipo_usuario', 'estado', 'createdAt']
    });

    res.status(200).json({
      message: 'Usuarios obtenidos exitosamente',
      data: usuarios,
      total: usuarios.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Obtener usuario por ID
exports.findById = async (req, res) => {
  try {
    const usuario = await db.Usuario.findByPk(req.params.id, {
      include: [{ model: db.Representacion, as: 'representaciones' }]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({
      message: 'Usuario obtenido exitosamente',
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// Actualizar usuario
exports.update = async (req, res) => {
  try {
    const usuario = await db.Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await usuario.update(req.body);

    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Eliminar usuario
exports.delete = async (req, res) => {
  try {
    const usuario = await db.Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await usuario.destroy();

    res.status(200).json({
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};
