import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const USUARIOS = [
  { nombre: "Admin SIGDIM", email: "admin@sigdim.gov.pa", password: "Admin123!", rol: "ADMINISTRADOR" },
  { nombre: "Ana Ábrego", email: "abogado@sigdim.gov.pa", password: "Abogado123!", rol: "ABOGADO" },
  { nombre: "Funcionario SNM", email: "funcionario@sigdim.gov.pa", password: "Funcionario123!", rol: "FUNCIONARIO" },
  { nombre: "Solicitante Demo", email: "solicitante@sigdim.gov.pa", password: "Solicitante123!", rol: "SOLICITANTE", pasaporte: "AB123456" },
];

async function main() {
  for (const usuario of USUARIOS) {
    const passwordHash = await bcrypt.hash(usuario.password, 10);
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {},
      create: {
        nombre: usuario.nombre,
        email: usuario.email,
        passwordHash,
        rol: usuario.rol,
        pasaporte: usuario.pasaporte,
      },
    });
    console.log(`Usuario listo: ${usuario.email} / ${usuario.password}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
