const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar configuración
const config = require('./src/config/config');

// Importar modelos
const db = require('./src/models');

// Importar seeders
const runAllSeeders = require('./src/seeders');

// Importar middleware
const { verifyToken, verifyAdmin } = require('./src/middleware/auth');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const usuariosRoutes = require('./src/routes/usuarios');
const solicitudesRoutes = require('./src/routes/solicitudes');
const representacionesRoutes = require('./src/routes/representaciones');
const tiposTramiteRoutes = require('./src/routes/tipos-tramite');
const expedientesRoutes = require('./src/routes/expedientes');

// Crear instancia de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', verifyToken, usuariosRoutes);
app.use('/api/solicitudes', verifyToken, solicitudesRoutes);
app.use('/api/representaciones', verifyToken, representacionesRoutes);
app.use('/api/tipos-tramite', verifyToken, tiposTramiteRoutes);
app.use('/api/expedientes', verifyToken, expedientesRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API SIGDIM funcionando' });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'SIGDIM API REST',
    version: '1.0.0',
    authentication: 'JWT (Bearer Token)',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout (requiere token)',
        verify: 'GET /api/auth/verify (requiere token)'
      },
      usuarios: 'GET /api/usuarios, POST /api/usuarios',
      solicitudes: 'GET /api/solicitudes, POST /api/solicitudes',
      representaciones: 'GET /api/representaciones',
      tiposTramite: 'GET /api/tipos-tramite',
      expedientes: 'GET /api/expedientes',
      health: 'GET /api/health'
    }
  });
});

// Función principal
async function main() {
  try {
    console.log('\n🚀 Iniciando SIGDIM API REST con Autenticación JWT...\n');

    // Conectar a la base de datos
    console.log('📡 Conectando a la base de datos SQLite...');
    await db.sequelize.authenticate();
    console.log('✅ Conexión exitosa a SQLite\n');

    // Sincronizar base de datos
    console.log('🔄 Sincronizando base de datos...');
    await db.sequelize.sync({ alter: false });
    console.log('✅ Base de datos sincronizada\n');

    // Ejecutar seeders
    await runAllSeeders();

    // Mostrar estado del sistema
    console.log('📊 Estado del Sistema SIGDIM:\n');
    console.log('   ✓ Modelos cargados:');
    Object.keys(db).forEach(modelName => {
      if (modelName !== 'sequelize' && modelName !== 'Sequelize') {
        console.log(`     - ${modelName}`);
      }
    });

    console.log('\n   ✓ Base de datos: SQLite');
    console.log(`   ✓ Ubicación: ${config.development.storage}`);
    console.log(`   ✓ Puerto: ${PORT}`);
    console.log(`   ✓ Autenticación: JWT\n`);

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('🎉 ¡API SIGDIM ejecutándose!\n');
      console.log(`📍 Accede a: http://localhost:${PORT}\n`);
      console.log('🔐 Autenticación JWT:\n');
      console.log('   1. POST http://localhost:3000/api/auth/register');
      console.log('      {\n        "email": "usuario@ejemplo.com",');
      console.log('        "contrasena": "password123",');
      console.log('        "tipo_usuario": "solicitante"\n      }\n');
      console.log('   2. POST http://localhost:3000/api/auth/login');
      console.log('      {\n        "email": "usuario@ejemplo.com",');
      console.log('        "contrasena": "password123"\n      }\n');
      console.log('   3. Usa el token en las demás rutas:');
      console.log('      Authorization: Bearer <token>\n');
      console.log('📚 Endpoints disponibles:');
      console.log(`   POST   http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
      console.log(`   POST   http://localhost:${PORT}/api/auth/logout (protegido)`);
      console.log(`   GET    http://localhost:${PORT}/api/auth/verify (protegido)`);
      console.log(`   GET    http://localhost:${PORT}/api/usuarios (protegido)`);
      console.log(`   POST   http://localhost:${PORT}/api/usuarios (protegido)`);
      console.log(`   GET    http://localhost:${PORT}/api/solicitudes (protegido)`);
      console.log(`   POST   http://localhost:${PORT}/api/solicitudes (protegido)`);
      console.log(`   GET    http://localhost:${PORT}/api/representaciones (protegido)`);
      console.log(`   GET    http://localhost:${PORT}/api/tipos-tramite (protegido)`);
      console.log(`   GET    http://localhost:${PORT}/api/expedientes (protegido)`);
      console.log(`   GET    http://localhost:${PORT}/api/health\n`);
      console.log('Presiona Ctrl+C para detener el servidor.\n');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el sistema:', error.message);
    process.exit(1);
  }
}

// Ejecutar la aplicación
main();
