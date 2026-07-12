# SIGDIM — Sistema Integrado de Gestión de Debida Diligencia Migratoria

**Proyecto Académico - Ingeniería de Software IV - UTP**
**Semestre I, 2026**

---

## 📋 Descripción

SIGDIM es un sistema para la gestión de trámites y expedientes migratorios, con paneles diferenciados para **abogados** (gestión de expedientes y clientes) y **solicitantes** (seguimiento de sus propios trámites).

```
src/       Interfaz React para abogados y solicitantes
backend/   API Express + Prisma + PostgreSQL
QA/        Suite de pruebas end-to-end (Playwright)
docs/      Documentación de entregas y evidencias de calidad
guidelines/ Lineamientos de diseño de la interfaz
```

---

## 📌 Estado actual del proyecto

### ✅ Interfaz web (`src/`)
- React 18 + Vite + TypeScript, Tailwind v4 y componentes Radix/shadcn.
- Prototipo funcional con **datos de prueba (mock)**, aún sin conectar a la API del backend.
- Dos roles con sus propias pantallas:
  - **Abogado**: Dashboard, Expedientes (con modal de detalle y exportación a PDF vía jsPDF), Clientes, Configuración.
  - **Solicitante**: Inicio, Mis Trámites, Solicitar Trámite, Oficinas SNM, Centro de Ayuda.

### ✅ Backend (`backend/`)
- Express 5 + Prisma + PostgreSQL (ESM).
- Modelo de datos completo definido en `prisma/schema.prisma`, con la migración inicial ya aplicada: `Usuario`, `TipoTramite`, `Expediente`, `Documento`, `HistorialEstado`, `Auditoria`, `RefreshToken`.
- **Autenticación JWT** implementada y probada de extremo a extremo (ver detalle más abajo).
- Seed de usuarios de prueba (`backend/prisma/seed.js`, uno por rol).

### ✅ QA (`QA/`)
- Suite de pruebas end-to-end con Playwright contra la interfaz: `auth`, `navigation`, `dashboard`, `expedientes`, `expediente-modal`.

### ⏳ Pendiente / próxima entrega
- RBAC aplicado a endpoints concretos (el middleware `authorize(...roles)` ya existe, falta usarlo en rutas CRUD).
- Endpoints CRUD de expedientes, documentos y trámites.
- Conectar la interfaz a la API real (hoy consume solo datos mock; el login del frontend no llama todavía a `/api/auth/login`).
- Análisis de SonarQube: el servidor está levantado pero falta crear el proyecto y correr el scanner (detalle en [`docs/entrega-parcial2-qa-sonarqube.md`](docs/entrega-parcial2-qa-sonarqube.md)).

---

## 📦 Requisitos

- Node.js 18+
- PostgreSQL 15+
- npm

## ⚡ Instalación y ejecución

```bash
# Interfaz web
npm install
npm run dev

# Backend (en otra terminal)
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

La interfaz queda disponible en `http://localhost:5173` y la API en `http://localhost:3000`.

### Pruebas QA (Playwright)

```bash
cd QA
npm install
npx playwright install   # solo la primera vez
npm test                 # corre la suite
npm run report            # abre el reporte HTML
```

Requiere la interfaz corriendo en `http://localhost:5173` para que los specs de UI puedan navegar contra ella.

---

## 🔐 Autenticación

`POST /api/auth/login` recibe `{ email, password }` y devuelve un `accessToken` (JWT, 15 min) y un `refreshToken` (JWT, 7 días). El refresh token se guarda hasheado (SHA-256) en la tabla `RefreshToken` para poder revocarlo.

```bash
POST /api/auth/login        { "email": "...", "password": "..." } → { accessToken, refreshToken, usuario }
POST /api/auth/refresh      { "refreshToken": "..." }             → rota el refresh token, devuelve un par nuevo
POST /api/auth/logout       { "refreshToken": "..." }             → revoca el refresh token
GET  /api/auth/me           Header: Authorization: Bearer <accessToken> → datos del usuario autenticado
```

Las rutas protegidas usan el middleware `authenticate` (`backend/src/middleware/auth.js`), que agrega `req.user = { id, rol }`. `authorize(...roles)` está disponible para restringir por rol cuando se agreguen los endpoints CRUD.

**Usuarios de prueba** (creados por `npm run prisma:seed`):

| Email | Password | Rol |
|---|---|---|
| admin@sigdim.gov.pa | Admin123! | ADMINISTRADOR |
| abogado@sigdim.gov.pa | Abogado123! | ABOGADO |
| funcionario@sigdim.gov.pa | Funcionario123! | FUNCIONARIO |
| solicitante@sigdim.gov.pa | Solicitante123! | SOLICITANTE |

---

## 🗄️ Modelo de datos (Prisma)

```
Usuario (SOLICITANTE | ABOGADO | FUNCIONARIO | ADMINISTRADOR)
  ├── Expediente (como solicitante o como abogado asignado)
  ├── Auditoria
  └── RefreshToken

TipoTramite (catálogo)
  └── Expediente

Expediente (estado: BORRADOR → PENDIENTE → EN_REVISION → DOCUMENTOS_FALTANTES → EN_VALIDACION → APROBADO/RECHAZADO)
  ├── Documento
  └── HistorialEstado (log de cambios de estado)
```

---

## 📄 Licencia

UTP - Ingeniería de Software IV - 2026

**Última actualización:** Julio 2026
