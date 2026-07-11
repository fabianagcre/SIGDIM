const db = require('../models');
const bcryptjs = require('bcryptjs');

const usuariosAdmin = [
  {
    email: 'admin@sigdim.gov.do',
    pwdHash: 'AdminPassword123!',
    rol: 'administrador',
    estado: 'activo',
    nombreCompleto: 'Administrador SIGDIM'
  },
  {
    email: 'abogado@sigdim.gov.do',
    pwdHash: 'AbogadoPassword123!',
    rol: 'abogado',
    estado: 'activo',
    nombreCompleto: 'Abogado SIGDIM'
  },
  {
    email: 'usuario@sigdim.gov.do',
    pwdHash: 'UsuarioPassword123!',
    rol: 'solicitante',
    estado: 'activo',
    nombreCompleto: 'Usuario SIGDIM'
  }
];

const seedUsuariosIniciales = async () => {
  try {
    console.log('🌱 Inicializando seeders de usuarios...\n');

    // Verificar si ya existen
    const existentes = await db.Usuario.count();
    if (existentes > 0) {
      console.log(`⚠️  Ya existen ${existentes} usuarios en la base de datos. No se crearán duplicados.\n`);
      return;
    }

    // Encriptar contraseñas y crear usuarios
    const usuariosProcessados = [];
    for (const usuario of usuariosAdmin) {
      const saltRounds = 10;
      const pwdHashEncriptada = await bcryptjs.hash(usuario.pwdHash, saltRounds);
      usuariosProcessados.push({
        ...usuario,
        pwdHash: pwdHashEncriptada
      });
    }

    await db.Usuario.bulkCreate(usuariosProcessados);

    console.log(`✅ ${usuariosAdmin.length} usuarios iniciales creados exitosamente:\n`);
    usuariosAdmin.forEach((usuario, index) => {
      console.log(`   ${index + 1}. ${usuario.email} (${usuario.rol})`);
    });
    console.log(`\n   ⚠️  NOTA: Guarda estas credenciales en un lugar seguro:\n`);
    usuariosAdmin.forEach((usuario) => {
      console.log(`   - ${usuario.email}: ${usuario.pwdHash}`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error al crear usuarios:', error.message);
    throw error;
  }
};

module.exports = seedUsuariosIniciales;
