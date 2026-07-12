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
- Único endpoint activo por ahora: `GET /api/health`.
- Modelo de datos completo definido en `prisma/schema.prisma`, con la migración inicial ya aplicada: `Usuario`, `TipoTramite`, `Expediente`, `Documento`, `HistorialEstado`, `Auditoria`, `RefreshToken`.
- Dependencias ya instaladas para la próxima entrega (`bcryptjs`, `jsonwebtoken`, `zod`, `multer`, `nodemailer`) pero todavía sin rutas que las usen.

### ✅ QA (`QA/`)
- Suite de pruebas end-to-end con Playwright contra la interfaz: `auth`, `navigation`, `dashboard`, `expedientes`, `expediente-modal`.

### ⏳ Pendiente / próxima entrega
- Autenticación JWT (login/refresh) y RBAC por rol en el backend.
- Endpoints CRUD de usuarios, expedientes, documentos y trámites.
- Seed de usuarios de prueba (referenciado en `backend/package.json` como `prisma:seed`, falta crear `prisma/seed.js`).
- Conectar la interfaz a la API real (hoy consume solo datos mock).
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
npm run dev
```

La interfaz queda disponible en `http://localhost:5173` y la API en `http://localhost:3000` (por ahora solo responde `GET /api/health`).

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
