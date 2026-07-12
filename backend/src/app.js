import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { representacionesRouter } from "./modules/representaciones/representaciones.routes.js";
import { usuariosRouter } from "./modules/usuarios/usuarios.routes.js";

export const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "sigdim-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/representaciones", representacionesRouter);
app.use("/api/usuarios", usuariosRouter);

app.use((_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Error interno del servidor" });
});
