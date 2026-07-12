import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const USUARIOS = [
  { nombre: "Admin SIGDIM", email: "admin@sigdim.gov.pa", password: "Admin123!", rol: "ADMINISTRADOR" },
  { nombre: "Ana Ábrego", email: "abogado@sigdim.gov.pa", password: "Abogado123!", rol: "ABOGADO", licencia: "LIC-4521" },
  { nombre: "Carlos Ruiz", email: "cruiz@sigdim.gov.pa", password: "Abogado123!", rol: "ABOGADO", licencia: "LIC-7788" },
  { nombre: "Funcionario SNM", email: "funcionario@sigdim.gov.pa", password: "Funcionario123!", rol: "FUNCIONARIO" },
  { nombre: "Solicitante Demo", email: "solicitante@sigdim.gov.pa", password: "Solicitante123!", rol: "SOLICITANTE", pasaporte: "AB123456" },
];

// Estado usado por el prototipo de UI (src/app/App.tsx, EXPEDIENTES) -> enum Prisma
const ESTADO_MOCK_A_PRISMA = {
  activo: "EN_VALIDACION",
  pendiente: "PENDIENTE",
  aprobado: "APROBADO",
  rechazado: "RECHAZADO",
  revision: "EN_REVISION",
  borrador: "BORRADOR",
  doc_faltantes: "DOCUMENTOS_FALTANTES",
};

// Espejo de los 8 expedientes mock del frontend (EXPEDIENTES en App.tsx),
// para que "Subir documento" / "Actualizar estado" tengan un Expediente real
// (mismo `numero`) contra el cual persistir en Postgres.
const EXPEDIENTES_DEMO = [
  { numero: "EXP-2024-0451", cliente: "María González Herrera", pasaporte: "PA1847293", tipo: "Residencia Permanente", estado: "activo", fecha: "2024-01-15", vencimiento: "2024-07-15", prioridad: "ALTA" },
  { numero: "EXP-2024-0389", cliente: "Carlos Martínez Lima", pasaporte: "PE0934821", tipo: "Visa de Trabajo", estado: "pendiente", fecha: "2024-01-10", vencimiento: "2024-04-10", prioridad: "ALTA" },
  { numero: "EXP-2024-0312", cliente: "Ana Rodríguez Pinto", pasaporte: "PA2841937", tipo: "Naturalización", estado: "revision", fecha: "2023-11-20", vencimiento: "2024-05-20", prioridad: "MEDIA" },
  { numero: "EXP-2024-0288", cliente: "Roberto Chen Wei", pasaporte: "E57238419", tipo: "Visa de Inversionista", estado: "aprobado", fecha: "2023-10-05", vencimiento: "2026-10-05", prioridad: "BAJA" },
  { numero: "EXP-2024-0271", cliente: "Lucía Fernández Castro", pasaporte: "PA3928471", tipo: "Residencia Provisional", estado: "rechazado", fecha: "2023-09-14", vencimiento: "2024-03-14", prioridad: "ALTA" },
  { numero: "EXP-2024-0445", cliente: "James William Scott", pasaporte: "C74819234", tipo: "Permiso de Trabajo", estado: "activo", fecha: "2024-01-18", vencimiento: "2025-01-18", prioridad: "MEDIA" },
  { numero: "EXP-2024-0398", cliente: "Fatima Al-Hassan", pasaporte: "N28471934", tipo: "Reunificación Familiar", estado: "doc_faltantes", fecha: "2024-01-12", vencimiento: "2024-06-12", prioridad: "MEDIA" },
  { numero: "EXP-2024-0201", cliente: "Diego Vargas Méndez", pasaporte: "PA9182734", tipo: "Doble Nacionalidad", estado: "aprobado", fecha: "2023-08-22", vencimiento: "2033-08-22", prioridad: "BAJA" },
];

function emailDemo(nombre) {
  return nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, ".").replace(/(^\.|\.$)/g, "") + "@demo.sigdim.gov.pa";
}

async function main() {
  for (const usuario of USUARIOS) {
    const passwordHash = await bcrypt.hash(usuario.password, 10);
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {
        nombre: usuario.nombre,
        passwordHash,
        rol: usuario.rol,
        pasaporte: usuario.pasaporte,
        licencia: usuario.licencia,
      },
      create: {
        nombre: usuario.nombre,
        email: usuario.email,
        passwordHash,
        rol: usuario.rol,
        pasaporte: usuario.pasaporte,
        licencia: usuario.licencia,
      },
    });
    console.log(`Usuario listo: ${usuario.email} / ${usuario.password}`);
  }

  const abogado = await prisma.usuario.findUniqueOrThrow({ where: { email: "abogado@sigdim.gov.pa" } });
  const demoPasswordHash = await bcrypt.hash("Solicitante123!", 10);

  for (const exp of EXPEDIENTES_DEMO) {
    const tipoTramite = await prisma.tipoTramite.upsert({
      where: { nombre: exp.tipo },
      update: {},
      create: { nombre: exp.tipo },
    });

    const solicitante = await prisma.usuario.upsert({
      where: { pasaporte: exp.pasaporte },
      update: { nombre: exp.cliente },
      create: {
        nombre: exp.cliente,
        email: emailDemo(exp.cliente),
        passwordHash: demoPasswordHash,
        rol: "SOLICITANTE",
        pasaporte: exp.pasaporte,
      },
    });

    await prisma.expediente.upsert({
      where: { numero: exp.numero },
      update: { estado: ESTADO_MOCK_A_PRISMA[exp.estado] },
      create: {
        numero: exp.numero,
        solicitanteId: solicitante.id,
        abogadoId: abogado.id,
        tipoTramiteId: tipoTramite.id,
        estado: ESTADO_MOCK_A_PRISMA[exp.estado],
        prioridad: exp.prioridad,
        fechaApertura: new Date(exp.fecha),
        fechaVencimiento: new Date(exp.vencimiento),
      },
    });
    console.log(`Expediente listo: ${exp.numero} (${exp.cliente})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
