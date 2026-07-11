# Backend SIGDIM

API REST de SIGDIM construida con Node.js, Express, PostgreSQL y Prisma.

## Inicio local

1. Crea una base de datos PostgreSQL llamada `sigdim`.
2. Copia `.env.example` como `.env` y define secretos JWT seguros.
3. Ejecuta `npm install`.
4. Ejecuta `npm run prisma:generate` y `npm run prisma:migrate`.
5. Inicia la API con `npm run dev`.

La comprobación de servicio está disponible en `GET /api/health`.

## Próximo contenido del backend

La siguiente entrega incorpora autenticación con tokens de acceso y refresco, RBAC, usuarios de prueba y auditoría.
