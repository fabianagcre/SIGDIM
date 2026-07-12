import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { checkPermiso } from "../../middleware/checkPermiso.js";

export const representacionesRouter = Router();

const PERMISOS_VALIDOS = [
  "VER_EXPEDIENTE",
  "SUBIR_DOCUMENTOS",
  "GESTIONAR_TRAMITE",
  "RECIBIR_NOTIFICACIONES",
];

const crearSchema = z.object({
  abogadoId: z.string().uuid(),
  permisos: z.array(z.enum(PERMISOS_VALIDOS)).min(1),
});

representacionesRouter.post("/", authenticate, authorize("SOLICITANTE"), async (req, res) => {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const abogado = await prisma.usuario.findUnique({ where: { id: parsed.data.abogadoId } });
  if (!abogado || abogado.rol !== "ABOGADO" || !abogado.activo) {
    return res.status(404).json({ message: "Abogado no encontrado" });
  }

  const existente = await prisma.representacion.findFirst({
    where: { solicitanteId: req.user.id, estado: "ACTIVA" },
  });
  if (existente) {
    return res
      .status(409)
      .json({ message: "Ya existe una representación activa. Revócala antes de asignar otro abogado." });
  }

  const representacion = await prisma.representacion.create({
    data: { solicitanteId: req.user.id, abogadoId: abogado.id, permisos: parsed.data.permisos },
    include: { abogado: { select: { id: true, nombre: true, email: true, licencia: true } } },
  });
  res.status(201).json(representacion);
});

representacionesRouter.get("/mia", authenticate, authorize("SOLICITANTE"), async (req, res) => {
  const representacion = await prisma.representacion.findFirst({
    where: { solicitanteId: req.user.id, estado: "ACTIVA" },
    include: { abogado: { select: { id: true, nombre: true, email: true, licencia: true } } },
  });
  res.json(representacion);
});

representacionesRouter.get("/asignadas", authenticate, authorize("ABOGADO"), async (req, res) => {
  const representaciones = await prisma.representacion.findMany({
    where: { abogadoId: req.user.id, estado: "ACTIVA" },
    include: { solicitante: { select: { id: true, nombre: true, email: true, pasaporte: true } } },
  });
  res.json(representaciones);
});

representacionesRouter.get(
  "/:representacionId/expediente-resumen",
  authenticate,
  checkPermiso("VER_EXPEDIENTE"),
  async (req, res) => {
    const solicitante = await prisma.usuario.findUnique({
      where: { id: req.representacion.solicitanteId },
      select: { id: true, nombre: true, email: true, pasaporte: true },
    });
    res.json({ solicitante, permisos: req.representacion.permisos });
  },
);

representacionesRouter.patch(
  "/:representacionId/revocar",
  authenticate,
  authorize("SOLICITANTE"),
  async (req, res) => {
    const representacion = await prisma.representacion.findUnique({
      where: { id: req.params.representacionId },
    });
    if (!representacion || representacion.solicitanteId !== req.user.id) {
      return res.status(404).json({ message: "Representación no encontrada" });
    }
    if (representacion.estado !== "ACTIVA") {
      return res.status(409).json({ message: "La representación ya no está activa" });
    }

    const actualizada = await prisma.representacion.update({
      where: { id: representacion.id },
      data: { estado: "REVOCADA", revokedAt: new Date() },
    });
    res.json(actualizada);
  },
);
