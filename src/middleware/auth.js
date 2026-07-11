const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
};

// Middleware para verificar que el usuario es administrador
const verifyAdmin = (req, res, next) => {
  try {
    if (req.user.tipo_usuario !== 'administrador') {
      return res.status(403).json({
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

module.exports = { verifyToken, verifyAdmin };
