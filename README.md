# SIGDIM — Modelo de datos y migraciones (Fase 1)

Este es el **primer entregable**: modelo de datos (Sequelize) + migraciones,
combinando:

- **PRD_SIGDIM.md / PRD_TECNICO_SIGDIM.md**: representación legal
  Solicitante↔Abogado (`Representacion`), catálogos de trámite y visa,
  auditoría general.
- **SIGDLE.docx**: flujo detallado de trámite migratorio (`Solicitud` →
  `Expediente` → `Documento`), motor de riesgo, historial de estados
  inmutable, sesiones y preferencias de notificación.

## Cómo se combinaron ambos documentos

```
Usuario (solicitante | abogado | administrador)
  │
  └── Representacion  (vínculo legal, puede REVOCARSE)
        │  ├─ TipoTramite (catálogo)
        │  └─ TipoVisa    (catálogo)
        │
        └── Solicitud  (SOL-YYYY-NNN, estados de proceso)
              │
              └── Expediente  (EXP-YYYY-MM-N, 1:1, motor de riesgo)
                    │
                    ├── Documento        (hash SHA-256)
                    └── EstadoTramite    (log inmutable, solo INSERT)

Auditoria            (log general de acciones críticas, solo INSERT)
RegistroSesion        (historial de accesos)
ConfigNotificacion    (preferencias por usuario)
```

Un `Abogado` gestiona una o varias `Representacion`; cada `Representacion`
puede generar varias `Solicitud` a lo largo del tiempo (ej. renovaciones).
La revocación ocurre a nivel de `Representacion` (PRD.md); el seguimiento
detallado del trámite (estados, riesgo, documentos) ocurre a nivel de
`Solicitud`/`Expediente` (SIGDLE.docx).

Las tablas `estados_tramite` y `auditoria` llevan un **trigger de
PostgreSQL** que bloquea `UPDATE`/`DELETE` a nivel de base de datos, para
cumplir el requisito de inmutabilidad legal (Ley 38/2000, Decreto Ley
3/2008) incluso si alguien se salta la capa de aplicación.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Instalación

```bash
npm install
cp .env.example .env   # ajusta credenciales de tu PostgreSQL local
```

## Ejecutar migraciones

```bash
npx sequelize-cli db:create      # crea la base de datos (dev)
npx sequelize-cli db:migrate     # aplica las 11 migraciones en orden
```

Para revertir:

```bash
npx sequelize-cli db:migrate:undo         # revierte la última
npx sequelize-cli db:migrate:undo:all     # revierte todas
```

## Estructura

```
src/
  config/config.js       # config de conexión (lee .env)
  models/                # 11 modelos Sequelize con asociaciones
  migrations/             # 11 migraciones en orden de dependencia FK
```

## Validado en este entorno

- Todos los modelos cargan y sus asociaciones se resuelven sin errores
  (`node -e "require('./src/models')"`).
- Las 11 migraciones se probaron en seco contra un `queryInterface`
  simulado — no se pudo levantar un PostgreSQL real en este sandbox
  (sin acceso a los repos de Ubuntu para el paquete), así que **antes de
  usarlo en tu máquina corre `npx sequelize-cli db:migrate` contra tu
  Postgres local** para confirmar que aplica limpio.

## Siguiente paso sugerido (Fase 2, día 2)

- Seeders para `TipoTramite` y `TipoVisa` con el catálogo real del
  Decreto Ley 3/2008.
- Capa de autenticación (JWT + bcrypt) sobre el modelo `Usuario`.
- Servicio `AuditoriaService` y `SessionService` que escriban en
  `estados_tramite` / `auditoria` / `registro_sesiones`.

Dime cuándo quieres seguir con esto y avanzamos día a día como con Savey.
