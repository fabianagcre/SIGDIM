import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";

export const usuariosRouter = Router();

usuariosRouter.get("/abogados/buscar", authenticate, authorize("SOLICITANTE"), async (req, res) => {
  const licencia = String(req.query.licencia ?? "").trim();
  if (!licencia) return res.status(400).json({ message: "licencia requerida" });

  const abogado = await prisma.usuario.findFirst({
    where: { licencia, rol: "ABOGADO", activo: true },
    select: { id: true, nombre: true, email: true, licencia: true },
  });
  if (!abogado) return res.status(404).json({ message: "No se encontró un abogado con esa licencia" });

  res.json(abogado);
});
