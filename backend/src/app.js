import cors from "cors";
import express from "express";
import { env } from "./config/env.js";

export const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "sigdim-api" });
});

app.use((_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Error interno del servidor" });
});
