const db = require('../models');

const tiposVisa = [
  {
    codigo: 'TV',
    nombre: 'Turismo',
    descripcion: 'Visa para viajes de turismo y corta duración',
    duracionMaxDias: 30,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'TE',
    nombre: 'Tránsito Estudiante',
    descripcion: 'Visa de tránsito para estudiantes en movimiento',
    duracionMaxDias: 15,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'RES',
    nombre: 'Residencia',
    descripcion: 'Visa de residencia permanente',
    duracionMaxDias: 365,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'NEG',
    nombre: 'Negocios',
    descripcion: 'Visa para actividades comerciales y negocios',
    duracionMaxDias: 90,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'TRB',
    nombre: 'Trabajo',
    descripcion: 'Visa de trabajo bajo patrocinio de empleador',
    duracionMaxDias: 365,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'EST',
    nombre: 'Estudiante',
    descripcion: 'Visa para estudiantes en instituciones educativas',
    duracionMaxDias: 365,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'FAM',
    nombre: 'Reunificación Familiar',
    descripcion: 'Visa para reunión de familiares de residentes',
    duracionMaxDias: 365,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'INV',
    nombre: 'Inversionista',
    descripcion: 'Visa para inversionistas en el territorio nacional',
    duracionMaxDias: 365,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'RET',
    nombre: 'Retirado',
    descripcion: 'Visa para personas jubiladas o retiradas',
    duracionMaxDias: 365,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'HUM',
    nombre: 'Humanitaria',
    descripcion: 'Visa por razones humanitarias y protección',
    duracionMaxDias: 365,
    baseLegal: 'Decreto Ley 3/2008'
  }
];

const seedTiposVisa = async () => {
  try {
    console.log('🌱 Inicializando seeders de tipos de visa...\n');

    // Verificar si ya existen
    const existentes = await db.TipoVisa.count();
    if (existentes > 0) {
      console.log(`⚠️  Ya existen ${existentes} tipos de visa en la base de datos. No se crearán duplicados.\n`);
      return;
    }

    // Crear tipos de visa
    await db.TipoVisa.bulkCreate(tiposVisa);

    console.log(`✅ ${tiposVisa.length} tipos de visa creados exitosamente:\n`);
    tiposVisa.forEach((visa, index) => {
      console.log(`   ${index + 1}. ${visa.codigo} - ${visa.nombre} (${visa.duracionMaxDias} días)`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error al crear tipos de visa:', error.message);
    throw error;
  }
};

module.exports = seedTiposVisa;
