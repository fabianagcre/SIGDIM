import { verifyAccessToken } from "../utils/jwt.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token no proporcionado" });

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, rol: payload.rol };
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
}

export function authorize(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    next();
  };
}
