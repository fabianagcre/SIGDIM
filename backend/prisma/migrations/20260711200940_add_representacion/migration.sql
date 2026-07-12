-- CreateEnum
CREATE TYPE "PermisoRepresentacion" AS ENUM ('VER_EXPEDIENTE', 'SUBIR_DOCUMENTOS', 'GESTIONAR_TRAMITE', 'RECIBIR_NOTIFICACIONES');

-- CreateEnum
CREATE TYPE "EstadoRepresentacion" AS ENUM ('ACTIVA', 'REVOCADA');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "licencia" TEXT;

-- CreateTable
CREATE TABLE "Representacion" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "abogadoId" TEXT NOT NULL,
    "estado" "EstadoRepresentacion" NOT NULL DEFAULT 'ACTIVA',
    "permisos" "PermisoRepresentacion"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Representacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_licencia_key" ON "Usuario"("licencia");

-- AddForeignKey
ALTER TABLE "Representacion" ADD CONSTRAINT "Representacion_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Representacion" ADD CONSTRAINT "Representacion_abogadoId_fkey" FOREIGN KEY ("abogadoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

