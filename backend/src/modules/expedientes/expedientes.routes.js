import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { env } from "../../config/env.js";

export const expedientesRouter = Router();

const uploadDir = path.resolve(env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });

expedientesRouter.get("/:numero", authenticate, async (req, res) => {
  const expediente = await prisma.expediente.findUnique({
    where: { numero: req.params.numero },
    include: {
      documentos: { orderBy: { createdAt: "desc" } },
      historial: { orderBy: { createdAt: "desc" } },
      tipoTramite: true,
      solicitante: { select: { id: true, nombre: true, email: true, pasaporte: true } },
    },
  });
  if (!expediente) return res.status(404).json({ message: "Expediente no encontrado" });
  res.json(expediente);
});

expedientesRouter.post(
  "/:numero/documentos",
  authenticate,
  authorize("ABOGADO"),
  upload.single("file"),
  async (req, res) => {
    const expediente = await prisma.expediente.findUnique({ where: { numero: req.params.numero } });
    if (!expediente) return res.status(404).json({ message: "Expediente no encontrado" });
    if (!req.file) return res.status(400).json({ message: "Archivo requerido" });

    const documento = await prisma.documento.create({
      data: {
        expedienteId: expediente.id,
        tipo: req.body.tipo || "General",
        nombreOriginal: req.file.originalname,
        ruta: req.file.filename,
        mimeType: req.file.mimetype,
        tamano: req.file.size,
      },
    });
    res.status(201).json(documento);
  },
);

const ESTADOS_VALIDOS = [
  "BORRADOR",
  "PENDIENTE",
  "EN_REVISION",
  "DOCUMENTOS_FALTANTES",
  "EN_VALIDACION",
  "APROBADO",
  "RECHAZADO",
];

const estadoSchema = z.object({
  estado: z.enum(ESTADOS_VALIDOS),
  comentario: z.string().trim().max(500).optional(),
});

expedientesRouter.patch("/:numero/estado", authenticate, authorize("ABOGADO"), async (req, res) => {
  const parsed = estadoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const expediente = await prisma.expediente.findUnique({ where: { numero: req.params.numero } });
  if (!expediente) return res.status(404).json({ message: "Expediente no encontrado" });

  const [actualizado] = await prisma.$transaction([
    prisma.expediente.update({ where: { id: expediente.id }, data: { estado: parsed.data.estado } }),
    prisma.historialEstado.create({
      data: {
        expedienteId: expediente.id,
        estadoAnterior: expediente.estado,
        estadoNuevo: parsed.data.estado,
        comentario: parsed.data.comentario,
      },
    }),
  ]);
  res.json(actualizado);
});
