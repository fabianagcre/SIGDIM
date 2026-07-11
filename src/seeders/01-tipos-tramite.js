const db = require('../models');

const tiposTramite = [
  {
    codigo: 'VT',
    nombre: 'Visa de Turismo',
    descripcion: 'Trámite para obtener visa de turismo, válida para viajes de corta duración',
    docsRequeridos: ['Pasaporte', 'Solicitud', 'Fotografías'],
    tiempoEstDias: 5,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'VR',
    nombre: 'Visa de Residencia',
    descripcion: 'Trámite para obtener visa de residencia permanente en el país',
    docsRequeridos: ['Pasaporte', 'Solicitud', 'Fotografías', 'Certificado médico'],
    tiempoEstDias: 15,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'VN',
    nombre: 'Visa de Negocios',
    descripcion: 'Trámite para obtener visa de negocios para actividades comerciales',
    docsRequeridos: ['Pasaporte', 'Solicitud', 'Carta empresarial'],
    tiempoEstDias: 7,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'VTB',
    nombre: 'Visa de Trabajo',
    descripcion: 'Trámite para obtener visa de trabajo en empleador patrocinador',
    docsRequeridos: ['Pasaporte', 'Solicitud', 'Contrato laboral', 'Certificado médico'],
    tiempoEstDias: 10,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'VE',
    nombre: 'Visa de Estudiante',
    descripcion: 'Trámite para obtener visa de estudiante en instituciones educativas',
    docsRequeridos: ['Pasaporte', 'Solicitud', 'Carta de admisión', 'Certificado médico'],
    tiempoEstDias: 8,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'PR',
    nombre: 'Prórroga de Visa',
    descripcion: 'Trámite para extender la vigencia de una visa existente',
    docsRequeridos: ['Pasaporte', 'Solicitud'],
    tiempoEstDias: 3,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'CC',
    nombre: 'Cambio de Condición Migratoria',
    descripcion: 'Trámite para cambiar de una categoría migratoria a otra',
    docsRequeridos: ['Pasaporte', 'Solicitud', 'Documentación específica'],
    tiempoEstDias: 20,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'RI',
    nombre: 'Residencia por Inversión',
    descripcion: 'Trámite para obtener residencia mediante inversión en el país',
    docsRequeridos: ['Pasaporte', 'Solicitud', 'Comprobante de inversión', 'Certificado médico'],
    tiempoEstDias: 30,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'NAT',
    nombre: 'Naturalización',
    descripcion: 'Trámite para obtener nacionalidad del país',
    docsRequeridos: ['Pasaporte', 'Solicitud', 'Certificados diversos'],
    tiempoEstDias: 60,
    baseLegal: 'Decreto Ley 3/2008'
  },
  {
    codigo: 'REP',
    nombre: 'Repatriación',
    descripcion: 'Trámite para retorno de ciudadano al país de origen',
    docsRequeridos: ['Pasaporte', 'Solicitud'],
    tiempoEstDias: 5,
    baseLegal: 'Decreto Ley 3/2008'
  }
];

const seedTiposTramite = async () => {
  try {
    console.log('🌱 Inicializando seeders de tipos de trámite...\n');

    // Verificar si ya existen
    const existentes = await db.TipoTramite.count();
    if (existentes > 0) {
      console.log(`⚠️  Ya existen ${existentes} tipos de trámite en la base de datos. No se crearán duplicados.\n`);
      return;
    }

    // Crear tipos de trámite
    await db.TipoTramite.bulkCreate(tiposTramite);

    console.log(`✅ ${tiposTramite.length} tipos de trámite creados exitosamente:\n`);
    tiposTramite.forEach((tipo, index) => {
      console.log(`   ${index + 1}. ${tipo.codigo} - ${tipo.nombre}`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error al crear tipos de trámite:', error.message);
    throw error;
  }
};

module.exports = seedTiposTramite;
