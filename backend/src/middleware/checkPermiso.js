import { prisma } from "../lib/prisma.js";

/**
 * Middleware reutilizable que verifica, en secuencia, que el abogado
 * autenticado tenga un permiso concreto sobre una Representación:
 *   1. Usuario autenticado (requiere que `authenticate` haya corrido antes).
 *   2. La representación indicada en la ruta (:representacionId) existe.
 *   3. El usuario autenticado es el abogado de esa representación.
 *   4. La representación está ACTIVA (no revocada).
 *   5. El permiso solicitado está en la lista de permisos otorgados.
 *
 * Cada ruta protegida reutiliza esta misma cadena pasando el permiso
 * que le corresponde, ej: checkPermiso("VER_EXPEDIENTE").
 */
export function checkPermiso(permisoRequerido) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const { representacionId } = req.params;
    if (!representacionId) {
      return res.status(400).json({ message: "representacionId requerido en la ruta" });
    }

    const representacion = await prisma.representacion.findUnique({ where: { id: representacionId } });
    if (!representacion) {
      return res.status(404).json({ message: "Representación no encontrada" });
    }

    if (representacion.abogadoId !== req.user.id) {
      return res.status(403).json({ message: "No autorizado sobre esta representación" });
    }

    if (representacion.estado !== "ACTIVA") {
      return res.status(403).json({ message: "La representación no está activa" });
    }

    if (!representacion.permisos.includes(permisoRequerido)) {
      return res.status(403).json({ message: `Permiso '${permisoRequerido}' no otorgado` });
    }

    req.representacion = representacion;
    next();
  };
}
