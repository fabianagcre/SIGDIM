const seedTiposTramite = require('./01-tipos-tramite');
const seedTiposVisa = require('./02-tipos-visa');
const seedUsuariosIniciales = require('./03-usuarios-iniciales');

const runAllSeeders = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🌱 EJECUTANDO SEEDERS DE CATÁLOGOS Y DATOS INICIALES');
    console.log('='.repeat(60) + '\n');

    await seedTiposTramite();
    await seedTiposVisa();
    await seedUsuariosIniciales();

    console.log('='.repeat(60));
    console.log('✅ Todos los seeders se ejecutaron correctamente');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error al ejecutar seeders:', error.message);
    throw error;
  }
};

module.exports = runAllSeeders;
