const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const db = require('../models');

// Registrar nuevo usuario
exports.register = async (req, res) => {
  try {
    const { email, contrasena, tipo_usuario } = req.body;

    // Validar datos
    if (!email || !contrasena || !tipo_usuario) {
      return res.status(400).json({
        message: 'Email, contraseña y tipo de usuario son requeridos'
      });
    }

    // Validar tipo de usuario
    const tiposValidos = ['solicitante', 'abogado', 'administrador'];
    if (!tiposValidos.includes(tipo_usuario)) {
      return res.status(400).json({
        message: 'Tipo de usuario inválido. Debe ser: solicitante, abogado o administrador'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await db.Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({
        message: 'El email ya está registrado'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const contrasenaEncriptada = await bcryptjs.hash(contrasena, saltRounds);

    // Crear usuario
    const usuario = await db.Usuario.create({
      email,
      contrasena: contrasenaEncriptada,
      tipo_usuario,
      estado: 'activo'
    });

    // Generar token JWT
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario
      },
      process.env.JWT_SECRET || 'change_this_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      data: {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    // Validar datos
    if (!email || !contrasena) {
      return res.status(400).json({
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const usuario = await db.Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const contrasenaValida = await bcryptjs.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario
      },
      process.env.JWT_SECRET || 'change_this_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Registrar sesión
    await db.RegistroSesion.create({
      id_usuario: usuario.id_usuario,
      tipo_acceso: 'login',
      ip_acceso: req.ip || 'desconocida',
      estado: 'activa'
    });

    res.status(200).json({
      message: 'Sesión iniciada exitosamente',
      data: {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Verificar token
exports.verifyTokenEndpoint = (req, res) => {
  try {
    res.status(200).json({
      message: 'Token válido',
      data: req.user
    });
  } catch (error) {
    res.status(403).json({
      message: 'Token inválido',
      error: error.message
    });
  }
};

// Cerrar sesión
exports.logout = async (req, res) => {
  try {
    // Actualizar registro de sesión
    await db.RegistroSesion.update(
      { estado: 'cerrada' },
      { where: { id_usuario: req.user.id_usuario, estado: 'activa' } }
    );

    res.status(200).json({
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};
