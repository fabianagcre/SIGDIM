import "dotenv/config";

const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Variables requeridas: ${missing.join(", ")}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
};
