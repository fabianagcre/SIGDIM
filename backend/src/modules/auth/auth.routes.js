import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from "../../utils/jwt.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo || !(await bcrypt.compare(password, usuario.passwordHash))) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const accessToken = signAccessToken(usuario);
  const refreshToken = signRefreshToken(usuario);
  const { exp } = verifyRefreshToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      usuarioId: usuario.id,
      expiresAt: new Date(exp * 1000),
    },
  });

  res.json({
    accessToken,
    refreshToken,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  });
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

authRouter.post("/refresh", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos" });
  const { refreshToken } = parsed.data;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ message: "Refresh token inválido o expirado" });
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return res.status(401).json({ message: "Refresh token inválido o expirado" });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ message: "Usuario no encontrado" });
  }

  const newRefreshToken = signRefreshToken(usuario);
  const { exp } = verifyRefreshToken(newRefreshToken);

  await prisma.$transaction([
    prisma.refreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(newRefreshToken),
        usuarioId: usuario.id,
        expiresAt: new Date(exp * 1000),
      },
    }),
  ]);

  res.json({ accessToken: signAccessToken(usuario), refreshToken: newRefreshToken });
});

authRouter.post("/logout", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos" });

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(parsed.data.refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
  res.status(204).send();
});

authRouter.get("/me", authenticate, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });
  if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json(usuario);
});
